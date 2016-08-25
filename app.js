/// <reference path="typings/index.d.ts" />

let express = require('express'),
    path = require('path');

let app = express(),
    bodyParser = require('body-parser'),
    colors = require('colors'),
    config = require('./configs/app.config'),
    debug = require('debug')(`common-server: ${process.pid}`),
    environment = process.env.NODE_ENV || 'dev',
    expressJWT = require('express-jwt'),
    http_port = process.env.HTTP_PORT || 3000,
    https_port = process.env.HTTPS_PORT || 3443,
    mongoose = require('mongoose'),
    NotFoundError = require(path.join(__dirname, 'utils', 'errors', 'not-found-error.js')),
    onFinished = require('on-finished'),
    utils = require(path.join(__dirname, 'services', 'utils.js'));


let checkToken = expressJWT({
    secret: config.TOKEN_SECRET
});
checkToken.unless = require('express-unless');

debug('Starting application');

debug('Connecting to mongodb');
// mongodb connection
mongoose.set('debug', true);
mongoose.connect(config.MONGO_URI, config.DB_CONNECTION_OPTIONS);
// listening to connection events
require('./mongodb/event-listening')(mongoose, config);

debug('Configuring middlewares');

/* middleware configuration
*********************************************************************** **/
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(require('compression')());
app.use(require('morgan')('dev'));
app.use(require('cors')());
app.use(require('response-time')());

app.use((req, res, next) => {
    onFinished(req, (error) => {
        debug('[%s] finished request', req.connection.remoteAddress);
    });
    next();
});

// authenticate all HTTP requests using json web token except request for login
app.use(checkToken.unless({
    path: ['/auth/login', '/auth/register']
}));

app.use(utils.middleware().unless({ path: ['/auth/login', '/auth/register'] }));

app.use('/auth', require(path.join(__dirname, 'routes', 'default'))());
app.all('*', (req, res, next) => {
    next(new NotFoundError('404'));
});

/* Error handling
*********************************************************************** **/
app.use((error, req, res, next) => {
    let errorType = typeof error,
        code = 500,
        message = 'Internal Server Error';

    switch (error.name) {
        case 'UnauthorizedError':
            code = error.status;
            message = undefined;
            break;
        case 'BadRequestError':
        case 'UnauthorizedAccessError':
        case 'NotFoundError':
            code = error.status;
            message = error.inner;
            break;
        default:
            break;
    }
    return res.status(code).json(message);
});

console.log('About to crank up node'.grey);
console.log(`PORT= ${http_port}`);
console.log(`NODE_ENV= ${environment}`);

/* Server creation
*********************************************************************** **/
debug('Creating HTTP Server on port: %s', http_port);
require('http').createServer(app).listen(http_port, () => {
    debug(`Express server listening on port ${http_port}`);
    debug(`env = ${app.get('env')}
                \n__dirname = ${__dirname}
                \nprocess.cwd = ${process.cwd()}`);
});