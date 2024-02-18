<sub>[Github site](https://github.com/AaronDavidNewman/smoosic) | [source documentation](https://aarondavidnewman.github.io/Smoosic/release/docs/modules.html) | [change notes](https://aarondavidnewman.github.io/Smoosic/changes.html) | [application](https://aarondavidnewman.github.io/Smoosic/release/html/smoosic.html)<sub> 

![](https://imgur.com/jJ5utJm.gif)
# Breaking change:
To build, use `npm run build`.  Grunt is no longer required.

# What is Smoosic?
We are approaching Smoosic 1.0 status!  Many of the things I wanted to do with Smoosic are working to some extent.

* scores with part extraction
* playback with instruments and samples
* real-time editing, even for large scores
* MIDI and MusicXML import and export has been enhanced.  You can now export from Smoosic and import into MuseScore and vise-versa.
* dynamic music library with links to scores, tags etc.  Inspired by iRealPro app 'ireal' format
* library mode for custom applications

Smoosic is highly dependent on the [Vexflow engraving library](https://github.com/0xfe/vexflow), and especially its authors/maintainers [@rvilari](https://github.com/0xfe/vexflow/commits?author=rvilarl), [@ronyeh](https://github.com/0xfe/vexflow/commits?author=ronyeh) and [@0xfe](https://github.com/0xfe).

See [changes](https://aarondavidnewman.github.io/Smoosic/changes.html) for changes, updates, initiatives etc.

There is a [demo application](https://aarondavidnewman.github.io/Smoosic/release/html/smoosic.html) that you can play around with that shows the capabilities.

## What does it do?
Smoosic does the following things:
* Serialization and persistence of musical objects
* Online, searchable music libraries
* XML and MIDI import and export
* parts, instruments, staff groups, transposition, voices
* performant background rendering and asynchronous layout, pagination, line wrapping
* SVG text editing for score text, chord symbols and lyrics
* interactive user interface, mapping musical elements to UI components, mouse event binding, etc.
* fully customizable UI elements (buttons, key bindings, menus, dialogs)
* Real-time score playback
* natural language translation, including R to L language support (music still goes from left to right :)

You can see all these in the demo.

## Why?

People often ask on the VexFlow forums: how can you add an accidental to a note once it's been rendered?  The simple answer is that you don't.  If you add an accidental or something to your measure, it changes the location of all the symbols, so the whole measure has to be re-formatted.  

There is no easy way to do this using VexFlow alone, because the object model used by VexFlow to do the rendering is not serializable.  This is the original problem Smoosic is trying to solve, with the Serializable Musical Objects model.  SMO data objects have their own representation and can be easily serialized (that's what the 'S' is for), copied, changed programatically, and then re-rendered.  This makes it easier to create a music application web UI.

## How do I use Smoosic?

There are PEN/fiddles to help you understand and create your own applications:
* [Smoosic Promise-based (async) API](https://codepen.io/aarondavidnewman/pen/gOLgNEv) 
* [Manipulating music objects directly (syncronous)](https://codepen.io/aarondavidnewman/pen/PoKyaGj)
* [Load Score](https://codepen.io/aarondavidnewman/pen/XWNpLGJ)
* [Load Music XML](https://codepen.io/aarondavidnewman/pen/LYbxKqb)
* [Simple Music Editor](https://codepen.io/aarondavidnewman/pen/WNoRqgg)
* [Launch Full Application](https://codepen.io/aarondavidnewman/pen/rNyqgrR)

## But I just want to write music!
If you just want to [use the application](https://aarondavidnewman.github.io/Smoosic/release/html/smoosic.html) without any programming, [there are some online instructions](https://github.com/AaronDavidNewman/Smoosic/wiki/User-Help).  The usage documentation is probably out of date, feel free to submit updates!

## What's new in Smoosic?

Midi input!  Also, see [the change notes](https://aarondavidnewman.github.io/Smoosic/changes.md)

## SMO library details
The [music library](https://aarondavidnewman.github.io/Smoosic/release/docs/modules.html) is divided into parts:

SMO modules
1.  modules in the Smo directory form the core object model.
2.  data modules are the serializable object part.  xform modules handle some common operations like changing note lengths and transposing.  Other directories handle different forms of import/export.
3. [SmoScore](https://aarondavidnewman.github.io/Smoosic/release/docs/classes/SmoScore.html) is the top-level object for the SMO object model.

Rendering modules
1. modules in the render directory handle rendering
2. The main class that you will interact with when modifying the score is [SuiScoreViewOperations](https://aarondavidnewman.github.io/Smoosic/release/docs/classes/SuiScoreViewOperations.html).  All interactions with the score can be accomplished through this object.
3. Modules in sui directory do the SVG background rendring.  modules in vex directory interact with VexFlow.  Modules in the audio directory handle playback.

Configuration
1. You can start an instance of the library or application by calling `SuiApplication.configure()`.  This will initialize the global objects and resolve a promise when complete.  
2. The application takes a single argument: a [SmoConfiguration](https://aarondavidnewman.github.io/Smoosic/release/docs/classes/SmoConfiguration.html) object.  This lets you define all the no-code customizable features of the library such as: initial score, key bindings, language, run mode, and UI element bindings.
3. The `mode` field of the configuration object determines what mode Smoosic is running in.  If running in application mode, the full UI will be created and the configuration expects all the UI elements.  If running in library mode, only the view is started.

## Future SMO
Things I am actively working on:
1. Part extraction and formatting
2. XML import and export improvements

Things I hope to be working on soon:
1. UI improvements
3. More rendering features

## I'd like to help
I'd appreciate it!  Even if you are not a programmer, if you are interested in music and this project, you can contribute.

1. Submit bug reports.
2. If you speak a language that is not English, you can [help with translations](https://github.com/AaronDavidNewman/Smoosic/wiki/Internationalizing-Smoosic).
2. If you are a coder, you could help by adding features.  It would be fairly easy to add things like string ornamentation, lines (8va, rit.... etc).
3. If a designer or artist, or even if you just have good eyesight, the design could use some help.  Some transitions in the menu/dialogs would be nice, some better-looking dialog components, better-centered icons, more icons.
4. Also on the design front, accessibility.  I have ambitions that Smoosic can be screen-reader friendly, even though the SVG won't be.  Aria tags on dialog components, that kind of thing.
5. If you are a musician, you can contribute samples of your instrument.  I can use them for instruments in Smoosic, for playback.
6. You can write music to be used in Smoosic libraries.





 
