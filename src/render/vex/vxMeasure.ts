// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
// ## Description:
// This file calls the vexflow routines that actually render a
// measure of music.  If multiple measures are justified in a
// column, the rendering is deferred until all the measures have been
// preformatted.
import { SmoNote } from '../../smo/data/note';
import { SmoMusic } from '../../smo/data/music';
import { SvgHelpers } from '../sui/svgHelpers';
import { layoutDebug } from '../sui/layoutDebug';
import { SmoRepeatSymbol, SmoMeasureText, SmoBarline, SmoMeasureModifierBase, SmoRehearsalMark } from '../../smo/data/measureModifiers';
import { SourceSerifProFont } from '../../styles/font_metrics/ssp-serif-metrics';
import { SourceSansProFont } from '../../styles/font_metrics/ssp-sans-metrics';
import { SmoOrnament, SmoArticulation, SmoDynamicText, SmoLyric } from '../../smo/data/noteModifiers';
import { SmoSelection } from '../../smo/xform/selections';
import { SmoMeasure, MeasureTickmaps } from '../../smo/data/measure';

declare var $: any;
const VF = eval('Vex.Flow');

export class VxMeasure {
  context: any;
  printing: boolean;
  selection: SmoSelection;
  smoMeasure: SmoMeasure;
  rendered: boolean = false;
  noteToVexMap: Record<string, any> = {};
  beamToVexMap: Record<string, any> = {};
  tupletToVexMap: Record<string, any> = {};
  vexNotes: any[] = [];
  vexBeamGroups: any[] = [];
  vexTuplets: any[] = [];
  tickmapObject: MeasureTickmaps | null = null;
  stave: any; // vex stave
  voiceNotes: any; // notes for current voice, as rendering
  voiceAr: any[] = [];
  formatter: any = null;


  constructor(context: any, selection: SmoSelection, printing: boolean) {
    this.context = context;
    this.rendered = false;
    this.selection = selection;
    this.smoMeasure = this.selection.measure;
    this.printing = printing;
    this.tupletToVexMap = {};
    this.vexNotes = [];
    this.vexBeamGroups = [];
    this.vexBeamGroups = [];
    this.beamToVexMap = {};
  }

  static get fillStyle() {
    return '#000';
  }

  // ## Description:
  // decide whether to force stem direction for multi-voice, or use the default.
  // ## TODO:
  // use x position of ticks in other voices, pitch of note, and consider
  // stem direction modifier.
  applyStemDirection(vxParams: any, voiceIx: number, flagState: number) {
    if (this.smoMeasure.voices.length === 1 && flagState === SmoNote.flagStates.auto) {
      vxParams.auto_stem = true;
    } else if (flagState !== SmoNote.flagStates.auto) {
      vxParams.stem_direction = flagState === SmoNote.flagStates.up ? 1 : -1;
    } else if (voiceIx % 2) {
      vxParams.stem_direction = -1;
    } else {
      vxParams.stem_direction = 1;
    }
  }

  // We add microtones to the notes, without regard really to how they interact
  _createMicrotones(smoNote: SmoNote, vexNote: any) {
    const tones = smoNote.getMicrotones();
    tones.forEach((tone) => {
      const acc = new VF.Accidental(tone.toVex);
      vexNote.addAccidental(tone.pitch, acc);
    });
  }
  _createAccidentals(smoNote: SmoNote, vexNote: any, tickIndex: number, voiceIx: number) {
    let i = 0;
    if (smoNote.noteType === '/') {
      return;
    }
    smoNote.accidentalsRendered = [];
    for (i = 0; i < smoNote.pitches.length && this.tickmapObject !== null; ++i) {
      const pitch = smoNote.pitches[i];
      const duration = this.tickmapObject.tickmaps[voiceIx].durationMap[tickIndex];
      const keyAccidental = SmoMusic.getAccidentalForKeySignature(pitch, this.smoMeasure.keySignature);
      const accidentals = this.tickmapObject.accidentalArray.filter((ar) =>
        ar.duration < duration && ar.pitches[pitch.letter]);
      const acLen = accidentals.length;
      const declared = acLen > 0 ?
        accidentals[acLen - 1].pitches[pitch.letter].pitch.accidental : keyAccidental;

      if ((declared !== pitch.accidental
        || pitch.cautionary) && smoNote.noteType === 'n') {
        const acc = new VF.Accidental(pitch.accidental);

        if (pitch.cautionary) {
          acc.setAsCautionary();
        }
        smoNote.accidentalsRendered.push(pitch.accidental);
        vexNote.addAccidental(i, acc);
      } else {
        smoNote.accidentalsRendered.push('');
      }
    }
    for (i = 0; i < smoNote.dots; ++i) {
      vexNote.addDotToAll();
    }
    this._createMicrotones(smoNote, vexNote);
  }

