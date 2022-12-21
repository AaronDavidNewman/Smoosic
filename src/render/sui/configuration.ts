
import { SuiAudioAnimationParams } from '../audio/musicCursor';

/**
 * Define configurable rendering options
 * @module /render/sui/configuration
 */
export interface SmoRenderConfiguration {
  demonPollTime: number,
  idleRedrawTime: number,
  scoreDomContainer: string | HTMLElement,
  audioAnimation: SuiAudioAnimationParams
}