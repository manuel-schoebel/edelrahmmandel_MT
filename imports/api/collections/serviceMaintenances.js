import { Mongo } from 'meteor/mongo';
import 'meteor/aldeed:collection2/static';
import SimpleSchema from  'meteor/aldeed:simple-schema';

export const ServiceMaintenancesSchema = new SimpleSchema({
    dateStart: {
        type: Date,
        label: 'Beginn',
    },
    plannedServiceTime: {
        type: String,
        label: 'Zeitraum'
    },
    active: {
        type: Boolean,
        defaultValue: true,
        label: 'Aktiv'
    }
});

export const ServiceMaintenances = new Mongo.Collection('servicemaintenances');
ServiceMaintenances.attachSchema(ServiceMaintenancesSchema);