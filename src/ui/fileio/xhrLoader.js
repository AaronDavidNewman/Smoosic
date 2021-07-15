// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
// ## SuiXhrLoader
// Load music xml files from remote, transparently
// unzip mxml files.  Other files (smo, xml, midi) are handled
// transparently with consistent async interface
// eslint-disable-next-line no-unused-vars
export class SuiXhrLoader {
  constructor(path) {
    this.compressed = false;
    this.value = null;
    this.path = path;
    this.binary = false;
    if (path.endsWith('mxl')) {
      this.compressed = true;
      this.binary = true;
    } else if (path.endsWith('mid')) {
      this.binary = true;
    }
  }
  _uncompress(result) {
    const self = this;
    return new Promise((resolve) => {
      JSZip.loadAsync(result).then((zip) => {
        // Find the real xml file in the zip (not metadata)
        const filename = Object.keys(zip.files).find((ss) => ss.indexOf('META') < 0 && ss.endsWith('xml'));
        zip.file(filename).async('text').then((str) => {
          self.value = str;
          resolve();
        });
      });
    });
  }
  loadAsync() {
    const req = new XMLHttpRequest();
    const self = this;
    const promise = new Promise((resolve) => {
      req.addEventListener('load', () => {
        const reader = new FileReader();
        reader.addEventListener('loadend', () => {
          if (!self.compressed) {
            self.value = reader.result;
            resolve();
          } else {
            self._uncompress(reader.result).then(() => { resolve(); });
          }
        });
        if (this.binary) {
          reader.readAsBinaryString(req.response);
        } else {
          reader.readAsText(req.response);
        }
      });
    });
    req.responseType = 'blob';
    req.open('GET', this.path);
    req.send();
    return promise;
  }
}
