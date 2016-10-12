'use strict'
/*
Consul KV URL Schema
* To get share config for all microservices.
/absoft/{PROJECT_NAME}/configs/share

* To get transportation config
/absoft/{PROJECT_NAME}/configs/transport

* To get Redis config
/absoft/{PROJECT_NAME}/configs/redis

* To get Main database config
/absoft/{PROJECT_NAME}/configs/database

*/
let consulClient
let _ = require('lodash');
const DATATYPE_NUMBER = 0
const DATATYPE_STRING = 1
const DATATYPE_JSONOBJECT = 2
const DATATYPE_INTEGER = 3
let log = _.noop

/**
 * @param  {any} options 
 * @return {ConsulClient}
 */
function initConsulConnection(options) {
    function validateOptions() {
        options = options || {}
        options.RUNNING_ENV = options.RUNNING_ENV || process.env.NODE_ENV || 'development'
        options.PROJECT_NAME = options.PROJECT_NAME || process.env.PROJECT_NAME || '_'
        options.SERVICE_NAME = options.SERVICE_NAME || process.env.SERVICE_NAME || '_'
        options.host = options.host || process.env.CONSUL_HOST || 'localhost'
        options.port = options.port || process.env.CONSUL_PORT || 8500
        // default config
        options.secure = options.secure || false
        options.ca = options.ca || undefined
        options.promisify = true
    }

    validateOptions();
    let backupOptions = _.clone(options)
    consulClient = require('consul')(options)
    return new ConsulClient(consulClient, backupOptions)
}


/**
 * Consul client
 * @param  {Consul} client
 */
function ConsulClient(client, options) {
    assert(client != undefined, Const.Message.ConsulClientShouldBeInitFirst)

    Object.defineProperty(this, 'client', {
        value: client,
        writable: false,
        enumerable: false,
        configurable: false
    })

    Object.defineProperty(this, 'Config', {
        value: options,
        writable: false,
        enumerable: false,
        configurable: false
    })
}

ConsulClient.prototype.getValueByKey = function getValueByKey(key) {
    /**
     * Return value which has been decorated by safe JSON parse
     * @param  {any} value
     */
    function decorateValue(value) {
        var valueDecorated = ''
        try {
            valueDecorated = JSON.parse(value)
        }

        catch (e) {
            valueDecorated = value
        }
        return valueDecorated
    }

    return this.client.kv
        .get({
            key: key
        })
        .then(function decodeConsulValue(value) {
            var rawObj = decorateValue(value.Value)
            assert(_.isPlainObject(rawObj), Const.Message.ConsulKVValueNotWellFormat)

            switch (rawObj.d) {
                case DATATYPE_NUMBER:
                    return parseFloat(rawObj.v)
                case DATATYPE_JSONOBJECT:
                    return decorateValue(rawObj.v)
                case DATATYPE_INTEGER:
                    return parseInt(rawObj.v)
                default:
                    return rawObj.v
            }
        })
        .catch(function catchConsulGetValueErr(err) {
            (new Date() + ' - Consul Client - Exception - Key = ' + key)
            log(JSON.stringify(err, null, 4))
            return err
        })
}

ConsulClient.prototype.setValueByKey = function setValueByKey(key, value) {
    var valueToSet = {
        v: '',
        d: DATATYPE_STRING
    }

    if (_.isString(value)) {
        valueToSet.v = value
        valueToSet.d = DATATYPE_STRING
    }
    else if (_.isInteger(value)) {
        valueToSet.v = value
        valueToSet.d = DATATYPE_INTEGER
    }
    else if (_.isNumber(value)) {
        valueToSet.v = value
        valueToSet.d = DATATYPE_NUMBER
    }
    else {
        valueToSet.v = JSON.stringify(value)
        valueToSet.d = DATATYPE_JSONOBJECT
    }

    return this.client.kv.set({
        key: key,
        value: JSON.stringify(valueToSet)
    })
}

/**
* Return the service name 
* @param  {String} inpServiceName
* @return {String}
*/
function getServiceName(inpServiceName) {
    var serviceName = this.Config.SERVICE_NAME
    if (inpServiceName && inpServiceName.length > 0) {
        serviceName = inpServiceName
    }
    return serviceName
}


/**
 * Set all configs based on input config for specific service name
 * @param  {String} serviceName
 * @param  {Object} config
 * @return {Object} Return the config after normalize
 */
