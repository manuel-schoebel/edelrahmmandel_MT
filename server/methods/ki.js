import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Opinions } from '../../imports/api/collections/opinions';
import { hasPermission } from '../../imports/api/helpers/roles';

//import OpenAI from 'openai';
import axios from 'axios';

Meteor.methods({
    /**
     * Befragt unsere KI.
     * 
     * @param {String} questionText Specifies a searchText
     */
    async 'ki.sendQuestionToKIAgent'( questionText , refOpinion ){
        check( refOpinion , String );
        if ( questionText !== undefined && questionText !== null ) {
            check( questionText , String );
        }

        if ( !this.userId ) {
            throw new Meteor.Error( 'Not authorized.' );
        }
        
        const currentUser = await Meteor.users.findOneAsync( this.userId );

        // ... and check then if the current-user is member of sharedWith
        const opinion = await Opinions.findOneAsync({
            _id: refOpinion,
            'sharedWith.user.userId': this.userId
        });

        if ( !opinion ) {
            throw new Meteor.Error( 'Das angegebene Gutachten wurde nicht mit Ihnen geteilt. Sie können daher die KI nicht befragen zu diesem Gutachten.' );
        }

        const sharedWithRole = opinion.sharedWith.find( s => s.user.userId == this.userId );
        
        if ( !await hasPermission({ currentUser, sharedRole: sharedWithRole.role }, 'opinion.edit' )) {
            throw new Meteor.Error( 'Keine Berechtigung zum Bearbeiten des angegebenen Gutachtens. Sie können daher die KI nicht befragen zu diesem Gutachten.' );
        }

        // Berechtigung ist vorhanden.
        // Ab hier KI Abfrage.
        const useAgent = true;// Wird hier erst mal manuell gesetzt: Agent soll benutzt werden oder allgemeine KI

        let APIURL;
        let APIKey;
        if ( Meteor.isServer ) {
            const settings = JSON.parse( process.env.MGP_SETTINGS );
            if ( useAgent ) {
                // Über den Agent.
                APIURL = settings.KIAPIURL_Agent;
                APIKey = settings.KIAPIKey_Agent;
            }
            else {
                // Über die allgemeine KI.
                APIURL = settings.KIAPIURL;
                APIKey = settings.KIAPIKey;
            }
        }
        else {
            console.log( 'Der Client-seitige Aufruf ist nicht erlaubt!' );
            return 'F E H L E R: Client-Aufruf';
        }
        
        const client = axios.create({
            headers: { 'Authorization': 'Bearer ' + APIKey , 'Content-Type': 'application/json' }
        });

        let params;
        if ( useAgent ) {
            params = {
                "query": questionText
            }
            /*params = {
                //"query":"<string>","conversationId":"<string>","visitorId":"<string>","temperature":123,"streaming":false,"modelName":"localmind-pro","maxTokens":123,"presencePenalty":123,"frequencyPenalty":123,"topP":123,"filters":{"custom_ids":["<string>"],"datasource_ids":["<string>"]},"systemPrompt":"<string>","userPrompt":"<string>","promptType":"raw","promptTemplate":"<string>"
                "query": "Wie ist dein Name?",
                //"conversationId": "<string>",
                //"visitorId": "<string>"
                "temperature": 0.2,
                "streaming": false,
                "modelName": "localmind-pro",
                "maxTokens": 500,
                "presencePenalty": 0,
                "frequencyPenalty": 0,
                //"topP":123,
                //"filters":{"custom_ids":["<string>"],"datasource_ids":["<string>"]},
                "systemPrompt": "123",
                "userPrompt": "123"
                //,"promptType":"raw",
                //"promptTemplate":"<string>"
            }*/
        }
        else {
            params = {
                "model": "localmind-pro",
                "messages": [
                    {
                        "role": "system",
                        "content": "Dein Name ist MEBEDO ACE Agent und du bist ein Elektrotechnik Spezialist bei MEBEDO. Als Elektrotechnik Spezialist gibst du hilfreiche, stichhaltige, präzise und professionelle Antworten auf Fragen der Benutzer. Halte deine Antworten kurz, präzise, strukturiert und deine Antworten sollen stets geprägt sein durch hohes Niveau und außergewöhnliches Know-How."
                    },
                    {
                        "role": "user",
                        "content": questionText
                    }
                ]
            }
        }

        let resTxt;
        await client.post( APIURL , params )
          .then( result => {
            if ( useAgent ) {
                //console.log( result.data.answer );
                resTxt = result.data.answer;
            }
            else {
                //console.log( result.data.choices[0].message.content );
                resTxt = result.data.choices[0].message.content;
            }
           
            // Anführungszeichen entfernen aus Ergebnistext.
            resTxt = resTxt.replace( /\"/g , '' );
        }).catch( err => {
            console.log( 'FEHLER!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!' );
            console.log(err);
        });
        return resTxt;
    }
});