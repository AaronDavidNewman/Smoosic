
class SmoScoreModifierBase {
  constructor(ctor) {
    this.ctor = ctor;
    if (!this['attrs']) {
      this.attrs = {
        id: VF.Element.newID(),
        type: ctor
      };
    } else {
            console.log('inherit attrs');
    }
  }

  static deserialize(jsonObj) {
    var ctor = eval(jsonObj.ctor);
    var rv = new ctor(jsonObj);
    return rv;
  }
}

class SmoSystemGroup extends SmoScoreModifierBase {
  constructor(params) {
    super('SmoSystemGroup');
    smoSerialize.serializedMerge(SmoSystemGroup.attributes,SmoSystemGroup.defaults,this);
    smoSerialize.serializedMerge(SmoSystemGroup.attributes, params, this);

    if (!this['attrs']) {
      this.attrs = {
        id: VF.Element.newID(),
        type: 'SmoStaffHairpin'
      };
    } else {
      console.log('inherit attrs');
    }
  }
  static get defaults() {
    return {
      leftConnector:SmoSystemGroup.connectorTypes.single,
      rightConnector:SmoSystemGroup.connectorTypes.single,
      mapType:SmoSystemGroup.mapTypes.allMeasures,
      text:'',
      shortText:'',
      justify:true,
      startSelector:{staff:0,measure:0},
      endSelector:{staff:0,measure:0}
    }
  }
  leftConnectorVx() {
    switch (this.leftConnector) {
      case SmoSystemGroup.connectorTypes.single:
        return VF.StaveConnector.type.SINGLE_LEFT;
      case SmoSystemGroup.connectorTypes.double:
        return VF.StaveConnector.type.DOUBLE_LEFT;
      case SmoSystemGroup.connectorTypes.brace:
        return VF.StaveConnector.type.BRACE;
     case SmoSystemGroup.connectorTypes.bracket:
     default:
      return VF.StaveConnector.type.BRACKET;
    };
  }
  rightConnectorVx() {
    switch (this.rightConnector) {
      case SmoSystemGroup.connectorTypes.single:
       return StaveConnector.type.SINGLE_RIGHT;
      case SmoSystemGroup.connectorTypes.double:
      default:
       return StaveConnector.type.DOUBLE_RIGHT;
    };
  }
  static get connectorTypes() {
    return {brace:0,bracket:1,single:2,double:3};
  }
  static get mapTypes() {
    return {allMeasures:0,range:1};
  }
  static get attributes() {
    return ['leftConnector', 'rightConnector','text','shortText','justify',
      'startSelector','endSelector','mapType'];
  }
  serialize() {
    var params = {};
    smoSerialize.serializedMergeNonDefault(SmoSystemGroup.defaults,SmoSystemGroup.attributes,this,params);
    params.ctor = 'SmoSystemGroup';
    return params;
  }
}

