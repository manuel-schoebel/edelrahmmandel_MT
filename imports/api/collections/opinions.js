import { Mongo } from 'meteor/mongo';
import 'meteor/aldeed:collection2/static';
import SimpleSchema from  'meteor/aldeed:simple-schema';

import { 
    CreationSchema,
    SharedWithSchema
} from '../sharedSchemas/user';
import { AddressSchema } from '../sharedSchemas/address';
import { ParticipantSchema } from '../sharedSchemas/participant';
import { UserSchema } from '../sharedSchemas/user';

/*SimpleSchema.defineValidationErrorTransform(error => {
    const ddpError = new Meteor.Error(error.message);
    ddpError.error = 'validation-error';
    ddpError.details = error.details;
    return ddpError;
});*/

export const OpinionsSchema = new SimpleSchema({
    title: {
        type: String,
        label: 'Titel',
        max: 100,
    },
    description: {
        type: String,
        label: 'Beschreibung'
    },
    isTemplate: {
        type: Boolean,
        defaultValue: false,
        optional: true
    },
    refTemplate: {
        type: String,
        label: 'Referenz auf verwendete Vorlage',
        optional: true
    },
    outputTemplate: {
        type: String,
        label: 'Ausgabeformat/Vorlage',
    },
    customer: {
        type: AddressSchema,
        label: 'Auftraggeber'
    },
    dateFrom: {
        type: Date,
        label: 'Datum von',
    },
    dateTill: {
        type: Date,
        label: 'Datum bis',
    },
    participants: {
        type: Array,
        optional: true
    },
    'participants.$': {
        type: ParticipantSchema,
        minCount: 0
    },
    // Gutachter 1 + 2
    expert1: {
        type: UserSchema,
        optional: true
    },
    expert2: {
        type: UserSchema,
        optional: true
    },
    opinionNo: {
        type: String
    },
    userVariables: {
        type: Array,
        optional: true,
        label: 'Benutzervariablen'
    },
    'userVariables.$': {
        type: new SimpleSchema({
            _id: { type: String, label: 'Eindeutige ID' },
            name: { type: String, label: 'Variablenname' },
            value: { type: String, label: 'Variablenwert', optional: true },
            copyValue: { type: Boolean, label: 'Wert für neues Gutachten übernehmen', optional: true }
        })
    },
    disableCopyright: {
        type: Boolean,
        optional: true,
        defaultValue: false
    },
    hasAbbreviationsPage: {
        type: Boolean,
        optional: true,
        defaultValue: true
    },
    status: {
        type: String,
        label: 'Status',
        optional: true,
        defaultValue: 'Angelegt'
    }
});

OpinionsSchema.extend(CreationSchema);
OpinionsSchema.extend(SharedWithSchema);

export const Opinions = new Mongo.Collection('opinions');
Opinions.attachSchema(OpinionsSchema);

Opinions.allow ({
    insert() { return false; },
    update() { return false; },
    remove() { return false; },
});