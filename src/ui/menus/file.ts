import { SuiMenuBase, SuiMenuParams } from './menu';
import {
  SuiSaveFileDialog, SuiPrintFileDialog, SuiSaveActionsDialog, SuiLoadActionsDialog, SuiLoadFileDialog,
  SuiSaveXmlDialog, SuiSaveMidiDialog, SuiLoadMxmlDialog
} from '../dialogs/fileDialogs';
import { SmoScore } from '../../smo/data/score';

declare var $: any;

export class SuiFileMenu extends SuiMenuBase {
  constructor(params: SuiMenuParams) {
    super(params);
  }
  static defaults = {
    label: 'File',
    menuItems: [{
      icon: 'folder-new',
      text: 'New Score',
      value: 'newFile'
    }, {
      icon: 'folder-open',
      text: 'Open',
      value: 'openFile'
    }, {
      icon: '',
      text: 'Quick Save',
      value: 'quickSave'
    }, {
      icon: 'folder-save',
      text: 'Save',
      value: 'saveFile'
    }, {
      icon: '',
      text: 'Print',
      value: 'printScore'
    }, {
      icon: '',
      text: 'Import MusicXML',
      value: 'importMxml'
    }, {
      icon: '',
      text: 'Export MusicXML',
      value: 'exportXml'
    }, {
      icon: '',
      text: 'Export Midi',
      value: 'exportMidi'
    }, {
      icon: 'folder-save',
      text: 'Save Actions',
      value: 'saveActions'
    }, {
      icon: 'icon-play3',
      text: 'Play Actions',
      value: 'playActions'
    }, {
      icon: '',
      text: 'Cancel',
      value: 'cancel'
    }]
  };

  getDefinition() {
    return SuiFileMenu.defaults;
  }
  systemPrint() {
    window.print();
    SuiPrintFileDialog.createAndDisplay({
      view: this.view,
      completeNotifier: this.completeNotifier,
      startPromise: this.closePromise,
      tracker: this.tracker,
      undoBuffer: this.undoBuffer,
    });
  }
  selection(ev: any) {
    const text = $(ev.currentTarget).attr('data-value');
    const self = this;
    if (text === 'saveFile') {
      SuiSaveFileDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'saveActions') {
      SuiSaveActionsDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'playActions') {
      SuiLoadActionsDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'openFile') {
      SuiLoadFileDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'newFile') {
      const score = SmoScore.getDefaultScore(SmoScore.defaults, null);
      this.view.changeScore(score);
    } else if (text === 'quickSave') {
      this.view.quickSave();
    } else if (text === 'printScore') {
      const systemPrint = () => {
        self.systemPrint();
      };
      this.view.renderer.renderForPrintPromise().then(systemPrint);
    } else if (text === 'exportXml') {
      SuiSaveXmlDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'exportMidi') {
      SuiSaveMidiDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'importMxml') {
      SuiLoadMxmlDialog.createAndDisplay({
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        undoBuffer: this.undoBuffer,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    }
    this.complete();
  }
  keydown() { }
}
