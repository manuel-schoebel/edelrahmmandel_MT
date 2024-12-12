import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Roles } from '../collections/roles';

/**
 * Check if Role is permitted by the given permission or not.
 * 
 * @param {String} permissionName eg "opinion.create" or "shareWith"
 * @param {*} roleObj Role-Object to check if permitted or not
 * 
 * @returns {Boolean} If the role is permitted true otherwise false
 */
const isRolePermitted = (permissionName, roleObj) => {
    let isPermitted = 0;
    // check for permission like "opinion.create"
    
    if (permissionName.indexOf('.') > 0) {
        const [k, n] = permissionName.split('.');
        isPermitted = roleObj.permissions[k][n];
    } else {
        isPermitted = roleObj.permissions[permissionName];
    }
    return isPermitted == 1;
}


/**
 * Check if the given user is permitted to a permission by Name or not
 * 
 * @param {Object} param0 { userId: String, currentUser: Object, sharedRole: String }
 *                              Defines the user in the best way
 *                              If the userObject is present just pass currentUser and we dont need to read the
 *                              data of the currentUser a second time. If not available pass userId.
 *                              If the user has a role assignment by sharing the object so pass this rolename as String
 *                              to inspect if the user is permitted or not.
 * 
 * @param {*} permissionName    Name of the permission eg "opinion.create" or "shareWith"
 * 
 * @return {Boolean} True if user is permitted otherwise false
 */
export const hasPermission = async ({ userId, currentUser, sharedRole }, permissionName) => {
    if (!currentUser) currentUser = await Meteor.users.findOneAsync(userId);

    if (!currentUser) {
        throw new Meteor.Error('hasPermission: User not found!');
    }

    // first getting the roles the user has assigned to
    let roles;
    // Bei spellcheck soll Benutzerberechtigung nicht durch Rolle überschrieben werden können!
    if ( permissionName == 'opinion.spellcheck' ) {
        if ( currentUser.userData )
            roles = currentUser.userData.roles;
    }
    else if ( sharedRole )
        roles = [sharedRole];
    if (!roles) {
        if ( currentUser.userData )
            roles = currentUser.userData.roles;
    }
    if (!roles || roles.length == 0)
        roles = ['EVERYBODY'];

    let isPermitted = 0;
    const assignedRoles = await Roles.find({ _id: { $in: roles } }).fetchAsync()
    for(const role of assignedRoles) {
        if (isRolePermitted(permissionName, role)) isPermitted++;
    }

    return isPermitted > 0;
}


export const injectUserData = async ({ userId, currentUser }, data, options) => {
    check(data, Object);
    
    if (!currentUser) currentUser = await Meteor.users.findOneAsync(userId);
    
    if (!currentUser) {
        throw new Meteor.Error('User not found!');
    }
    
    if (!options || options.created){
        data.createdAt = new Date;
        data.createdBy = {
            userId: currentUser._id,
            firstName: currentUser.userData.firstName,
            lastName: currentUser.userData.lastName
        };
    }

    if (!options || options.sharedWith) {
        data.sharedWith = [{ 
            user: {
                userId: currentUser._id,
                firstName: currentUser.userData.firstName,
                lastName: currentUser.userData.lastName
            }, 
            role: "OWNER"
        }];
    }

    return data;
}