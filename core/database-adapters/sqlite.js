'use strict';
/* globals Sequelize assert */

/**
 * Sequelize sqlite3 adapter
 * Copyright Trung Dang (trungdt@absoft.vn) - 2016
 */

const ADAPTER_NAME = 'sqlite'
// better we include lodash here instead of using global one, for easy export or refactor code later
const _ = require('lodash')
let log = _.noop

// init sequelize connection here
Sequelize.cls = require('continuation-local-storage').createNamespace('servicebase-sequelize-sqlite3');

function applyUtilizeFunctions(instance) {
    /**
    * Function to register model or an array of model
    * @param  {Object} {Object[]} models
    * @param  {bool?} lazyLoadScopeAndAssociation If true then will pospone loading scope & associations  
    */
    instance.registerModel = function registerModel(modelDef, lazyLoadScopeAndAssociation) {
        assert(modelDef.globalId, 'Model should contains globalId')
        assert(_.isObject(modelDef.attributes), 'Model should contains attributes')

        // create model first
        this.registerSchema(modelDef.options.schema || '')

        // 
        let model = this.define(modelDef.globalId, modelDef.attributes, modelDef.options || {})
        if (lazyLoadScopeAndAssociation !== true) {
            this.loadScopeAndAssociation(modelDef)
            model.sync()
        }
        return model
    }

    /**
     * Loading associations and default scope for model
     * @param  {Object} modelDef
     */
    instance.loadScopeAndAssociation = function loadScopeAndAssociation(modelDef) {
        function setAssociation(modelDef) {
            if (_.isFunction(modelDef.associations)) {
                log('Loading associations for \'' + modelDef.globalId + '\'')
                let model = this.models[modelDef.globalId]
                // calling associations with the this pointed to this sequelize
                modelDef.associations.call(this, model)
            }
        }

        function setDefaultScope(modelDef) {
            if (_.isFunction(modelDef.defaultScope)) {
                log('Loading default scope for \'' + modelDef.globalId + '\'')
                let model = this.models[modelDef.globalId]
                let defaultScope = modelDef.defaultScope() || {}
                model.addScope('defaultScope', defaultScope, { override: true })
            }
        }

        setAssociation.call(this, modelDef)
        setDefaultScope.call(this, modelDef)
    }

    /**
     * Create schema
     * @param  {string} name
     */
    instance.registerSchema = function registerSchema(tableSchema) {
        let schemaExisted = _.some(this.Schemas, function checkSchemaExist(schema) {
            return schema == tableSchema
        })
        if (!schemaExisted && tableSchema != '') {
            // create schema
            try {
                this.createSchema(tableSchema)
                // insert into memory for later checking
                this.Schemas.push(tableSchema)
            }
            catch (ex) {
            }
        }
        return this
    }
    return instance
}

/**
 * Init a sqlite connection
 * @param  {Object} options
 * @param  {DatabaseManager.ModelManager modelsManager
 * @return {Promise} a promise which finally return an instance of sequelize 
 */
function sqliteAdaperInit(options, modelsManager) {
    let sequelize = new Sequelize(options.database, options.user || null, options.password || null, options.options || null)

    let models = modelsManager ? modelsManager.getModels() : []

    return applyUtilizeFunctions(sequelize)
        .showAllSchemas()
        .then(function schemaRegistering(schemas) {
            sequelize.Schemas = schemas
            return schemas
        })
        .then(function modelRegistering() {
            // auto wired up all registered models
            _.each(models, function registerModel(modelDef) {
                // dont load associations & scope, wait for all model have been registered
                sequelize.registerModel(modelDef, true)
            })
            return true
        })
        .then(function loadAssociationsAndDefaultScope() {
            _.each(models, function registerModel(modelDef) {
                sequelize.loadScopeAndAssociation(modelDef)
            })
            return true
        })
        .then(function () {
            return sequelize
                .sync({
                    force: options.options.forceSync || false
                })
        })
}

/**
 * @param  {Object[]} listAdapters
 * @param  {ModelManager} modelManager
 */
module.exports = function exportSqliteDialect(listAdapters, logger) {
    listAdapters[ADAPTER_NAME] = sqliteAdaperInit
    log = logger
}