// ## SmoTextGroup
// A grouping of text that can be used as a block for
// justification, alignment etc.
class SmoTextGroup extends SmoScoreModifierBase {
  static get justifications() {
    return {
      LEFT: 1,
      RIGHT: 2,
      CENTER: 3
    };
  }
  // The position of block n relative to block n-1.  Each block
  // has it's own position.  Justification is inter-block.
  static get relativePosition() {
    return { ABOVE: 1, BELOW: 2, LEFT: 3, RIGHT: 4 };
  }
  static get defaults() {
    return { textBlocks:[],
      justification: SmoTextGroup.justifications.LEFT
    };
  }
  static get attributes() {
    return ['textBlocks','justification'];
  }
  static deserialize(jObj) {
    var blocks = [];
    jObj.textBlocks.forEach((st) => {
      var tx = new SmoScoreText(st.text);
      blocks.push({text: tx, position: st.position});
    });
    return new SmoTextGroup({blocks: blocks});
  }
  serialize() {
    smoSerialize.serializedMergeNonDefault(SmoTextGroup.defaults,SmoTextGroup.attributes,this,params);
    params.ctor = 'SmoTextGroup';
    return params;
  }
  _isScoreText(st) {
    return st.ctor && st.ctor === 'SmoScoreText';
  }
  constructor(params) {
    params = params ? params : {};
    super('SmoTextGroup');
    this.textBlocks = [];
    this.backupBlocks = [];
    Vex.Merge(this,SmoTextGroup.defaults);
    Vex.Merge(this,params);
    if (params.blocks) {
      params.blocks.forEach((block) => {
        if (this._isScoreText(block)) {
          this.textBlocks.push({text: block, position: SmoTextGroup.relativePosition.RIGHT});
        } else if (this._isScoreText(block.text)) {
          this.textBlocks.push(block);
        } else {
          throw("Invalid object in SmoTextGroup");
        }
      });
    }
  }
  addScoreText(scoreText,prevBlock,position) {
    if (!this._isScoreText(scoreText)) {
      throw('Need SmoScoreText to add to TextGroup');
    }
    if (!prevBlock) {
      this.textBlocks.push({text:scoreText,position: position});
    } else {
      var bbid =  (typeof(prevBlock) === 'string') ? prevBlock : prevBlock.attrs.id;
      var ix = this.textBlocks.findIndex((bb) => bb.attrs.id === bbid);
      this.textBlocks.splice(ix,0,nextBlock);
    }
  }
  ul() {
    var rv = {x:0,y:0};
    this.textBlocks.forEach((block) => {
      rv.x = block.text.x > rv.x ? block.text.x : rv.x;
      rv.y = block.text.y > rv.y ? block.text.y : rv.y;
    });
    return rv;
  }
  removeBlock(scoreText) {
    if (!this._isScoreText(scoreText)) {
      throw('Need SmoScoreText to add to TextGroup');
    }
    var bbid =  (typeof(scoreText) === 'string') ? scoreText : scoreText.attrs.id;
    var ix = this.textBlocks.findIndex((bb) => bb.attrs.id === bbid);
    this.textBlocks.splice(ix,1);
  }
  offsetX(offset) {
    this.textBlocks.forEach((block) => {
      block.text.offsetX(offset);
    });
  }
  offsetY(offset) {
    this.textBlocks.forEach((block) => {
      block.text.offsetY(offset);
    });
  }

  scaleInPlace(factor) {
    this.textBlocks.forEach((block) => {
      block.text.scaleInPlace(factor);
    });
  }
  scaleXInPlace(factor) {
    this.textBlocks.forEach((block) => {
      block.text.scaleXInPlace(factor);
    });
  }
  scaleYInPlace(factor) {
    this.textBlocks.forEach((block) => {
      block.text.scaleYInPlace(factor);
    });
  }

  backupParams() {
    this.textBlocks.forEach((block) => {
      block.text.backupParams();
    });
  }

  restoreParams() {
    this.textBlocks.forEach((block) => {
      block.text.restoreParams();
    });
  }
}
// ## SmoScoreText
// Identify some text in the score, not associated with any musical element, like page
// decorations, titles etc.
class SmoScoreText extends SmoScoreModifierBase {

  static _pointFromEm(size) {
    var ptString = size.substring(0,scoreText.fontInfo.size.length - 2);
    return parseFloat(ptString) * 14;
  }
  // convert EM to a number, or leave as a number etc.
  static fontPointSize(size) {
    if (typeof(size) === 'number') {
      return size;
    }
    var ptString = size.substring(0,size.length - 2); // TODO: work with px, pt
    return parseFloat(ptString) * 14;
  }

