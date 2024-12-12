import SimpleSchema from  'meteor/aldeed:simple-schema';

export const UserSchema = new SimpleSchema({
    userId: {
        type: String,
        label: 'Benutzer-ID'
    },
    title: {
        type: String,
        label: 'Titel',
        optional: true
    },
    firstName: {
        type: String,
        max: 100,
        label: 'Vorname'
    },
    lastName: {
        type: String,
        max: 100,
        label: 'Nachname'
    },
    company: {
        type: String,
        label: 'Firma',
        optional: true
    },
    position: {
        type: String,
        label: 'Position',
        optional: true
    },
    qualification: {
        type: String,
        label: 'Qualifikation',
        optional: true
    },
    advancedQualification: {
        type: String,
        label: 'Weiterführende Qualifikation',
        optional: true
    },
    active: {
        type: Boolean,
        optional: true,
        defaultValue: true
    },
});

export const UserWithRoleSchema = new SimpleSchema({
    user: {
        type: UserSchema,
        label: 'Benutzer'
    },
    role: {
        type: String,
        label: 'Benutzerrolle',
        optional: true
    }
});

export const CreationSchema = new SimpleSchema({
    createdAt: {
        type: Date,
        label: 'Erstellt am',
        defaultValue: new Date
    },
    createdBy: {
        type: UserSchema,
        label: 'Erstellt von'
    },
});

export const SharedWithSchema = new SimpleSchema({
    sharedWith: {
        type: Array,
        label: 'Geteilt mit'
    },
    "sharedWith.$": {
        type: UserWithRoleSchema
    }
});
