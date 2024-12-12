import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';

// Setup Admin user if not exists
const USERNAME = 'admin';
const PASSWORD = 'password';

if (!await Accounts.findUserByUsername(USERNAME)) {
    await Accounts.createUser({
        username: USERNAME,
        password: PASSWORD,
    });

    let newUser = await Accounts.findUserByUsername(USERNAME);
     
    await Meteor.users.updateAsync( newUser._id, {
        $set: {
            userData: {
                firstName: 'IT',
                lastName: 'Administrator',
                roles: ['EVERYBODY', 'ADMIN']
            }
        }
    });
}
