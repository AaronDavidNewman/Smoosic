import { readFileSync }  from 'fs';
import validateSchema  from  'xsd-validator';
let xmlString = readFileSync("./tools/handel.xml", "utf8");
let xmlSchema = readFileSync("./tools/SMOXML.xsd", "utf8");
// const xsdRv = validateSchema(xmlSchema, xsdString);
const xmlRv = validateSchema(xmlString, xmlSchema);
// console.log(xsdRv);
console.log(xmlRv);

