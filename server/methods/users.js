import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';

import { Opinions } from '../../imports/api/collections/opinions';
import { Roles } from '../../imports/api/collections/roles';

import { hasPermission, injectUserData } from '../../imports/api/helpers/roles';
import { escapeRegExp } from '../../imports/api/helpers/basics';
import { Activities } from '../../imports/api/collections/activities';
import { UserActivities } from '../../imports/api/collections/userActivities';

const SECRET_PASSWORD = 'jhd&%/f54ff!54hDRa6 H9La3"6*~';

Meteor.methods({
    'users.getExperts'(refOpinion, searchText){
        check(refOpinion, String);
        check(searchText, String);

        let currentUser = Meteor.users.findOne(this.userId);

        // check if opinion was sharedWith the current User
        const shared = Opinions.findOne({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Das angegebene Gutachten wurde nicht mit Ihnen geteilt. Sie können keinen Gutachter auswählen.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'opinion.edit')) {
            throw new Meteor.Error('Keine Berechtigung zum Bearbeiten des Gutachtens. Sie können keinen Gutachter auswählen.');
        }
        
        const opinionOwners = Opinions.findOne({
            _id: refOpinion
        }).sharedWith.filter( item => {
            return item.role === 'OWNER';
        }).map( item => item.user.userId );

        const escapedText = escapeRegExp(searchText);

        /* Wer kann alles Gutachter sein?
            - Der Owner des Gutachtens
            - Jeder Mitarbeiter von MEBEDO -> Rolle EMPLOYEE
            - Und ggf. der Admin -> Rolle ADMIN
        */
        const users =  Meteor.users.find({
            $and: [
                { 'active': true },// nur aktive Benutzer
                {'userData.roles': { $in: ['EMPLOYEE', 'ADMIN', 'OWNER'] }},
                { 
                    $or: [
                        { 'username': { $regex : escapedText, $options:"i" } },
                        { 'userData.firstName': { $regex : escapedText, $options:"i" } },
                        { 'userData.lastName': { $regex : escapedText, $options:"i" } },
                        { _id: { $in: opinionOwners } }
                    ]
                }
            ]
        }, { fields: { 'userData.roles': 0 }, limit: 10 }).fetch().map( user => {
            const { _id, username, userData } = user;

            return { userId: _id, username, ...userData};
        });
        
        return users;
    },

    /**
     * Umstellung auf Async für Meteor Version 2.8, https://guide.meteor.com/2.8-migration
     * getExpertsAsync wird nicht verwendet, da synchroner Aufruf notwendig ist
    */
    async 'users.getExpertsAsync'(refOpinion, searchText){
        check(refOpinion, String);
        check(searchText, String);

        let currentUser = await Meteor.users.findOneAsync(this.userId);
        
        // check if opinion was sharedWith the current User
        const shared = await Opinions.findOneAsync({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Das angegebene Gutachten wurde nicht mit Ihnen geteilt. Sie können keinen Gutachter auswählen.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'opinion.edit')) {
            throw new Meteor.Error('Keine Berechtigung zum Bearbeiten des Gutachtens. Sie können keinen Gutachter auswählen.');
        }
        
        
        try {
            const op = await Opinions.findOneAsync({
                _id: refOpinion
            });
            const sharedWith = op.sharedWith;
            const opinionOwners = sharedWith.filter( item => {
                return item.role === 'OWNER';
            }).map( item => item.user.userId );

            const escapedText = escapeRegExp(searchText);
    
            /* Wer kann alles Gutachter sein?
                - Der Owner des Gutachtens
                - Jeder Mitarbeiter von MEBEDO -> Rolle EMPLOYEE
                - Und ggf. der Admin -> Rolle ADMIN
            */
            const users = Meteor.users.find({
                $and: [
                    { 'active': true },// nur aktive Benutzer
                    {'userData.roles': { $in: ['EMPLOYEE', 'ADMIN', 'OWNER'] }},
                    { 
                        $or: [
                            { 'username': { $regex : escapedText, $options:"i" } },
                            { 'userData.firstName': { $regex : escapedText, $options:"i" } },
                            { 'userData.lastName': { $regex : escapedText, $options:"i" } },
                            { _id: { $in: opinionOwners } }
                        ]
                    }
                ]
            }, { fields: { 'userData.roles': 0 }, limit: 10 }).fetch().map( user => {
                const { _id, username, userData } = user;
                return { userId: _id, username, ...userData};
            });
            
            return users;
        }
        catch ( error ) {
            console.log( error );
            return [];
        }        
    },

    /**
     * Lists all users that are currently in the system
     * 
     * @param {*} refOpinion 
     * @param {*} searchText 
     */
    'users.getAll'(refOpinion, searchText){
        check(refOpinion, String);
        check(searchText, String);

        const escapedText = escapeRegExp(searchText);

        const users =  Meteor.users.find({
            $and: [
                { 'active': true },// nur aktive Benutzer
                {
                    $or: [
                        { 'username': { $regex : escapedText, $options:"i" } },
                        { 'userData.firstName': { $regex : escapedText, $options:"i" } },
                        { 'userData.lastName': { $regex : escapedText, $options:"i" } }
                    ]
                }
            ]
        }, { fields: { 'userData.roles': 0 }, limit: 10 }).fetch().map( user => {
            const { _id, username, userData } = user;

            return { userId: _id, username, ...userData};
        });
        
        return users;
    },

    /**
     * Returns alle Roles, that could be used by the current User
     * to assign to a new User
     */
    'users.getInvitableRoles'() {
        if (!this.userId) {
            throw new Meteor.Error('Sie sind nicht angemeldet.');
        }

        let inviteableRoles = {};
        const currentUser = Meteor.users.findOne(this.userId);

        Roles.find({
            _id: { $in: currentUser.userData.roles }
        }, { fields: { _id: 1, invitableRoles: 1 } }).fetch().map( role => {
            role.invitableRoles.forEach( ir => {
                inviteableRoles[ir.roleId] = ir.displayName
            })
        });
        
        return Object.keys(inviteableRoles).map( k => {
            return { roleId: k, displayName: inviteableRoles[k] }
        });
    },

    /**
     * Returns alle Roles, that could be used by the current User
     * to assign to a new User
     * Umstellung auf Async für Meteor Version 2.8, https://guide.meteor.com/2.8-migration
     * Nein, da hier synchron notwendig.
     */
    async 'users.getInvitableRolesAsync'() {
        if (!this.userId) {
            throw new Meteor.Error('Sie sind nicht angemeldet.');
        }

        let inviteableRoles = {};
        const currentUser = await Meteor.users.findOneAsync (this.userId);

        Roles.find({
            _id: { $in: currentUser.userData.roles }
        }, { fields: { _id: 1, invitableRoles: 1 } }).fetch().map( role => {
            role.invitableRoles.forEach( ir => {
                inviteableRoles[ir.roleId] = ir.displayName
            })
        });
        
        return Object.keys(inviteableRoles).map( k => {
            return { roleId: k, displayName: inviteableRoles[k] }
        });
    },

    /**
     * Returns, if the current user has the admin role
     */
    /*'users.getcurrentUserHasAdminRole'() {
        if (!this.userId) {
            throw new Meteor.Error('Sie sind nicht angemeldet.');
        }
        let ok = false;
        const currentUser = Meteor.users.findOne(this.userId);
        currentUser.userData.roles.forEach( role => {
            if ( role === 'ADMIN' )
                ok = true;
        });
        return ok;
    },*/

    /**
     * Return all Roles, that could be used by the current User
     * to assign as explicit role to a User
     */
    'users.getExplicitInvitableRoles'(refOpinion) {
        check(refOpinion, String);

        if (!this.userId) {
            throw new Meteor.Error('Sie sind nicht angemeldet.');
        }

        let explicitInviteableRoles = {};
        const currentUser = Meteor.users.findOne(this.userId);

        // check if opinion is shared with the current user and check if
        // the user has an explicit role-assignement
        const opinion = Opinions.findOne({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!opinion) {
            throw new Meteor.Error('Das gutachten existiert nicht oder wurde nicht mit Ihnen geteilt.');
        }

        const sharedWithExplicitRole = opinion.sharedWith.find( s => s.user.userId == this.userId );
        

        let userRoles;
        // check if document was shared with explicit role?
        if (sharedWithExplicitRole.role) {
            userRoles = [sharedWithExplicitRole.role]
        } else {
            userRoles = currentUser.userData.roles;
        }
        
        Roles.find({
            _id: { $in:  userRoles }
        }, { fields: { _id: 1, 'permissions.shareWithExplicitRoleInvitables': 1 } }).fetch().map( role => {
            const roles = role.permissions.shareWithExplicitRoleInvitables;
        
            roles && roles.forEach( ir => {
                explicitInviteableRoles[ir.roleId] = `${ir.displayName} (${ir.roleId})`
            })
        });
        
        return Object.keys(explicitInviteableRoles).map( k => {
            return { roleId: k, displayName: explicitInviteableRoles[k] }
        });
    },

    /**
     * Invite a new user to the system
     * 
     * @param {Object} data Specifies the min Data for a new user
     */
    'users.inviteUser'(refOpinion, data) {
        check(refOpinion, String);
        check(data, Object);
        check(data.email, String);
        check(data.firstName, String);
        check(data.lastName, String);
        check(data.gender, String);

        if (!this.userId) {
            throw new Meteor.Error('Not Authorized.');
        }

        let currentUser = Meteor.users.findOne(this.userId);

        // always save email in lower case
        data.email = data.email.toLowerCase();

        // check if opinion was sharedWith the current User
        const shared = Opinions.findOne({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Das angegebene Gutachten wurde nicht mit Ihnen geteilt.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'shareWith')) {
            throw new Meteor.Error('Sie besitzen keine Berechtigung zum Teilen des Gutachtens mit anderen Benutzern.');
        }

        const { email, firstName, lastName } = data;

        const userId = Accounts.createUser({
            email,
            password: SECRET_PASSWORD
        });

        Meteor.users.update(userId, {
            $set: {
                userData: data,
                active: true// Benutzer aktivieren.
            }
        });

        Opinions.update(refOpinion, {
            $push: { 
                sharedWith: { 
                    user: { userId, firstName, lastName }
                }
            }
        });

        // post a new Aktivity to this opinion that a new user
        // has acces to this opinion
        const activity = injectUserData({ currentUser }, {
            refOpinion,
            refDetail: null,
            type: 'SYSTEM-POST',
            message: `hat das Gutachten mit dem Benutzer <strong>${firstName + ' ' + lastName}</strong> geteilt.`
        }, { created: true });
        
        Activities.insert(activity);

        Accounts.sendVerificationEmail(userId, email);
    },

    /**
     * Share the specified opinion with a existing user
     * 
     * @param {Object} data Specifies the min Data for a new user
     */
    'users.shareWith'(refOpinion, data) {
        if (!this.userId) {
            throw new Meteor.Error('Not Authorized.');
        }

        let currentUser = Meteor.users.findOne(this.userId);

        // check if opinion was sharedWith the current User
        const shared = Opinions.findOne({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Das angegebene Gutachten wurde nicht mit Ihnen geteilt.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'shareWith')) {
            throw new Meteor.Error('Sie besitzen keine Berechtigung zum Teilen des Gutachtens mit anderen Benutzern.');
        }
        if (data.explicitRole && !hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'shareWithExplicitRole')) {
            throw new Meteor.Error('Sie besitzen keine Berechtigung zum Teilen des Gutachtens mit anderen Benutzern unter Verwendung einer expliziten Rollenzuweisung.');
        }
        const { userId, firstName, lastName } = data.user;

        const alreadyShared = Opinions.findOne({
            _id: refOpinion,
            "sharedWith.user.userId": userId
        });
        if (alreadyShared) {
            throw new Meteor.Error('Das Gutachten wurde bereits mit dem ausgewählten Benutzer geteilt.');
        }

        const opinion = Opinions.findOne(refOpinion);

        let shW = { 
            user: { userId, firstName, lastName }
        };
        if (data.explicitRole) {
            shW.role = data.explicitRole;
        }
        Opinions.update(refOpinion, {
            $push: { 
                sharedWith: shW
            }
        });

        // post a new Aktivity to this opinion that a new user
        // has acces to this opinion
        const activity = injectUserData({ currentUser }, {
            refOpinion,
            refDetail: null,
            type: 'SYSTEM-POST',
            message: `hat das Gutachten mit dem Benutzer <strong>${firstName + ' ' + lastName}</strong> geteilt.`
        }, { created: true });
        
        Activities.insert(activity);


        UserActivities.insert(
            injectUserData({ currentUser }, {
                refUser: userId,
                type: 'SHAREDWITH',
                refs: { refOpinion },
                message: `${currentUser.userData.firstName} ${currentUser.userData.lastName} hat ${opinion.isTemplate ? 'eine Gutachtenvorlage':'ein Gutachten'} mit Ihnen geteilt.`,
                originalContent: `Gutachten / ${opinion.title} / ${opinion.opinionNo}`,
                unread: true
            }, { created: true })
        );
    },

    /**
     * Remove ShareWith the specified opinion/user
     * 
     * @param {String} refOpinion Specifies the opinion
     * @param {String} userId Specifies the user
     */
     'users.cancelShareWith'(refOpinion, userId) {
        check(refOpinion, String);
        check(userId, String);

        if (!this.userId) {
            throw new Meteor.Error('Not Authorized.');
        }

        let currentUser = Meteor.users.findOne(this.userId);

        // check if opinion was sharedWith the current User
        const shared = Opinions.findOne({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Das angegebene Gutachten wurde nicht mit Ihnen geteilt.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'cancelSharedWith')) {
            throw new Meteor.Error('Sie besitzen keine Berechtigung für das Löschen des Benutzers zu diesem Dokument.');
        }
        
        const opinionUserToRemove = Opinions.findOne({
            _id: refOpinion,
            "sharedWith.user.userId": userId
        });
        const shW = opinionUserToRemove.sharedWith.find(s => s.user.userId == userId);
        const { firstName, lastName} = shW.user;

        Opinions.update(refOpinion, {
            $pull: { 
                sharedWith: shW
            }
        });

        // post a new Aktivity to this opinion that a new user
        // has acces to this opinion
        const activity = injectUserData({ currentUser }, {
            refOpinion,
            refDetail: null,
            type: 'SYSTEM-POST',
            message: `hat den Benutzer <strong>${firstName + ' ' + lastName}</strong> für dieses Dokument entfernt.`
        }, { created: true });
        
        Activities.insert(activity);
    },

    /**
     * Returns the initial password to change at verifyEmail
     * 
     */
    'users.getInitialPassword'(){
        if (!this.userId) {
            throw new Meteor.Error('Not Authorized.');
        }

        return SECRET_PASSWORD;
    },

    /**
     * Update the current logged in users profile
     * 
     * @param {Object} data 
     */
    async 'users.updateProfile'(data) {
        if (!this.userId) {
            throw new Meteor.Error('Not Authorized.');
        }

        const oldUser = await Meteor.users.findOneAsync(this.userId);

        await Meteor.users.updateAsync(this.userId, {
            $set: { 
                userData: { ...data, roles: oldUser.userData.roles }
            }
        });

        // check if firstName or lastName changed
        if (
            oldUser.userData.firstName !== data.firstName || 
            oldUser.userData.lastName !== data.lastName
        ) {
            await Opinions.updateAsync({
                'sharedWith.user.userId': this.userId
            }, {
                $set: { 
                    'sharedWith.$.user': { userId: this.userId, firstName: data.firstName, lastName: data.lastName }
                }
            }, { multiple: true });

            await Activities.updateAsync({
                'createdBy.userId': this.userId
            }, {
                $set: { 
                    'createdBy.firstName': data.firstName,
                    'createdBy.lastName': data.lastName
                }
            }, { multiple: true });

            await Activities.updateAsync({
                'answers.createdBy.userId': this.userId
            }, {
                $set: { 
                    'answers.$.createdBy.firstName': data.firstName,
                    'answers.$.createdBy.lastName': data.lastName
                }
            }, { multiple: true });
        }

        await Opinions.updateAsync({
            'expert1.userId': this.userId
        }, {
            $set: { 
                'expert1': { userId: this.userId, ...data }
            }
        }, { multiple: true });

        await Opinions.updateAsync({
            'expert2.userId': this.userId
        }, {
            $set: { 
                'expert2': { userId: this.userId, ...data }
            }
        }, { multiple: true });

    }
});

