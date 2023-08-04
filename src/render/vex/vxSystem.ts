// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { VxMeasure } from './vxMeasure';
import { SmoSelection } from '../../smo/xform/selections';
import { SvgHelpers } from '../sui/svgHelpers';
import { SmoLyric } from '../../smo/data/noteModifiers';
import { SmoStaffHairpin, SmoSlur, StaffModifierBase, SmoTie, SmoStaffTextBracket } from '../../smo/data/staffModifiers';
import { SmoScore } from '../../smo/data/score';
import { SmoSystemGroup } from '../../smo/data/scoreModifiers';
import { SmoMeasure, SmoVoice } from '../../smo/data/measure';
import { SvgBox } from '../../smo/data/common';
import { SuiScroller } from '../sui/scroller';
import { SmoNote } from '../../smo/data/note';
import { SmoSystemStaff } from '../../smo/data/systemStaff';
import { SmoVolta } from '../../smo/data/measureModifiers';
import { SmoMeasureFormat } from '../../smo/data/measureModifiers';
import { SvgPage } from '../sui/svgPageMap';
import { smoSerialize } from '../../common/serializationHelpers';
declare var $: any;
import { Vex, Voice, Note } from 'vexflow_smoosic';
const VF = Vex.Flow;

export interface VoltaInfo {
  smoMeasure: SmoMeasure,
  ending: SmoVolta
}
export interface SuiSystemGroup {
  firstMeasure: VxMeasure,
  voices: Voice[]
}
/**
 * Create a system of staves and draw music on it.  This calls the Vex measure
 * rendering methods, and also draws all the score and system level stuff like slurs, 
 * text, aligns the lyrics.
 * */
export class VxSystem {
  context: SvgPage;
  leftConnector: any[] = [null, null];
  score: SmoScore;
  vxMeasures: VxMeasure[] = [];
  smoMeasures: SmoMeasure[] = [];
  lineIndex: number;
  maxStaffIndex: number;
  maxSystemIndex: number;
  minMeasureIndex: number = -1;
  maxMeasureIndex: number = 0;
  width: number;
  staves: SmoSystemStaff[] = [];
  box: SvgBox = SvgBox.default;
  currentY: number;
  topY: number;
  clefWidth: number;
  ys: number[] = [];
  measures: VxMeasure[] = [];
  modifiers: any[] = [];
  constructor(context: SvgPage, topY: number, lineIndex: number, score: SmoScore) {
    this.context = context;
    this.lineIndex = lineIndex;
    this.score = score;
    this.maxStaffIndex = -1;
    this.maxSystemIndex = -1;
    this.width = -1;
    this.staves = [];
    this.currentY = 0;
    this.topY = topY;
    this.clefWidth = 70;
    this.ys = [];
  }

  getVxMeasure(smoMeasure: SmoMeasure) {
    let i = 0;
    for (i = 0; i < this.vxMeasures.length; ++i) {
      const vm = this.vxMeasures[i];
      if (vm.smoMeasure.attrs.id === smoMeasure.attrs.id) {
        return vm;
      }
    }

    return null;
  }

  getVxNote(smoNote: SmoNote): Note | null {
    let i = 0;
    if (!smoNote) {
      return null;
    }
    for (i = 0; i < this.measures.length; ++i) {
      const mm = this.measures[i];
      if (mm.noteToVexMap[smoNote.attrs.id]) {
        return mm.noteToVexMap[smoNote.attrs.id];
      }
    }
    return null;
  }

