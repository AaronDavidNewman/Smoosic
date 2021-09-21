
export const smoLanguageStringAr = `{
    "dialogs": [
     {
      "ctor": "SuiLoadFileDialog",
      "label": "Load File",
      "dialogElements": [
       {}
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiSaveFileDialog",
      "label": "Save Score",
      "dialogElements": [
       {
        "label": "File Name",
        "id": "saveFileName"
       }
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiSaveXmlDialog",
      "label": "Save Score",
      "dialogElements": [
       {
        "label": "File Name",
        "id": "saveFileName"
       }
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiPrintFileDialog",
      "label": "Print Complete",
      "dialogElements": [],
      "staticText": {}
     },
     {
      "ctor": "SuiSaveMidiDialog",
      "label": "Save Score as Midi",
      "dialogElements": [
       {
        "label": "File Name",
        "id": "saveFileName"
       }
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiSaveActionsDialog",
      "label": "Save Score",
      "dialogElements": [
       {
        "label": "File Name",
        "id": "saveFileName"
       }
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiLoadMxmlDialog",
      "label": "Load File",
      "dialogElements": [
       {},
       {
        "staticText": {
         "label": "Load File"
        }
       }
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiLoadActionsDialog",
      "label": "Load Action File",
      "dialogElements": [
       {},
       {
        "staticText": {
         "label": "Load Action File"
        }
       }
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiMeasureDialog",
      "label": "Measure Properties",
      "dialogElements": [
       {
        "label": "Pickup",
        "id": "pickup"
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
        "label": "Proportionalality",
        "id": "customProportion"
       },
       {
        "label": "Pad all measures in system",
        "id": "padAllInSystem"
       },
       {
        "label": "Justify Columns",
        "id": "autoJustify"
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
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiTempoDialog",
      "label": "Tempo Properties",
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
        "label": "Custom Text",
        "id": "customText"
       },
       {
        "label": "Notes/Minute",
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
        "label": "Apply to all future measures?",
        "id": "applyToAll"
       },
       {
        "label": "Display Tempo",
        "id": "display"
       },
       {
        "label": "Y Offset",
        "id": "yOffset"
       }
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiInstrumentDialog",
      "label": "Instrument Properties",
      "dialogElements": [
       {
        "label": "Transpose Index (1/2 steps)",
        "id": "transposeIndex"
       },
       {
        "label": "Apply To",
        "id": "applyTo",
        "options": [
         {
          "value": 0,
          "label": "Score"
         },
         {
          "value": 1,
          "label": "Selected Measures"
         },
         {
          "value": 3,
          "label": "Remaining Measures"
         }
        ]
       }
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiInsertMeasures",
      "label": "Insert Measures",
      "dialogElements": [
       {
        "label": "Measures to Insert",
        "id": "measureCount"
       },
       {
        "label": "Append to Selection",
        "id": "append"
       }
      ],
      "staticText": {}
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
       },
       {
        "label": "Display",
        "id": "display"
       }
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiScoreViewDialog",
      "label": "Score View",
      "dialogElements": [
       {
        "label": "Show staff",
        "id": "scoreView"
       }
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiScoreIdentificationDialog",
      "label": "Score Preferences",
      "dialogElements": [
       {
        "label": "Title",
        "id": "title"
       },
       {
        "label": "Sub Title",
        "id": "subTitle"
       },
       {
        "label": "Composer",
        "id": "composer"
       },
       {
        "label": "Copyright",
        "id": "copyright"
       }
      ],
      "staticText": {
       "titleText": "Title",
       "subTitleText": "Sub-title",
       "copyrightText": "Copyright",
       "composerText": "Composer",
       "show": "Show"
      }
     },
     {
      "ctor": "SuiGlobalLayoutDialog",
      "label": "Global Settings",
      "dialogElements": [
       {
        "label": "Score Name",
        "id": "scoreName"
       },
       {
        "label": "Play Selections",
        "id": "autoPlay"
       },
       {
        "label": "Auto-Advance Cursor",
        "id": "autoAdvance"
       },
       {
        "label": "Note Spacing",
        "id": "noteSpacing"
       },
       {
        "label": "Page Size",
        "id": "pageSize",
        "options": [
         {
          "value": "letter",
          "label": "Letter (Portrait)"
         },
         {
          "value": "letterLandscape",
          "label": "Letter (Landscape)"
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
        "label": "% Zoom",
        "id": "zoomScale"
       },
       {
        "label": "% Note size",
        "id": "svgScale"
       }
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiScoreFontDialog",
      "label": "Score Fonts",
      "dialogElements": [
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
         },
         {
          "value": "Leland",
          "label": "Leland"
         }
        ]
       },
       {
        "label": "Chord Font",
        "id": "chordFont"
       },
       {
        "label": "Lyric Font",
        "id": "lyricFont"
       }
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiLayoutDialog",
      "label": "Page Layouts",
      "dialogElements": [
       {
        "label": "Apply to Page",
        "id": "applyToPage",
        "options": [
         {
          "value": -1,
          "label": "All"
         },
         {
          "value": -2,
          "label": "All Remaining"
         },
         {
          "value": 1,
          "label": "Page 1"
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
        "label": "Bottom Margin (px)",
        "id": "bottomMargin"
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
        "staticText": {
         "label": "Page Layouts"
        }
       }
      ],
      "staticText": {}
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
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiTieAttributesDialog",
      "label": "Tie Properties",
      "dialogElements": [
       {
        "label": "Lines",
        "id": "lines"
       }
      ],
      "staticText": {
       "label": "Tie Properties",
       "fromNote": "From Note",
       "toNote": "To Note"
      }
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
      ],
      "staticText": {}
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
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiStaffGroupDialog",
      "label": "Staff Group",
      "dialogElements": [
       {
        "label": "Staves in Group",
        "id": "staffGroups"
       },
       {
        "label": "Left Connector",
        "id": "leftConnector",
        "options": [
         {
          "value": 1,
          "label": "Bracket"
         },
         {
          "value": 0,
          "label": "Brace"
         },
         {
          "value": 2,
          "label": "Single"
         },
         {
          "value": 3,
          "label": "Double"
         }
        ]
       }
      ],
      "staticText": {
       "includeStaff": "Include Staff"
      }
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
      ],
      "staticText": {}
     },
     {
      "ctor": "SuiLyricDialog",
      "label": "Lyric Editor",
      "dialogElements": [
       {
        "label": "Verse",
        "id": "verse",
        "options": [
         {
          "value": 0,
          "label": "1"
         },
         {
          "value": 1,
          "label": "2"
         },
         {
          "value": 2,
          "label": "3"
         },
         {
          "value": 3,
          "label": "4"
         }
        ]
       },
       {
        "label": "Y Adjustment (Px)",
        "id": "translateY"
       },
       {
        "label": "Font",
        "id": "font"
       },
       {
        "label": "Edit Lyrics",
        "id": "lyricEditor",
        "options": []
       }
      ],
      "staticText": {
       "doneEditing": "Done Editing Lyrics",
       "undo": "Undo Lyrics",
       "label": "Lyric Editor"
      }
     },
     {
      "ctor": "SuiChordChangeDialog",
      "label": "Edit Chord Symbol",
      "dialogElements": [
       {
        "label": "Ordinality",
        "id": "verse",
        "options": [
         {
          "value": 0,
          "label": "1"
         },
         {
          "value": 1,
          "label": "2"
         },
         {
          "value": 2,
          "label": "3"
         }
        ]
       },
       {
        "label": "Y Adjustment (Px)",
        "id": "translateY"
       },
       {
        "label": "Edit Text",
        "id": "chordEditor",
        "options": []
       },
       {
        "label": "Chord Symbol",
        "id": "chordSymbol",
        "options": [
         {
          "value": "csymDiminished",
          "label": "Dim"
         },
         {
          "value": "csymHalfDiminished",
          "label": "Half dim"
         },
         {
          "value": "csymDiagonalArrangementSlash",
          "label": "Slash"
         },
         {
          "value": "csymMajorSeventh",
          "label": "Maj7"
         }
        ]
       },
       {
        "label": "Text Position",
        "id": "textPosition",
        "options": [
         {
          "value": 1,
          "label": "Superscript"
         },
         {
          "value": 2,
          "label": "Subscript"
         },
         {
          "value": 0,
          "label": "Normal"
         }
        ]
       },
       {
        "label": "Font",
        "id": "font"
       },
       {
        "label": "Adjust Note Width",
        "id": "adjustWidth",
        "options": []
       }
      ],
      "staticText": {
       "label": "Edit Chord Symbol",
       "undo": "Undo Chord Symbols",
       "doneEditing": "Done Editing Chord Symbols"
      }
     },
     {
      "ctor": "SuiTextTransformDialog",
      "label": "Text Properties",
      "dialogElements": [
       {
        "label": "Edit Text",
        "id": "textEditor",
        "options": []
       },
       {
        "label": "Insert Special",
        "id": "insertCode",
        "options": [
         {
          "value": "@@@",
          "label": "Pages"
         },
         {
          "value": "###",
          "label": "Page Number"
         }
        ]
       },
       {
        "label": "Move Text",
        "id": "textDragger",
        "options": []
       },
       {
        "label": "X Position (Px)",
        "id": "x"
       },
       {
        "label": "Y Position (Px)",
        "id": "y"
       },
       {
        "label": "Font Information",
        "id": "font"
       },
       {
        "label": "Text Block Properties",
        "id": "textBlock"
       },
       {
        "label": "Page Behavior",
        "id": "pagination",
        "options": [
         {
          "value": 4,
          "label": "Once"
         },
         {
          "value": 1,
          "label": "Every"
         },
         {
          "label": "Even"
         },
         {
          "value": 3,
          "label": "Odd"
         },
         {
          "value": 5,
          "label": "Subsequent"
         }
        ]
       },
       {
        "label": "Attach to Selection",
        "id": "attachToSelector"
       }
      ],
      "staticText": {
       "label": "Text Properties",
       "editorLabel": "Done Editing Text",
       "draggerLabel": "Done Dragging Text"
      }
     }
    ],
    "menus": [
     {
      "ctor": "SuiDynamicsMenu",
      "label": "Dynamics",
      "menuItems": [
       {
        "icon": "pianissimo",
        "text": "Pianissimo",
        "value": "pp"
       },
       {
        "icon": "piano",
        "text": "Piano",
        "value": "p"
       },
       {
        "icon": "mezzopiano",
        "text": "Mezzo-piano",
        "value": "mp"
       },
       {
        "icon": "mezzoforte",
        "text": "Mezzo-forte",
        "value": "mf"
       },
       {
        "icon": "forte",
        "text": "Forte",
        "value": "f"
       },
       {
        "icon": "fortissimo",
        "text": "Fortissimo",
        "value": "ff"
       },
       {
        "icon": "sfz",
        "text": "sfortzando",
        "value": "sfz"
       },
       {
        "icon": "",
        "text": "Cancel",
        "value": "cancel"
       }
      ]
     },
     {
      "ctor": "SuiFileMenu",
      "label": "ملف",
      "menuItems": [
       {
        "icon": "folder-new",
        "text": "جديدe",
        "value": "newFile"
       },
       {
        "icon": "folder-open",
        "text": "فتح",
        "value": "openFile"
       },
       {
        "icon": "",
        "text": "Quick Save",
        "value": "quickSave"
       },
       {
        "icon": "folder-save",
        "text": "حفظ",
        "value": "saveFile"
       },
       {
        "icon": "",
        "text": "طباعه",
        "value": "printScore"
       },
       {
        "icon": "",
        "text": "Import MusicXML",
        "value": "importMxml"
       },
       {
        "icon": "",
        "text": "Export MusicXML",
        "value": "exportXml"
       },
       {
        "icon": "",
        "text": "Export Midi",
        "value": "exportMidi"
       },
       {
        "icon": "folder-save",
        "text": "Save Actions",
        "value": "saveActions"
       },
       {
        "icon": "icon-play3",
        "text": "Play Actions",
        "value": "playActions"
       },
       {
        "icon": "",
        "text": "إلغاء",
        "value": "cancel"
       }
      ]
     },
     {
      "ctor": "SuiStaffMenu",
      "label": "المفاتيح",
      "menuItems": [
       {
        "icon": "treble",
        "text": "طاقم التريبل مفتاح",
        "value": "trebleInstrument"
       },
       {
        "icon": "bass",
        "text": "طاقم باس كلف",
        "value": "bassInstrument"
       },
       {
        "icon": "alto",
        "text": "طاقم ألتو مفتاح",
        "value": "altoInstrument"
       },
       {
        "icon": "tenor",
        "text": "طاقم تينور مفتاح",
        "value": "tenorInstrument"
       },
       {
        "icon": "percussion",
        "text": "Percussion Clef Staff",
        "value": "percussionInstrument"
       },
       {
        "icon": "",
        "text": "Staff Groups",
        "value": "staffGroups"
       },
       {
        "icon": "cancel-circle",
        "text": "حذف الطواقم",
        "value": "remove"
       },
       {
        "icon": "",
        "text": "إلغاء",
        "value": "cancel"
       }
      ]
     },
     {
      "ctor": "SuiKeySignatureMenu",
      "label": "الدليل",
      "menuItems": [
       {
        "icon": "key-sig-c",
        "text": "C Major",
        "value": "KeyOfC"
       },
       {
        "icon": "key-sig-f",
        "text": "F Major",
        "value": "KeyOfF"
       },
       {
        "icon": "key-sig-g",
        "text": "G Major",
        "value": "KeyOfG"
       },
       {
        "icon": "key-sig-bb",
        "text": "Bb Major",
        "value": "KeyOfBb"
       },
       {
        "icon": "key-sig-d",
        "text": "D Major",
        "value": "KeyOfD"
       },
       {
        "icon": "key-sig-eb",
        "text": "Eb Major",
        "value": "KeyOfEb"
       },
       {
        "icon": "key-sig-a",
        "text": "A Major",
        "value": "KeyOfA"
       },
       {
        "icon": "key-sig-ab",
        "text": "Ab Major",
        "value": "KeyOfAb"
       },
       {
        "icon": "key-sig-e",
        "text": "E Major",
        "value": "KeyOfE"
       },
       {
        "icon": "key-sig-bd",
        "text": "Db Major",
        "value": "KeyOfDb"
       },
       {
        "icon": "key-sig-b",
        "text": "B Major",
        "value": "KeyOfB"
       },
       {
        "icon": "key-sig-fs",
        "text": "F# Major",
        "value": "KeyOfF#"
       },
       {
        "icon": "key-sig-cs",
        "text": "C# Major",
        "value": "KeyOfC#"
       },
       {
        "icon": "",
        "text": "Cancel",
        "value": "cancel"
       }
      ]
     },
     {
      "ctor": "SuiMeasureMenu",
      "label": "Measure",
      "menuItems": [
       {
        "icon": "",
        "text": "Add Measures",
        "value": "addMenuCmd"
       },
       {
        "icon": "icon-cross",
        "text": "Delete Selected Measures",
        "value": "deleteSelected"
       },
       {
        "icon": "",
        "text": "Format Measure",
        "value": "formatMeasureDialog"
       },
       {
        "icon": "",
        "text": "Cancel",
        "value": "cancel"
       }
      ]
     },
     {
      "ctor": "SuiTimeSignatureMenu",
      "label": "وزن الإيقاع",
      "menuItems": [
       {
        "icon": "sixeight",
        "text": "6/8",
        "value": "6/8"
       },
       {
        "icon": "fourfour",
        "text": "4/4",
        "value": "4/4"
       },
       {
        "icon": "threefour",
        "text": "3/4",
        "value": "3/4"
       },
       {
        "icon": "twofour",
        "text": "2/4",
        "value": "2/4"
       },
       {
        "icon": "twelveeight",
        "text": "12/8",
        "value": "12/8"
       },
       {
        "icon": "seveneight",
        "text": "7/8",
        "value": "7/8"
       },
       {
        "icon": "fiveeight",
        "text": "5/8",
        "value": "5/8"
       },
       {
        "icon": "",
        "text": "Other",
        "value": "TimeSigOther"
       },
       {
        "icon": "",
        "text": "Cancel",
        "value": "cancel"
       }
      ]
     },
     {
      "ctor": "SuiStaffModifierMenu",
      "label": "خطوط",
      "menuItems": [
       {
        "icon": "cresc",
        "text": "تصاعد",
        "value": "crescendo"
       },
       {
        "icon": "decresc",
        "text": "تهابط",
        "value": "decrescendo"
       },
       {
        "icon": "slur",
        "text": "طمس / تعادل",
        "value": "slur"
       },
       {
        "icon": "slur",
        "text": "Tie",
        "value": "tie"
       },
       {
        "icon": "ending",
        "text": "النهاية التاسعة",
        "value": "ending"
       },
       {
        "icon": "",
        "text": "Cancel",
        "value": "cancel"
       }
      ]
     },
     {
      "ctor": "SuiLanguageMenu",
      "label": "Language",
      "menuItems": [
       {
        "icon": "",
        "text": "English",
        "value": "en"
       },
       {
        "icon": "",
        "text": "Deutsch",
        "value": "de"
       },
       {
        "icon": "",
        "text": "اَلْعَرَبِيَّةُ",
        "value": "ar"
       },
       {
        "icon": "",
        "text": "Cancel",
        "value": "cancel"
       }
      ]
     },
     {
      "ctor": "SuiLibraryMenu",
      "label": "Score",
      "menuItems": [
       {
        "icon": "",
        "text": "Bach Invention",
        "value": "bach"
       },
       {
        "icon": "",
        "text": "Postillion-Lied",
        "value": "postillion"
       },
       {
        "icon": "",
        "text": "Jesu Bambino",
        "value": "bambino"
       },
       {
        "icon": "",
        "text": "Handel Messiah 1-1",
        "value": "handel"
       },
       {
        "icon": "",
        "text": "Precious Lord",
        "value": "preciousLord"
       },
       {
        "icon": "",
        "text": "In Its Delightful Shade",
        "value": "shade"
       },
       {
        "icon": "",
        "text": "Yama",
        "value": "yamaJson"
       },
       {
        "icon": "",
        "text": "Dichterliebe (xml)",
        "value": "dichterliebe"
       },
       {
        "icon": "",
        "text": "Beethoven - An die ferne Gliebte (xml)",
        "value": "beethoven"
       },
       {
        "icon": "",
        "text": "Mozart - An Chloe (xml)",
        "value": "mozart"
       },
       {
        "icon": "",
        "text": "Joplin - The Entertainer (xml)",
        "value": "joplin"
       },
       {
        "icon": "",
        "text": "Cancel",
        "value": "cancel"
       }
      ]
     },
     {
      "ctor": "SuiScoreMenu",
      "label": "Score Settings",
      "menuItems": [
       {
        "icon": "",
        "text": "Layout",
        "value": "layout"
       },
       {
        "icon": "",
        "text": "Fonts",
        "value": "fonts"
       },
       {
        "icon": "",
        "text": "View",
        "value": "view"
       },
       {
        "icon": "",
        "text": "Score Info",
        "value": "identification"
       },
       {
        "icon": "",
        "text": "Global Settings",
        "value": "preferences"
       },
       {
        "icon": "",
        "text": "Cancel",
        "value": "cancel"
       }
      ]
     }
    ],
    "buttonText": [
     {
      "buttonId": "helpDialog",
      "buttonText": "Help"
     },
     {
      "buttonId": "languageMenu",
      "buttonText": "Language"
     },
     {
      "buttonId": "fileMenu",
      "buttonText": "ملف"
     },
     {
      "buttonId": "libraryMenu",
      "buttonText": "Library"
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
      "buttonId": "layoutMenu",
      "buttonText": "Score"
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
   }`;


