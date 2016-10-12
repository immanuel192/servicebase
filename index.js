'use strict';
/// <reference path="./typings/lodash/lodash.d.ts" />
/// <reference path="./typings/node/node.d.ts" />
/// <reference path="./typings/servicebase/servicebase.d.ts" />
// let's switch the environment
require('./modules/env')();

require('./modules/bootstrap')
let service = require("./core/servicebase")

//
module.exports = service