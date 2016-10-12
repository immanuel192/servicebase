'use strict';
const _ = require('lodash')
const uuid = require('node-uuid')
const assert = require('assert')
let events = require('events')
let TestClientReadyEmitter = new events.EventEmitter()

// /**
//  * @type  {SenecaJS.SenecaJS}
//  */
// let seneca

class TestClient {
    /**
     * @param  {SenecaJS.SenecaJS} client
     */
    constructor(client) {
        // reset AuthUser
        this.setAuthUser(undefined)
        // backup the original function
        this.seneca = client
    }

    setAuthUser(auth) {
        this.AuthUser = auth
    }

    getAuthUser() {
        // todo: should use lodash to clone before return
        return this.AuthUser || null
    }

    act() {
        let args = Array.prototype.slice.apply(arguments)
        // inject AuthUser
        let user = this.getAuthUser()
        if (user !== null) {
            if (args.length > 0) {
                args[1] = args[1] || {}
                args[1].User = user
            }
            else {
                args = [
                    {
                        User: user
                    }
                ]
            }
        }

        return this.seneca.act.apply(this.seneca, args)
    }

    close() {
        return this.seneca.closeAsync()
    }
}

/**
 * @type {ServiceBase}
 */
let _servicebase
let _config
/**
 * @type {TestClient}
 */
let _client
/**
 * @type {String}
 */
let _pin

class ServiceBaseTestHelper {
    /**
     * Creates an instance of ServiceBaseTestHelper.
     * 
     * @param {ServiceBase} servicebase
     */
    constructor(servicebase) {
        _servicebase = servicebase
        global.service = servicebase
        this.ready = false
    }

    start(config, pin, serviceName) {
        _config = config
        _servicebase.configure(config)
        // global.PIN = pin
        _pin = pin

        return _servicebase.listen()
            .then(function serverStartSuccess() {
                _servicebase.log(serviceName + ' has been start successfully')
            })
            .then(function initClient() {
                return _servicebase.client(_pin)
            })
            .then(function initClientSuccess(_originalClient) {
                _client = new TestClient(_originalClient)
                return _client
            })
            .catch(function initFailed(error) {
                console.log(error)
                throw new Error('Could not init servicebase')
            })
    }

    onReady(callback) {
        if (this.ready && this.ready === true) {
            return callback(_client, _pin)
        }

        TestClientReadyEmitter.on('ready', function () {
            callback(_client, _pin)
        })
    }

    /**
     * Set ready state of test client
     */
    setReady() {
        this.ready = true
        TestClientReadyEmitter.emit('ready')
    }

    random(n = 36) {
        return Math.random().toString(36).slice(2)
    }

    close() {
        return _servicebase.close()
    }

    /**
     * Get error message which thrown from seneca
     * 
     * @returns string
     */
    getErrorMessage(err) {
        if (err && err.details && err.details['orig$'] && err.details['orig$'].code) {
            return err.details['orig$'].code
        }
        else if (err && err.message) {
            return err.message
        }
        else if (_.isString(err)) {
            return err
        }
        else {
            return ''
        }
    }

    uuidv1() {
        return uuid.v1()
    }

    /**
     * Return UUID version 4
     * 
     * @returns {String}
     */
    uuidv4() {
        return uuid.v4()
    }

    assertErrorMessage(expect, err) {
        let expected = expect
        let actual = this.getErrorMessage(err)
        let pos = actual.indexOf(expected)
        assert.equal(pos > -1, true, `Expected "${expected}". Actual "${actual}"`)
    }
}

module.exports = function exportTestClient(servicebase) {
    return new ServiceBaseTestHelper(servicebase)
}