ConsulClient.prototype.setConfig = function setConfig(config, serviceName) {
    return Promise.all([
        this.setConfigShare(config.shareConfig || {})
        , this.setConfigRedis(config.redis || {}, serviceName)
        , this.setConfigTransport(config.transport || {}, serviceName)
        , this.setConfigSenecaServer(config.serverConfig || {}, serviceName)
        , this.setConfigSenecaClient(config.clientConfig || {}, serviceName)
        , this.setConfigDatabase(config.database || {}, serviceName)
        , this.setConfigLoggly(config.logging || {}, serviceName)
    ])
        .catch(function handleSetConfigException(err) {
            log('Set config into consul got exception', err)
            return err
        })
}

/**
 * Get all config for specific service name
 * @param  {String} serviceName
 * @return {Object} 
 */
ConsulClient.prototype.getConfig = function getConfig(serviceName) {
    let inpServiceName = getServiceName.call(this, serviceName)
    return this
        // get share config base first
        .getConfigShare()
        .then(function (shareConfig) {
            // Inject default config
            let config = {
                RUNNING_ENV: this.Config.RUNNING_ENV,
                PROJECT_NAME: this.Config.PROJECT_NAME,
                SERVICE_NAME: this.Config.SERVICE_NAME
            }
            config.shareConfig = shareConfig
            return config
        }.bind(this))
        .then(function (config) {
            return Promise
                .all([
                    this
                        .getConfigRedis()
                        .then(function handleGetRedisConfig(redis) {
                            config.redis = redis;
                        }),
                    this
                        .getConfigTransport()
                        .then(function handleGetTransportConfig(transport) {
                            config.transport = transport;
                        }),
                    this
                        .getConfigSenecaServer()
                        .then(function handleGetServerConfig(serverConfig) {
                            config.serverConfig = serverConfig;
                        }),
                    this
                        .getConfigSenecaClient()
                        .then(function handleGetClientConfig(clientConfig) {
                            config.clientConfig = clientConfig;
                        }),
                    this.getConfigDatabase()
                        .then(function handleGetConfigDatabase(databaseConfig) {
                            config.database = databaseConfig
                        }),
                    this.getConfigLoggly()
                        .then(function handleGetConfigLogging(loggingConfig) {
                            config.logging = loggingConfig
                        })
                ])
                .then(function finishConfigCollecting() {
                    return config
                })
                .catch(function catchMergeConfigErr(err) {
                    log(err)
                    throw err
                })
        }.bind(this))
        .catch(function catchConfigErr(err) {
            log(err)
            throw new Error(err.message)
        })
}

/**
 * Get base config share
 * @return {Object}
 */
ConsulClient.prototype.getConfigShare = function GetConfigShare() {
    var key = util.format('absoft/%s/%s/configs/share', this.Config.RUNNING_ENV, this.Config.PROJECT_NAME)
    return this.getValueByKey(key)
}

/**
 * @param  {Object} value
 */
ConsulClient.prototype.setConfigShare = function SetConfigShare(value) {
    var key = util.format('absoft/%s/%s/configs/share', this.Config.RUNNING_ENV, this.Config.PROJECT_NAME)
    return this.setValueByKey(key, value)
}

/**
 * @param  {String} serviceName
 */
ConsulClient.prototype.getConfigTransport = function GetConfigTransport(serviceName) {
    var inpServiceName = getServiceName.call(this, serviceName)
    var key = util.format('absoft/%s/%s/configs/%s/transport', this.Config.RUNNING_ENV, this.Config.PROJECT_NAME, inpServiceName)
    return this.getValueByKey(key)
}

/**
 * @param  {Object} value
 * @param  {String} serviceName
 */
ConsulClient.prototype.setConfigTransport = function SetConfigTransport(value, serviceName) {
    var inpServiceName = getServiceName.call(this, serviceName)

    var key = util.format('absoft/%s/%s/configs/%s/transport', this.Config.RUNNING_ENV, this.Config.PROJECT_NAME, inpServiceName)
    return this.setValueByKey(key, value)
}

/**
 * @param  {String} serviceName
 */
ConsulClient.prototype.getConfigRedis = function GetConfigRedis(serviceName) {
    var inpServiceName = getServiceName.call(this, serviceName)

    var key = util.format('absoft/%s/%s/configs/%s/redis', this.Config.RUNNING_ENV, this.Config.PROJECT_NAME, inpServiceName)
    return this.getValueByKey(key)
}

