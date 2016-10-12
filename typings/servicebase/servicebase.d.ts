/// <reference path="../sequelize/sequelize.d.ts" />

/**
 * Seneca instance
 */
declare namespace SenecaJS {
	/**
	 * Service Action Pattern
	 * 
	 * @interface MinimalServicePattern
	 */
	interface MinimalServicePattern {
		/**
		 * Microservice internal name
		 * 
		 * @type {string}
		 */
		module: string
		/**
		 * Service action name
		 * 
		 * @type {string}
		 */
		cmd: string
	}

	type ServicePattern = string | MinimalServicePattern
	type ServiceParamSpec = Object | Authorization.UserAuthInfo
	type PinPattern = string | Object

	/**
	 * Seneca service action function
	 * 
	 * @interface SenecaServiceFunction
	 */
	interface SenecaServiceFunction {
		(message: Object, response: SenecaActCallback): void
	}

	/**
	 * Seneca Act callback
	 * 
	 * @interface SenecaActCallback
	 */
	interface SenecaActCallback {
		(err: Error, response: any): void
	}

	/**
	 * Seneca act callback by promise
	 * 
	 * @interface SenecaActCallbackWithPromise
	 */
	interface SenecaActCallbackWithPromise {
		/**
		 * Callback data
		 * 
		 * @type {*}
		 */
		response: any
	}

	/**
	 * Seneca plugin options
	 * 
	 * @interface PluginOptions
	 */
	interface PluginOptions { }

	type PluginModule = (options: any) => void

	interface SenecaJSAutoInjectFromServiceBase {
		ServiceBase: ServiceBase
		DB: DatabaseManager.DatabaseManager,
		/**
		 * App Config
		 * 
		 * @type {Common.Config}
		 */
		Config: Common.Config

		/**
		 * Logging function, injected by ServiceBase
		 * @param  {string} message
		 * @param {Array<string>} [tags] Default tags to be included to Loggly
		 */
		logger(message: string, tags?: Array<string>)
	}

	/**
	 * Seneca JS Instance
	 * 
	 * @interface SenecaJS
	 */
	export interface SenecaJS extends SenecaJSAutoInjectFromServiceBase {

		/**
		 * Add an action into seneca instance
		 * 
		 * @param {ServicePattern} pattern Matching pattern
		 * @param {SenecaServiceFunction} action Function to executing
		 * @returns {this} Seneca instance
		 */
		add(pattern: ServicePattern, action: SenecaServiceFunction): this

		/**
         * Add an action into seneca instance
         * 
         * @param {ServicePattern} pattern Matching pattern
         * @param {ServiceParamSpec} paramspec Parameter object
         * @param {SenecaServiceFunction} action Function to executing
         * @returns {this} Seneca instance
         */
        add(pattern: ServicePattern, paramspec: ServiceParamSpec, action: SenecaServiceFunction): this
		/**
		 * Execute / Invoke an action
		 * 
		 * @param {ServicePattern} pattern Matching pattern
		 * @returns {Promise<SenecaActCallbackWithPromise>}
		 */
		act(pattern: ServicePattern): Promise<SenecaActCallbackWithPromise>
		/**
		 * Execute / Invoke an action
		 * 
		 * @param {ServicePattern} pattern Matching pattern
		 * @param {ServiceParamSpec} paramspec Parameter Object
		 * @returns {Promise<SenecaActCallbackWithPromise>} 
		 */
		act(pattern: ServicePattern, paramspec: ServiceParamSpec): Promise<SenecaActCallbackWithPromise>


		/**
		 * Register action in service. Authorization will be handled before executing action 
		 * @param {ServicePattern} pattern Matching pattern
		 * @param {SenecaServiceFunction} action Function for executing
		 * @returns {this} (description)
		 */
		addService(pattern: ServicePattern, action: SenecaServiceFunction): this
        /**
         * Register action in service. Authorization will be handled before executing action
         *  
         * @param {ServicePattern} pattern (description)
         * @param {ServiceParamSpec} paramspec Parameter Object
         * @param {SenecaServiceFunction} action Function for executing
         * @returns {this} 
         */
        addService(pattern: ServicePattern, paramspec: ServiceParamSpec, action: SenecaServiceFunction): this
		/**
		 * Register action in service. Authorization will be handled before executing action
		 * 
		 * @param {ServicePattern} pattern Matching pattern
		 * @returns {Promise<SenecaActCallbackWithPromise>}
		 */
		addService(pattern: ServicePattern): Promise<SenecaActCallbackWithPromise>

