
import { SmoNote } from '../../smo/data/note';
import { SmoMusic } from '../../smo/data/music';
import { layoutDebug } from '../sui/layoutDebug';
import { SmoRepeatSymbol, SmoMeasureText, SmoBarline, SmoMeasureModifierBase, SmoRehearsalMark, SmoMeasureFormat } from '../../smo/data/measureModifiers';
import { SourceSerifProFont } from '../../styles/font_metrics/ssp-serif-metrics';
import { SmoOrnament, SmoArticulation, SmoDynamicText, SmoLyric, 
  SmoArpeggio, SmoNoteModifierBase, VexAnnotationParams } from '../../smo/data/noteModifiers';
import { SmoSelection } from '../../smo/xform/selections';
import { SmoMeasure, MeasureTickmaps } from '../../smo/data/measure';
import { SvgHelpers } from '../sui/svgHelpers';
import { Clef, IsClef } from '../../smo/data/common';
import { SvgPage } from '../sui/svgPageMap';
import { toVexBarlineType, vexBarlineType, vexBarlinePosition, toVexBarlinePosition, toVexSymbol,
  toVexTextJustification, toVexTextPosition, getVexChordBlocks, toVexStemDirection } from './smoAdapter';
import { VexFlow, Stave,StemmableNote, Note, Beam, Tuplet, Voice,
  Formatter, Accidental, Annotation, StaveNoteStruct, StaveText, StaveModifier, 
  createStaveText, renderDynamics, applyStemDirection,
  getVexNoteParameters, defaultNoteScale, defaultCueScale, getVexTuplets,
  createStave, createVoice, getOrnamentGlyph, getSlashGlyph, getRepeatBar, getMultimeasureRest,
  addChordGlyph } from '../../common/vex';

const VF = VexFlow;

export interface VxMeasureIf {
  isWholeRest(): boolean;
  noteToVexMap: Record<string, Note>;
  smoMeasure: SmoMeasure;
  tickmapObject: MeasureTickmaps | null
}

export interface VexNoteModifierIf {
  smoMeasure: SmoMeasure,
  vxMeasure: VxMeasureIf,
  smoNote: SmoNote,
  staveNote: Note,
  voiceIndex: number,
  tickIndex: number
}

export class VxNote {
  noteData: VexNoteModifierIf;
  constructor(noteData: VexNoteModifierIf) {
    this.noteData = noteData;
  }
  createMicrotones(smoNote: SmoNote, vexNote: Note) {
    const tones = smoNote.getMicrotones();
    tones.forEach((tone) => {
      const acc: Accidental = new VF.Accidental(tone.toVex);
      vexNote.addModifier(acc, tone.pitchIndex);
    });
  }
  createDots() {
    for (var i = 0; i < this.noteData.smoNote.dots; ++i) {
      for (var j = 0; j < this.noteData.smoNote.pitches.length; ++j) {
        if (!this.noteData.vxMeasure.isWholeRest()) {
          this.noteData.staveNote.addModifier(new VF.Dot(), j);
        }
      }
    }
  }
   /**
   * Create accidentals based on the active key and previous accidentals in this voice
   * @param smoNote 
   * @param vexNote 
   * @param tickIndex 
   * @param voiceIx 
   * @returns 
   */
   createAccidentals() {
    let i = 0;
    if (this.noteData.smoNote.noteType === '/') {
      return;
    }
    if (this.noteData.smoNote.noteType !== 'n') {
      this.createDots();
      return;
    }
    this.noteData.smoNote.accidentalsRendered = [];
    for (i = 0; i < this.noteData.smoNote.pitches.length && this.noteData.vxMeasure.tickmapObject !== null; ++i) {
      const pitch = this.noteData.smoNote.pitches[i];
      const zz = SmoMusic.accidentalDisplay(pitch, this.noteData.smoMeasure.keySignature,
        this.noteData.vxMeasure.tickmapObject.tickmaps[this.noteData.voiceIndex].durationMap[this.noteData.tickIndex], 
        this.noteData.vxMeasure.tickmapObject.accidentalArray);
      if (zz) {
        const acc = new VF.Accidental(zz.symbol);
        if (zz.courtesy) {
          acc.setAsCautionary();
        }
        this.noteData.smoNote.accidentalsRendered.push(pitch.accidental);
        this.noteData.staveNote.addModifier(acc, i);
      } else {
        this.noteData.smoNote.accidentalsRendered.push('');
      }
    }
    this.createDots();
    this.createMicrotones(this.noteData.smoNote, this.noteData.staveNote);
    if (this.noteData.smoNote.arpeggio) {
      this.noteData.staveNote.addModifier(new VF.Stroke(this.noteData.smoNote.arpeggio.typeCode));
    }
  }
  createJazzOrnaments() {
    const smoNote = this.noteData.smoNote;
    const vexNote = this.noteData.staveNote;
    const o = smoNote.getJazzOrnaments();
    o.forEach((ll) => {
      const mod = new VF.Ornament(ll.toVex());
      vexNote.addModifier(mod, 0);
    });
  }

