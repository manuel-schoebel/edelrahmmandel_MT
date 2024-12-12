import { Mongo } from 'meteor/mongo';
import 'meteor/aldeed:collection2/static';
import SimpleSchema from  'meteor/aldeed:simple-schema';

import { CreationSchema } from '../sharedSchemas/user';

export const AnswerSchema = new SimpleSchema({
    message: {
        type: String,
        label: 'Antworttext'
    }
});
AnswerSchema.extend(CreationSchema);

export const ActivitySchema = new SimpleSchema({
    refOpinion: {
        type: String,
        label: 'Gutachten-Referenz'
    },
    refDetail: {
        type: String,
        label: 'Gutachten-Referenz auf Detailpunkt',
        optional: true
    },
    refDetailFinallyRemoved: {
        type: String,
        label: 'Gutachten-Referenz auf ein Detail, dass endgültig gelöscht wurde',
        optional: true
    },
    type: {
        type: String // USER-POST, SYSTEM-LOG
    },
    action: {
        type: String, // INSERT, UPDATE, REMOVE
        optional: true // only supported if type was SYSTEM-LOG
    },
    message: {
        type: String,
        label: 'Aktivitätsnachricht'
    },
    answers: {
        type: Array,
        label: 'Antworten',
        defaultValue: [],
        optional: true,
    },
    "answers.$": {
        label: 'Antwort',
        type: AnswerSchema
    },
    // is used when "action" == "SYSTEM-LOG"
    changes: {
        type: Array,
        optional: true
    },
    "changes.$": {
        type: Object,
        blackbox: true
    }
});

ActivitySchema.extend(CreationSchema);

export const Activities = new Mongo.Collection('activities');
Activities.attachSchema(ActivitySchema);

Activities.allow ({
    insert() { return false; },
    update() { return false; },
    remove() { return false; },
})