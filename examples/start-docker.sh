echo '127.0.0.1  rabbitmq-server' >> /etc/hosts
docker run  -d  \
 --hostname rabbitmq-server  \
 -p 5672:5672 -p 15672:15672  \
 --name rabbitmq-server \
 -e RABBITMQ_DEFAULT_USER=username -e RABBITMQ_DEFAULT_PASS=password \
 rabbitmq:management

docker run -d --name consul -p 8400:8400 -p 8500:8500 -p 8600:53/udp  -h node1 progrium/consul -server -bootstrap