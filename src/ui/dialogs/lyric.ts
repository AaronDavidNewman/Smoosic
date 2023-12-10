// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';
import { SuiLyricComponent } from './components/noteText';
import { SuiDropdownComponent } from './components/dropdown';
import { SuiRockerComponent } from './components/rocker';
import { SvgBox } from '../../smo/data/common';
import { SmoSelector, SmoSelection } from '../../smo/xform/selections'
import { SmoLyric } from '../../smo/data/noteModifiers';
import { SuiFontComponent } from './components/fontComponent';
import { SmoRenderConfiguration } from '../../render/sui/configuration';
import { EventHandler } from '../eventSource';

declare var $: any;

function isSmoLyric(modifier: any):modifier is SmoLyric {
  return modifier?.ctor === 'SmoLyric';
}
export class SuiLyricDialog extends SuiDialogBase {
  static get ctor() {
    return 'SuiLyricDialog';
  }
  static get idleLyricTime() {
    return 5000;
  }
  static dialogElements: DialogDefinition =
    {
      label: 'Lyric Editor', elements:
        [{
          smoName: 'verse',
          defaultValue: 0,
          control: 'SuiDropdownComponent',
          label: 'Verse',
          classes: 'hide-when-editing',
          startRow: true,
          options: [{
            value: 0,
            label: '1'
          }, {
            value: 1,
            label: '2'
          }, {
            value: 2,
            label: '3'
          }, {
            value: 3,
            label: '4'
          }
          ]
        }, {
          smoName: 'translateY',
          classes: 'hide-when-editing',
          defaultValue: 0,
          control: 'SuiRockerComponent',
          label: 'Y Adjustment (Px)',
          dataType: 'int'
        }, {
          smoName: 'font',
          classes: 'hide-when-editing',
          defaultValue: 0,
          control: 'SuiFontComponent',
          label: 'Font'
        }, {
          smoName: 'lyricEditor',
          defaultValue: 0,
          classes: 'show-always',
          control: 'SuiLyricComponent',
          label: 'Edit Lyrics',
          options: []
        },
        ], staticText: [
          { doneEditing: 'Done Editing Lyrics' },
          { undo: 'Undo Lyrics' },
          { label: 'Lyric Editor' }
        ]
    };
  originalRefreshTimer: number;
  modifier: SmoLyric | null = null;
  selector: SmoSelector | null = null;
  config: SmoRenderConfiguration;
  verse: number = 0;
  mouseMoveHandler: EventHandler | null = null;
  mouseClickHandler: EventHandler | null = null;
  constructor(parameters: SuiDialogParams) {
    super(SuiLyricDialog.dialogElements, parameters);
    this.config = this.view.config;
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'SELECTIONPOS'];
    this.originalRefreshTimer = this.config.idleRedrawTime;
    this.config.idleRedrawTime = SuiLyricDialog.idleLyricTime;
    this.verse = 0;
  }
  get lyricEditorCtrl(): SuiLyricComponent {
    return this.cmap.lyricEditorCtrl as SuiLyricComponent;
  }
  get fontCtrl(): SuiFontComponent {
    return this.cmap.fontCtrl as SuiFontComponent;
  }
  get translateYCtrl(): SuiRockerComponent {
    return this.cmap.translateYCtrl as SuiRockerComponent;
  }
  get verseCtrl(): SuiDropdownComponent {
    return this.cmap.verseCtrl as SuiDropdownComponent;
  }
  display() {
    super.display();
    $(this.dgDom.element).find('.smoControl').each((ix: number, ctrl: any) => {
      if (!$(ctrl).hasClass('cbLyricEdit')) {
        $(ctrl).addClass('fold-textedit');
      }
    });
    this.mouseMoveHandler = this.eventSource.bindMouseMoveHandler(this, 'mouseMove');
    this.mouseClickHandler = this.eventSource.bindMouseClickHandler(this, 'mouseClick');

    if (this.lyricEditorCtrl.session && this.lyricEditorCtrl.session.lyric) {
      const lyric = this.lyricEditorCtrl.session.lyric;
      this.fontCtrl.setValue({
        family: lyric.fontInfo.family,
        size: lyric.fontInfo.size,
        weight: 'normal'
      });
    }
  }
  setLyric(selector: SmoSelector, lyric: SmoLyric) {
    this.modifier = lyric;
    this.verse = lyric.verse;
    this.selector = selector;
    this.translateYCtrl.setValue(lyric.translateY);
  }
  _focusSelection() {
    const selection = this.lyricEditorCtrl.session?.selection;
    const note = selection?.note;
    const box: SvgBox | null = note?.logicalBox ?? null;
    if (box) {
      this.view.scroller.scrollVisibleBox(this.view.renderer.pageMap.svgToClient(box));
    }
  }
  changed() {
    this.lyricEditorCtrl.verse = parseInt(this.verseCtrl.getValue().toString(), 10);

    // TODO: make these undoable
    if (this.fontCtrl.changeFlag) {
      const fontInfo = this.fontCtrl.getValue();
      this.view.setLyricFont({ 'family': fontInfo.family, size: fontInfo.size, weight: 'normal' });
    }
    if (this.translateYCtrl && this.modifier && this.selector) {
      this.modifier.translateY = this.translateYCtrl.getValue();
      this.view.addOrUpdateLyric(this.selector, this.modifier);
    }
  }
  bindElements() {
    const dgDom = this.dgDom;

    $(dgDom.element).find('.ok-button').off('click').on('click', () => {
      this._complete();
    });
    $(dgDom.element).find('.cancel-button').off('click').on('click', () => {
      this._complete();
    });
    $(dgDom.element).find('.remove-button').remove();
    this.lyricEditorCtrl.startEditSession();
  }
  // ### handleKeydown
  // allow a dialog to be dismissed by esc.
  async evKey(evdata: any) {
    if (evdata.key === 'Escape') {
      $(this.dgDom.element).find('.cancel-button').click();
      evdata.preventDefault();
    } else {
      if (!this.lyricEditorCtrl.running) {
        return;
      }
      const edited = await this.lyricEditorCtrl.evKey(evdata);
      if (edited) {
        evdata.stopPropagation();
      }
    }
  }
  _complete() {
    if (this.lyricEditorCtrl.running) {
      this.lyricEditorCtrl.endSession();
    }
    if (this.mouseMoveHandler) {
      this.eventSource.unbindMouseMoveHandler(this.mouseMoveHandler);
    }
    if (this.mouseClickHandler) {
      this.eventSource.unbindMouseClickHandler(this.mouseClickHandler);
    }
    $('body').removeClass('showAttributeDialog');
    $('body').removeClass('textEditor');
    this.config.idleRedrawTime = this.originalRefreshTimer;
    this.complete();
  }

  mouseMove(ev: any) {
    if (this.lyricEditorCtrl && this.lyricEditorCtrl.running) {
      this.lyricEditorCtrl.mouseMove(ev);
    }
  }

  mouseClick(ev: any) {
    if (this.lyricEditorCtrl && this.lyricEditorCtrl.running) {
      this.lyricEditorCtrl.mouseClick(ev);
      ev.stopPropagation();
    }
  }
}