  _updateChordOffsets(note: SmoNote) {
    var i = 0;
    for (i = 0; i < 3; ++i) {
      const chords = note.getLyricForVerse(i, SmoLyric.parsers.chord);
      chords.forEach((bchord) => {
        const chord = bchord as SmoLyric;
        const dom = this.context.svg.getElementById('vf-' + chord.attrs.id);
        if (dom) {
          dom.setAttributeNS('', 'transform', 'translate(' + chord.translateX + ' ' + (-1 * chord.translateY) + ')');
        }
      });
    }
  }
  _lowestYLowestVerse(lyrics: SmoLyric[], vxMeasures: VxMeasure[]) {
    // Move each verse down, according to the lowest lyric on that line/verse,
    // and the accumulation of the verses above it
    // lyrics.forEach((ll) => ll.adjY = 0);
    let maxOffset = 0;
    let calcMaxOffset = 0;
    for (var lowVerse = 0; lowVerse < 4; ++lowVerse) {
      let lowestY = 0;
      maxOffset = calcMaxOffset;
      calcMaxOffset = 0;
      lyrics.forEach((lyric: SmoLyric) => {
        if (lyric.logicalBox && lyric.verse === lowVerse) {
          // 'lowest' Y on screen is Y with largest value...
          lowestY = Math.max(lyric.logicalBox.y, lowestY);
        }
      });
      vxMeasures.forEach((vxMeasure) => {
        vxMeasure.smoMeasure.voices.forEach((voice) => {
          voice.notes.forEach((note) => {
            const noteLyrics = note.getTrueLyrics().filter((ll) => ll.verse >= lowVerse);
            if (noteLyrics.length) {
              const topVerse = noteLyrics.reduce((a, b) => a.verse < b.verse ? a : b);
              if (topVerse && topVerse.logicalBox) {
                const offset = Math.max(0, lowestY - topVerse.logicalBox.y);
                calcMaxOffset = Math.max(calcMaxOffset, offset);
                noteLyrics.forEach((lyric) => {
                  lyric.adjY = offset + lyric.translateY + maxOffset;
                });
              }
            }
          });
        });
      });
    }
  }

  // ### updateLyricOffsets
  // Adjust the y position for all lyrics in the line so they are even.
  // Also replace '-' with a longer dash do indicate 'until the next measure'
  updateLyricOffsets() {
    let i = 0;
    for (i = 0; i < this.score.staves.length; ++i) {
      const tmpI = i;
      const lyricsDash: SmoLyric[] = [];
      const lyricHyphens: SmoLyric[] = [];
      const lyricVerseMap: Record<number, SmoLyric[]> = {};
      const lyrics: SmoLyric[] = [];
      // is this necessary? They should all be from the current line
      const vxMeasures = this.vxMeasures.filter((vx) =>
        vx.smoMeasure.measureNumber.staffId === tmpI
      );

      // All the lyrics on this line
      // The vertical bounds on each line
      vxMeasures.forEach((mm) => {
        var smoMeasure = mm.smoMeasure;

        // Get lyrics from any voice.
        smoMeasure.voices.forEach((voice) => {
          voice.notes.forEach((note) => {
            this._updateChordOffsets(note);
            note.getTrueLyrics().forEach((ll: SmoLyric) => {
              const hasLyric = ll.getText().length > 0 || ll.isHyphenated();
              if (hasLyric && ll.logicalBox && !lyricVerseMap[ll.verse]) {
                lyricVerseMap[ll.verse] = [];
              }else if (hasLyric && !ll.logicalBox) {
                console.warn(
                  `unrendered lyric for note ${note.attrs.id} measure ${smoMeasure.measureNumber.staffId}-${smoMeasure.measureNumber.measureIndex}`);
              }
              if (hasLyric && ll.logicalBox) {
                lyricVerseMap[ll.verse].push(ll);
                lyrics.push(ll);
              }
            });
          });
        });
      });
      // calculate y offset so the lyrics all line up
      this._lowestYLowestVerse(lyrics, vxMeasures);
      const vkey: string[] = Object.keys(lyricVerseMap).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
      vkey.forEach((sverse) => {
        const verse = parseInt(sverse, 10);
        let hyphenLyric: SmoLyric | null = null;
        const lastVerse = lyricVerseMap[verse][lyricVerseMap[verse].length - 1].attrs.id;
        lyricVerseMap[verse].forEach((ll: SmoLyric) => {
          if (hyphenLyric !== null && hyphenLyric.logicalBox !== null && ll.logicalBox !== null) {
            const x = ll.logicalBox.x - (ll.logicalBox.x -
              (hyphenLyric.logicalBox.x + hyphenLyric.logicalBox.width)) / 2;
            ll.hyphenX = x;
            lyricHyphens.push(ll);
          }
          if (ll.isHyphenated() && ll.logicalBox !== null) {
            if (ll.attrs.id === lastVerse) {
              // Last word on the system, place the hyphen after the word
              ll.hyphenX = ll.logicalBox.x + ll.logicalBox.width + ll.fontInfo.size / 2;
              lyricHyphens.push(ll);
            } else if (ll.getText().length) {
              // place the hyphen 1/2 between next word and this one.
              hyphenLyric = ll;
            }
          } else {
            hyphenLyric = null;
          }
        });
      });
      lyrics.forEach((lyric) => {
        const dom = this.context.svg.getElementById('vf-' + lyric.attrs.id) as SVGSVGElement;
        if (dom) {
          dom.setAttributeNS('', 'transform', 'translate(' + lyric.adjX + ' ' + lyric.adjY + ')');
          // Keep track of lyrics that are 'dash'
          if (lyric.isDash()) {
            lyricsDash.push(lyric);
          }
        }
      });
      lyricHyphens.forEach((lyric) => {
        const parent = this.context.svg.getElementById('vf-' + lyric.attrs.id);
        if (parent && lyric.logicalBox !== null) {
          const text = document.createElementNS(SvgHelpers.namespace, 'text');
          text.textContent = '-';
          text.setAttributeNS('', 'x', (lyric.hyphenX - (lyric.fontInfo.size / 2)).toString());
          text.setAttributeNS('', 'y', (lyric.logicalBox.y + (lyric.logicalBox.height * 2) / 3).toString());
          const fontSize = lyric.fontInfo.size;
          text.setAttributeNS('', 'fontSize', '' + fontSize + 'pt');
          parent.appendChild(text);
        }
      });
      lyricsDash.forEach((lyric) => {
        const parent = this.context.svg.getElementById('vf-' + lyric.attrs.id);
        if (parent && lyric.logicalBox !== null) {
          const line = document.createElementNS(SvgHelpers.namespace, 'line');
          const ymax = Math.round(lyric.logicalBox.y + lyric.logicalBox.height / 2);
          const offset = Math.round(lyric.logicalBox.width / 2);
          line.setAttributeNS('', 'x1', (lyric.logicalBox.x - offset).toString());
          line.setAttributeNS('', 'y1', ymax.toString());
          line.setAttributeNS('', 'x2', (lyric.logicalBox.x + lyric.logicalBox.width + offset).toString());
          line.setAttributeNS('', 'y2', ymax.toString());
          line.setAttributeNS('', 'stroke-width', '1');
          line.setAttributeNS('', 'fill', 'none');
          line.setAttributeNS('', 'stroke', '#999999');
          parent.appendChild(line);
          const texts = parent.getElementsByTagName('text');
          // hide hyphen and replace with dash
          if (texts && texts.length) {
            const text = texts[0];
            text.setAttributeNS('', 'fill', '#fff');
          }
        }
      });
    }
  }

