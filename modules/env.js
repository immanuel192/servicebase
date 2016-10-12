'use strict';
/**
 * Environment Checker
 * To help automatically apply the correct environment by argument --env yourEnv
 * Copyright Trung Dang @2016
 */

module.exports = function envSwitcher() {
    let envArgs = process.argv.splice(process.execArgv.length + 2);
    let environment = 'development';
    if (envArgs.length >= 2) {
        for (let i = 0; i < envArgs.length; i++) {
            if (envArgs[i] === '--env' && i < envArgs.length - 1) {
                environment = envArgs[i + 1]
                console.log(`Switch environment to ${environment}`)
            }
        }
    }

    process.env.NODE_ENV = environment
}