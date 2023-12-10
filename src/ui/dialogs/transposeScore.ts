// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoScore } from '../../smo/data/score';
import { GlobalLayoutAttributes, SmoLayoutManager, SmoGlobalLayout } from '../../smo/data/scoreModifiers';
import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';


declare var $: any;

export class SuiTransposeScoreAdapter extends SuiComponentAdapter {
  transposeOffset: number = 0;
  constructor(view: SuiScoreViewOperations) {
    super(view);
    this.view = view;
  }
  // TODO: writeValue is not called in a global context
  get offset() {
    return this.transposeOffset;
  }
  set offset(value: number) {
    if (value > -13 && value < 13) {
      this.transposeOffset = value;
    }
  }
  async commit() { 
    if (this.transposeOffset !== 0) {
      this.view.transposeScore(this.transposeOffset);
    }
  }
  async cancel() {
  }
}
// ## SuiGlobalLayoutDialog
// change editor and formatting defaults for this score.
export class SuiTransposeScoreDialog extends SuiDialogAdapterBase<SuiTransposeScoreAdapter> {
  static dialogElements: DialogDefinition =
    {
      label: 'Transpose Score', elements:
        [{
          smoName: 'offset',
          defaultValue: 0,
          control: 'SuiRockerComponent',
          label: 'Transpose (1/2 steps)'
        }],
      staticText: []
    };
  get dimensionControls() {
    return [this.cmap.pageSizeCtrl, this.cmap.pageWidthCtrl, this.cmap.pageHeightCtrl];
  }
  constructor(params: SuiDialogParams) {
    const adapter = new SuiTransposeScoreAdapter(params.view);
    super(SuiTransposeScoreDialog.dialogElements, { adapter, ...params });
  }
  changed() {
    super.changed();
    if (this.dimensionControls.find((x) => x.changeFlag)) {
      this.initialValue();
    }
  }
}