  _createJazzOrnaments(smoNote: SmoNote, vexNote: any) {
    const o = smoNote.getJazzOrnaments();
    o.forEach((ll) => {
      const mod = new VF.Ornament(ll.toVex());
      vexNote.addModifier(mod, 0);
    });
  }

  _createOrnaments(smoNote: SmoNote, vexNote: any) {
    const o = smoNote.getOrnaments();
    o.forEach((ll) => {
      const mod = new VF.Ornament(ll.ornament);
      if (ll.offset === SmoOrnament.offsets.after) {
        mod.setDelayed(true);
      }
      vexNote.addModifier(mod, 0);
    });
  }
  _addLyricAnnotationToNote(vexNote: any, lyric: SmoLyric) {
    let classString = 'lyric lyric-' + lyric.verse;
    let text = lyric.getText();
    if (lyric.skipRender) {
      return;
    }
    if (!text.length && lyric.isHyphenated()) {
      text = '-';
    }
    // no text, no hyphen, don't add it.
    if (!text.length) {
      return;
    }
    const vexL = new VF.Annotation(text); // .setReportWidth(lyric.adjustNoteWidth);
    vexL.setAttribute(lyric.attrs.id); //

    // If we adjusted this note for the lyric, adjust the lyric as well.
    vexL.setFont(lyric.fontInfo.family, lyric.fontInfo.size, lyric.fontInfo.weight);
    vexL.setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
    vexNote.addAnnotation(0, vexL);
    if (lyric.isHyphenated()) {
      classString += ' lyric-hyphen';
    }
    vexL.addClass(classString);
  }

  _addChordChangeToNote(vexNote: any, lyric: SmoLyric) {
    const cs = new VF.ChordSymbol();
    const blocks = lyric.getVexChordBlocks();
    blocks.forEach((block) => {
      if (block.glyph) {
        cs.addGlyph(block.glyph, block);
      } else {
        cs.addGlyphOrText(block.text, block);
      }
    });
    cs.setFont(lyric.fontInfo.family, lyric.fontInfo.size).setReportWidth(lyric.adjustNoteWidth);
    vexNote.addModifier(cs, 0);
    const classString = 'chord chord-' + lyric.verse;
    cs.addClass(classString);
  }

  _createLyric(smoNote: SmoNote, vexNote: any) {
    const lyrics = smoNote.getTrueLyrics();
    if (smoNote.noteType !== '/') {
      lyrics.forEach((bll) => {
        const ll = bll as SmoLyric;
        this._addLyricAnnotationToNote(vexNote, ll);
      });
    }
    const chords = smoNote.getChords();
    chords.forEach((chord) => {
      this._addChordChangeToNote(vexNote, chord);
    });
  }

  _createGraceNotes(smoNote: SmoNote, vexNote: any) {
    let i = 0;
    const gar = smoNote.getGraceNotes();
    var toBeam = true;
    if (gar && gar.length) {
      const group: any[] = [];
      gar.forEach((g) => {
        const gr = new VF.GraceNote(g.toVexGraceNote());
        for (i = 0; i < g.pitches.length; ++i) {
          const pitch = g.pitches[i];
          if (!pitch.accidental) {
            console.warn('no accidental in grace note');
          }
          if (pitch.accidental && pitch.accidental !== 'n' || pitch.cautionary) {
            const accidental = new VF.Accidental(pitch.accidental);
            if (pitch.cautionary) {
              accidental.setAsCautionary();
            }
            gr.addAccidental(i, accidental);
          }
        }
        if (g.tickCount() >= 4096) {
          toBeam = false;
        }
        gr.addClass('grace-note'); // note: this doesn't work :(

        g.renderId = gr.attrs.id;
        group.push(gr);
      });
      const grace: any = new VF.GraceNoteGroup(group);
      if (toBeam) {
        grace.beamNotes();
      }
      vexNote.addModifier(grace, 0);
    }
  }

