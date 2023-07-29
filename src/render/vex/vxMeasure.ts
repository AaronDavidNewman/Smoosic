// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
// ## Description:
// This file calls the vexflow routines that actually render a
// measure of music.  If multiple measures are justified in a
// column, the rendering is deferred until all the measures have been
// preformatted.
import { SmoNote } from '../../smo/data/note';
import { SmoMusic } from '../../smo/data/music';
import { layoutDebug } from '../sui/layoutDebug';
import { SmoRepeatSymbol, SmoMeasureText, SmoBarline, SmoMeasureModifierBase, SmoRehearsalMark, SmoMeasureFormat } from '../../smo/data/measureModifiers';
import { SourceSerifProFont } from '../../styles/font_metrics/ssp-serif-metrics';
import { SourceSansProFont } from '../../styles/font_metrics/ssp-sans-metrics';
import { SmoOrnament, SmoArticulation, SmoDynamicText, SmoLyric, 
  SmoArpeggio, SmoNoteModifierBase } from '../../smo/data/noteModifiers';
import { SmoSelection } from '../../smo/xform/selections';
import { SmoMeasure, MeasureTickmaps } from '../../smo/data/measure';
import { SvgHelpers } from '../sui/svgHelpers';
import { Clef, IsClef, SvgBox } from '../../smo/data/common';
import { SvgPage } from '../sui/svgPageMap';
import { Vex, Stave, StaveNote, StemmableNote, Note, Beam, Tuplet, Voice,
  Formatter, Accidental, Annotation, StaveNoteStruct } from 'vexflow_smoosic';

const VF = Vex.Flow;

declare var $: any;
// const VF = eval('Vex.Flow');

/**
 * This is the interface for VexFlow library that actually does the engraving.
 * @category SuiRender
 */
export class VxMeasure {
  context: SvgPage;
  static readonly musicFontScaleNote: number = 39;
  static readonly musicFontScaleCue: number = 28;
  printing: boolean;
  selection: SmoSelection;
  softmax: number;
  smoMeasure: SmoMeasure;
  rendered: boolean = false;
  noteToVexMap: Record<string, Note> = {};
  beamToVexMap: Record<string, Beam> = {};
  tupletToVexMap: Record<string, Tuplet> = {};
  multimeasureRest: any | null = null;
  vexNotes: Note[] = [];
  vexBeamGroups: Beam[] = [];
  vexTuplets: Tuplet[] = [];
  tickmapObject: MeasureTickmaps | null = null;
  stave: Stave | null = null; // vex stave
  voiceNotes: Note[] = []; // notes for current voice, as rendering
  voiceAr: Voice[] = [];
  formatter: Formatter | null = null;
  allCues: boolean = false;
  modifiersToBox: SmoNoteModifierBase[] = [];
  collisionMap: Record<number, SmoNote[]> = {};
  dbgLeftX: number = 0;
  dbgWidth: number = 0;

  constructor(context: SvgPage, selection: SmoSelection, printing: boolean, softmax: number) {
    this.context = context;
    this.rendered = false;
    this.selection = selection;
    this.smoMeasure = this.selection.measure;
    this.printing = printing;
    this.allCues = selection.staff.partInfo.displayCues;
    this.tupletToVexMap = {};
    this.vexNotes = [];
    this.vexBeamGroups = [];
    this.vexBeamGroups = [];
    this.beamToVexMap = {};
    this.softmax = softmax;
  }

  static get fillStyle() {
    return '#000';
  }

