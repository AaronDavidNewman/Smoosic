// ## SmoLibraryNode
// The node with link for online libraries of smoosic
class SmoLibraryNode {
  constructor(nodeInfo) {
    smoSerialize.serializedMerge(
      SmoLibraryNode.parameterArray, nodeInfo, this);
  }
  static get parameterArray() {
    return ['name', 'url', 'format', 'icon', 'tags', 'composer', 'artist', 'copyright',
      'title', 'subtitle', 'movement', 'source']
  }
  static get defaults() {
    if (typeof(SmoLibraryNode._defaults) === 'undefined') {
      SmoLibraryNode._defaults = {};
      SmoLibraryNode.parameterArray.forEach((pp) => {
        SmoLibraryNode._defaults[pp] = '';
      });
    }
    return SmoLibraryNode._defaults;
  }
  serialize() {
    const params = {};
    smoSerialize.serializedMergeNonDefault(SmoLibrary.defaults,
      SmoLibrary.parameterArray, this, params);
    return params;
  }
}
// ## SmoLibrary
// A class to organize smoosic files (or any format smoosic accepts) into libraries.
class SmoLibrary {
    constructor(parameters) {
      smoSerialize.serializedMerge(
        SmoLibrary.parameterArray, SmoLibrary.defaults, this);
        smoSerialize.serializedMerge(
          SmoLibrary.parameterArray, parameters, this);
      this.children = [];
      parameters.children.forEach((childLib) => {
        this.children.push(new SmoLibrary(childLib));
      });
      this.nodes = [];
      parameters.nodes.forEach((node) => {
        this.nodes.push(new SmoLibraryNode(node));
      });
    }
    static get defaults() {
      return {
        children: [],
        nodes: [],
        name: 'Library of Smoosic',
        tags: []
      };
    }
    static get parameterArray() {
      return ['name', 'tags']
    }
    static deserialize(json) {
      return new SmoLibrary(json);
    }
    serialize() {
      const params = {};
      smoSerialize.serializedMergeNonDefault(SmoLibrary.defaults,
        SmoLibrary.parameterArray, this, params);
      params.children = [];
      this.children.forEach((child) => {
        params.children.push(child.serialize());
      });
      return params;
    }
}
