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
