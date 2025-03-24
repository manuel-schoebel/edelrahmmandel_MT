import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Opinions } from '../collections/opinions';
import { OpinionDetails, OpinionDetailSchema } from '../collections/opinionDetails';
import { Activities, ActivitySchema, AnswerSchema } from '../collections/activities';

import { hasPermission, injectUserData } from '../helpers/roles';
import { UserActivities, UserActivitySchema } from '../collections/userActivities';


Meteor.methods({
    /**
     * Sets the unread-Flag of a userActivity by his id
     * 
     * @param {String} refUserActivity ID of the userActivity
     * @param {Boolean} unread true or False value to set
     */
    async 'userActivity.setUnread'(refUserActivity, unread) {
        refUserActivity = (refUserActivity && refUserActivity._str) || refUserActivity;

        check(refUserActivity, String);
        check(unread, Boolean);

        this.unblock();

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }
        
        const userActivity = await UserActivities.findOneAsync(refUserActivity);
        if (!userActivity) {
            throw new Meteor.Error('Die angegeben User-Aktivität konnte nicht gefunden werden.');
        }
        if (userActivity.refUser !== this.userId) {
            throw new Meteor.Error('Sie sind nicht berechtigt die angegeben User-Aktivität zu verändern.');
        }

        await UserActivities.updateAsync({_id: refUserActivity}, {
            $set: { unread }
        });
    },
    
});