  /**
   * decide whether to force stem direction for multi-voice, or use the default.
   * @param vxParams - params that go do the VX stem constructor
   * @param voiceIx 
   * @param flagState 
   * @todo use x position of ticks in other voices, pitch of note, to avoid collisions
   */
  applyStemDirection(vxParams: StaveNoteStruct, voiceIx: number, flagState: number) {
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

  isWholeRest() {
    return (this.smoMeasure.voices.length === 1 &&
      this.smoMeasure.voices[0].notes.length === 1 &&
      this.smoMeasure.voices[0].notes[0].isRest()
      );
  }
  // We add microtones to the notes, without regard really to how they interact
  _createMicrotones(smoNote: SmoNote, vexNote: Note) {
    const tones = smoNote.getMicrotones();
    tones.forEach((tone) => {
      const acc: Accidental = new VF.Accidental(tone.toVex);
      vexNote.addModifier(acc, tone.pitchIndex);
    });
  }
  /**
   * Create accidentals based on the active key and previous accidentals in this voice
   * @param smoNote 
   * @param vexNote 
   * @param tickIndex 
   * @param voiceIx 
   * @returns 
   */
  _createAccidentals(smoNote: SmoNote, vexNote: Note, tickIndex: number, voiceIx: number) {
    let i = 0;
    if (smoNote.noteType === '/') {
      return;
    }
    if (smoNote.noteType !== 'n') {
      return;
    }
    smoNote.accidentalsRendered = [];
    for (i = 0; i < smoNote.pitches.length && this.tickmapObject !== null; ++i) {
      const pitch = smoNote.pitches[i];
      const zz = SmoMusic.accidentalDisplay(pitch, this.smoMeasure.keySignature,
        this.tickmapObject.tickmaps[voiceIx].durationMap[tickIndex], this.tickmapObject.accidentalArray);
      if (zz) {
        const acc = new VF.Accidental(zz.symbol);
        if (zz.courtesy) {
          acc.setAsCautionary();
        }
        smoNote.accidentalsRendered.push(pitch.accidental);
        vexNote.addModifier(acc, i);
      } else {
        smoNote.accidentalsRendered.push('');
      }
    }
    for (i = 0; i < smoNote.dots; ++i) {
      for (var j = 0; j < smoNote.pitches.length; ++j) {
        if (!this.isWholeRest()) {
          vexNote.addModifier(new VF.Dot(), j);
        }
      }
    }
    this._createMicrotones(smoNote, vexNote);
    if (smoNote.arpeggio) {
      vexNote.addModifier(new VF.Stroke(smoNote.arpeggio.typeCode));
    }
  }

  _createJazzOrnaments(smoNote: SmoNote, vexNote: Note) {
    const o = smoNote.getJazzOrnaments();
    o.forEach((ll) => {
      const mod = new VF.Ornament(ll.toVex());
      vexNote.addModifier(mod, 0);
    });
  }

  _createOrnaments(smoNote: SmoNote, vexNote: Note) {
    const o = smoNote.getOrnaments();
    o.forEach((ll) => {
      const mod = new VF.Ornament(ll.ornament);
      if (ll.offset === SmoOrnament.offsets.after) {
        mod.setDelayed(true);
      }
      vexNote.addModifier(mod, 0);
    });
  }
  _addLyricAnnotationToNote(vexNote: Note, lyric: SmoLyric) {
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
    const vexL: Annotation = new VF.Annotation(text); // .setReportWidth(lyric.adjustNoteWidth);
    vexL.setAttribute('id', lyric.attrs.id); //

    // If we adjusted this note for the lyric, adjust the lyric as well.
    vexL.setFont(lyric.fontInfo.family, lyric.fontInfo.size, lyric.fontInfo.weight);
    vexL.setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);
    vexNote.addModifier(vexL);
    if (lyric.isHyphenated()) {
      classString += ' lyric-hyphen';
    }
    vexL.addClass(classString);
  }

  _addChordChangeToNote(vexNote: Note, lyric: SmoLyric) {
    const cs = new VF.ChordSymbol();
    cs.setAttribute('id', lyric.attrs.id);
    const blocks = lyric.getVexChordBlocks();
    blocks.forEach((block) => {
      if (block.glyph) {
        cs.addGlyph(block.glyph, block);
      } else {
        cs.addGlyphOrText(block.text ?? '', block);
      }
    });
    cs.setFont(lyric.fontInfo.family, lyric.fontInfo.size).setReportWidth(lyric.adjustNoteWidth);
    vexNote.addModifier(cs, 0);
    const classString = 'chord chord-' + lyric.verse;
    cs.addClass(classString);
  }

