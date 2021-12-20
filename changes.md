<sub>[Github site](https://github.com/AaronDavidNewman/smoosic) | [source documentation](https://aarondavidnewman.github.io/Smoosic/release/docs/modules.html) | [change notes](https://aarondavidnewman.github.io/Smoosic/changes.html) | [application](https://aarondavidnewman.github.io/Smoosic/release/html/smoosic.html)<sub> 

# Smoosic

Smoosic is a simple (?) but fully-functional-aspirant editor for music written in javascript.  It is also an interactive API for music notation/engraving.

You can see Smoosic in action here:

[Smoosic demo application](https://aarondavidnewman.github.io/Smoosic/release/html/smoosic.html)

API Demo Links (codepen):
* [Smoosic API](https://codepen.io/aarondavidnewman/pen/gOLgNEv) 
* [Load Score](https://codepen.io/aarondavidnewman/pen/XWNpLGJ)
* [Load Music XML](https://codepen.io/aarondavidnewman/pen/LYbxKqb)
* [Simple Music Editor](https://codepen.io/aarondavidnewman/pen/WNoRqgg)

---

## Changes to Smoosic
### (Potentially breaking) Config/application changes, December 2021
I am trying to simplify and canonize the rules for what the configuration file needs to contain, in the process  reducing hard-coded magic that happens when the library or application is bootstrapped.

These configuration parameters apply to both application and library mode:

* The parameter `scoreDomContainer` _must_ specify the DOM element where the music is to be rendered, either string ID or HTMLElement.
* The only parameter that is specified now on the query string is the language (?lang=xx).  Everything else is specified in the configuration file.  The language is, too, but the query string can override it.
* if initialScore contains either a JSON score or a SmoScore object, it will start with that score
* if the remoteScore contains a string, we will try to load the initial score from either XML or JSON file from that URL
* If neither of these is specified and the local storage contains a score, it will load that.
* If none of the above, the default (one measure of rests) score is produced.

The changes to remote loader basically mean you no longer need to do any promise/waiting to render a score.

These apply in application mode:
* leftControls and topControls contain specifiers or HTMLElements for the button controls.  If these elements are not present the UI will not launch.
* menu and dialog DOM containers are created automatically, no need to specify those.

The configuration file is no longer a global.  It is passed as a parameter where needed - I thought this would help with support of multiple editing regions in the DOM - think CKEditor.

I removed the concept of 'actions' to record editing macros.  I burrowed this from a DAW called Reaper.  Reaper lists the actions you have performed so you can copy them and apply them to other tracks/channels etc.  But this didn't really work in Smoosic - the action is so dependent on the current selection that it wasn't deterministic.  It's also probably not required - since this is a javascript application, you can do what you want to the score whenever you want.

I also removed all the instance details from the configuration object.  Only DOM and configurable parameters are in the config object.  The global `Smo.SuiApplication.instance` object contains hooks to the global instance.

### MusicXML improvements, December 2021
I've been going through the MusicXML samples and testing for round trip, features missing etc.  Also comparing against MuseScore.  There
was some XML we were emitting that wasn't correct according to the spec, and some which was just wrong or missing.  Tempo, repeats, slurs,
time signatures.

Round trip XML will always be a little bit 'lossy' since Smoosic does things a little bit differently than Finale.

### MIDI import, for realsies, December, 2021
I replaced the midi parsing function with the one from https://github.com/NHQ/midi-file-parser/.  This code seems to handle running status correctly.  I did some comparisons to MuseScore input and it is...comparable.  I added variable quantization to different note lengths, and basic triplet support.  It doesn't support instruments so much, but instrument support in Smoosic in general is pretty raw.

### MIDI import (sort of) November, 2021
I had hoped to finish MIDI import this week, but as usual I misunderestimated how hard it would be.  The files exported from Smoosic import OK, except for tuplets.  But any
MIDI file from a performance or exported by another program is a crapshoot.  I will need some logic dedicated to inferring the correct rhythms from the midi ticks.

### Typescript migration complete (Halloween, 2021)
All of the project files have been rewritten in Typescript. The UI, particularly the dialog and menus, have been redone in a more component-friendly way. I expect to create new pens that describe how to create new UI elements, and modify existing ones.

Smoosic now supports parts.  Parts can consist of 1-2 adjacent staves.  They can contain their own measure formatting, text, and page/layout settings.

There are a few different score-organization concepts that could get confusing:
* Parts are assigned to 1-2 staves for the duration of the score, and can have text and formatting independent of the score.
* Instruments are mapped to a stave for some number of measures.  Primarly right now, they control the pitch offset, i.e. the key of the instrument.  E.g. a Bb trumpet is notated a whole step up with +2 sharps from concert.  In the future, this will be open for a lot of fun things like midi patches and audio samples.
* Staff groups control the justification between staves in the full score.
* Any permutation of the staves can be viewed (you can't do this in Sibelius), but staves that don't map to a single part will get the score text and formatting.

### Webpack migration complete (August, 2021)
Typescript migration underway. Most SMO files are already migrated. Pens have been updated to reflect the new build target.  This is merged to main branch.

If you are using the library, the biggest change will be mangling the 'Smo' namespace in your references to Smoosic types.
### Webpack and general rewrite (July, 2021)
2 ways to do a thing, right and over.  Some aspects of Smoosic need a fresh iteration before I can go much further.

First big change, moving from concat to webpack.  I realize now why people use it.  There's no other way to check for defined/unused symbols with a bunch of 
scripts that don't know about each other.

Once I am in webpack-land, I can start moving the SMO music files to typescript.  Right now it is too easy to pass an Ornament when an Articulation is expected, etc.

While doing this, I expect to revisit the object model.  2 things that I did not consider in the first go-round:
1.  Formatting can be score or part-specific, and can be score-wide or page-wide
2.  Modifiers can be mapped to a specific note/measure, or the column, and can also be per part or per score.
3.  Some attributes of objects are generated while rendering, others are serialized and persist.

Out of consideration for those who use Smoosic currently, and fear that it won't work out, I'm doing this work on a separate branch.  I expect existing Smoosic files will be backwards-compatible.  I will try to minimize the impact on existing codes.

### UI improvements and bug fixes (April 3, 2021)  

Background Rendering, Lyrics/Multi-Voice/Scrolling improvements and bug fixes.

Rendering longer scores, even just a page or 2, was frustrating.  It can take several seconds to re-render the entire score.  We now render in the background, with a progress bar, allowing one to edit while the score is rendering.  Full re-render timer is pro-rated on render time, so you get more editing time.

Fixed some bugs with xml import/export.

Added measure-add dialog, for multiple measures.

[Smoosic Application](https://aarondavidnewman.github.io/Smoosic/release/html/smoosic.html)

### Smoosic API (Feb, 2021)

I've been thinking lately.  My goal was to create a flexible music creation API that works in a variety of contexts.  In some ways, the application is just a demo of the API.  As the application gets more complicated, it becomes less customizable and embeddable.  So I need to distinguish between Smoosic the application and Smoosic the API.  

In some ways, Smoosic is similar to technologies like Vue or Angular, in that they update a DOM view based on changes to a document state, and visa-versa.  In this case, the document is SMO, the JSON structure that represents the score.  The DOM is the rendered music in the SVG.  You can map events from the DOM and map them to artifacts in your musical model, and make changes to the model and have it rendered.

Therefore...Introducing the Smoosic API.  I've made a few minor tweaks in the initialzaiton that make it possible to create a library version of Smoosic.  This has no native GUI, so you can create your own, or just call the API and render some music.  

I created the following pens to help demonstrate how to use it.

[Smoosic API](https://codepen.io/aarondavidnewman/pen/gOLgNEv)  This creates a simple HTML container, and renders a score in it.  It demonstrates the mimimal objects you need to create, and how to update the model in such a way that your changes get rendered.

[Load Score](https://codepen.io/aarondavidnewman/pen/XWNpLGJ)  This demonstrates how to load a pre-made score and render it.

[Load Music XML](https://codepen.io/aarondavidnewman/pen/LYbxKqb) Similar to the above, but with an Music XML score (finale format).

[Simple Music Editor](https://codepen.io/aarondavidnewman/pen/WNoRqgg)  I've been asked how to embed the editor in CKEditor or some other application that has its own event model  This example shows that.  It implements a very minimal music editor, and shows how keyboard and mouse events are handled.

---

### Music XML (Jan, 2021)

I have made a number of changes to the way Smoosic works, based on some feedback:
1. Delete key no longer deletes measures.  This seemed to surprise people.  The insert key still inserts, though.
2. You can now view any subset of the score in the score view dialog.
3. Rests no longer play a pitch quietly.
4. Rests no longer generate beams
5. Default triple-meter duration is dotted 1/4 for new measure.
6. You can specify auto-advance and auto-play preferences, as well as naming the score.

You can see Smoosic in action here:

[Smoosic](https://aarondavidnewman.github.io/Smoosic/release/html/smoosic.html)

---
Note: unit tests have been removed for now.  Editor actions will be used to create a new set of
unit tests for the modern age.

---

Instructions on how to use smoosic:
[Smoosic Wiki](https://github.com/AaronDavidNewman/Smoosic/wiki)

---
If you want to contribute or hack, there is source-code [auto-generated documentation](https://github.com/AaronDavidNewman/Smoosic/wiki/Source-Documentation)
