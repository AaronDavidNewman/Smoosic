import { SmoScoreText, SmoTextGroup } from '../../../smo/data/scoreModifiers';
import { KeyEvent } from '../../../smo/data/common';
import { SuiTextSession } from '../../../render/sui/textEdit';
import { SuiScroller } from '../../../render/sui/scroller';
import { SuiScoreViewOperations } from '../../../render/sui/scoreViewOperations';
import { SuiDialogNotifier, SuiComponentBase, SuiComponentParent } from './baseComponent';
import { SuiButtonComposite } from './button';
import { SuiRockerComposite } from './rocker';
import { SuiDropdownComposite } from './dropdown';
import { SuiInlineText } from '../../../render/sui/textRender';
import { htmlHelpers } from '../../../common/htmlHelpers';

declare var $: any;

// ## SuiTextInPlace
// Edit the text in an SVG element, in the same scale etc. as the text in the score SVG DOM.
// This component just manages the text editing component of hte renderer.
export interface SuiTextInPlaceParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string
}
export class SuiTextInPlace extends SuiComponentBase {
  scroller: SuiScroller;
  editMode: boolean = false;
  value: SmoTextGroup;
  staticText: Record<string, string>;
  altLabel: string;
  view: SuiScoreViewOperations;
  session: SuiTextSession | null = null;
  constructor(dialog: SuiDialogNotifier, parameter: SuiTextInPlaceParams) {
    super(dialog, parameter);
    this.scroller = dialog.getView().scroller;
    this.value = new SmoTextGroup(SmoTextGroup.defaults);
    this.view = this.dialog.getView();
    const modifier = this.dialog.getModifier();
    if (modifier && SmoTextGroup.isTextGroup(modifier)) {
      this.value = modifier;
    }
    this.staticText = this.dialog.getStaticText();
    this.altLabel = this.staticText.editorLabel;
  }
  show() {}
  hide() {}

  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    const r = b('div').classes(this.makeClasses('cbTextInPlace smoControl')).attr('id', this.parameterId).attr('data-param', this.smoName)
      .append(b('button').attr('type', 'checkbox').classes('toggleTextEdit')
        .attr('id', id + '-input').append(
          b('span').classes('icon icon-pencil'))
        .append(
          b('label').attr('for', id + '-input').text(this.label)));
    return r;
  }
  endSession() {
    $(this._getInputElement()).find('label').text(this.label);
    const button = document.getElementById(this.parameterId);
    $(button).find('span.icon').removeClass('icon-checkmark').addClass('icon-pencil');
    this.value.skipRender = false;

    const render = () => {
      this.view.renderer.setRefresh();
    };
    if (this.session) {
      this.session.textGroup.tryParseUnicode();
      this.value = this.session.textGroup;
      this.session.stopSession().then(render);
    }
    $('body').removeClass('text-edit');
    this.handleChanged();
  }
  get isRunning() {
    return this.session && this.session.isRunning;
  }
  getValue() {
    return this.value;
  }
  _getInputElement() {
    var pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('button');
  }
  mouseMove(ev: any) {
    if (this.session && this.session.isRunning) {
      this.session.handleMouseEvent(ev);
    }
  }

  mouseClick(ev: any) {
    if (this.session && this.session.isRunning) {
      this.session.handleMouseEvent(ev);
    }
  }
  _renderInactiveBlocks() {
    const modifier = this.value;
    const context = this.view.renderer.context;
    context.save();
    context.setFillStyle('#ddd');
    modifier.textBlocks.forEach((block) => {
      const st = block.text;
      if (st.attrs.id !== this.value.getActiveBlock().attrs.id) {
        const svgText = SuiInlineText.fromScoreText(st, context, this.scroller);
        if (st.logicalBox) {
          svgText.startX += st.logicalBox.x - st.x;
          svgText.startY += (st.y - st.logicalBox.y) - st.logicalBox.height / 2;
        }
        const sgrp = context.openGroup();
        sgrp.classList.add('inactive-text');
        sgrp.classList.add('suiInlineText');
        svgText.render();
        context.closeGroup();
      }
    });
    context.restore();
  }
  startEditSession() {
    $(this._getInputElement()).find('label').text(this.altLabel);
    const modifier = this.value;
    modifier.skipRender = true;
    $(this.view.renderer.context.svg).find('#' + modifier.attrs.id).remove();
    this._renderInactiveBlocks();
    const ul = modifier.ul();

    // this.textElement=$(this.dialog.layout.svg).find('.'+modifier.attrs.id)[0];
    this.session = new SuiTextSession({
      renderer: this.view.renderer,
      scroller: this.scroller,
      x: ul.x,
      y: ul.y,
      textGroup: modifier,
      text: modifier.getActiveBlock().text,
      scoreText: modifier.getActiveBlock()
    });
    $('body').addClass('text-edit');
    this.value = this.session.textGroup;
    const button = document.getElementById(this.parameterId);
    $(button).find('span.icon').removeClass('icon-pencil').addClass('icon-checkmark');
    this.session.startSession();
    // blur the button so key events don't get passed to it.
    $(this._getInputElement()).blur();
  }
  evKey(evdata: KeyEvent) {
    if (this.session) {
      this.session.evKey(evdata);
    }
  }
  bind() {
    $(this._getInputElement()).off('click').on('click', () => {
      if (this.session && this.session.isRunning) {
        this.endSession();
      } else {
        this.startEditSession();
      }
    });
  }
}


