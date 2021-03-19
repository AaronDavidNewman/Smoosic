
class layoutDebug {
  static get values() {
    return {
      pre: 1,
      post: 2,
      adjust: 4,
      system: 8,
      note: 16,
      adjustHeight: 32,
      measureHistory: 64,
      textEditorHistory: 128,
      dialogEvents: 256
    };
  }

    static get classes() {
      return {
        pre: 'measure-place-dbg',
        post: 'measure-render-dbg',
        adjust: 'measure-adjust-dbg',
        system: 'system-place-dbg',
        note: 'measure-note-dbg',
        adjustHeight: 'measure-adjustHeight-dbg',
        measureHistory: '',
        textEditorHistory: '',
        dialogEvents: ''
      };
    }
    static get codeRegions() {
      return {
        COMPUTE: 0,
        PREFORMATA: 1,
        PREFORMATB: 2,
        PREFORMATC: 3,
        FORMAT: 4,
        RENDER: 5,
        POST_RENDER: 6,
        MAP: 7,
        LAST: 7
      };
    }
    static get codeRegionStrings() {
      return ['COMPUTE', 'PREFORMATA', 'PREFORMATB', 'PREFORMATC', 'FORMAT', 'RENDER', 'POST_RENDER', 'MAP'];
    }

	static get mask() {
    if (typeof(layoutDebug._flags) === 'undefined') {
      layoutDebug._flags = 0;
    }
    return layoutDebug._flags;
	}
  static get timestampHash() {
    if (typeof(layoutDebug.timestampInstance) === 'undefined') {
      layoutDebug.timestampInstance = {};
      layoutDebug.clearTimestamps();
    }
    return layoutDebug.timestampInstance;
  }
  static clearTimestamps() {
    for (var i = 0; i <= layoutDebug.codeRegions.LAST; ++i) {
      layoutDebug.timestampHash[i] = 0;
    }
  }

  static setTimestamp(region, millis) {
    layoutDebug.timestampHash[region] += millis;
  }
  static printTimeReport() {
    let total = 0;
    let report = {};
    let i = 0;
    for (i = 0;i <= layoutDebug.codeRegions.LAST; ++i) {
      total += layoutDebug.timestampHash[i];
      report[layoutDebug.codeRegionStrings[i]] = {
        time: layoutDebug.timestampHash[i], percent: 0
      };
    }
    report.total = total;
    for (i = 0; i <= layoutDebug.codeRegions.LAST; ++i) {
      report[layoutDebug.codeRegionStrings[i]].percent =
        Math.round((report[layoutDebug.codeRegionStrings[i]].time * 100) / report.total);
    }
    console.log(JSON.stringify(report, null, ' '));
  }

  static set mask(value) {
    layoutDebug._flags = value;
  }

  static flagSet(value) {
    return layoutDebug.mask & layoutDebug.values[value];
  }

  static clearAll(svg) {
    layoutDebug._flags = 0;
  }
  static setAll() {
    layoutDebug._flags = 1+2+4+8+16+32+64+128+256;
  }
  static setRenderFlags() {
    layoutDebug._flags = 1+2+4+8+16+32;
  }
  static clearDebugBoxes(value) {
    if (layoutDebug.flagSet(value)) {
      var selector = 'g.'+layoutDebug.classes[value];
      $(selector).remove();
    }
  }
  static debugBox(svg,box,flag) {
    if (!box) {
      return;
    }
    if (!box.height) {
      box.height=1;
    }
    if (layoutDebug.flagSet(flag)) {
      svgHelpers.debugBox(svg, box, layoutDebug.classes[flag]);
    }
  }
  static clearFlag(value) {
    clearFlagSvg(value);
    var flag = layoutDebug.values[value];
    if (typeof(layoutDebug._flags) == 'undefined') {
      layoutDebug._flags = 0;
    }
    layoutDebug._flags = layoutDebug._flags & (~flag);
  }

	static setFlag(value) {
    var flag = layoutDebug.values[value];
    if (typeof(layoutDebug._flags) == 'undefined') {
        layoutDebug._flags = flag;
        return;
    }
    layoutDebug._flags |= flag;
	}

  static get textDebug() {
    if (!layoutDebug['_textDebug']) {
      layoutDebug['_textDebug'] = [];
    }
    return layoutDebug['_textDebug']
  }

  static addTextDebug(value) {
    if (!layoutDebug.mask & layoutDebug.textEditorHistory) {
      return;
    }
    if (!layoutDebug['_textDebug']) {
      layoutDebug['_textDebug'] = [];
    }
    layoutDebug['_textDebug'].push(value);
    console.log(value);
  }

  static addDialogDebug(value) {
    if (!layoutDebug.mask & layoutDebug.dialogEvents) {
      return;
    }
    if (!layoutDebug['_dialogEvents']) {
      layoutDebug['_dialogEvents'] = [];
    }
    layoutDebug['_dialogEvents'].push(value);
    console.log(value);
  }

  static measureHistory(measure,oldVal,newVal,description) {
    if (layoutDebug.flagSet('measureHistory')) {
      var oldExp = (typeof(measure.svg[oldVal]) == 'object') ? JSON.stringify(measure.svg[oldVal]).replace(/"/g,'') : measure.svg[oldVal];
      var newExp = (typeof(newVal) == 'object') ? JSON.stringify(newVal).replace(/"/g,'') : newVal;
      measure.svg.history.push(oldVal + ': '+oldExp +'=> '+newExp + ' ' + description);
    }
  }
}