export const quickStartHtmlar = `(Arabic)
    <h3 id="quick-start-guide">Quick start guide</h3>
<p>If you don&#39;t like to read instructions, this cook&#39;s tour of Smoosic was made for you.</p>
<ul>
<li><p>One of buttons on the left is called &#39;File&#39;.  Click on it. The menu items before &#39;cancel&#39; are pre-canned projects that you can use as a template to get you started.</p>
</li>
<li><p>The cursor keys will navigate you to the different notes.</p>
</li>
<li><p>Letters a-g on the computer keyboard change the note to those pitches</p>
</li>
<li><p>&#39;Insert&#39; adds a new, blank measure.</p>
</li>
<li><p>The ribbon of thick blue buttons on the top expand to button groups, that contain most of the functionality of Smoosic.  </p>
</li>
<li><p>The buttons on the left bring up menus or dialogs that do basically what the buttons say.</p>
</li>
<li><p>There are a few &#39;instant gratification&#39; buttons for playing the music, refreshing the screen or changing the zoom level on the left part of the ribbon.</p>
</li>
<li><p>The piano tool is an alternate way of entering music, or can be dismissed by the close button in the lower left.</p>
</li>
</ul>
<p><img src="https://imgur.com/nP16PMI.gif" alt="" width="640" height="480"></p>
`;