		/**
		 * Executing / Invoking a service action inside a seneca module instance
		 * 
		 * @param {ServicePattern} pattern Matching pattern
		 * @returns {Promise<SenecaActCallbackWithPromise>}
		 */
		actService(pattern: ServicePattern): Promise<SenecaActCallbackWithPromise>
		/**
		 * Executing / Invoking a service action inside a seneca module instance
		 * 
		 * @param {ServicePattern} pattern Matching pattern
		 * @param {Object} paramspec Parameter Object
		 * @returns {Promise<SenecaActCallbackWithPromise>}
		 */
		actService(pattern: ServicePattern, paramspec: Object): Promise<SenecaActCallbackWithPromise>
	}
}

declare namespace Common {
	/**
	 * Transportation Configuration
	 * 
	 * @interface TransportConfig
	 */
	interface TransportConfig {
	}

	/**
	 * Server Configuration, for seneca
	 * 
	 * @interface ServerConfig
	 */
	interface ServerConfig {
		/**
		 * Type of transport, such as amqp, ...
		 * 
		 * @type {string}
		 */
		type: string
        /**
         * Messaging queue URL. For example: amqp://guest:guest@pm.absoft.vn:5672
         * 
         * @type {string}
         */
        url: string
        /**
         * Pin
         * 
         * @type {(string | Object)}
         */
        pin: string | Object
        /**
         * Timeout in ms. Default is 2000ms
         * 
         * @type {number}
         */
        timeout?: number
		/**
		 * Function as error handler
		 * 
		 * @type {Function}
		 */
		errhandler: Function
	}

	/**
	 * Client Configuration, for seneca instance
	 * 
	 * @interface ClientConfig
	 */
	interface ClientConfig {
		/**
		 * Type of transport, such as amqp
		 * 
		 * @type {string}
		 */
		type: string
        /**
         * Messageing server url. For example: amqp://guest:guest@pm.absoft.vn:5672 
         * 
         * @type {string}
         */
        url: string
        /**
         * Timeout, in ms . Default is 2000ms
         * 
         * @type {number}
         */
        timeout?: number
	}

	/**
	 * Sequelize database configuration options
	 * 
	 * @interface DatabaseInstanceConfigOption
	 */
	interface DatabaseInstanceConfigOption {
		host: string
		port: number
		logging: boolean
		/**
		 * If forcesync, then all data in your database instance will be wipped out
		 * 
		 * @type {boolean}
		 */
		forceSync: boolean
	}

	/**
	 * Sequelize database instance config
	 * 
	 * @interface DatabaseInstanceConfig
	 */
	interface DatabaseInstanceConfig {
		user: string
		password: string
		database: string
		/**
		 * Dialect name
		 * 
		 * @type {string}
		 */
		dialect: string
		/**
		 * Options
		 * 
		 * @type {DatabaseInstanceConfigOption}
		 */
		options: DatabaseInstanceConfigOption
		isdefault: boolean
	}

	interface DatabaseConfig<DatabaseInstanceConfig> extends Object {
	}

	interface LoggingConfig {
	}

	interface ConsulConfig {
		PROJECT_NAME: string
		/**
		 * Default is development, automatic get from ENV
		 */
		RUNNING_ENV: string
		SERVICE_NAME: string
		host: string
		port: number
		/**
		 * True if using SSL
		 * 
		 * @type {boolean}
		 */
		secure: boolean
		/**
		 * Certification for SSL
		 * 
		 * @type {*}
		 */
		ca: any
	}

	/**
	 * App config
	 * 
	 * @interface Config
	 */
	export interface Config {
		/**
		 * Project Name, automatically get from ENV
		 * 
		 * @type {string}
		 */
		PROJECT_NAME: string

		/**
		 * Running environment, default is development, automatic get from ENV
		 * 
		 * @type {string}
		 */
		RUNNING_ENV: string

		/**
		 * Name of this microservice
		 * 
		 * @type {string}
		 */
		SERVICE_NAME: string

		/**
		 * Configuration for transport layer
		 * 
		 * @type {AMQPTransportConfig}
		 */
		transport: TransportConfig

