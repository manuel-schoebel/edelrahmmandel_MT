import { Mongo } from 'meteor/mongo';
import 'meteor/aldeed:collection2/static';
import SimpleSchema from  'meteor/aldeed:simple-schema';

import { CreationSchema, UserSchema } from '../sharedSchemas/user';

export const OpinionDetailSchema = new SimpleSchema({
    refOpinion: {
        type: String,
        label: 'Gutachten-Referenz'
    },
    refParentDetail: {
        type: String,
        label: 'Parent-Referenz',
        optional: true
    },
    position: {
        type: SimpleSchema.Integer,
        label: 'Position',
    },
    parentPosition: {
        type: String,
        label: 'Position Vorgänger',
        optional: true
    },
    printPosition: {
        type: SimpleSchema.Integer,
        label: 'Position (im Ausdruck)',
        optional: true
    },
    printParentPosition: {
        type: String,
        label: 'Position (Vorgänger, im Ausdruck)',
        optional: true
    },
    depth: {
        type: SimpleSchema.Integer,
        label: 'Verschachtelungsebene',
    },
    type: {
        type: String,
        label: 'Layout/Type'
    },
    title: {
        type: String,
        label: 'Titel',
    },
    printTitle: {
        type: String,
        optional: true,
        defaultValue: null,
        label: 'Titel im Druck',
    },
    text: {
        type: String,
        label: 'Text',
        optional: true // z.B. der Punkte 4. Befragung hat keinen weiteren Detailtext
    },
    orderString: {
        type: String,
        label: 'Sortierung',
        optional: true
    },
    actionCode: {
        type: String,
        label: 'Handlungsbedarf',
        optional: true
    },
    actionText: { // nur benötigt als Maßnahmentext für Einträge vom Typ "Antwort"
        type: String,
        label: 'Maßnahme',
        optional: true
    },
    actionPrio: { // dient der Sortierung nach Maßnahmentyp von adhoc bis verbesserungsvorschlag und kein Handlungsbedarf
        type: SimpleSchema.Integer,
        label: 'Sortierung nach Handlungsbedarf',
        optional: true
    },
    files: {
        type: Array,
        defaultValue: []
    },
    'files.$': {
        type: Object,
        blackbox: true
    },
    deleted: { // marked the detail that could be deleted
        type: Boolean,
        optional: true,
        defaultValue: false
    },
    deletedByDetail: {
        type: SimpleSchema.oneOf(String, Boolean),
        optional: true
    },
    finallyRemoved: { // detail is finally removed and will be no longer served
        type: Boolean,
        optional: true,
        defaultValue: false
    },
    finallyRemovedByDetail: {
        type: SimpleSchema.oneOf(String, Boolean),
        optional: true
    },
    likes: {
        type: Array,
        optional: true,
        defaultValue: []
    },
    'likes.$': {
        type: UserSchema,
    },
    dislikes: {
        type: Array,
        optional: true,
        defaultValue: []
    },
    'dislikes.$': {
        type: UserSchema,
    },
    commentsCount: {
        type: SimpleSchema.Integer,
        optional: true,
        defaultValue: 0
    },
    activitiesCount: {
        type: SimpleSchema.Integer,
        optional: true,
        defaultValue: 0
    },
    showInToC: {        // soll das Detail im inhaltsverzeichnis gelistet werden oder nicht
        type: Boolean,
        optional: true,
        defaultValue: false
    },
    pagebreakBefore: {
        type: Boolean,
        optional: true,
        defaultValue: false
    },
    pagebreakAfter: {
        type: Boolean,
        optional: true,
        defaultValue: false
    },
    htmlContent: {
        type: String,
        optional: true
    },
    /*htmlChildContent: {
        type: String,
        optional: true
    }*/
    spellchecked: {
        type: Boolean,
        defaultValue: false
    }
});

OpinionDetailSchema.extend(CreationSchema);

export const OpinionDetails = new Mongo.Collection('opinionDetails');
OpinionDetails.attachSchema(OpinionDetailSchema);

// Index implementieren um Performance zu steigern
if (Meteor.isServer) {
    OpinionDetails.rawCollection().createIndex({
        refOpinion: -1,
        refParentDetail: -1,
        finallyRemoved: -1
    });
}

OpinionDetails.allow ({
    insert() { return false; },
    update() { return false; },
    remove() { return false; },
});