  // ### renderModifier
  // render a line-type modifier that is associated with a staff (e.g. slur)
  renderModifier(scroller: SuiScroller, modifier: StaffModifierBase, vxStart: any, vxEnd: any, smoStart: SmoSelection, smoEnd: SmoSelection) {
    let xoffset = 0;
    const setSameIfNull = (a: any, b: any) => {
      if (typeof (a) === 'undefined' || a === null) {
        return b;
      }
      return a;
    };
    if (smoStart && smoStart.note && smoStart.note.noteType === '/') {
      return;
    } if (smoEnd && smoEnd.note && smoEnd.note.noteType === '/') {
      return;
    }
    // if it is split between lines, render one artifact for each line, with a common class for
    // both if it is removed.
    if (vxStart) {
      const toRemove = this.context.svg.getElementById('vf-' + modifier.attrs.id);
      if (toRemove) {
        toRemove.remove();
      }
    }
    const artifactId = modifier.attrs.id + '-' + this.lineIndex;
    const group = this.context.getContext().openGroup('slur', artifactId);
    group.classList.add(modifier.attrs.id);
    const measureMod = 'mod-' + smoStart.selector.staff + '-' + smoStart.selector.measure;
    const staffMod = 'mod-' + smoStart.selector.staff;
    group.classList.add(measureMod);
    group.classList.add(staffMod);
    if (modifier.ctor === 'SmoStaffHairpin') {
      const hp = modifier as SmoStaffHairpin;
      if (!vxStart && !vxEnd) {
        this.context.getContext().closeGroup();
      }
      vxStart = setSameIfNull(vxStart, vxEnd);
      vxEnd = setSameIfNull(vxEnd, vxStart);
      const hairpin = new VF.StaveHairpin({
        first_note: vxStart,
        last_note: vxEnd
      }, hp.hairpinType);
      hairpin.setRenderOptions({
        height: hp.height,
        y_shift: hp.yOffset,
        left_shift_px: hp.xOffsetLeft,
        right_shift_px: hp.xOffsetRight
      });
      hairpin.setContext(this.context.getContext()).setPosition(hp.position).draw();
    } else if (modifier.ctor === 'SmoSlur') {
      const startNote: SmoNote = smoStart!.note as SmoNote;
      const slur = modifier as SmoSlur;
      let slurX = slur.xOffset;
      const svgPoint: SVGPoint[] = JSON.parse(JSON.stringify(slur.controlPoints));
      const lyric = startNote.longestLyric() as SmoLyric;
      if (lyric && lyric.getText()) {
        // If there is a lyric, the bounding box of the start note is stretched to the right.
        // slide the slur left, and also make it a bit wider.
        const xtranslate = (-1 * lyric.getText().length * 6);
        xoffset += (xtranslate / 2) - SmoSlur.defaults.xOffset;
      }
      if (vxStart === null || vxEnd === null) {
        slurX = -5;
        svgPoint[0].y = 10;
        svgPoint[1].y = 10;
      }
      const curve = new VF.Curve(vxStart, vxEnd,
        {
          thickness: slur.thickness,
          x_shift: slurX,
          y_shift: slur.yOffset,
          cps: svgPoint,
          invert: slur.invert,
          position: slur.position,
          position_end: slur.position_end
        });
      curve.setContext(this.context.getContext()).draw();
    } else if (modifier.ctor === 'SmoTie') {
      const ctie = modifier as SmoTie;
      const startNote: SmoNote = smoStart!.note as SmoNote;
      const endNote: SmoNote = smoEnd!.note as SmoNote;
      if (ctie.lines.length > 0) {
        // Hack: if a chord changed, the ties may no longer be valid.  We should check
        // this when it changes.
        ctie.checkLines(startNote, endNote);
        const fromLines = ctie.lines.map((ll) => ll.from);
        const toLines = ctie.lines.map((ll) => ll.to);
        const tie = new VF.StaveTie({
          first_note: vxStart,
          last_note: vxEnd,
          first_indices: fromLines,
          last_indices: toLines          
        });
        smoSerialize.vexMerge(tie.render_options, ctie.vexOptions);
        tie.setContext(this.context.getContext()).draw();
      }
    } else if (modifier.ctor === 'SmoStaffTextBracket') {
      if (vxStart && !vxEnd) {
        vxEnd = vxStart;
      } else if (vxEnd && !vxStart) {
        vxStart = vxEnd;
      }
      if (vxStart  && vxEnd) {
        const smoBracket = (modifier as SmoStaffTextBracket);
        const bracket = new VF.TextBracket({
          start: vxStart, stop: vxEnd, text: smoBracket.text, superscript: smoBracket.superscript, position: smoBracket.position
        });
        bracket.setLine(smoBracket.line).setContext(this.context.getContext()).draw();
      }
    }

    this.context.getContext().closeGroup();
    if (xoffset) {
      const slurBox = this.context.svg.getElementById('vf-' + artifactId) as SVGSVGElement;
      if (slurBox) {
        SvgHelpers.translateElement(slurBox, xoffset, 0);
      }
    }
    modifier.element = group;
  }

