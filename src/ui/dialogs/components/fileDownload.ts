import { buildDom } from '../../../common/htmlHelpers';
import { SuiComponentBase, SuiDialogNotifier, SuiComponentParent } from './baseComponent';
import { SuiFileInput } from '../../fileio/fileInput';
declare var $: any;
export interface SuiFileDownloadComponentParams {
  id: string,
  classes: string,
  type?: string,
  increment?: number,
  defaultValue: string,
  label: string,
  smoName: string,
  control: string
}
// ## SuiFileDownloadComponent
// Download a test file using the file input.
export class SuiFileDownloadComponent extends SuiComponentBase {
  defaultValue: string;
  value: any = null;
  constructor(dialog: SuiDialogNotifier, parameter: SuiFileDownloadComponentParams) {
    super(dialog, parameter);
    this.defaultValue = parameter.defaultValue ?? '';
    this.dialog = dialog;
  }
  get html() {
    const b = buildDom;
    const id = this.parameterId;
    var r = b('div').classes(this.makeClasses('select-file')).attr('id', this.parameterId).attr('data-param', this.smoName)
      .append(b('input').attr('type', 'file').classes('file-button')
        .attr('id', id + '-input')).append(
        b('label').attr('for', id + '-input').text(this.label));
    return r;
  }
  async _handleUploadedFiles(evt: any)  {
    const localFile = new SuiFileInput(evt);
    await localFile.loadAsync();
    this.value = localFile.value;
    this.handleChanged();
  }
  getValue() {
    return this.value;
  }
  setValue(value: any) {
    this.value = value;
  }
  bind() {
    const self = this;
    $('#' + this.parameterId).find('input').off('change').on('change', async (e: any) => {
      await self._handleUploadedFiles(e);
    });
  }
}