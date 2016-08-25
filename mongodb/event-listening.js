module.exports = (mongoose, config) => {
    // listening to connection events
    mongoose.connection.on('connected', (ref) => {
        console.log(`Connected to ${config.MONGO_URI} DB!`);
    });
    mongoose.connection.on('error', (error) => {
        console.log(`Failed to connect to DB: ${config.MONGO_URI} on startup ${error}`);
    });
    mongoose.connection.on('disconnected', () => {
        console.log(`Mongoose default connection to DB: ${config.MONGO_URI} disconnected`);
    });

    const gracefulExit = () => {
        mongoose.connection.close(() => {
            console.log(`Mongoose default connection with DB: ${config.MONGO_URI} is disconnected through app termination`);
            process.exit(0);
        });
    };

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);
};