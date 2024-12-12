import { Mongo } from 'meteor/mongo';
import 'meteor/aldeed:collection2/static';
import SimpleSchema from  'meteor/aldeed:simple-schema';

export const SequenceSchema = new SimpleSchema({
    value: {
        type: SimpleSchema.Integer,
        label: 'Aktueller Wert'
    }
});

export const Sequences = new Mongo.Collection('sequences');
Sequences.attachSchema(SequenceSchema);

Sequences.allow ({
    insert() { return false; },
    update() { return false; },
    remove() { return false; },
});