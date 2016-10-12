'use strict'
const _ = require('lodash')
const Logging = require('./logging')
const seneca = require('seneca')({ log: 'silent' })  // split into 2 parts: server and client
const Promisify = require('./promisify')
const consultHelper = require('./consul-client')(Logging.log)
let clientsManager = require('./client')(seneca, Logging.log)
const DatabaseManager = require('./database')(Logging.log)
let services = require('./services')(seneca, Logging.log)
const Auth = require('./auth')(Logging.log)
const Pin = require('../modules/pin')
const uuid = require('../modules/uuid')

/**
 * @param  {any} userHandlerFunction
 */
function ServiceErrorHandlerWrapper(userHandlerFunction) {
    ServiceErrorHandlerWrapper.ServiceErrorHandler = function ServiceErrorHandler(err) {
        Logging.log(err)
        return false
    }

    return function internalErrorWrapper(err) {
        ServiceErrorHandlerWrapper.ServiceErrorHandler(err)
        return userHandlerFunction(err);
    }
}

/**
 * @return {ServiceBase}
 */
function ServiceBase() {
    function injectUltils($this) {
        Object.defineProperties(seneca, {
            'ServiceBase': {
                value: $this,
                writable: false,
                enumerable: false,
                configurable: false
            },
            'DB': {
                value: DatabaseManager,
                writable: false,
                enumerable: false,
                configurable: false
            },
            'Config': {
                value: {},
                writable: true,
                enumerable: false,
                configurable: false
            },
            'logger': {
                value: Logging.log,
                writable: false,
                enumerable: false,
                configurable: false
            }
        })
    }

    function initExtraFunctions() {
        /**
         * Alternative function to be used inside service plugin. Userinfo from authentication token will be injected automatically
         * List of mandatiory parameters should be included when registering action:
         * - pin: string 
         * - cmd: string  Action name
         * 
         * List of optional parameters. These parameters can be injected as paramspec
         * - User : {
         *      id        : number User Id
         *      roles     : Array<string> User role, can be empty
         *      username  : string 
         * }
         * - Consumer : string , sent by consumer to identify themself
         * 
         * For action callback, the first parameter (which is params) will be injected automatically:
         * - User         : Optional, only available when authenticated        
         * {
         *      id        : number User Id
         *      username  : string
         *      roles     : Array<string> User role
         * }
         * - Consumer: Optional, sent by the consumer, to indentify themself
         * - authenticated: bool 
         * 
         * Action which is not authorizated to perform registerd action will be rejected automatically
         *  
         * @param  {string} module Module name of function
         * @param  {any} pattern Should included pin, cmd.
         * @param  {any} paramspec
         * @param  {Function} action
         */
        seneca.addService = function (pattern, paramspec, action) {
            let module = this.MODULE_NAME || '_'
            assert(seneca.Config, Const.Message.ServiceBaseShouldBeConfigureBeforeIncludeAllPlugins)
            assert(seneca.Config.serverConfig.pin, Const.Message.PinMissing)
            assert(_.isString(module) && module.length > 0, Const.Message.ModuleNameMissing)

            let finalPattern = Pin.MergeToObject(seneca.Config.serverConfig.pin, pattern)
            assert(finalPattern.cmd, Const.Message.CmdMissing)

            if (_.isFunction(paramspec)) {
                seneca.add(finalPattern, Auth.injectAuthToAction(module, finalPattern.cmd, paramspec))
            }
            else {
                seneca.add(finalPattern, paramspec, Auth.injectAuthToAction(module, finalPattern.cmd, action))
            }
        }

        /**
         * Act actions in current service without specify pin
         * @param  {any} input
         * @param  {Object} paramspec
         * @param  {Object} currentArgs Your current arguments to help extracting the user authorization. Provice to forward user authenticated info
         */
        seneca.actService = function handleLocalServiceAct(input, paramspec, currentArgs) {
            /**
            * Inject Pin pattern into user input pattern
            * @param  {any} pattern
            * @return {string}
            */
            function injectPinIfPossible(pattern) {
                return Pin.MergeToString(seneca.Config.serverConfig.pin, pattern);
            }

            let myParams = _.clone(paramspec)

            if (currentArgs) {
                if (currentArgs.User && _.isObject(currentArgs.User)) {
                    myParams.User = currentArgs.User
                }
                myParams['Consumer'] = currentArgs['Consumer'] || ''
            }

            return seneca.actAsync(injectPinIfPossible(input), myParams)
        }

        /**
        * Transport configuring. 
        */
        seneca.configureTransport = function ConfigureTransport() {
            // This function should be called one-time only.
            if (seneca.configureTransport.loaded) {
                return;
            }

            // load the transport
            switch (seneca.Config.transport.type || seneca.Config.serverConfig.type || seneca.Config.clientConfig.type) {
                case Const.TRANSPORT_AMQP:
                    seneca.use('seneca-amqp-transport', seneca.Config.transport)
                    break
                default:
            }
            seneca.configureTransport.loaded = true
        }

        /**
         * Register the module name from inside the plugin
         * @param  {string} modulename
         */
        seneca.setModuleName = function handleSetModuleName(modulename) {
            this.MODULE_NAME = modulename
        }

    }

    function handleWhenAppExit($this) {
        process.on('SIGTERM', () => {
            Logging.log('App closing SIGTERM')
            $this.close()
        });

        process.on('SIGINT', () => {
            Logging.log('App closing SIGINT')
            $this.close()
                .finally(process.exit)
        });

        process.on('uncaughtException', function (err) {
            Logging.log('uncaughtException - ' + err.message)
            Logging.log(err.stack)
            $this.close()
                .finally(() => {
                    process.exit(1)
                })
        })
    }

    // apply promisify
    Promisify.apply(seneca);

    // after all initializion, attemp to inject the client services we need into seneca
    injectUltils(this)
    initExtraFunctions()
    handleWhenAppExit(this)
}

