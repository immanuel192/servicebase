var service = require("../../index")

service.configure({
    transport: {
    },
    clientConfig: {
        type: 'amqp',
        url: 'amqp://username:password@rabbitmq-server:5672',
        timeout: 9999
    }
})

// client init
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
//         }, 200);
//     })
//     .catch(function (err) {
//         console.log(err);
//         console.log('die cmnr');
//     });

service
    .client('module:service-user')
    .then(function (client) {
        return client.act('cmd:createUser', {
            email: 'a@a.com',
            password: 'fdfasd',
            User: {
                id: 1,
                roles: ['admin']
            }
        })
        .then(function(ret){
            console.log(ret)
        })

    })
    .catch(function (err) {
        console.log(err);
        console.log('die cmnr');
    });    