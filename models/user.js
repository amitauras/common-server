/// <reference path="../typings/index.d.ts" />

const bcrypt = require('bcrypt-nodejs');
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: true,
        index: true
    },
    password: {
        type: String,
        required: true
    },
    username: String,
    roles: {
        type: [String]
    },
    active: Boolean
}, {
        toObject: {
            virtuals: true
        }, toJSON: {
            virtuals: true
        }
    });

UserSchema.methods.comparePasswords = function (password, callback) {
    bcrypt.compare(password, this.password, callback);
};

UserSchema.pre('save', function (next) {
    let user = this;

    // if password for current user is modified, or
    // it's a new user then generate has for the password
    // and store it in place of password in the database

    if (!user.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, (error, salt) => {
            if (error) {
                return next(error);
            }

            bcrypt.hash(user.password, salt, null, (error, hash) => {
                if (error) {
                    return next(error);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }


});

let User = mongoose.model('User', UserSchema);
module.exports = User;