/**
 * Configure the Service Base
 * @param  {Object} config
 */
ServiceBase.prototype.configure = function ConfigureService(config) {
    config = config || {};
    // init default environment 
    config.RUNNING_ENV = config.RUNNING_ENV || process.env.NODE_ENV || 'development'
    config.PROJECT_NAME = config.PROJECT_NAME || process.env.PROJECT_NAME || '_'
    config.SERVICE_NAME = config.SERVICE_NAME || process.env.SERVICE_NAME || '_'

    config.transport = config.transport || {}
    config.serverConfig = config.serverConfig || {}
    config.clientConfig = config.clientConfig || {}
    config.database = config.database || {}
    config.logging = config.logging || {}
    //
    seneca.Config = _.clone(config)
    //
    DatabaseManager.Config(config.database)
    // 
    Logging.config(config.logging)
    //
    Auth.setConfig(config)

    this.Config = seneca.Config
};

/**
 * Service listen as Server
 */
ServiceBase.prototype.listen = function ServiceListenAsServer() {
    function BuildServiceLogic() {
        services.build();
    }

    function Listen() {
        let options = {
            tag: 'ServiceBase-' + uuid(),
            // log: 'silent',
            timeout: 5000 // ms
        };

        if (seneca.Config.serverConfig) {
            _.merge(options, seneca.Config.serverConfig);
        }

        // we need to override user custom handler in some cases
        if (seneca.Config.serverConfig &&
            seneca.Config.serverConfig.errhandler &&
            _.isFunction(seneca.Config.serverConfig.errhandler)) {
            options.errhandler = new ServiceErrorHandlerWrapper(seneca.Config.serverConfig.errhandler);
        }
        else {
            options.errhandler = ServiceErrorHandlerWrapper.ServiceErrorHandler;
        }

        seneca.options(options)
        return seneca
            .listen(options)
            .readyAsync()
            .then(() => {
                if (seneca.Config.database && seneca.Config.database.default) {
                    return DatabaseManager.getConnection()
                }
                return Promise.resolve()
            })
    }

    seneca.configureTransport()
    BuildServiceLogic()
    return Listen()
};


