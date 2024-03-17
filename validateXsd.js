"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var xsd_validator_1 = require("xsd-validator");
var xmlString = (0, fs_1.readFileSync)("./tools/simple2.xml", "utf8");
var xmlSchema = (0, fs_1.readFileSync)("./tools/SMOXML.xsd", "utf8");
var rv = '';
rv = (0, xsd_validator_1.default)(xmlString, xmlSchema);
console.log(rv);
