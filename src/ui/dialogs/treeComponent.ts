// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiComponentBase, SuiDialogNotifier } from './components/baseComponent';
import { htmlHelpers } from '../../common/htmlHelpers';
declare var $: any;

export interface TreeComponentOption {
  label: string,
  value: string | undefined, 
  parent: string | undefined,
  format: string,
  expanded: boolean
}

export interface SuiTreeComponentParams {
  id: string,
  classes: string,
  label: string,
  smoName: string,
  control: string,
  root: string,
  options: TreeComponentOption[]
}
// ### SuiDropdownComponent
// simple dropdown select list.
export class SuiTreeComponent extends SuiComponentBase {
  persistControls: boolean = false;
  tree: Record<string, TreeComponentOption[]> = {};
  options: TreeComponentOption[] = [];
  root: string;
  value: string;
  constructor(dialog: SuiDialogNotifier, parameter: SuiTreeComponentParams) {
    super(dialog, parameter);
    this.root = parameter.root;
    this.value = this.root;
    this.options = parameter.options;
    this.calculateOptionTree();
  }
  calculateOptionTree() {
    this.tree = {};
    this.options.forEach((option) => {
      if (option.parent) {
        if (!(this.tree[option.parent])) {
          this.tree[option.parent] = [];
        }
        this.tree[option.parent].push(option);
      }
    });
  }
  getNodesWithParent(parent: string | undefined) {
    return this.options.filter((oo) => oo.parent === parent);
  }
  appendOptionRecurse(b: any, option: TreeComponentOption, level: number) {
    const children = this.getNodesWithParent(option.value);
    let treeClass = 'tree-branch';
    let buttonClass = 'expander';
    if (option.format === 'library' && children.length > 0) {
      if (this.persistControls && option.expanded) {
        buttonClass += ' expanded icon-minus';
      }
      if (this.persistControls && !option.expanded) {
        buttonClass += ' collapsed icon-plus';
        treeClass += ' collapsed';
      }
    }
    const current = b('li').classes(treeClass).attr('data-value', option.value).attr('data-level', level);
    current.append(b('button').classes(buttonClass));
    current.append(b('a').classes('tree-link').text(option.label));
    if (option.format === 'library') {
      current.append(b('span').classes('file-type icon-book'));
    } else {
      current.append(b('span').classes('file-type icon-file-music'));
    }
    children.forEach((child) => {
      current.append(b('ul').append(this.appendOptionRecurse(b, child, level + 1)));
    });
    return current;
  }
  _createTree(builder: any, ul: any) {
    // this.checkDefault(s, b);
    const options = this.getNodesWithParent(this.root);
    options.forEach((option) => {
      ul.append(this.appendOptionRecurse(builder, option, 0));
    });
  }

  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    const r = b('div').classes(this.makeClasses('dropdownControl smoControl')).attr('id', id).attr('data-param', this.smoName);
    const ul = b('ul').classes('tree tree-root');
    this._createTree(b, ul);
    r.append(ul);
    this.persistControls = true;
    return r;
  }
  updateOptions(options: TreeComponentOption[]) {
    this.options = options;
    this.calculateOptionTree();
    const parentEl = $(this._getInputElement());
    const oldUl = $(parentEl).find('ul.tree-root');
    $(oldUl).remove();
    const b = htmlHelpers.buildDom;
    const ul = b('ul').classes('tree tree-root');
    this._createTree(b, ul);
    $(parentEl).append(ul.dom());
    this.bind();
  }

  unselect() {
    $(this._getInputElement())[0].selectedIndex = -1;
    $(this._getInputElement()).blur();
  }

  _getInputElement() {
    var pid = this.parameterId;
    return $(this.dialog.dgDom.element).find('#' + pid);
  }
  getValue() {
    return this.value;
  }
  setValue(value: string) {
    $('ul.tree li').removeClass('selected');
    const option = this.options.find((o) => o.value === value);
    const input = this._getInputElement();
    const li = $(input).find('li[data-value="' + value + '"]');
    $(li).addClass('selected');
    if (option && option.format === 'library') {
      $(li).find('button').first().addClass('expanded icon-minus');
    }
    this.bindTreeControls();
  }
  bindTreeControls() {
    $('ul.tree button.expanded').off('click').on('click', (evt: any) => {
      const button = evt.currentTarget;
      $(button).removeClass('expanded').removeClass('icon-minus').addClass('icon-plus').addClass('collapsed');
      $(button).closest('li').addClass('collapsed');
      this.bindTreeControls();
    });
    $('ul.tree button.collapsed').off('click').on('click', (evt: any) => {
      const button = evt.currentTarget;
      $(button).addClass('expanded').addClass('icon-minus').removeClass('icon-plus').removeClass('collapsed');
      $(button).closest('li').removeClass('collapsed');
      this.bindTreeControls();
    });
  }

  bind() {
    const input = this._getInputElement();
    this.bindTreeControls();
    $(input).find('a.tree-link').each((ix: number, el: any) => {
      $(el).removeClass('selected');
      $(el).off('click').on('click', (ev: any) => {
        const li = $(ev.currentTarget).closest('li.tree-branch');
        $(li).addClass('selected');
        this.value = $(li).attr('data-value');
        this.handleChanged();
      });
    });
  }
}
