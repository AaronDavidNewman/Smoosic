# Smoosic source code

Smoosic is a simple (?) but fully-functional-aspirant editor for music written in javascript.  
  It uses VexFlow
project from [GitHub Vex Flow](https://github.com/0xfe/vexflow) for rendering.

## Note on prefixes:

 1. SMO == Serializable Music Ontology, stuff I made up. 
 2. vx == VF == Vexflow rendering engine by https://github.com/0xfe
 3. SUI == Smo User Interface.
 
 Where it makes sense, SMO uses VF conventions, e.g. ticks to store note durations
 and identifiers for notes and things.

 ## Note on structure:
 * smo/data contains all the serializable elements of the music
 * smo/Xform contains logic for modifying the music according to the usual rules involving key signatures, beaming, etc.
 * common are utilities and helper methods for general html/web/music
 * ui is the UI, menus and all that
 * render is for rendering
 * styles contain css and svg for inline images
 * test contains the test pages
 
## Smo Source Code Auto-generated Documentation:
---
 
 

# Directory: smo/data
Serializable Music Ontology classes and logical structure
---
## Places to deserialize scores:
.  controller/scoreFromQueryString
.  fileDialog.js/SuiLoadFileDialog.commit
. menus.js/SuiFileMenu.selection
there is a reference to deserialize in undo.js but that is probably OK to stay.

## SmoMeasure - data for a measure of music
Many rules of musical engraving are enforced at a measure level, e.g. the duration of
notes, accidentals, etc.
### See Also:
Measures contain *notes*, *tuplets*, and *beam groups*.  So see `SmoNote`, etc.
Measures are contained in staves, see also `SystemStaff.js`
## SmoMeasure Methods:

### defaultAttributes
attributes that are to be serialized for a measure.

### serializeColumnMapped
Some measure attributes that apply to the entire column are serialized
separately.  Serialize those attributes, but only add them to the
hash if they already exist for an earlier measure

### serialize
Convert this measure object to a JSON object, recursively serializing all the notes,
note modifiers, etc.

### deserialize
restore a serialized measure object.  Usually called as part of deserializing a score,
but can also be used to restore a measure due to an undo operation.

### defaultPitchForClef
Accessor for clef objects, which are set at a measure level.
#### TODO: learn what all these clefs are

### getDefaultNotes
Get a measure full of default notes for a given timeSignature/clef.
returns 8th notes for triple-time meters, etc.

### getDefaultMeasure
For create the initial or new measure, get a measure with notes.

### SmoMeasure.getDefaultMeasureWithNotes
Get a new measure with the appropriate notes for the supplied clef, instrument

###   SVG mixins
We store some rendering data in the instance for UI mapping.

### getClassId
create a identifier unique to this measure index so it can be easily removed.

### getRenderedNote
The renderer puts a mapping between rendered svg groups and
the logical notes in SMO.  The UI needs this mapping to be interactive,
figure out where a note is rendered, what its bounding box is, etc.

### createMeasureTickmaps
A tickmap is a map of notes to ticks for the measure.  It is speciifc per-voice
since each voice may have different numbers of ticks.  The accidental map is
overall since accidentals in one voice apply to accidentals in the other
voices.  So we return the tickmaps and the overall accidental map.

### getDynamicMap
returns the dynamic text for each tick index.  If
there are no dynamics, the empty array is returned.

### tuplet methods.

#### tupletNotes

#### tupletIndex
return the index of the given tuplet

#### getTupletForNote
Finds the tuplet for a given note, or null if there isn't one.

### populateVoice
Create a new voice in this measure, and populate it with the default note
for this measure/key/clef

### measure modifier mixins

## Measure modifiers are elements that are attached to the bar itself, like barlines or measure-specific text,
repeats - lots of stuff

### SmoTempoText
Tempo marking and also the information about the tempo.

### eq
Return equality wrt the tempo marking, e.g. 2 allegro in textMode will be equal but
an allegro and duration 120bpm will not.

## SmoNote
Data for a musical note.  THe most-contained-thing, except there can be note modifiers
Basic note information.  Leaf node of the SMO dependency tree (so far)
## SmoNote Methods
---

### Description:
see defaults for params format.

### _addModifier
add or remove sFz, mp, etc.

## Description:
Clone the note, but use the different duration.  Changes the length
of the note but nothing else.

### getClassSelector
returns a selector used to find this text block within a note.

## SmoDynamicText
standard dynamics text

## SmoScore
The whole score.
## Score methods:
---

### serialize
### Serialize the score.  The resulting JSON string will contain all the staves, measures, etc.

### deserialize
### Restore an earlier JSON string.  Unlike other deserialize methods, this one expects the string.

### getDefaultScore
Gets a score consisting of a single measure with all the defaults.

### getEmptyScore
Create a score object, but don't populate it with anything.

### _numberStaves
recursively renumber staffs and measures.

### addDefaultMeasureWithNotes
Add a measure to the score with the supplied parameters at the supplied index.
The defaults per staff may be different depending on the clef, key of the staff.

### deleteMeasure
Delete the measure at the supplied index in all the staves.

### addMeasure
Give a measure prototype, create a new measure and add it to each staff, with the
correct settings for current time signature/clef.

### replaceMeasure
Replace the measure at the given location.  Probably due to an undo operation or paste.

### addScoreText

### replace staff
Probably due to an undo operation, replace the staff at the given index.

### addKeySignature
Add a key signature at the specified index in all staves.

### addInstrument
add a new staff (instrument) to the score

### removeStaff
Remove stave at the given index

## SmoScoreText
Identify some text in the score, not associated with any musical element, like page
decorations, titles etc.

### backupParams
For animation or estimation, create a copy of the attributes that can be modified without affecting settings.

## StaffModifiers
This file contains modifiers that might take up multiple measures, and are thus associated
with the staff.
## Staff Modifier Classes:
---
## StaffModifierBase
Base class that mostly standardizes the interface and deals with serialization.

## SmoStaffHairpin
## Descpription:
crescendo/decrescendo

## SmoSlur
slur staff modifier
## SmoSlur Methods:
---

## SmoSystemStaff
A staff is a line of music that can span multiple measures.
A system is a line of music for each staff in the score.  So a staff
spans multiple systems.
A staff modifier connects 2 points in the staff.

### defaultParameters
the parameters that get saved with the score.

### defaults
default values for all instances

### serialize
JSONify self.

### deserialize
parse formerly serialized staff.

### addStaffModifier
add a staff modifier, or replace a modifier of same type
with same endpoints.

### removeStaffModifier
Remove a modifier of given type and location

### getModifiersAt
get any modifiers at the selected location

### getSlursStartingAt
like it says.  Used by audio player to slur notes

### getSlursEndingAt
like it says.

### accesor getModifiers

### applyBeams
group all the measures' notes into beam groups.

### getRenderedNote
used by mapper to get the rendered note from it's SVG DOM ID.

### addRehearsalMark
for all measures in the system, and also bump the
auto-indexing

### removeRehearsalMark
for all measures in the system, and also decrement the
auto-indexing

### deleteMeasure
delete the measure, and any staff modifiers that start/end there.

### addKeySignature
Add key signature to the given measure and update map so we know
when it changes, cancels etc.

### removeKeySignature
remove key signature and update map so we know
when it changes, cancels etc.

### numberMeasures
After anything that might change the measure numbers, update them iteratively

## addMeasure
Add the measure at the specified index, splicing the array as required.

### getStemDirection
Return the stem direction, so we can bracket the correct place

# Directory: smo/xform
Logic that transforms music according to common theory rules (e.g. accidentals, time signatures
---
### run

### _isRemainingTicksBeamable
look ahead, and see if we need to beam the tuplet now or if we
can combine current beam with future notes.

## PasteBuffer
Hold some music that can be pasted back to the score

### _populateSelectArray
copy the selected notes into the paste buffer with their original locations.

### _populateMeasureArray
Before pasting, populate an array of existing measures from the paste destination
so we know how to place the notes.

### _populatePre
When we paste, we replace entire measures.  Populate the first measure up until the start of pasting.

### _populateVoice
Create a new voice for a new measure in the paste destination

### _populateModifier
If the destination contains a modifier start and end, copy and paste it.

### _populateNew
Start copying the paste buffer into the destination by copying the notes and working out
the measure overlap

### _populatePost
When we paste, we replace entire measures.  Populate the last measure from the end of paste to the
end of the measure with notes in the existing measure.

## smoTickIterator
This file implements over the notes in a single measure.
This is useful when redrawing the notes to transform them into something else.
E.g. changing the duration of a note in a measure.  It keeps track of accidentals,
ticks used etc.
### Usage:
``javascript``
`var iterator=new smoTickIterator(measure)
`iterator.iterate (actor)`
where actor is a function that is called at each tick in the voice.

### iterator format:
iterator: {
notes:[note1,note2...],
delta: tick value of this note
totalDuration: ticks up until this point
note: current note,
index: running index

### Tickmap format
`VX.TICKMAP(measure)`
Iterate through all notes and creates information about the notes, like
tuplet ticks, index-to-tick map.  The tickmap is useful for finding things out like how much
time is left in a measure at a given note index (tickIndex).

## method documentation follows
---

### _getAccidentalsForKey
Update `map` with the correct accidental based on the key signature.

### updateAccidentalMap
Keep a running tally of the accidentals for this voice
based on the key and previous accidentals.

### getActiveAccidental
return the active accidental for the given note

### _iterate
Internal callback for iterator.

### iterate
Call `actor` for each iterator tick

### getTickIndex
get the index into notes array that takes up
duration of ticks */

### skipNext
skip some number of notes in the iteration, because we want to skip over them.

## doubleDuration
double the duration of a note in a measure, at the expense of the following
note, if possible.  Works on tuplets also.

## halveDuration
Replace the note with 2 notes of 1/2 duration, if possible
Works on tuplets also.

## makeTuplet
Makes a non-tuplet into a tuplet of equal value.

## unmakeTuplet
Makes a tuplet into a single with the duration of the whole tuplet

## dotDuration
Add a dot to a note, if possible, and make the note ahead of it shorter
to compensate.

## undotDuration
Add the value of the last dot to the note, increasing length and
reducing the number of dots.

## transpose
Transpose the selected note, trying to find a key-signature friendly value

## setPitch
pitches can be either an array, a single pitch, or a letter.  In the latter case,
the letter value appropriate for the key signature is used, e.g. c in A major becomes
c#

## addPitch
add a pitch to a note chord, avoiding duplicates.

## interval
Add a pitch at the specified interval to the chord in the selection.

# selections.js
Editing operations are performed on selections.  A selection can be different things, from a single pitch
to many notes.  These classes standardize some standard selection operations.

## SmoSelector
There are 2 parts to a selection: the actual musical bits that are selected, and the
indices that define what was selected.  This is the latter.  The actual object does not
have any methods so there is no constructor.

## return true if sel1 > sel2.

### getNoteKey
Get a key useful for a hash map of notes.

## applyOffset
offset 'selector' the difference between src and target, return the result

## SmoSelection
A selection is a selector and a set of references to musical elements, like measure etc.
The staff and measure are always a part of the selection, and possible a voice and note,
and one or more pitches.  Selections can also be made from the UI by clicking on an element
or navigating to an element with the keyboard.

### measureSelection
A selection that does not contain a specific note

### noteSelection
a selection that specifies a note in the score

### renderedNoteSelection
this is a special selection that we associated with all he rendered notes, so that we
can map from a place in the display to a place in the score.

## nextNoteSelection
Return the next note in this measure, or the first note of the next measure, if it exists.

### getMeasureList
Gets the list of measures in an array from the selections

### selectionsSameMeasure
Return true if the selections are all in the same measure.  Used to determine what
type of undo we need.

## SmoTickTransformer
Base class for duration transformations.  I call them transformations because this can
create and delete notes, as opposed to modifiers which act on existing notes.

## applyTransform
create a transform with the given actors and run it against the supplied measure

## transformNote
call the actors for each note, and put the result in the note array.
The note from the original array is copied and sent to each actor.

## A note transformer is just a function that modifies a note in some way.
Any number of transformers can be applied to a note.

## VxContractActor
Contract the duration of a note, filling in the space with another note
or rest.

## VxStretchTupletActor
Stretch a note in a tuplet, removing or shortening other notes in the tuplet
## Parameters:
{changeIndex:changeIndex, multiplier:multiplier,measure:measure}

## VxContractActor
Contract the duration of a note in a tuplet by duplicate
notes of fractional length

## VxUnmakeTupletActor
Turn a tuplet into a non-tuplet of the same length
## Parameters:
startIndex: start index of tuplet
endIndex: end index of tuplet
measure: Smo measure that the tuplet is contained in.

## VxUnmakeTupletActor
Turn a tuplet into a non-tuplet of the same length
parameters:
{tickmap:tickmap,ticks:ticks,

## UndoBuffer
manage a set of undo or redo operations on a score.  The objects passed into
undo must implement serialize()/deserialize()
## Buffer format:
A buffer is one of 3 things:
* A single measure,
* A single staff
* the whole score.

### addBuffer
Add the current state of the score required to undo the next operation we
are about to perform.  For instance, if we are adding a crescendo, we back up the
staff the crescendo will go on.

### _pop
Internal method to pop the top buffer off the stack.

## Before undoing, peek at the top action in the q
so it can be re-rendered

## undo
Undo the operation at the top of the undo stack.  This is done by replacing
the music as it existed before the change was made.

## SmoUndoable
Convenience functions to save the score state before operations so we can undo the operation.
Each undo-able knows which set of parameters the undo operation requires (measure, staff, score).

# Directory: common
Utiilities not specifically related to SMO
---
# htmlHelpers
Helper functions for buildling UI elements

## buildDom
returns an object that  lets you build a DOM in a somewhat readable way.
## Usage:
var b = htmlHelpers.buildDom;
var r =
b('tr').classes('jsSharingMember').data('entitykey', key).data('name', name).data('entitytype', entityType).append(
b('td').classes('noSideBorderRight').append(
...
$(parent).append(r.dom());

## smoMusic
Helper functions that build on the VX music theory routines, and other
utilities I wish were in VF.Music but aren't
### Note on pitch and duration format
We use some VEX music theory routines and frequently need to convert
formats from SMO format.

## smoMusic static methods:
---

### vexToCannonical
return Vex canonical note enharmonic - e.g. Bb to A#
Get the canonical form

### circleOfFifths
A note array in key-signature order

### circleOfFifthsIndex
gives the index into circle-of-fifths array for a pitch, considering enharmonics.

### addSharp
Get pitch to the right in circle of fifths

### addFlat
Get pitch to the left in circle of fifths

### addSharps
Add *distance* sharps/flats to given key

### addFlats
Add *distance* sharps/flats to given key

### smoPitchesToVexKeys
Transpose and convert from SMO to VEX format so we can use the VexFlow tables and methods

### smoScalePitchMatch
return true if the pitches match, but maybe not in same octave

### pitchToLedgerLineInt

### pitchToVexKey
convert from SMO to VEX format so we can use the VexFlow tables and methods
example:
`{letter,octave,accidental}` object to vexKey string `'f#'`

### get enharmonics
return a map of enharmonics for choosing or cycling.  notes are in vexKey form.

### getEnharmonic(noteProp)
cycle through the enharmonics for a note.

### getKeyFriendlyEnharmonic
fix the enharmonic to match the key, if possible
`getKeyFriendlyEnharmonic('b','eb');  => returns 'bb'

### toValidKeySignature
When transposing, make sure key signature is valid, e.g. g# should be
Ab

### getIntervalInKey
give a pitch and a key signature, return another pitch at the given
diatonic interval.  Similar to getKeyOffset but diatonic.

### get letterPitchIndex
Used to adjust octave when transposing.
Pitches are measured from c, so that b0 is higher than c0, c1 is 1 note higher etc.

### letterChangedOctave
Indicate if a change from letter note 'one' to 'two' needs us to adjust the
octave due to the `smoMusic.letterPitchIndex` (b0 is higher than c0)

### vexToSmoPitch
#### Example:
['f#'] => [{letter:'f',accidental:'#'}]

### smoPitchToVes
#### Example:
{letter:'f',accidental:'#'} => [f#/

### getKeyOffset
Given a vex noteProp and an offset, offset that number
of 1/2 steps.
#### Input:  smoPitch
#### Output:  smoPitch offset, not key-adjusted.

### keySignatureLength
return the number of sharp/flat in a key signature for sizing guess.

## closestVexDuration
return the closest vex duration >= to the actual number of ticks. Used in beaming
triplets which have fewer ticks then their stem would normally indicate.

### getKeySignatureKey
given a letter pitch (a,b,c etc.), and a key signature, return the actual note
that you get without accidentals
### Usage:
smoMusic.getKeySignatureKey('F','G'); // returns f#

### isPitchInKeySignature
Return true if the pitch is not an accidental in the give key, e.g.
f# in 'g' or c in 'Bb'

### Description:
Get ticks for this note with an added dot.  Return
identity if that is not a supported value.

### Description:
Get ticks for this note with one fewer dot.  Return
identity if that is not a supported value.

### ticksToDuration
Frequently we double/halve a note duration, and we want to find the vex tick duration that goes with that.

### durationToTicks
Uses VF.durationToTicks, but handles dots.

## smoSerialize
Helper functions that perform serialized merges, general JSON
types of routines.
---

### filteredMerge
Like vexMerge, but only for specific attributes.

## detokenize
If we are saving, replace token values with keys, since the keys are smaller.
if we are loading, replace the token keys with values so the score can
deserialize it

### serializedMerge
serialization-friendly, so merged, copied objects are deep-copied

### serializedMergeNonDefault
Used to reduce size of serializations.  Create a serialzation of
the object, but don't serialize attributes that are already the default
since the default will be set when the object is deserialized
#### parameters:
defaults - default Array
attrs - array of attributes to save
src - the object to serialize
dest - the json object that is the target.

### printXlate
print json with string labels to use as a translation file seed.

## svgHelpers
Mostly utilities for converting coordinate spaces based on transforms, etc.
### static class methods:
---

### unionRect
grow the bounding box two objects to include both.

### gradient
Create an svg linear gradient.
Stops look like this:
`[{color:"#eee", offset:"0%",opacity:0.5}]`
orientation is horizontal or vertical

### boxNote
update the note geometry based on current viewbox conditions.
This may not be the appropriate place for this...maybe in layout

### getTextBox
Get the logical bounding box of the text for placement.

### findIntersectingArtifactFromMap
Same as findIntersectionArtifact but uses a map of keys instead of an array

### findIntersectionArtifact
find all object that intersect with the rectangle

### measureBBox
Return the bounding box of the measure

### measurePerInch
Supported font units

### getFontSize
Given '1em' return {size:1.0,unit:em}

### pointBox
return a point-sized box at the given coordinate

### smoBox:
return a simple box object that can be serialized, copied
(from svg DOM box)

### adjustScroll
Add the scroll to the screen coordinates so we can find the mapped
location of something.

### svgViewport
set `svg` element to `width`,`height` and viewport `scale`

### logicalToClient
Convert a point from logical (pixels) to actual screen dimensions based on current
zoom, aspect ratio

### clientToLogical
return a box or point in svg coordintes from screen coordinates

### logicalToClient
return a box or point in screen coordinates from svg coordinates

# Directory: ui
Menus, dialogs and all that
---
## createUi
Convenience constructor, taking a renderElement and a score.

## suiController
Manages DOM events and binds keyboard and mouse events
to editor and menu commands, tracker and layout manager.
### Event model:
Events can come from the following sources:
1. menus or dialogs can send dialogDismiss or menuDismiss event, indicating a modal has been dismissed.
2. window resize events
3. keyboard, when in editor mode.  When modals or dialogs are active, wait for dismiss event
4. svg piano key events smo-piano-key
5. tracker change events tracker-selection

### bindResize
This handles both resizing of the music area (scrolling) and resizing of the window.
The latter results in a redraw, the former just resets the client/logical map of elements
in the tracker.

### renderElement
return render element that is the DOM parent of the svg

## keyBindingDefaults
Different applications can create their own key bindings, these are the defaults.
Many editor commands can be reached by a single keystroke.  For more advanced things there
are menus.

## editorKeyBindingDefaults
execute a simple command on the editor, based on a keystroke.

## trackerKeyBindingDefaults
Key bindings for the tracker.  The tracker is the 'cursor' in the music
that lets you select and edit notes.

### unbindKeyboardForModal
Global events from keyboard and pointer are handled by this object.  Modal
UI elements take over the events, and then let the controller know when
the modals go away.

# Dialog base classes

## SuiModifierDialogFactory
Automatic dialog constructors for dialogs without too many parameters
that operated on a selection.

## SuiDialogBase
Base class for dialogs.

### SuiDialogBase ctor
Creates the DOM element for the dialog and gets some initial elements

### printXlate
print json with string labels to use as a translation file seed.

### position
For dialogs based on selections, tries to place the dialog near the selection and also
to scroll so the dialog is in view

### position
Position the dialog near a selection.  If the dialog is not visible due
to scrolling, make sure it is visible.

### build the html for the dialog, based on the instance-specific components.

### _commit
generic logic to commit changes to a momdifier.

### Complete
Dialogs take over the keyboard, so release that and trigger an event
that the dialog is closing that can resolve any outstanding promises.

### _bindComponentNames
helper method to give components class names based on their static configuration

### display
make3 the modal visible.  bind events and elements.

### handleKeydown
allow a dialog to be dismissed by esc.

### bindKeyboard
generic logic to grab keyboard elements for modal

### _bindElements
bing the generic controls in most dialogs.

## SuiLayoutDialog
The layout dialog has page layout and zoom logic.  It is not based on a selection but score-wide

### dialogElements
all dialogs have elements define the controls of the dialog.

### backupOriginal
backup the original layout parameters for trial period

### _updateLayout
even if the layout is not changed, we re-render the entire score by resetting
the svg context.

### _handlePageSizeChange
see if the dimensions have changed.

### changed
One of the components has had a changed value.

### createAndDisplay
static method to create the object and then display it.

# dbComponents - components of modal dialogs.

## SuiRockerComponent
A numeric input box with +- buttons.   Adjustable type and scale

## SuiDragText
A component that lets you drag the text you are editing to anywhere on the score.
The text is not really part of the dialog but the location of the text appears
in other dialog fields.

## TBD: do this.

## SuiTextInPlace
Edit the text in an SVG element, in the same scale etc. as the text in the score SVG DOM.
This component just manages the text editing component of hte renderer.

## SuiTextInputComponent
Just get text from an input, such as a filename.

## SuiFileDownloadComponent
Download a test file using the file input.

## SuiToggleComponent
Simple on/off behavior

## SuiToggleComponent
Simple on/off behavior

## suiEditor
Editor handles key events and converts them into commands, updating the score and
display

## _render
utility function to render the music and update the tracker map.

##browserEventSource
Handle registration for events.  Can be used for automated testing, so all
the events are consolidated in one place so they can be simulated or recorded

### bindKeydownHandler
add a handler for the evKey event, for keyboard data.

### Description:
slash ('/') menu key bindings.  The slash key followed by another key brings up
a menu.

## RibbonButtons
Render the ribbon buttons based on group, function, and underlying UI handler.
Also handles UI events.
### RibbonButton methods
---

### _createButtonHtml
For each button, create the html and bind the events based on
the button's configured action.

## utController
a simple controller object to render the unit test cases.

# Directory: render/sui
SMO rendering logic and UI liasons
---
## suiFormatter
Perform adjustments on the score based on the rendered components so we can re-render it more legibly.

### _highestLowestHead
highest value is actually the one lowest on the page

### estimateMeasureHeight
The baseline is the top line of the staff.  aboveBaseline is a negative number
that indicates how high above the baseline the measure goes.  belowBaseline
is a positive number that indicates how far below the baseline the measure goes.
the height of the measure is below-above.  Vex always renders a staff such that
the y coordinate passed in for the stave is on the baseline.

## suiLayoutBase
A layout maps the measures and notes to a spot on the page.  It
manages the flow of music as an ordinary score.  We call it simple layout, because
there may be other layouts for parts view, or output to other media.

### get context
return the VEX renderer context.

### render
Render the current score in the div using VEX.  Rendering is actually done twice:
1. Rendering is done just to the changed parts of the score.  THe first time, the whole score is rendered.
2. Widths and heights are adjusted for elements that may have overlapped or exceeded their expected boundary.
3. The whole score is rendered a second time with the new values.

### undo
Undo is handled by the layout, because the layout has to first delete areas of the div that may have changed
, then create the modified score, then render the 'new' score.

### renderNoteModifierPreview
For dialogs that allow you to manually modify elements that are automatically rendered, we allow a preview so the
changes can be undone before the buffer closes.

### renderNoteModifierPreview
For dialogs that allow you to manually modify elements that are automatically rendered, we allow a preview so the
changes can be undone before the buffer closes.

### renderStaffModifierPreview
Similar to renderNoteModifierPreview, but lets you preveiw a change to a staff element.
re-render a modifier for preview during modifier dialog

### unrenderMeasure
All SVG elements are associated with a logical SMO element.  We need to erase any SVG element before we change a SMO
element in such a way that some of the logical elements go away (e.g. when deleting a measure).

### unrenderStaff
See unrenderMeasure.  Like that, but with a staff.

### _renderModifiers
Render staff modifiers (modifiers straddle more than one measure, like a slur).  Handle cases where the destination
is on a different system due to wrapping.

### forceRender
For unit test applictions that want to render right-away

### pollRedraw
if anything has changed over some period, prepare to redraw everything.

## suiMapper
Map the notes in the svg so the can respond to events and interact
with the mouse/keyboard

### loadScore
We are loading a new score.  clear the maps so we can rebuild them after
rendering

### _clearMeasureArtifacts
clear the measure from the measure and note maps so we can rebuild it.

### _getClosestTick
given a musical selector, find the note artifact that is closest to it,
if an exact match is not available

### updateMeasure
A measure has changed.  Update the music geometry for it

### updateMap
This should be called after rendering the score.  It updates the score to
graphics map and selects the first object.

### intersectingArtifact
given a bounding box, find any rendered elements that intersect with it

## suiLayoutBase
A layout maps the measures and notes to a spot on the page.  It
manages the flow of music as an ordinary score.  We call it simple layout, because
there may be other layouts for parts view, or output to other media.

### createScoreLayout
to get the score to appear, a div and a score object are required.  The layout takes care of creating the
svg element in the dom and interacting with the vex library.

### unrenderAll
Delete all the svg elements associated with the score.

### _measureToLeft
measure to 'left' is on previous row if this is the first column in a system
but we still use it to compute beginning symbols (key sig etc.)

### calculateBeginningSymbols
calculate which symbols like clef, key signature that we have to render in this measure.

### _justifyY
when we have finished a line of music, adjust the measures in the system so the
top of the staff lines up.

### _checkPageBreak
See if this line breaks the page boundary

### _estimateColumns
the new logic to estimate the dimensions of a column of music, corresponding to
a certain measure index.
returns:
{measures,y,x}  the x and y at the left/bottom of the render

## suiScroller
Respond to scroll events, and handle the scroll of the viewport

### class methods:
---

### setScrollInitial
tracker is going to remap the music, make sure we take the current scroll into account.

### handleScroll
handle scroll events.

### scrollVisible
Scroll such that the box is fully visible, if possible (if it is
not larger than the screen)

### scrollBox
get the current viewport, in scrolled coordinates.  When tracker maps the
music element to client coordinates, these are the coordinates used in the
map

### scrollOffset
scroll the offset from the starting scroll point

### netScroll
return the net amount we've scrolled, based on when the maps were make (initial)
, the offset of the container, and the absolute coordinates of the scrollbar.

### invScroll
invert the scroll parameters.

## editSvgText
A class that implements very basic text editing behavior in an svg text node
params must supply the following:
1. target: an svg text element
2. textObject: a text object described below.
3. layout: the page layout information, used to create the shadow editor in the DOM
The textObject must have the following attributes:
1. getText returns the text (the text to render initially)
2. translateX, translateY, scaleX, scaleY for svg text element
3. fontInfo from smoScoreText and other text objects

### endTextEditSessionPromise
return a promise that is resolved when the current text edit session ends.

## editLyricSession
Another interface between UI and renderer, let the user enter lyrics while
navigating through the notes.  This class handles the session of editing
a single note, and also the logic of skipping from note to note.

### detachEditorCompletePromise
A promise that is resolved when SVG editor is fully detached.

### _lyricAddedPromise
Don't edit the lyric until the DOM part has been added by the editor, so pend on a promise that has happened.

### _editCurrentLyric
The DOM is ready.  Create the editor and wait for it to finish.

### _deferSkip
skip to the next word, but not in the current call stack.  Used to handl
interactions with the dialog, where the dialog must reset changed flags
before  selection is changed

### moveSelectionRight
Selection can move automatically based on key events, but there are Also
UI ways to force it.

## editNoteText
Manage editing text for a note, and navigating, adding and removing.

## suiTracker
A tracker maps the UI elements to the logical elements ,and allows the user to
move through the score and make selections, for navigation and editing.

### See also:
`suiBaseLayout`, `controller`, `menu`
### class methods:
---

### _checkBoxOffset
If the mapped note and actual note don't match, re-render the notes so they do.
Otherwise the selections are off.

### renderElement
the element the score is rendered on

### selectModifierById
programatically select a modifier by ID.  Used by text editor.

### _updateNoteBox
Update the svg to screen coordinates based on a change in viewport.

### getExtremeSelection
Get the rightmost (1) or leftmost (-1) selection

### _getOffsetSelection
Get the selector that is the offset of the first existing selection

### _moveSelectionPitch
Suggest a specific pitch in a chord, so we can transpose just the one note vs. the whole chord.

## measureIterator

# Directory: render/vex
Logic for getting VEXFlow library to render the music
---
## Description:
Create a staff and draw music on it usinbg VexFLow rendering engine

###  Options:
`{measure:measure}` - The SMO measure to render
### VxMeasure methods
---

## Description:
decide whether to force stem direction for multi-voice, or use the default.
## TODO:
use x position of ticks in other voices, pitch of note, and consider
stem direction modifier.

## Description:
convert a smoNote into a vxNote so it can be rasterized

## Description:
create an a array of VF.StaveNote objects to render the active voice.

### createVexBeamGroups
create the VX beam groups. VexFlow has auto-beaming logic, but we use
our own because the user can specify stem directions, breaks etc.

### createVexTuplets
Create the VF tuplet objects based on the smo tuplet objects
that have been defined.

### _updateLyricXOffsets
Create the DOM modifiers for the rendered lyrics.

## Description:
Create all Vex notes and modifiers.  We defer the format and rendering so
we can align across multiple staves

## Description:
Create a system of staves and draw music on it.

##  Options:
clef:'treble',
num_beats:num_beats,
timeSignature: '4/4',
smoMeasures: []

### updateLyricOffsets
Adjust the y position for all lyrics in the line so they are even.
Also replace '-' with a longer dash do indicate 'until the next measure'

### renderModifier
render a line-type modifier that is associated with a staff (e.g. slur)

## renderMeasure
Create the graphical (VX) notes and render them on svg.  Also render the tuplets and beam
groups

## cap
draw the system brackets.  I don't know why I call them a cap.

