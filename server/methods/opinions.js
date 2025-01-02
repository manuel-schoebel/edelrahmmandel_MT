import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { Opinions } from '../../imports/api/collections/opinions';

import { escapeRegExp } from '../../imports/api/helpers/basics';

import opinionDocumenter from 'opinion-documenter';
import { OpinionDetails } from '../../imports/api/collections/opinionDetails';
import { Images } from '../../imports/api/collections/images';
import { OpinionPdfs } from '../../imports/api/collections/opinion-pdfs';

import { actionCodes } from '../../imports/api/constData/actioncodes'; 

import { Activities } from '../../imports/api/collections/activities';
import { hasPermission, injectUserData } from '../../imports/api/helpers/roles';

import fs from 'fs';
import { readFile } from 'fs/promises';

import fs_extra from 'fs-extra';

import moment from 'moment';

import { Sifter, Renderer } from 'tabulatore';

//import pdfence from 'pdfence';

const settings = JSON.parse(process.env.MGP_SETTINGS);

import { rePositionDetails } from '../../imports/api/helpers/opinionDetails';

Meteor.methods({
    /**
     * Returns all Opinions that are shared with the current user
     * 
     * @param {String} searchText Specifies a searchText
     */
    'opinions.getSharedOpinions'(searchText){
        if (searchText !== undefined && searchText !== null) {
            check(searchText, String);
        }

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }
        
        const escapedText = escapeRegExp(searchText);
        
        // check if opinion was sharedWith the current User
        const shared = Opinions.find({
            $and: [
                { "sharedWith.user.userId": this.userId },
                { $or: [
                    { 'title': { $regex : escapedText, $options:"i" } },
                    { 'description': { $regex : escapedText, $options:"i" } },
                    { 'opinionNo': { $regex : escapedText, $options:"i" } },
                    { 'customer.name': { $regex : escapedText, $options:"i" } },
                ]}
            ]
        }).map( o => {
            const calcTitle = o.customer
                ? o.title + ' Nr. ' + o.opinionNo + ' (' + o.customer.name + ' ' + o.customer.city + ')'
                : o.title;

            return {
                _id: o._id,
                title: calcTitle
            }
        });
        
        return shared;
    },

    /**
     * Returns all Opinions that are shared with the current user
     * Umstellung auf Async für Meteor Version 2.8, https://guide.meteor.com/2.8-migration
     * 
     * @param {String} searchText Specifies a searchText
     */
    async 'opinions.getSharedOpinionsAsync'(searchText){
        if (searchText !== undefined && searchText !== null) {
            check(searchText, String);
        }

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }
        
        const escapedText = escapeRegExp(searchText);
        
        // check if opinion was sharedWith the current User
        const shared = await Opinions.find({
            $and: [
                { "sharedWith.user.userId": this.userId },
                { $or: [
                    { 'title': { $regex : escapedText, $options:"i" } },
                    { 'description': { $regex : escapedText, $options:"i" } },
                    { 'opinionNo': { $regex : escapedText, $options:"i" } },
                    { 'customer.name': { $regex : escapedText, $options:"i" } },
                ]}
            ]
        }).mapAsync( o => {
            const calcTitle = o.customer
                ? o.title + ' Nr. ' + o.opinionNo + ' (' + o.customer.name + ' ' + o.customer.city + ')'
                : o.title;

            return {
                _id: o._id,
                title: calcTitle
            }
        });
        
        return shared;
    },

    /**
     * Opinion löschen - Geteilt mit für aktuellen Benutzer entfernen
     * 
     * @param {String} refOpinion Specifies the opinion
     */
     'opinions.unshareOpinionUser'( refOpinion ) {
        check(refOpinion, String);

        if (!this.userId) {
            throw new Meteor.Error('Not Authorized.');
        }

        let currentUser = Meteor.users.findOne(this.userId);

        // check if opinion was sharedWith the current User
        const shared = Opinions.findOne({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Dieses Gutachten wurde nicht mit Ihnen geteilt.');
        }

        //console.log( shared.sharedWith );

        // Für das eigene rausnehmen "geteilt mit" werden keine besonderen Rollen benötigt.
        /*const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        // Die Berechtigung shareWithExplicitRole wird hier verwendet.
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'shareWithExplicitRole')) {
            throw new Meteor.Error('Sie besitzen keine Berechtigung für das Löschen von PDFs.');
        }*/
        const shW = shared.sharedWith.find(s => s.user.userId == this.userId);
        const { firstName, lastName} = shW.user;

        Opinions.update(refOpinion, {
            $pull: { 
                sharedWith: shW
            }
        });

        // post a new activity to this opinion
        const activity = injectUserData({ currentUser }, {
            refOpinion,
            refDetail: null,
            type: 'SYSTEM-POST',
            message: `hat das Gutachten mit ID ${refOpinion} für den Benutzer <strong>${firstName + ' ' + lastName}</strong> gelöscht.`
        }, { created: true });
        
        Activities.insert(activity);
    },

    /**
     * Opinion löschen - Geteilt mit für aktuellen Benutzer entfernen
     * Umstellung auf Async für Meteor Version 2.8, https://guide.meteor.com/2.8-migration
     * 
     * @param {String} refOpinion Specifies the opinion
     */
    async 'opinions.unshareOpinionUserAsync'( refOpinion ) {
        check(refOpinion, String);

        if (!this.userId) {
            throw new Meteor.Error('Not Authorized.');
        }

        let currentUser = await Meteor.users.findOneAsync(this.userId);

        // check if opinion was sharedWith the current User
        const shared = await Opinions.findOneAsync({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Dieses Gutachten wurde nicht mit Ihnen geteilt.');
        }

        //console.log( shared.sharedWith );

        // Für das eigene rausnehmen "geteilt mit" werden keine besonderen Rollen benötigt.
        /*const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        // Die Berechtigung shareWithExplicitRole wird hier verwendet.
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'shareWithExplicitRole')) {
            throw new Meteor.Error('Sie besitzen keine Berechtigung für das Löschen von PDFs.');
        }*/
        const shW = shared.sharedWith.find(s => s.user.userId == this.userId);
        const { firstName, lastName} = shW.user;

        /*await Opinions.updateAsync(refOpinion).then( {
            $pull: { 
                sharedWith: shW
            }
        });*/
        await Opinions.updateAsync(refOpinion, {
            $pull: { 
                sharedWith: shW
            }
        });

        // post a new activity to this opinion
        const activity = injectUserData({ currentUser }, {
            refOpinion,
            refDetail: null,
            type: 'SYSTEM-POST',
            message: `hat das Gutachten mit ID ${refOpinion} für den Benutzer <strong>${firstName + ' ' + lastName}</strong> gelöscht.`
        }, { created: true });
        
        await Activities.insertAsync(activity);
    },

    /**
     * Archive PDF - Zurücknehmen der Archivierung eines PDFs
     * 
     * @param {String} refOpinion Specifies the opinion
     * @param {String} PDFId Specifies the PDF
     */
     'opinions.archivePDF'(refOpinion, PDFId) {
        check(refOpinion, String);
        check(PDFId, String);

        if (!this.userId) {
            throw new Meteor.Error('Not Authorized.');
        }

        let currentUser = Meteor.users.findOne(this.userId);

        // check if opinion was sharedWith the current User
        const shared = Opinions.findOne({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Dieses Gutachten wurde nicht mit Ihnen geteilt.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        // Die Berechtigung shareWithExplicitRole wird hier verwendet.
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'shareWithExplicitRole')) {
            throw new Meteor.Error('Sie besitzen keine Berechtigung für die Archivierung von PDFs in diesem Gutachten.');
        }

        /* 
        1. Datei auf Speicher/FS verschieben.
        2. Pfade in Collection anpassen.
            Zur Sicherheit werden folgende Eigenschaften aktualisiert:
            - path (Pfad inkl. Dateiname)
            - _storagePath (nur Pfad!)
            - versions.original.path (Pfad inkl. Dateiname)
        3. meta.archive auf true setzen.
        */
        // Aktuellen Dateipfad auslesen.
        let opinionPdf = OpinionPdfs.findOne({ _id: PDFId , 'meta.refOpinion': refOpinion });
        const src = opinionPdf.versions.original.path;
        // Archivpfad.
        //const archivePath = 'C:/Users/marc.tomaschoff/meteor/DATA/PDF/_Archiv';
        const settings = JSON.parse( process.env.MGP_SETTINGS );
        const archivePath = `${settings.PdfArchivePath}/${moment(opinionPdf.meta.createdAt).format('YYYY')}`;
        // Zielpfad = archivePath inkl. [Jahr der Erstellung des PDFs] + _id.pdf
        const dest = `${archivePath}/${opinionPdf._id}.pdf`;
        //const dest = 'C:/Users/marc.tomaschoff/meteor/DATA/PDF/_Archiv/2022/6xEXNRaJTHd7jnhan.pdf';
        //console.log( dest )
        
        // 1. Datei auf Speicher/FS verschieben
        fs_extra.move( src , dest )
        .then(() => {
            console.log( 'file move successfull!' );
            // Pfade in Collection anpassen und meta.archive auf true setzen.
            OpinionPdfs.update({ _id: PDFId , 'meta.refOpinion': refOpinion }, {
                $set: {
                    'meta.archive': true,
                    'path': dest,
                    '_storagePath': archivePath,
                    'versions.original.path': dest
                }
            });            

            // post a new activity to this opinion
            const activity = injectUserData({ currentUser }, {
                refOpinion,
                refDetail: null,
                type: 'SYSTEM-POST',
                message: `hat das PDF mit ID <strong>${PDFId}</strong> archiviert.`
            }, { created: true });
            
            Activities.insert(activity);
        })
        .catch( err => {
            console.error( err )
        })
    },

    /**
     * Archive PDF - Zurücknehmen der Archivierung eines PDFs
     * Umstellung auf Async für Meteor Version 2.8, https://guide.meteor.com/2.8-migration
     * 
     * @param {String} refOpinion Specifies the opinion
     * @param {String} PDFId Specifies the PDF
     */
    async 'opinions.archivePDFAsync'(refOpinion, PDFId) {
        check(refOpinion, String);
        check(PDFId, String);

        if (!this.userId) {
            throw new Meteor.Error('Not Authorized.');
        }

        let currentUser = await Meteor.users.findOneAsync(this.userId);

        // check if opinion was sharedWith the current User
        const shared = await Opinions.findOneAsync({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Dieses Gutachten wurde nicht mit Ihnen geteilt.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        // Die Berechtigung shareWithExplicitRole wird hier verwendet.
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'shareWithExplicitRole')) {
            throw new Meteor.Error('Sie besitzen keine Berechtigung für die Archivierung von PDFs in diesem Gutachten.');
        }

        /* 
        1. Datei auf Speicher/FS verschieben.
        2. Pfade in Collection anpassen.
            Zur Sicherheit werden folgende Eigenschaften aktualisiert:
            - path (Pfad inkl. Dateiname)
            - _storagePath (nur Pfad!)
            - versions.original.path (Pfad inkl. Dateiname)
        3. meta.archive auf true setzen.
        */
        // Aktuellen Dateipfad auslesen.
        let opinionPdf = OpinionPdfs.findOne({ _id: PDFId , 'meta.refOpinion': refOpinion });
        const src = opinionPdf.versions.original.path;
        // Archivpfad.
        //const archivePath = 'C:/Users/marc.tomaschoff/meteor/DATA/PDF/_Archiv';
        const settings = JSON.parse( process.env.MGP_SETTINGS );
        const archivePath = `${settings.PdfArchivePath}/${moment(opinionPdf.meta.createdAt).format('YYYY')}`;
        // Zielpfad = archivePath inkl. [Jahr der Erstellung des PDFs] + _id.pdf
        const dest = `${archivePath}/${opinionPdf._id}.pdf`;
        //const dest = 'C:/Users/marc.tomaschoff/meteor/DATA/PDF/_Archiv/2022/6xEXNRaJTHd7jnhan.pdf';
        //console.log( dest )
        
        // 1. Datei auf Speicher/FS verschieben
        fs_extra.move( src , dest )
        .then(() => {
            console.log( 'file move successfull!' );
            // Pfade in Collection anpassen und meta.archive auf true setzen.
            OpinionPdfs.update({ _id: PDFId , 'meta.refOpinion': refOpinion }, {
                $set: {
                    'meta.archive': true,
                    'path': dest,
                    '_storagePath': archivePath,
                    'versions.original.path': dest
                }
            });            

            // post a new activity to this opinion
            const activity = injectUserData({ currentUser }, {
                refOpinion,
                refDetail: null,
                type: 'SYSTEM-POST',
                message: `hat das PDF mit ID <strong>${PDFId}</strong> archiviert.`
            }, { created: true });
            
            Activities.insertAsync(activity);
        })
        .catch( err => {
            console.error( err )
        })
    },

    /**
     * Dearchive PDF - Zurücknehmen der Archivierung eines PDFs
     * 
     * @param {String} refOpinion Specifies the opinion
     * @param {String} PDFId Specifies the PDF
     */
     'opinions.dearchivePDF'(refOpinion, PDFId) {
        check(refOpinion, String);
        check(PDFId, String);

        if (!this.userId) {
            throw new Meteor.Error('Not Authorized.');
        }

        let currentUser = Meteor.users.findOne(this.userId);

        // check if opinion was sharedWith the current User
        const shared = Opinions.findOne({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Dieses Gutachten wurde nicht mit Ihnen geteilt.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        // Die Berechtigung shareWithExplicitRole wird hier verwendet.
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'shareWithExplicitRole')) {
            throw new Meteor.Error('Sie besitzen keine Berechtigung für das Zurücknehmen der Archivierung von PDFs in diesem Gutachten.');
        }

        /* 
        1. Datei auf Speicher/FS verschieben.
        2. Pfade in Collection anpassen.
            Zur Sicherheit werden folgende Eigenschaften aktualisiert:
            - path (Pfad inkl. Dateiname)
            - _storagePath (nur Pfad!)
            - versions.original.path (Pfad inkl. Dateiname)
        3. meta.archive auf false setzen.
        */
        // Aktuellen Dateipfad im Archiv auslesen.
        let opinionPdf = OpinionPdfs.findOne({ _id: PDFId , 'meta.refOpinion': refOpinion });
        const src = opinionPdf.versions.original.path;
        // Zielpfad.
        //const dest = `${opinionPdf._storagePath}/${opinionPdf._id}.pdf`;
        const settings = JSON.parse( process.env.MGP_SETTINGS );
        const origPath = `${settings.PdfPath}/${moment(opinionPdf.meta.createdAt).format('YYYY')}`;
        // Zielpfad = origPath inkl. [Jahr der Erstellung des PDFs] + _id.pdf
        const dest = `${origPath}/${opinionPdf._id}.pdf`;
        //console.log( dest )

        // 1. Datei auf Speicher/FS verschieben
        fs_extra.move( src , dest )
        .then(() => {
            console.log( 'file move successfull!' );
            // Pfade in Collection anpassen und meta.archive auf false setzen.
            OpinionPdfs.update({ _id: PDFId , 'meta.refOpinion': refOpinion }, {
                $set: {
                    'meta.archive': false,
                    'path': dest,
                    '_storagePath': origPath,
                    'versions.original.path': dest
                }
            });

            // post a new activity to this opinion
            const activity = injectUserData({ currentUser }, {
                refOpinion,
                refDetail: null,
                type: 'SYSTEM-POST',
                message: `hat das PDF mit ID <strong>${PDFId}</strong> aus dem Archiv zurückgenommen.`
            }, { created: true });
            
            Activities.insert(activity);
        })
        .catch( err => {
            console.error( err )
        })
    },

    /**
     * Dearchive PDF - Zurücknehmen der Archivierung eines PDFs
     * Umstellung auf Async für Meteor Version 2.8, https://guide.meteor.com/2.8-migration
     * 
     * @param {String} refOpinion Specifies the opinion
     * @param {String} PDFId Specifies the PDF
     */
    async 'opinions.dearchivePDFAsync'(refOpinion, PDFId) {
        check(refOpinion, String);
        check(PDFId, String);

        if (!this.userId) {
            throw new Meteor.Error('Not Authorized.');
        }

        let currentUser = await Meteor.users.findOneAsync(this.userId);

        // check if opinion was sharedWith the current User
        const shared = await Opinions.findOneAsync({
            _id: refOpinion,
            "sharedWith.user.userId": this.userId
        });

        if (!shared) {
            throw new Meteor.Error('Dieses Gutachten wurde nicht mit Ihnen geteilt.');
        }

        const sharedWithRole = shared.sharedWith.find( s => s.user.userId == this.userId );
        
        // Die Berechtigung shareWithExplicitRole wird hier verwendet.
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'shareWithExplicitRole')) {
            throw new Meteor.Error('Sie besitzen keine Berechtigung für das Zurücknehmen der Archivierung von PDFs in diesem Gutachten.');
        }

        /* 
        1. Datei auf Speicher/FS verschieben.
        2. Pfade in Collection anpassen.
            Zur Sicherheit werden folgende Eigenschaften aktualisiert:
            - path (Pfad inkl. Dateiname)
            - _storagePath (nur Pfad!)
            - versions.original.path (Pfad inkl. Dateiname)
        3. meta.archive auf false setzen.
        */
        // Aktuellen Dateipfad im Archiv auslesen.
        let opinionPdf = OpinionPdfs.findOne({ _id: PDFId , 'meta.refOpinion': refOpinion });
        const src = opinionPdf.versions.original.path;
        // Zielpfad.
        //const dest = `${opinionPdf._storagePath}/${opinionPdf._id}.pdf`;
        const settings = JSON.parse( process.env.MGP_SETTINGS );
        const origPath = `${settings.PdfPath}/${moment(opinionPdf.meta.createdAt).format('YYYY')}`;
        // Zielpfad = origPath inkl. [Jahr der Erstellung des PDFs] + _id.pdf
        const dest = `${origPath}/${opinionPdf._id}.pdf`;
        //console.log( dest )

        // 1. Datei auf Speicher/FS verschieben
        fs_extra.move( src , dest )
        .then(() => {
            console.log( 'file move successfull!' );
            // Pfade in Collection anpassen und meta.archive auf false setzen.
            OpinionPdfs.update({ _id: PDFId , 'meta.refOpinion': refOpinion }, {
                $set: {
                    'meta.archive': false,
                    'path': dest,
                    '_storagePath': origPath,
                    'versions.original.path': dest
                }
            });

            // post a new activity to this opinion
            const activity = injectUserData({ currentUser }, {
                refOpinion,
                refDetail: null,
                type: 'SYSTEM-POST',
                message: `hat das PDF mit ID <strong>${PDFId}</strong> aus dem Archiv zurückgenommen.`
            }, { created: true });
            
            Activities.insertAsync(activity);
        })
        .catch( err => {
            console.error( err )
        })
    },

    /**
     * PDF löschen - Löschen eines PDFs
     * 
     * @param {String} refOpinion Specifies the opinion
     * @param {String} PDFId Specifies the PDF
     */
     async 'opinions.deletePDF'(refOpinion, PDFId) {
        check(refOpinion, String);
        check(PDFId, String);

        if (!this.userId) {
            throw new Meteor.Error('Not Authorized.');
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
        
        // Die Berechtigung shareWithExplicitRole wird hier verwendet.
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'shareWithExplicitRole')) {
            throw new Meteor.Error('Sie besitzen keine Berechtigung für das Löschen von PDFs.');
        }

        await OpinionPdfs.removeAsync({_id: PDFId}, (error) => {
            if (error) {
              console.error(`File wasn't removed, error:  ${error.reason}`);
            } else {
              console.info('File successfully removed');
            }
        });

        // post a new activity to this opinion
        const activity = await injectUserData({ currentUser }, {
            refOpinion,
            refDetail: null,
            type: 'SYSTEM-POST',
            message: `hat das PDF mit ID <strong>${PDFId}</strong> GELÖSCHT.`
        }, { created: true });
        
        await Activities.insertAsync(activity);
    },

    /**
     * PDF löschen - Löschen eines PDFs
     * Umstellung auf Async für Meteor Version 2.8, https://guide.meteor.com/2.8-migration
     * 
     * @param {String} refOpinion Specifies the opinion
     * @param {String} PDFId Specifies the PDF
     */
    async 'opinions.deletePDFAsync'(refOpinion, PDFId) {
        check(refOpinion, String);
        check(PDFId, String);

        if (!this.userId) {
            throw new Meteor.Error('Not Authorized.');
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
        
        // Die Berechtigung shareWithExplicitRole wird hier verwendet.
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'shareWithExplicitRole')) {
            throw new Meteor.Error('Sie besitzen keine Berechtigung für das Löschen von PDFs.');
        }

        OpinionPdfs.remove({_id: PDFId}, (error) => {
            if (error) {
              console.error(`File wasn't removed, error:  ${error.reason}`);
            } else {
              console.info('File successfully removed');
            }
        });

        // post a new activity to this opinion
        const activity = injectUserData({ currentUser }, {
            refOpinion,
            refDetail: null,
            type: 'SYSTEM-POST',
            message: `hat das PDF mit ID <strong>${PDFId}</strong> GELÖSCHT.`
        }, { created: true });
        
        await Activities.insertAsync(activity);
    },

    /**
     * Creates a CSV Export of the ToDo list for the given Opinion
     * 
     * @param {String} refOpinion Specifies the ID of the opinion
     */
    async 'opinion.ToDoCSVExport'( refOpinion ) {
        check(refOpinion, String);

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }
        const currentUser = await Meteor.users.findOneAsync(this.userId);

        // ... and check then if the current-user is member of sharedWith
        const opinion = await Opinions.findOneAsync({
            _id: refOpinion,
            'sharedWith.user.userId': this.userId
        });

        if (!opinion) {
            throw new Meteor.Error('Das angegebene Gutachten wurde nicht mit Ihnen geteilt. Sie können daher keinen CSV Export erzeugen.');
        }

        const sharedWithRole = opinion.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'opinion.edit')) {
            throw new Meteor.Error('Keine Berechtigung zum Bearbeiten (CSV Export) des angegebenen Gutachtens.');
        }
        let psvOutput = '';
        let detailsTodolist = await OpinionDetails.find({
            refOpinion,
            type: 'QUESTION',
            deleted: false,
            finallyRemoved: false,
            actionCode: { $ne: 'okay' },
            actionText: { $ne: null }
        }, {
            fields: {
                _id: 1,
                printTitle: 1,
                actionCode: 1,
                actionText: 1,
                actionPrio: 1,
                parentPosition: 1,
                position: 1
            },
            sort: {
                actionPrio: 1,
                parentPosition: 1,
                position: 1
            }
        }).fetchAsync();

        // Sortierung der detailsTodolist numerisch.
        /* Das (Sortierung des Arrays) ist notwendig, weil leider Funktionalität Mongo collation nicht enthalten ist unter Meteor.
        Mit collation wäre nur folgendes notwendig in find():        
        collation: {
                locale: 'de',
                numericOrdering: true
            }
        https://forums.meteor.com/t/is-there-a-way-to-use-mongodb-3-4-collation/33024/13
        */
        let sortedDetailsTodolist = [];
        Object.keys( actionCodes ).forEach( code => {
            let filteredItems = detailsTodolist.filter( item => item.actionCode === code );
            filteredItems = filteredItems.sort( (a , b) => {
                if ( !a
                  || !a.parentPosition
                  || !a.position )
                    return -1;
                else if ( !b
                       || !b.parentPosition
                       || !b.position )
                    return 1;
                return (a.parentPosition.toString() + a.position.toString()).localeCompare( (b.parentPosition.toString() + b.position.toString()) , undefined , { numeric: true } );
            });

            filteredItems.forEach( item => {
                sortedDetailsTodolist.push( item );
            });
        });

        //console.log( sortedDetailsTodolist.length );
        if ( sortedDetailsTodolist.length > 0 ) {
            const columns = { nummer: 'Lfd.Nr.', frage: 'Frage', massnahme: 'Maßnahme', handlungsbedarf: 'Handlungsbedarf' };
            let csvData = [];
            console.log( sortedDetailsTodolist );
            sortedDetailsTodolist.forEach( ( item , index ) => {
                // Fragen können Leerzeichen enthalten, daher diese entfernen, falls vorhanden.
                let frage = item.printTitle;
                frage = frage.replace( /\n/g , '' );
                // Semikolon entfernen, da dies das CSV Trennzeichen ist.
                frage = frage.replace( /;/g , '' );
                // Maßnahmen können HTML Tags enthalten, daher diese entfernen, falls vorhanden.
                let actionText = item.actionText;
                actionText = actionText.replace( /<p>/g , '' );
                actionText = actionText.replace( /<\/p>/g , '' );
                actionText = actionText.replace( /<div>/g , '' );
                actionText = actionText.replace( /<\/div>/g , '' );
                actionText = actionText.replace( /<br>/g , '' );
                actionText = actionText.replace( /&nbsp/g , ' ' );
                actionText = actionText.replace( /\n/g , '' );
                // => Zunächst nur die Zeilenumbrüche und Leerzeichen, Formatierungen etc. sollen sichtbar bleiben.
                /*actionText = actionText.replace( /<b>/g , '' );
                actionText = actionText.replace( /<\/b>/g , '' );
                actionText = actionText.replace( /<u>/g , '' );
                actionText = actionText.replace( /<\/u>/g , '' );
                actionText = actionText.replace( /<i>/g , '' );
                actionText = actionText.replace( /<\/i>/g , '' );*/
                // Semikolon entfernen, da dies das CSV Trennzeichen ist.
                actionText = actionText.replace( /;/g , '' );
                const dataSet = {
                    nummer: index+1,
                    massnahme: actionText,
                    frage: frage,
                    handlungsbedarf: actionCodes[ item.actionCode ].text
                }
                csvData.push( dataSet );
            });
            //console.log( csvData );
            // Convert the object list to an array list using Sifter
            const arrList = Sifter.toArrayList( columns , csvData );
            //console.log( arrList );
            // Print the array list as a CSV string using Printer
            //Printer.printAsCSV( arrList );

            // Create a PSV table string from the array list using Renderer
            psvOutput = Renderer.toDelimitedTable( arrList , ';' );
            //console.log( psvOutput );
        }
        return psvOutput;
    },

    /**
     * Creates a new PDF for the given Opinion and store the
     * file in the files collection to get a secure download
     * 
     * @param {String} refOpinion Specifies the ID of the opinion
     * @param {Boolean} previewOnly Specifies whether the pdf should 
     *                              be renderd as preview and will not saved 
     *                              to disk or without preview stored in the system
     */
    async 'opinion.createPDF'(refOpinion, previewOnly = false , iProtected = false ) {
        check(refOpinion, String);
        check(previewOnly, Match.OneOf(String, Boolean));

        if (!this.userId) {
            throw new Meteor.Error('Not authorized.');
        }
        const currentUser = await Meteor.users.findOneAsync(this.userId);

        // ... and check then if the current-user is member of sharedWith
        const opinion = await Opinions.findOneAsync({
            _id: refOpinion,
            'sharedWith.user.userId': this.userId
        });

        if (!opinion) {
            throw new Meteor.Error('Das angegebene Gutachten wurde nicht mit Ihnen geteilt. Sie können daher kein PDF erzeugen.');
        }

        const sharedWithRole = opinion.sharedWith.find( s => s.user.userId == this.userId );
        
        if (!hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'opinion.edit')) {
            throw new Meteor.Error('Keine Berechtigung zum Bearbeiten (Erstellen eines PDF) des angegebenen Gutachtens.');
        }

        rePositionDetails(refOpinion, { reRenderHtmlContent: true });
        const details = await OpinionDetails.find({
            refOpinion,
            deleted: false,
            finallyRemoved: false
        }).fetchAsync();
        
        let detailsTodolist = await OpinionDetails.find({
            refOpinion,
            type: 'QUESTION',
            deleted: false,
            finallyRemoved: false,
            actionCode: { $ne: 'okay' },
            actionText: { $ne: null }
        }, {
            fields: {
                _id: 1,
                actionCode: 1,
                actionText: 1,
                actionPrio: 1,
                parentPosition: 1,
                position: 1
            },
            sort: {
                actionPrio: 1,
                parentPosition: 1,
                position: 1
            }
        }).fetchAsync();

        // Sortierung der detailsTodolist numerisch.
        /* Das (Sortierung des Arrays) ist notwendig, weil leider Funktionalität Mongo collation nicht enthalten ist unter Meteor.
        Mit collation wäre nur folgendes notwendig in find():        
        collation: {
                locale: 'de',
                numericOrdering: true
            }
        https://forums.meteor.com/t/is-there-a-way-to-use-mongodb-3-4-collation/33024/13
        */
        let sortedDetailsTodolist = [];
        Object.keys( actionCodes ).forEach( code => {
            let filteredItems = detailsTodolist.filter( item => item.actionCode === code );
            filteredItems = filteredItems.sort( (a , b) => {
                if ( !a
                  || !a.parentPosition
                  || !a.position )
                    return -1;
                else if ( !b
                       || !b.parentPosition
                       || !b.position )
                    return 1;
                return (a.parentPosition.toString() + a.position.toString()).localeCompare( (b.parentPosition.toString() + b.position.toString()) , undefined , { numeric: true } );
            });

            filteredItems.forEach( item => {
                sortedDetailsTodolist.push( item );
            });
        });

        const images = await Images.find({
            'meta.refOpinion': refOpinion
        }).fetchAsync();
        
        let fileData, fileRef;

        try {
            let filename;
            // async pdfCreate ( opinion , opinionDetails , detailsTodoList , images , path , hasAbbreviationsPage = true , hasToC = true , print = false , ToCPageNos = true )
            if (previewOnly === 'livepreview') {
                filename = await opinionDocumenter.pdfCreate(opinion, details, sortedDetailsTodolist, images , settings.PdfPath, opinion.hasAbbreviationsPage, false, true, false);
            } else {
                filename = await opinionDocumenter.pdfCreate(opinion, details, sortedDetailsTodolist, images , settings.PdfPath, opinion.hasAbbreviationsPage);
            }

            fileData = await readFile(filename);

            /*if ( iProtected && !previewOnly ) {
                // Verschlüsselung...
                // https://medium.com/aia-sg-techblog/implementing-encryption-feature-in-pdf-lib-112091bce9af
                // 1000 0000 1100 => 2060
                // 1000 0010 0100 => 2084
                fileData = pdfence.fromBufferToBuffer(fileData, {
                    userPassword: refOpinion.substring( 0 , 4 ),//'123', // required
                    ownerPassword: refOpinion,//'12345', // optional
                    //userProtectionFlag: 4
                    userProtectionFlag: 2084
                })
            }*/

            ///**/OpinionPdfs.config.storagePath = storagePath.config.storagePath + '/12345';
            fileRef = await OpinionPdfs.write(fileData, {
                fileName: `${refOpinion}.pdf`,
                type: 'application/pdf',
                meta: {
                    refOpinion, 
                    preview: !!previewOnly,
                    createdAt: new Date(), 
                    createdBy: {
                        userId: currentUser._id,
                        firstName: currentUser.userData.firstName,
                        lastName: currentUser.userData.lastName
                    },
                    //protected: iProtected && !previewOnly
                    //archive: false
                }
            });

            if (previewOnly) {
                // löschen der Previewversion
                Meteor.setTimeout(async () => {
                    await OpinionPdfs.removeAsync({_id: fileRef._id});
                }, 1000 * 60 /* 1 Minute */)
            }

            fs.unlinkSync(filename);
        } catch (err) {
            throw new Meteor.Error(err);
        }
        const opinionPdf = await OpinionPdfs.findOneAsync({_id:fileRef._id}); 
        const result = opinionPdf.link()
        //if (previewOnly) {
            return result;
        //}
    }
});