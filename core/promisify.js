/**
Seneca promisified.
This plugin provides promisified versions of the following seneca methods:

seneca.ready -> seneca.readyAsync
seneca.client -> seneca.clientAsync
seneca.act -> seneca.actAsync
seneca.add -> seneca.addAsync
seneca.close -> seneca.closeAsync (runs .readyAsync as well for convenience)

Usage
var assert  = require('assert'),
    Promise = require('bluebird'); 

var si = require('seneca')();
//var si = require('seneca')({log:'silent'});   //switch these out to suppress seneca output

si.use('seneca-bluebird');

//let's register some promisified handlers!
//si.addAsync does NOT return a promise; rather it allows for a promise-aware handler to be registered:
si.addAsync('test:zero', function(args) {
    return Promise.resolve(0);
});
// these handlers are completely compatible with both .act and .actAsync
si.addAsync('test:err', function(args) {
    return Promise.reject('Rejection error');
});
//runtime errors are also caught as rejections
si.addAsync('test:err2', function(args) {
    throw new Error("Runtime error!");
});

si.readyAsync().then(function(_seneca){
        si = _seneca;
        return si.actAsync({test:'zero'})   //this will resolve 0
    }).then(function(result){
        assert.equal(result, 0);
        return si.actAsync({test:'err'});   //this will reject
    }).then(function(tdata){
        //this really shouldn't run
        assert.fail(tdata, 'error', 'Should have errored');
    }).catch(function(err){
        //this will throw 
        assert.equal(err.message,'Rejection error');
        return si.actAsync({test:'err2'})   //this will throw, and return as rejection
    }).then(function(tdata){
        //this really shouldn't run
        assert.fail(tdata, 'error', 'Should have errored (2)');
    }).catch(function(err){
        assert.equal(err.message,'Runtime error!');
    }).then(function(){
        console.log('all good');
    }).catch(function(err){
        console.log('unexpected error: ',err);
    });
 */

'use strict';
module.exports = function () {

    let seneca = this
    let senecaProto = Object.getPrototypeOf(seneca)
    const Promise = require('bluebird')
    const _ = require('lodash')

    /** 
     * Core stuff
     *
     * addAsync: register handler which returns promise
     *
     * actAsync: promisified .act()
     *
     * readyAsync: promisified .ready(). Returns seneca
     *
     * clientAsync: promisified .ready()->.client(). Returns client (which is seneca)
     */

    senecaProto.addAsync = function () {
        var q = Promise.pending(),
            args = Array.prototype.slice.apply(arguments),
            fn = args.pop();

        var newfn = function (args, cb) {
            //console.log('calling on ',typeof fn,'with: ',args);
            try {
                fn.call(seneca, args).then(function (out) {
                    cb(null, out);
                }).catch(function (err) {
                    if (typeof err == "string") {
                        err = new Error(err);
                    }
                    cb(err);
                });
            } catch (err) { //never called?
                if (err && err.code && !err.message)
                    err.message = err.code;
                cb(err);
            }
        };
        args.push(newfn);
        //console.log('registering async',args.length, typeof args[0], typeof args[1]);
        this.add.apply(seneca, args);
    };

    senecaProto.closeAsync = function () {
        return new Promise(function (resolve, reject) {
            this.close(function (err) {
                err && reject(err) || resolve(1);
            });
        }.bind(this));
    };

    senecaProto.actAsync = function () {
        var args = Array.prototype.slice.apply(arguments);
        return new Promise(function handleActAsync(resolve, reject) {
            args.push(function (err, out) {
                /**
                 * the result of out is always in the form of 
                 * {
                 *      success: bool,
                 *      data: Object
                 * }
                 */
                // err ? reject(err) : resolve(out);
                if (err){
                    return reject(err)
                }

                if (_.isObject(out) && out.hasOwnProperty('success') && out.hasOwnProperty('data')){
                    if (out.success === true){
                        return resolve(out.data)
                    }
                    return reject(new Error(out.data))
                }
                
                // for other cases: resolve out for compatible
                resolve(out)
            });

            try {
                this.act.apply(this, args);
            } catch (e) {
                if (e && e.code && !e.message) {
                    e.message = e.code;
                }
                reject(e);
            }
        }.bind(this));
    };

    senecaProto.readyAsync = function () {
        return new Promise(function handleReadyAsync(resolve, reject) {
            this.ready(function (err) {
                err && reject(err) || resolve(this);
            });
        }.bind(this));
    };

    senecaProto.clientAsync = function () {
        var args = Array.prototype.slice.apply(arguments);
        return this.readyAsync().then(function (client) {
            client.client.apply(client, args);
            return new Promise(function handleReadyAsync(resolve, reject) {
                this.ready(function (err) {
                    err && reject(err) || resolve(client);
                });
            }.bind(client));
        });
    };
    return {
        name: 'bluebird'
    };
};
