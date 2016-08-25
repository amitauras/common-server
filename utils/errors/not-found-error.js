/// <reference path="../../typings/index.d.ts" />

'use strict';

// Require our core node modules.
let util = require( "util" );

function NotFoundError(code, error) {
    let errorMessage = typeof error  === 'undefined' ? undefined : error.message;
    Error.call(this, errorMessage);
    Error.captureStackTrace(this, this.constructor);

    /**
     * override and extend the Error class with following properties
     * 
     * name {string}
     * message {string}
     * code {string}
     * status {number}
     * inner {Object}
     */

    this.name = 'NotFoundError';
    this.message = errorMessage;
    this.code = typeof code === 'undefined' ? '404' : code;
    this.status = 404;
    this.inner = error;
}

util.inherits(NotFoundError, Error);

// export the constructor function
module.exports = NotFoundError;