  _createLyric(smoNote: SmoNote, vexNote: Note) {
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

  _createGraceNotes(smoNote: SmoNote, vexNote: Note) {
    let i = 0;
    const gar = smoNote.getGraceNotes();
    var toBeam = true;
    if (gar && gar.length) {
      const group: any[] = [];
      gar.forEach((g) => {
        const gr = new VF.GraceNote(g.toVexGraceNote());
        gr.setAttribute('id', g.attrs.id);
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
            gr.addModifier(accidental, i);
          }
        }
        if (g.tickCount() >= 4096) {
          toBeam = false;
        }
        gr.addClass('grace-note'); // note: this doesn't work :(

        g.renderId = gr.getAttribute('id');
        group.push(gr);
      });
      const grace: any = new VF.GraceNoteGroup(group);
      if (toBeam) {
        grace.beamNotes();
      }
      vexNote.addModifier(grace, 0);
    }
  }

  createCollisionTickmap() {
    let i = 0;
    let j = 0;
    if (!this.tickmapObject) {
      return;
    }
    for (i = 0; i < this.smoMeasure.voices.length; ++i) {
      const tm = this.tickmapObject.tickmaps[i];
      for (j = 0; j < tm.durationMap.length; ++j) {
        if (typeof(this.collisionMap[tm.durationMap[j]]) === 'undefined') {
          this.collisionMap[tm.durationMap[j]] = [];
        }
        this.collisionMap[tm.durationMap[j]].push(this.smoMeasure.voices[i].notes[j]);
      }
    }
  }
  isCollision(voiceIx: number, tickIx: number): boolean {
    let i = 0;
    let j = 0;
    let k = 0;
    let staffLines: number[] = [];
    if (!this.tickmapObject) {
      return false;
    }
    const tick = this.tickmapObject.tickmaps[voiceIx].durationMap[tickIx];
    // Just one note, no collision
    if (this.collisionMap[tick].length < 2) {
      return false;
    }
    for (i = 0; i < this.collisionMap[tick].length; ++i) {
      const note = this.collisionMap[tick][i];
      for (j = 0; j < note.pitches.length; ++j) {
        const clef: Clef = IsClef(note.clef) ? note.clef : 'treble';
        const pitch = note.pitches[j];
        const curLine = SmoMusic.pitchToStaffLine(clef, pitch);
        for (k = 0;k < staffLines.length; ++k) {
          if (Math.abs(curLine - staffLines[k]) < 1) {
            return true;
          }
        }
        staffLines.push(curLine);
      }
    }
    return false;
  }

  /**
   * convert a smoNote into a vxNote so it can be rasterized
   * @param smoNote 
   * @param tickIndex - used to calculate accidental
   * @param voiceIx 
   * @returns 
   */
  _createVexNote(smoNote: SmoNote, tickIndex: number, voiceIx: number) {
    let vexNote: Note | null = null;
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
    const noteHead = smoNote.isRest() ? 'r' : smoNote.noteHead;
    const keys = SmoMusic.smoPitchesToVexKeys(smoNote.pitches, 0, noteHead);
    const noteParams: StaveNoteStruct = {
      clef: smoNote.clef,
      keys,
      duration: duration + smoNote.noteType,
      glyph_font_scale: VxMeasure.musicFontScaleNote
    };

    if (smoNote.noteType === '/') {
      vexNote = new VF.GlyphNote(new VF.Glyph('repeatBarSlash', 40), { duration });
      smoNote.renderId = 'vf-' + vexNote.getAttribute('id'); // where does 'vf' come from?
    } else {
      this.applyStemDirection(noteParams, voiceIx, smoNote.flagState);
      layoutDebug.setTimestamp(layoutDebug.codeRegions.PREFORMATA, new Date().valueOf() - timestamp);
      timestamp = new Date().valueOf();
      if (smoNote.isCue || this.allCues) {
        noteParams.glyph_font_scale = VxMeasure.musicFontScaleCue;
      }
      vexNote = new VF.StaveNote(noteParams);
      if (voiceIx > 0 && this.isCollision(voiceIx, tickIndex)) {
        vexNote.setXShift(-10);
      }
      if (this.isWholeRest()) {
        noteParams.duration = 'wr';
        vexNote = new VF.StaveNote(noteParams);
        vexNote.setCenterAlignment(true);
      }
      layoutDebug.setTimestamp(layoutDebug.codeRegions.PREFORMATB, new Date().valueOf() - timestamp);
      timestamp = new Date().valueOf();
      if (smoNote.fillStyle && !this.printing) {
        vexNote.setStyle({ fillStyle: smoNote.fillStyle });
      } else if (voiceIx > 0 && !this.printing) {
        vexNote.setStyle({ fillStyle: "#115511" });
      } else if (smoNote.isHidden() && this.printing) {
        vexNote.setStyle({ fillStyle: "#ffffff00" });
      }
      smoNote.renderId = 'vf-' + vexNote.getAttribute('id'); // where does 'vf' come from?
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
        if (smoNote.noteType === 'n') {
          const vx = this.noteToVexMap[smoNote.attrs.id];
          const position: number = SmoArticulation.positionToVex[art.position];
          const vexArt = SmoArticulation.articulationToVex[art.articulation];
          const vxArt = new VF.Articulation(vexArt).setPosition(position);
          vx.addModifier(vxArt, i);
        }
      });
    });
  }

  _renderNoteGlyph(smoNote: SmoNote, textObj: SmoDynamicText) {
    var x = this.noteToVexMap[smoNote.attrs.id].getAbsoluteX() + textObj.xOffset;
    // the -3 is copied from vexflow textDynamics
    var y = this.stave!.getYForLine(textObj.yOffsetLine - 3) + textObj.yOffsetPixels;
    var group = this.context.getContext().openGroup();
    group.classList.add(textObj.attrs.id + '-' + smoNote.attrs.id);
    group.classList.add(textObj.attrs.id);
    textObj.text.split('').forEach((ch) => {
      const glyphCode = VF.TextDynamics.GLYPHS[ch];
      if (glyphCode) {
        const glyph = new VF.Glyph(glyphCode.code, textObj.fontSize);
        glyph.render(this.context.getContext(), x, y);
        x += VF.TextDynamics.GLYPHS[ch].width;
        const metrics = glyph.getMetrics();
        textObj.logicalBox = SvgHelpers.boxPoints(x, y + this.context.box.y, metrics.width, metrics.height);
      }
    });
    textObj.element = group;
    this.modifiersToBox.push(textObj);
    this.context.getContext().closeGroup();
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
  createRepeatSymbol() {
    this.voiceNotes = [];
    const vexNote = new VF.GlyphNote(new VF.Glyph('repeat1Bar', 38), { duration: 'w' }, { line: 2 });
    vexNote.setCenterAlignment(true);
    this.vexNotes.push(vexNote);
    this.voiceNotes.push(vexNote);
}
  /**
   * create an a array of VF.StaveNote objects to render the active voice.
   * @param voiceIx 
   */
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
    if (!this.smoMeasure.repeatSymbol) {
      this._renderArticulations(voiceIx);
    }
  }

  /**
   * Group the notes for beaming and create Vex beam objects
   * @param vix - voice index
   * @returns 
   */
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
      const vexNotes: StemmableNote[] = [];
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
        if (!(vexNote instanceof StemmableNote)) {
          return;
        }
        if (keyNoteIx === j) {
          stemDirection = note.flagState === SmoNote.flagStates.auto ?
            vexNote.getStemDirection() : note.toVexStemDirection();
        }
        if (vexNote instanceof StemmableNote) {
          vexNote.setStemDirection(stemDirection);
          vexNotes.push(vexNote);  
        }
      }
      const vexBeam = new VF.Beam(vexNotes);
      this.beamToVexMap[bg.attrs.id] = vexBeam;
      this.vexBeamGroups.push(vexBeam);
    }
  }

  /**
   * Create the VF tuplet objects based on the smo tuplet objects
   * @param vix 
   */
  // 
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

  /**
   * create the modifiers for the stave itself, bar lines etc.
   */
  createMeasureModifiers() {
    const sb = this.smoMeasure.getStartBarline();
    const eb = this.smoMeasure.getEndBarline();
    const sym = this.smoMeasure.getRepeatSymbol();
    if (!this.stave) {
      return;
    }

    // don't create a begin bar for any but the 1st measure.
    if (this.smoMeasure.measureNumber.systemIndex !== 0 && sb.barline === SmoBarline.barlines.singleBar
      && this.smoMeasure.format.padLeft === 0) {
      this.stave.setBegBarType(VF.Barline.type.NONE);
    } else {
      this.stave.setBegBarType(sb.toVexBarline());
    }
    if (this.smoMeasure.svg.multimeasureLength > 0 && !this.smoMeasure.svg.hideMultimeasure) {
      this.stave.setEndBarType(SmoBarline.toVexBarline[this.smoMeasure.svg.multimeasureEndBarline]);
    } else if (eb.barline !== SmoBarline.barlines.singleBar) {
      this.stave.setEndBarType(eb.toVexBarline());
    }
    if (sym && sym.symbol !== SmoRepeatSymbol.symbols.None) {
      const rep = new VF.Repetition(sym.toVexSymbol(), sym.xOffset + this.smoMeasure.staffX, sym.yOffset);
      this.stave.getModifiers().push(rep);
    }
    const tms = this.smoMeasure.getMeasureText();
    // TODO: set font
    tms.forEach((tmb: SmoMeasureModifierBase) => {
      const tm = tmb as SmoMeasureText;
      const offset = tm.position === SmoMeasureText.positions.left ? this.smoMeasure.format.padLeft : 0;
      this.stave!.setText(
        tm.text, tm.toVexPosition(), {
        shift_x: tm.adjustX + offset, shift_y: tm.adjustY, justification: tm.toVexJustification()
      });

      // hack - we can't create staveText directly so this is the only way I could set the font
      const ar = this.stave!.getModifiers();
      const vm = ar[ar.length - 1];
      vm.setFont(tm.fontInfo);
    });
    if (this.smoMeasure.svg.rowInSystem === 0) {
      const rmb = this.smoMeasure.getRehearsalMark();
      const rm = rmb as SmoRehearsalMark;
      if (rm) {
        this.stave.setSection(rm.symbol, 0);
      }
    }

    const tempo = this.smoMeasure.getTempo();
    if (tempo && this.smoMeasure.svg.forceTempo) {
      this.stave.setTempo(tempo.toVexTempo(), -1 * tempo.yOffset);
      const vexTempo = this.stave.getModifiers().find((mod: any) => mod.attrs.type === 'StaveTempo');
      if (vexTempo) {
        vexTempo.setFont({ family: SourceSerifProFont.fontFamily, size: 13, weight: 'bold' });
      }
    }
  }

  /**
   * Create all Vex notes and modifiers.  We defer the format and rendering so
   * we can align across multiple staves
   */
  preFormat() {
    var j = 0;
    if (this.smoMeasure.svg.element !== null) {
      this.smoMeasure.svg.element.remove();
      this.smoMeasure.svg.element = null;
    }
    if (this.smoMeasure.svg.hideEmptyMeasure) {
      return;
    }
    // Note: need to do this to get it into VEX KS format
    const key = SmoMusic.vexKeySignatureTranspose(this.smoMeasure.keySignature, 0);
    const canceledKey = SmoMusic.vexKeySignatureTranspose(this.smoMeasure.canceledKeySignature, 0);
    const staffX = this.smoMeasure.staffX + this.smoMeasure.format.padLeft;
    const staffY = this.smoMeasure.staffY - this.context.box.y;
    this.stave = new VF.Stave(staffX, staffY, this.smoMeasure.staffWidth - this.smoMeasure.format.padLeft);
    // If there is padLeft, draw an invisible box so the padding is included in the measure box
    if (this.smoMeasure.format.padLeft) {
      this.context.getContext().rect(this.smoMeasure.staffX, staffY, this.smoMeasure.format.padLeft, 50, {
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
      const ts = this.smoMeasure.timeSignature;
      let tsString = ts.timeSignature;
      if (this.smoMeasure.timeSignature.useSymbol && ts.actualBeats === 4 && ts.beatDuration === 4) {
        tsString = 'C';
      } else if (this.smoMeasure.timeSignature.useSymbol && ts.actualBeats === 2 && ts.beatDuration === 4) {
        tsString = 'C|';
      } else if (this.smoMeasure.timeSignatureString.length) {
        tsString = this.smoMeasure.timeSignatureString;
      }
      this.stave.addTimeSignature(tsString);
    }
    // Connect it to the rendering context and draw!
    this.stave.setContext(this.context.getContext());

    this.createMeasureModifiers();

    this.tickmapObject = this.smoMeasure.createMeasureTickmaps();
    this.createCollisionTickmap();

    this.voiceAr = [];
    this.vexNotes = [];
    this.noteToVexMap = {};

    // If there are multiple voices, add them all to the formatter at the same time so they don't collide
    for (j = 0; j < this.smoMeasure.voices.length; ++j) {
      if (!this.smoMeasure.svg.multimeasureLength && !this.smoMeasure.repeatSymbol) {
        this.createVexNotes(j);
        this.createVexTuplets(j);
        this.createVexBeamGroups(j);

        // Create a voice in 4/4 and add above notes
        const voice = new VF.Voice({
          num_beats: this.smoMeasure.timeSignature.actualBeats,
          beat_value: this.smoMeasure.timeSignature.beatDuration
        }).setMode(VF.Voice.Mode.SOFT);
        voice.addTickables(this.voiceNotes);
        this.voiceAr.push(voice);
      }
      if (this.smoMeasure.repeatSymbol) {
        this.createRepeatSymbol();
        // Create a voice in 4/4 and add above notes
        const voice = new VF.Voice({
          num_beats: this.smoMeasure.timeSignature.actualBeats,
          beat_value: this.smoMeasure.timeSignature.beatDuration
        }).setMode(VF.Voice.Mode.SOFT);
        voice.addTickables(this.voiceNotes);
        this.voiceAr.push(voice);
      }
    }

    // Need to format for x position, then set y position before drawing dynamics.
    this.formatter = new VF.Formatter({ softmaxFactor: this.softmax, globalSoftmax: false });
    this.voiceAr.forEach((voice) => {
      if (this.formatter) {
        this.formatter.joinVoices([voice]);
      }
    });
  }
  /**
   * Create the Vex formatter that calculates the X and Y positions of the notes.  A formatter
   * may actually span multiple staves for justified staves.  The notes are drawn in their
   * individual vxMeasure objects but formatting is done once for all justified staves
   * @param voices Voice objects from VexFlow
   * @returns 
   */
  format(voices: Voice[]) {
    if (this.smoMeasure.svg.hideEmptyMeasure) {
      return;
    }

    if (this.smoMeasure.svg.multimeasureLength > 0) {
      this.multimeasureRest = new VF.MultiMeasureRest(this.smoMeasure.svg.multimeasureLength, { number_of_measures: this.smoMeasure.svg.multimeasureLength });
      this.multimeasureRest.setContext(this.context.getContext());
      this.multimeasureRest.setStave(this.stave);
      return;
    }
    if (!this.formatter) {
      return;
    }
    const timestamp = new Date().valueOf();
    const staffWidth = this.smoMeasure.staffWidth -
      (this.smoMeasure.svg.adjX + this.smoMeasure.svg.adjRight + this.smoMeasure.format.padLeft) - 10;
    this.dbgLeftX = this.smoMeasure.staffX +  this.smoMeasure.format.padLeft + this.smoMeasure.svg.adjX;
    this.dbgWidth = staffWidth;
    this.formatter.format(voices, staffWidth);
    layoutDebug.setTimestamp(layoutDebug.codeRegions.FORMAT, new Date().valueOf() - timestamp);
  }
  /**
   * render is called after format.  Actually draw the things.
   */
  render() {
    if (this.smoMeasure.svg.hideEmptyMeasure) {
      return;
    }

    var group = this.context.getContext().openGroup() as SVGSVGElement;
    this.smoMeasure.svg.element = group;
    var mmClass = this.smoMeasure.getClassId();
    var j = 0;
    try {
      // bound each measure in its own SVG group for easy deletion and mapping to screen coordinate
      group.classList.add(this.smoMeasure.attrs.id);
      group.classList.add(mmClass);
      group.id = this.smoMeasure.attrs.id;
      this.stave!.draw();
      this.smoMeasure.svg.element = group;

      for (j = 0; j < this.voiceAr.length; ++j) {
        this.voiceAr[j].draw(this.context.getContext(), this.stave!);
      }

      this.vexBeamGroups.forEach((b) => {
        b.setContext(this.context.getContext()).draw();
      });

      this.vexTuplets.forEach((tuplet) => {
        tuplet.setContext(this.context.getContext()).draw();
      });
      if (this.multimeasureRest) {
        this.multimeasureRest.draw();
      }
      // this._updateLyricDomSelectors();
      this.renderDynamics();
      // this.smoMeasure.adjX = this.stave.start_x - (this.smoMeasure.staffX);

      this.context.getContext().closeGroup();
      // layoutDebug.setTimestamp(layoutDebug.codeRegions.RENDER, new Date().valueOf() - timestamp);

      this.rendered = true;
      if (layoutDebug.mask & layoutDebug.values['adjust']) {
        SvgHelpers.debugBoxNoText(this.context.getContext().svg,
        SvgHelpers.boxPoints(this.dbgLeftX, 
          this.smoMeasure.svg.staffY, this.dbgWidth, 40), 'render-x-dbg', 0);
      }
    } catch (exc) {
      console.warn('unable to render measure ' + this.smoMeasure.measureNumber.measureIndex);
      this.context.getContext().closeGroup();
    }
  }
}
