'use strict'
/*
To update the consul K/V in order to help ServiceBase run correctly during development process
*/
const PROJECT_NAME = 'MyProject'
const RUNNING_ENV = process.env.NODE_ENV || 'development'
const SERVICE_NAME = 'MyService'
const _ = require('lodash')
let consul = require('../core/consul-client')(_.noop)
require('../modules/bootstrap')

var client = consul.init({
    PROJECT_NAME: PROJECT_NAME,
    RUNNING_ENV: RUNNING_ENV,
    SERVICE_NAME: SERVICE_NAME,
    host: 'rabbitmq-server',
    port: 8500,
    secure: false,
    ca: undefined,
    promisify: true
})

var config = {
    redis: {},
    transport: {},
    serverConfig: {
        type: 'amqp',
        url: 'amqp://username:password@rabbitmq-server:5672',
        pin: 'module:a',
        timeout: 9999
    },
    clientConfig: {
        type: 'amqp',
        url: 'amqp://username:password@rabbitmq-server:5672',
        timeout: 9999
    },
    database: {
        // adapter 1
        myPostgres: {
            user: 'postgres',
            password: '123456',
            database: 'pm',
            dialect: 'postgres',
            options: {
                dialect: 'postgres',
                host: 'localhost',
                port: 5432,
                logging: false,
                forceSync: false
            },
            isdefault: true
        },
        // adapter 2
        myMySql: {
            user: 'root',
            password: '123456',
            database: 'pm',
            dialect: 'mysql',
            options: {
                dialect: 'mysql',
                host: 'localhost',
                port: 5432,
                logging: false,
                forceSync: true
            },
            isdefault: false
        }
    },
    logging: {
        mute: true, // dont send log to console
        token: "157b1920-5786-4f51-b09a-c47a7b78ab96",
        subdomain: "absoft",
        json: true,
        // add service name by default
        tags: [RUNNING_ENV, PROJECT_NAME, SERVICE_NAME]
    }
}

/****************/
//  module a

client.setConfig(config)
    .then(function () {
        console.log('Settings have been updated')
    })
    .catch(function (err) {
        console.log('Settings got exception')
        console.log(JSON.stringify(err, null, 4))
    })