export const selectionHtmlar = `(Arabic)
<h3 id="selecting-things">Selecting things</h3>
<p>Almost all operations in Smoosic act on the selected music.  You can select notes in different ways:</p>
<ol>
<li>with the computer mouse</li>
<li>with the keyboard&#39;s navigation keys</li>
<li>with the navigation keys on the ribbon</li>
<li>with the piano tool, to some extent.</li>
</ol>
<p><img src="https://imgur.com/q1qK3Pn.gif" alt=""></p>
<p>You can select multiple things with the keyboard navigation keys, by selecting &#39;shift-arrow&#39;, just like many applications.  There is a similar control for selection in the navigation ribbon.  Some operations, like changing pitch for instance, act on all the selected notes.</p>
<p>Sometimes a selection of one line affects all the measures in that column (or all the measures of the system, if you like).  When you change the key, for instance, the selection determines where the key change starts.  If you have multiple measures selected, it applies to those measures, and then changes back to whatever it was before.</p>
`;


export const enterDurationsHtmlar = `(Arabic)
<p>Note duration in Smoosic is done by changing the duration of an existing note.  Usually, doubling the duration or cutting it in two, or adding a dot - duration to a note.  You can also create tuplets for uneven sets of notes (3, 5, or 7).</p>
<p>There are actually 3 ways to do many duration operations - using the piano tool, using the computer keyboard, or using the button ribbon.  Like with many things, you should find entering duration using the keyboard fastest, once you have some experience with Smoosic.  But the ribbon or the </p>
<h2 id="changing-note-length-with-the-keyboard">Changing note length with the keyboard</h2>
<p>You can change the length of notes using the &#39;,&#39; and &#39;.&#39; (comma and period) keys, which halve and double the note lengths, respectively.  You can add a dot to the length of the note (multiplying length by 3/2 for the first dot, and 3/4 for the second dot, if you like to think of it that way) or remove a dot, using the &#39;&gt;&#39; and &#39;&lt;&#39;.  The mnemonic device for these is &#39;&gt;&#39; makes note duration greater.  &#39;&lt;&#39; makes note duration...less.  (On most QWERTY keyboards, comma shifted is &#39;&lt;&#39; and period shifted is &#39;&gt;&#39;).</p>
<p><img src="https://imgur.com/5ZWq2Xe.gif" alt=""></p>
<p>Note how the selection is preserved as the notes get shorter.  When you change something, Smoosic will try to keep the selection as close as possible to what you had.  You can use the cursor navigation keys to move to a specific selected note.</p>
<p><img src="https://imgur.com/woMw4RH.gif" alt=""></p>
<p>When you increase the length of a note, Smoosic always &#39;borrows&#39; from the next note in the measure that is eligible.  So when you double the length of the 8th note, it combines the 16th, and 2 32nd notes, and collapses them into a single quarter.  If Smoosic can&#39;t honor the request, it does nothing.  For instance, it can&#39;t remove the dot from a note with no dot, and it can&#39;t extend beyond the length of the measure.</p>
<p>You can create tuplets from the keyboard by typing Ctrl-3, Ctrl-5 or Ctrl-7 for triplets, quintuplets, and septuplets, respectively.  Individual notes in a tuplet can be doubled and halved with the duration keys &#39;-&#39; (minus) and &#39;=&#39; (equals), just like non-tuplets.  You &#39;untupletify&#39; a tuplet by Ctrl-0.</p>
<p><img src="https://imgur.com/uBpQwXD.gif" alt=""></p>
<h2 id="changing-note-length-with-piano-widget">Changing note length with piano widget</h2>
<p>The piano widget is shown when the application starts, and can be restored from the left menu &#39;Piano&#39; button when closed.</p>
<p>You can double or halve note duration, or add dot duration, to a note using the piano tool. </p>
<p><img src="https://imgur.com/Rw4yDxP.gif" alt=""></p>
<h2 id="changing-note-length-from-the-button-ribbon">Changing note length from the button ribbon</h2>
<p>All the duration commands can be accomplished from the ribbon buttons.  </p>
<p><img src="https://imgur.com/n9bmamg.gif" alt=""></p>
<p>Note that the equivalent keyboard commands are also indicated on the right of each button, when it&#39;s available.  (there are only so many keys, so there are some ribbon buttons with no key shortcut). </p>
`;


