'use strict';

const Hapi = require('@hapi/hapi');

const init = async () => {

    const server = Hapi.server({
        port: 3000,
        host: '0.0.0.0'
    });

    server.route({
        method: 'GET',
        path: '/',
        handler: (request, reply) => {
            return reply.response({
                'message': 'Welcome to Product Service'
            });
        }
    });

    server.route({
        method: 'GET',
        path: '/get',
        handler: (request, reply) => {
            return reply.response({
                'message': 'Get Product Service'
            });
        }
    });

    await server.start();
    console.log('Server running on %s', server.info.uri);
};

process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

init();