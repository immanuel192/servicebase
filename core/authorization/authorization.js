'use strict';

const _ = require('lodash')
const assert = require('assert')
let appConfig = {}
let log = _.noop
let redisConnection

let authzCaching = {
	/** 
	 * Service name level. Mandatiory 
	 */
	'_': {
		'*': true,
		/**
		 *  Module level
		 * Possible keys:
	     * - 'modulename' : specific service name
	     * - '*' : all services in this microservices
		 * 
		 * Possible values
		 * - Object: declare authz for all actions
		 * - true  : allow to perform in any cases  
		 * - false : no one can perform this action  
	     * - 'auth': only allow to perform IF authenticated
		 * - Array<'auth'>: only allow to perform IF has expected roles
		 */
		//'benchmark-service': {
		/**
		 * Command level
		 * Possible values:
		 * - true   : allow to perform in any cases
		 * - false  : no one can perform this action  
		 * - 'auth' : only allow to perform IF authenticated
		 * - Array[string] : Array of roles
		 * - Object : Declare authorization option, include service trust
		 */
		// 	'test': ['admin', 'user'],
		// 	'second-test': ['admin', 'user'],
		// 	'*': true
		// }
	}
}

/**
 * Perform authorization checking
 */
class Authorization {

	/**
	 * @param  {any} logger
	 * @param  {any} redis
	 */
	init(logger, redis) {
		log = logger
		redisConnection = redis

		// init caching preload process

		// handle events when exiting application
	}

	/**
	 * Set system global config, for Authorization process. Call this function when you have config from servicebase
	 * @param  {any} config
	 */
	setConfig(config) {
		assert(config[global.Const.SERVICE_NAME] && _.isString(config[global.Const.SERVICE_NAME]), Const.Message.AuthConfigShouldHaveServiceName)
		appConfig = config
	}

