import { Meteor } from 'meteor/meteor';
import { Email } from 'meteor/email'

import './fixtures';
import './publications';
import './methods'; 
import '../imports/api/methods';

import './datatransfer';

import './datamigration';

import { Accounts } from 'meteor/accounts-base'
import { UserActivities } from '../imports/api/collections/userActivities';

Accounts.validateLoginAttempt( async loginData => {
    const { allowed, methodName } = loginData;
    if (methodName == 'verifyEmail' || methodName == 'resetPassword') {
        return allowed;
    }

    if (methodName == 'login') {
        if (loginData.methodArguments[0].resume && allowed) return true;

        const { user } = loginData.methodArguments[0];
        if (!user)
            return false;

        // check if we got a user like "admin" that signed in without email
        if (user.username && !user.email && allowed) {
            return true;
        }
        const verifiedUser = await Meteor.users.findOneAsync({
            'emails.address': user.email,
            'emails.verified': true
        });

        // Prüfung, ob Benutzer aktiv ist!
        if ( typeof verifiedUser.active == "undefined" ) {
            // 'active' Feld existiert nicht => aktiv
        }
        else if ( verifiedUser.active ) {
            // aktiv
        }
        else {
            // NICHT aktiv
            console.log( 'Dieser Benutzer ist nicht aktiv.' );
            return false;
        }

        return !!verifiedUser;
    }

    throw new Meteor.Error('Unknown Loginattempt rejected.');
});


const sendUnreadMessages = async () => {
    // lesen aller Useractivities, die noch nicht gelesen wurden und noch nicht per E-Mail versandt sind */
    const messages = await UserActivities.find({
        unread: true,
        $or: [
            { mailsent: { $exists: false } },
            { mailsent: false }
        ]
    }).fetchAsync();

    if (messages) {
        messages.map( async (msg) => {
            const targetUser = await Meteor.users.findOneAsync(msg.refUser, { fields: { 'emails': 1, 'userData': 1 } });            
            const { emails, userData } = targetUser
                        
            // der Admin-User hat keine Mailadresse sondern einen Benutzernamen
            const { address: targetEmailAddress } = ( emails && emails[0] && emails[0].verified && emails[0] ) || { address: userData.email };
            
            const { gender, firstName, lastName } = userData;
            const toAddress = targetEmailAddress || userData.email

            const { firstName: senderFirstName, lastName: senderLastName } = msg.createdBy;
            
            let subject;
            switch (msg.type) {
                case 'MENTIONED':
                    subject = `GutachtenPlus - ${senderFirstName} ${senderLastName} hat Sie erwähnt`;
                    break;
                case 'SHAREDWITH':
                    subject = `GutachtenPlus - ${senderFirstName} ${senderLastName} hat ein Gutachten mit Ihnen geteilt`;
                    break;
                case 'REPLYTO':
                    subject = `GutachtenPlus - ${senderFirstName} ${senderLastName} hat Ihnen geantwortet`;
                    break;

                default:
                    subject = 'GutachtenPlus - Eine neue Nachricht für Sie'
            }

            try {
                await Email.sendAsync({
                    to: toAddress,
                    /*from: {
                        name: `${senderFirstName} ${senderLastName} (GutachtenPlus)`,
                        address: 'gutachtenplus@mebedo-ac.de'
                    },*/
                    from: `"${senderFirstName} ${senderLastName} (GutachtenPlus)" <gutachtenplus@mebedo-ac.de>`,
                    subject,
                    html: `
                        Hallo ${firstName} ${lastName},
                        <p>
                            nachfolgende Nachricht haben Sie innerhalb von <a href="https://gutachten.mebedo-ac.de">MEBEDO GutachtenPlus</a> erhalten:
                        </p>
                        <p>
                            <strong>${msg.message}</strong>
                        </p>
                        <p>
                            ${msg.originalContent}
                        </p>
                        <p>
                            Bitte antworten Sie nicht auf diese E-Mail. Diese Nachricht wurde automatisch erstellt.
                        </p>
                    `
                });

                await UserActivities.updateAsync( msg._id, { $set: { mailsent: true } });
            } catch( mailErr ) {
                console.log('Error', mailErr.message);
            }
        });
    }
}

Meteor.startup(() => {
    // In Meteor 3, Email.sendAsync throws if MAIL_URL is not set.
    // On staging/dev without a mail server, stub it out to prevent crashes.
    if (!process.env.MAIL_URL) {
        Email.customTransport = (options) => {
            console.log('[Email suppressed - no MAIL_URL]', options.to, '|', options.subject);
        };
    }

    Meteor.setInterval( sendUnreadMessages, 1000 * 60 * 30 /* alle 30 Minuten */);
    sendUnreadMessages();

    console.log('Running in ' + process.env.NODE_ENV + ' mode.');
});