  createOrnaments() {
    const o = this.noteData.smoNote.getOrnaments();
    o.forEach((ll) => {
      const ornamentCode = getOrnamentGlyph(ll.ornament);
      const mod = new VF.Ornament(ornamentCode);
      if (ll.offset === SmoOrnament.offsets.after) {
        mod.setDelayed(true);
      }
      this.noteData.staveNote.addModifier(mod, 0);
    });
  }
  addLyricAnnotationToNote(vexNote: Note, lyric: SmoLyric) {
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
  addChordChangeToNote(vexNote: Note, lyric: SmoLyric) {
    const cs = new VF.ChordSymbol();
    cs.setAttribute('id', lyric.attrs.id);
    const blocks = getVexChordBlocks(lyric);
    blocks.forEach((block) => {
      if (block.glyph) {
        // Vex 5 broke this, does not distinguish between glyph and text
        // the reverse is for vex4 which expects the non-mangled identifier here,
        // e.g. 'diminished' and not 'csymDiminished'
        addChordGlyph(cs, block.glyph);
      } else {
        cs.addGlyphOrText(block.text ?? '', block);
      }
    });
    cs.setFont(lyric.fontInfo.family, lyric.fontInfo.size).setReportWidth(lyric.adjustNoteWidth);
    vexNote.addModifier(cs, 0);
    const classString = 'chord chord-' + lyric.verse;
    cs.addClass(classString);
  }
  createLyric() {
    const lyrics = this.noteData.smoNote.getTrueLyrics();
    if (this.noteData.smoNote.noteType !== '/') {
      lyrics.forEach((bll) => {
        const ll = bll as SmoLyric;
        this.addLyricAnnotationToNote(this.noteData.staveNote, ll);
      });
    }
    const chords = this.noteData.smoNote.getChords();
    chords.forEach((chord) => {
      this.addChordChangeToNote(this.noteData.staveNote, chord);
    });
  }
  createGraceNotes() {
    const smoNote = this.noteData.smoNote;
    const vexNote = this.noteData.staveNote;
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
  addArticulations() {
    const smoNote = this.noteData.smoNote;
    smoNote.articulations.forEach((art) => {
      if (smoNote.noteType === 'n') {
        const vx = this.noteData.staveNote;
        const position: number = SmoArticulation.positionToVex[art.position];
        const vexArt = SmoArticulation.articulationToVex[art.articulation];
        const vxArt = new VF.Articulation(vexArt).setPosition(position);
        vx.addModifier(vxArt, this.noteData.voiceIndex);
      }
    });
  }

  addModifiers() {
    this.createAccidentals();
    this.createLyric();
    this.createOrnaments();
    this.createJazzOrnaments();
    this.createGraceNotes();
    this.addArticulations();
  }
}
