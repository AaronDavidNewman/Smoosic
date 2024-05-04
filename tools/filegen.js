const { promisify } = require('util');
const { resolve } = require('path');
const fs = require('fs');
const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const basePath=resolve('./src','.');

async function getFiles(dir) {
  const subdirs = await readdir(dir);
  let files = await Promise.all(subdirs.map(async (subdir) => {
    const res = resolve(dir, subdir);
    const asset =  (await stat(res));
    if (asset.isDirectory()) {
      return getFiles(res);
    } else {
      return res;
    }
  }));
  
  files = files.reduce((a, f) => a.concat(f), []);
  const rv = [];
  files.forEach((ff) => {
    if (typeof(ff) !== 'string') {
      rv.push(ff);
    } else if (ff.endsWith('.ts')) {
      let str = ff.replace(basePath, './src/');
      str = str.replace('\\', '/');
      str = str.replace('//', '/');
      rv.push(str);
    }
  })
  return rv;
}
console.log('base is ' + basePath);
getFiles('./src')
.then((files) => {
  files.forEach((file) => {
    let str = file.replace('.ts', '');
    str = "export * from '" + str + "';";
    console.log(str);
  });
})
  .catch(e => console.error(e));




