import { SmoSelector, SmoSelection } from '../../smo/xform/selections';
import { SuiScoreView } from '../sui/scoreView';
import { SvgHelpers } from '../sui/svgHelpers';
import { SmoMeasure } from '../../smo/data/measure';
import { layoutDebug } from '../sui/layoutDebug';

/**
 * A generic function that can be sent used to animate playback
 */
export type AudioAnimationHandler = (view: SuiScoreView, selector: SmoSelector, offsetPct: number, durationPct: number) => void;
/**
 * A generic function that can be sent used to clean up playback animation
 */
export type ClearAudioAnimationHandler = (delay: number) => void;

/**
 * Allow users to specify their own music playback animations.
 * @category SuiAudio
*/
export interface SuiAudioAnimationParams {
  audioAnimationHandler: AudioAnimationHandler,
  clearAudioAnimationHandler: ClearAudioAnimationHandler
}
export const  defaultClearAudioAnimationHandler = (delay: number) => {
  if (delay < 1) {
    const ell = document.getElementById('vf-music-cursor');
    if (ell) {
      ell.remove();
    }
  } else {
    setTimeout(() => {
      defaultClearAudioAnimationHandler(0);
    }, delay);
  }
}
 /**
   * default implementation of playback animation.
   * @param selector 
   * @returns 
   */
 export const defaultAudioAnimationHandler = (view: SuiScoreView, selector: SmoSelector, offsetPct: number, durationPct: number) => {
  const score = view.renderer.score;
  
  if (!score) {
    return;
  }
  const scroller = view.scroller;
  const renderer = view.renderer;
  // Get note from 0th staff if we can
  const measureSel = SmoSelection.measureSelection(score,
    score.staves.length - 1, selector.measure);
  const zmeasureSel = SmoSelection.measureSelection(score,
    0, selector.measure);
  const measure = measureSel?.measure as SmoMeasure;
  if (measure.svg.logicalBox && zmeasureSel?.measure?.svg?.logicalBox) {
    const context = renderer.pageMap.getRenderer(measure.svg.logicalBox);
    const topBox = SvgHelpers.smoBox(zmeasureSel.measure.svg.logicalBox);
    topBox.y -= context.box.y;
    const botBox = SvgHelpers.smoBox(measure.svg.logicalBox);
    botBox.y -= context.box.y;
    const height = (botBox.y + botBox.height) - topBox.y;
    const measureWidth = botBox.width - measure.svg.adjX;
    const nhWidth = 10 / score.layoutManager!.getGlobalLayout().svgScale;
    let width = measureWidth * durationPct - 10 / score.layoutManager!.getGlobalLayout().svgScale;
    width = Math.max(nhWidth, width);
    const y = topBox.y;
    let x = topBox.x + measure.svg.adjX + offsetPct * measureWidth;
    const noteBox = score.staves[selector.staff].measures[selector.measure].voices[selector.voice].notes[selector.tick];
    if (noteBox && noteBox.logicalBox) {
      x = noteBox.logicalBox.x;
    }
    const screenBox = SvgHelpers.boxPoints(x, y, width, height);
    const fillParams: Record<string, string> = {};
    fillParams['fill-opacity'] = '0.5';
    fillParams['fill'] = '#4444ff';
    const ctx = context.getContext();
    defaultClearAudioAnimationHandler(0);
    ctx.save();
    ctx.openGroup('music-cursor', 'music-cursor');
    ctx.rect(x, screenBox.y, width, screenBox.height, fillParams);
    ctx.closeGroup();
    ctx.restore();
    layoutDebug.updatePlayDebug(selector, measure.svg.logicalBox);
    scroller.scrollVisibleBox(zmeasureSel.measure.svg.logicalBox);        
  }
}