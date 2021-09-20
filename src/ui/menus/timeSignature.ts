import { SuiMenuBase, SuiMenuParams } from './menu';
import { SmoMeasure } from '../../smo/data/measure';
import { SuiTimeSignatureDialog } from '../dialogs/measureDialogs';
import { SmoScore } from '../../smo/data/score';

declare var $: any;

export class SuiTimeSignatureMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static get defaults() {
    return {
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
  }
  getDefinition() {
    return SuiTimeSignatureMenu.defaults;
  }
  selection(ev: any) {
    var text = $(ev.currentTarget).attr('data-value');

    if (text === 'TimeSigOther') {
      SuiTimeSignatureDialog.createAndDisplay({
        view: this.view,
        completeNotifier: this.completeNotifier,
        startPromise: this.closePromise,
        undoBuffer: this.view.undoBuffer,
        eventSource: this.eventSource
      });
      this.complete();
      return;
    }
    this.view.setTimeSignature(SmoMeasure.convertLegacyTimeSignature(text));
    this.complete();
  }

  keydown() {}
}