  // ## Description:
  // convert a smoNote into a vxNote so it can be rasterized
  _createVexNote(smoNote: SmoNote, tickIndex: number, voiceIx: number) {
    let vexNote: any = {};
    let timestamp = new Date().valueOf();
    // If this is a tuplet, we only get the duration so the appropriate stem
    // can be rendered.  Vex calculates the actual ticks later when the tuplet is made
    var duration =
      smoNote.isTuplet ?
        SmoMusic.closestVexDuration(smoNote.tickCount) :
        SmoMusic.ticksToDuration[smoNote.tickCount];

    if (typeof (duration) === 'undefined') {
      console.warn('bad duration in measure ' + this.smoMeasure.measureNumber.measureIndex);
      duration = '8';
    }
    // transpose for instrument-specific keys
    const keys = SmoMusic.smoPitchesToVexKeys(smoNote.pitches, 0, smoNote.noteHead);
    const noteParams = {
      clef: smoNote.clef,
      keys,
      duration: duration + smoNote.noteType
    };

    if (smoNote.noteType === '/') {
      vexNote = new VF.GlyphNote(new VF.Glyph('repeatBarSlash', 40), { duration });
      smoNote.renderId = 'vf-' + vexNote.attrs.id; // where does 'vf' come from?
    } else {
      this.applyStemDirection(noteParams, voiceIx, smoNote.flagState);
      layoutDebug.setTimestamp(layoutDebug.codeRegions.PREFORMATA, new Date().valueOf() - timestamp);
      timestamp = new Date().valueOf();
      vexNote = new VF.StaveNote(noteParams);
      layoutDebug.setTimestamp(layoutDebug.codeRegions.PREFORMATB, new Date().valueOf() - timestamp);
      timestamp = new Date().valueOf();
      if (smoNote.fillStyle) {
        vexNote.setStyle({ fillStyle: smoNote.fillStyle });
      }
      vexNote.attrs.classes = 'voice-' + voiceIx;
      smoNote.renderId = 'vf-' + vexNote.attrs.id; // where does 'vf' come from?
    }

    this._createAccidentals(smoNote, vexNote, tickIndex, voiceIx);
    this._createLyric(smoNote, vexNote);
    this._createOrnaments(smoNote, vexNote);
    this._createJazzOrnaments(smoNote, vexNote);
    this._createGraceNotes(smoNote, vexNote);
    layoutDebug.setTimestamp(layoutDebug.codeRegions.PREFORMATC, new Date().valueOf() - timestamp);

    return vexNote;
  }

  _renderArticulations(vix: number) {
    const i = 0;
    this.smoMeasure.voices[vix].notes.forEach((smoNote) => {
      smoNote.articulations.forEach((art) => {
        const vx = this.noteToVexMap[smoNote.attrs.id];
        const position: number = SmoArticulation.positionToVex[art.position];
        const vexArt = SmoArticulation.articulationToVex[art.articulation];
        const vxArt = new VF.Articulation(vexArt).setPosition(position);
        vx.addArticulation(i, vxArt);
      });
    });
  }

