/// <reference path="../typings/index.d.ts" />

'use strict';

let debug = require('debug')('app:routes:default' + process.pid),
    path = require('path'),
    utils = require('../services/utils.js'),
    Router = require('express').Router,
    UnauthorizedAccessError = require(path.join(__dirname, '..', 'utils', 'errors', 'unauthorized-access-error.js')),
    strategies = require(path.join(__dirname, '..', 'services', 'strategies'));

module.exports = () => {

    let router = new Router();

    router.route('/verify').get((req, res, next) => {
        return res.status(200).json(undefined);
    });

    router.route('/logout').get((req, res, next) => {
        if (utils.expire(req.headers)) {
            delete req.user;
            return res.status(200).json({
                'message': 'User has been successfully logged out'
            });
        } else {
            return next(new UnauthorizedAccessError('401'));
        }
    });

    router.route('/login').post(strategies.login, (req, res, next) => {
        return res.status(200).json(req.user);
    });

    router.route('/register').post(strategies.register, (req, res, next) => {
        return res.status(200).json(req.user);
    });

    router.unless = require('express-unless');

    return router;
};

debug('/********** Loaded **********/');