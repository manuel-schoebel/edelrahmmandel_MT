import { OpinionPdfs } from '../../imports/api/collections/opinion-pdfs';
/* RS, 18.11.2021
Durch die neue PDF-Vorschau siehe issue #70 werden nun die PDF-Files wieder alle
auf dem Server gespeichert. Die nur zum Zwecke einer Vorschau generiert wurden werden automatisch nach
einem Timeout von 6 Min. gelöscht. Sollte nun der Dienst beendet werden und der Timeout ist noch nicht
erfolgt, so bleibt die PDF-Datei für immer erhalten. Hierfür werden beim Start der Server-Anwendung
alle PDF-Vorschau-Dateien gelöscht
*/

console.log( 'Remove PDFs with meta.preview = true ...' );

try{
    await OpinionPdfs.removeAsync({'meta.preview': true});
} catch(e) {
    console.log('Error removing pdfs', e.message)
}

console.log( 'Remove PDFs with meta.preview = true; (done)' );
