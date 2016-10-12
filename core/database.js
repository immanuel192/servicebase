/** global assert */
/// <reference path="../typings/sequelize/sequelize.d.ts" />
'use strict';
/**
 * Database Manager class 
 */
global.Sequelize = require('sequelize')
const Promise = require('bluebird')
const fs = require('fs')
const _ = require('lodash')
const uuid = require('node-uuid')
const assert = require('assert')
const modelManager = require('../modules/databases/model-manager')
let _myConfig = {}
let log = _.noop

/**
 * Adapter Bootstraper
 * Will keep all supported dialect adapter
 */
let adapterBootstraper = {}

/**
 * List of adapters which already initialized
 * Each item will be an object 
 * {
 *      dialect   : String
 *      name      : String
 *      sequelize : Sequelize 
 * }
 */
let listAdapters = []

/**
 * Return new connection if the input name is matched with any configuration
 * @param  {String} name
 */
function InitConnection(name) {
    function getConnectionConfig() {
        let ret

        if (_myConfig.hasOwnProperty(name)) {
            ret = _myConfig[name]
        }
        else {
            _.forEach(_myConfig, function (v) {
                if (v.dialect === name) {
                    ret = v
                    return false
                }
            })
        }
        return ret
    }

    function getDialectByName(dialect) {
        return adapterBootstraper.hasOwnProperty(dialect) ? adapterBootstraper[dialect] : null
    }

    let connection = getConnectionConfig()
    if (connection && connection.options && connection.options.dialect) {
        var connectionInfo = {
            dialect: connection.options.dialect,
            name: name,
            sequelize: {}
        }

        var adapter = getDialectByName(connection.options.dialect)
        if (!adapter) {
            log('Please register dialect adapter for ' + connection.options.dialect)
            throw new Error('Please register dialect adapter for ' + connection.options.dialect)
        }

        return adapter.call(this, connection, modelManager)
            .then(function (sequelize) {
                connectionInfo.sequelize = sequelize
                let instance = new DatabaseConnectionInstance(connectionInfo)
                listAdapters.push(instance)
                return instance
            })
    }

    log('There is no database configuration for ' + name)
    return Promise.reject('There is no database configuration for ' + name)
}

class DatabaseManager {
    constructor(logger) {
        log = logger
    }

    /**
     * Set config. Connection will be lazy-initialize
     * @param  {Object} config
     */
    Config(config) {
        _myConfig = config

        // auto register adapter if any
        let keys = Object.keys(config)
        _.each(keys, (key) => {
            let connectionConfig = config[key]
            if (
                connectionConfig.options.dialect
                && (
                    connectionConfig.options.dialect == global.Const.DIALECT_POSTGRES
                    || connectionConfig.options.dialect == global.Const.DIALECT_SQLITE
                )
            ) {
                this.registerAdapter(connectionConfig.options.dialect)
            }
        })
    }

    /**
     * Get connection by dialectOrName 
     * @param {String} dialectOrName dialect type or adapter name
     * @return {Sequelize} Return first adapter matched 
     */
    getConnection(dialectOrName) {
        if (dialectOrName === null || dialectOrName === '' || dialectOrName === undefined) {
            // dialectOrName = 'default'
            _.forEach(_myConfig, function (v) {
                if (v.isdefault === true) {
                    dialectOrName = v.dialect
                    return false
                }
            })
        }

        let matched = listAdapters.map((instance) => {
            if (
                (instance._InternalConfig.dialect === dialectOrName) ||
                (instance._InternalConfig.name === dialectOrName)
            ) {
                return instance
            }
        })

        if (matched.length > 0) {
            return Promise.resolve(matched[0])
        }
        else {
            return InitConnection(dialectOrName)
        }
    }
    /**
     * Register model into model manager
     * @param  {Object[]} models
     */
    registerModel(models) {
        modelManager.registerModel(models)
    }

    /**
     * Register adapter (eg: Postgresql, Mysql, ...)
     * @param  {DatabaseAdapter} adapter
     */
    registerAdapter(adapter) {
        if (_.isFunction(adapter)) {
            return adapter.call(this, adapterBootstraper, log)
        }
        else if (_.isString(adapter)) {
            let filePath = __dirname + '/database-adapters/' + adapter + '.js'
            let fileExist = false
            try {
                fileExist = fs.statSync(filePath).isFile()
            }
            catch (err) {
                fileExist = false
            }

            if (!fileExist) {
                log('Service Base does not support dialect adapter named ' + adapter)
                throw new Error('Service Base does not support dialect adapter named ' + adapter)
            }

            try {
                return this.registerAdapter(require(filePath))
            }
            catch (err) {
                log('Database - Loading adapters got exception. Adapter ' + filePath, err)
                throw err
            }
        }

        throw new Error('Adapter should be a function or Supported Dialect Name')
    }
}

/**
 * Preresent an instance of a database connection
 */
class DatabaseConnectionInstance {
    constructor(adapter) {

        function applyUtilizeFunctions(instance) {
            /**
            * Overloading function to register model or an array of model
            * @param  {Object} {Object[]} models 
            */
            instance.registerModel = instance.registerModel || function registerModel(modelDef) {
                assert(modelDef.globalId, 'Model should contains globalId')

                return instance.define(modelDef.globalId, modelDef.attributes || {}, modelDef.options || {})
            }

            /**
             * Return UUID version 1
             * 
             * @returns {String}
             */
            instance.uuidv1 = function uuidv1() {
                return uuid.v1()
            }

            /**
             * Return UUID version 4
             * 
             * @returns {String}
             */
            instance.uuidv4 = function uuidv4() {
                return uuid.v4()
            }

            /**
             * Return raw data from sequelize result 
             * 
             * @param  {Object[]} data
             * @return {Object | Array<Object>}
             */
            instance.raw = function getRawData(data) {
                if (_.isArray(data)) {
                    // return _.map(data, (v) => (v && v.dataValues) || {})
                    return _.map(data, (v) => v.toJSON())
                }
                else if (_.isObject(data) && data.dataValues) {
                    // return (data && data.dataValues) || {};
                    return data.toJSON()
                }
                // return data
                // for all other cases, force return null. Let's it fail fast
                return null
            }

            /**
             * Automatic build where clause for sequelize model actions
             * The condition will look like below
             * let whereCondition = {
             *     email : {
             *        condition:args.email && _.isString(args.email),
             *        value: args.email  
             *     },
             *     id: {
             *        condition:args.userId && _.isInteger(args.userId),
             *         value: args.userId
             *     },
             *     facebookId: {
             *        condition:args.facebookId && _.isString(args.facebookId),
             *        value: args.facebookId
             *     }
             *}
             *
             *
             * let whereCollection = dbConnection.buildWhereClause(whereCondition)
             * 
             * @param  {Array<DatabaseManager.AutoBuildWhereClause>} condition
             */
            instance.buildWhereClause = function buildWhereClause(condition) {
                let ret = {}
                _.each(condition, (con, key) => {
                    if (con.condition && con.value && con.condition === true) {
                        ret[key] = con.value
                    }
                })
                return ret
            }

            return instance
        }

        Object.defineProperties(adapter.sequelize, {
            '_InternalConfig': {
                value: {
                    dialect: adapter.dialect,
                    name: adapter.name
                },
                writable: false,
                enumerable: true,
                configurable: false
            }
        })

        applyUtilizeFunctions(adapter.sequelize)
        return adapter.sequelize
    }
}

module.exports = function exportDatabaseManager(logger) {
    return new DatabaseManager(logger)
} 