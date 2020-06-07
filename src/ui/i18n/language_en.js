
var smoLanguageStringEn = `[
 {
  "ctor": "SuiLoadFileDialog",
  "label": "Load File",
  "dialogElements": [
   {}
  ]
 },
 {
  "ctor": "SuiSaveFileDialog",
  "label": "Save Score",
  "dialogElements": [
   {
    "label": "File Name"
   }
  ]
 },
 {
  "ctor": "SuiPrintFileDialog",
  "label": "Print Complete",
  "dialogElements": []
 },
 {
  "ctor": "SuiMeasureDialog",
  "label": "Measure Properties",
  "dialogElements": [
   {
    "label": "Pickup Measure",
    "options": [
     {
      "value": 2048,
      "label": "Eighth Note"
     },
     {
      "value": 4096,
      "label": "Quarter Note"
     },
     {
      "value": 6144,
      "label": "Dotted Quarter"
     },
     {
      "value": 8192,
      "label": "Half Note"
     }
    ]
   },
   {
    "label": "Convert to Pickup Measure"
   },
   {
    "label": "Pad Left (px)"
   },
   {
    "label": "Stretch Contents"
   },
   {
    "label": "Adjust Proportional Spacing"
   },
   {
    "label": "Pad all measures in system"
   },
   {
    "label": "Measure Text"
   },
   {
    "label": "Text Position",
    "options": [
     {
      "value": 2,
      "label": "Left"
     },
     {
      "value": 3,
      "label": "Right"
     },
     {
      "value": 0,
      "label": "Above"
     },
     {
      "value": 1,
      "label": "Below"
     }
    ]
   },
   {
    "label": "System break before this measure"
   }
  ]
 },
 {
  "ctor": "SuiTempoDialog",
  "label": "Tempo Properties",
  "dialogElements": [
   {
    "label": "Tempo Mode",
    "options": [
     {
      "value": "duration",
      "label": "Duration (Beats/Minute)"
     },
     {
      "value": "text",
      "label": "Tempo Text"
     },
     {
      "value": "custom",
      "label": "Specify text and duration"
     }
    ]
   },
   {
    "label": "Notes/Minute"
   },
   {
    "label": "Unit for Beat",
    "options": [
     {
      "value": 4096,
      "label": "Quarter Note"
     },
     {
      "value": 2048,
      "label": "1/8 note"
     },
     {
      "value": 6144,
      "label": "Dotted 1/4 note"
     },
     {
      "value": 8192,
      "label": "1/2 note"
     }
    ]
   },
   {
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
   },
   {
    "label": "Apply to all future measures?"
   },
   {
    "label": "Display Tempo"
   }
  ]
 },
 {
  "ctor": "SuiTimeSignatureDialog",
  "label": "Custom Time Signature",
  "dialogElements": [
   {
    "label": "Beats/Measure"
   },
   {
    "label": "Beat Value",
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
    "label": "Page Size",
    "options": [
     {
      "value": "letter",
      "label": "Letter"
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
      "label": "Custom"
     }
    ]
   },
   {
    "label": "Page Width (px)"
   },
   {
    "label": "Page Height (px)"
   },
   {
    "label": "Orientation",
    "options": [
     {
      "value": 0,
      "label": "Portrait"
     },
     {
      "value": 1,
      "label": "Landscape"
     }
    ]
   },
   {
    "label": "Engraving Font",
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
    "label": "Left Margin (px)"
   },
   {
    "label": "Right Margin (px)"
   },
   {
    "label": "Top Margin (px)"
   },
   {
    "label": "Inter-System Margin"
   },
   {
    "label": "Intra-System Margin"
   },
   {
    "label": "% Zoom"
   },
   {
    "label": "% Note size"
   }
  ]
 },
 {
  "ctor": "SuiDynamicModifierDialog",
  "label": "Dynamics Properties",
  "dialogElements": [
   {
    "label": "Y Line"
   },
   {
    "label": "Y Offset Px"
   },
   {
    "label": "X Offset"
   },
   {
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
   }
  ]
 },
 {
  "ctor": "SuiAddStaffMenu",
  "label": "Staves",
  "menuItems": [
   {
    "value": "trebleInstrument",
    "text": "Treble Clef Staff"
   },
   {
    "value": "bassInstrument",
    "text": "Bass Clef Staff"
   },
   {
    "value": "altoInstrument",
    "text": "Alto Clef Staff"
   },
   {
    "value": "tenorInstrument",
    "text": "Tenor Clef Staff"
   },
   {
    "value": "remove",
    "text": "Remove Staff"
   },
   {
    "value": "cancel",
    "text": "Cancel"
   }
  ]
 },
 {
  "ctor": "SuiTimeSignatureMenu",
  "label": "Time Sig",
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
    "text": "Other"
   },
   {
    "value": "cancel",
    "text": "Cancel"
   }
  ]
 },
 {
  "ctor": "SuiKeySignatureMenu",
  "label":"Key",
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
    "text": "Cancel"
   }
  ]
 },

 {
  "ctor": "SuiFileMenu",
  "label": "File",
  "menuItems": [
   {
    "value": "newFile",
    "text": "New Score"
   },
   {
    "value": "openFile",
    "text": "Open"
   },
   {
    "value": "saveFile",
    "text": "Save"
   },
   {
    "value": "quickSave",
    "text": "Quick Save"
   },
   {
    "value": "printScore",
    "text": "Print"
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
    "text": "Cancel"
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
    "text": "Slur/Tie"
   },
   {
    "value": "ending",
    "text": "nth ending"
   },
   {
    "value": "cancel",
    "text": "Cancel"
   }
  ]
 }
]`;
