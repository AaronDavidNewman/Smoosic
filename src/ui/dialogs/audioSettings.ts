// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoAudioPlayerSettings, SmoAudioPlayerType, IsOscillatorType } from '../../smo/data/scoreModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { DialogDefinition, SuiDialogParams } from './dialog';

declare var $: any;

export class SuiAudioSettingsAdapter extends SuiComponentAdapter {
  settings: SmoAudioPlayerSettings;
  backup: SmoAudioPlayerSettings;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.settings = new SmoAudioPlayerSettings(view.score.audioSettings);
    this.backup = new SmoAudioPlayerSettings(view.score.audioSettings);
  }
  get enableReverb(): boolean {
    return this.settings.reverbEnable;
  }
  set enableReverb(value: boolean) {
    this.settings.reverbEnable = value;
    this.view.updateAudioSettings(this.settings);
  }
  get playerType(): string {
    return this.settings.playerType;
  }
  set playerType(value: string) {
    if (value !== 'sampler') {
      this.settings.playerType  = 'synthesizer';
    } else {
      this.settings.playerType = 'sampler';
    }
    this.view.updateAudioSettings(this.settings);
  }
  get waveform(): string {
    return this.settings.waveform;
  }
  set waveform(value: string) {
    if (IsOscillatorType(value)) {
      this.settings.waveform = value;
    }
    this.view.updateAudioSettings(this.settings);
  }
  get reverbDelay(): number {
    return this.settings.reverbDelay;
  }
  set reverbDelay(value: number) {
    this.settings.reverbDecay = value;
    this.view.updateAudioSettings(this.settings);
  }
  get reverbDecay(): number {
    return this.settings.reverbDelay;
  }  
  set reverbDecay(value: number) {
    this.settings.reverbDecay = value;
    this.view.updateAudioSettings(this.settings);
  }
  cancel() {
    this.view.updateAudioSettings(this.backup);
  }
  commit() {
  }
}
export class SuiAudioSettingsDialog extends SuiDialogAdapterBase<SuiAudioSettingsAdapter> {
  static dialogElements: DialogDefinition =
    {
      label: 'Audio Settings',
      elements: [{
        smoName: 'enableReverb',
        control: 'SuiToggleComponent',
        label: 'Enable Reverb'
      }, {
        smoName: 'playerType',
        control: 'SuiDropdownComponent',
        label: 'Audio Playback Engine',
        options: [{
          value: 'sampler', label: 'Sampler'
        }, {
          value: 'synthesizer', label: 'Analog SoftSynth'
        }]
      }, {
        smoName: 'waveform',
        control: 'SuiDropdownComponent',
        label: 'Waveform (Synth only)',
        options: [{
          value: 'sine', label: 'Sine'
        }, {
          value: 'sawtooth', label: 'sawtooth'
        }, {
          value: 'square', label: 'square'
        }, {
          value: 'triangle', label: 'triangle'
        }, {
          value: 'custom', label: 'custom'
        }]
      }, {
        smoName: 'reverbDelay',
        control: 'SuiRockerComponent',
        label: 'Delay Time (if reverb) in seconds',
        dataType: 'float'
      }, {
        smoName: 'reverbDecay',
        control: 'SuiRockerComponent',
        label: 'Decay Time (if reverb) in seconds',
        dataType: 'float'
      }],
      staticText: []
    }
  constructor(params: SuiDialogParams) {
    const adapter = new SuiAudioSettingsAdapter(params.view);
    super(SuiAudioSettingsDialog.dialogElements, { adapter, ...params });
  }
}
