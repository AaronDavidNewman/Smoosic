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
 
 
