
var smoLanguageStringAr = `[
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
     "label": "File Name",
     "id": "saveFileName"
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
   "label": "قياس",
   "dialogElements": [
    {
     "label": "Pickup Measure",
     "id": "pickupMeasure",
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
     "label": "Convert to Pickup Measure",
     "id": "makePickup"
    },
    {
     "label": "Pad Left (px)",
     "id": "padLeft"
    },
    {
     "label": "Stretch Contents",
     "id": "customStretch"
    },
    {
     "label": "Adjust Proportional Spacing",
     "id": "customProportion"
    },
    {
     "label": "Pad all measures in system",
     "id": "padAllInSystem"
    },
    {
     "label": "Measure Text",
     "id": "measureText"
    },
    {
     "label": "Text Position",
     "id": "measureTextPosition",
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
     "label": "System break before this measure",
     "id": "systemBreak"
    }
   ]
  },
  {
   "ctor": "SuiTempoDialog",
   "label": "خصائص السرعة",
   "dialogElements": [
    {
     "label": "وضع الإيقاع",
     "id": "tempoMode",
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
     "label": "ملاحظات / دقيقة",
     "id": "bpm"
    },
    {
     "label": "وحدة لكل ضربه",
     "id": "beatDuration",
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
     "label": "تطبيق على جميع المقاييس المستقبلية؟",
     "id": "applyToAll"
    },
    {
     "label": "إظهار السرعة",
     "id": "display"
    }
   ]
  },
  {
   "ctor": "SuiTimeSignatureDialog",
   "label": "Custom Time Signature",
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
   "label": "تخطيط",
   "dialogElements": [
    {
     "label": "Page Size",
     "id": "pageSize",
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
     "label": "Page Width (px)",
     "id": "pageWidth"
    },
    {
     "label": "Page Height (px)",
     "id": "pageHeight"
    },
    {
     "label": "Orientation",
     "id": "orientation",
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
     "label": "Left Margin (px)",
     "id": "leftMargin"
    },
    {
     "label": "Right Margin (px)",
     "id": "rightMargin"
    },
    {
     "label": "Top Margin (px)",
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
     "label": "% Note size",
     "id": "svgScale"
    }
   ]
  },
  {
   "ctor": "SuiDynamicModifierDialog",
   "label": "Dynamics Properties",
   "dialogElements": [
    {
     "label": "Y Line",
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
   "label": "Slur Properties",
   "dialogElements": [
    {
     "label": "Spacing",
     "id": "spacing"
    },
    {
     "label": "Thickness",
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
     "label": "Start Position",
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
     "label": "End Position",
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
     "label": "Invert",
     "id": "invert"
    },
    {
     "label": "Control Point 1 X",
     "id": "cp1x"
    },
    {
     "label": "Control Point 1 Y",
     "id": "cp1y"
    },
    {
     "label": "Control Point 2 X",
     "id": "cp2x"
    },
    {
     "label": "Control Point 2 Y",
     "id": "cp2y"
    }
   ]
  },
  {
   "ctor": "SuiVoltaAttributeDialog",
   "label": "Volta Properties",
   "dialogElements": [
    {
     "label": "number",
     "id": "number"
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
   "label": "Hairpin Properties",
   "dialogElements": [
    {
     "label": "Height",
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
  "label": "المفاتيح",
  "menuItems": [
   {
    "value": "trebleInstrument",
    "text": "طاقم التريبل مفتاح"
   },
   {
    "value": "bassInstrument",
    "text": "طاقم باس كلف"
   },
   {
    "value": "altoInstrument",
    "text": "طاقم ألتو مفتاح"
   },
   {
    "value": "tenorInstrument",
    "text": "طاقم تينور مفتاح"
   },
   {
    "value": "remove",
    "text": "حذف الطواقم"
   },
   {
    "value": "cancel",
    "text": "إلغاء"
   }
  ]
 },
 {
  "ctor": "SuiFileMenu",
  "label":"ملف",
  "menuItems": [
   {
    "value": "newFile",
    "text": "جديدe"
   },
   {
    "value": "openFile",
    "text": "فتح"
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
  "ctor": "SuiTimeSignatureMenu",
  "label": "وزن الإيقاع",
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
  "label": "الدليل",
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
  "label": "خطوط",
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