  _renderNoteGlyph(smoNote: SmoNote, textObj: SmoDynamicText) {
    var x = this.noteToVexMap[smoNote.attrs.id].getAbsoluteX() + textObj.xOffset;
    // the -3 is copied from vexflow textDynamics
    var y = this.stave.getYForLine(textObj.yOffsetLine - 3) + textObj.yOffsetPixels;
    var group = this.context.openGroup();
    group.classList.add(textObj.attrs.id + '-' + smoNote.attrs.id);
    group.classList.add(textObj.attrs.id);
    textObj.text.split('').forEach((ch) => {
      const glyphCode = VF.TextDynamics.GLYPHS[ch];
      if (glyphCode) {
        const glyph = new VF.Glyph(glyphCode.code, textObj.fontSize);
        glyph.render(this.context, x, y);
        x += VF.TextDynamics.GLYPHS[ch].width;
      }
    });
    textObj.logicalBox = SvgHelpers.smoBox(group.getBBox());
    this.context.closeGroup();
  }

  renderDynamics() {
    this.smoMeasure.voices.forEach((voice) => {
      voice.notes.forEach((smoNote) => {
        const mods = smoNote.textModifiers.filter((mod) =>
          mod.attrs.type === 'SmoDynamicText'
        );
        mods.forEach((btm) => {
          const tm = btm as SmoDynamicText;
          this._renderNoteGlyph(smoNote, tm);
        });
      });
    });
  }

  // ## Description:
  // create an a array of VF.StaveNote objects to render the active voice.
  createVexNotes(voiceIx: number) {
    let i = 0;
    this.voiceNotes = [];
    const voice = this.smoMeasure.voices[voiceIx];
    for (i = 0;
      i < voice.notes.length; ++i) {
      const smoNote = voice.notes[i];
      const vexNote = this._createVexNote(smoNote, i, voiceIx);
      this.noteToVexMap[smoNote.attrs.id] = vexNote;
      this.vexNotes.push(vexNote);
      this.voiceNotes.push(vexNote);
      if (isNaN(smoNote.ticks.numerator) || isNaN(smoNote.ticks.denominator)
        || isNaN(smoNote.ticks.remainder)) {
        throw ('vxMeasure: NaN in ticks');
      }
    }
    this._renderArticulations(voiceIx);
  }

  // ### createVexBeamGroups
  // create the VX beam groups. VexFlow has auto-beaming logic, but we use
  // our own because the user can specify stem directions, breaks etc.
  createVexBeamGroups(vix: number) {
    let keyNoteIx = -1;
    let i = 0;
    let j = 0;
    let stemDirection = VF.Stem.DOWN;
    for (i = 0; i < this.smoMeasure.beamGroups.length; ++i) {
      const bg = this.smoMeasure.beamGroups[i];
      if (bg.voice !== vix) {
        continue;
      }
      const vexNotes = [];
      keyNoteIx = bg.notes.findIndex((nn) => nn.noteType === 'n');

      // Fix stem bug: key off first non-rest note.
      keyNoteIx = (keyNoteIx >= 0) ? keyNoteIx : 0;
      for (j = 0; j < bg.notes.length; ++j) {
        const note = bg.notes[j];
        if (note.noteType === '/') {
          continue;
        }
        const vexNote = this.noteToVexMap[note.attrs.id];
        // some type of redraw condition?
        if (typeof (vexNote) === 'undefined') {
          return;
        }
        if (keyNoteIx === j) {
          stemDirection = note.flagState === SmoNote.flagStates.auto ?
            vexNote.getStemDirection() : note.toVexStemDirection();
        }
        vexNote.setStemDirection(stemDirection);
        vexNotes.push(this.noteToVexMap[note.attrs.id]);
      }
      const vexBeam = new VF.Beam(vexNotes);
      this.beamToVexMap[bg.attrs.id] = vexBeam;
      this.vexBeamGroups.push(vexBeam);
    }
  }

