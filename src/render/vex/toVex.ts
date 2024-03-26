// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoMusic } from '../../smo/data/music';
import { SmoNote } from '../../smo/data/note';
import { SmoMeasure, SmoVoice, MeasureTickmaps } from '../../smo/data/measure';
import { SmoScore } from '../../smo/data/score';
import { SmoArticulation, SmoLyric, SmoOrnament } from '../../smo/data/noteModifiers';
import { VexFlow, StaveNoteStruct, TupletOptions, vexOrnaments } from '../../common/vex';
import { SmoBarline, SmoRehearsalMark } from '../../smo/data/measureModifiers';
import { SmoSelection, SmoSelector } from '../../smo/xform/selections';
import { SmoSystemStaff } from '../../smo/data/systemStaff';
import { getId } from '../../smo/data/common';
import { SmoSystemGroup } from '../../smo/data/scoreModifiers';
import { StaffModifierBase, SmoStaffHairpin, SmoSlur, SmoTie, SmoStaffTextBracket } from '../../smo/data/staffModifiers';
import { toVexBarlineType, vexBarlineType, vexBarlinePosition, toVexBarlinePosition, leftConnectorVx, rightConnectorVx,
  toVexVolta, getVexChordBlocks } from '../../render/vex/smoAdapter';



const VF = VexFlow;
export const fontStacks: Record<string, string[]> =     {
  Bravura: ['"Bravura"', '"Gonville"', '"Custom"'],
  Gonville: ['"Gonville"', '"Bravura"', '"Custom"'],
  Petaluma: ['"Petaluma"', '"Bravura"', '"Gonville"', '"Custom"'],
  Leland: ['"Leland"', '"Bravura"', '"Gonville"', '"Custom"'] 
}
interface LyricAdjust {
  verse: number, lyric: SmoLyric, 
}
interface VexNoteRenderInfo {
  smoNote: SmoNote,voiceIx: number, noteIx: number, tickmapObject: MeasureTickmaps, lyricAdj: string[]
}
interface VexStaveGroupMusic {
  formatter: string, measures: SmoMeasure[], voiceStrings: string[], heightOffset: number, 
  systemGroup?: SmoSystemGroup
}
function smoNoteToVexKeys(smoNote: SmoNote) {
  const noteHead = smoNote.isRest() ? 'r' : smoNote.noteHead;
  const keys = SmoMusic.smoPitchesToVexKeys(smoNote.pitches, 0, noteHead);
  return keys;
}
function smoNoteToGraceNotes(smoNote: SmoNote, strs: string[]) {
  const gar = smoNote.getGraceNotes();
  var toBeam = true;
  if (gar && gar.length) {
    const grGroup: string[] = [];
    gar.forEach((g) => {
      const grid = g.attrs.id;
      const args = JSON.stringify(g.toVexGraceNote());
      strs.push(`const ${grid} = new VF.GraceNote(JSON.parse('${args}'))`);
      strs.push(`${grid}.setAttribute('id', '${grid}');`);
      for (var i = 0; i < g.pitches.length; ++i) {
        const pitch = g.pitches[i];
        if (!pitch.accidental) {
          console.warn('no accidental in grace note');
        }
        if (pitch.accidental && pitch.accidental !== 'n' || pitch.cautionary) {
          const acid = 'acc' + i.toString() + grid;
          strs.push(`const ${acid} = new VF.Accidental('${pitch.accidental}');`);
          if (pitch.cautionary) {
            strs.push(`${acid}.setAsCautionary();`);
          }
          strs.push(`${grid}.addModifier(${acid}, ${i})`);
        }
      }
      if (g.tickCount() >= 4096) {
        toBeam = false;
      }
      grGroup.push(grid);
    });
    const ggid = 'ggrp' + smoNote.attrs.id;
    const grString = '[' + grGroup.join(',') + ']';
    strs.push(`const ${ggid} = new VF.GraceNoteGroup(${grString});`);
    if (toBeam) {
      strs.push(`${ggid}.beamNotes();`);
    }
    strs.push(`${smoNote.attrs.id}.addModifier(${ggid}, 0);`);
  }
}
function smoNoteToStaveNote(smoNote: SmoNote) {
  // const duration =
  //   smoNote.isTuplet ?
  //     SmoMusic.closestVexDuration(smoNote.tickCount) :
  //     SmoMusic.ticksToDuration[smoNote.tickCount];

  const duration = SmoMusic.ticksToDuration[smoNote.stemTicks];
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
export const getVoiceId = (smoMeasure:SmoMeasure, voiceIx: number) => {
  return smoMeasure.attrs.id + 'v' + voiceIx.toString();
}
function lastNoteInSystem(smoScore: SmoScore, selection: SmoSelection) {
    let rv = selection;
    let next: SmoSelection | null = null;
    next = SmoSelection.nextNoteSelection(smoScore, selection.selector.staff,
      selection.selector.measure, selection.selector.voice, selection.selector.tick);
    while (next) {
      if (next.measure.svg.rowInSystem !== selection.measure.svg.rowInSystem) {
        return rv;
        break;
      }
      rv = next;
      next = SmoSelection.nextNoteSelection(smoScore, next.selector.staff,
        next.selector.measure, next.selector.voice, next.selector.tick);
    }
    return rv;
}
function createMeasureModifiers(smoMeasure: SmoMeasure, strs: string[]) {
  const sb = smoMeasure.getStartBarline();
  const eb = smoMeasure.getEndBarline();
  const sym = smoMeasure.getRepeatSymbol();
  const vxStave = 'stave' + smoMeasure.attrs.id;
  if (smoMeasure.measureNumber.systemIndex !== 0 && sb.barline === SmoBarline.barlines.singleBar
    && smoMeasure.format.padLeft === 0) {
      strs.push(`${vxStave}.setBegBarType(VF.Barline.type.NONE);`);
  } else {
    strs.push(`${vxStave}.setBegBarType(${toVexBarlineType(sb)});`);
  }
  if (smoMeasure.svg.multimeasureLength > 0 && !smoMeasure.svg.hideMultimeasure) {
    const bl = vexBarlineType[smoMeasure.svg.multimeasureEndBarline];
    strs.push(`${vxStave}.setEndBarType(${bl});`);
  } else if (eb.barline !== SmoBarline.barlines.singleBar) {
    const bl = toVexBarlineType(eb);
    strs.push(`${vxStave}.setEndBarType(${bl});`);
  }
  if (smoMeasure.svg.rowInSystem === 0) {
    const rmb = smoMeasure.getRehearsalMark();
    const rm = rmb as SmoRehearsalMark;
    if (rm) {
      strs.push(`${vxStave}.setSection('${rm.symbol}', 0);`);
    }
  }
  const tempo = smoMeasure.getTempo();
  if (tempo && smoMeasure.svg.forceTempo) {
    const vexTempo = tempo.toVexTempo();
    const tempoString = JSON.stringify(vexTempo);
    strs.push(`${vxStave}.setTempo(JSON.parse('${tempoString}'), -1 * ${tempo.yOffset});`);
  }
}
export function renderVoltas(smoScore: SmoScore, startMeasure: number, endMeasure: number, strs: string[]) {
  const voltas = smoScore.staves[0].getVoltaMap(startMeasure, endMeasure);
  for (var i = 0; i < voltas.length; ++i) {
    const ending = voltas[i];
    for (var j = ending.startBar; j <= ending.endBar; ++j) {
      const smoMeasure = smoScore.staves[0].measures[j];
      const vtype = toVexVolta(ending, smoMeasure.measureNumber.measureIndex);
      const vx = smoMeasure.staffX + ending.xOffsetStart;
      const vxStave = 'stave' + smoMeasure.attrs.id;
      const endingName = ending.attrs.id + smoMeasure.attrs.id;
      strs.push(`const ${endingName} = new VF.Volta(${vtype}, '${ending.number.toString()}', ${vx}, ${ending.yOffset});`);
      strs.push(`${endingName}.setContext(context).draw(${vxStave}, -1 * ${ending.xOffsetEnd});`);
    }
  }
}
function renderModifier(modifier: StaffModifierBase, startNote: SmoNote | null, endNote: SmoNote | null, strs: string[]) {
  const modifierName = getId();
  const startKey = SmoSelector.getNoteKey(modifier.startSelector);
  const endKey = SmoSelector.getNoteKey(modifier.endSelector);
  strs.push(`// modifier from ${startKey} to ${endKey}`);
  if (modifier.ctor === 'SmoStaffHairpin' && startNote && endNote) {
    const hp = modifier as SmoStaffHairpin;    
    const vxStart = startNote.attrs.id;
    const vxEnd = startNote.attrs.id;
    const hpParams = { first_note: vxStart, last_note: vxEnd };
    strs.push(`const ${modifierName} = new VF.StaveHairpin({ first_note: ${vxStart}, last_note: ${vxEnd},
       firstNote: ${vxStart}, lastNote: ${vxEnd} });`);
    strs.push(`${modifierName}.setRenderOptions({ height: ${hp.height}, y_shift: ${hp.yOffset}, left_shift_px: ${hp.xOffsetLeft},right_shift_px: ${hp.xOffsetRight} });`);
    strs.push(`${modifierName}.setContext(context).setPosition(${hp.position}).draw();`);
  } else if (modifier.ctor === 'SmoSlur') {
    const slur = modifier as SmoSlur;    
    const vxStart = startNote?.attrs?.id ?? 'null';
    const vxEnd = endNote?.attrs?.id ?? 'null'; 
    const svgPoint: SVGPoint[] = JSON.parse(JSON.stringify(slur.controlPoints));
    let slurX = 0;
    if (startNote === null || endNote === null) {
      slurX = -5;
      svgPoint[0].y = 10;
      svgPoint[1].y = 10;
    }
    if (modifier.startSelector.staff === modifier.endSelector.staff) {
      const hpParams = {
        thickness: slur.thickness,
        xShift: slurX,
        yShift: slur.yOffset,
        cps: svgPoint,
        invert: slur.invert,
        position: slur.position,
        positionEnd: slur.position_end
      };
      const paramStrings = JSON.stringify(hpParams);
      strs.push(`const ${modifierName} = new VF.Curve(${vxStart}, ${vxEnd}, JSON.parse('${paramStrings}'));`);
      strs.push(`${modifierName}.setContext(context).draw();`);
    }
  } else if (modifier.ctor === 'SmoTie') {
    const ctie = modifier as SmoTie;
    const vxStart = startNote?.attrs?.id ?? 'null';
    const vxEnd = endNote?.attrs?.id ?? 'null'; 
    // TODO: handle case of overlap
    if (modifier.startSelector.staff === modifier.endSelector.staff) {
      if (ctie.lines.length > 0) {
        // Hack: if a chord changed, the ties may no longer be valid.  We should check
        // this when it changes.
        const fromLines = ctie.lines.map((ll) => ll.from);
        const toLines = ctie.lines.map((ll) => ll.to);
        strs.push(`const ${modifierName} = new VF.StaveTie({ first_note: ${vxStart}, last_note: ${vxEnd}, 
          firstNote: ${vxStart}, lastNote: ${vxEnd}, first_indices: [${fromLines}], last_indices: [${toLines}]});`);
        strs.push(`${modifierName}.setContext(context).draw();`);
      }
    }
  } else if (modifier.ctor === 'SmoStaffTextBracket' && startNote && endNote) {
    const ctext = modifier as SmoStaffTextBracket;
    const vxStart = startNote.attrs.id;
    const vxEnd = endNote.attrs.id;
    if (vxStart  && vxEnd) {
      strs.push(`const ${modifierName} = new VF.TextBracket({ start: ${vxStart}, stop: ${vxEnd}, text: '${ctext.text}', position: ${ctext.position} });`);
      strs.push(`${modifierName}.setLine(${ctext.line}).setContext(context).draw();`);
    }
  }
}
function renderModifiers(smoScore: SmoScore, staff: SmoSystemStaff, 
  startMeasure: number, endMeasure: number, strs: string[]) {
  const modifiers = staff.renderableModifiers.filter((mm) => mm.startSelector.measure >= startMeasure && mm.endSelector.measure <= endMeasure);
  modifiers.forEach((modifier) => {
    const startNote = SmoSelection.noteSelection(smoScore,
      modifier.startSelector.staff, modifier.startSelector.measure, modifier.startSelector.voice, modifier.startSelector.tick);
    const endNote = SmoSelection.noteSelection(smoScore,
      modifier.endSelector.staff, modifier.endSelector.measure, modifier.endSelector.voice, modifier.endSelector.tick);
    // TODO: handle case of multiple line slur/tie
    if (startNote && startNote.note && endNote && endNote.note) {
        if (endNote.measure.svg.lineIndex !== startNote.measure.svg.lineIndex) {
          const endFirst = lastNoteInSystem(smoScore, startNote);
          if (endFirst && endFirst.note) {
            const startLast = SmoSelection.noteSelection(smoScore, endNote.selector.staff,
            endNote.selector.measure, 0, 0);
            if (startLast && startLast.note) {
              renderModifier(modifier, startNote.note, null, strs);
              renderModifier(modifier, null, endNote.note, strs);
            }
        }
      } else {
        renderModifier(modifier, startNote.note, endNote.note, strs);
      }
    }
  });
}
function createStaveNote(renderInfo: VexNoteRenderInfo, key: string, row: number, strs: string[]) {
  const { smoNote, voiceIx, noteIx, tickmapObject, lyricAdj } = { ...renderInfo };
  const id = smoNote.attrs.id;
  const ctorInfo = smoNoteToStaveNote(smoNote);
  const ctorString = JSON.stringify(ctorInfo);
  if (smoNote.noteType === '/') {
    strs.push(`const ${id} = new VF.GlyphNote(new VF.Glyph('repeatBarSlash', 40), { duration: '${ctorInfo.duration}' });`)
  } else {
      strs.push(`const ${id} = new VF.StaveNote(JSON.parse('${ctorString}'))`);
  }
  smoNoteToGraceNotes(smoNote, strs);
  strs.push(`${id}.setAttribute('id', '${id}');`);
  if (smoNote.fillStyle) {
    strs.push(`${id}.setStyle({ fillStyle: '${smoNote.fillStyle}' });`);
  } else if (voiceIx > 0) {
    strs.push(`${id}.setStyle({ fillStyle: "#115511" });`);
  } else if (smoNote.isHidden()) {
    strs.push(`${id}.setStyle({ fillStyle: "#ffffff00" });`);
  }
  if (smoNote.noteType === 'n') {
    smoNote.pitches.forEach((pitch, ix) => {
      const zz = SmoMusic.accidentalDisplay(pitch, key,
        tickmapObject.tickmaps[voiceIx].durationMap[noteIx], tickmapObject.accidentalArray);
      if (zz) {
        const aname = id + ix.toString() + 'acc';
        strs.push(`const ${aname} = new VF.Accidental('${zz.symbol}');`);
        if (zz.courtesy) {
          strs.push(`${aname}.setAsCautionary();`);
        }
        strs.push(`${id}.addModifier(${aname}, ${ix});`);
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
  smoNote.getJazzOrnaments().forEach((ll) => {
    const vexCode = ll.toVex();
    strs.push(`const ${ll.attrs.id} = new VF.Ornament('${vexCode}');`)
    strs.push(`${id}.addModifier(${ll.attrs.id}, 0);`);
  });
  smoNote.getOrnaments().forEach((ll) => {
    const vexCode = vexOrnaments[ll.ornament];
    strs.push(`const ${ll.attrs.id} = new VF.Ornament('${vexCode}');`);
    if (ll.offset === SmoOrnament.offsets.after) {
      strs.push(`${ll.attrs.id}.setDelayed(true);`);
    }
    strs.push(`${id}.addModifier(${ll.attrs.id}, 0);`);
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
          text = text.replace("'","\\'");
          strs.push(`const ${sn} = new VF.Annotation('${text}');`);
          strs.push(`${sn}.setAttribute('id', '${sn}');`);
          const weight = ll.fontInfo.weight ?? 'normal';
          strs.push(`${sn}.setFont('${ll.fontInfo.family}', ${ll.fontInfo.size}, '${weight}');`)
          strs.push(`${sn}.setVerticalJustification(VF.Annotation.VerticalJustify.BOTTOM);`);
          strs.push(`${id}.addModifier(${sn});`);
          if (ll.adjY > 0) {
            const adjy = Math.round(ll.adjY);
            lyricAdj.push(`context.svg.getElementById('vf-${sn}').setAttributeNS('', 'transform', 'translate(0 ${adjy})');`);
          }
          if (ll.isHyphenated()) {
            classString += ' lyric-hyphen';
          }
          strs.push(`${sn}.addClass('${classString}');`);
        }
      }
    });
  }
  const chords = smoNote.getChords();
  chords.forEach((chord) => {
    strs.push(`const ${chord.attrs.id} = new VF.ChordSymbol();`);
    strs.push(`${chord.attrs.id}.setAttribute('id', '${chord.attrs.id}');`);
    const vblocks = getVexChordBlocks(chord);
    vblocks.forEach((vblock) => {
      const glyphParams = JSON.stringify(vblock);
      if (vblock.glyph) {
        strs.push(`${chord.attrs.id}.addGlyphOrText('${vblock.glyph}', JSON.parse('${glyphParams}'));`);
      } else {
        const btext = vblock.text ?? '';
        if (btext.trim().length) {
          strs.push(`${chord.attrs.id}.addGlyphOrText('${btext}', JSON.parse('${glyphParams}'));`);
        }
      }
    });
    strs.push(`${chord.attrs.id}.setFont('${chord.fontInfo.family}', ${chord.fontInfo.size}).setReportWidth(${chord.adjustNoteWidth});`);
    strs.push(`${id}.addModifier(${chord.attrs.id}, 0);`);
  });
  return id;
}
function createColumn(groups: Record<string, VexStaveGroupMusic>, strs: string[]) {
  const groupKeys = Object.keys(groups);
  let maxXAdj = 0;
  groupKeys.forEach((groupKey) => {
    const music = groups[groupKey];
    // Need to create beam groups before formatting
    strs.push(`// create beam groups and tuplets for format grp ${groupKey} before formatting`);
    music.measures.forEach((smoMeasure) => {
      maxXAdj = Math.max(maxXAdj, smoMeasure.svg.adjX);
      createBeamGroups(smoMeasure, strs);
      createTuplets(smoMeasure, strs);
    });
    strs.push(' ');
    strs.push(`// formatting measures in staff group ${groupKey}`);
    // set x offset for alignment before format
    music.measures.forEach((smoMeasure) => {
      smoMeasure.voices.forEach((vv) => {
        vv.notes.forEach((nn) => {
          const id = nn.attrs.id;
          const offset = maxXAdj - smoMeasure.svg.adjX;
          strs.push(`${id}.setXShift(${offset});`);
        });
      });
    });
    const joinVoiceStr = '[' + music.voiceStrings.join(',') + ']';
    const widthMeasure = music.measures[0];
    const staffWidth = Math.round(widthMeasure.staffWidth -
      (widthMeasure.svg.maxColumnStartX + widthMeasure.svg.adjRight + widthMeasure.format.padLeft) - 10);
    strs.push(`${music.formatter}.format(${joinVoiceStr}, ${staffWidth});`);
    music.measures.forEach((smoMeasure) => {
      createMeasure(smoMeasure, music.heightOffset, strs);
    });
  });
}
function createBeamGroups(smoMeasure: SmoMeasure, strs: string[]) {
  smoMeasure.voices.forEach((voice, voiceIx) => {
    const bgs = smoMeasure.beamGroups.filter((bb) => bb.voice === voiceIx);
    for (var i = 0; i < bgs.length; ++i) {
      const bg = bgs[i];
      let  keyNoteIx = bg.notes.findIndex((nn) => nn.noteType === 'n');
      keyNoteIx = (keyNoteIx >= 0) ? keyNoteIx : 0;
      const sdName = 'dir' + bg.attrs.id;
      strs.push(`const ${sdName} = ${bg.notes[keyNoteIx].attrs.id}.getStemDirection();`);
      const nar: string[] = [];
      for (var j = 0; j < bg.notes.length; ++j) {
        const note = bg.notes[j];
        const vexNote = `${note.attrs.id}`;
        if (note.noteType !== '/') {
          nar.push(vexNote);
        }
        if (note.noteType !== 'n') {
          continue;
        }
        strs.push(`${vexNote}.setStemDirection(${sdName});`);
      }
      const narString = '[' + nar.join(',') + ']';
      strs.push(`const ${bg.attrs.id} = new VF.Beam(${narString});`);
    }
  });
}
function createTuplets(smoMeasure: SmoMeasure, strs: string[]) {
  smoMeasure.voices.forEach((voice, voiceIx) => {
    const tps = smoMeasure.tupletTrees.filter((tp) => tp.voice === voiceIx);
    for (var i = 0; i < tps.length; ++i) {
      const tp = tps[i];
      const nar: string[] = [];
      for ( let note of smoMeasure.tupletNotes(tp)) {
        const vexNote = `${note.attrs.id}`;
        nar.push(vexNote);
      }
      const direction = smoMeasure.getStemDirectionForTuplet(tp) === SmoNote.flagStates.up ?
          VF.Tuplet.LOCATION_TOP : VF.Tuplet.LOCATION_BOTTOM;
      const tpParams: TupletOptions = {
          num_notes: tp.numNotes,
          notes_occupied: tp.notesOccupied,
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
function createMeasure(smoMeasure: SmoMeasure, heightOffset: number, strs: string[]) {
  const ssid = 'stave' + smoMeasure.attrs.id;
  const staffY = smoMeasure.svg.staffY + heightOffset;
  const staffWidth = Math.round(smoMeasure.svg.staffWidth);
  strs.push(`const ${ssid} = new VF.Stave(${smoMeasure.svg.staffX}, ${staffY}, ${staffWidth});`);
  strs.push(`${ssid}.setAttribute('id', '${ssid}');`);
  createMeasureModifiers(smoMeasure, strs);
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
    } else if (smoMeasure.timeSignature.displayString.length) {
      tsString = smoMeasure.timeSignature.displayString;
    }
    strs.push(`${ssid}.addTimeSignature('${tsString}');`);
  }
  if (smoMeasure.svg.forceKeySignature) {
    const key = SmoMusic.vexKeySignatureTranspose(smoMeasure.keySignature, 0);
    const ksid = 'key' + smoMeasure.attrs.id;
    strs.push(`const ${ksid} = new VF.KeySignature('${key}');`);
    if (smoMeasure.canceledKeySignature) {
      const canceledKey = SmoMusic.vexKeySignatureTranspose(smoMeasure.canceledKeySignature, 0);
      strs.push(`${ksid}.cancelKey('${canceledKey}');`);
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
  smoMeasure.tupletTrees.forEach((tp) => {
    strs.push(`${tp.attrs.id}.setContext(context).draw();`)
  });
}
// ## SmoToVex
// Simple serialize class that produced VEX note and voice objects
// for vex EasyScore (for easier bug reports and test cases)
export class SmoToVex {
  static convert(smoScore: SmoScore, options: any): string {
    let div = 'boo';
    let page = 0;
    options = options ?? {};
    if (typeof(options['div']) === 'string') {
      div = options.div
    }
    if (typeof(options['page']) === 'number') {
      page = options.page;
    }
    let startMeasure = -1;
    let endMeasure = -1;
    const strs: string[] = [];
    const pageHeight = smoScore.layoutManager?.getGlobalLayout().pageHeight ?? 1056;
    const pageWidth = smoScore.layoutManager?.getGlobalLayout().pageWidth ?? 816;
    const pageLength = smoScore.staves[0].measures[smoScore.staves[0].measures.length - 1].svg.pageIndex + 1;
    let scoreName = smoScore.scoreInfo.title + ' p ' + (page + 1).toString() + '/' + pageLength.toString();
    const scoreSub = smoScore.scoreInfo.subTitle?.length ? `(${smoScore.scoreInfo.subTitle})` : '';
    scoreName = `${scoreName} ${scoreSub} by ${smoScore.scoreInfo.composer}`;
    strs.push(`// @@ ${scoreName}`);
    strs.push('function main() {');
    strs.push('// create the div and svg element for the music');
    strs.push(`const div = document.getElementById('${div}');`);
    strs.push('const VF = Vex.Flow;');
    strs.push(`const renderer = new VF.Renderer(div, VF.Renderer.Backends.SVG);`);
    const zoomScale = (smoScore.layoutManager?.getZoomScale() ?? 1.0);
    const svgScale = (smoScore.layoutManager?.getGlobalLayout().svgScale ?? 1.0);
    const width = zoomScale * pageWidth;
    const height = zoomScale * pageHeight;
    const scale = svgScale * zoomScale;
    const heightOffset = -1 * (height * page) / scale;
    const vbWidth = Math.round(width / scale);
    const vbHeight = Math.round(height / scale);
    strs.push('const context = renderer.getContext();');
    strs.push('const svg = context.svg');
    strs.push(`svg.setAttributeNS('', 'width', '${width}');`);
    strs.push(`svg.setAttributeNS('', 'height', '${height}');`);
    strs.push(`svg.setAttributeNS('', 'viewBox', '0 0 ${vbWidth} ${vbHeight}');`);
    strs.push('//');
    strs.push('// create the musical objects');
    const font = smoScore.fonts.find((x) => x.purpose === SmoScore.fontPurposes.ENGRAVING);
    if (font) {
      const fs = fontStacks[font.family].join(',');
      strs.push(`VF.setMusicFont(${fs});`);
    }
    const measureCount = smoScore.staves[0].measures.length;
    const lyricAdj: string[] = [];
    for (var k = 0; k < measureCount; ++k) {
      const groupMap: Record<string, VexStaveGroupMusic> = {};
      if (smoScore.staves[0].measures[k].svg.pageIndex < page) {
        continue;
      }
      if (smoScore.staves[0].measures[k].svg.pageIndex > page) {
        break;
      }
      startMeasure = startMeasure < 0 ? k : startMeasure;
      endMeasure = Math.max(k, endMeasure);
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
            heightOffset,
            voiceStrings: [],
            systemGroup
          }
        }
        groupMap[justifyGroup].measures.push(smoMeasure);
        strs.push('//');
        strs.push(`// voices and notes for stave ${smoStaff.staffId} ${smoMeasure.measureNumber.measureIndex}`);
        smoMeasure.voices.forEach((smoVoice: SmoVoice, voiceIx: number) => {        
          const vn = getVoiceId(smoMeasure, voiceIx);
          groupMap[justifyGroup].voiceStrings.push(vn);
          const vc = vn + 'ar';
          const ts = JSON.stringify({
            numBeats: smoMeasure.timeSignature.actualBeats,
            beatValue: smoMeasure.timeSignature.beatDuration
          });
          strs.push(`const ${vn} = new VF.Voice(JSON.parse('${ts}')).setMode(VF.Voice.Mode.SOFT);`);
          strs.push(`const ${vc} = [];`);
          smoVoice.notes.forEach((smoNote: SmoNote, noteIx: number) => {
            const renderInfo: VexNoteRenderInfo = { smoNote, voiceIx, noteIx, tickmapObject, lyricAdj };
            const noteId = createStaveNote(renderInfo, smoMeasure.keySignature, smoMeasure.svg.rowInSystem, strs);
            strs.push(`${vc}.push(${noteId});`);
          });
          strs.push(`${vn}.addTickables(${vc})`);
          voiceStrings.push(vn);
          strs.push(`${fmtid}.joinVoices([${vn}]);`);
        });
        if (smoMeasure.svg.rowInSystem === smoScore.staves.length - 1) {
          createColumn(groupMap, strs);
          const mapKeys = Object.keys(groupMap);
          mapKeys.forEach((mapKey) => {
            const tmpGroup = groupMap[mapKey];
            if (tmpGroup.systemGroup) {
              const systemIndex = smoMeasure.measureNumber.systemIndex;
              const startMeasure = 'stave' + smoScore.staves[tmpGroup.systemGroup.startSelector.staff].measures[k].attrs.id;
              const endMeasure = 'stave' + smoScore.staves[tmpGroup.systemGroup.endSelector.staff].measures[k].attrs.id;
              const leftConnector = leftConnectorVx(tmpGroup.systemGroup);
              const rightConnector = rightConnectorVx(tmpGroup.systemGroup);
              const jgname = justifyGroup + startMeasure + staffIx.toString();
              if (systemIndex === 0 && smoScore.staves.length > 1) {
                strs.push(`const left${jgname} = new VF.StaveConnector(${startMeasure}, ${endMeasure}).setType(${leftConnector});`);
                strs.push(`left${jgname}.setContext(context).draw();`);
              }
              let endStave = false;
              if (smoMeasure.measureNumber.systemIndex !== 0) {
                if (smoMeasure.measureNumber.systemIndex === smoScore.staves[0].measures.length - 1) {
                  endStave = true;
                } else if (smoScore.staves[0].measures.length > k + 1 &&
                  smoScore.staves[0].measures[k + 1].measureNumber.systemIndex === 0) {
                    endStave = true;
                }
              }
              if (endStave) {
                strs.push(`const right${jgname} = new VF.StaveConnector(${startMeasure}, ${endMeasure}).setType(${rightConnector});`);
                strs.push(`right${jgname}.setContext(context).draw();`);
              }    
            }
          });
        }
      });
    }
    smoScore.staves.forEach((staff) => {
      renderModifiers(smoScore, staff, startMeasure, endMeasure, strs);
    });
    renderVoltas(smoScore, startMeasure, endMeasure, strs);
    if (lyricAdj.length) {
      strs.push('// ');
      strs.push('// Align lyrics on different measures, once they are rendered.');
    }
    const render = strs.concat(lyricAdj);
    render.push('}');
    return render.join(`\n`);
    // console.log(render.join(`\n`));
  }
}