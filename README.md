# servicebase

> A wrapper to help build up microservices application in nodejs easily

## Features
- Listener / Client mode, with AMQP Transport or HTTP Transport
- Promisify all functions
- Use Consul as Configuration Storage & Service Health Checker
- Support multiple database adapters. Postgresql & Sqlite are build-in supported adapters
- Use Loggly as logs monitoring service
- Support Authorization when consuming the service’s action
- Error handler: no more terminating your service because of TIMEOUT or fatal$ error
- Including test helper
- Including typed-definitions file

## How to run examples
- Install Docker
- Run file examples/start-docker.sh
- npm install 
- Run the examples
- Notice that with Consul, you need to run file in tests/consul-kv-updater.js to save configuration into consul first

## Author
Trung Dang - trungdt@absoft.vn