/**
 * @param  {Object} value
 * @param  {String} serviceName
 */
ConsulClient.prototype.setConfigRedis = function SetConfigRedis(value, serviceName) {
    var inpServiceName = getServiceName.call(this, serviceName)

    var key = util.format('absoft/%s/%s/configs/%s/redis', this.Config.RUNNING_ENV, this.Config.PROJECT_NAME, inpServiceName)
    return this.setValueByKey(key, value)
}

/**
 * @param  {String} serviceName
 */
ConsulClient.prototype.getConfigDatabase = function GetConfigDatabase(serviceName) {
    var inpServiceName = getServiceName.call(this, serviceName)

    var key = util.format('absoft/%s/%s/configs/%s/database', this.Config.RUNNING_ENV, this.Config.PROJECT_NAME, inpServiceName)
    return this.getValueByKey(key)
}

/**
 * @param  {Object} value
 * @param  {String} serviceName
 */
ConsulClient.prototype.setConfigDatabase = function SetConfigDatabase(value, serviceName) {
    var inpServiceName = getServiceName.call(this, serviceName)

    var key = util.format('absoft/%s/%s/configs/%s/database', this.Config.RUNNING_ENV, this.Config.PROJECT_NAME, inpServiceName)
    return this.setValueByKey(key, value)
}


/**
 * @param  {String} serviceName
 */
ConsulClient.prototype.getConfigSenecaServer = function GetConfigSenecaServer(serviceName) {
    var inpServiceName = getServiceName.call(this, serviceName)

    var key = util.format('absoft/%s/%s/configs/%s/seneca-server', this.Config.RUNNING_ENV, this.Config.PROJECT_NAME, inpServiceName)
    return this.getValueByKey(key)
}

/**
 * @param  {Object} value
 * @param  {String} serviceName
 */
ConsulClient.prototype.setConfigSenecaServer = function SetConfigSenecaServer(value, serviceName) {
    var inpServiceName = getServiceName.call(this, serviceName)

    var key = util.format('absoft/%s/%s/configs/%s/seneca-server', this.Config.RUNNING_ENV, this.Config.PROJECT_NAME, inpServiceName)
    return this.setValueByKey(key, value)
}

/**
 * @param  {String} serviceName
 */
ConsulClient.prototype.getConfigSenecaClient = function GetConfigSenecaClient(serviceName) {
    var inpServiceName = getServiceName.call(this, serviceName)

    var key = util.format('absoft/%s/%s/configs/%s/seneca-client', this.Config.RUNNING_ENV, this.Config.PROJECT_NAME, inpServiceName)
    return this.getValueByKey(key)
}

/**
 * @param  {Object} value
 * @param  {String} serviceName
 */
ConsulClient.prototype.setConfigSenecaClient = function SetConfigSenecaClient(value, serviceName) {
    var inpServiceName = getServiceName.call(this, serviceName)

    var key = util.format('absoft/%s/%s/configs/%s/seneca-client', this.Config.RUNNING_ENV, this.Config.PROJECT_NAME, inpServiceName)
    return this.setValueByKey(key, value)
}

/**
 * @param  {String} serviceName
 */
ConsulClient.prototype.getConfigLoggly = function GetConfigLoggly(serviceName) {
    var inpServiceName = getServiceName.call(this, serviceName)

    var key = util.format('absoft/%s/%s/configs/%s/loggly', this.Config.RUNNING_ENV, this.Config.PROJECT_NAME, inpServiceName)
    return this.getValueByKey(key)
}

/**
 * @param  {Object} value
 * @param  {String} serviceName
 */
ConsulClient.prototype.setConfigLoggly = function SetConfigLoggly(value, serviceName) {
    var inpServiceName = getServiceName.call(this, serviceName)

    var key = util.format('absoft/%s/%s/configs/%s/loggly', this.Config.RUNNING_ENV, this.Config.PROJECT_NAME, inpServiceName)
    return this.setValueByKey(key, value)
}


/********** End of Consult Client Definitions */


module.exports = function exportConsult(logger) {

    log = logger
    return {
        /**
         * @param  {any} options
         * @return {ConsulClient} A Consul Client 
         */
        init: function initConsulClient(options) {
            return initConsulConnection(options)
        }
    }
}