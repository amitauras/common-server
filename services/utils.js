/// <reference path="../typings/index.d.ts" />

'use strict';

let debug = require('debug')(`app:utils: ${process.pid}`),
    path = require('path'),
    util = require('util'),
    redis = require('redis'),
    client = redis.createClient(),
    _ = require('lodash'),
    config = require('../configs/app.config'),
    jsonwebtoken = require('jsonwebtoken'),
    TOKEN_EXPIRATION = 60,
    TOKEN_EXPIRATION_SEC = TOKEN_EXPIRATION * 60,
    UnauthorizedAccessError = require(path.join(__dirname, '..', 'utils', 'errors', 'unauthorized-access-error.js'));

// redis error event listening
client.on('error', (error) => {
    debug(error);
});

// redis event listening on connection
client.on('connect', () => {
    debug('/********** Redis connected successfully **********/');
});


// Methods

let fetch = (headers) => {
    if (headers && headers.authorization) {

        let authorization = headers.authorization;
        let parts = authorization.split(' ');

        if (parts.length === 2) {
            let token = parts[1];
            return token;
        } else {
            return null;
        }
    } else {
        return null;
    }
};

let create = (user, req, res, next) => {
    debug('/********** Create token **********/');

    if (_.isEmpty(user)) {
        return next(new Error('User data cannot be empty'));
    }

    let data = {
        _id: user._id,
        username: user.username,
        roles: user.roles,
        name: user.name,
        email: user.email,
        token: jsonwebtoken.sign({ _id: user._id }, config.TOKEN_SECRET, {
            expiresIn: `${TOKEN_EXPIRATION}m`
        })
    };

    let decoded = jsonwebtoken.decode(data.token);
    data.token_exp = decoded.exp;
    data.token_iat = decoded.iat;

    debug(`Token generated for user: ${data.username},
        \n token: ${data.token}`);

    client.set(data.token, JSON.stringify(data), (error, reply) => {
        if (error) {
            return next(new Error(error));
        }
        if (reply) {
            client.expire(data.token, TOKEN_EXPIRATION_SEC, (error, reply) => {
                if (error) {
                    next(new Error('Cannot set the expire value for the token key'));
                }
                if (reply) {
                    req.user = data;
                    next();
                } else {
                    return next(new Error('Expiration not set on redis'));
                }
            });
        } else {
            return next(new Error('Token not set on redis'));
        }
    });

    return data;
};

let retrieve = (id, done) => {
    debug(`/********** Calling retrieve for token: ${id} **********/`);

    if (_.isNull(id)) {
        return done(new Error('token_invalid'), {
            'message': 'Invalid token'
        });
    }

    client.get(id, (error, reply) => {
        if (error) {
            return done(error, {
                'message': error
            });
        }
        if (_.isNull(reply)) {
            return done(new Error('token_invalid'), {
                'message': 'Token doesn\'t exists, are you sure it hasn\'t expired or been revoked?'
            });
        } else {
            let data = JSON.parse(reply);
            debug(`User data fetched from redis store for user: ${data.username}`);

            if (Object.is(data.token, id)) {
                return done(null, data);
            } else {
                return done(new Error('token_doesn\'t exist'), {
                    'message': 'Token doesn\'t exists, login into the system so it can generate new token.'
                });
            }
        }
    });
};

let verify = (req, res, next) => {

    debug('/********** Verifying token **********/');

    let token = exports.fetch(req.headers);

    jsonwebtoken.verify(token, config.TOKEN_SECRET, (error, decode) => {

        if (error) {
            req.user = undefined;
            return next(new UnauthorizedAccessError('invalid_token'));
        }

        exports.retrieve(token, (error, data) => {

            if (error) {
                req.user = undefined;
                return next(new UnauthorizedAccessError('invalid_token', data));
            }

            req.user = data;
            next();

        });

    });
};

let expire = (headers) => {

    let token = exports.fetch(headers);

    debug(`/********** Expiring token: ${token} **********`);

    if (token !== null) {
        client.expire(token, 0);
    }

    return token !== null;

};

let middleware = () => {

    let func = function (req, res, next) {

        let token = exports.fetch(req.headers);

        exports.retrieve(token, (error, data) => {

            if (error) {
                req.user = undefined;
                return next(new UnauthorizedAccessError('invalid_token', data));
            } else {
                req.user = _.merge(req.user, data);
                next();
            }

        });
    };

    func.unless = require('express-unless');

    return func;

};

Object.assign(module.exports, {
    // data
    TOKEN_EXPIRATION,
    TOKEN_EXPIRATION_SEC,

    // methods
    fetch,
    create,
    retrieve,
    verify,
    expire,
    middleware
});

debug('/********** Loaded **********/');