  // ### createVexTuplets
  // Create the VF tuplet objects based on the smo tuplet objects
  // that have been defined.
  createVexTuplets(vix: number) {
    var j = 0;
    var i = 0;
    this.vexTuplets = [];
    this.tupletToVexMap = {};
    for (i = 0; i < this.smoMeasure.tuplets.length; ++i) {
      const tp = this.smoMeasure.tuplets[i];
      if (tp.voice !== vix) {
        continue;
      }
      const vexNotes = [];
      for (j = 0; j < tp.notes.length; ++j) {
        const smoNote = tp.notes[j];
        vexNotes.push(this.noteToVexMap[smoNote.attrs.id]);
      }
      const direction = tp.getStemDirection(this.smoMeasure.clef) === SmoNote.flagStates.up ?
        VF.Tuplet.LOCATION_TOP : VF.Tuplet.LOCATION_BOTTOM;
      const vexTuplet = new VF.Tuplet(vexNotes, {
        num_notes: tp.num_notes,
        notes_occupied: tp.notes_occupied,
        ratioed: false,
        bracketed: true,
        location: direction
      });
      this.tupletToVexMap[tp.attrs.id] = vexTuplet;
      this.vexTuplets.push(vexTuplet);
    }
  }
  unrender() {
    $(this.context.svg).find('g.' + this.smoMeasure.attrs.id).remove();
  }

  handleMeasureModifiers() {
    const sb = this.smoMeasure.getStartBarline();
    const eb = this.smoMeasure.getEndBarline();
    const sym = this.smoMeasure.getRepeatSymbol();

    // don't create a begin bar for any but the 1st measure.
    if (this.smoMeasure.measureNumber.systemIndex !== 0 && sb.barline === SmoBarline.barlines.singleBar
      && this.smoMeasure.format.padLeft === 0) {
      this.stave.setBegBarType(VF.Barline.type.NONE);
    } else {
      this.stave.setBegBarType(sb.toVexBarline());
    }
    if (eb.barline !== SmoBarline.barlines.singleBar) {
      this.stave.setEndBarType(eb.toVexBarline());
    }
    if (sym && sym.symbol !== SmoRepeatSymbol.symbols.None) {
      const rep = new VF.Repetition(sym.toVexSymbol(), sym.xOffset + this.smoMeasure.staffX, sym.yOffset);
      this.stave.modifiers.push(rep);
    }
    const tms = this.smoMeasure.getMeasureText();
    // TODO: set font
    tms.forEach((tmb: SmoMeasureModifierBase) => {
      const tm = tmb as SmoMeasureText;
      const offset = tm.position === SmoMeasureText.positions.left ? this.smoMeasure.format.padLeft : 0;
      this.stave.setText(
        tm.text, tm.toVexPosition(), {
        shift_x: tm.adjustX + offset, shift_y: tm.adjustY, justification: tm.toVexJustification()
      });

      // hack - we can't create staveText directly so this is the only way I could set the font
      const ar = this.stave.getModifiers();
      const vm = ar[ar.length - 1];
      vm.setFont(tm.fontInfo);
    });

    const rmb = this.smoMeasure.getRehearsalMark();
    const rm = rmb as SmoRehearsalMark;
    if (rm) {
      this.stave.setSection(rm.symbol, 0);
    }

    const tempo = this.smoMeasure.getTempo();
    if (tempo && this.smoMeasure.svg.forceTempo) {
      this.stave.setTempo(tempo.toVexTempo(), -1 * tempo.yOffset);
      const vexTempo = this.stave.modifiers.find((mod: any) => mod.attrs.type === 'StaveTempo');
      vexTempo.font = { family: SourceSerifProFont.fontFamily, size: 14, weight: 'bold' };
    }
  }

