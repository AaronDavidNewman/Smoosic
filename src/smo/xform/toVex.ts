// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMusic } from '../data/music';
import { SmoNote } from '../data/note';
import { SmoMeasure } from '../data/measure';
import { SmoScore } from '../data/score';
import { SmoArticulation, SmoLyric } from '../data/noteModifiers';
import { Pitch } from '../data/common';
import { Vex, StaveNoteStruct, NoteStruct, Element } from 'vexflow_smoosic';
import { MeasureTickmaps } from '../data/measure';

export function smoNoteToVexKeys(smoNote: SmoNote) {
  const rv: string[] = [];
  smoNote.pitches.forEach((pitch: Pitch) => {
    rv.push(SmoMusic.pitchToVexKey(pitch));
  });
  return rv;
}
export function smoNoteToStaveNote(smoNote: SmoNote) {
  const sn: StaveNoteStruct = {
    duration: SmoMusic.ticksToDuration[SmoMusic.closestDurationTickLtEq(smoNote.tickCount)],
    dots: smoNote.dots,
    type: smoNote.noteType
  };
  if (smoNote.flagState !== SmoNote.flagStates.auto) {
    sn.stem_direction = smoNote.flagState === SmoNote.flagStates.up ? 1 : -1;
    sn.auto_stem = false; 
  } else {
    sn.auto_stem = true;
  }
  sn.keys = smoNoteToVexKeys(smoNote);
  return sn;
}
export const getId = () => (Element as any).newID();

export function createStaveNote(smoNote: SmoNote,voiceIx: number, noteIx: number, tickmapObject: MeasureTickmaps, strs: string[]) {
  const id = smoNote.attrs.id;
  const ctorInfo = smoNoteToStaveNote(smoNote);
  const ctorString = JSON.stringify(ctorInfo);
  strs.push(`const ${id} = new VF.StaveNote(JSON.parse('${ctorString}'))`);
  strs.push(`noteHash['${id}'] = ${id};`);
  strs.push(`${id}.setAttribute('id', '${id}');`);
  if (smoNote.noteType === 'n') {
    smoNote.pitches.forEach((pitch, ix) => {
      const zz = SmoMusic.accidentalDisplay(pitch, smoNote.keySignature,
        tickmapObject.tickmaps[voiceIx].durationMap[noteIx], tickmapObject.accidentalArray);
      if (zz) {
        const aname = id + ix.toString() + 'acc';
        strs.push(`const ${aname} = new VF.Accidental('${zz.symbol}');`);
        if (zz.courtesy) {
          strs.push(`${aname}.setAsCautionary();`);
        }
        strs.push(`${id}.addModifier(${aname});`);
      }
    });    
  }
  for (var i = 0; i < smoNote.dots; ++i) {
    for (var j = 0; j < smoNote.pitches.length; ++j) {
      strs.push(`${id}.addModifier(new VF.Dot(), ${j});`);      
    }
  }
  smoNote.articulations.forEach((aa) => {
    const position: number = SmoArticulation.positionToVex[aa.position];
    const vexArt = SmoArticulation.articulationToVex[aa.articulation];
    const sn = getId();
    strs.push(`const  ${sn} = new VF.Articulation('${vexArt}').setPosition(${position});`);
    strs.push(`${id}.addModifier(${sn}, 0);`);
  });
  const lyrics = smoNote.getTrueLyrics();
  if (smoNote.noteType !== '/') {
    lyrics.forEach((bll) => {
      const ll = bll as SmoLyric;
      let classString = 'lyric lyric-' + ll.verse;
      let text = ll.getText();
      if (!ll.skipRender) {
        if (!text.length && ll.isHyphenated()) {
          text = '-';
        }
        // no text, no hyphen, don't add it.
        if (text.length) {
          const sn = ll.attrs.id;
          strs.push(`const ${sn} = new VF.Annotation('${text}');`);
          strs.push(`${sn}.setAttribute('id', '${sn});`)
          strs.push(`${sn}.setFont('${ll.fontInfo.family}', ${ll.fontInfo.size}, '${ll.fontInfo.weight}');`)
          strs.push(`${sn}.setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);`);
          strs.push(`${id}.addModifier(${sn});`);
          if (ll.isHyphenated()) {
            classString += ' lyric-hyphen';
          }
          strs.push(`${sn}.addClass('${classString}');`);
        }
      }
    });
  }
  return id;
}
export function createMeasure(smoMeasure: SmoMeasure, voiceStrings: string[], fmtid: string, strs: string[]) {
  let voiceAr = '[' + voiceStrings.join(',') + ']';
  voiceStrings.forEach((vs) => {
    strs.push(`${fmtid}.joinVoices([${vs}]);`);
  });
  const staffWidth = smoMeasure.staffWidth -
     (smoMeasure.svg.adjX + smoMeasure.svg.adjRight + smoMeasure.format.padLeft) - 10;
  strs.push(`${fmtid}.format(${voiceAr}, ${staffWidth});`);
  const ssid = 'stave' + smoMeasure.attrs.id;
  strs.push(`const ${ssid} = new VF.Stave(${smoMeasure.svg.staffX}, ${smoMeasure.svg.staffY}, ${smoMeasure.svg.staffWidth});`);
  if (smoMeasure.svg.forceClef) {
    strs.push(`${ssid}.addClef('${smoMeasure.clef}')`);
  }
  if (smoMeasure.svg.forceTimeSignature) {
    const ts = smoMeasure.timeSignature;
    let tsString = ts.timeSignature;
    if (smoMeasure.timeSignature.useSymbol && ts.actualBeats === 4 && ts.beatDuration === 4) {
      tsString = 'C';
    } else if (smoMeasure.timeSignature.useSymbol && ts.actualBeats === 2 && ts.beatDuration === 4) {
      tsString = 'C|';
    } else if (smoMeasure.timeSignatureString.length) {
      tsString = smoMeasure.timeSignatureString;
    }
    strs.push(`${ssid}.addTimeSignature('${tsString}');`);
  }
  if (smoMeasure.svg.forceKeySignature) {
    const key = SmoMusic.vexKeySignatureTranspose(smoMeasure.keySignature, 0);
    const ksid = 'key' + smoMeasure.attrs.id;
    strs.push(`const ${ksid} = new VF.KeySignature(${key});`);
    if (smoMeasure.canceledKeySignature) {
      const canceledKey = SmoMusic.vexKeySignatureTranspose(smoMeasure.canceledKeySignature, 0);
      strs.push(`${ksid}.cancelKey(${canceledKey}`);
    }
    strs.push(`${ksid}.addToStave(${ssid});`);
  }
  strs.push(`${ssid}.setContext(context)`);
  strs.push(`${ssid}.draw();`);
  voiceStrings.forEach((vs) => {
    strs.push(`${vs}.draw(context, ${ssid});`);
  });
}
export interface SmoToVexNote {
  ctorInfo: NoteStruct,
  note: SmoNote,
  type: string
}
// ## SmoToVex
// Simple serialize class that produced VEX note and voice objects
// for vex EasyScore (for easier bug reports and test cases)
export class SmoToVex {

