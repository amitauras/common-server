module.exports = {
    MONGO_URI: 'mongodb://localhost:27017/session',
    DB_CONNECTION_OPTIONS: {
        auto_reconnect: true,
        navtive_parser: true,
    },
    TOKEN_SECRET: 'very secret token'
};