/**
 * Add action into Seneca
 */
ServiceBase.prototype.add = function AddActionIntoSeneca(pattern, paramspec, action) {
    // assert(seneca.Config, Const.Message.ServiceBaseShouldBeConfigureBeforeIncludeAllPlugins)
    // assert(seneca.Config.serverConfig.pin, Const.Message.PinMissing)
    // var finalPattern = Pin.MergeToString(seneca.Config.serverConfig.pin, pattern)
    // services.add(finalPattern, paramspec, action)
    this.addService(pattern, paramspec, action)
};

/**
 * Include a service module plugin
 * @param  {any} path
 */
ServiceBase.prototype.include = function IncludeModuleService(path, options) {
    seneca.use(path, options)
}

/**
 * Get client by PIN. System will automatically initialize client if possible
 * @param  {string} pin
 */
ServiceBase.prototype.client = function GetClientByPin(pin) {
    // force to configure the transport incase our seneca service has not been configured
    seneca.configureTransport()

    return clientsManager.createIfNotExist(pin, seneca.Config.clientConfig)
}


/**
 * Get system config from consul
 */
ServiceBase.prototype.getConfig = function handleGetConfig(consulOption, serverExtraConfig) {
    let client = consultHelper.init(consulOption || {})
    return client.getConfig()
        .then(function mergeConfig(config) {
            return _.merge(config, serverExtraConfig || {})
        })
}

ServiceBase.prototype.setConfig = function handleSetConfigConsul(consulOption, config) {
    let client = consultHelper.init(consulOption || {})
    return client.setConfig(config)
}

/**
 * auto start system from config getting consul 
 */
ServiceBase.prototype.autostart = function handleAutoStart(consulOption, serverExtraConfig) {
    return this
        .getConfig(consulOption, serverExtraConfig)
        .then(function bootstraping(conf) {
            this.configure(conf)
            return this.listen()
        }.bind(this))
}

/**
 * Return a connection from Database Manager
 * @param  {string} dialectOrName
 * @return {Sequelize}
 */
ServiceBase.prototype.getConnection = function handleGetDatabaseConnection(dialectOrName) {
    return DatabaseManager.getConnection(dialectOrName)
}

/**
 * Register a domain model into Model Manager. All models will be auto wired up into sequelize instances
 * @param {any} any
 */
ServiceBase.prototype.registerModel = function registerDatabaseModel() {
    if (arguments.length === 1 && _.isArray(arguments[0])) {
        DatabaseManager.registerModel(arguments[0])
    }
    else {
        let models = Array.prototype.slice.apply(arguments)
        DatabaseManager.registerModel(models)
    }
}

/** Register Database Adapter
 * @param  {DatabaseAdapter} adapter
 */
ServiceBase.prototype.registerAdapter = function registerDatabaseAdapter(adapter) {
    DatabaseManager.registerAdapter(adapter)
}

/**
 * Register Authorization data into authorization module. Auth will not load the config by themself but by this registration
 * @param  {Authorization.AuthzData} authzData
 */
ServiceBase.prototype.registerAuthzData = function registerAuthzData(authzData) {
    Auth.updateAuthzData(authzData)
}

/**
 * Get all registered authz
 */
ServiceBase.prototype.getAuthzData = function getAuthzData() {
    return Auth.getAuthzData()
}

ServiceBase.prototype.log = Logging.log

ServiceBase.prototype.close = function shutdownSystem() {
    return clientsManager
        .closeAll()
        .then(() => {
            return seneca.closeAsync()
        })
}

// 
module.exports = (function exportServiceBase() {
    let service = new ServiceBase()
    service.TestHelper = require('./unit-tests/testclient')(service)
    global.testClientHelper = service.TestHelper
    return service
})()