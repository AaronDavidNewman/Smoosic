// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.
declare var JSZip: any;
// ## SuiFileInput
// Get a string or binary file  from a file input control and transparently
// decompress it if it's mxml file (compressed).  This will read any text  or
// binary file,
// but it will only unzip .mxml files first and has a consistent async interface
export class SuiFileInput {
  compressed: boolean = false;
  binary: boolean = false;
  value: any;
  event: any;
  constructor(evt: any) {
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
    return new Promise<void>((resolve) => {
      JSZip.loadAsync(self.value).then((zip: any) => {
        // Find the real xml file in the zip (not metadata)
        const filename =
          Object.keys(zip.files).find((ss) => ss.indexOf('META') < 0 && ss.endsWith('xml'));
        zip.file(filename).async('text').then((str: any) => {
          self.value = str;
          resolve();
        });
      });
    });
  }
  loadAsync() {
    const self = this;
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (file) => {
        if (file === null || file.target === null || file.target.result === null) {
          reject();
          return;
        }
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
        reader.readAsArrayBuffer(self.event.target.files[0])
      } else {
        reader.readAsText(self.event.target.files[0]);
      }
    });
  }
}
