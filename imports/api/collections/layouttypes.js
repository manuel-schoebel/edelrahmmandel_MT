import { Mongo } from 'meteor/mongo';
import 'meteor/aldeed:collection2/static';
import SimpleSchema from  'meteor/aldeed:simple-schema';

export const LayouttypeSchema = new SimpleSchema({
    title: {
        type: String,
        label: 'Kurzbezeichnung'
    },
    description: {
        type: String,
        label: 'Ein Erläuterungstext',
        optional: true
    },
    hasChilds: {
        type: Boolean,
        defaultValue: false
    },
    template: {
        type: String,
        optional: true
    }
});

export const Layouttypes = new Mongo.Collection('layouttypes');
Layouttypes.attachSchema(LayouttypeSchema);
