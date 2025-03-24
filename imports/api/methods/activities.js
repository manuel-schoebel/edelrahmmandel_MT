import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Opinions } from '../collections/opinions';
import { OpinionDetails, OpinionDetailSchema } from '../collections/opinionDetails';
import { Activities, ActivitySchema, AnswerSchema } from '../collections/activities';

import { hasPermission, injectUserData } from '../helpers/roles';
import { UserActivities, UserActivitySchema } from '../collections/userActivities';


/**
 * 
 */
const messageWithMentions = async ({currentUser, msg, refs}) => {
    let { text, mentions } = msg;

    let message = text.replace(/\n/g, '<br>');

    // check mentions
    if (mentions) {
        Object.keys(mentions).forEach( async userId => {
            const username = mentions[userId];
            const userMentionRegExp = new RegExp('@' + username, 'g');

            if (message.indexOf('@' + username) > -1) {
                message = message.replace(userMentionRegExp, `<span class="mbac-user-mention" user-id="${userId}">${username}</span>`);

                const useractivity = await injectUserData({ currentUser }, { 
                    refUser: userId,
                    type: 'MENTIONED',
                    message: `${currentUser.userData.firstName} ${currentUser.userData.lastName} hat Sie erwähnt.`,
                    originalContent: message,
                    refs/*: {
                        refOpinion: sharedOpinion._id,
                        refOpinionDetail: detail._id,
                        refActivity: null
                    }*/,
                    unread: true
                }, { created: true });

                try {
                    UserActivitySchema.validate(useractivity);
                } catch (err) {
                    throw new Meteor.Error(err.message);
                }
                
                await UserActivities.insertAsync(useractivity);
            }
        });
    }

    return message;
}


