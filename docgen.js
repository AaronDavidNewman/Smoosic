const fs = require('fs');
const readline = require('readline');
const util = require('util');
const readFile = util.promisify(fs.readFile);
const docHeader = './src/autodoc_header.md'
    const js = /\.js/;

function processDocsHeader() {
    var text = fs.readFileSync(docHeader, 'ascii');
    console.log(text);
}
function processLineByLine(filename) {

    const rl = readline.createInterface({
            input: fs.createReadStream(filename),
            crlfDelay: Infinity
        });

    var md = 0;
    var re = /\/\/\s+(#+.+)/;
    var cc = /\/\/(.+)/;
    var flines = fs.readFileSync(filename, 'utf-8')
        .split('\n')
        .filter(Boolean);
    flines.forEach((line) => {

        if (!md) {
            if (re.test(line)) {
                var output = line.replace(re, '$1').trimStart();
                console.log(output);
                md = 1;
            }
        } else {
            if (cc.test(line)) {
                // hack: decided I didn't like Description everywhere.
                if (line.indexOf('Description') < 0) {
                    var output = line.replace(cc, '$1').trimStart();
                    console.log(output);
                }
            } else {
                md = 0;
                console.log('');
            }
        }
    });
}

function processFolder(sourceFolder) {
    console.log('# Directory: ' + sourceFolder.name);
    console.log(sourceFolder.header);
    console.log('---');

    var files = fs.readdirSync(sourceFolder.folder);

    files.forEach((file) => {
        if (js.test(file)) {
            processLineByLine(sourceFolder.folder + file);
        }
    });
}

function docGen() {
    const sourceFolders = [{
            folder: './src/smo/data/',
            header: 'Serializable Music Ontology classes and logical structure',
            name: 'smo/data'
        }, {
            folder: './src/smo/xform/',
            name: 'smo/xform',
            header: 'Logic that transforms music according to common theory rules (e.g. accidentals, time signatures'
        }, {
            folder: './src/common/',
            name: 'common',
            header: 'Utiilities not specifically related to SMO'
        }, {
            folder: './src/ui/',
            name: 'ui',
            header: 'Menus, dialogs and all that'
        }, {
            folder: './src/render/sui/',
            name: 'render/sui',
            header: 'SMO rendering logic and UI liasons'
        }, {
            folder: './src/render/vex/',
            name: 'render/vex',
            header: 'Logic for getting VEXFlow library to render the music'
        }
    ];

    processDocsHeader();
    sourceFolders.forEach((sourceFolder) => {
        processFolder(sourceFolder);
    });

}

docGen();
