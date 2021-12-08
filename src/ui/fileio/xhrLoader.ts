// [Smoosic](https://github.com/AaronDavidNewman/Smoosic)
// Copyright (c) Aaron David Newman 2021.

declare var JSZip: any;

/**
 * Load a file.  Guess based on the extension whether the file is string or binary
 */
export class SuiXhrLoader {
  compressed: boolean = false;
  value: any = null;
  path: string;
  binary: boolean = false;
  isMidi: boolean = false;
  constructor(path: string) {
    this.path = path;
    if (path.endsWith('mxl')) {
      this.compressed = true;
      this.binary = true;
    } else if (path.endsWith('mid')) {
      this.isMidi = true;
      this.binary = true;
    }
  }
  _uncompress(result: any): Promise<void> {
    const self = this;
    return new Promise((resolve) => {
      JSZip.loadAsync(result).then((zip: any) => {
        // Find the real xml file in the zip (not metadata)
        const filename = Object.keys(zip.files).find((ss) => ss.indexOf('META') < 0 && ss.endsWith('xml'));
        zip.file(filename).async('text').then((str: any) => {
          self.value = str;
          resolve();
        });
      });
    });
  }
  /**
   * 
   * @returns promise resolved when the target file is loaded
   */
  loadAsync(): Promise<void> {
    const req = new XMLHttpRequest();
    const self = this;
    const promise = new Promise<void>((resolve) => {
      req.addEventListener('load', () => {
        const reader = new FileReader();
        reader.addEventListener('loadend', () => {
          if (self.isMidi) {
            self.value = new Uint8Array(reader.result as ArrayBuffer);
            resolve();
          }
          else if (!self.compressed) {
            self.value = reader.result;
            resolve();
          } else {
            self._uncompress(reader.result).then(() => { resolve(); });
          }
        });
        if (this.isMidi) {
          reader.readAsArrayBuffer(req.response);
        }
        else if (this.binary) {
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