  renderEndings(scroller: SuiScroller) {
    let j = 0;
    let i = 0;
    if (this.staves.length < 1) {
      return;
    }
    const voltas = this.staves[0].getVoltaMap(this.minMeasureIndex, this.maxMeasureIndex);
    voltas.forEach((ending) => {
      ending.elements.forEach((element) => {
        element.remove();
      });
      ending.elements = [];
    });
    for (j = 0; j < this.smoMeasures.length; ++j) {
      let pushed = false;
      const smoMeasure = this.smoMeasures[j];
      // Only draw volta on top staff of system
      if (smoMeasure.svg.rowInSystem > 0) {
        continue;
      }
      const vxMeasure = this.getVxMeasure(smoMeasure);
      const voAr: VoltaInfo[] = [];
      for (i = 0; i < voltas.length && vxMeasure !== null; ++i) {
        const ending = voltas[i];
        const mix = smoMeasure.measureNumber.measureIndex;
        if ((ending.startBar <= mix) && (ending.endBar >= mix) && vxMeasure.stave !== null) {
          const group = this.context.getContext().openGroup(null, ending.attrs.id);
          group.classList.add(ending.attrs.id);
          group.classList.add(ending.endingId);
          ending.elements.push(group);
          const vtype = ending.toVexVolta(smoMeasure.measureNumber.measureIndex);
          const vxVolta = new VF.Volta(vtype, ending.number.toString(), smoMeasure.staffX + ending.xOffsetStart, ending.yOffset);
          vxVolta.setContext(this.context.getContext()).draw(vxMeasure.stave, -1 * ending.xOffsetEnd);
          this.context.getContext().closeGroup();
          // ending.logicalBox = this.context.offsetBbox(group);
          if (!pushed) {
            voAr.push({ smoMeasure, ending });
            pushed = true;
          }
          vxMeasure.stave.getModifiers().push(vxVolta);
        }
      }
      // Adjust real height of measure to match volta height
      for (i = 0; i < voAr.length; ++i) {
        const mm = voAr[i].smoMeasure;
        const ending = voAr[i].ending;
        if (ending.logicalBox !== null) {
          const delta = mm.svg.logicalBox.y - ending.logicalBox.y;
          if (delta > 0) {
            mm.setBox(SvgHelpers.boxPoints(
              mm.svg.logicalBox.x, mm.svg.logicalBox.y - delta, mm.svg.logicalBox.width, mm.svg.logicalBox.height + delta),
              'vxSystem adjust for volta');
          }
        }
      }
    }
  }

