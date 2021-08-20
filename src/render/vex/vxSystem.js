// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { VxMeasure } from './vxMeasure';
import { SmoSelection } from '../../smo/xform/selections';
import { svgHelpers } from '../../common/svgHelpers';
import { SmoLyric } from '../../smo/data/noteModifiers';
import { SmoStaffHairpin, SmoSlur } from '../../smo/data/staffModifiers';

const VF = Vex.Flow;

// ## Description:
//   Create a system of staves and draw music on it.
//
// ##  Options:
//  clef:'treble',
//  num_beats:num_beats,
//  timeSignature: '4/4',
//  smoMeasures: []
export class VxSystem {
  constructor(context, topY, lineIndex, score) {
    this.context = context;
    this.leftConnector = [null, null];
    this.lineIndex = lineIndex;
    this.score = score;
    this.maxStaffIndex = -1;
    this.maxSystemIndex = -1;
    this.width = -1;
    this.smoMeasures = [];
    this.vxMeasures = [];
    this.staves = [];
    this.endcaps = [];
    this.endings = [];
    this.box = {
      x: -1,
      y: -1,
      width: 0,
      height: 0
    };
    this.currentY = 0;
    this.topY = topY;
    this.clefWidth = 70;
    this.ys = [];
    this.measures = [];
    this.modifiers = [];
  }

  getVxMeasure(smoMeasure) {
    let i = 0;
    for (i = 0; i < this.vxMeasures.length; ++i) {
      const vm = this.vxMeasures[i];
      if (vm.smoMeasure.attrs.id === smoMeasure.attrs.id) {
        return vm;
      }
    }

    return null;
  }

