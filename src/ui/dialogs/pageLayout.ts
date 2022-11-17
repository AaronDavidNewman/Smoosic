// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SmoPageLayout, SmoLayoutManager } from '../../smo/data/scoreModifiers';

import { SuiScoreViewOperations } from '../../render/sui/scoreViewOperations';

import { DialogDefinitionOption } from './components/baseComponent';
import { SuiComponentAdapter, SuiDialogAdapterBase } from './adapter';
import { DialogDefinition, SuiDialogBase, SuiDialogParams } from './dialog';

declare var $: any;

export class SuiPageLayoutAdapter extends SuiComponentAdapter {
  static get layoutTypes(): Record<string, number> {
    return {
      'all': -1,
      'remaining': -2,
      'page': -3
    }
  }
  layouts: SmoPageLayout[];
  backup: SmoPageLayout[] = [];
  currentPage: number;
  changed: boolean = false;
  currentLayout: SmoPageLayout;
  layoutManager: SmoLayoutManager;
  view: SuiScoreViewOperations
  applyTo: number = SuiPageLayoutAdapter.layoutTypes.all;
  options: DialogDefinitionOption[] = [];
  updateLayouts() {
    let i = 0;
    let startPage = this.currentPage;
    let endPage = this.layouts.length;
    if (this.applyTo === SuiPageLayoutAdapter.layoutTypes.page) {
      endPage = startPage;
    } else if (this.applyTo === SuiPageLayoutAdapter.layoutTypes.all) {
      startPage = 0;
    }
    this.view.setPageLayouts(this.currentLayout, startPage, endPage);
    this.changed = true;
  }
  get enablePages() {
    return this.layouts.length > 1;
  }
  get applyToPage() {
    return this.applyTo;
  }
  set applyToPage(value: number) {
    this.applyTo = value;
    this.updateLayouts();
  }
  set leftMargin(value: number) {
    this.currentLayout.leftMargin = value;
    this.updateLayouts();
  }
  get leftMargin() {
    return this.currentLayout.leftMargin;
  }
  get rightMargin() {
    return this.currentLayout.rightMargin;
  }
  set rightMargin(value: number) {
    this.currentLayout.rightMargin = value;
    this.updateLayouts();
  }
  get topMargin() {
    return this.currentLayout.topMargin;
  }
  set topMargin(value) {
    this.currentLayout.topMargin = value;
    this.updateLayouts();
  }
  get bottomMargin() {
    return this.currentLayout.bottomMargin;
  }
  set bottomMargin(value) {
    this.currentLayout.bottomMargin = value;
    this.updateLayouts();
  }
  get interGap() {
    return this.currentLayout.interGap;
  }
  set interGap(value) {
    this.currentLayout.interGap = value;
    this.updateLayouts();
  }
  get intraGap() {
    return this.currentLayout.intraGap;
  }
  set intraGap(value) {
    this.currentLayout.intraGap = value;
    this.updateLayouts();
  }
  cancel() {
    let i = 0;
    if (!this.changed) {
      return;
    }
    for (i = 0; i < this.backup.length; ++i) {
      // Avoid multiple page rerender...
      this.view._setPageLayout(this.backup[i], i);
    }
    this.view.refreshViewport();
  }
  commit() { }

  constructor(view: SuiScoreViewOperations) {
    super(view);
    let i = 0;
    this.view = view;
    this.layoutManager = this.view.score.layoutManager!;
    this.currentPage = this.view.getFocusedPage();
    for (i = 0; i < this.layoutManager.pageLayouts.length; ++i) {
      this.backup.push(new SmoPageLayout(this.layoutManager.pageLayouts[i]));
    }
    for (i = 1; i < this.layoutManager.pageLayouts.length; ++i) {
      this.options.push({ value: i + 1, label: 'Page ' + (i + 1) });
    }
    this.layouts = this.layoutManager.getPageLayouts();
    this.currentLayout = this.layoutManager.pageLayouts[this.currentPage];
    if (this.layoutManager.pageLayouts.length === 1) {
      this.applyTo = SuiPageLayoutAdapter.layoutTypes.all;
    } else {
      if (this.currentPage >= 1) {
        this.applyTo = SuiPageLayoutAdapter.layoutTypes.remaining;
      } else {
        this.applyTo = SuiPageLayoutAdapter.layoutTypes.all;
      }
    }
  }
}
// ## SuiLayoutDialog
// The layout dialog has page-specific layout parameters
export class SuiPageLayoutDialog extends SuiDialogAdapterBase<SuiPageLayoutAdapter> {
  static get layoutParams() {
    return ['leftMargin', 'rightMargin', 'topMargin', 'bottomMargin', 'interGap', 'intraGap'];
  }
  // ### dialogElements
  // all dialogs have elements define the controls of the dialog.
  static dialogElements: DialogDefinition =
    {
      label: 'Page Layouts', elements:
        [{
          smoName: 'applyToPage',
          defaultValue: -1,
          control: 'SuiDropdownComponent',
          label: 'Apply to Page',
          dataType: 'int',
          options: [{
            value: -1,
            label: 'All'
          }, {
            value: -2,
            label: 'All Remaining'
          }, {
            value: 1,
            label: 'Page 1'
          }]
        }, {
          smoName: 'leftMargin',
          defaultValue: SmoPageLayout.defaults.leftMargin,
          control: 'SuiRockerComponent',
          label: 'Left Margin (px)'
        }, {
          smoName: 'rightMargin',
          defaultValue: SmoPageLayout.defaults.rightMargin,
          control: 'SuiRockerComponent',
          label: 'Right Margin (px)'
        }, {
          smoName: 'topMargin',
          defaultValue: SmoPageLayout.defaults.topMargin,
          control: 'SuiRockerComponent',
          label: 'Top Margin (px)'
        }, {
          smoName: 'bottomMargin',
          defaultValue: SmoPageLayout.defaults.bottomMargin,
          control: 'SuiRockerComponent',
          label: 'Bottom Margin (px)'
        }, {
          smoName: 'interGap',
          defaultValue: SmoPageLayout.defaults.interGap,
          control: 'SuiRockerComponent',
          label: 'Inter-System Margin'
        }, {
          smoName: 'intraGap',
          defaultValue: SmoPageLayout.defaults.intraGap,
          control: 'SuiRockerComponent',
          label: 'Intra-System Margin'
        }],
      staticText: [
        { all: 'Entire Score' },
        { remaining: 'Remaining Pages' },
        { current: 'Current Page' }
      ]
    };
  constructor(params: SuiDialogParams) {
    const adapter = new SuiPageLayoutAdapter(params.view);
    super(SuiPageLayoutDialog.dialogElements, { adapter, ...params });
  }
}