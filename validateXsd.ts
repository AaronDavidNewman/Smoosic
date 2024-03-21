import { readFileSync }  from 'fs';
import validateSchema  from  'xsd-validator';
let xsdString = readFileSync("./tools/XMLSchema.xsd", "utf8");
let xmlString = readFileSync("./tools/simple2.xml", "utf8");
let xmlSchema = readFileSync("./tools/SMOXML.xsd", "utf8");
// const xsdRv = validateSchema(xmlSchema, xsdString);
const xmlRv = validateSchema(xmlString, xmlSchema);
// console.log(xsdRv);
console.log(xmlRv);

