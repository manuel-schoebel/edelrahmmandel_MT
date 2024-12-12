import { Roles } from '/imports/api/collections/roles';

//if (Roles.find().count() != 1) {
    await Roles.removeAsync({});

    await Roles.insertAsync({
        _id: 'EVERYBODY',
        rolename: 'Jeder',
        score: 0,
        description: 'Zugriff für jeden Benutzer',
        permissions: {
            opinion: {                
                create: 0,
                edit: 0,
                remove: 0,
                admin: 0,
                canPostMessage: 0,
                manageTemplate: 0,
                spellcheck: 0
            },
            shareWith: 0,
            shareWithExplicitRole: 0,
            shareWithExplicitRoleInvitables: [ ],
            cancelSharedWith: 0,
            cancelOwnSharedWith: 0,
        },
        invitableRoles: [{ roleId:'EVERYBODY', displayName: 'Jeder' }],
        selectable: true 
    });

    await Roles.insertAsync({
        _id: 'EXTERNAL',
        rolename: 'Externer',
        score: 100,
        description: 'Zugriff nur für externe - Kunden, Projektleiter, etc.',
        permissions: {
            opinion: {                
                create: 0,
                edit: 0,
                remove: 0,
                admin: 0,
                canPostMessage: 1,
                manageTemplate: 0,
                spellcheck: 0
            },
            shareWith: 1,
            shareWithExplicitRole: 0,
            shareWithExplicitRoleInvitables: [ ],
            cancelSharedWith: 0,
            cancelOwnSharedWith: 0,
        },
        invitableRoles: [
            { roleId:'EVERYBODY', displayName: 'Jeder' }, 
            { roleId:'EXTERNAL', displayName: 'Externer' }
        ],
        selectable: true
    });

    await Roles.insertAsync({
        _id: 'READONLY',
        rolename: 'Nur lesen',
        score: 150,
        description: 'Zugriff auf bestimmtes Dokument, welches jedoch nur lesbar ist.',
        permissions: {
            opinion: {                
                create: 0,
                edit: 0,
                remove: 0,
                admin: 0,
                canPostMessage: 1,
                manageTemplate: 0,
                spellcheck: 0
            },
            shareWith: 0,
            shareWithExplicitRole: 0,
            shareWithExplicitRoleInvitables: [ ],
            cancelSharedWith: 0,
            cancelOwnSharedWith: 0,
        },
        invitableRoles: [],
        selectable: false
    });

    await Roles.insertAsync({
        _id: 'EMPLOYEE',
        rolename: 'Mitarbeiter',
        score: 200,
        description: 'Zugriff nur für Mitarbeiter',
        permissions: {
            opinion: {                
                create: 1,
                edit: 1,
                remove: 0,
                admin: 0,
                canPostMessage: 1,
                manageTemplate: 0,
                spellcheck: 0
            },
            shareWith: 1,
            shareWithExplicitRole: 0,
            shareWithExplicitRoleInvitables: [ ],
            cancelSharedWith: 0,
            cancelOwnSharedWith: 1,
        },
        invitableRoles: [
            { roleId:'EVERYBODY', displayName: 'Jeder' }, 
            { roleId:'EXTERNAL', displayName: 'Externer' },
            { roleId:'EMPLOYEE', displayName: 'Mitarbeiter' }, 
        ],
        selectable: true
    });

    await Roles.insertAsync({
        _id: 'SPELLCHECKER',
        rolename: 'Mitarbeiter ',
        score: 250,
        description: 'Zugriff nur für Mitarbeiter',
        permissions: {
            opinion: {                
                create: 0,
                edit: 1,
                remove: 0,
                admin: 0,
                canPostMessage: 1,
                manageTemplate: 0,
                spellcheck: 1
            },
            shareWith: 0,
            shareWithExplicitRole: 0,
            shareWithExplicitRoleInvitables: [ ],
            cancelSharedWith: 0,
            cancelOwnSharedWith: 1,
        },
        invitableRoles: [
            { roleId:'EVERYBODY', displayName: 'Jeder' },
        ],
        selectable: false
    });

    // special role, that permits a user with mostly all permissions on
    // the created item, that he creates
    await Roles.insertAsync({
        _id: 'OWNER',
        rolename: 'Besitzer, Ersteller',
        score: 800,
        description: 'Benutzer, der das Dokument erstellt hat',
        permissions: {
            opinion: {
                create: 0,
                edit: 1,
                remove: 1,
                admin: 0,
                canPostMessage: 1,
                manageTemplate: 0,
                spellcheck: 0,
            },
            shareWith: 1,
            shareWithExplicitRole: 1,
            shareWithExplicitRoleInvitables: [
                { roleId:'OWNER', displayName: 'Besitzer' },
                { roleId:'EXPERT', displayName: 'Experte' },
                { roleId:'READONLY', displayName: 'nur lesender Zugriff' },
            ],
            cancelSharedWith: 1,
            cancelOwnSharedWith: 1,
        },
        invitableRoles: [
            { roleId:'EVERYBODY', displayName: 'Jeder' }, 
            { roleId:'EXTERNAL', displayName: 'Externer' },
        ],
        selectable: false
    });

    // special role, that permits a user with mostly all permissions on
    // the created item, that he creates
    await Roles.insertAsync({
        _id: 'EXPERT',
        rolename: 'Experte',
        score: 700,
        description: 'Rolle für den zweiten gutachter, der der eigentliche Experte ist',
        permissions: {
            opinion: {
                create: 0,
                edit: 1,
                remove: 1,
                admin: 0,
                canPostMessage: 1,
                manageTemplate: 0,
                spellcheck: 0,
            },
            shareWith: 1,
            shareWithExplicitRole: 0,
            shareWithExplicitRoleInvitables: [
                { roleId:'OWNER', displayName: 'Besitzer' },
                { roleId:'EXPERT', displayName: 'Experte' },
            ],
            cancelSharedWith: 1,
            cancelOwnSharedWith: 1,
        },
        invitableRoles: [
            { roleId:'EVERYBODY', displayName: 'Jeder' }, 
            { roleId:'EXTERNAL', displayName: 'Externer' },
        ],
        selectable: false
    });

    await Roles.insertAsync({
        _id: 'ADMIN',
        rolename: 'Administrator',
        score: 99999,
        description: 'Admin darf alles',
        permissions: {
            opinion: {                
                create: 1,
                edit: 1,
                remove: 1,
                admin: 1,
                canPostMessage: 1,
                manageTemplate: 1,
                spellcheck: 1
            },
            shareWith: 1,
            shareWithExplicitRole: 1,
            shareWithExplicitRoleInvitables: [
                { roleId:'ADMIN', displayName: 'Administrator' },
                { roleId:'READONLY', displayName: 'nur lesender Zugriff' },
                { roleId:'OWNER', displayName: 'Besitzer' },
                { roleId:'EXPERT', displayName: 'Experte' },
            ],
            cancelSharedWith: 1,
            cancelOwnSharedWith: 1,
        },
        invitableRoles: [
            { roleId:'EVERYBODY', displayName: 'Jeder' }, 
            { roleId:'EXTERNAL', displayName: 'Externer' },
            { roleId:'EMPLOYEE', displayName: 'Mitarbeiter' }, 
            { roleId:'SPELLCHECKER', displayName: 'Spellchecked' }, 
            { roleId:'ADMIN', displayName: 'Administrator' },
        ],
        selectable: true
    });
//}