/**
 * Logging Module for ServiceBase
 */
'use strict';
const _logger = require('loggly')
const _ = require('lodash')
const util = require('util')
let loggerClient = undefined
let logConfig = {
	mute: false
}

class Logging {
	constructor() {
	}
	/**
	 * Set config for logging
	 * @param  {Object} config
	 */
	config(config) {
		// this.log('Configuring logging client .....')
		config = config || {}
		config.mute = config.mute || false
		logConfig = config
		config && config.token && (loggerClient = _logger.createClient(config))
		this.log('Log client has been configured.')
	}

	/**
	 * Create a logging message
	 * @param  {any} message
	 * @param  {Object} obj
	 * @param  {Array<string>} tags
	 */
	log(message, obj, tags) {
		function seriallizeInputObject(inp, tags) {
			if (inp instanceof Error) {
				if (tags) {
					tags = tags || [];
					tags.push('Error')
				}

				// return {
				// 	message: inp.message,
				// 	stack: inp.stack
				// }
				return inp
			}
			else {
				return inp
			}
		}

		let logMessage = message
		if (_.isObject(obj)) {
			logMessage = {
				message: message,
				attach: seriallizeInputObject(obj, tags)
			}
		}

		if (loggerClient) {
			// message and tags
			if (_.isArray(obj) && !tags) {
				loggerClient.log(logMessage, obj)
			}
			else if (_.isObject(obj) && tags && tags.length > 0) {
				loggerClient.log(logMessage, tags)
			}
			else {
				loggerClient.log(logMessage)
			}
		}

		if (logConfig.mute !== true) {
			// in case that the logger not yet configured, let's throw to console
			if (!_.isString(logMessage)) {
				console.log(new Date().toString() + " - " + logMessage.message)
				if (logMessage.attach instanceof Error) {
					console.trace(logMessage.attach)
				}
				else {
					console.log(logMessage.attach)
				}
			}
			else {
				console.log(new Date().toString() + " - " + logMessage)
			}
		}
	}
}



module.exports = new Logging()