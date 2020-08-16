
var smoLanguageStringEn = `[
 {
  "ctor": "SuiLoadFileDialog",
  "dialogElements": [
   {
    "staticText": [
     {
      "label": "Load File"
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
      "label": "Save Score"
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
      "label": "Print Complete"
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
      "label": "Measure Properties"
     }
    ]
   },
   {
    "id": "pickupMeasure",
    "label": "Pickup Measure",
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
      "label": "Tempo Properties"
     }
    ]
   },
   {
    "id": "tempoMode",
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
    "id": "beatDuration",
    "label": "Unit for Beat",
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
    "id": "orientation",
    "label": "Orientation",
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
    "label": "Start Position",
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
    "label": "End Position",
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
    "value": "yamaJson",
    "text": "Yama"
   },
   {
    "value": "cancel",
    "text": "Cancel"
   }
  ]
 },
 {
  "ctor": "SuiTimeSignatureMenu",
  "label": "Time Signature",
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
  "label": "Key",
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
  "label": "Time Signature",
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
  "label": "Key",
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
    "text": "Cancel"
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

var quickStartHtmlen = `
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


var selectionHtmlen = `
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


var enterDurationsHtmlen = `
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


var enterPitchesHtmlen = `
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

var workingWithTexten = `
<h2 id="text-modes-in-smoosic">Text Modes in Smoosic</h2>
<p>Working with text in Smoosic is slightly different experience than editing music notation.  While you are entering, moving. or resizing the text, normal navigation with the cursor keys and music entry is suspended, and only the text you are working with is fully visible.  There is a dialog box with a few limited options, such as exiting text-entry mode.  This is true of text block, lyrics, and chords.  Once you finish entering the text, you get a different dialog box similar to the one you can use to edit modifiers such as slurs, crescendos, etc.</p>
<p><img src="https://imgur.com/EKDIUi5.png" alt=""></p>
<h2 id="text-blocks">Text Blocks</h2>
<p>Text blocks, also called &#39;Score text&#39; because it is not tied to a musical element, is free-form text that can be placed anywhere.  It can be used for titles, credits, etc.  It can also be set up for pagination using escape sequences. <strong>**</strong>  Unicode characters are also allowed.</p>
<p>You create a text block by selecting the big &#39;T&#39; on the text ribbon, with the cursor symbol (diagram).  You enter the text as you like it (only a single line is supported right now, if you want multiple lines you have to stack them).  </p>
<p><img src="https://imgur.com/kSMHoDl.png" alt=""></p>
<h2 id="lyrics">Lyrics</h2>
<p>Lyrics are entered by clicking on the lyrics button (do-re-mi).  Lyrics are entered per note.  When you hit space bar or - sign, the focus is advanced to the next note/lyric.  A &#39;-&#39; sign by itself in a lyric gives you a horizontal line.  When you want to leave lyric editing mode, just like other text entry modes, click on the &#39;Done editing&#39; button on the dialog. Note that the dialog can be moved around if it interferes with the music you are trying to edit.  (This is true of all dialog boxes in Smoosic.)  The final dialog box allows you to switch to a different verse.</p>
<p><img src="https://imgur.com/FfKOUUQ.png" alt=""></p>
<h2 id="chord-changes">Chord changes</h2>
<p>Chord changes button is in the same ribbon group as lyrics, and the editing experience is pretty similar.  There are some magic key strokes:</p>
<ul>
<li>^ (shift-6) starts or ends superscript mode</li>
<li>%  (shift-5) starts or ends subscript mode</li>
<li>If you immediately follow subscript mode by superscript mode, the scripts are &#39;stacked&#39;.</li>
<li>b, #, + , (, ) , &#39;/&#39; result in their respective symbols.</li>
</ul>
<p>Right now chord symbol entry is not too WYSIWYG - the actual chord rendering is done when the editing mode is done, which is a bit annoying.  I will be improving this as time goes on.</p>
<p><img src="https://imgur.com/a2ldLDX" alt=""></p>`;