Accounts.emailTemplates.siteName = 'MEBEDO GutachtenPlus';
Accounts.emailTemplates.from = 'MEBEDO Consulting GmbH <gutachtenplus@mebedo-ac.de>';

Accounts.emailTemplates.enrollAccount.subject = (user) => {
  return `Welcome to Awesome Town, ${user.userData.firstName}`;
};

Accounts.emailTemplates.enrollAccount.text = (user, url) => {
  return 'You have been selected to participate in building a better future!'
    + ' To activate your account, simply click the link below:\n\n'
    + url;
};

Accounts.emailTemplates.resetPassword = {
    subject() {
       return "MEBEDO GutachtenPlus - Passwort vergessen";
    },
    html(user, url) {
         const { gender, firstName, lastName} = user.userData;
         const [ host, token ] = url.split('/#/reset-password/');
 
         return `Guten Tag ${gender} ${lastName},<br>
             <p>
                 Sie haben Ihr Passwort für <strong>MEBEDO GutachtenPlus</strong> vergessen - kein Problem!
             </p>
             <p>
                 Bitte betätigen Sie den nachfolgenden Link und vergeben Sie sich einfach ein neues Passwort.
                 <br>
                 <br>
                 <a href="https://gutachten.mebedo-ac.de/reset-password/${token}" target="_blank">Neues Passwort festlegen</a>
             </p>
             <p>
                 Nach erfolgreicher Änderung Ihres Passworts werden Sie umgehend angemeldet und können direkt weiterarbeiten.
             </p>
             <p>
                 Haben Sie weiterführende Fragen oder Anregungen, so wenden Sie sich bitte direkt an:
                 <br>
                 <br>MEBEDO Consulting GmbH
                 <br><strong>Marc Tomaschoff</strong>
                 <br>Aubachstraße 22
                 <br>56410 Montabaur
                 <br>
                 <br>E-Mail: marc.tomaschoff@mebedo-ac.de
             </p>
             <p>
                 Beste Grüße
                 <br>
                 <br>
                 <br><strong>Ihre MEBEDO Consulting GmbH</strong>
             </p>
         `;
    }
 };

