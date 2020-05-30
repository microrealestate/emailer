const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;
const logger = require('winston');
const config = require('../config');
const Email = require('./email');

let client, connection;
const base_db = {
    client: undefined
};

process.on('SIGINT', async () => {
    exit();
});

async function start() {
    await start_base_db();
    await start_db();
}

async function exit() {
    await exit_base_db();
    await exit_db();
}

async function start_db() {
    if (!connection) {
        logger.debug(`db connecting to ${config.DB_URL}...`);
        connection = await mongoose.connect(config.DB_URL);
        logger.debug('db ready');
    }
}

async function exit_db() {
    if (connection) {
        logger.debug('db disconnecting...');
        await mongoose.disconnect();
        connection = null;
        logger.debug('db disconnected');
    }
}

async function start_base_db() {
    if (!client) {
        logger.debug(`db connecting ${config.BASE_DB_URL}...`);
        client = await MongoClient.connect(config.BASE_DB_URL);
        base_db.client = client.db();
        logger.debug('db ready');
    }
}

async function exit_base_db() {
    logger.debug('db exiting...');
    if (client) {
        await client.close();
    }
    logger.debug('db exited');
}

const migrate = async () => {
    const emails = await Email.find();
    for (let document of emails) {
        let email = document.toObject();
        if (email.tenantId) {
            await Email.deleteOne({ _id: document._id });
            email = {
                templateName: email.document,
                recordId: email.tenantId,
                params: { term: email.term},
                sentTo: email.to,
                sentDate: email.sentDate
            };
            await Email(email).save();
        }
    }
};

module.exports = {
    base_db,
    migrate,
    start,
    exit
};