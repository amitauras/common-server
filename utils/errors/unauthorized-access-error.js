/// <reference path="../../typings/index.d.ts" />

'use strict';

// Require our core node modules.
let util = require( "util" );

function UnauthorizedAccessError(code, error) {
    Error.call(this, error.message);
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

    this.name = 'UnauthorizedAccessError';
    this.message = error.message;
    this.code = code;
    this.status = 401;
    this.inner = error;
}

util.inherits(UnauthorizedAccessError, Error);

// export the constructor function
module.exports = UnauthorizedAccessError;