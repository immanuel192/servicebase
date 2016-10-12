/**
 * Authentication & Authorization for ServiceBase
 * Copyright Trung Dang - trungdt@absoft.vn - 2016
 */
'use strict';
const _ = require('lodash')
let authz = require('./authorization/authorization')
let pin = require('../modules/pin')
let log = _.noop

/**
 * Handle all tasks for authentication & authorization
 */
class Auth {
	constructor(logger) {
		log = logger
		// TODO: check for REDIS here
		authz.init(logger, null)
	}

	/**
	 * Set system global config, for Authorization process. Call this function when you have config from servicebase
	 * @param  {any} config
	 */
	setConfig(config) {
		authz.setConfig(config)
	}

	/**
	 * Inject authentication & authorization into action
	 * @param  {string} moduleName Module name
	 * @param  {string} cmdName Action name
	 * @param  {Function} action
	 */
	injectAuthToAction(moduleName, cmdName, action) {
		function injectAuthStatus(params) {
			let userId = (params.User && params.User.id && _.isNumber(params.User.id) && params.User.id > 0) ? params.User.id : 0

			// inject authenticated
			params.authenticated = (userId > 0)

			// decorate correct User object
			params.User = {
				id: userId,
				username: (userId > 0 && _.isString(params.User.username)) ? (params.User.username) : '',
				roles: (userId > 0 && _.isArray(params.User.roles)) ? params.User.roles : []
			}

			params['Consumer'] = params['Consumer'] || ''
		}

		/**
		 * Accept any kind of Error, and return formated type of it
		 * @param  {Error} err
		 */
		function encapsulateError(err) {
			// senecajs only allow you to return array or object
			if (err instanceof Error) {
				return err.message
			}
			return err
		}

		return function doAuthorizationCheck() {
			let done = arguments[1] || _.noop
			let callback = function handleCallback(arg1, arg2) {
				if (arg1 === null) {
					// sucess case, we need to encapsulate the result into object form like { success: bool, data: Object }
					return done(arg1, {
						success: true,
						data: arg2
					})
				}

				// try to log fatal error
				log(`#${cmdName} - Exception - ${arg1.message || arg1} - ` + pin.Serialize(params), arg1)

				return done(null, {
					success: false,
					data: encapsulateError(arg1)
				})
			}

			let params = _.clone(arguments[0])

			let reject = function reject(message) {
				return callback(new Error(message))
			}

			// check for module pattern
			if (!params.hasOwnProperty(global.Const.PIN)) {
				log(`#${cmdName} - Reject - No module pattern found - ` + pin.Serialize(params))
				return reject('No module pattern found')
			}

			// try to get user info from token
			injectAuthStatus(params)

			if (authz.canPerform(moduleName, cmdName, params.User, params['Consumer'])) {
				// success? inject user info if any into arguments
				log(`#${cmdName} - Invoking: ` + pin.Serialize(params, 1))
				return action.call(this, params, callback)
			}

			log(`#${cmdName} - Unauthorized - ` + pin.Serialize(params))
			return reject('Unauthorized')
		}
	}

	updateAuthzData(authzData) {
		authz.updateAuthzData(authzData)
	}

	getAuthzData() {
		return authz.getAuthzData()
	}
}

module.exports = function exportAuth(logger) {
	return new Auth(logger)
}
