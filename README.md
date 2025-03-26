# Gutachten Plus

Ein Tool zum Erstellen eines Gutachten.

## App starten

```
git checkout meteor_update
nvm use
meteor npm i --legacy-peer-deps
npx patch-package
export MGP_SETTINGS='{\"ImagePath\":\"/PATH_TO/data/images\",\"PdfPath\":\"/PATH_TO/data/pdf\",\"AvatarsPath\":\"/PATH_TO/data/avatars\"}' meteor
```

## Version 1

Das ist die Version, die wir als Pilot zu anfg. Januar in Betrieb nehmen.
geplanter `Going-Live: KW 3`

## Offene Punkte

### Development MT
- [x] Prüfung anderer PDF-Reader-Tools
- [x] PDF Erstellung / Ablage des generierten PDFs
- [x] HTML/PDF-Formatierung / Rendering gem. Gutachtenvorlagen JK
- [x] Result des package sollte der generierte HTML-Code sein
- [x] Detail `Titel im Druck` immer im Ausdruck verwandt (auch Inhaltsverz.) Ist das Feld leer, so wird kein Titel gedruckt.
- [x] npm Publish PDF-Erstellung
- [x] Zeige Detailpunkt im Inhaltsverzeichnis J/N
- [x] Variablen handling
  - [x] Interne Variablen ausprogrammieren z.B. `${Druckdatum}`
  > ${Druckdatum}, ${Gutachtennummer}, ${Firma}, ${Gutachtername1}, ${Gutachtername2}
  - [x] Auflistung aller verwandten Variablen z.B. "{{Kunde}}"
  - [x] Dynamischer Replace von Opinion-Variablen
- [x] `pagebreakBefore` implementieren
- [x] `pagebreakAfter` implementieren


**Erledigte Punkte:**
- [x] Generierung der Signaturen inkl. richtigem Stempel
> Die Signaturen werden nicht generiert sondern über einen eigenen Detailpunkt am Ende des Gutachtens abgebildet und jeder Gutachter muss seinen Stempel und Unterschrift ind. als Bild einfügen.



### Development RStH
- [x] Generiere opinionNo beim Neuzugang
- [x] Neues Feld im `OpinionDetail` > `showInToc` in Oberfläche integrieren
- [x] Opinion und OpininoDetail-Felder abgleichen und implementieren mit Edelrahm RS-MT
- [x] Einbindung PDF-Erstellung in Edelrahm
- [x] Benutzermanagement (Logout, Passwort ändern)
- [x] Teilen des Gutachtens mit anderen Benutzers
- [x] Stammdatenverwaltung (Bearbeitung von Teilnehmern, Gutachter 1, 2 usw.)
- [x] Neuanlage Gutachten
  - [x] Erstellen einer Vorlage
  - [x] Erstellen eines Gutachtens auf Basis eines anderen Gutachtens X
- [x] Bearbeitung eines Detailpunkts
  - [x] Pflege des Maßnahmentextes zu einem Detail vom Typ "Frage"
  - [x] Pflege des "Maßnahmen-Default" für den Typ "Antwort"
  - [x] Pflege abhängig vom Typ machen
- [ ] Bilder
  - [x] Ablageort prüfen
  - [x] Komprimierung
  - [ ] mehrere Bilder zu einem OpinionDetail-Eintrag verwalten (hinzufügen, löschen)
- [x] Menu vollständig einklappbar
- [x] Aktivitätsleiste vollständig einklappbar
- [x] Übernahme der Maßnahmen inkl. Maßnahmentexte in Punkt 8 - Abschlussbetrachtung
- [x] Verwaltung von Variablen, die dynamisch im Gutachten ersetzt werden
  - [x] Beim erstellen eines Gutachten auf Basis einer Vorlage, müssen die Variablen übernommen werden, jedoch die aktuellen Werte gelöscht sein.
