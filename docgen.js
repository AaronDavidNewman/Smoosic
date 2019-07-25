const fs = require('fs');
const readline = require('readline');

var lines = [];

async function processLineByLine(filename) {

    const rl = readline.createInterface({
            input: fs.createReadStream(filename),
            crlfDelay: Infinity
        });

    var md = 0;
    var re = /\/\/\s+(#+.+)/;
    var cc = /\/\/(.+)/;
    for await(const line of rl) {
        if (!md) {
            if (re.test(line)) {

                lines.push(line.replace(re, '$1').trimStart());
                md = 1;
            }
        } else {
            if (cc.test(line)) {
                lines.push(line.replace(cc, '$1').trimStart());
            } else {
                md = 0;
                lines.push('');
            }
        }
    }

    lines.forEach((xx) => {
        console.log(xx);
    })
}

const testFolders = ['./src/smo/data/', './src/smo/xform/', './src/common/',
    './src/ui/', './src/render/sui/','./src/render/vex/'];
	
const js = /\.js/;

testFolders.forEach((testFolder) => {
    fs.readdirSync(testFolder).forEach(file => {
        if (js.test(file)) {
            processLineByLine(testFolder + file);
        }
    });
});
