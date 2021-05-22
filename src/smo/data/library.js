// ## SmoLibrary
// A class to organize smoosic files (or any format smoosic accepts) into libraries.
// eslint-disable-next-line no-unused-vars
class SmoLibrary {
  constructor(parameters) {
    smoSerialize.serializedMerge(
      SmoLibrary.parameterArray, SmoLibrary.defaults, this);
    Object.keys(parameters.metadata).forEach((key) => {
      this.metadata[key] = parameters.metadata[key];
    });
    this.children = [];
    parameters.children.forEach((childLib) => {
      this.children.push(new SmoLibrary(childLib));
    });
    this.children.forEach((child) => {
      child._inheritMetadata(this.metadata);
    });
  }
  static get metadataNames() {
    return ['name', 'icon', 'tags', 'composer', 'artist', 'copyright',
      'title', 'subtitle', 'movement', 'source'];
  }
  static get formatTypes() {
    return ['smoosic', 'library', 'mxml', 'midi', 'abc'];
  }
  static get libraryTypes() {
    return ['work', 'transcription', 'library', 'collection'];
  }
  static get defaults() {
    if (typeof(SmoLibrary._defaults) === 'undefined') {
      SmoLibrary._defaults = { url: '', format: '', chidren: [], metadata: {} };
    }
    return SmoLibrary._defaults;
  }
  static get parameterArray() {
    return ['children', 'metadata', 'format', 'url'];
  }
  static deserialize(json) {
    return new SmoLibrary(json);
  }
  serialize() {
    const params = {};
    if (this.url) {
      params.url = this.url;
      params.format = this.format;
    }
    params.metadata = JSON.parse(JSON.stringify(this.metadata));
    params.children = [];
    this.children.forEach((child) => {
      params.children.push(child.serialize());
    });
    return params;
  }
  _inheritMetadata(obj) {
    const inherited = [];
    Object.keys(obj).forEach((mn) => {
      if (typeof(this.metadata[mn]) === 'undefined')  {
        inherited.push(JSON.parse(JSON.stringify(obj[mn])));
        this.metadata[mn] = obj[mn];
      }
    });
    this.children.forEach((child) => {
      child._inheritMetadata(inherited);
    });
  }
}