		/**
		 * Server Config
		 * 
		 * @type {AMQPServerConfig}
		 */
		serverConfig: ServerConfig
		/**
		 * Client config
		 * 
		 * @type {AMQPClientConfig}
		 */
		clientConfig: ClientConfig
		/**
		 * Database connection config, for sequelize
		 * 
		 * @type {DatabaseConfig<DatabaseInstanceConfig>}
		 */
		database: DatabaseConfig<DatabaseInstanceConfig>
		/**
		 * Logging config, currently supported Loggly only
		 * 
		 * @type {LoggingConfig}
		 */
		logging: LoggingConfig
	}
}

declare namespace Authorization {
	export interface UserAuthInfo {
		/**
	 	* user id
		* @type {number}
	 	*/
		id: number
		/**
	 	* username
	 	* 
	 	* @type {string}
	 	*/
		username: string
		/**
	 	* user roles, extracted from gateway
	 	* 
	 	* @type {Array<string>}
	 	*/
		roles: Array<string>
	}

	export interface AuthzData extends Object { }
}

declare namespace Logging {
	/**
	 * Logging function
	 * 
	 * @interface log
	 */
	export interface log {
		(message: string, obj: Object, tags: Array<string>)
		(message: string)
		(obj: Object)
		(obj: Object, tags: Array<string>)
		(message: string, obj: Object)
		(message: string, tags: Array<string>)
	}
}

declare namespace DatabaseManager {
	type ObjectOrArrayObject = Object | Array<Object>
	/**
	 * Connection Information, private information to manage all connections inside DatabaseManager
	 * 
	 * @interface ConnectionInfo
	 */
	export interface ConnectionInfo {
		/**
		 * Connection dialect name
		 * 
		 * @type {string}
		 */
		dialect: string
		/**
		 * Connection name
		 * 
		 * @type {string}
		 */
		name: string
		/**
		 * Sequelize instance
		 * 
		 * @type {ConnectionInstance}
		 */
		sequelize: ConnectionInstance
	}

	export interface ConnectionConfig {

		database: string

		user: string

		password: string

		options: Common.DatabaseInstanceConfigOption
	}

	/**
	 * Automatic build where clause condition for sequelize
	 * 
	 * @interface AutoBuildWhereClauseCondition
	 */
	export interface AutoBuildWhereClauseCondition {
		condition: boolean,
		value: any
	}

	/**
	 * Automatic build where clause for sequelize
	 * 
	 * @interface AutoBuildWhereClause
	 */
	export interface AutoBuildWhereClause {
		[key: string]: AutoBuildWhereClauseCondition
	}

	export interface ConnectionInstanceModels {
		[key: string]: sequelize.Model<this, Object>
	}

	/**
	 * Connnection instance
	 * 
	 * @interface ConnectionInstance
	 * @extends {sequelize.SequelizeStaticAndInstance}
	 */
	export interface ConnectionInstance extends sequelize.SequelizeStaticAndInstance {
		models: ConnectionInstanceModels
		_InternalConfig: ConnectionInfo,
		Schemas?: Array<string>
		registerModel(model: Object): sequelize.Model<this, Object>
		registerSchema(tableSchema: string): ConnectionInstance
		/**
		 * Generate UUID version 1 for UUID column type 
		 * 
		 * @returns {string}
		 */
		uuidv1(): string
		/**
		 * Generate UUID version 4 for UUID column type 
		 * 
		 * @returns {string}
		 */
		uuidv4(): string

		/**
		 * Get raw data from the result of sequelize which ready to send to seneca response
		 * 
		 * @param  {ObjectOrArrayObject} data
		 * @returns ObjectOrArrayObject
		 */
		raw(data: ObjectOrArrayObject): ObjectOrArrayObject

		/**
		 * Build sequelize where clause which ready to pass to sequelize model actions
		 * Sample as below 
		 * 
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
		 * @param  {Object} condition
		 * @returns Object
		 */
		buildWhereClause(condition: Array<AutoBuildWhereClause>): Object
	}


	export interface ModelManager {

		registerModel(models: Object): void

		registerModel(models: Array<Object>): void

		getModels(): Array<Object>
	}


	export interface Adapter extends Function {
		(options: ConnectionConfig): ConnectionInstance
	}