  getVxNote(smoNote) {
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

  minMax() {
    const mar = this.staves[0].measures.map((mm) => mm.measureNumber.measureIndex);
    const min = mar.reduce((a, b) => a < b ? a : b);
    const max = mar.reduce((a, b) => a > b ? a : b);
    return { min, max };
  }

  _updateChordOffsets(note) {
    var i = 0;
    for (i = 0; i < 3; ++i) {
      const chords = note.getLyricForVerse(i, SmoLyric.parsers.chord);
      chords.forEach((chord) => {
        const dom = $(this.context.svg).find(chord.selector)[0];
        if (dom) {
          dom.setAttributeNS('', 'transform', 'translate(' + chord.translateX + ' ' + (-1 * chord.translateY) + ')');
        }
      });
    }
  }
  _lowestYLowestVerse(lyrics) {
    let lowVerse = 5;
    let lowestY = 0;
    lyrics.forEach((lyric) => {
      if (lyric.logicalBox && lyric.verse < lowVerse) {
        lowestY = lyric.logicalBox.y;
        lowVerse = lyric.verse;
      }
      if (lyric.verse === lowVerse && lyric.logicalBox && lyric.logicalBox.y > lowestY) {
        lowestY = lyric.logicalBox.y;
      }
    });
    this.vxMeasures.forEach((vxMeasure) => {
      vxMeasure.smoMeasure.voices.forEach((voice) => {
        voice.notes.forEach((note) => {
          const lyrics = note.getTrueLyrics();
          if (lyrics.length) {
            const topVerse = lyrics.reduce((a, b) => a.verse < b.verse ? a : b);
            if (topVerse && topVerse.logicalBox) {
              const offset =  lowestY - topVerse.logicalBox.y;
              lyrics.forEach((lyric) => {
                lyric.adjY = offset + lyric.translateY;
              });
            }
          }
        });
      });
    });
  }

  // ### updateLyricOffsets
  // Adjust the y position for all lyrics in the line so they are even.
  // Also replace '-' with a longer dash do indicate 'until the next measure'
  updateLyricOffsets() {
    let i = 0;
    for (i = 0; i < this.score.staves.length; ++i) {
      const tmpI = i;
      const lyricsDash = [];
      const lyricHyphens = [];
      const lyricVerseMap = {};
      const lyrics = [];
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
            note.getTrueLyrics().forEach((ll) => {
              const hasLyric = ll.getText().length > 0 || ll.isHyphenated();
              if (hasLyric && !lyricVerseMap[ll.verse]) {
                lyricVerseMap[ll.verse] = [];
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
      this._lowestYLowestVerse(lyrics);
      const vkey = Object.keys(lyricVerseMap).sort((a, b) => a - b);
      vkey.forEach((verse) => {
        let hyphenLyric = null;
        const lastVerse = lyricVerseMap[verse][lyricVerseMap[verse].length - 1].attrs.id;
        lyricVerseMap[verse].forEach((ll) => {
          if (hyphenLyric !== null) {
            const x = ll.logicalBox.x - (ll.logicalBox.x -
              (hyphenLyric.logicalBox.x + hyphenLyric.logicalBox.width)) / 2;
            ll.hyphenX = x;
            lyricHyphens.push(ll);
          }
          if (ll.isHyphenated()) {
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
        const dom = $(this.context.svg).find(lyric.selector)[0];
        if (typeof(dom) !== 'undefined') {
          dom.setAttributeNS('', 'transform', 'translate(' + lyric.adjX + ' ' + lyric.adjY + ')');
          // Keep track of lyrics that are 'dash'
          if (lyric.isDash()) {
            lyricsDash.push(lyric);
          }
        }
      });
      lyricHyphens.forEach((lyric) => {
        const parent = $(this.context.svg).find(lyric.selector)[0];
        if (parent) {
          const text = document.createElementNS(svgHelpers.namespace, 'text');
          text.textContent = '-';
          text.setAttributeNS('', 'x', lyric.hyphenX);
          text.setAttributeNS('', 'y', lyric.logicalBox.y + (lyric.logicalBox.height * 2) / 3);
          const fontSize = lyric.fontInfo.size * 1.2;
          text.setAttributeNS('', 'fontSize', '' + fontSize + 'pt');
          parent.appendChild(text);
        }
      });
      lyricsDash.forEach((lyric) => {
        const parent = $(this.context.svg).find(lyric.selector)[0];
        if (parent) {
          const line = document.createElementNS(svgHelpers.namespace, 'line');
          const ymax = Math.round(lyric.logicalBox.y + lyric.logicalBox.height / 2);
          const offset = Math.round(lyric.logicalBox.width / 2);
          line.setAttributeNS('', 'x1', lyric.logicalBox.x - offset);
          line.setAttributeNS('', 'y1', ymax);
          line.setAttributeNS('', 'x2', lyric.logicalBox.x + lyric.logicalBox.width + offset);
          line.setAttributeNS('', 'y2', ymax);
          line.setAttributeNS('', 'stroke-width', 1);
          line.setAttributeNS('', 'fill', 'none');
          line.setAttributeNS('', 'stroke', '#999999');
          parent.appendChild(line);
          const text = $(this.context.svg).find(lyric.selector).find('text')[0];
          text.setAttributeNS('', 'fill', '#fff');
        }
      });
    }
  }

  // ### renderModifier
  // render a line-type modifier that is associated with a staff (e.g. slur)
  renderModifier(scroller, modifier, vxStart, vxEnd, smoStart, smoEnd) {
    let xoffset = 0;
    const setSameIfNull = (a, b) => {
      if (typeof(a) === 'undefined' || a === null) {
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
      $(this.context.svg).find('g.' +  modifier.attrs.id).remove();
    }
    const artifactId = modifier.attrs.id + '-' + this.lineIndex;
    const group = this.context.openGroup();
    group.classList.add(modifier.attrs.id);
    group.classList.add(artifactId);
    if ((modifier.ctor === 'SmoStaffHairpin' && modifier.hairpinType === SmoStaffHairpin.types.CRESCENDO) ||
      (modifier.ctor === 'SmoStaffHairpin' && modifier.hairpinType === SmoStaffHairpin.types.DECRESCENDO)) {
      if (!vxStart && !vxEnd) {
        this.context.closeGroup();
      }
      vxStart = setSameIfNull(vxStart, vxEnd);
      vxEnd = setSameIfNull(vxEnd, vxStart);
      const hairpin = new VF.StaveHairpin({
        first_note: vxStart,
        last_note: vxEnd
      }, modifier.hairpinType);
      hairpin.setRenderOptions({
        height: modifier.height,
        y_shift: modifier.yOffset,
        left_shift_px: modifier.xOffsetLeft,
        right_shift_px: modifier.xOffsetRight
      });
      hairpin.setContext(this.context).setPosition(modifier.position).draw();
    } else if (modifier.ctor === 'SmoSlur') {
      const lyric = smoStart.note.longestLyric();
      if (lyric && lyric.getText()) {
        // If there is a lyric, the bounding box of the start note is stretched to the right.
        // slide the slur left, and also make it a bit wider.
        const xtranslate = (-1 * lyric.getText().length * 6);
        xoffset += (xtranslate / 2) - SmoSlur.defaults.xOffset;
      }
      const curve = new VF.Curve(vxStart, vxEnd,
        {
          thickness: modifier.thickness,
          x_shift: modifier.xOffset,
          y_shift: modifier.yOffset,
          spacing: modifier.spacing,
          cps: modifier.controlPoints,
          invert: modifier.invert,
          position: modifier.position
        });
      curve.setContext(this.context).draw();
    } else if (modifier.ctor === 'SmoTie') {
      if (modifier.lines.length > 0) {
        // Hack: if a chord changed, the ties may no longer be valid.  We should check
        // this when it changes.
        modifier.checkLines(smoStart.note, smoEnd.note);
        const fromLines = modifier.lines.map((ll) => ll.from);
        const toLines = modifier.lines.map((ll) => ll.to);
        const tie = new VF.StaveTie({
          first_note: vxStart,
          last_note: vxEnd,
          first_indices: fromLines,
          last_indices: toLines
        });
        Vex.Merge(tie.render_options, modifier.vexOptions);
        tie.setContext(this.context).draw();
      }
    }

    this.context.closeGroup();
    if (xoffset) {
      const slurBox = $('.' + artifactId)[0];
      svgHelpers.translateElement(slurBox, xoffset, 0);
    }
    modifier.logicalBox = svgHelpers.smoBox(group.getBBox());
    modifier.renderedBox = svgHelpers.logicalToClient(this.context.svg, modifier.logicalBox, scroller.scrollState.scroll);
  }

  renderEndings(scroller) {
    let j = 0;
    let i = 0;
    const minMax = this.minMax();
    const voltas = this.staves[0].getVoltaMap(minMax.min, minMax.max);
    for (j = 0; j < this.smoMeasures.length; ++j) {
      let pushed = false;
      const smoMeasure = this.smoMeasures[j];
      // Only draw volta on top staff of system
      if (smoMeasure.svg.rowInSystem > 0) {
        continue;
      }
      const vxMeasure = this.getVxMeasure(smoMeasure);
      const voAr = [];
      for (i = 0; i < voltas.length; ++i) {
        const ending = voltas[i];
        const mix = smoMeasure.measureNumber.measureIndex;
        if (ending.startBar === mix) {
          $(this.context.svg).find('g.' + ending.attrs.id).remove();
        }
        if ((ending.startBar <= mix) && (ending.endBar >= mix)) {
          const group = this.context.openGroup(null, ending.attrs.id);
          group.classList.add(ending.attrs.id);
          group.classList.add(ending.endingId);
          const vtype = ending.toVexVolta(smoMeasure.measureNumber.measureIndex);
          const vxVolta = new VF.Volta(vtype, ending.number, smoMeasure.staffX + ending.xOffsetStart, ending.yOffset);
          vxVolta.setContext(this.context).draw(vxMeasure.stave, -1 * ending.xOffsetEnd);
          this.context.closeGroup();
          ending.logicalBox = svgHelpers.smoBox(group.getBBox());
          ending.renderedBox = svgHelpers.logicalToClient(this.context.svg, ending.logicalBox, scroller.scrollState.scroll);
          if (!pushed) {
            voAr.push({ smoMeasure, ending });
            pushed = true;
          }
          vxMeasure.stave.modifiers.push(vxVolta);
        }
      }
      // Adjust real height of measure to match volta height
      for (i = 0; i < voAr.length; ++i) {
        const mm = voAr[i].smoMeasure;
        const ending = voAr[i].ending;
        const delta =  mm.logicalBox.y - ending.logicalBox.y;
        if (delta > 0) {
          mm.setBox(svgHelpers.boxPoints(
            mm.logicalBox.x, mm.logicalBox.y - delta, mm.logicalBox.width, mm.logicalBox.height + delta),
          'vxSystem adjust for volta');
        }
      }
    }
  }

  getMeasureByIndex(measureIndex, staffId) {
    let i = 0;
    for (i = 0; i < this.smoMeasures.length; ++i) {
      const mm = this.smoMeasures[i];
      if (measureIndex === mm.measureNumber.measureNumber && staffId === mm.measureNumber.staffId) {
        return mm;
      }
    }
    return null;
  }

  // ## renderMeasure
  // ## Description:
  // Create the graphical (VX) notes and render them on svg.  Also render the tuplets and beam
  // groups
  renderMeasure(smoMeasure, measureMapper, printing) {
    let brackets = false;
    const staff = this.score.staves[smoMeasure.measureNumber.staffId];
    const staffId = staff.staffId;
    const systemIndex = smoMeasure.measureNumber.systemIndex;
    const selection = SmoSelection.measureSelection(this.score, staff.staffId, smoMeasure.measureNumber.measureIndex);
    this.smoMeasures.push(smoMeasure);
    if (this.staves.length <= staffId) {
      this.staves.push(staff);
    }

    const vxMeasure = new VxMeasure(this.context, { selection, printing });

    // create the vex notes, beam groups etc. for the measure
    vxMeasure.preFormat();
    this.vxMeasures.push(vxMeasure);

    const lastStaff = (staffId === this.score.staves.length - 1);
    const smoGroupMap = {};

    // If this is the last staff in the column, render the column with justification
    if (lastStaff) {
      this.vxMeasures.forEach((vv) => {
        if (!vv.rendered) {
          const systemGroup = this.score.getSystemGroupForStaff(vv.selection);
          const justifyGroup = (systemGroup && vv.smoMeasure.getAutoJustify()) ? systemGroup.attrs.id : vv.selection.staff.attrs.id;
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
      this.vxMeasures.forEach((vv) => {
        if (!vv.rendered) {
          vv.render();
          // unit test codes don't have tracker.
          if (measureMapper) {
            const tmpStaff = this.staves.find((ss) => ss.staffId === vv.smoMeasure.measureNumber.staffId);
            measureMapper.mapMeasure(tmpStaff, vv.smoMeasure, printing);
          }
        }
      });
    }

    // Keep track of the y coordinate for the nth staff
    const renderedConnection = {};

    if (systemIndex === 0 && lastStaff) {
      $(this.context.svg).find('g.lineBracket-' + this.lineIndex).remove();
      const group = this.context.openGroup();
      group.classList.add('lineBracket-' + this.lineIndex);
      group.classList.add('lineBracket');
      this.vxMeasures.forEach((vv) => {
        const systemGroup = this.score.getSystemGroupForStaff(vv.selection);
        if (systemGroup && !renderedConnection[systemGroup.attrs.id]) {
          renderedConnection[systemGroup.attrs.id] = 1;
          const startSel = this.vxMeasures[systemGroup.startSelector.staff];
          const endSel = this.vxMeasures[systemGroup.endSelector.staff];
          if (startSel && endSel) {
            const c1 = new VF.StaveConnector(startSel.stave, endSel.stave)
              .setType(systemGroup.leftConnectorVx());
            c1.setContext(this.context).draw();
            brackets = true;
          }
        }
      });

      if (!brackets && this.vxMeasures.length > 1)  {
        const c2 = new VF.StaveConnector(this.vxMeasures[0].stave, this.vxMeasures[this.vxMeasures.length - 1].stave,
          VF.StaveConnector.type.SINGLE_LEFT);
        c2.setContext(this.context).draw();
      }
      this.context.closeGroup();
    } else if (lastStaff && smoMeasure.measureNumber.measureIndex + 1 < staff.measures.length) {
      if (staff.measures[smoMeasure.measureNumber.measureIndex + 1].measureNumber.systemIndex === 0) {
        const endMeasure = vxMeasure;
        const startMeasure = this.vxMeasures.find((vv) => vv.selection.selector.staff === 0 &&
          vv.selection.selector.measure === vxMeasure.selection.selector.measure);
        if (endMeasure && startMeasure) {
          $(this.context.svg).find('g.endBracket-' + this.lineIndex).remove();
          const group = this.context.openGroup();
          group.classList.add('endBracket-' + this.lineIndex);
          group.classList.add('endBracket');
          const c2 = new VF.StaveConnector(startMeasure.stave, endMeasure.stave)
            .setType(VF.StaveConnector.type.SINGLE_RIGHT);
          c2.setContext(this.context).draw();
          this.context.closeGroup();
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
      this.endcaps = [];
      this.endcaps.push(vxMeasure.stave);
      this.maxSystemIndex = smoMeasure.measureNumber.systemIndex;
    } else if (smoMeasure.measureNumber.systemIndex === this.maxSystemIndex) {
      this.endcaps.push(vxMeasure.stave);
    }
    this.measures.push(vxMeasure);
  }
}