Meteor.methods({
    /**
     * User-Like or Dislike for opinionDetail by given id
     */
    async 'activities.doSocial'(action, id) {
        this.unblock();

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        if (action !== 'like' && action !== 'dislike') {
            throw new Meteor.Error('Unknown social command.');
        }
        
        let currentUser = await Meteor.users.findOneAsync(this.userId);
        const opinionDetail = await OpinionDetails.findOneAsync(id);

        const isShared = await Opinions.findOneAsync({
            _id: opinionDetail.refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!isShared) {
            throw new Meteor.Error('Dieses Detail zum Gutachten wurde nicht mit Ihnen geteilt.');
        }

        // check if we need to push or pop the like
        const doneBefore = await OpinionDetails.findOneAsync({
            _id: id,
            [action + 's.userId']: this.userId
        });

        if (!doneBefore) {
            await OpinionDetails.updateAsync({_id: id}, {
                $push: {
                    [action + 's']: {
                        userId: this.userId,
                        firstName: currentUser.userData.firstName,
                        lastName: currentUser.userData.lastName
                    }
                }
            });
        } else {
            // unlike
            await OpinionDetails.updateAsync({_id: id}, {
                $pull: {
                    [action + 's']: {
                        userId: this.userId,
                        firstName: currentUser.userData.firstName,
                        lastName: currentUser.userData.lastName
                    }
                }
            });
        }
    },
    
    /**
     * Creates a new Activity as user post
     * 
     * @param {String} msg Message that the user posts
     */
    async 'activities.postmessage'(refOpinion, refDetail, refParentDetail, activitiesBy, msg) {
        this.unblock();

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }
        
        const currentUser = await Meteor.users.findOneAsync(this.userId);
        
        const detail = await OpinionDetails.findOneAsync(refDetail);

        // check if opinion was sharedWith the current User
        const sharedOpinion = await Opinions.findOneAsync({
            _id: (detail && detail.refOpinion) || refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!sharedOpinion) {
            throw new Meteor.Error('Dieses Gutachten wurde nicht mit Ihnen geteilt. Sie können keinen Kommentar verfassen.');
        }

        const sharedWithRole = sharedOpinion.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!await hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'opinion.canPostMessage')) {
            throw new Meteor.Error('Keine Berechtigung zum Erstellen eines Kommentars zu einem Gutachten.');
        }
        
        const detailFromActivitiesBy = await OpinionDetails.findOneAsync({
            _id: activitiesBy
        });

        const parentReference = refParentDetail || (detailFromActivitiesBy && detailFromActivitiesBy.refParentDetail) || null;

        const message = await messageWithMentions({ currentUser, msg, refs: {
            refOpinion: sharedOpinion._id,
            refOpinionDetail: (detail && detail._id) || null,
            refParentDetail: parentReference, //refParentDetail || detailFromActivitiesBy.refParentDetail,
            refActivitiesBy: activitiesBy || null,
            refActivity: null
        }});
        
        let activity = await injectUserData({ currentUser }, {
            refOpinion: sharedOpinion._id,
            refDetail: (detail && detail._id) || null,
            type: 'USER-POST',
            message
        }, { created: true }); 

        try {
            ActivitySchema.validate(activity);
        } catch (err) {
            throw new Meteor.Error(err.message);
        }
        
        await Activities.insertAsync(activity);
        
        if (activity.refDetail) {
            await OpinionDetails.updateAsync(activity.refDetail, {
                $inc: { commentsCount: 1 }
            });
        }
    },

    /**
     * Creates an answer to an existing Activity
     * 
     * @param {String} refOpinion Id of the Opinion where the Activity belongs to
     * @param {String} refActivity Id of the Activity where the message is the answer for
     * @param {Object} msg (mentions, text) Message that the user posts
     */
    async 'activities.replyTo'(refOpinion, refActivity, msg) {
        this.unblock();

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        const currentUser = await Meteor.users.findOneAsync(this.userId);
        
        const activity = await Activities.findOneAsync(refActivity);
        const opinionDetail = await OpinionDetails.findOneAsync(activity.refDetail);

        // check if opinion was sharedWith the current User
        const sharedOpinion = await Opinions.findOneAsync({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!sharedOpinion) {
            throw new Meteor.Error('Dieses Gutachten/Aktivität wurde nicht mit Ihnen geteilt. Sie können keine Antwort verfassen.');
        }

        const sharedWithRole = sharedOpinion.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'opinion.canPostMessage')) {
            throw new Meteor.Error('Keine Berechtigung zum Erstellen eines Kommentars zu einem Gutachten.');
        }

        const message = await messageWithMentions({ currentUser, msg, refs: {
            refOpinion: sharedOpinion._id,
            refOpinionDetail: (opinionDetail && opinionDetail._id) || null,
            refParentDetail: (opinionDetail && opinionDetail.refParentDetail) || null,
            refActivitiesBy: (opinionDetail && opinionDetail._id) || null,
            refActivity: refActivity
        }});

        const answer = await injectUserData({ currentUser }, { message }, { created: true });

        try {
            AnswerSchema.validate(answer);
        } catch (err) {
            throw new Meteor.Error(err.message);
        }
        
        await Activities.updateAsync(refActivity, {
            $push: {
                answers: answer
            }
        });

        // tell the author of the post that someone has answered to his post, if the answer is not from himself
        if ( this.userId != activity.createdBy.userId ) {
            const userActivity = await injectUserData({ currentUser }, {
                refUser: activity.createdBy.userId,
                type: 'REPLYTO',
                refs: { 
                    refOpinion, 
                    refActivity,
                    refOpinionDetail: opinionDetail && opinionDetail._id || null,
                },
                message: `${currentUser.userData.firstName} ${currentUser.userData.lastName} hat auf einen Post von Ihnen geantwortet.`,
                originalContent: message,
                unread: true
            }, { created: true })     
            await UserActivities.insertAsync(
                userActivity
            );
        }

        if (opinionDetail) {
            await OpinionDetails.updateAsync(opinionDetail._id, {
                $inc: { commentsCount: 1 }
            });
        }
    },

});