// ### SuiDropdownComponent
// simple dropdown select list.
// eslint-disable-next-line no-unused-vars
class SuiTreeComponent extends SuiComponentBase {
  constructor(dialog, parameter) {
    super(parameter);
    smoSerialize.filteredMerge(
      ['parameterName', 'smoName', 'root', 'options', 'control', 'label', 'dataType', 'disabledOption'], parameter, this);
    if (!this.defaultValue) {
      this.defaultValue = 0;
    }
    if (!this.dataType) {
      this.dataType = 'string';
    }
    this.dialog = dialog;
    this.calculateOptionTree();
  }
  calculateOptionTree() {
    this.tree = {};
    this.options.forEach((option) => {
      if (option.parent) {
        if (typeof(this.tree[option.parent] === 'undefined')) {
          this.tree[option.parent] = [];
        }
        this.tree[option.parent].push(option);
      }
    });
  }
  getNodesWithParent(parent) {
    return this.options.filter((oo) => oo.parent === parent);
  }
  get parameterId() {
    return this.dialog.id + '-' + this.parameterName;
  }
  appendOptionRecurse(b, option, level) {
    const children = this.getNodesWithParent(option.value);
    const current = b('li').classes('tree-branch').attr('data-value', option.value).attr('data-level', level);
    current.append(b('button').classes('expander'));
    current.append(b('a').classes('tree-link').text(option.label));
    children.forEach((child) => {
      current.append(b('ul').append(this.appendOptionRecurse(b, child, level + 1)));
    });
    return current;
  }
  _createTree(builder, ul) {
    // this.checkDefault(s, b);
    const options = this.getNodesWithParent(this.root);
    options.forEach((option) => {
      ul.append(this.appendOptionRecurse(builder, option, 0));
    });
  }

  get html() {
    const b = htmlHelpers.buildDom;
    const id = this.parameterId;
    const r = b('div').classes(this.makeClasses('dropdownControl smoControl')).attr('id', id).attr('data-param', this.parameterName);
    const ul = b('ul').classes('tree tree-root');
    this._createTree(b, ul);
    r.append(ul);
    return r;
  }
  updateOptions(options) {
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
  setValue(value) {
    $('ul.tree li').removeClass('selected');
    const input = this._getInputElement();
    $(input).find('li[data-value="' + value + '"]').addClass('selected');
  }

  bind() {
    const input = this._getInputElement();
    $(input).find('a.tree-link').each((ix, el) => {
      $(el).removeClass('selected');
      $(el).off('click').on('click', (ev) => {
        const li = $(ev.currentTarget).closest('li.tree-branch');
        this.value = $(li).attr('data-value');
        $(li).addClass('selected');
        this.handleChanged();
      });
    });
  }
}