export const enterPitchesHtmlar = `(Arabic)
<p>There are a few ways to enter notes in Smoosic.  You can click on the piano widget keys, or you can enter notes directly from the keyboard.</p>
<h2 id="your-first-smoosical-notes">Your first Smoosical notes</h2>
<h3 id="notes-from-the-keyboard">Notes from the keyboard</h3>
<p>The keys a-g on the computer keyboard will enter a corresponding note, A-G, on the staff (Most key commands in Smoosic have a mnemonic device).  The default behavior is for the cursor to advance when a note is entered in this way.  (Future behavior, auto-advance can be overridden). You navigate to the notes using the keyboard navigation arrows.</p>
<p><img src="https://imgur.com/lxR0NI7.gif" alt=""></p>
<p>You change the octave from the keyboard using the &#39;_&#39; and &#39;+&#39; (underscore, aka shift-minus, and plus), and change notes chromatically using &#39;-&#39; and &#39;=&#39; key.  The mnemonic device for this is &#39;plus and minus&#39; for raising and lowering pitches.  You can change the enharmonic spelling of the note using the &#39;Shift-E&#39; (mnemonic: E for enharmonic - get it?).  And Shift-F gives you a courtesy, or cautionary, accidental (mnemonic - F comes after E).</p>
<p><img src="https://imgur.com/1tC94sV.gif" alt=""></p>
<p>You can create chords and intervals using the number keys along the top of the keyboard.  The &#39;3&#39; key makes a third, the &#39;4&#39; key a fourth, and so on.  Shift+number gives you the interval down.</p>
<p><img src="https://imgur.com/IwoeWi3.gif" alt=""></p>
<p>Note that the interval starts from the highest note in the chord, for intervals going up, and the lowest note in the chord, for intervals going down.  You can select individual pitches in the chord using &#39;Shift-Up Arrow&#39; as shown.  This is similar to how modifiers like dynamics are selected.  Once you have the pitch selected, you can change it using the up-down commands shows above, or change the enharmonic spelling.</p>
<p>There is currently no way to remove a single pitch from the chord.  If you want to collapse the chord, just type a letter a-g on the keyboard, and it will be replaced with a single note.</p>
<h3 id="notes-from-the-piano-tool">Notes from the piano tool</h3>
<p>You can also add notes to your score with the piano tool, by clicking on the corresponding notes.</p>
<p><img src="https://imgur.com/MOMlIg3.gif" alt=""></p>
<p>Clicking on the piano gives the selected note the piano pitch.  The octave of the note is based on the clef, so for treble clef, the &#39;C&#39; is middle &#39;C&#39;.  You can change the octave of the note, and move the pitch up and down.  The top buttons affect the pitch, and the bottom buttons navigate or change the length of the note.  Clicking on the chord button acts like a &#39;sustain&#39; that puts additional notes in chords.</p>
<p>Everything that can be done from the piano widget, and most things in Smoosic generally, can be done more efficiently with keyboard commands. Once you are comfortable with the computer keyboard, you can free up some screen real-estate by closing the piano widget (cross control in lower left).  You can bring it up again with the piano menu button on the left.</p>
`;
