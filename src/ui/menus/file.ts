import { SuiMenuBase, SuiMenuParams } from './menu';
import { createAndDisplayDialog } from '../dialogs/dialog';
import {
  SuiSaveFileDialog, SuiPrintFileDialog, 
  // SuiSaveActionsDialog, SuiLoadActionsDialog, 
  SuiLoadFileDialog, SuiLoadMidiDialog,
  SuiSaveXmlDialog, SuiSaveMidiDialog, SuiLoadMxmlDialog, SuiSaveVexDialog
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
      icon: '',
      text: 'Import Midi',
      value: 'importMidi'
    },  {
      icon: '',
      text: 'Export Vex',
      value: 'exportVex'
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
    createAndDisplayDialog(SuiPrintFileDialog, {
      ctor: 'SuiPrintFileDialog',
      id: 'print',
      eventSource: this.eventSource,
      modifier: null,
      view: this.view,
      completeNotifier: this.completeNotifier,
      startPromise: this.closePromise,
      tracker: this.tracker
    });
  }
  selection(ev: any) {
    const text = $(ev.currentTarget).attr('data-value');
    const self = this;
    if (text === 'saveFile') {
      createAndDisplayDialog(SuiSaveFileDialog, {
        ctor: 'SuiSaveFileDialog',
        id: 'save',
        modifier: null,
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'openFile') {
      createAndDisplayDialog(SuiLoadFileDialog, {
        ctor: 'SuiLoadFileDialog',
        id: 'loadFile',
        modifier: null,
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
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
      createAndDisplayDialog(SuiSaveXmlDialog, {
        ctor: 'SuiSaveXmlDialog',
        id: 'save',
        modifier: null,
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'exportVex') {
      createAndDisplayDialog(SuiSaveVexDialog, {
        ctor: 'SuiSaveVexDialog',
        id: 'save',
        modifier: null,
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'exportMidi') {
      createAndDisplayDialog(SuiSaveMidiDialog, {
        ctor: 'SuiSaveMidiDialog',
        id: 'save',
        modifier: null,
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    } else if (text === 'importMxml') {
      createAndDisplayDialog(SuiLoadMxmlDialog, {
        ctor: 'SuiLoadMxmlDialog',
        id: 'save',
        modifier: null,
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      }); 
    } else if (text === 'importMidi') {
      createAndDisplayDialog(SuiLoadMidiDialog, {
        ctor: 'SuiLoadMidiDialog',
        id: 'save',
        modifier: null,
        completeNotifier: this.completeNotifier,
        tracker: this.tracker,
        eventSource: this.eventSource,
        view: this.view,
        startPromise: this.closePromise
      });
    }
    this.complete();
  }
  keydown() { }
}
