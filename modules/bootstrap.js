'use strict';
// Bootstrapping ServiceBase class
require('bluebird')
var _ = require('lodash');
global.assert = require('assert')
global.util = require('util')

function BuildConstants() {
    let consts = require('../modules/consts/share')

    _.merge(consts, {
        Message: require('../modules/consts/messages')
    })

    global.Const = consts
}

BuildConstants()

module.exports = {}
