'use strict';
/*
Copyright 2016, Trung Dang (trungdt@absoft.vn)
*/
let Jsonic = require('jsonic')
const _ = require('lodash')

/**
 * Normalize Pin pattern into string
 * @param  {any} pin
 * @param  {bool} dontRemoveFirstAndEndSign
 * @param  {number} maxchar
 * @return {string} Pin pattern in string format
 */
function PinToString(pin, dontRemoveFirstAndEndSign, maxchar, depth) {
    let myPin

    if (depth === -1) {
        depth = 1000;
    }

    if (_.isString(pin)) {
        myPin = pin;
    }
    else {
        myPin = Jsonic.stringify(pin, {
            maxchars: maxchar,
            depth: depth
        });
        if (dontRemoveFirstAndEndSign !== true) {
            myPin = myPin.substr(1, myPin.length - 2);
        }
    }
    return myPin;
}

/**
 * Convert pin into object
 * @param  {any} pin
 * @return {Object} Pin pattern in Object structured
 */
function PinToObject(pin) {
    let myPin = {};
    if (_.isPlainObject(pin)) {
        // make a copy of origin object for some cases we need to modify
        myPin = _.merge({}, pin);
    }
    else if (_.isString(pin) && pin.length > 0) {
        myPin = pin;
        // add {} at first and end of the string
        let firstChar = myPin.substr(0, 1);
        // we will not cover the case for array, that is special cases
        if (firstChar != '{' && firstChar != '[') {
            myPin = '{' + myPin + '}';
        }
        // convert from pin into object
        myPin = Jsonic(myPin);
    }
    return myPin;
}

/**
 * Merge pin2 into pin1, return as string
 * @param  {any} pin1
 * @param  {any} pin2
 * @return {string}
 */
function PinMergeToString(pin1, pin2) {
    let myPin1 = PinToObject(pin1);
    let myPin2 = PinToObject(pin2);
    return PinToString(_.merge(myPin1, myPin2));
}

/**
 * Merge 2 pin into object
 * @param  {any} pin1
 * @param  {any} pin2
 * @return {Object}
 */
function PinMergeToObject(pin1, pin2) {
    let myPin1 = PinToObject(pin1);
    let myPin2 = PinToObject(pin2);
    return _.merge(myPin1, myPin2);
}

/**
 * Serialize direct object properties
 * 
 * @param {Object} obj
 */
function Serialize(obj, level) {
    if (!level) {
        level = 0
    }

    if (!_.isPlainObject(obj)) {
        return obj
    }

    let ret = ''
    for (let k in obj) {
        // if (obj.hasOwnProperty(k)) {
        if (_.endsWith(k, '$')) {
            continue;
        }
        else if (_.isPlainObject(obj[k])) {
            if (level == 0) {
                ret += `,${k}={` + Serialize(obj[k], level + 1) + '}'
            }
        }
        else {
            if (ret.length > 0) {
                ret += ','
            }
            ret += `${k}=${obj[k]}`;
        }

    }
    return ret;
}

module.exports = {
    /**
     * Serialize input object into jsonic
     * @param  {Object} obj
     */
    Serialize: function (obj, level) {
        // return PinToString(obj, false, -1, -1)
        return Serialize(obj, level);
    },
    ToString: function (pin, dontRemoveFirstAndEndSign) {
        return PinToString(pin, dontRemoveFirstAndEndSign)
    },
    ToObject: PinToObject,
    MergeToString: PinMergeToString,
    MergeToObject: PinMergeToObject
};