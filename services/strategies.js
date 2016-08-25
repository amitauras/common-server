/// <reference path="../typings/index.d.ts" />

'use strict';

let debug = require('debug')('app:authentication:strategies' + process.pid),
    _ = require('lodash'),
    path = require('path'),
    utils = require('../services/utils.js'),
    UnauthorizedAccessError = require(path.join(__dirname, '..', 'utils', 'errors', 'unauthorized-access-error.js')),
    User = require(path.join(__dirname, '..', 'models', 'user.js'));

/** 
 * user login strategy
 **/
let login = (req, res, next) => {

    debug('/********** Processing authenticate middleware **********/');

    let email = req.body.email,
        password = req.body.password;

    if (_.isEmpty(email) || _.isEmpty(password)) {
        return next(new UnauthorizedAccessError('401', {
            message: 'Invalid email or password'
        }));
    }

    process.nextTick(() => {

        User.findOne({
            email: email
        }, (error, user) => {

            if (error || !user) {
                return next(new UnauthorizedAccessError('401', {
                    message: 'Invalid email or password'
                }));
            }

            user.comparePasswords(password, (error, isMatch) => {
                if (isMatch && !error) {
                    debug('User authenticated, generating token');
                    utils.create(user, req, res, next);
                } else {
                    return next(new UnauthorizedAccessError('401', {
                        message: 'Invalid email or password'
                    }));
                }
            });
        });

    });
};

/** 
 * user registration strategy
 **/
let register = (req, res, next) => {
    debug('/********** Processing user registration **********/');

    let email = req.body.email,
        password = req.body.password;

    if (_.isEmpty(email) || _.isEmpty(password)) {
        return next(new UnauthorizedAccessError('401', {
            message: 'Invalid email or password'
        }));
    }

    process.nextTick(() => {

        User.findOne({
            email: email
        }, (error, user) => {

            if (error || user) {
                return next(new UnauthorizedAccessError('401', {
                    message: 'User already Exists'
                }));
            }

            let newUser = new User({
                email: email,
                password: password
            });

            newUser.save(function (error) {
                if (!error) {
                    debug('User saved successfully, generating token');
                    utils.create(newUser, req, res, next);
                } else {
                    return next(new UnauthorizedAccessError('401', {
                        message: error
                    }));
                }
            });
        });

    });
};


Object.assign(module.exports, {
    // methods
    login,
    register
});