// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
// ## SuiFileInput
// Get a string or binary file  from a file input control and transparently
// decompress it if it's mxml file (compressed).  This will read any text  or
// binary file,
// but it will only unzip .mxml files first and has a consistent async interface
// eslint-disable-next-line no-unused-vars
class SuiFileInput {
  constructor(evt) {
    this.compressed = false;
    this.binary = false;
    this.value = null;
    this.event = evt;
    if (evt.target.files[0].name.endsWith('.mxl')) {
      this.compressed = true;
      this.binary = true;
    } else if (evt.target.files[0].name.endsWith('.mid')) {
      this.binary = true;
    }
  }
  _handleZip() {
    const self = this;
    return new Promise((resolve) => {
      JSZip.loadAsync(self.value).then((zip) => {
        // Find the real xml file in the zip (not metadata)
        const filename =
          Object.keys(zip.files).find((ss) => ss.indexOf('META') < 0 && ss.endsWith('xml'));
        zip.file(filename).async('text').then((str) => {
          self.value = str;
          resolve();
        });
      });
    });
  }
  loadAsync() {
    const self = this;
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (file) => {
        self.value = file.target.result;
        if (!self.compressed) {
          resolve();
        } else {
          self._handleZip().then(() => {
            resolve();
          });
        }
      };
      if (self.binary) {
        reader.readAsBinaryString(self.event.target.files[0]);
      } else {
        reader.readAsText(self.event.target.files[0]);
      }
    });
  }
}