Accounts.emailTemplates.verifyEmail = {
   subject() {
      return "MEBEDO GutachtenPlus - Zugang aktivieren";
   },
   html(user, url) {
        const { gender, firstName, lastName} = user.userData;
        const [ host, token ] = url.split('/#/verify-email/');

        return `Guten Tag ${gender} ${lastName},<br>
            <p>
                Sie sind eingeladen im System <strong>MEBEDO GutachtenPlus</strong> mitzuwirken!
            </p>
            <p>
                Hierfür wurde ein Benutzer mit Ihrer E-Mail Adresse angelegt.
                <br>
                Wir bitten Sie um Bestätigung dieses Benutzerzugangs, in dem Sie den nachfolgenden Link anwählen.
                <br>
                Mit der Bestätigung werden Sie automatisch aufgefordert, Ihr Kennwort zu vergeben.
                <br>
                <br>
                <a href="https://gutachten.mebedo-ac.de/verify-email/${token}" target="_blank">Jetzt Zugang bestätigen</a>
            </p>
            <p>
                Nach erfolgreicher Bestätigung können Sie jederzeit die Anwendung über <a href="https://gutachten.mebedo-ac.de">gutachten.mebedo-ac.de</a> erreichen.
            </p>
            <p>
                Sollten Sie Fragen haben, so wenden Sie sich bitte direkt an:
                <br>
                <br>MEBEDO Consulting GmbH
                <br><strong>Marc Tomaschoff</strong>
                <br>Aubachstraße 22
                <br>56410 Montabaur
                <br>
                <br>E-Mail: marc.tomaschoff@mebedo-ac.de
            </p>
            <p>
                Beste Grüße
                <br>
                <br>
                <br><strong>Ihre MEBEDO Consulting GmbH</strong>
            </p>
        `;
   }
};