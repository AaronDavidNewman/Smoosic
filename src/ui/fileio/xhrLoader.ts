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
  async _uncompress(result: any): Promise<string> {
    const self = this;
    const zip = await JSZip.loadAsync(result);
    // Find the real xml file in the zip (not metadata)
    const filename = Object.keys(zip.files).find((ss) => ss.indexOf('META') < 0 && ss.endsWith('xml'));
    self.value = await zip.file(filename).async('text');
    return self.value
  }
  /**
   * 
   * @returns promise resolved when the target file is loaded
   */
  loadAsync(): Promise<string | ArrayBuffer> {
    const req = new XMLHttpRequest();
    const self = this;
    const promise = new Promise<string>((resolve) => {
      req.addEventListener('load', () => {
        const reader = new FileReader();
        reader.addEventListener('loadend', async () => {
          if (self.isMidi) {
            self.value = new Uint8Array(reader.result as ArrayBuffer);
            resolve(self.value);
          }
          else if (!self.compressed) {
            self.value = reader.result;
            resolve(self.value);
          } else {
            self.value = await self._uncompress(reader.result);
            resolve(self.value);
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
