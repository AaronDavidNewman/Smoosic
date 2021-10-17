// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiMenuBase, SuiMenuParams } from './menu';
import { SmoMeasure } from '../../smo/data/measure';
import { createAndDisplayDialog } from '../dialogs/dialog';
import { SuiTimeSignatureDialog } from '../dialogs/timeSignature';

declare var $: any;

export class SuiTimeSignatureMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static defaults = {
    label: 'Time Sig',
    menuItems: [{
      icon: 'sixeight',
      text: '6/8',
      value: '6/8',
    }, {
      icon: 'fourfour',
      text: '4/4',
      value: '4/4',
    }, {
      icon: 'threefour',
      text: '3/4',
      value: '3/4',
    }, {
      icon: 'twofour',
      text: '2/4',
      value: '2/4',
    }, {
      icon: 'twelveeight',
      text: '12/8',
      value: '12/8',
    }, {
      icon: 'seveneight',
      text: '7/8',
      value: '7/8',
    }, {
      icon: 'fiveeight',
      text: '5/8',
      value: '5/8',
    }, {
      icon: '',
      text: 'Other',
      value: 'TimeSigOther',
    }, {
      icon: '',
      text: 'Cancel',
      value: 'cancel'
    }]
  };

  getDefinition() {
    return SuiTimeSignatureMenu.defaults;
  }
  selection(ev: any) {
    var text = $(ev.currentTarget).attr('data-value');
    if (text === 'TimeSigOther') {
      createAndDisplayDialog(SuiTimeSignatureDialog, {
        completeNotifier: this.completeNotifier!,
        view: this.view,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource,
        id: 'staffGroups',
        ctor: 'SuiStaffGroupDialog',
        tracker: this.view.tracker,
        modifier: null,
        startPromise: this.closePromise
      });
      this.complete();
      return;
    }
    this.view.setTimeSignature(SmoMeasure.convertLegacyTimeSignature(text), '');
    this.complete();
  }

  keydown() { }
}