	export interface DatabaseAdapter extends Function {
		(listAdapters: Array<Adapter>, modelManager: ModelManager, logger: Logging.log): void
	}

	export interface DatabaseManager {
		Config(config: Object): void

		getConnection(dialectOrName: string): Promise<ConnectionInstance>

		registerModel(models: ObjectOrArrayObject): void

		registerAdapter(adapter: DatabaseAdapter): void

		/**
		 * Register internal supported dialect 
		 * @param  {string} adapterName
		 * @returns void
		 */
		registerAdapter(adapterName: string): void
	}
}

/**
 *	Service Tester 
 * 
 * @interface TestClient
 */
interface TestClient {
	(client: SenecaJS.SenecaJS): this

	/**
	 * Set Authentication information for current user.
	 * For example, when you want to test the case of authenticated user, you can set the authentication info
	 * client.setAuthUser({
     *           id: 1,
     *           roles: ['cho meo', 'admin']
     *       })
	 * @param  {Authorization.UserAuthInfo} auth
	 * @returns void
	 */
	setAuthUser(auth: Authorization.UserAuthInfo): void

	/**
	 * Get current authentication info
	 * @returns Authorization.UserAuthInfo
	 */
	getAuthUser(): Authorization.UserAuthInfo

	/**
	* Execute / Invoke an action. Auto inject AuthUser if any
	* 
	* @param {ServicePattern} pattern Matching pattern
	* @returns {Promise<SenecaActCallbackWithPromise>}
	*/
	act(pattern: SenecaJS.ServicePattern): Promise<SenecaJS.SenecaActCallbackWithPromise>

	/**
	 * Execute / Invoke an action. Auto inject AuthUser if any
	 * 
	 * @param {ServicePattern} pattern Matching pattern
	 * @param {ServiceParamSpec} paramspec Parameter Object
	 * @returns {Promise<SenecaActCallbackWithPromise>} 
	 */
	act(pattern: SenecaJS.ServicePattern, paramspec: SenecaJS.ServiceParamSpec): Promise<SenecaJS.SenecaActCallbackWithPromise>

	close(): Promise<number>

	/**
	* Generate UUID version 1 for UUID column type 
	* 
	* @returns {string}
	*/
	uuidv1(): string
	/**
	 * Generate UUID version 4 for UUID column type 
	 * 
	 * @returns {string}
	 */
	uuidv4(): string
}

/**
 *	Return a test helper for ServiceBase 
 * @interface ServiceBaseTestHelper
 */
interface ServiceBaseTestHelper {
	/**
	 *	Return a test helper for ServiceBase 
	 *
	 * @param  {Common.Config} config
	 * @param  {SenecaJS.PinPattern} pin
	 * @param  {string} serviceName
	 * @returns Promise
	 */
	start(config: Common.Config, pin: SenecaJS.PinPattern, serviceName: string): Promise<TestClient>

	/**
	 * Wait until ready
	 * @param  {Function()} callback
	 */
	onReady(callback: (client: TestClient, pin: string) => void): void

	/**
	 * Set this test client state to Ready
	 * @returns void
	 */
	setReady(): void

	/**
	 * Return random string with length by n
	 * 
	 * @param  {number} n Length of random string, default is 36
	 * @returns string
	 */
	random(n: number): string

	/**
	 * Close all connection. Return 1 in Promise if success
	 * 
	 * @returns Promise<number>
	 */
	close(): Promise<number>

	/**
	 * Get error message detail
	 * 
	 */
	getErrorMessage(err): string

	/**
	 * Assert error message 
	 * 
	 * @param  {string} expect
	 * @param  {Error} err
	 */
	assertErrorMessage(expect: string, err: Error)
	assertErrorMessage(expect: string, err: string)
}

declare interface ServiceBase {
	/**
	 * Servicebase configuration
	 * 
	 * @type {Common.Config}
	 */
	Config: Common.Config

