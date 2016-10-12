'use strict'
const _ = require('lodash')
const Promise = require('bluebird')
var Pin = require('../modules/pin')
var uuid = require('../modules/uuid')
var assert = require('assert')
var seneca
var listClients = {}
let log = _.noop

/**
 * Service Client wrapper
 * @private 
 * @param  {any} client
 */
function ServiceClient(client, pin) {
    // let pinObject = Pin.ToObject(pin)
    // let's inject pin and SERVICE_NAME
    let pinObject = _.merge({
        'Consumer': seneca.Config.SERVICE_NAME
    }, Pin.ToObject(pin))

    /**
     * Inject Pin pattern into user input pattern
     * @param  {any} pattern
     * @return {string}
     */
    function injectPinIfPossible(pattern) {
        return Pin.MergeToString(pinObject, pattern)
    }

    /**
     * @param  {any} input
     * @return {promise}
     */
    this.act = function handleClientAct(input, paramspec) {
        // let's inject Consumer into every request
        return client.actAsync(injectPinIfPossible(input), paramspec)
    }

    this.Config = {
        pin: pin
    }

    this.close = function closeClient() {
        return client.closeAsync()
    }

    // to make sure we dont wrap this class 2 times
    Object.defineProperty(this, 'isServiceClient', {
        value: true,
        writable: false,
        enumerable: true,
        configurable: false
    })
}

/**
 * Return service client as promise
 * @private 
 * @param  {Seneca Client} client
 * @param  {string | Object} pin
 */
function PromiseServiceClient(client, pin) {
    return new Promise(function handlePromisifyServiceClient(resolve, reject) {
        if (client) {
            if (client.isServiceClient) {
                resolve(client)
            }
            else {
                listClients[pin] = new ServiceClient(client, pin)
                resolve(listClients[pin])
            }
        }
        else {
            reject(new Error('Client is not found'))
        }
    })
}

/**
 * @private 
 * @param  {any} err
 */
function ClientErrorHandler(err) {
    log(err)
    return true
}

/**
 * @private 
 * @param  {any} userHandlerFunction
 */
function ClientErrorHandlerWrapper(userHandlerFunction) {
    return function internalClientErrorWrapper(err) {
        ClientErrorHandler(err)
        return userHandlerFunction(err)
    }
}

/**
 * @param  {any} pin
 * @return {Promise} ServiceClient promise
 */
function getClientByPin(pin) {
    var myPin = Pin.ToString(pin)
    if (listClients.hasOwnProperty(myPin)) {
        return PromiseServiceClient(listClients[myPin], myPin)
    }
    return Promise.reject(new Error('Client is not found'))
}

class ClientManager {
    constructor(logger, senecaInp) {
        assert.notEqual(senecaInp, undefined, 'seneca should be passed as parameter')
        seneca = senecaInp
        log = logger
    }

    /**
     * @param  {any} expectedPin
     * @param  {any} startConfig
     * @return {Promise} ServiceClient promise
     */
    createIfNotExist(expectedPin, startConfig) {
        var pin = Pin.ToString(expectedPin)
        return getClientByPin(pin)
            .then(function (client) {
                return client
            })
            .catch(function () {
                // inject pin into client config
                var config = _.merge({
                    pin: pin,
                    timeout: 5000, // ms
                    tag: 'SBC-' + pin + '-' + uuid()
                    // type: 'amqp'
                }, seneca.Config.transport, startConfig)

                switch (seneca.Config.transport.type
                || seneca.Config.serverConfig.type
                || startConfig.type) {
                    case Const.TRANSPORT_AMQP:
                        config.type = 'amqp';
                        break
                    default:
                }


                if (_.isFunction(startConfig.errhandler)) {
                    config.errhandler = new ClientErrorHandlerWrapper(startConfig.errhandler)
                }
                else {
                    config.errhandler = ClientErrorHandler
                }

                return seneca.clientAsync(config)
                    .then(function (senecaClient) {
                        listClients[pin] = senecaClient
                        return PromiseServiceClient(senecaClient, pin)
                    })
            })
    }

    /**
     * Close connection of a client by a Pin
     * 
     * @param  {string} pin
     * @returns Promise
     */
    close(pin) {
        if (listClients.hasOwnProperty(pin)) {
            return listClients[pin].close()
        }
        return Promise.resolve()
    }


    /**
     * Close all client connections
     * 
     * @returns Promise
     */
    closeAll() {
        let track = []
        for (let pin in listClients) {
            track.push(this.close(pin))
        }
        return Promise.all(track)
    }
}

module.exports = function exportClientManager(senecaInp, logger) {
    return new ClientManager(logger, senecaInp)
}