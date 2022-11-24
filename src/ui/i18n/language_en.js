
export const smoLanguageStringEn = `{
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
        "label": "Tempo Mode",
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
        "label": "Unit for Beat",
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
      "ctor": "SuiTextBlockDialog",
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
      "label": "File",
      "menuItems": [
       {
        "icon": "folder-new",
        "text": "New Score",
        "value": "newFile"
       },
       {
        "icon": "folder-open",
        "text": "Open",
        "value": "openFile"
       },
       {
        "icon": "",
        "text": "Quick Save",
        "value": "quickSave"
       },
       {
        "icon": "folder-save",
        "text": "Save",
        "value": "saveFile"
       },
       {
        "icon": "",
        "text": "Print",
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
        "text": "Cancel",
        "value": "cancel"
       }
      ]
     },     
     {
      "ctor": "SuiKeySignatureMenu",
      "label": "Key",
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
      "label": "Time Sig",
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
      "label": "Lines",
      "menuItems": [
       {
        "icon": "cresc",
        "text": "Crescendo",
        "value": "crescendo"
       },
       {
        "icon": "decresc",
        "text": "Decrescendo",
        "value": "decrescendo"
       },
       {
        "icon": "slur",
        "text": "Slur",
        "value": "slur"
       },
       {
        "icon": "slur",
        "text": "Tie",
        "value": "tie"
       },
       {
        "icon": "ending",
        "text": "nth ending",
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
      "buttonText": "File"
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

export const cardKeysHtmlEn = `
<h3 id="welcome-to-smoosic">Welcome to Smoosic</h3>
<p>Smoosic was designed to allow you to enter music as fast as you can type, once you learn some basic commands and patterns.  While music can be entered in multiple ways, the fastest/easiest way to create or edit in Smoosic is to use some basic keyboard shortcuts.</p>
<p>You can customize the key bindings (which keys do what) by changing the files in <code>src/ui/keyBindings/</code> directory, or by providing your own bindings.  See the <code>custom-keybinding.html</code> in the project that demonstrates how to create your own key bindings.
<img src="https://imgur.com/jJ5utJm.gif" alt=""></p>
`;

export const cardNotesLetterHtmlEn = `
<p>Most key commands in Smoosic have a mnemonic device.  The keys <strong>a-g</strong> on the computer keyboard will enter a corresponding note, A-G, on the staff.  The default behavior is for the cursor to advance when a note is entered in this way.  This can be overridden in the &#39;Score Preferences&#39; dialog. You navigate to the notes using the keyboard navigation arrows.</p>
<p><img src="https://imgur.com/lxR0NI7.gif" alt=""></p>
<p>Some conventions used in this documentation: </p>
<p>Keystrokes are specified in <strong>bold</strong>, e.g. <strong>x</strong> means the &#39;x&#39; key.  <strong>Shift+E</strong> means to press the <strong>Shift</strong> and <strong>E</strong> keys at the same time.</p>
<p>Key sequences are specified on their own line:</p>
<p><strong>/</strong> <strong>a</strong></p>
<p>means to press the <strong>/</strong> key followed by the <strong>a</strong> key.</p>
`;

export const cardNotesChromaticHtmlEn = `
<p>You change notes chromatically using <strong>-</strong> and <strong>=</strong> key.  You can change the octave using the <strong>_</strong> (underscore) and <strong>+</strong> (plus) keys.   The mnemonic device for this is &#39;plus and minus&#39; for raising and lowering pitches.  You can change the enharmonic spelling of the note using the <strong>Shift+E</strong> (mnemonic: E for enharmonic - get it?).  And <strong>Shift+F</strong> gives you a courtesy, or cautionary, accidental (mnemonic - F comes after E).</p>
<p><img src="https://imgur.com/1tC94sV.gif" alt=""></p>
`;

export const cardNotesChordsHtmlEn = `
<p>You can create chords and intervals using the number keys along the top of the keyboard.  The <strong>3</strong> key makes a third, the <strong>4</strong> key a fourth, and so on.  <strong>Shift+3</strong> gives you the 3rd below.</p>
<p>You can toggle selection to individual pitches by using <strong>Shift+UpArrow</strong>. So to create a G triad, starting with <strong>g</strong>, hit <strong>3</strong> for the &#39;B&#39;, <strong>3</strong> again for the &#39;D&#39;.  So far, we have G major.  To lower the 3rd, <strong>Shift+up</strong> to select the &#39;B&#39;, then <strong>-</strong> to lower the pitch.</p>
<p><img src="https://imgur.com/NGXRJQZ.gif" alt=""></p>
`;

export const cardNotesRestsHtmlEn = `
<p>You can toggle notes to rests by pressing <strong>r</strong> or <strong>Delete</strong>.</p>
<p>In Smoosic, you can&#39;t truly delete a note - a 4/4 bar will always have 4 beats of music.  But you can &#39;hide&#39; notes by creating invisible rests.  This is another use of <strong>Delete</strong>.</p>
<p><strong>Delete</strong> follows standard toggle behavior - deleted notes become rests, and delete rests become invisible rests.  Hitting <strong>Delete</strong> a third time restores the note.</p>
<p>Invisible rests show up as partially opaque in the display.  But when printed, they are truly invisible.</p>
<p><img src="https://imgur.com/c2FVZi3.gif" alt=""></p>
`
export const cardDurationNotesHtmlEn = `
<p>Changing duration is a little different in Smoosic than other programs.  Rather than selecting a duration (quarter note, etc.), you change (increase/decrease) the duration of existing notes.</p>
<p>You can change the length of notes using the <strong>,</strong> and <strong>.</strong> (comma and period) keys, which halve and double the note lengths, respectively.  You can add a dot to the length of the note (multiplying length by 3/2 for the first dot, and 5/4 for the second dot, if you like to think of it that way) or remove a dot, using the <strong>&gt;</strong> (<strong>Shift+,</strong>) and <strong>,</strong>.  The mnemonic device for these is <strong>&gt;</strong> makes note duration greater. <strong>&lt;</strong>  makes note duration less.  (On most QWERTY keyboards, comma shifted is <strong>&lt;</strong> and period shifted is <strong>&gt;</strong>).</p>
<p><img src="https://imgur.com/5ZWq2Xe.gif" alt=""></p>`;

export const cardDurationTupletsHtmlEn = `
<p>You can create tuplets from the keyboard by typing <strong>Ctrl+3</strong>, <strong>Ctrl+5</strong> or <strong>Ctrl+7</strong> for triplets, quintuplets, and septuplets, respectively.  Individual notes in a tuplet can be doubled and halved with the duration keys <strong>-</strong> (minus) and <strong>=</strong> (equals), just like non-tuplets.  You &#39;untupletify&#39; a tuplet by <strong>Ctrl+0</strong>.</p>
<p><img src="https://imgur.com/uBpQwXD.gif" alt=""></p>`;

export const cardSelectionsNotesHtmlEn = ` <p>Many operations in Smoosic act on the selected music.  You select the music the way you select text in a text app, with the <strong>→</strong> to move right, <strong>←</strong> to move left.   <strong>Shift+→</strong> expands the selection left, etc. </p>
<p><img src="https://imgur.com/5ZWq2Xe.gif" alt=""></p>
<p>In the last example, note how the selection is preserved as the notes get shorter.  When you change something, Smoosic will try to keep the selection as close as possible to what you had when the music changes.
You can also use the mouse to select notes.  Selecting a range across multiple staves is not supported (yet).  But you can use <strong>Control+click</strong> to select notes in multiple staves.</p>
`;
export const cardSelectionsModifiersHtmlEn = ` 
<p>A modifier is anything that affects a note, such as an articulation or dynamic.  Many modifiers, especially those that affect multiple notes, can be selected with the keyboard.  To select a modifier such as a slur, crescendo, or ending, use &#39;Alt-left arrow&#39; or &#39;Alt-right arrow&#39; when the first or last note of the modifier is selected.  This will move the selecttion between modifiers that apply to that note.</p>
<p>You can also select modifiers with the mouse. </p>
<p>Once selected, you can bring up the modifier dialog by hitting &#39;Enter&#39;.</p>
<p><img src="https://imgur.com/rhOyIKD.gif" alt=""></p>
`;

export const cardSelectionsNonSelectableHtmlEn = `
<p>Some modifiers, such as articulations, aren&#39;t selectable.  The keys <strong>h</strong>, <strong>i</strong>, <strong>j</strong>, and <strong>k</strong> bring up articulations that aren&#39;t selectable, but are placed on the note automatically.  You can toggle position and on/off by repeating the key.</p>
<p>Additional articulations are available from the of articulation button group.</p>
<p>You can customize the articulations selected by the key bindings by changing the <code>ui/keyBindings/editorKeys.ts</code> file, or by providing your own bindings.  See the <code>custom-keybinding.html</code> example in the project.</p>
<p><img src="https://imgur.com/RqY9Nzo.gif" alt=""></p>`;


export const cardSelectionsSlashHtmlEn = `
<p>The buttons on the left (for L-to-R languages) bring up menus and dialogs.  These dialogs can also be accessed via the &#39;Slash&#39; menus.</p>
<p>For instance, slurs, ties, hairpins and other modifiers that work on a range of music are created from the &#39;Lines&#39; menu.  You can access this via the slash menu:</p>
<p><strong>/</strong> <strong>l</strong> (el, not one) <strong>2</strong></p>
<p>Then you can use the modifier selection to edit the phrase marking to your taste.</p>
<p>You can also select modifiers or any menu option with the mouse.</p>
<p><img src="https://imgur.com/4QfEfSs.gif" alt=""></p>`;

export const cardBeamsAndStemsDirectionHtmlEn = `
<h3 id="beams-and-stems-part-1-direction">Beams and Stems part 1: Direction</h3>
<p>The direction of beams and stems is controlled selecting the notes you want to affect and typing <strong>Shift+B</strong>.  The selection will be toggled between auto (default), up, and down. &#39;Auto&#39; means stems are up if the notes are below 3rd line, so the beam direction will change if the notes do. </p>
<p>Note that there are 3 settings, even though only 2 will produce a visible change for any given stem, since &#39;auto&#39; will be either up or down.  </p>
<p><img src="https://imgur.com/itUMVBF.gif" alt=""></p>
`;
export const cardBeamsAndStemsGroupingHtmlEn = `
<p>By default, notes are auto-beamed so that a 1/4 note is beamed.  So 1/8 notes in 4/4 time will be beamed in 2&#39;s, 16th notes in 4&#39;s etc.  In triple time (e.g. 6/8, 9/8), 1/8 notes are beamed in 3&#39;s.  You can change this default in the Score Preferences.</p>
<p>You can split a beam at any point using the <strong>x</strong> (mnemonic: <strong>x</strong> to cancel beaming.  You can create a beam by selecting the notes and typing <strong>Shift-X</strong>.  Only notes with 1/8 note duration or less can be beamed.</p>
<p><img src="https://imgur.com/wZmXKq8.gif" alt=""></p>
`;

export const cardMeasuresAddDeleteHtmlEn = `
<p>You can add a single measure at the current selection point by pressing <strong>Insert</strong>.  <strong>Shift+Insert</strong> appends the new measure to the selected measure.</p>
<p>To add many measures, you can do this from the &#39;Add Measures&#39; dialog.  This can be brought up through the &#39;Measure&#39; button on the left, or by pressing </p>
<p><strong>/</strong>  <strong>a</strong>  <strong>0</strong> (zero)</p>
<p>Deleting the selected measures can be done from the &#39;Measures&#39; menu on the left, or by pressing </p>
<p><strong>/</strong>  <strong>a</strong> <strong>1</strong>.</p>
<p>Note the insert and delete key behavior is asymmetric.  The <strong>Delete</strong> key is used to toggle notes to rests, and also I thought this made it too easy to accidentally delete a lot of music. </p>
<p><img src="https://imgur.com/gGuxP7G.gif" alt=""></p>
`;

export const cardVoicesCreateDeleteHtmlEn = `
<p>If you need different rhythms in the same stave, you can do this by creating multiple voices.  You add a voice to a measure using the voice buttons - you can have up to 4 voices in a measure.  </p>
<p>You can select a differnt voice using the voice buttons also.  </p>
<p>You can delete any voice except voice 1 by selecting the voice, and selecting the <strong>Vx</strong> button.  When a voice is deleted, any voices with a higher number are bumped down - e.g., if you delete voice 2, voice 3 becomes voice 2, etc.</p>
<p>By default, the odd-numbered voices (indexed from 1) have stems that point up.  You can use the <strong>Ctrl+B</strong> to change the staff direction if you want.</p>
<p>Notes in voices &gt; 1 have different colors in the editor.  This is to make editing easier.  All voices are black when the music is printed.</p>
<p><img src="https://imgur.com/HIUH2Pp.gif" alt=""></p>
`;
export const cardVoicesHiddenNotesHtmlEn = `
<p>In Smoosic, there are no &#39;empty&#39; beats - all the beats in a measure are padded with rests to align playback.  But sometimes this padding can be confusing to the musician playing the part.  This is often the case in piano music - the rests in the following example don&#39;t make any sense in a piano part.  Their only purpose is to align the notes at the end of the measure.</p>
<p>Earlier we introduced &#39;invisible&#39; rests.  The 1/4 rests in voice 2 are only there to align the voice, so we can hide them and the meaning is clear.  Pressing <strong>Delete</strong> on the rests hides them in the printed version.</p>
<p><img src="https://imgur.com/PWJrR3U.gif" alt=""></p>
`;

export const helpCards = [cardKeysHtmlEn, cardNotesLetterHtmlEn, cardNotesChromaticHtmlEn, cardNotesChordsHtmlEn,
  cardNotesRestsHtmlEn, cardDurationNotesHtmlEn, cardDurationTupletsHtmlEn,
  cardSelectionsNotesHtmlEn, cardSelectionsModifiersHtmlEn, cardSelectionsNonSelectableHtmlEn, cardSelectionsSlashHtmlEn,
  cardBeamsAndStemsDirectionHtmlEn, cardBeamsAndStemsGroupingHtmlEn,
  cardMeasuresAddDeleteHtmlEn, cardVoicesCreateDeleteHtmlEn, cardVoicesHiddenNotesHtmlEn
];