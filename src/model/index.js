const mongoose = require('mongoose');
const logger = require('winston');
const config = require('../config');
const Email = require('./email');

let connection;

process.on('SIGINT', async () => {
    exit();
});

async function start() {
    if (!connection) {
        logger.debug(`db connecting to ${config.MONGO_URL}...`);
        connection = await mongoose.connect(config.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
        logger.debug('db ready');
    }
}

async function exit() {
    if (connection) {
        logger.debug('db disconnecting...');
        await mongoose.disconnect();
        connection = null;
        logger.debug('db disconnected');
    }
}

const migrate = async () => {
    const emails = await Email.find();
    for (let document of emails) {
        let email = document.toObject();
        if (email.tenantId) {
            email = {
                templateName: email.document,
                recordId: email.tenantId,
                params: { term: email.term },
                sentTo: email.to,
                sentDate: email.sentDate
            };
            await Email(email).save();
            await Email.deleteOne({ _id: document._id });
        }
    }
};

module.exports = {
    migrate,
    start,
    exit
};