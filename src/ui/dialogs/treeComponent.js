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
    this.persistControls = false;
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
        const button = $('ul.tree li[data-value="' + option.value + '"] button');
        if (button.length && button.hasClass('expanded')) {
          option.expanded = true;
        }
        if (button.length && button.hasClass('collapsed')) {
          option.collapsed = true;
        }
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
    let treeClass = 'tree-branch';
    let buttonClass = 'expander';
    if (this.persistControls && option.expanded) {
      buttonClass += ' expanded icon-minus';
    }
    if (this.persistControls && option.collapsed) {
      buttonClass += ' collapsed icon-plus';
      treeClass += ' collapsed';
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
    this.persistControls = true;
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
    const option = this.options.find((o) => o.value === value);
    const input = this._getInputElement();
    const li = $(input).find('li[data-value="' + value + '"]');
    $(li).addClass('selected');
    if (option.format === 'library') {
      $(li).find('button').first().addClass('expanded icon-minus');
    }
    this.bindTreeControls();
  }
  bindTreeControls() {
    $('ul.tree button.expanded').off('click').on('click', (evt) => {
      const button = evt.currentTarget;
      $(button).removeClass('expanded').removeClass('icon-minus').addClass('icon-plus').addClass('collapsed');
      $(button).closest('li').addClass('collapsed');
      this.bindTreeControls();
    });
    $('ul.tree button.collapsed').off('click').on('click', (evt) => {
      const button = evt.currentTarget;
      $(button).addClass('expanded').addClass('icon-minus').removeClass('icon-plus').removeClass('collapsed');
      $(button).closest('li').removeClass('collapsed');
      this.bindTreeControls();
    });
  }

  bind() {
    const input = this._getInputElement();
    this.bindTreeControls();
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