	// for servicebase core
	/**
	 * Configure this service
	 */
	configure(config: Common.Config): void
	/**
	 * Listen as a server
	 * 
	 * @returns {Promise<SenecaJS.SenecaJS>}
	 */
	listen(): Promise<SenecaJS.SenecaJS>
	/**
	 * Auto start this service by getting the config from Consul, then merge with serverExtraConfig
	 * 
	 * @param {Common.ConsulConfig} consulOption
	 * @param {Object} serverExtraConfig
	 * @returns {Promise<SenecaJS.SenecaJS>}
	 */
	autostart(consulOption: Common.ConsulConfig, serverExtraConfig: Object): Promise<SenecaJS.SenecaJS>
	/**
	 * Get configuration of this service by looking in Consul, then merge with serverExtraConfig
	 * 
	 * @param {Common.ConsulConfig} consulOption
	 * @param {Object} serverExtraConfig
	 * @returns {Promise<Common.Config>}
	 */
	getConfig(consulOption: Common.ConsulConfig, serverExtraConfig: Object): Promise<Common.Config>

	/**
	 * Normalize input config and then set it back to consul. This function does not need any initialization from servicebase
	 * 
	 * @param {Common.ConsulConfig} consulOption
	 * @param {Common.Config} config The config you want to store into Consul
	 * @returns {Promise<Common.Config>}
	 */
	setConfig(consulOption: Common.ConsulConfig, config: Common.Config): Promise<Common.Config>

	/**
	 * Get a client for specify pin
	 * 
	 * @param {SenecaJS.PinPattern} pin
	 * @returns {Promise<SenecaJS.SenecaJS>}
	 */
	client(pin: SenecaJS.PinPattern): Promise<SenecaJS.SenecaJS>

	/**
	 * Close all connections
	 * 
	 * @returns void
	 */
	close(): Promise<number>

	// for Microservices
	/**
	 * Register action
	 * 
	 * @param {string} pattern 
	 * @param {Object} paramspec
	 * @param {SenecaJS.SenecaServiceFunction} serviceFunction 
	 */
	add(pattern: string, paramspec: Object, serviceFunction: SenecaJS.SenecaServiceFunction): void
	/**
	 * Register action
	 * 
	 * @param {string} pattern 
	 * @param {SenecaJS.SenecaServiceFunction} serviceFunction 
	 */
	add(pattern: string, serviceFunction: SenecaJS.SenecaServiceFunction): void
	/**
	 * Include a plugin into seneca
	 * 
	 * @param {string} name Path of module file
	 * @param {SenecaJS.PluginOptions} [options]
	 */
	include(name: string, options?: SenecaJS.PluginOptions): void
	/**
	 * Include a plugin into seneca
	 * 
	 * @param {SenecaJS.PluginModule} module Instance of a plugin
	 * @param {SenecaJS.PluginOptions} [options]
	 */
	include(module: SenecaJS.PluginModule, options?: SenecaJS.PluginOptions): void

	/**
	 * Database - Get a connection by dialect or by name
	 * 
	 * @param {string} dialectOrName Dialect name or connection name
	 * @returns {Promise<DatabaseManager.ConnectionInstance>}
	 */
	getConnection(dialectOrName: string): Promise<DatabaseManager.ConnectionInstance>

	/**
	 * Register model for autowired up later
	 * @param  {Object} model
	 * @returns void
	 */
	registerModel(model: Object): void
	registerModel(models: Object[]): void

	/**
	 * Register an instance of database adapter
	 * 
	 * @param {DatabaseManager.DatabaseAdapter} adapter
	 */
	registerAdapter(adapter: DatabaseManager.DatabaseAdapter): void
	/**
	 * Register internal supported dialect 
	 * @param  {string} adapterName
	 * @returns void
	 */
	registerAdapter(adapterName: string): void

	/**
	 * Register authorization config
	 * 
	 * @param {Authorization.AuthzData} authzData (description)
	 */
	registerAuthzData(authzData: Authorization.AuthzData)

	/**
	 * Return all registered authz data
	 * 
	 * @returns {Authorization.AuthzData}
	 */
	getAuthzData(): Authorization.AuthzData

	log(message: string, obj: Object, tags: Array<string>)
	log(message: string)
	log(obj: Object)
	log(obj: Object, tags: Array<string>)
	log(message: string, obj: Object)
	log(message: string, tags: Array<string>)

	/**
	 * @type {ServiceBaseTestHelper}
	 */
	TestHelper: ServiceBaseTestHelper
}

declare module 'servicebase' {
	// export = ServiceBase
	let servicebase: ServiceBase;
	namespace servicebase { }
	export = servicebase;
}

/**
 * testClient to help easy call in every test file
 * 
 * @type {ServiceBaseTestHelper}
 */
declare var testClientHelper: ServiceBaseTestHelper