
const fs = require('fs');
const { DOMParser } = require('xmldom');

let xmlString = fs.readFileSync("sounds.xml", "utf8");
const doc = new DOMParser().parseFromString(xmlString);

const soundar = doc.documentElement.childNodes;
for (var i = 0;i < soundar.length; ++i) {
  const soundNode = soundar[i];
  if (typeof(soundNode.getAttributeNS) === 'function') {
    console.log(soundNode.getAttribute('id'));
  };
}

