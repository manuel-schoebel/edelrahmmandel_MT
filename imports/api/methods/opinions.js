import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

import { Opinions, OpinionsSchema } from '../collections/opinions';
import { ParticipantSchema } from '../sharedSchemas/participant';

import { Activities } from '../collections/activities';

import { hasPermission, injectUserData } from '../helpers/roles';

import { sequenceNextValue } from '../helpers/sequence';
import { OpinionDetails } from '../collections/opinionDetails';

const ZEROS = '0000000000000000000000000000000';

Meteor.methods({
    /**
     * Creates a new opinion in the database
     * 
     * @param {Object} data Specified the data for the opinion to be inserted
     */
    async 'opinion.insert'(data) {
        check(data, Object);

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }
        
        let currentUser = await Meteor.users.findOneAsync(this.userId);

        // check if the user wants to create a new Template or a "normal" opinion
        // therefor we have to check different permissions
        const permissionName = data.isTemplate ? 'opinion.manageTemplate' : 'opinion.create';
        if (!await hasPermission({ currentUser }, permissionName)) {
            const errorMessage = data.isTemplate 
                ? 'Keine Berechtigung zum Erstellen einer Gutachten-Vorlage'
                : 'Keine Berechtigung zum Erstellen eines neuen Gutachten.';
            throw new Meteor.Error(errorMessage);
        }

        let opinion = await injectUserData({ currentUser }, {...data});

        if (Meteor.isServer) {
            let no = await sequenceNextValue('opinion');
            console.log('no', no);
            
            opinion.opinionNo = (new Date()).getFullYear() + '-' + ZEROS.substring(0, 4 - no.toString().length) + no;
        } else {
            opinion.opinionNo = '?'
        }

        // check if we need to copy data from a choosen template
        let template;
        if (data.refTemplate) {
            template = await Opinions.findOneAsync(data.refTemplate);

            // copy the document variables
            if (!template.userVariables) {
                opinion.userVariables = [];
            } else {
                opinion.userVariables = template.userVariables.map( v => {
                    v._id = new Mongo.ObjectID()._str;
                    if (!v.copyValue) {
                        // remove the current value from the var
                        v.value = '';
                    }
                    return v;
                })
            }
        }

        try {
            OpinionsSchema.validate(opinion);
        } catch (err) {
            throw new Meteor.Error(err.message);
        }
        
        let newOpinionId = await Opinions.insertAsync(opinion);
        
        let activity = await injectUserData({ currentUser }, {
            refOpinion: newOpinionId,
            type: 'SYSTEM-LOG',
            message: 'Gutachten wurde erstellt.'
        }, { created: true });

        await Activities.insertAsync(activity);

        // check if we need to copy the details from a template
        if (Meteor.isServer && data.refTemplate) {
            let oldToNewRefs = {};

            const findAndInsert = async parent => {
                const details = await OpinionDetails.find({ refOpinion: data.refTemplate, refParentDetail: parent }).fetchAsync();
                for (const detail of details) {
                    const oldId = detail._id;

                    delete detail._id;
                    detail.refOpinion = newOpinionId;
                    if (parent !== null) {
                        detail.refParentDetail = oldToNewRefs[detail.refParentDetail];
                    }
                    // reset all fields that are only belong to the original opinion
                    if (detail.actionCode && detail.type === 'QUESTION') detail.actionCode = 'unset';
                    if (detail.step) detail.step = null;
                    detail.likes = [];
                    detail.dislikes = [];
                    detail.commentsCount = 0;
                    detail.activitiesCount = 0;

                    const newId = await OpinionDetails.insertAsync(detail);
                    oldToNewRefs[oldId] = newId;

                    await findAndInsert(oldId);
                }
            }
            await findAndInsert(null);
        }
    },

    /**
     * Updates the given data for the specified opinion by refOpinion (id)
     * 
     * @param {String} refOpinion ID of the opinion to be updated
     * @param {Object} data Properties/values to be updated
     */
    async 'opinion.update'(refOpinion, data) {
        check(refOpinion, String);
        check(data, Object);

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        let currentUser = await Meteor.users.findOneAsync(this.userId);

        // check if opinion was sharedWith the current User
        const shared = await Opinions.findOneAsync({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Das angegebene Gutachten wurde nicht mit Ihnen geteilt und kann daher nicht aktualisiert werden.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!await hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'opinion.edit')) {
            throw new Meteor.Error('Keine Berechtigung zum Aktualisieren des angegebenen Gutachtens.');
        }
        
        await Opinions.updateAsync(refOpinion, {
            $set: data
        });
    },


    /**
     * Gets all users for the given Opinion 
     * that have shared. Used for Mentions in the Activity-Chat
     * 
     * @param {String} refOpinion Specifies the ID of the Opinion
     * @param {String} searchText (Optional) Text to search for a specific user
     */
    async 'opinion.getSharedWith'(refOpinion, searchText) {
        check(refOpinion, String);
        if (searchText) check(searchText, String);

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }

        let currentUser = await Meteor.users.findOneAsync(this.userId);

        // check if opinion was sharedWith the current User
        const shared = await Opinions.findOneAsync({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Das angegebene Gutachten wurde nicht mit Ihnen geteilt und Sie können von daher nicht das Benutzerverzeichnis einsehen.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!await hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'opinion.canPostMessage')) {
            throw new Meteor.Error('Keine Berechtigung zum Schreiben von Nachrichten des angegebenen Gutachtens. Sie können das Benutzerverzeichnis nicht einsehen.');
        }

        const lowerSearchtext = (searchText || '').toLowerCase();
        return shared && shared.sharedWith.map( sw => {
            return sw.user;
        }).filter(user => {
            const fn = (user.firstName || '').toLowerCase();
            const ln = (user.lastName || '').toLowerCase();
            return fn.includes(lowerSearchtext) || ln.includes(lowerSearchtext);
        });
    },

    /**
     * Adds a new Variable to the userVariables of the opinion
     * 
     * @param {String} refOpinion Specifies the Opinion by ID
     * @param {Object} data Object with name and value of the new Variable
     */
    async 'opinion.addVariable'(refOpinion, data) {
        check(refOpinion, String);
        check(data, Object);
        check(data.name, String);
        check(data.value, String);
        check(data.copyValue, Boolean);

        let currentUser = await Meteor.users.findOneAsync(this.userId);

        // check if opinion was sharedWith the current User
        const shared = await Opinions.findOneAsync({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Das angegebene Gutachten wurde nicht mit Ihnen geteilt.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!await hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'opinion.edit')) {
            throw new Meteor.Error('Keine Berechtigung zum Bearbeiten der Teilnehmer eines Gutachten.');
        }

        data._id = new Meteor.Collection.ObjectID().toHexString();

        try {
            if (!shared.userVariables) {
                await Opinions.updateAsync(refOpinion, {
                    $set: {
                        userVariables: [data]
                    }
                });
            } else {
                await Opinions.updateAsync(refOpinion, {
                    $push: {
                        userVariables: data
                    }
                });
            }

            const changes = [{
                message: "Die Variable wurde hinzugefügt",
                propName: "userVariables",
                oldValue: null,
                newValue: data
            }];
            let activity = await injectUserData({ currentUser }, {
                refOpinion: refOpinion,
                type: 'SYSTEM-LOG',
                action: 'INSERT',
                message: `hat die Variable mit dem Namen <b>${data.name}</b> hinzugefügt.`,
                changes
            }, { created: true });

            await Activities.insertAsync(activity);
        } catch (err) {
            throw new Meteor.Error(err.message);
        }
        
        // return the new Variable with it's id as pushed to the array
        return data;
    },

    /**
     * Update the given Variable by refOption an the id itself
     * 
     * @param {String} refOpinion Reference to the Opinion the participant belongs to
     * @param {Object} variable Data of the variable to update including the id
     */
    async 'opinion.updateVariable'(refOpinion, variable) {
        check(refOpinion, String);
        check(variable, Object);
        check(variable._id, String);
        check(variable.name, String);
        check(variable.value, String);
        check(variable.copyValue, Boolean);

        const newVariable = {
            _id: variable._id,
            name: variable.name,
            value: variable.value,
            copyValue: variable.copyValue
        }

        let currentUser = await Meteor.users.findOneAsync(this.userId);

        // check if opinion was sharedWith the current User
        const shared = await Opinions.findOneAsync({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Das angegebene Gutachten wurde nicht mit Ihnen geteilt.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!await hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'opinion.edit')) {
            throw new Meteor.Error('Keine Berechtigung zum Editieren der Variablen eines Gutachten.');
        }

        const oldVariable = shared.userVariables.find( v => v._id == newVariable._id );

        try {
            await Opinions.updateAsync({
                _id: refOpinion, 
                'userVariables._id': newVariable._id
            },{
                $set: {
                    'userVariables.$': newVariable
                }
            });

            const changes = [{
                message: "Die Variable wurden geändert",
                propName: "userVariables",
                oldValue: oldVariable,
                newValue: newVariable
            }];
            let activity = await injectUserData({ currentUser }, {
                refOpinion: refOpinion,
                type: 'SYSTEM-LOG',
                action: 'UPDATE',
                message: `hat die Variable mit dem Namen <b>${newVariable.name}</b> geändert.`,
                changes
            }, { created: true });
    
            await Activities.insertAsync(activity);
        } catch (err) {
            throw new Meteor.Error(err.message);
        } 
    },

    /**
     * Remove the given variable by refOption an the id itself
     * 
     * @param {String} refOpinion Reference to the Opinion the participant belongs to
     * @param {Object} participant Data of the participant to remove including the id of the participant
     */
    async 'opinion.removeVariable'(refOpinion, variable) {
        check(refOpinion, String);
        check(variable && variable._id, String);

        let currentUser = await Meteor.users.findOneAsync(this.userId);

        // check if opinion was sharedWith the current User
        const shared = await Opinions.findOneAsync({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Das angegebene Gutachten wurde nicht mit Ihnen geteilt.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!await hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'opinion.edit')) {
            throw new Meteor.Error('Keine Berechtigung zum Löschen der Variablen eines Gutachten.');
        }

        try {
            await Opinions.updateAsync({
                _id: refOpinion
            },{
                $pull: {
                    'userVariables': variable
                }
            });

            const changes = [{
                message: "Der Variable wurde gelöscht",
                propName: "userVariables",
                oldValue: variable,
                newValue: null
            }];
            let activity = await injectUserData({ currentUser }, {
                refOpinion: refOpinion,
                type: 'SYSTEM-LOG',
                action: 'REMOVE',
                message: `hat die Variable mit dem Namen <b>${variable.name}</b> gelöscht.`,
                changes
            }, { created: true });
    
            await Activities.insertAsync(activity);
        } catch (err) {
            throw new Meteor.Error(err.message);
        }
    },

    /**
     * Adds a new participant to the existing opinion
     * 
     * @param {String} refOpinion Reference to the Opinion the new participant belongs to
     * @param {Object} participant Data of the participant to creat/add
     */
    async 'opinion.addParticipant'(refOpinion, participant) {
        check(refOpinion, String);
        check(participant, Object);

        let currentUser = await Meteor.users.findOneAsync(this.userId);

        // check if opinion was sharedWith the current User
        const shared = await Opinions.findOneAsync({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Das angegebene Gutachten wurde nicht mit Ihnen geteilt.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!await hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'opinion.edit')) {
            throw new Meteor.Error('Keine Berechtigung zum Bearbeiten der Teilnehmer eines Gutachten.');
        }

        participant.id = new Meteor.Collection.ObjectID().toHexString();

        try {
            ParticipantSchema.validate(participant);

            await Opinions.updateAsync(refOpinion, {
                $push: {
                    participants: participant
                }
            });

            const { gender, lastName } = participant;
            const changes = [{
                message: "Der Teilnehmer wurde hinzugefügt",
                propName: "participants",
                oldValue: null,
                newValue: participant
            }];
            let activity = await injectUserData({ currentUser }, {
                refOpinion: refOpinion,
                type: 'SYSTEM-LOG',
                action: 'INSERT',
                message: `hat den Teilnehmer ${gender} ${lastName} hinzugefügt.`,
                changes
            }, { created: true });
    
            await Activities.insertAsync(activity);

            return changes;
        } catch (err) {
            throw new Meteor.Error(err.message);
        }
    },

    /**
     * Update the given participant by refOption an the id itself
     * 
     * @param {String} refOpinion Reference to the Opinion the participant belongs to
     * @param {Object} participant Data of the participant to update including the id of the participant
     */
    async 'opinion.updateParticipant'(refOpinion, participant) {
        check(refOpinion, String);
        check(participant, Object);

        let currentUser = await Meteor.users.findOneAsync(this.userId);

        // check if opinion was sharedWith the current User
        const shared = await Opinions.findOneAsync({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Das angegebene Gutachten wurde nicht mit Ihnen geteilt.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!await hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'opinion.edit')) {
            throw new Meteor.Error('Keine Berechtigung zum Editieren der Teilnehmer eines Gutachten.');
        }

        const oldParticipant = shared.participants.find( p => p.id == participant.id );

        try {
            ParticipantSchema.validate(participant);

            await Opinions.updateAsync({
                _id: refOpinion, 
                'participants.id': participant.id
            },{
                $set: {
                    'participants.$': participant
                }
            });

            const { gender, lastName } = participant;
            const changes = [{
                message: "Die Teilnehmerdaten wurden geändert",
                propName: "participants",
                oldValue: oldParticipant,
                newValue: participant
            }];
            let activity = await injectUserData({ currentUser }, {
                refOpinion: refOpinion,
                type: 'SYSTEM-LOG',
                action: 'UPDATE',
                message: `hat den Teilnehmer ${gender} ${lastName} geändert.`,
                changes
            }, { created: true });
    
            await Activities.insertAsync(activity);

            return changes;
        } catch (err) {
            throw new Meteor.Error(err.message);
        } 
    },

    /**
     * Remove the given participant by refOption an the id itself
     * 
     * @param {String} refOpinion Reference to the Opinion the participant belongs to
     * @param {Object} participant Data of the participant to remove including the id of the participant
     */
    async 'opinion.removeParticipant'(refOpinion, participant) {
        check(refOpinion, String);
        check(participant && participant.id, String);

        let currentUser = await Meteor.users.findOneAsync(this.userId);

        // check if opinion was sharedWith the current User
        const shared = await Opinions.findOneAsync({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Das angegebene Gutachten wurde nicht mit Ihnen geteilt.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!await hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'opinion.edit')) {
            throw new Meteor.Error('Keine Berechtigung zum Löschen des Teilnehmers eines Gutachten.');
        }

        try {
            await Opinions.updateAsync({
                _id: refOpinion
            },{
                $pull: {
                    'participants': participant
                }
            });

            const { gender, lastName } = participant;
            const changes = [{
                message: "Der Teilnehmer wurde gelöscht",
                propName: "participants",
                oldValue: participant,
                newValue: null
            }];
            let activity = await injectUserData({ currentUser }, {
                refOpinion: refOpinion,
                type: 'SYSTEM-LOG',
                action: 'REMOVE',
                message: `hat den Teilnehmer ${gender} ${lastName} gelöscht.`,
                changes
            }, { created: true });
    
            await Activities.insertAsync(activity);

            return changes;
        } catch (err) {
            throw new Meteor.Error(err.message);
        }
    }
});