	/**
	 * Return true if this user can perform the action after doing authorization
	 * @param  {string} module
	 * @param  {string} cmd
	 * @param  {Object | User}  { id, roles, username }
	 * @param  {string}  consumer
	 */
	canPerform(module, cmd, user, consumer) {
		/**
		 * Return true if any element in actualRoles exist in expectedRoles, without case sentensive
		 * @param  {Array<string>} expectedRoles
		 * @param  {Array<string>} actualRoles
		 */
		function validateRoles(expectedRoles, actualRoles) {
			let ret = false
			if (!(_.isArray(expectedRoles) || _.isArray(actualRoles))) {
				return ret
			}

			_.each(actualRoles, function loopThroughActual(v, k) {
				let vLower = v.toLowerCase()
				if (_.some(expectedRoles, (t) => {
					return t.toLowerCase() === vLower
				})) {
					ret = true
					// stop foreach
					return false
				}
			});
			return ret
		}

		/**
		 * Return true if user authenticated
		 * 
		 * @param  {} user
		 * @param  {} commandAuthz
		 */
		function allowIfAuthenticated(user, commandAuthz) {
			return (commandAuthz === global.Const.AUTHZ_ALLOW_IF_AUTHENTICATED) && (user.id > 0)
		}

		/**
		 * Return true if user has roles matched with our expected
		 * 
		 * @param  {} user
		 * @param  {} commandAuthz
		 */
		function allowIfHasRole(user, commandAuthz) {
			return (user.id > 0) && (_.isArray(commandAuthz)) && validateRoles(commandAuthz, user.roles)
		}

		/**
		 * Return true if consumer service can be trusted
		 * 
		 * @param  {} user
		 * @param  {} commandAuthz
		 */
		function allowIfTrustService(user, commandAuthz, consumer) {
			/**
			 * Configuration Declare Sample
			 * 
			 {
                // optional
                roles: ['admin'],
                // mandatiory
                services: ['gateway-api'],
				// optional 
                auth: true | null
             }

			 Scenarios:
			 - services: allow requests from expected service only
			 - roles (optional): allow requests from user who has expected roles only
			 - auth (optional): only accept true or null / undefined. allow requests from user who authenticated only
			 */

			let isAllow = _.isPlainObject(commandAuthz) && commandAuthz.hasOwnProperty('services')

			// for auth
			if (commandAuthz.hasOwnProperty('auth')) {
				isAllow = isAllow && (commandAuthz['auth'] === true)
			}

			// for roles
			if (commandAuthz.hasOwnProperty('roles') && _.isArray(commandAuthz.roles)) {
				isAllow = isAllow && validateRoles(commandAuthz.roles, user.roles)
			}

			// check services
			if (isAllow && consumer.length > 0 && _.isArray(commandAuthz['services'])) {
				isAllow = isAllow && (_.indexOf(commandAuthz['services'], consumer) > -1)
			}

			return isAllow
		}

		assert(_.isString(module) && module.length > 0, Const.Message.AuthModuleNameMissing)
		assert(_.isString(cmd) && cmd.length > 0, Const.Message.AuthCmdNameMissing);

		// if userid is not number, set it to zero
		user = user || {
			id: 0,
			roles: []
		};
		if (!_.isArray(user.roles)) {
			user.roles = [user.roles]
		}

		(!_.isNumber(user.id)) && (user.id = 0)

		let serviceName = appConfig[global.Const.SERVICE_NAME]

		if (!authzCaching.hasOwnProperty(serviceName)) {
			return false
		}

		let serviceAuthzConfig = authzCaching[serviceName]
		// check module level
		if (serviceAuthzConfig.hasOwnProperty(module)) {
			let commandAuthz = ''
			if (serviceAuthzConfig[module].hasOwnProperty(cmd)) {
				commandAuthz = serviceAuthzConfig[module][cmd]
			}
			else if (serviceAuthzConfig[module].hasOwnProperty(global.Const.AUTHZ_WILDCAT_ALL)) {
				commandAuthz = serviceAuthzConfig[module][global.Const.AUTHZ_WILDCAT_ALL]
			}
			else {
				return false
			}
			return (
				(commandAuthz === true)
				|| allowIfAuthenticated(user, commandAuthz)
				|| allowIfHasRole(user, commandAuthz)
				|| allowIfTrustService(user, commandAuthz, consumer)
			)
		}

		// if module is not declared but we have wildcat declared
		if (serviceAuthzConfig.hasOwnProperty(global.Const.AUTHZ_WILDCAT_ALL)) {
			let serviceAuthz = serviceAuthzConfig[global.Const.AUTHZ_WILDCAT_ALL]
			return (
				(serviceAuthz === true)
				|| allowIfAuthenticated(user, serviceAuthz)
				|| allowIfHasRole(user, serviceAuthz)
				|| allowIfTrustService(user, serviceAuthz, consumer)
			)
		}

		return false
	}

	updateAuthzData(authzData) {
		let canImport = true
		// normalize input authz
		_.forOwn(authzData, function (service, serviceKey) {
			// service level
			_.forOwn(service, function (m, mKey) {
				// module level
				if (
					_.isBoolean(m)
					|| (m === 'auth')
					|| (_.isArray(m) && _.every(m, String))
				) {
					return true
				}
				else
					if (_.isObject(m)) {
						// cmd level
						_.forOwn(m, function (cmd) {
							// cmd level has only the below cases
							if (_.isBoolean(cmd)
								|| (cmd === 'auth')
								|| (_.isArray(cmd) && _.every(cmd, String))
								|| (_.isPlainObject(cmd) && cmd.hasOwnProperty('services') && _.isArray(cmd.services))
							) {
								return true
							}
							else {
								canImport = false
								return false
							}
						})
					}
					else {
						canImport = false
						// no more things to check, fail fast
						return false
					}
			})
		})

		if (canImport) {
			authzCaching = authzData
		}
		else {
			log('Import authorization failed', authzData)
		}
	}

	getAuthzData() {
		return authzCaching
	}
}

module.exports = new Authorization()
