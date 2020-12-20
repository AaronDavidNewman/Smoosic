# Smoosic

Smoosic is a simple (?) but fully-functional-aspirant editor for music written in javascript.  
The goal is to be
easily embeddable and modifyable.  All that is required to use Smoosic in your own projects is to create the editor in a DOM.   It uses VexFlow
project from [GitHub Vex Flow](https://github.com/0xfe/vexflow) for rendering

---
## Changes to Smoosic
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

If you want to use it in your own projects, a good place to start are the unit tests.  They are here:

[Editor Tests](https://aarondavidnewman.github.io/Smoosic/release/html/tests.html)

---

Instructions on how to use smoosic:
[Smoosic Wiki](https://github.com/AaronDavidNewman/Smoosic/wiki)

---
If you want to contribute or hack, there is source-code [auto-generated documentation](https://github.com/AaronDavidNewman/Smoosic/wiki/Source-Documentation)