  static convert(smoScore: SmoScore, options: any) {
    let useId = false;
    let page = 0;
    options = options ?? {};
    if (typeof(options['id']) === 'boolean') {
      useId = options.id
    }
    if (typeof(options['page'] === 'number')) {
      page = options.page;
    }
    const strs: string[] = [];
    const pageHeight = smoScore.layoutManager?.getGlobalLayout().pageHeight ?? 1056;
    const pageWidth = smoScore.layoutManager?.getGlobalLayout().pageWidth ?? 816;
    strs.push('const VF = Vex.Flow;');
    strs.push(`const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);`)
    strs.push(`renderer.resize(${pageWidth}, ${pageHeight});`);
    strs.push('const context = renderer.getContext();');
    strs.push('const noteHash = {};');
    smoScore.staves.forEach((smoStaff, staffIx) => {
      for (var i = 0; i < smoStaff.measures.length; ++i) {
        const smoMeasure = smoStaff.measures[i];
        const tickmapObject = smoMeasure.createMeasureTickmaps();
        const measureIx = i;
        const voiceStrings: string[] = [];
        const fmtid = 'fmt' + smoMeasure.attrs.id + measureIx.toString();
        strs.push(`const ${fmtid} = new VF.Formatter();`);
        smoMeasure.voices.forEach((smoVoice, vix) => {
          const vn = smoMeasure.attrs.id + 'v' + vix.toString();
          const vc = vn + 'ar';
          strs.push(`const ${vn} = new VF.Voice();`);
          strs.push(`const ${vc} = [];`)
          smoVoice.notes.forEach((smoNote, nix) => {
            const noteId = createStaveNote(smoNote, vix, nix, tickmapObject, strs);
            strs.push(`${vc}.push(${noteId});`);
          });
          strs.push(`${vn}.addTickables(${vc})`);
          voiceStrings.push(vn);
        });
        createMeasure(smoMeasure, voiceStrings, fmtid, strs);
      };
    });
    console.log(strs.join(`\n`));
  }
}
