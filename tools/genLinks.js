const fs = require('fs');
const readline = require('readline');
const process = require('process');

const args = process.argv.slice(2);

const infiles = args[0];
const libfile = args[1];

const libObject = {
  format: "library",
	metadata: {
		name: "Hymn Arrangements",
    type: "collection",
		tags: [
			"Sacred Music",
			"arrangements"
		],
  },
  children: []
};
const prefix = "https://aarondavidnewman.github.io/Smoosic/release/library/hymns/";
const childObject = {
  format: "mxml",
  metadata: {
    name: "Yama",
    composer: "various"
  }
};

async function readLines() {
  const fileStream = fs.createReadStream(infiles);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in input.txt as a single line break.

  for await (const line of rl) {
    const child = JSON.parse(JSON.stringify(childObject));
    child.url = prefix + line;
    child.metadata.name = line.substr(0, line.indexOf('.'));
    libObject.children.push(child);
    // console.log(JSON.stringify(child, null, 2));
    // Each line in input.txt will be successively available here as `line`.
  }
  fs.writeFileSync(libfile, JSON.stringify(libObject, null, 1));
}

readLines();