  getMeasureByIndex(measureIndex: number, staffId: number) {
    let i = 0;
    for (i = 0; i < this.smoMeasures.length; ++i) {
      const mm = this.smoMeasures[i];
      if (measureIndex === mm.measureNumber.measureIndex && staffId === mm.measureNumber.staffId) {
        return mm;
      }
    }
    return null;
  }

  // ## renderMeasure
  // ## Description:
  // Create the graphical (VX) notes and render them on svg.  Also render the tuplets and beam
  // groups
  renderMeasure(smoMeasure: SmoMeasure, printing: boolean) {
    if (smoMeasure.svg.hideMultimeasure) {
      return;
    }
    const measureIndex = smoMeasure.measureNumber.measureIndex;
    if (this.minMeasureIndex < 0 || this.minMeasureIndex > measureIndex) {
      this.minMeasureIndex = measureIndex;
    }
    if (this.maxMeasureIndex < measureIndex) {
      this.maxMeasureIndex = measureIndex;
    }
    let brackets = false;
    const staff = this.score.staves[smoMeasure.measureNumber.staffId];
    const staffId = staff.staffId;
    const systemIndex = smoMeasure.measureNumber.systemIndex;
    const selection = SmoSelection.measureSelection(this.score, staff.staffId, smoMeasure.measureNumber.measureIndex);
    this.smoMeasures.push(smoMeasure);
    if (this.staves.length <= staffId) {
      this.staves.push(staff);
    }
    if (selection === null) {
      return;
    }
    let softmax = selection.measure.format.proportionality;
    if (softmax === SmoMeasureFormat.defaultProportionality) {
      softmax = this.score.layoutManager?.getGlobalLayout().proportionality ?? 0;
    }
    const vxMeasure: VxMeasure = new VxMeasure(this.context, selection, printing, softmax);

    // create the vex notes, beam groups etc. for the measure
    vxMeasure.preFormat();
    this.vxMeasures.push(vxMeasure);

    const lastStaff = (staffId === this.score.staves.length - 1);
    const smoGroupMap: Record<string, SuiSystemGroup> = {};
    const adjXMap: Record<number, number> = {};
    const vxMeasures = this.vxMeasures.filter((mm) => !mm.smoMeasure.svg.hideEmptyMeasure);
    // If this is the last staff in the column, render the column with justification
    if (lastStaff) {
      vxMeasures.forEach((mm) => {
        if (typeof(adjXMap[mm.smoMeasure.measureNumber.systemIndex]) === 'undefined') {
          adjXMap[mm.smoMeasure.measureNumber.systemIndex] = mm.smoMeasure.svg.adjX;
        }
        adjXMap[mm.smoMeasure.measureNumber.systemIndex] = Math.max(adjXMap[mm.smoMeasure.measureNumber.systemIndex], mm.smoMeasure.svg.adjX);
      });
      vxMeasures.forEach((vv: VxMeasure) => {
        if (!vv.rendered && !vv.smoMeasure.svg.hideEmptyMeasure) {
          vv.vexNotes.forEach((vnote) => {
            vnote.setXShift(vnote.getXShift() + adjXMap[vv.smoMeasure.measureNumber.systemIndex] - vv.smoMeasure.svg.adjX);
          });
          const systemGroup = this.score.getSystemGroupForStaff(vv.selection);
          const justifyGroup: string = (systemGroup && vv.smoMeasure.format.autoJustify) ? systemGroup.attrs.id : vv.selection.staff.attrs.id;
          if (!smoGroupMap[justifyGroup]) {
            smoGroupMap[justifyGroup] = { firstMeasure: vv, voices: [] };
          }
          smoGroupMap[justifyGroup].voices =
            smoGroupMap[justifyGroup].voices.concat(vv.voiceAr);
        }
      });
    }
    const keys = Object.keys(smoGroupMap);
    keys.forEach((key) => {
      smoGroupMap[key].firstMeasure.format(smoGroupMap[key].voices);
    });
    if (lastStaff) {
      vxMeasures.forEach((vv) => {
        if (!vv.rendered) {
          vv.render();
        }
      });
    }
    // Keep track of the y coordinate for the nth staff
    const renderedConnection: Record<string, number> = {};

    if (systemIndex === 0 && lastStaff) {
      if (staff.bracketMap[this.lineIndex]) {
        staff.bracketMap[this.lineIndex].forEach((element) => {
          element.remove();
        });
      }
      staff.bracketMap[this.lineIndex] = [];
      const group = this.context.getContext().openGroup();
      group.classList.add('lineBracket-' + this.lineIndex);
      group.classList.add('lineBracket');
      staff.bracketMap[this.lineIndex].push(group);
      vxMeasures.forEach((vv) => {
        const systemGroup = this.score.getSystemGroupForStaff(vv.selection);
        if (systemGroup && !renderedConnection[systemGroup.attrs.id] && 
          !vv.smoMeasure.svg.hideEmptyMeasure) {
          renderedConnection[systemGroup.attrs.id] = 1;
          const startSel = this.vxMeasures[systemGroup.startSelector.staff];
          const endSel = this.vxMeasures[systemGroup.endSelector.staff];
          if (startSel && startSel.rendered && 
             endSel && endSel.rendered) {
            const c1 = new VF.StaveConnector(startSel.stave!, endSel.stave!)
              .setType(systemGroup.leftConnectorVx());
            c1.setContext(this.context.getContext()).draw();
            brackets = true;
          }
        }
      });
      if (!brackets && vxMeasures.length > 1) {
        const c2 = new VF.StaveConnector(vxMeasures[0].stave!, vxMeasures[vxMeasures.length - 1].stave!);
        c2.setType(VF.StaveConnector.type.SINGLE_RIGHT);
        c2.setContext(this.context.getContext()).draw();
      }
        // draw outer brace on parts with multiple staves (e.g. keyboards)
      vxMeasures.forEach((vv) => {
        if (vv.selection.staff.partInfo.stavesAfter > 0) {
          if (this.vxMeasures.length > vv.selection.selector.staff + 1) {
            const endSel = this.vxMeasures[vv.selection.selector.staff + 1];
            const startSel = vv;
            if (startSel && startSel.rendered && 
              endSel && endSel.rendered) {
                const c1 = new VF.StaveConnector(startSel.stave!, endSel.stave!)
                .setType(VF.StaveConnector.type.BRACE);
              c1.setContext(this.context.getContext()).draw();                
            }
          }
        };
      });
      this.context.getContext().closeGroup();
    } else if (lastStaff && smoMeasure.measureNumber.measureIndex + 1 < staff.measures.length) {
      if (staff.measures[smoMeasure.measureNumber.measureIndex + 1].measureNumber.systemIndex === 0) {
        const endMeasure = vxMeasure;
        const startMeasure = vxMeasures.find((vv) => vv.selection.selector.staff === 0 &&
          vv.selection.selector.measure === vxMeasure.selection.selector.measure && 
          vv.smoMeasure.svg.hideEmptyMeasure === false);
        if (endMeasure && endMeasure.stave && startMeasure && startMeasure.stave) {
          const group = this.context.getContext().openGroup();
          group.classList.add('endBracket-' + this.lineIndex);
          group.classList.add('endBracket');
          staff.bracketMap[this.lineIndex].push(group);
          const c2 = new VF.StaveConnector(startMeasure.stave, endMeasure.stave)
            .setType(VF.StaveConnector.type.SINGLE_RIGHT);
          c2.setContext(this.context.getContext()).draw();
          this.context.getContext().closeGroup();
        }
      }
    }
    


    // keep track of left-hand side for system connectors
    if (systemIndex === 0) {
      if (staffId === 0) {
        this.leftConnector[0] = vxMeasure.stave;
      } else if (staffId > this.maxStaffIndex) {
        this.maxStaffIndex = staffId;
        this.leftConnector[1] = vxMeasure.stave;
      }
    } else if (smoMeasure.measureNumber.systemIndex > this.maxSystemIndex) {
      this.maxSystemIndex = smoMeasure.measureNumber.systemIndex;
    }
    this.measures.push(vxMeasure);
  }
}
