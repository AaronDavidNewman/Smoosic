// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
import { SuiXhrLoader } from './xhrLoader';
import { PromiseHelpers } from '../../common/promiseHelpers';
import { smoSerialize } from '../../common/serializationHelpers';
// ## SmoLibrary
// A class to organize smoosic files (or any format smoosic accepts) into libraries.
// eslint-disable-next-line no-unused-vars
export class SmoLibrary {
  constructor(parameters) {
    this.loaded = false;
    this.parentLib = {};
    if (parameters.url) {
      this.url = parameters.url;
    } else if (parameters.data) {
      this.initialize(parameters.data);
    }
  }
  initialize(parameters) {
    smoSerialize.serializedMerge(
      SmoLibrary.parameterArray, SmoLibrary.defaults, this);
    // if the object was loaded from URL, use that.
    if (!this.url) {
      this.url = parameters.url;
    }
    this.format = parameters.format;
    Object.keys(parameters.metadata).forEach((key) => {
      this.metadata[key] = parameters.metadata[key];
    });
    this.children = [];
    if (typeof(parameters.children) !== 'undefined') {
      parameters.children.forEach((childLib) => {
        this.children.push(new SmoLibrary({ data: childLib }));
      });
    }
    this.children.forEach((child) => {
      child._inheritMetadata(this);
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
      SmoLibrary._defaults = { chidren: [], metadata: {} };
    }
    return SmoLibrary._defaults;
  }
  static get parameterArray() {
    return ['children', 'metadata', 'format', 'url'];
  }
  load() {
    const self = this;
    if (this.loaded) {
      return PromiseHelpers.emptyPromise();
    }
    const loader = new SuiXhrLoader(this.url);
    return new Promise((resolve) => {
      loader.loadAsync().then(() => {
        const jsonObj = JSON.parse(loader.value);
        self.initialize(jsonObj);
        self.loaded = true;
        resolve();
      });
    });
  }
  _inheritMetadata(parent) {
    Object.keys(parent.metadata).forEach((mn) => {
      if (typeof(this.metadata[mn]) === 'undefined')  {
        this.metadata[mn] = parent[mn];
      }
    });
    this.parentLib = { name: parent.metadata.name, value: parent };
    this.children.forEach((child) => {
      child._inheritMetadata(this);
    });
  }
}