- [x] Zeige Detailpunkt im Inhaltsverzeichnis J/N
- [ ] UI-Optimierungen für Tablet und Smartphones ( medium and small devices )
- [x] Opiniondetails `pagebreakBefore` implementieren
- [x] Opiniondetails `pagebreakAfter` implementieren
> Eigenes Detail `PageBreak` erstellt inkl. Darstellung für Endbenutzer
- [x] Opiniondetails Check-Answer
- [x] Selectbox layouttypes sortiert nach Name
- [x] Dropdown Gutachter - Feld zurücksetzen/leeren nicht möglich
- [x] Benutzerprofil bearbeiten


### IT Operations
- [x] Hosting
- [x] Backup

### Going-Live Vorbereitungen
- [ ] Update `printTitle` mit Wert aus `Title` über alle `OpinionDetails`
- [ ] Nach Datenübernahme muss das Feld einmalig `internalOrderId` rekursiv berechnet werden
- [ ] Replace der Variablen `@Kunde@` und `@ProjektleiterKunde@` mit den neuen Variablen `{{xxx}}`
- [ ] Hinzufügen der neuen Variablen in der Gutachtenvorlage (insert)

### Consulting JK/MSC über HP

- [ ] Überarbeitung und textuelle Fertigstellung der Gutachtenvorlage
- [ ] OpinionDetails vom Typ Definitionen vgl. 4.5.1 und 4.5.3 von JK-Gutachten sollten als Text zur Frage aufgenommen werden
- [ ] Ggf. weitere Vorlagen erstellen z.B. "Kurzgutachten" / "Assessment"


## Version 1.1

Alle Punkte, die noch erledigt werden müssen um die Version 1 "rund zu machen"

- [ ] Benutzerverwaltung Administration
  - [ ] Neuanlage von Benutzers
  - [ ] Rollenzuweisung/Administration für bestehende Benutzer
  - [ ] Sperren einzelner Benutzer

- [ ] Einladen von "fremden" in das System, wenn diese noch nicht als Benutzer geführt sind
- [ ] Workflow

## Version 1.2

Weitere Punkte, die ggf. das Leben erleichtern

- [ ] Gutachtenerstellung auf basis bereits erstellter Gutachten
  - [ ] Detaillierte Besprechung mit JK
  - [ ] Kopierfunktion bestehendes Gutachten mit "Rücksetzung" der gegebenen Antworten
  - [ ] Einfügefunktion um bereits formulierte Texte (Fragen, Antworten) aus bereits erstellten Gutachten zu übernehmen
- [x] Sortierung der Detailpunkte via Drag & Drop
- [ ] Suchfunktion für Inhalte und Titel/Detailpunkte
- [ ] Filterfunktion in Tabelle der Gutachten


## geplante Punkte für Version 2

Weitere geplante Punkte ohne Priorisierung
- [ ] Authentifizierung OAuth / OAuth 2.0
- [ ] Aufgabenmanagement
- [ ] Erstellen von Aufgaben ausgehend vom Gutachten (Abschlussbetrachtung)
- [ ] Benutzer könnem indv. Aufgaben erstellen
- [ ] Führen der OPL als Aufgaben
- [ ] Gemeinsames Arbeiten mit dem Kunden
  
## Version 3

Kundenportal für Consulting und Ablage aller erstellter Dokumente
aus Teams/M-Files, so dass dieses Portal der zentrale Ort für den Kunden und unsere Kollegen wird.


## Punkte zum besprechen

- [x] Nennung der Uhrzeiten Tageweise sinnvoll? Ggf. alternative hierfür => Beschluss: Uhrzeiten werden im System nicht erfasst/angezeigt.
- [ ] Auflistung der TN mit oder ohne Anrede? Aktuell ohne Anrede, da ggf. Anrede falsch eingegeben wird der Fehler nicht gezeigt
- [ ] Darstellung des Abkürzungsverzeichnis als eigene Detailpunkte und manuelle Pflege im Gutachten möglich?
