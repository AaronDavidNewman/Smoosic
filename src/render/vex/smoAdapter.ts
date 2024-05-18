import { SmoSystemGroup } from '../../smo/data/scoreModifiers';
import { SmoBarline, SmoMeasureText, SmoRepeatSymbol, SmoVolta } from '../../smo/data/measureModifiers';
import { SmoTabStave, SmoTie } from '../../smo/data/staffModifiers';
import { SmoLyric, VexAnnotationParams, SmoTabNote, SmoFretPosition } from '../../smo/data/noteModifiers';
import { SmoNote } from '../../smo/data/note';
import { TabNotePosition, VexFlow } from '../../common/vex';
const VF = VexFlow;
/**
 * convert from Smo library values to Vex values
 * @module
 * 
 **/
export function VexTabNotePositions(stave: SmoTabStave, tabNote: SmoTabNote, smoNote: SmoNote): TabNotePosition[] {
  const numLines = stave.numLines;
  const rv = tabNote.positions.map((pp) => { 
    const fret = smoNote.isRest() ? 'r' : pp.fret;
    return { str: (numLines + 1) - pp.string, fret }
  });
  return rv;
}
/**
 *
 *
 * @export
 * @param {SmoSystemGroup} athis
 * @return {*} 
 */
export function  leftConnectorVx(athis: SmoSystemGroup) {
  switch (athis.leftConnector) {
    case SmoSystemGroup.connectorTypes.single:
      return VF.StaveConnector.type.SINGLE_LEFT;
    case SmoSystemGroup.connectorTypes.double:
      return VF.StaveConnector.type.DOUBLE_LEFT;
    case SmoSystemGroup.connectorTypes.brace:
      return VF.StaveConnector.type.BRACE;
    case SmoSystemGroup.connectorTypes.bracket:
    default:
      return VF.StaveConnector.type.BRACKET;
  }
}
/**
 * convert from a SmoSystemGroup connector to Vex enumeration
 * @param athis 
 * @returns 
 */
export function rightConnectorVx(athis: SmoSystemGroup) {
  switch (athis.rightConnector) {
    case SmoSystemGroup.connectorTypes.single:
      return VF.StaveConnector.type.SINGLE_RIGHT;
    case SmoSystemGroup.connectorTypes.double:
    default:
      return VF.StaveConnector.type.DOUBLE_RIGHT;
  }
}
export const vexBarlineType = [VF.Barline.type.SINGLE, VF.Barline.type.DOUBLE, VF.Barline.type.END,
    VF.Barline.type.REPEAT_BEGIN, VF.Barline.type.REPEAT_END, VF.Barline.type.NONE];

export const vexBarlinePosition = [ VF.StaveModifierPosition.BEGIN, VF.StaveModifierPosition.END ];

export function toVexBarlineType(athis: SmoBarline): number {
  return vexBarlineType[athis.barline];
}
export function toVexBarlinePosition(athis: SmoBarline): number {
  return vexBarlinePosition[athis.position];
}

export const vexSymbol = [VF.Repetition.type.NONE, VF.Repetition.type.CODA_LEFT, VF.Repetition.type.SEGNO_LEFT, VF.Repetition.type.DC,
  VF.Repetition.type.DC_AL_CODA, VF.Repetition.type.DC_AL_FINE, VF.Repetition.type.DS,
  VF.Repetition.type.DS_AL_CODA, VF.Repetition.type.DS_AL_FINE, VF.Repetition.type.FINE];

export function toVexSymbol(athis: SmoRepeatSymbol) {
    return vexSymbol[athis.symbol];
}
export function toVexVolta(volta: SmoVolta, measureNumber: number) {
  if (volta.startBar === measureNumber && volta.startBar === volta.endBar) {
    return VF.Volta.type.BEGIN_END;
  }
  if (volta.startBar === measureNumber) {
    return VF.Volta.type.BEGIN;
  }
  if (volta.endBar === measureNumber) {
    return VF.Volta.type.END;
  }
  if (volta.startBar < measureNumber && volta.endBar > measureNumber) {
    return VF.Volta.type.MID;
  }
  return VF.Volta.type.NONE;
}

export const vexTextPosition = [VF.Modifier.Position.ABOVE, VF.Modifier.Position.BELOW, VF.Modifier.Position.LEFT, VF.Modifier.Position.RIGHT];
export const vexTextJustification = [VF.TextJustification.LEFT, VF.TextJustification.RIGHT, VF.TextJustification.CENTER];

export function toVexTextJustification(athis: SmoMeasureText) {
  return vexTextJustification[athis.justification];
}
export function toVexTextPosition(athis: SmoMeasureText) {
  return vexTextPosition[parseInt(athis.position as any, 10)];
}

export function vexOptions(athis: SmoTie) {
  const rv: any = {};
  rv.direction = athis.invert ? VF.Stem.DOWN : VF.Stem.UP;
  SmoTie.vexParameters.forEach((p) => {
    rv[p] = (athis as any)[p];
  });
  return rv;
}
export function vexAnnotationPosition(chordPos: number) {
  if (chordPos === SmoLyric.symbolPosition.NORMAL) {
    return VF.ChordSymbol.symbolModifiers.NONE;
  } else if (chordPos === SmoLyric.symbolPosition.SUPERSCRIPT) {
    return VF.ChordSymbol.symbolModifiers.SUPERSCRIPT;
  }
  return VF.ChordSymbol.symbolModifiers.SUBSCRIPT;
}

/**
 * Parse the SmoLyric text and convert it to a VEX chord symbol
 * @param athis 
 * @returns 
 */
export function  getVexChordBlocks(athis: SmoLyric) {
  let mod = VF.ChordSymbol.symbolModifiers.NONE;
  let isGlyph = false;
  const tokens = SmoLyric._tokenizeChordString(athis.text);
  const blocks: VexAnnotationParams[] = [];
  tokens.forEach((token) => {
    if (token === '^') {
      mod = (mod === VF.ChordSymbol.symbolModifiers.SUPERSCRIPT) ?
        VF.ChordSymbol.symbolModifiers.NONE : VF.ChordSymbol.symbolModifiers.SUPERSCRIPT;
    } else if (token === '%') {
      mod = (mod === VF.ChordSymbol.symbolModifiers.SUBSCRIPT) ?
        VF.ChordSymbol.symbolModifiers.NONE : VF.ChordSymbol.symbolModifiers.SUBSCRIPT;
    } else if (token === '@') {
      isGlyph = !isGlyph;
    } else if (token.length) {
      if (isGlyph) {
        const glyph = SmoLyric._chordGlyphFromCode(token);
        blocks.push({
          glyph, symbolModifier: mod
        });
      } else {
        blocks.push({
          text: token, symbolModifier: mod
        });
      }
    }
  });
  return blocks;
}

export function toVexStemDirection(note: SmoNote) {
  return (note.flagState === SmoNote.flagStates.up ? VF.Stem.UP : VF.Stem.DOWN);
}