  // ## Description:
  // Create all Vex notes and modifiers.  We defer the format and rendering so
  // we can align across multiple staves
  preFormat() {
    var j = 0;
    $(this.context.svg).find('g.' + this.smoMeasure.getClassId()).remove();

    const key = SmoMusic.vexKeySignatureTranspose(this.smoMeasure.keySignature, 0);
    const canceledKey = this.smoMeasure.canceledKeySignature ? SmoMusic.vexKeySignatureTranspose(this.smoMeasure.canceledKeySignature, 0)
      : this.smoMeasure.canceledKeySignature;

    const staffX = this.smoMeasure.staffX + this.smoMeasure.format.padLeft;

    this.stave = new VF.Stave(staffX, this.smoMeasure.staffY, this.smoMeasure.staffWidth - this.smoMeasure.format.padLeft,
      { font: { family: SourceSansProFont.fontFamily, size: '12pt' }, fill_style: VxMeasure.fillStyle });
    // If there is padLeft, draw an invisible box so the padding is included in the measure box
    if (this.smoMeasure.format.padLeft) {
      this.context.rect(this.smoMeasure.staffX, this.smoMeasure.staffY, this.smoMeasure.format.padLeft, 50, {
        fill: 'none', 'stroke-width': 1, stroke: 'white'
      });
    }

    this.stave.options.space_above_staff_ln = 0; // don't let vex place the staff, we want to.

    // Add a clef and time signature.
    if (this.smoMeasure.svg.forceClef) {
      this.stave.addClef(this.smoMeasure.clef);
    }
    if (this.smoMeasure.svg.forceKeySignature) {
      const sig = new VF.KeySignature(key);
      if (this.smoMeasure.canceledKeySignature) {
        sig.cancelKey(canceledKey);
      }
      sig.addToStave(this.stave);
    }
    if (this.smoMeasure.svg.forceTimeSignature) {
      this.stave.addTimeSignature(this.smoMeasure.timeSignature.timeSignature);
    }
    // Connect it to the rendering context and draw!
    this.stave.setContext(this.context);

    this.handleMeasureModifiers();

    this.tickmapObject = this.smoMeasure.createMeasureTickmaps();

    this.voiceAr = [];
    this.vexNotes = [];
    this.noteToVexMap = {};

    // If there are multiple voices, add them all to the formatter at the same time so they don't collide
    for (j = 0; j < this.smoMeasure.voices.length; ++j) {
      this.createVexNotes(j);
      this.createVexTuplets(j);
      this.createVexBeamGroups(j);

      // Create a voice in 4/4 and add above notes
      const voice = new VF.Voice({
        num_beats: this.smoMeasure.numBeats,
        beat_value: this.smoMeasure.beatValue
      }).setMode(VF.Voice.Mode.SOFT);
      voice.addTickables(this.voiceNotes);
      this.voiceAr.push(voice);
    }

    // Need to format for x position, then set y position before drawing dynamics.
    this.formatter = new VF.Formatter({ softmaxFactor: this.smoMeasure.format.customProportion, globalSoftmax: false });
    this.voiceAr.forEach((voice) => {
      this.formatter.joinVoices([voice]);
    });
  }
  format(voices: any[]) {
    const timestamp = new Date().valueOf();
    this.formatter.format(voices,
      this.smoMeasure.staffWidth -
      (this.smoMeasure.svg.adjX + this.smoMeasure.svg.adjRight + this.smoMeasure.format.padLeft) - 10);
    layoutDebug.setTimestamp(layoutDebug.codeRegions.FORMAT, new Date().valueOf() - timestamp);
  }
  render() {
    var self = this;
    var group = this.context.openGroup();
    var mmClass = this.smoMeasure.getClassId();
    var j = 0;
    const timestamp = new Date().valueOf();
    try {
      group.classList.add(this.smoMeasure.attrs.id);
      group.classList.add(mmClass);
      group.id = this.smoMeasure.attrs.id;

      this.stave.draw();

      for (j = 0; j < this.voiceAr.length; ++j) {
        this.voiceAr[j].draw(this.context, this.stave);
      }

      this.vexBeamGroups.forEach((b) => {
        b.setContext(self.context).draw();
      });

      this.vexTuplets.forEach((tuplet) => {
        tuplet.setContext(self.context).draw();
      });
      // this._updateLyricDomSelectors();
      this.renderDynamics();
      // this.smoMeasure.adjX = this.stave.start_x - (this.smoMeasure.staffX);

      this.context.closeGroup();
      layoutDebug.setTimestamp(layoutDebug.codeRegions.RENDER, new Date().valueOf() - timestamp);

      const lbox = this.stave.getBoundingBox();
      this.smoMeasure.setBox({ x: lbox.x, y: lbox.y, width: lbox.w, height: lbox.h }, 'vxMeasure bounding box');
      this.rendered = true;
    } catch (exc) {
      console.warn('unable to render measure ' + this.smoMeasure.measureNumber.measureIndex);
      this.context.closeGroup();
    }
  }
}