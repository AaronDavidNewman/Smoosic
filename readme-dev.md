# Why SMOosic
People often ask on the [VexFlow forums](https://github.com/0xfe/vexflow) how they can add an accidental to a note once it's been rendered.  The simple answer is that you don't.  If you add an accidental or something to your measure, it changes the location of all the symbols, so the whole measure has to be re-formatted.  

There is no easy way to do this using VexFlow alone, because the object model used by VexFlow to do the rendering is not serializable.  This is the original problem SMOsic is trying to solve, with the Serializable Musical Objects model.  SMO data objects have their own representation and can be easily serialized (that's what the 'S' is for), copied, changed programatically, and then re-rendered.  This makes it easier to create a music application web UI.

Anothre problem when building musical apps is  managing larger layout issues like multiple staves, system, pagination, events and background rendering.  SMOosic does all of this.  You can see this all in action using the [demo application](https://aarondavidnewman.github.io/Smoosic/release/html/smoosic.html).

There are also PEN/fiddles to help you understand and create your own applications:
* [Smoosic Promise-based API](https://codepen.io/aarondavidnewman/pen/gOLgNEv) 
* [Manipulating music objects directly](https://codepen.io/aarondavidnewman/pen/PoKyaGj)
* [Load Score](https://codepen.io/aarondavidnewman/pen/XWNpLGJ)
* [Load Music XML](https://codepen.io/aarondavidnewman/pen/LYbxKqb)
* [Simple Music Editor](https://codepen.io/aarondavidnewman/pen/WNoRqgg)
* [Launch Full Application](https://codepen.io/aarondavidnewman/pen/rNyqgrR)

## SMO library
The [music library](modules.html) is divided into parts:

SMO modules
1.  modules in the Smo directory form the core object model.
2.  data library is the serializable object part.  xform handles some common operations like changing note lengths and transposing.
3. [SmoScore](classes/SmoScore.html) is the top-level object for the SMO object model.

Rendering
1. modules in the render directory handle rendering
2. The main class that you will interact with when modifying the score is [SuiScoreViewOperations](classes/SuiScoreViewOperations.html).  All interactions with the score can be accomplished through this object.

Configuration
1. You can start an instance of the library or application by calling `SuiApplication.configure()`.  This will initialize the global objects and resolve a promise when complete.  
2. The application takes a single argument: a [SmoConfiguration](classes/SmoConfiguration.html) object.




 