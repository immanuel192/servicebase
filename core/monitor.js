/**
 * Keymetrics.io tracking monitor 
 * pm2 link x9p4b4fyyqnzvfx ms4frctirlmixc3 [server_name]
 */
'use strict';
const _ = require('lodash')
let log = _.noop
let pmx
let probe

class Monitor {
	constructor(logger) {
		log = logger
	}

	init(config) {
		pmx = require('pmx').init({
			http: true, // HTTP routes logging (default: false) 
			http_latency: 200,  // Limit of acceptable latency 
			http_code: 500,  // Error code to track' 
			alert_enabled: true,  // Enable alerts (If you add alert subfield in custom it's going to be enabled) 
			ignore_routes: [/socket\.io/, /notFound/], // Ignore http routes with this pattern (default: []) 
			errors: true, // Exceptions loggin (default: true) 
			custom_probes: true, // Auto expose JS Loop Latency and HTTP req/s as custom metrics (default: true) 
			network: true, // Network monitoring at the application level (default: false) 
			ports: true  // Shows which ports your app is listening on (default: false) 
		});
		
		probe = pmx.probe()

		let metric = probe.metric({
			name: 'CPU usage',
			value: function () {
				return 0;
			},
			alert: {
				mode: 'threshold',
				value: 95,
				msg: 'Detected over 95% CPU usage', // optional 
				func: function () { //optional 
					console.error('Detected over 95% CPU usage');
				},
				cmp: "<" // optional 
			}
		})
	}

}

module.exports = function exportMonitor(logger) {
	return new Monitor(logger)
} 
