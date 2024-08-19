I created a JSON schema called 'Serialization of Musical Objects', or just SMO.

Relevant links: 

Here is [the SMO schema](https://aarondavidnewman.github.io/Smoosic/tools/smoosic-schema.json).   

Here is [the JSON meta-schema documentation](https://json-schema.org/specification), if you're not familar with it.

This specification attemts to overcome some of the issues with MusicXML.  Although there are a number of things MusicXML does correctly, it is very old.  Due to the monolithic nature of a score in MusicXML, it is not 'programming-language friendly' There is no easy way to extend the standard, or use individual components in a different standard.

The goal of SMO was to capture an abstract representation of music in a way that would be familiar to anyone who is familar with both music and programming languages.

As an example, let's say I wanted to make a container of measures, but not part of a full score, to store selections or snippets.   Or define a selection of music that could be shared between applications.  How would I do this in Music XML?  I suppose you could create stylesheets, etc. that create a new schema out of parts of the existing, but there's really no way to validate against both at the same time.

Partially because of the simpler format that JSON offers, and also because of the flexibility of JSON schema, you could produce your own versions of these things, in your own type of container.  Or you could choose to implement a small subset of SMO in an application, since there are reasonable defaults for almost everything.  You can read scores and focus on only the bits you care about.