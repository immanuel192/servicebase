var service = require("../../index");
function ErrorHandler(err) {
    console.log('Seneca got error:' + err.message)
    // return false so that seneca will continue throw the error to promise chain
    return false
}

// before start, let set consul setting to ENV 
process.env.SERVICE_NAME = 'MyService'
process.env.PROJECT_NAME = 'MyProject'
process.env.CONSUL_HOST = 'rabbitmq-server'
process.env.CONSUL_PORT = 8500

var connectionName = 'myPostgres'

var serverExtraConfig = {
    serverConfig: {
        errhandler: ErrorHandler
    }
}
var consulOptions = {
    secure: false,
    ca: undefined
}

var userModel = require('../models/UserModel')

// service.registerAdapter(global.Const.DIALECT_POSTGRES)
service.getConfig(consulOptions, serverExtraConfig)
    .then(function (config) {
        service.configure(config)

        service.registerAdapter(global.Const.DIALECT_POSTGRES)
        // register usermodel
        service.registerModel(userModel)

        service
            .getConnection(connectionName)
            .then(function connectedDb(sequelize) {
                // var processedModel  = sequelize.registerModel(userModel)

                sequelize.models.usermodel
                    .find({
                        where: {
                            username: 'trungdt'
                        }
                    })
                    .then(function (data) {
                        console.log(JSON.stringify(data, null, 4))
                    })

                // let's do a lazy register passport model
                sequelize.registerModel(require('../models/PassportModel'))
                sequelize.models.passportmodel
                    .find({
                        where: {
                            userId: 1
                        }
                    })
                    .then(function (data) {
                        console.log(JSON.stringify(data, null, 4))
                    })

                var sql = "select * from authentications.passports order by random() limit 10"
                sequelize.query(sql, { type: sequelize.QueryTypes.SELECT })
                    .then(function (data) {
                        console.log(JSON.stringify(data, null, 4))
                    });
            })

        console.log('server has been started')
    })
