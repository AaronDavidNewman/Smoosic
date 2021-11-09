// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';
import { SuiChordComponent } from './components/noteText';
import { SuiDropdownComponent } from './components/dropdown';
import { SuiToggleComponent } from './components/toggle';
import { SuiRockerComponent } from './components/rocker';
import {KeyEvent } from '../../smo/data/common';
import { SmoLyric } from '../../smo/data/noteModifiers';
import { SmoSelector } from '../../smo/xform/selections';
import { SuiInlineText } from '../../render/sui/textRender';
import { SuiFontComponent } from './components/fontComponent';
import { EventHandler } from '../eventSource';

declare var $: any;
export class SuiChordChangeDialog extends SuiDialogBase {
  static dialogElements: DialogDefinition =
      {
        label: 'Edit Chord Symbol', elements:
          [{
            smoName: 'verse',
            defaultValue: 0,
            control: 'SuiDropdownComponent',
            label: 'Ordinality',
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
            }]
          }, {
            smoName: 'translateY',
            defaultValue: 0,
            classes: 'hide-when-editing',
            control: 'SuiRockerComponent',
            label: 'Y Adjustment (Px)',
            dataType: 'int'
          }, {
            smoName: 'chordEditor',
            defaultValue: 0,
            classes: 'show-always',
            control: 'SuiChordComponent',
            label: 'Edit Text',
            options: []
          }, {
            smoName: 'chordSymbol',
            defaultValue: '',
            classes: 'show-when-editing',
            control: 'SuiDropdownComponent',
            label: 'Chord Symbol',
            startRow: true,
            options: [{
              value: 'csymDiminished',
              label: 'Dim'
            }, {
              value: 'csymHalfDiminished',
              label: 'Half dim'
            }, {
              value: 'csymDiagonalArrangementSlash',
              label: 'Slash'
            }, {
              value: 'csymMajorSeventh',
              label: 'Maj7'
            }]
          }, {
            smoName: 'textPosition',
            defaultValue: SuiInlineText.textTypes.normal,
            classes: 'show-when-editing',
            control: 'SuiDropdownComponent',
            label: 'Text Position',
            startRow: true,
            options: [{
              value: SuiInlineText.textTypes.superScript,
              label: 'Superscript'
            }, {
              value: SuiInlineText.textTypes.subScript,
              label: 'Subscript'
            }, {
              value: SuiInlineText.textTypes.normal,
              label: 'Normal'
            }]
          }, {
            smoName: 'font',
            classes: 'hide-when-editing',
            defaultValue: 0,
            control: 'SuiFontComponent',
            label: 'Font'
          }, {
            smoName: 'adjustWidth',
            classes: 'hide-when-editing',
            control: 'SuiToggleComponent',
            label: 'Adjust Note Width',
            options: []
          }],
        staticText: [
          { label: 'Edit Chord Symbol' },
          { undo: 'Undo Chord Symbols' },
          { doneEditing: 'Done Editing Chord Symbols' }
        ]
      };
  lyric: SmoLyric | null = null;
  selector: SmoSelector | null = null;
  mouseMoveHandler: EventHandler | null = null;
  mouseClickHandler: EventHandler | null = null;

  constructor(parameters: SuiDialogParams) {
    super(SuiChordChangeDialog.dialogElements, parameters);
    parameters.ctor = 'SuiChordChangeDialog';
    this.displayOptions = ['BINDCOMPONENTS', 'DRAGGABLE', 'KEYBOARD_CAPTURE', 'SELECTIONPOS'];
  }
  get chordEditorCtrl(): SuiChordComponent {
    return this.cmap.chordEditorCtrl as SuiChordComponent;
  }
  get chordSymbolCtrl(): SuiDropdownComponent {
    return this.cmap.chordSymbolCtrl as SuiDropdownComponent;
  }
  get translateYCtrl(): SuiRockerComponent {
    return this.cmap.translateYCtrl as SuiRockerComponent;
  }
  get textPositionCtrl(): SuiRockerComponent {
    return this.cmap.textPositionCtrl as SuiRockerComponent;
  }
  get adjustWidthCtrl(): SuiToggleComponent {
    return this.cmap.adjustWidthCtrl as SuiToggleComponent;
  }
  get fontCtrl(): SuiFontComponent {
    return this.cmap.fontCtrl as SuiFontComponent;
  }
  changed() {
    let val = '';
    if (this.chordSymbolCtrl.changeFlag && this.chordEditorCtrl.running) {
      val = '@' + this.chordSymbolCtrl.getValue() + '@';
      var  kv:KeyEvent;
      /*     type: string, shiftKey: boolean, ctrlKey: boolean, altKey: boolean, key: string, keyCode: string,
    code: string*/
      this.chordEditorCtrl.evKey({
        type: 'keydown',
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
        key: val,
        code: val,
        event: null,
        keyCode: '0'
      });
      // Move focus outside the element so it doesn't intercept keys
      this.chordSymbolCtrl.unselect();
    }
    if (this.translateYCtrl.changeFlag) {
      if (this.lyric && this.selector) {
        this.lyric.translateY = this.translateYCtrl.getValue();
        this.view.addOrUpdateLyric(this.selector, this.lyric);
      }
    }
    if (this.textPositionCtrl.changeFlag) {
      this.chordEditorCtrl.setTextType(this.textPositionCtrl.getValue());
      $(this.textPositionCtrl._getInputElement())[0].selectedIndex = -1;
      $(this.textPositionCtrl._getInputElement()).blur();
    }
    if (this.fontCtrl.changeFlag) {
      const fontInfo = this.fontCtrl.getValue();
      this.view.setChordFont(fontInfo);
    }
    if (this.adjustWidthCtrl.changeFlag) {
      this.view.score.setChordAdjustWidth(this.adjustWidthCtrl.getValue());
    }
  }
  setLyric(selector: SmoSelector, lyric: SmoLyric) {
    this.selector = selector;
    this.lyric = lyric;
    this.translateYCtrl.setValue(lyric.translateY);
  }

  display() {
    super.display();
    this.mouseMoveHandler = this.eventSource.bindMouseMoveHandler(this, 'mouseMove');
    this.mouseClickHandler = this.eventSource.bindMouseClickHandler(this, 'mouseClick');
    if (this.chordEditorCtrl && this.chordEditorCtrl.session && this.chordEditorCtrl.session.lyric) {
      const lyric = this.chordEditorCtrl.session.lyric;
      this.adjustWidthCtrl.setValue(lyric.adjustNoteWidthChord);
      this.fontCtrl.setValue({
        family: lyric.fontInfo.family,
        size: lyric.fontInfo.size, weight: 'normal'
      });
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
    // this.chordEditorCtrl.setView(this.eventSource, this.view);
    this.chordEditorCtrl.startEditSession();
  }

  // ### handleKeydown
  // allow a dialog to be dismissed by esc.
  evKey(evdata: any) {
    if (evdata.key === 'Escape') {
      $(this.dgDom.element).find('.cancel-button').click();
      evdata.preventDefault();
    } else {
      if (!this.chordEditorCtrl.running) {
        return;
      }
      const edited = this.chordEditorCtrl.evKey(evdata);
      if (edited) {
        evdata.stopPropagation();
      }
    }
  }

  _complete() {
    if (this.chordEditorCtrl.running) {
      this.chordEditorCtrl.endSession();
    }
    this.view.renderer.setDirty();
    if (this.mouseMoveHandler) {
      this.eventSource.unbindMouseMoveHandler(this.mouseMoveHandler);
    }
    if (this.mouseClickHandler) {
      this.eventSource.unbindMouseClickHandler(this.mouseClickHandler);
    }
    $('body').removeClass('showAttributeDialog');
    $('body').removeClass('textEditor');
    this.complete();
  }

  mouseMove(ev: any) {
    if (this.chordEditorCtrl && this.chordEditorCtrl.running) {
      this.chordEditorCtrl.mouseMove(ev);
    }
  }

  mouseClick(ev: any) {
    if (this.chordEditorCtrl && this.chordEditorCtrl.running) {
      this.chordEditorCtrl.mouseClick(ev);
      ev.stopPropagation();
    }
  }
}