
var smoLanguageStringDe = `[
 {
  "ctor": "SuiLoadFileDialog",
  "dialogElements": [
   {
    "staticText": [
     {
      "label": "Datei laden"
     }
    ]
   }
  ]
 },
 {
  "ctor": "SuiSaveFileDialog",
  "dialogElements": [
   {
    "staticText": [
     {
      "label": "Score speichern"
     }
    ]
   }
  ]
 },
 {
  "ctor": "SuiPrintFileDialog",
  "dialogElements": [
   {
    "staticText": [
     {
      "label": "Druck abgeschlossen"
     }
    ]
   }
  ]
 },
 {
  "ctor": "SuiMeasureDialog",
  "dialogElements": [
   {
    "staticText": [
     {
      "label": "Takt Voreinstellungen"
     }
    ]
   },
   {
    "id": "pickupMeasure",
    "label": "Takt Pickup",
    "options": [
     {
      "value": "2048",
      "label": "Eighth Note"
     },
     {
      "value": "4096",
      "label": "Quarter Note"
     },
     {
      "value": "6144",
      "label": "Dotted Quarter"
     },
     {
      "value": "8192",
      "label": "Half Note"
     }
    ]
   },
   {
    "id": "measureTextPosition",
    "label": "Text Position",
    "options": [
     {
      "value": "2",
      "label": "Left"
     },
     {
      "value": "3",
      "label": "Right"
     },
     {
      "value": "0",
      "label": "Above"
     },
     {
      "value": "1",
      "label": "Below"
     }
    ]
   }
  ]
 },
 {
  "ctor": "SuiTempoDialog",
  "dialogElements": [
   {
    "staticText": [
     {
      "label": "Tempo Voreinstellungen"
     }
    ]
   },
   {
    "id": "tempoMode",
    "label": "Tempo Modus",
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
    "id": "beatDuration",
    "label": "Einheit für Beat",
    "options": [
     {
      "value": "4096",
      "label": "Quarter Note"
     },
     {
      "value": "2048",
      "label": "1/8 note"
     },
     {
      "value": "6144",
      "label": "Dotted 1/4 note"
     },
     {
      "value": "8192",
      "label": "1/2 note"
     }
    ]
   },
   {
    "id": "tempoText",
    "label": "Tempo Text",
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
   }
  ]
 },
 {
  "ctor": "SuiInstrumentDialog",
  "dialogElements": [
   {
    "staticText": [
     {
      "label": "Instrument Properties"
     }
    ]
   },
   {
    "id": "applyTo",
    "label": "Apply To",
    "options": [
     {
      "value": "0",
      "label": "Score"
     },
     {
      "value": "1",
      "label": "Selected Measures"
     },
     {
      "value": "3",
      "label": "Remaining Measures"
     }
    ]
   }
  ]
 },
 {
  "ctor": "SuiTimeSignatureDialog",
  "dialogElements": [
   {
    "staticText": [
     {
      "label": "Custom Time Signature"
     }
    ]
   },
   {
    "id": "denominator",
    "label": "Beat Value",
    "options": [
     {
      "value": "8",
      "label": "8"
     },
     {
      "value": "4",
      "label": "4"
     },
     {
      "value": "2",
      "label": "2"
     }
    ]
   }
  ]
 },
 {
  "ctor": "SuiLayoutDialog",
  "dialogElements": [
   {
    "id": "pageSize",
    "label": "Seitengröße",
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
    "id": "orientation",
    "label": "Ausrichtung",
    "options": [
     {
      "value": "0",
      "label": "Portrait"
     },
     {
      "value": "1",
      "label": "Landscape"
     }
    ]
   },
   {
    "id": "engravingFont",
    "label": "Schriftart",
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
    "staticText": [
     {
      "label": "Score Layout"
     }
    ]
   }
  ]
 },
 {
  "ctor": "SuiDynamicModifierDialog",
  "dialogElements": [
   {
    "id": "text",
    "label": "Text",
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
   },
   {
    "staticText": [
     {
      "label": "Dynamics Properties"
     }
    ]
   }
  ]
 },
 {
  "ctor": "SuiSlurAttributesDialog",
  "dialogElements": [
   {
    "staticText": [
     {
      "label": "Slur Properties"
     }
    ]
   },
   {
    "id": "position",
    "label": "Startposition",
    "options": [
     {
      "value": "1",
      "label": "Head"
     },
     {
      "value": "2",
      "label": "Top"
     }
    ]
   },
   {
    "id": "position_end",
    "label": "Endposition",
    "options": [
     {
      "value": "1",
      "label": "Head"
     },
     {
      "value": "2",
      "label": "Top"
     }
    ]
   }
  ]
 },
 {
  "ctor": "SuiVoltaAttributeDialog",
  "dialogElements": [
   {
    "staticText": [
     {
      "label": "Volta Properties"
     }
    ]
   }
  ]
 },
 {
  "ctor": "SuiHairpinAttributesDialog",
  "dialogElements": [
   {
    "staticText": [
     {
      "label": "Hairpin Properties"
     }
    ]
   }
  ]
 },
 {
  "ctor": "SuiLyricDialog",
  "dialogElements": [
   {
    "id": "verse",
    "label": "Verse",
    "options": [
     {
      "value": "0",
      "label": "1"
     },
     {
      "value": "1",
      "label": "2"
     },
     {
      "value": "2",
      "label": "3"
     }
    ]
   },
   {
    "id": "textEditor",
    "label": "Edit Text",
    "options": []
   },
   {
    "staticText": [
     {
      "doneEditing": "Done Editing Lyrics"
     },
     {
      "undo": "Undo Lyrics"
     },
     {
      "label": "Lyric Editor"
     }
    ]
   }
  ]
 },
 {
  "ctor": "SuiChordChangeDialog",
  "dialogElements": [
   {
    "id": "verse",
    "label": "Verse",
    "options": [
     {
      "value": "0",
      "label": "1"
     },
     {
      "value": "1",
      "label": "2"
     },
     {
      "value": "2",
      "label": "3"
     }
    ]
   },
   {
    "id": "textEditor",
    "label": "Edit Text",
    "options": []
   },
   {
    "staticText": [
     {
      "doneEditing": "Done Editing Lyrics"
     },
     {
      "undo": "Undo Lyrics"
     },
     {
      "label": "Lyric Editor"
     }
    ]
   }
  ]
 },
 {
  "ctor": "SuiTextTransformDialog",
  "dialogElements": [
   {
    "id": "textEditor",
    "label": "Edit Text",
    "options": []
   },
   {
    "id": "textDragger",
    "label": "Move Text",
    "options": []
   },
   {
    "id": "textResizer",
    "label": "Resize Text",
    "options": []
   },
   {
    "id": "justification",
    "label": "Justification",
    "options": [
     {
      "value": "left",
      "label": "Left"
     },
     {
      "value": "right",
      "label": "Right"
     },
     {
      "value": "center",
      "label": "Center"
     }
    ]
   },
   {
    "id": "fontFamily",
    "label": "Font Family",
    "options": [
     {
      "value": "Merriweather,serif",
      "label": "Serif"
     },
     {
      "value": "Roboto,sans-serif",
      "label": "Sans-Serif"
     },
     {
      "value": "monospace",
      "label": "Monospace"
     },
     {
      "value": "cursive",
      "label": "Cursive"
     },
     {
      "value": "Merriweather",
      "label": "times"
     },
     {
      "value": "Arial",
      "label": "arial"
     },
     {
      "value": "Helvetica",
      "label": "Helvetica"
     }
    ]
   },
   {
    "id": "fontUnit",
    "label": "Units",
    "options": [
     {
      "value": "em",
      "label": "em"
     },
     {
      "value": "px",
      "label": "px"
     },
     {
      "value": "pt",
      "label": "pt"
     }
    ]
   },
   {
    "id": "pagination",
    "label": "Page Behavior",
    "options": [
     {
      "value": "once",
      "label": "Once"
     },
     {
      "value": "every",
      "label": "Every"
     },
     {
      "value": "even",
      "label": "Even"
     },
     {
      "value": "odd",
      "label": "Odd"
     },
     {
      "value": "subsequent",
      "label": "Subsequent"
     }
    ]
   },
   {
    "staticText": [
     {
      "label": "Text Properties"
     }
    ]
   }
  ]
 },
 {
  "ctor": "SuiAddStaffMenu",
  "label": "Notenschlüssel",
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
  "ctor": "SuiMeasureMenu",
  "label": "Measure",
  "menuItems": [
   {
    "value": "addMenuBeforeCmd",
    "text": "Add Measure Before"
   },
   {
    "value": "addMenuAfterCmd",
    "text": "Add Measure After"
   },
   {
    "value": "deleteSelected",
    "text": "Delete Selected Measures"
   },
   {
    "value": "formatMeasureDialog",
    "text": "Format Measure"
   },
   {
    "value": "cancel",
    "text": "Cancel"
   }
  ]
 },
 {
  "ctor": "SuiFileMenu",
  "label": "Datei",
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
    "value": "yamaJson",
    "text": "Yama"
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
  "label": "Dynamics",
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
 },
 {
  "ctor": "SuiLanguageMenu",
  "label": "Language",
  "menuItems": [
   {
    "value": "en",
    "text": "English"
   },
   {
    "value": "de",
    "text": "Deutsch"
   },
   {
    "value": "ar",
    "text": "اَلْعَرَبِيَّةُ"
   },
   {
    "value": "cancel",
    "text": "Cancel"
   }
  ]
 },
 {
  "ribbonText": [
   {
    "buttonId": "helpDialog",
    "buttonText": "(de)Help"
   },
   {
    "buttonId": "languageMenu",
    "buttonText": "Language"
   },
   {
    "buttonId": "fileMenu",
    "buttonText": "File"
   },
   {
    "buttonId": "addStaffMenu",
    "buttonText": "Staves"
   },
   {
    "buttonId": "measureModal",
    "buttonText": "Measure"
   },
   {
    "buttonId": "tempoModal",
    "buttonText": "Tempo"
   },
   {
    "buttonId": "timeSignatureMenu",
    "buttonText": "Time Signature"
   },
   {
    "buttonId": "keyMenu",
    "buttonText": "Key"
   },
   {
    "buttonId": "staffModifierMenu",
    "buttonText": "Lines"
   },
   {
    "buttonId": "instrumentModal",
    "buttonText": "Instrument"
   },
   {
    "buttonId": "pianoModal",
    "buttonText": "Piano"
   },
   {
    "buttonId": "layoutModal",
    "buttonText": "Layout"
   },
   {
    "buttonId": "UpOctaveButton",
    "buttonText": "8va"
   },
   {
    "buttonId": "DownOctaveButton",
    "buttonText": "8vb"
   },
   {
    "buttonId": "moreNavButtons",
    "buttonText": "..."
   },
   {
    "buttonId": "dcAlCoda",
    "buttonText": "DC Al Coda"
   },
   {
    "buttonId": "dsAlCoda",
    "buttonText": "DS Al Coda"
   },
   {
    "buttonId": "dcAlFine",
    "buttonText": "DC Al Fine"
   },
   {
    "buttonId": "dsAlFine",
    "buttonText": "DS Al Fine"
   },
   {
    "buttonId": "toCoda",
    "buttonText": "to "
   },
   {
    "buttonId": "fine",
    "buttonText": "Fine"
   },
   {
    "buttonId": "moreStaffButtons",
    "buttonText": "..."
   }
  ]
 }
]`;