  static get paginations() {
    return {every:'every',even:'even',odd:'odd',once:'once',subsequent:'subsequent'}
  }
  static get positions() {
    return {title:'title',copyright:'copyright',footer:'footer',header:'header',custom:'custom'};
  }
  static get justifications() {
    return {left:'left',right:'right',center:'center'};
  }
  static get fontFamilies() {
    return {serif:'Merriweather,serif',sansSerif:'Roboto,sans-serif',monospace:'monospace',cursive:'cursive',
      times:'Merriweather',arial:'Arial',helvitica:'Helvitica'};
  }
  // If box model is 'none', the font and location determine the size.
  // spacing and spacingGlyph fit the box into a container based on the svg policy
  static get boxModels() {
    return {none:'none',spacing:'spacing',spacingAndGlyphs:'spacingAndGlyphs',wrap:'wrap'};
  }
  static get defaults() {
    return {
      x: 15,
      y: 15,
      width: 0,
      height: 0,
      text: 'Smoosic',
      fontInfo: {
        size: '1em',
        family: SmoScoreText.fontFamilies.times,
        style:'normal',
        weight:'normal'
      },
      fill:'black',
      rotate: 0,
      justification: SmoScoreText.justifications.left,
      classes: 'score-text',
      boxModel: 'none',
      scaleX: 1.0,
      scaleY: 1.0,
      translateX: 0,
      translateY: 0,
      pagination: 'once',
      position: 'custom',
      autoLayout: false // set to true if one of the pre-canned positions are used.
    };
  }
  static toSvgAttributes(inst) {
    var rv=[];
    var fkeys = Object.keys(inst.fontInfo);
    var fontFamily = SmoScoreText[inst.fontInfo.family] ? SmoScoreText[inst.fontInfo.family] : inst.fontInfo.family;
    fkeys.forEach((key) => {
      var n=JSON.parse('{"font-'+key+'":"'+inst.fontInfo[key]+'"}');
      if (n['font-family']) {
        n['font-family'] = fontFamily;
      }
      rv.push(n);
    });

    var attrs = SmoScoreText.attributes.filter((x) => {return x !== 'fontInfo' && x != 'boxModel'});
    rv.push({fill:inst.fill});
    rv.push({x:inst.x});
    rv.push({y:inst.y});
    if (inst.boxModel !== 'none' && inst.width) {
      var len = ''+inst.width+'px';
      rv.push({textLength:len});
      // rv.push({lengthAdjust:inst.boxModel});
    }
    rv.push({ transform: 'translate (' + inst.translateX + ' ' + inst.translateY + ') scale (' +
        inst.scaleX + ' ' + inst.scaleY + ')'} );
    return rv;
  }

  getText() {
    return this.text;
  }

  toSvgAttributes() {
    return SmoScoreText.toSvgAttributes(this);
  }

  // ### backupParams
  // For animation or estimation, create a copy of the attributes that can be modified without affecting settings.
  backupParams() {
    this.backup={};
    smoSerialize.serializedMerge(SmoScoreText.attributes, this, this.backup);
    return this.backup;
  }

  restoreParams() {
    smoSerialize.serializedMerge(SmoScoreText.attributes, this.backup, this);
  }//

  offsetX(offset) {
    this.x += offset;
  }
  offsetY(offset) {
    this.y += offset;
  }

  serialize() {
  var params = {};
    smoSerialize.serializedMergeNonDefault(SmoScoreText.defaults,SmoScoreText.attributes,this,params);
    params.ctor = 'SmoScoreText';
    return params;
  }
  static get attributes() {
    return ['x','y','text','pagination','position','fontInfo','classes',
    'boxModel','justification','fill','width','height','scaleX','scaleY','translateX','translateY','autoLayout'];
  }

  // scale the text without moving it.
  scaleInPlace(factor) {
    this.fontInfo.size = SmoScoreText.fontPointSize(this.fontInfo.size) * factor;
  }
  scaleXInPlace(factor) {
    this.scaleX = factor;
    var deltax = this.x - this.x*this.scaleX;
    this.translateX = deltax;
  }
  scaleYInPlace(factor) {
    this.scaleY = factor;
    var deltay = this.y - this.y*this.scaleY;
    this.translateY = deltay;
  }
  constructor(parameters) {
    super('SmoScoreText');
    parameters = parameters ? parameters : {};
    this.backup={};
    this.edited = false; // indicate to UI that the actual text has not been edited.

    smoSerialize.serializedMerge(SmoScoreText.attributes, SmoScoreText.defaults, this);
    smoSerialize.serializedMerge(SmoScoreText.attributes, parameters, this);
    if (!this.classes) {
      this.classes='';
    }
    if (this.classes.indexOf(this.attrs.id) < 0) {
      this.classes += ' '+this.attrs.id;
    }
    if (this.boxModel === SmoScoreText.boxModels.wrap) {
      this.width = parameters.width ? this.width : 200;
      this.height = parameters.height ? this.height : 150;
      if (!parameters.justification) {
        this.justification = this.position === SmoScoreText.positions.copyright
            ? SmoScoreText.justifications.right : SmoScoreText.justifications.center;

      }
    }
    if (this.position != SmoScoreText.positions.custom && !parameters['autoLayout']) {
      this.autoLayout = true;
      if (this.position == SmoScoreText.positions.title) {
        this.fontInfo.size='1.8em';
      } else {
        this.fontInfo.size='.6em';
      }
    }
  }
}
