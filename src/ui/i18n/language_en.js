
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
  "label": "Measure Properties",
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
  "label": "Score Layout",
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
  "label":"Staves",
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
  "ctor": "SuiFileMenu",
  "label":"File",
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
