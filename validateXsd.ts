import { readFileSync }  from 'fs';
import validateSchema  from  'xsd-validator';

let xmlString = readFileSync("./tools/simple2.xml", "utf8");
let xmlSchema = readFileSync("./tools/SMOXML.xsd", "utf8");
let  rv: any = '';
rv = validateSchema(xmlString, xmlSchema);
console.log(rv);