export interface SuiTextBlockComponentParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string
}
export interface SuiTextBlockValue {
  modifier: SmoTextGroup,
  activeScoreText: SmoScoreText
}
export class SuiTextBlockComponent extends SuiComponentParent {
  addBlockCtrl: SuiButtonComposite;
  toggleBlockCtrl: SuiButtonComposite;
  removeBlockCtrl: SuiButtonComposite;
  relativePositionCtrl: SuiDropdownComposite;
  justificationCtrl: SuiDropdownComposite;
  spacingCtrl: SuiRockerComposite;
  modifier: SmoTextGroup;
  activeScoreText: SmoScoreText;

  constructor(dialog: SuiDialogNotifier, parameter: SuiTextBlockComponentParams) {
    super(dialog, parameter);
    this.addBlockCtrl = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'addBlock',
        smoName: 'addBlock',
        parentControl: this,
        icon: 'icon-plus',
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiButtonComponent',
        label: 'Add Text Block'
      });

    this.toggleBlockCtrl = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'toggleBlock',
        smoName: 'toggleBlock',
        parentControl: this,
        icon: 'icon-arrow-right',
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiButtonComponent',
        label: 'Next Block'
      });

    this.removeBlockCtrl = new SuiButtonComposite(this.dialog,
      {
        id: this.id + 'removeBlock',
        smoName: 'removeBlock',
        parentControl: this,
        icon: 'icon-minus',
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiButtonComponent',
        label: 'Remove Block'
      });
    this.relativePositionCtrl = new SuiDropdownComposite(
      this.dialog,
      {
        id: this.id + 'relativePosition',
        smoName: 'relativePosition',
        parentControl: this,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiDropdownComponent',
        label: 'Block Positions',
        options: [{
          value: SmoTextGroup.relativePositions.ABOVE,
          label: 'Above'
        }, {
          value: SmoTextGroup.relativePositions.BELOW,
          label: 'Below'
        }, {
          value: SmoTextGroup.relativePositions.LEFT,
          label: 'Left'
        }, {
          value: SmoTextGroup.relativePositions.RIGHT,
          label: 'Right'
        }]
      }
    );
    this.justificationCtrl = new SuiDropdownComposite(
      this.dialog,
      {
        id: this.id + 'justification',
        smoName: 'justification',
        parentControl: this,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiDropdownComponent',
        label: 'Justification',
        options: [{
          value: SmoTextGroup.justifications.LEFT,
          label: 'Left'
        }, {
          value: SmoTextGroup.justifications.RIGHT,
          label: 'Right'
        }, {
          value: SmoTextGroup.justifications.CENTER,
          label: 'Center'
        }]
      });
    this.spacingCtrl = new SuiRockerComposite(
      this.dialog,
      {
        id: this.id + 'spacing',
        smoName: 'spacing',
        defaultValue: 0,
        parentControl: this,
        classes: 'hide-when-editing hide-when-moving',
        control: 'SuiRockerComponent',
        label: 'Spacing',
        dataType: 'float',
        increment: 0.1
      },
    );
    const mod = this.dialog.getModifier();
    if (mod && SmoTextGroup.isTextGroup(mod)) {
      this.modifier = mod;
    } else {
      this.modifier = new SmoTextGroup(SmoTextGroup.defaults);
    }
    this.activeScoreText = this.modifier.textBlocks[0].text;
  }
  changed() {
    if (this.addBlockCtrl.changeFlag && this.modifier) {
      const nt = new SmoScoreText(this.activeScoreText);
      this.modifier.addScoreText(nt);
      this.activeScoreText = nt;
      this.modifier.setActiveBlock(nt);
      this._updateMultiiFields();
    }
    if (this.relativePositionCtrl.changeFlag) {
      this.modifier.setRelativePosition(parseInt(this.relativePositionCtrl.getValue().toString(), 10));
    }
    if (this.justificationCtrl.changeFlag) {
      this.modifier.justification = parseInt(this.justificationCtrl.getValue().toString(), 10);
    }
    if (this.removeBlockCtrl.changeFlag) {
      this.modifier.removeBlock(this.activeScoreText);
      this.activeScoreText = this.modifier.firstBlock();
      this._updateMultiiFields();
    }
    if (this.toggleBlockCtrl.changeFlag) {
      const curIx = this.modifier.indexOf(this.activeScoreText);
      const newIx = (curIx + 1) % this.modifier.textBlocks.length;
      this.activeScoreText = this.modifier.textBlocks[newIx].text;
      this.modifier.setActiveBlock(this.activeScoreText);
    }
    if (this.spacingCtrl.changeFlag) {
      const val = this.spacingCtrl.getValue();
      if (val >= 0) {
        this.modifier.spacing = val;
      }
    }
    this.handleChanged();
  }
  get html() {
    const b = htmlHelpers.buildDom;
    const q = b('div').classes(this.makeClasses('multiControl smoControl'));
    q.append(this.addBlockCtrl.html);
    q.append(this.removeBlockCtrl.html);
    q.append(this.toggleBlockCtrl.html);
    q.append(this.relativePositionCtrl.html);
    q.append(this.justificationCtrl.html);
    q.append(this.spacingCtrl.html);

    return q;
  }

  _getInputElement() {
    return $(this.dialog.dgDom.element).find('#' + this.parameterId);
  }
  getValue() {
    return {
      activeScoreText: this.activeScoreText,
      modifier: this.modifier
    };
  }
  _updateMultiiFields() {
    const fields = [this.justificationCtrl, this.relativePositionCtrl,
      this.removeBlockCtrl, this.toggleBlockCtrl, this.spacingCtrl];
    fields.forEach((field) => {
      if (this.modifier.textBlocks.length < 2) {
        $('#' + field.parameterId).addClass('hide');
      } else {
        $('#' + field.parameterId).removeClass('hide');
      }
    });
  }
  setValue(value: SuiTextBlockValue) {
    this.activeScoreText = value.activeScoreText;
    this.modifier = value.modifier;
    this.relativePositionCtrl.setValue(this.modifier.relativePosition);
    this._updateMultiiFields();
    this.justificationCtrl.setValue(this.modifier.justification);
    this.spacingCtrl.setValue(this.modifier.spacing);
  }

  bind() {
    this.addBlockCtrl.bind();
    this.relativePositionCtrl.bind();
    this.justificationCtrl.bind();
    this.removeBlockCtrl.bind();
    this.toggleBlockCtrl.bind();
    this.spacingCtrl.bind();
  }
}

