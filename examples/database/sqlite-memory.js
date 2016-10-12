'use strict';

let service = require("../../index");
let connectionName = 'default'
let config = {
    PROJECT_NAME: '_',
    RUNNING_ENV: 'development',
    SERVICE_NAME: '_',
    serverConfig: {
        errhandler: function ErrorHandler(err) {
            console.log('Seneca got error:' + err.message)
            // return false so that seneca will continue throw the error to promise chain
            return false
        }
    },
    database: {
        // adapter 1
        default: {
            database: 'mydatabase',
            dialect: 'sqlite',
            options: {
                dialect: 'sqlite',
                logging: false,
                forceSync: false
            },
            isdefault: true
        }
    },
}


var userModel = require('../models/UserModel')
service.configure(config)

// service.registerAdapter(global.Const.DIALECT_POSTGRES)

service.configure(config)

service.registerAdapter(global.Const.DIALECT_SQLITE)
// register usermodel
service.registerModel(userModel)
service.registerModel(require('../models/PassportModel'))

service
    .getConnection(connectionName)
    .then(function connectedDb(sequelize) {
        // var processedModel  = sequelize.registerModel(userModel)
        sequelize.models.usermodel.create({
            username: 'trungdt',
            email: 'trungdt@absoft.vn'
        })
            .then(function () {
                sequelize.models.usermodel
                    .find({
                        where: {
                            username: 'trungdt'
                        }
                    })
                    .then(function (data) {
                        console.log(JSON.stringify(data, null, 4))
                    })
            })


        sequelize.models.passportmodel
            .find({
                where: {
                    userId: 1
                }
            })
            .then(function (data) {
                console.log(JSON.stringify(data, null, 4))
            })
    })

console.log('server has been started')
