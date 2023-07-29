// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMusic } from '../data/music';
import { SmoNote } from '../data/note';
import { SmoMeasure, SmoVoice } from '../data/measure';
import { SmoScore } from '../data/score';
import { SmoArticulation, SmoLyric } from '../data/noteModifiers';
import { Pitch } from '../data/common';
import { Vex, StaveNoteStruct, NoteStruct, Element } from 'vexflow_smoosic';
import { MeasureTickmaps } from '../data/measure';
import { SmoSelection } from './selections';

export interface VexNoteRenderInfo {
  smoNote: SmoNote,voiceIx: number, noteIx: number, tickmapObject: MeasureTickmaps
}
export interface VexStaveGroupMusic {
  formatter: string, measures: SmoMeasure[], voiceStrings: string[]
}
export function smoNoteToVexKeys(smoNote: SmoNote) {
  const rv: string[] = [];
  smoNote.pitches.forEach((pitch: Pitch) => {
    rv.push(SmoMusic.pitchToVexKey(pitch));
  });
  return rv;
}
export function smoNoteToStaveNote(smoNote: SmoNote) {
  const duration =
    smoNote.isTuplet ?
      SmoMusic.closestVexDuration(smoNote.tickCount) :
      SmoMusic.ticksToDuration[smoNote.tickCount];
  const sn: StaveNoteStruct = {
    clef: smoNote.clef,
    duration,
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
export const getVoiceId = (smoMeasure:SmoMeasure, voiceIx: number) => {
  return smoMeasure.attrs.id + 'v' + voiceIx.toString();
}

export function createStaveNote(renderInfo: VexNoteRenderInfo, strs: string[]) {
  const { smoNote, voiceIx, noteIx, tickmapObject } = { ...renderInfo };
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
          strs.push(`${sn}.setAttribute('id', '${sn}');`);
          const weight = ll.fontInfo.weight ?? 'normal';
          strs.push(`${sn}.setFont('${ll.fontInfo.family}', ${ll.fontInfo.size}, '${weight}');`)
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
export function createColumn(groups: Record<string, VexStaveGroupMusic>, strs: string[]) {
  const groupKeys = Object.keys(groups);
  groupKeys.forEach((groupKey) => {
    const music = groups[groupKey];
    // Need to create beam groups before formatting
    music.measures.forEach((smoMeasure) => {
      strs.push(`// create beam groups and tuplets for measure stave ${smoMeasure.measureNumber.measureIndex}`);
      createBeamGroups(smoMeasure, strs);
      createTuplets(smoMeasure, strs);
    });
    strs.push(' ');
    strs.push(`// formatting measures in ${groupKey}`);
    const joinVoiceStr = '[' + music.voiceStrings.join(',') + ']';
    const widthMeasure = music.measures[0];
    const staffWidth = widthMeasure.staffWidth -
    (widthMeasure.svg.adjX + widthMeasure.svg.adjRight + widthMeasure.format.padLeft) - 10;
    strs.push(`${music.formatter}.format(${joinVoiceStr}, ${staffWidth});`);
    music.measures.forEach((smoMeasure) => {
      createMeasure(smoMeasure, strs);
    });
  });
}
export function createBeamGroups(smoMeasure: SmoMeasure, strs: string[]) {
  smoMeasure.voices.forEach((voice, voiceIx) => {
    const bgs = smoMeasure.beamGroups.filter((bb) => bb.voice === voiceIx);
    for (var i = 0; i < bgs.length; ++i) {
      const bg = bgs[i];
      let  keyNoteIx = bg.notes.findIndex((nn) => nn.noteType === 'n');
      keyNoteIx = (keyNoteIx >= 0) ? keyNoteIx : 0;
      const nar: string[] = [];
      for (var j = 0; j < bg.notes.length; ++j) {
        const note = bg.notes[j];
        const vexNote = `noteHash['${note.attrs.id}']`;
        if (note.noteType !== '/') {
          nar.push(vexNote);
        }
        if (note.noteType !== 'n') {
          continue;
        }
        if (note.flagState !== SmoNote.flagStates.auto) {
          const noteStem = note.toVexStemDirection();
          strs.push(`${vexNote}.setStemDirection(${noteStem});`);
        }
      }
      const narString = '[' + nar.join(',') + ']';
      strs.push(`const ${bg.attrs.id} = new VF.Beam(${narString});`);
    }
  });
}
export function createTuplets(smoMeasure: SmoMeasure, strs: string[]) {
  smoMeasure.voices.forEach((voice, voiceIx) => {
    const tps = smoMeasure.tuplets.filter((tp) => tp.voice === voiceIx);
    for (var i = 0; i < tps.length; ++i) {
      const tp = tps[i];
      const nar: string[] = [];
      for (var j = 0; j < tp.notes.length; ++j) {
        const note = tp.notes[j];
        const vexNote = `note_hash['${note.attrs.id}']`;
        nar.push(vexNote);
      }
      const direction = tp.getStemDirection(smoMeasure.clef) === SmoNote.flagStates.up ?
          Vex.Flow.Tuplet.LOCATION_TOP : Vex.Flow.Tuplet.LOCATION_BOTTOM;
      const tpParams = {
          num_notes: tp.num_notes,
          notes_occupied: tp.notes_occupied,
          ratioed: false,
          bracketed: true,
          location: direction
      };
      const tpParamString = JSON.stringify(tpParams);
      const narString = '[' + nar.join(',') + ']';
      strs.push(`const ${tp.attrs.id} = new VF.Tuplet(${narString}, JSON.parse('${tpParamString}'));`);
    }
  });
}

export function createMeasure(smoMeasure: SmoMeasure, strs: string[]) {
  const ssid = 'stave' + smoMeasure.attrs.id;
  strs.push(`const ${ssid} = new VF.Stave(${smoMeasure.svg.staffX}, ${smoMeasure.svg.staffY}, ${smoMeasure.svg.staffWidth});`);
  if (smoMeasure.svg.forceClef) {
    strs.push(`${ssid}.addClef('${smoMeasure.clef}');`);
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
      strs.push(`${ksid}.cancelKey(${canceledKey};`);
    }
    strs.push(`${ksid}.addToStave(${ssid});`);
  }
  strs.push(`${ssid}.setContext(context);`);
  strs.push(`${ssid}.draw();`);

  smoMeasure.voices.forEach((voice, voiceIx) => {
    const vs = getVoiceId(smoMeasure, voiceIx);
    strs.push(`${vs}.draw(context, ${ssid});`);
  });
  smoMeasure.beamGroups.forEach((bg) => {
    strs.push(`${bg.attrs.id}.setContext(context);`);
    strs.push(`${bg.attrs.id}.draw();`)
  });
  smoMeasure.tuplets.forEach((tp) => {
    strs.push(`${tp.attrs.id}.setContext(context).draw();`)
  })
}

// ## SmoToVex
// Simple serialize class that produced VEX note and voice objects
// for vex EasyScore (for easier bug reports and test cases)
export class SmoToVex {

  static convert(smoScore: SmoScore, options: any) {
    let div = 'boo';
    options = options ?? {};
    if (typeof(options['div']) === 'string') {
      div = options.div
    }
    const strs: string[] = [];
    const pageHeight = smoScore.layoutManager?.getGlobalLayout().pageHeight ?? 1056;
    const pageWidth = smoScore.layoutManager?.getGlobalLayout().pageWidth ?? 816;
    strs.push(`const div = document.getElementById('${div}')`);
    strs.push('const VF = Vex.Flow;');
    strs.push(`const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);`);
    const zoomScale = (smoScore.layoutManager?.getZoomScale() ?? 1.0);
    const svgScale = (smoScore.layoutManager?.getGlobalLayout().svgScale ?? 1.0);
    const width = zoomScale * pageWidth;
    const height = zoomScale * pageHeight;
    const scale = svgScale * zoomScale;
    const vbWidth = Math.round(width / scale);
    const vbHeight = Math.round(height / scale);

    strs.push('const context = renderer.getContext();');
    strs.push('const svg = context.svg');
    strs.push(`svg.setAttributeNS('', 'width', '${width}');`);
    strs.push(`svg.setAttributeNS('', 'height', '${height}');`);
    strs.push(`svg.setAttributeNS('', 'viewBox', '0 0 ${vbWidth} ${vbHeight}');`);
    strs.push('const noteHash = {};');
    strs.push('const voiceHash = {}');
    const measureCount = smoScore.staves[0].measures.length;
    for (var k = 0; k < measureCount; ++k) {
      const groupMap: Record<string, VexStaveGroupMusic> = {};
      smoScore.staves.forEach((smoStaff, staffIx) => {
        const smoMeasure = smoStaff.measures[k];
        const selection = SmoSelection.measureSelection(smoScore, smoStaff.staffId, smoMeasure.measureNumber.measureIndex);
        if (!selection) {
          throw('ouch no selection');
        }
        const systemGroup = smoScore.getSystemGroupForStaff(selection);
        const justifyGroup: string = (systemGroup && smoMeasure.format.autoJustify) ? systemGroup.attrs.id : selection.staff.attrs.id;
        const tickmapObject = smoMeasure.createMeasureTickmaps();
        const measureIx = smoMeasure.measureNumber.measureIndex;
        const voiceStrings: string[] = [];
        const fmtid = 'fmt' + smoMeasure.attrs.id + measureIx.toString();
        strs.push(`const ${fmtid} = new VF.Formatter();`);
        if (!groupMap[justifyGroup]) {
          groupMap[justifyGroup] = {
            formatter: fmtid,
            measures: [],
            voiceStrings: []
          }
        }
        groupMap[justifyGroup].measures.push(smoMeasure);
        strs.push(' ');
        strs.push(`// voices and notes for stave ${smoStaff.staffId} ${smoMeasure.measureNumber.measureIndex}`);
        smoMeasure.voices.forEach((smoVoice, voiceIx) => {        
          const vn = getVoiceId(smoMeasure, voiceIx);
          groupMap[justifyGroup].voiceStrings.push(vn);
          const vc = vn + 'ar';
          const ts = JSON.stringify({
            num_beats: smoMeasure.timeSignature.actualBeats,
            beat_value: smoMeasure.timeSignature.beatDuration
          });
          strs.push(`const ${vn} = new VF.Voice(JSON.parse('${ts}')).setMode(VF.Voice.Mode.SOFT);`);
          strs.push(`const ${vc} = [];`)
          smoVoice.notes.forEach((smoNote, noteIx) => {
            const renderInfo: VexNoteRenderInfo = { smoNote, voiceIx, noteIx, tickmapObject };
            const noteId = createStaveNote(renderInfo, strs);
            strs.push(`${vc}.push(${noteId});`);
          });
          strs.push(`${vn}.addTickables(${vc})`);
          voiceStrings.push(vn);
          strs.push(`${fmtid}.joinVoices([${vn}]);`);
        });

        if (smoMeasure.svg.rowInSystem === smoScore.staves.length - 1) {
          createColumn(groupMap, strs);
        }
      });
    }
    console.log(strs.join(`\n`));
  }
}
