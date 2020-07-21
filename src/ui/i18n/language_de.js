
var smoLanguageStringEn = `[
 {
  "ctor": "SuiLoadFileDialog",
  "label": "Datei laden",
  "dialogElements": [
   {}
  ]
 },
 {
  "ctor": "SuiSaveFileDialog",
  "label": "Score speichern",
  "dialogElements": [
   {
    "label": "File Name",
    "id": "saveFileName"
   }
  ]
 },
 {
  "ctor": "SuiPrintFileDialog",
  "label": "Druck abgeschlossen",
  "dialogElements": []
 },
 {
  "ctor": "SuiMeasureDialog",
  "label": "Takt Voreinstellungen",
  "dialogElements": [
   {
    "label": "Takt Pickup",
    "id": "pickupMeasure",
    "options": [
     {
      "value": 2048,
      "label": "1/8 Note"
     },
     {
      "value": 4096,
      "label": "1/4 Note"
     },
     {
      "value": 6144,
      "label": "punktierte 1/4 Note"
     },
     {
      "value": 8192,
      "label": "1/2 Note"
     }
    ]
   },
   {
    "label": "Konvertiere zu Takt Pickup",
    "id": "makePickup"
   },
   {
    "label": "Pad Left (px)",
    "id": "padLeft"
   },
   {
    "label": "Inhalte strecken",
    "id": "customStretch"
   },
   {
    "label": "Zwischenräume proportional anpassen",
    "id": "customProportion"
   },
   {
    "label": "Alle Takte auffüllen",
    "id": "padAllInSystem"
   },
   {
    "label": "Takt Text",
    "id": "measureText"
   },
   {
    "label": "Text Position",
    "id": "measureTextPosition",
    "options": [
     {
      "value": 2,
      "label": "Links"
     },
     {
      "value": 3,
      "label": "Rechts"
     },
     {
      "value": 0,
      "label": "Oben"
     },
     {
      "value": 1,
      "label": "Unten"
     }
    ]
   },
   {
    "label": "Seitenumbruch vor diesem Takt",
    "id": "systemBreak"
   }
  ]
 },
 {
  "ctor": "SuiTempoDialog",
  "label": "Tempo Voreinstellungen",
  "dialogElements": [
   {
    "label": "Tempo Modus",
    "id": "tempoMode",
    "options": [
     {
      "value": "duration",
      "label": "Dauer (Beats/Minute)"
     },
     {
      "value": "text",
      "label": "Tempo Text"
     },
     {
      "value": "custom",
      "label": "Text und Dauer festlegen"
     }
    ]
   },
   {
    "label": "Beats/Minute",
    "id": "bpm"
   },
   {
    "label": "Einheit für Beat",
    "id": "beatDuration",
    "options": [
     {
      "value": 4096,
      "label": "1/4 Note"
     },
     {
      "value": 2048,
      "label": "1/8 Note"
     },
     {
      "value": 6144,
      "label": "punktierte 1/4 Note"
     },
     {
      "value": 8192,
      "label": "1/2 Note"
     }
    ]
   },
   {
    "label": "Tempo Text",
    "id": "tempoText",
    "options": [
     {
      "value": "Larghissimo",
      "label": "Larghissimo"
     },
     {
      "value": "Grave",
      "label": "Grave"
     },
     {
      "value": "Lento",
      "label": "Lento"
     },
     {
      "value": "Largo",
      "label": "Largo"
     },
     {
      "value": "Larghetto",
      "label": "Larghetto"
     },
     {
      "value": "Adagio",
      "label": "Adagio"
     },
     {
      "value": "Adagietto",
      "label": "Adagietto"
     },
     {
      "value": "Andante moderato",
      "label": "Andante moderato"
     },
     {
      "value": "Andante",
      "label": "Andante"
     },
     {
      "value": "Andantino",
      "label": "Andantino"
     },
     {
      "value": "Moderato",
      "label": "Moderato"
     },
     {
      "value": "Allegretto",
      "label": "Allegretto"
     },
     {
      "value": "Allegro",
      "label": "Allegro"
     },
     {
      "value": "Vivace",
      "label": "Vivace"
     },
     {
      "value": "Presto",
      "label": "Presto"
     },
     {
      "value": "Prestissimo",
      "label": "Prestissimo"
     }
    ]
   },
   {
    "label": "Apply to all future measures?",
    "id": "applyToAll"
   },
   {
    "label": "Display Tempo",
    "id": "display"
   }
  ]
 },
 {
  "ctor": "SuiTimeSignatureDialog",
  "label": "benutzerdefinierte Taktmessung",
  "dialogElements": [
   {
    "label": "Beats/Measure",
    "id": "numerator"
   },
   {
    "label": "Beat Value",
    "id": "denominator",
    "options": [
     {
      "value": 8,
      "label": "8"
     },
     {
      "value": 4,
      "label": "4"
     },
     {
      "value": 2,
      "label": "2"
     }
    ]
   }
  ]
 },
 {
  "ctor": "SuiLayoutDialog",
  "label": "Score Layout",
  "dialogElements": [
   {
    "label": "Seitengröße",
    "id": "pageSize",
    "options": [
     {
      "value": "letter",
      "label": "Brief"
     },
     {
      "value": "tabloid",
      "label": "Tabloid (11x17)"
     },
     {
      "value": "A4",
      "label": "A4"
     },
     {
      "value": "custom",
      "label": "benutzerdefiniert"
     }
    ]
   },
   {
    "label": "Seitenbreite (px)",
    "id": "pageWidth"
   },
   {
    "label": "Seitenhöhe (px)",
    "id": "pageHeight"
   },
   {
    "label": "Ausrichtung",
    "id": "orientation",
    "options": [
     {
      "value": 0,
      "label": "Hochformat"
     },
     {
      "value": 1,
      "label": "Querformat"
     }
    ]
   },
   {
    "label": "Schriftart",
    "id": "engravingFont",
    "options": [
     {
      "value": "Bravura",
      "label": "Bravura"
     },
     {
      "value": "Gonville",
      "label": "Gonville"
     },
     {
      "value": "Petaluma",
      "label": "Petaluma"
     }
    ]
   },
   {
    "label": "Einzug links (px)",
    "id": "leftMargin"
   },
   {
    "label": "Einzug rechts (px)",
    "id": "rightMargin"
   },
   {
    "label": "Einzug oben (px)",
    "id": "topMargin"
   },
   {
    "label": "Inter-System Margin",
    "id": "interGap"
   },
   {
    "label": "Intra-System Margin",
    "id": "intraGap"
   },
   {
    "label": "% Zoom",
    "id": "zoomScale"
   },
   {
    "label": "% Notengröße",
    "id": "svgScale"
   }
  ]
 },
 {
  "ctor": "SuiDynamicModifierDialog",
  "label": "Dynamics Voreinstellungen",
  "dialogElements": [
   {
    "label": "Y Linie",
    "id": "yOffsetLine"
   },
   {
    "label": "Y Offset Px",
    "id": "yOffsetPixels"
   },
   {
    "label": "X Offset",
    "id": "xOffset"
   },
   {
    "label": "Text",
    "id": "text",
    "options": [
     {
      "value": "p",
      "label": "Piano"
     },
     {
      "value": "pp",
      "label": "Pianissimo"
     },
     {
      "value": "mp",
      "label": "Mezzo-Piano"
     },
     {
      "value": "mf",
      "label": "Mezzo-Forte"
     },
     {
      "value": "f",
      "label": "Forte"
     },
     {
      "value": "ff",
      "label": "Fortissimo"
     },
     {
      "value": "sfz",
      "label": "Sforzando"
     }
    ]
   }
  ]
 },
 {
  "ctor": "SuiSlurAttributesDialog",
  "label": "Bogen Properties",
  "dialogElements": [
   {
    "label": "Abstand",
    "id": "spacing"
   },
   {
    "label": "Stärke",
    "id": "thickness"
   },
   {
    "label": "X Offset",
    "id": "xOffset"
   },
   {
    "label": "Y Offset",
    "id": "yOffset"
   },
   {
    "label": "Startposition",
    "id": "position",
    "options": [
     {
      "value": 1,
      "label": "Head"
     },
     {
      "value": 2,
      "label": "Top"
     }
    ]
   },
   {
    "label": "Endposition",
    "id": "position_end",
    "options": [
     {
      "value": 1,
      "label": "Head"
     },
     {
      "value": 2,
      "label": "Top"
     }
    ]
   },
   {
    "label": "Umkehren",
    "id": "invert"
   },
   {
    "label": "Kontrollpunkt 1 X",
    "id": "cp1x"
   },
   {
    "label": "Kontrollpunkt 1 Y",
    "id": "cp1y"
   },
   {
    "label": "Kontrollpunkt 2 X",
    "id": "cp2x"
   },
   {
    "label": "Kontrollpunkt 2 Y",
    "id": "cp2y"
   }
  ]
 },
 {
  "ctor": "SuiVoltaAttributeDialog",
  "label": "Wiederholungsklammern Einstellungen",
  "dialogElements": [
   {
    "label": "number",
    "id": "Nummer"
   },
   {
    "label": "X1 Offset",
    "id": "xOffsetStart"
   },
   {
    "label": "X2 Offset",
    "id": "xOffsetEnd"
   },
   {
    "label": "Y Offset",
    "id": "yOffset"
   }
  ]
 },
 {
  "ctor": "SuiHairpinAttributesDialog",
  "label": "Haarnadel Einstellungen",
  "dialogElements": [
   {
    "label": "Höhe",
    "id": "height"
   },
   {
    "label": "Y Shift",
    "id": "yOffset"
   },
   {
    "label": "Right Shift",
    "id": "xOffsetRight"
   },
   {
    "label": "Left Shift",
    "id": "xOffsetLeft"
   }
  ]
 },
 {
  "ctor": "SuiAddStaffMenu",
  "label":"Notenschlüssel",
  "menuItems": [
   {
    "value": "trebleInstrument",
    "text": "Violinschlüssel"
   },
   {
    "value": "bassInstrument",
    "text": "Basschlüssel"
   },
   {
    "value": "altoInstrument",
    "text": "Altschlüssel"
   },
   {
    "value": "tenorInstrument",
    "text": "Tenorschlüssel"
   },
   {
    "value": "remove",
    "text": "Notenschlüssel entfernen"
   },
   {
    "value": "cancel",
    "text": "Abbrechen"
   }
  ]
 },
 {
  "ctor": "SuiFileMenu",
  "label":"Datei",
  "menuItems": [
   {
    "value": "newFile",
    "text": "Neu"
   },
   {
    "value": "openFile",
    "text": "Öffnen"
   },
   {
    "value": "saveFile",
    "text": "Speichern"
   },
   {
    "value": "quickSave",
    "text": "Schnellspeichern"
   },
   {
    "value": "printScore",
    "text": "Drucken"
   },
   {
    "value": "bach",
    "text": "Bach Invention"
   },
   {
    "value": "bambino",
    "text": "Jesu Bambino"
   },
   {
    "value": "microtone",
    "text": "Microtone Sample"
   },
   {
    "value": "preciousLord",
    "text": "Precious Lord"
   },
   {
    "value": "cancel",
    "text": "Abbrechen"
   }
  ]
 },
 {
  "ctor": "SuiTimeSignatureMenu",
  "label": "Taktzeit",
  "menuItems": [
   {
    "value": "6/8",
    "text": "6/8"
   },
   {
    "value": "3/4",
    "text": "3/4"
   },
   {
    "value": "2/4",
    "text": "2/4"
   },
   {
    "value": "12/8",
    "text": "12/8"
   },
   {
    "value": "7/8",
    "text": "7/8"
   },
   {
    "value": "5/8",
    "text": "5/8"
   },
   {
    "value": "TimeSigOther",
    "text": "benutzerdefiniert"
   },
   {
    "value": "cancel",
    "text": "Abbrechen"
   }
  ]
 },
 {
  "ctor": "SuiKeySignatureMenu",
  "label": "Tonlage",
  "menuItems": [
   {
    "value": "KeyOfC",
    "text": "C Major"
   },
   {
    "value": "KeyOfF",
    "text": "F Major"
   },
   {
    "value": "KeyOfG",
    "text": "G Major"
   },
   {
    "value": "KeyOfBb",
    "text": "Bb Major"
   },
   {
    "value": "KeyOfD",
    "text": "D Major"
   },
   {
    "value": "KeyOfEb",
    "text": "Eb Major"
   },
   {
    "value": "KeyOfA",
    "text": "A Major"
   },
   {
    "value": "KeyOfAb",
    "text": "Ab Major"
   },
   {
    "value": "KeyOfE",
    "text": "E Major"
   },
   {
    "value": "KeyOfDb",
    "text": "Db Major"
   },
   {
    "value": "KeyOfB",
    "text": "B Major"
   },
   {
    "value": "KeyOfF#",
    "text": "F# Major"
   },
   {
    "value": "KeyOfC#",
    "text": "C# Major"
   },
   {
    "value": "cancel",
    "text": "Abbrechen"
   }
  ]
 },
 {
  "ctor": "SuiTimeSignatureMenu",
  "menuItems": [
   {
    "value": "6/8",
    "text": "6/8"
   },
   {
    "value": "3/4",
    "text": "3/4"
   },
   {
    "value": "2/4",
    "text": "2/4"
   },
   {
    "value": "12/8",
    "text": "12/8"
   },
   {
    "value": "7/8",
    "text": "7/8"
   },
   {
    "value": "5/8",
    "text": "5/8"
   },
   {
    "value": "TimeSigOther",
    "text": "benutzerdefiniert"
   },
   {
    "value": "cancel",
    "text": "Abbrechen"
   }
  ]
 },
 {
  "ctor": "SuiKeySignatureMenu",
  "menuItems": [
   {
    "value": "KeyOfC",
    "text": "C Major"
   },
   {
    "value": "KeyOfF",
    "text": "F Major"
   },
   {
    "value": "KeyOfG",
    "text": "G Major"
   },
   {
    "value": "KeyOfBb",
    "text": "Bb Major"
   },
   {
    "value": "KeyOfD",
    "text": "D Major"
   },
   {
    "value": "KeyOfEb",
    "text": "Eb Major"
   },
   {
    "value": "KeyOfA",
    "text": "A Major"
   },
   {
    "value": "KeyOfAb",
    "text": "Ab Major"
   },
   {
    "value": "KeyOfE",
    "text": "E Major"
   },
   {
    "value": "KeyOfDb",
    "text": "Db Major"
   },
   {
    "value": "KeyOfB",
    "text": "B Major"
   },
   {
    "value": "KeyOfF#",
    "text": "F# Major"
   },
   {
    "value": "KeyOfC#",
    "text": "C# Major"
   },
   {
    "value": "cancel",
    "text": "Abbrechen"
   }
  ]
 },
 {
  "ctor": "SuiFileMenu",
  "menuItems": [
   {
    "value": "newFile",
    "text": "Neu"
   },
   {
    "value": "openFile",
    "text": "Öffnen"
   },
   {
    "value": "saveFile",
    "text": "Speichern"
   },
   {
    "value": "quickSave",
    "text": "Schnellspeichern"
   },
   {
    "value": "printScore",
    "text": "Drucken"
   },
   {
    "value": "bach",
    "text": "Bach Invention"
   },
   {
    "value": "bambino",
    "text": "Jesu Bambino"
   },
   {
    "value": "microtone",
    "text": "Microtone Sample"
   },
   {
    "value": "preciousLord",
    "text": "Precious Lord"
   },
   {
    "value": "cancel",
    "text": "Abbrechen"
   }
  ]
 },
 {
  "ctor": "SuiStaffModifierMenu",
  "label": "Lines",
  "menuItems": [
   {
    "value": "crescendo",
    "text": "Crescendo"
   },
   {
    "value": "decrescendo",
    "text": "Decrescendo"
   },
   {
    "value": "slur",
    "text": "Bogen/Bindung"
   },
   {
    "value": "ending",
    "text": "nth Ende"
   },
   {
    "value": "cancel",
    "text": "Abbrechen"
   }
  ]
 },
 {
  "ctor": "SuiDynamicsMenu",
  "menuItems": [
   {
    "value": "pp",
    "text": "Pianissimo"
   },
   {
    "value": "p",
    "text": "Piano"
   },
   {
    "value": "mp",
    "text": "Mezzo-piano"
   },
   {
    "value": "mf",
    "text": "Mezzo-forte"
   },
   {
    "value": "f",
    "text": "Forte"
   },
   {
    "value": "ff",
    "text": "Fortissimo"
   },
   {
    "value": "sfz",
    "text": "sfortzando"
   },
   {
    "value": "cancel",
    "text": "Abbrechen"
   }
  ]
 }
]`;
