/// <reference path="../typings/servicebase/servicebase.d.ts" />
var service = require("../index");
function ErrorHandler(err) {
    console.log('Seneca got error:' + err.message);
    // return false so that seneca will continue throw the error to promise chain
    return false;
}

service.configure({
    SERVICE_NAME: 'testService',
    serverConfig: {
        type: 'amqp',
        url: 'amqp://username:password@rabbitmq-server:5672',
        pin: 'module:a',
        timeout: 9999,
        // // handle all errors in both server and clients
        errhandler: ErrorHandler
    },
    clientConfig: {
        type: 'amqp',
        url: 'amqp://username:password@rabbitmq-server:5672',
        // log: 'print',
        timeout: 9999
    }
});

// server init
service.include('benchmark-service.js')
service.include('./modules-plugins/basic-plugins.js')
service.registerAuthzData({
    'testService': {
        '*': true
    }
})

service.listen().then(function () {
    console.log('Server has been started');
});

// // client init
// service.client('module:a')
//     .then(function (client) {
//         var i = 0;
//         setInterval(function () {
//             var t1 = Date.now();
//             i++;
//             client.act('cmd:test,foo:1,zed:' + i + ",t1:" + t1, {
//                 User: {
//                     id: 1,
//                     roles: ['cho meo', 'admin']
//                 }
//             })
//                 .then(function (ret) {
//                     var when = Date.now();
//                     var dt = when - ret.when;
//                     var dt2 = when - ret.t1;
//                     console.log("server a with i = " + ret.zed + "; dt1 = " + dt + "; dt2 = " + dt2 + " ;  t1 = " + ret.when + " ; t2= " + when);
//                 })
//                 .catch(function (err) {
//                     if (err) {
//                         console.log('server a got error:' + err.message);
//                     }
//                 });
//         }, 1000);
//     })
//     .catch(function (err) {
//         console.log(err);
//         console.log('die cmnr');
//     });

// service.client('module:b')
//     .then(function (client) {
//         var i = 0;
//         setInterval(function () {
//             var t1 = Date.now();
//             i++;
//             client
//                 .act('cmd:test,foo:1,zed:' + i + ",t1:" + t1, {
//                     User: {
//                         id: 1,
//                         roles: ['cho meo', 'admin']
//                     }
//                 })
//                 .then(function (ret) {
//                     var when = Date.now();
//                     var dt = when - ret.when;
//                     var dt2 = when - ret.t1;
//                     console.log("server b with i = " + ret.zed + "; dt1 = " + dt + "; dt2 = " + dt2 + " ;  t1 = " + ret.when + " ; t2= " + when);
//                 })
//                 .catch(function (err) {
//                     if (err) {
//                         console.log('server b got error:' + err.message);
//                     }
//                 });
//         }, 500);
//     })
//     .catch(function (err) {
//         console.log(err);
//         console.log('die cmnr');
//     });    