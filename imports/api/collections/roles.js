import { Mongo } from 'meteor/mongo';
import 'meteor/aldeed:collection2/static';
import SimpleSchema from  'meteor/aldeed:simple-schema';

export const RolesSchema = new SimpleSchema({
    rolename: {
        type: String,
        label: 'Rollenname'
    },
    description: {
        type: String,
        label: 'Beschreibung'
    },
    selectable: {
        type: Boolean,
        label: 'Auswählbar durch Benutzer',
        defaultValue: true
    },
    score: {
        type: SimpleSchema.Integer, 
        label: 'Wertigkeit der ROlle im Vergleich zu allen anderen Rollen. Je höher der Score desto wertiger die Rolle.',
        defaultValue: 0
    },
    invitableRoles: {
        label: 'Einladbare Rollen',
        type: Array
    },
    'invitableRoles.$': {
        label: 'Einladbare Rolle',
        type: new SimpleSchema({
            roleId: {
                type: String
            },
            displayName: {
                type: String
            }
        })
    },
    permissions: {
        label: 'Berechtigungen',
        type: new SimpleSchema({
            opinion: {
                type: new SimpleSchema({
                    create: { type: SimpleSchema.Integer, label: 'Gutachten Erstellen', defaultValue: 0 },
                    edit: { type: SimpleSchema.Integer, label: 'Gutachten Editieren', defaultValue: 0 },
                    remove: { type: SimpleSchema.Integer, label: 'Gutachten Löschen', defaultValue: 0 },
                    admin: { type: SimpleSchema.Integer, label: 'Gutachten Administrator ???', defaultValue: 0 },
                    manageTemplate: { type: SimpleSchema.Integer, label: 'Gutachten Vorlage erstellen, bearbeiten', defaultValue: 0 },
                    // zum Löschen einer Vorlage benötigt der benutzer die remove Berechtigung UND manageTemplate Berechtigung
                    canPostMessage: { type: SimpleSchema.Integer, label: 'Darf der Benutzer Nachrichten zu einem Gutachten/-Detail schreiben.', defaultValue: 0 },
                    spellcheck: { type: SimpleSchema.Integer, label: 'Darf der Benutzer einen Baustein als rechtschreibgeprüft abhaken', defaultValue: 0 },
                }),
                label: 'Berechtigungen für Gutachten'
            },
            shareWith: {
                type: SimpleSchema.Integer,
                label: 'Darf Dinge teilen',
                defaultValue: 0
            },
            shareWithExplicitRole: {
                type: SimpleSchema.Integer,
                label: 'Darf Dinge mit spezieller Rollenzuweisung teilen',
                defaultValue: 0
            },
            shareWithExplicitRoleInvitables: {
                type: Array,
                optional: true
            },
            'shareWithExplicitRoleInvitables.$': {
                label: 'Einladbare spezielle Rollen für Berechtigung shareWithExplicitRole',
                type: new SimpleSchema({
                    roleId: {
                        type: String
                    },
                    displayName: {
                        type: String
                    }
                })
            },
            cancelSharedWith: {
                type: SimpleSchema.Integer,
                label: 'Darf Teilen rückgängig machen bzw. eine Person "entfernen"',
                defaultValue: 0
            },
            manageUsersAndRoles: {
                type: SimpleSchema.Integer,
                label: 'Darf Benutzer und Rollen verwalten',
                defaultValue: 0
            },
        }),
    }
});

export const Roles = new Mongo.Collection('roles');
Roles.attachSchema(RolesSchema);