import { readFileSync }  from 'fs';
import validateSchema  from  'xsd-validator';

let xmlString = readFileSync("./tools/preciousLord.xml", "utf8");
let xmlSchema = readFileSync("./tools/SMOXML.xsd", "utf8");
validateSchema(xmlString, xmlSchema);
