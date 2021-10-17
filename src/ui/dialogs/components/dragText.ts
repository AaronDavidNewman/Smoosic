import { SuiDialogNotifier, SuiComponentBase, SuiBaseComponentParams } from './baseComponent';
import { SuiDragSession } from '../../../render/sui/textEdit';
import { SuiScoreViewOperations } from '../../../render/sui/scoreViewOperations';
import { htmlHelpers } from '../../../common/htmlHelpers';
declare var $: any;
// ## SuiDragText
// A component that lets you drag the text you are editing to anywhere on the score.
// The text is not really part of the dialog but the location of the text appears
// in other dialog fields.
export class SuiDragText extends SuiComponentBase {
  dragging: boolean = false;
  running: boolean = false;
  staticText: Record<string, string>;
  altLabel: string;
  value: string = '';
  session: SuiDragSession | null = null;
  view: SuiScoreViewOperations;
  constructor(dialog: SuiDialogNotifier, parameter: SuiBaseComponentParams) {
    super(dialog, parameter);
    this.dragging = false;
    this.running = false;
    this.staticText = this.dialog.getStaticText();
    this.altLabel = this.staticText.draggerLabel;
    this.value = '';
    this.view = this.dialog.getView();
  }

  get html() {
    var b = htmlHelpers.buildDom;
    var id = this.parameterId;
    var r = b('div').classes(this.makeClasses('cbDragTextDialog smoControl')).attr('id', this.parameterId).attr('data-param', this.smoName)
      .append(b('button').attr('type', 'checkbox').classes('toggleTextEdit')
        .attr('id', id + '-input').append(
          b('span').classes('icon icon-move'))
        .append(
          b('label').attr('for', id + '-input').text(this.label)));
    return r;
  }
  show(){}
  hide(){}
  _getInputElement() {
    var pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid).find('button');
  }
  stopEditSession() {
    $('body').removeClass('text-move');
    $(this._getInputElement()).find('span.icon').removeClass('icon-checkmark').addClass('icon-move');
    if (this.session && this.session.dragging) {
      this.session.dragging = false;
    }
    this.running = false;
  }
  startEditSession() {
    $('body').addClass('text-move');
    this.session = new SuiDragSession({
      textGroup: (this.dialog as any).modifier,
      context: this.view.renderer.context,
      scroller: this.view.tracker.scroller
    });
    $(this._getInputElement()).find('label').text(this.altLabel);
    $(this._getInputElement()).find('span.icon').removeClass('icon-enlarge').addClass('icon-checkmark');
    this.running = true;
  }
  mouseMove(e: any) {
    if (this.session && this.session.dragging) {
      this.session.mouseMove(e);
    }
  }
  mouseDown(e: any) {
    if (this.session && !this.session.dragging) {
      this.session.startDrag(e);
      this.dragging = true;
    }
  }
  mouseUp(e: any) {
    if (this.session && this.session.dragging) {
      this.session.endDrag();
      this.dragging = false;
      this.handleChanged();
    }
  }

  bind() {
    const self = this;
    $(this._getInputElement()).off('click').on('click', () => {
      if (self.running) {
        self.stopEditSession();
      } else {
        self.startEditSession();
      }
    });
  }
}