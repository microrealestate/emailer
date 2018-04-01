const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const { URL } = require('url');
const logger = require('winston');
const config = require('../lib/config');
const Emails = require('./model/emails');

let client, connection, db_preheating;

process.on('SIGINT', async () => {
    exit();
});

async function start() {
    await start_preheating_db();
    await start_db();
}

async function exit() {
    await exit_preheating_db();
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

async function start_preheating_db() {
    if (!client) {
        logger.debug(`db connecting ${config.PREHEATING_DB_URL}...`);
        const db_preheating_url = new URL(config.PREHEATING_DB_URL);
        const db_preheating_name = db_preheating_url.pathname.slice(1);
        let origin = db_preheating_url.origin;
        if (origin == 'null') {
            origin = `${db_preheating_url.protocol}//${db_preheating_url.hostname}${db_preheating_url.port?`:${db_preheating_url.port}`:''}`;
        }

        client = await MongoClient.connect(origin);
        db_preheating = await client.db(db_preheating_name);
        logger.debug('db ready');
    }
}

async function getTenant(id, term) {
    const tenant = await db_preheating.collection('occupants').findOne({_id: ObjectID(id)});
    if (tenant) {
        tenant.rents = tenant.rents.filter(rent => rent.term === Number(term));
        const realms = await db_preheating.collection('realms').find().toArray();
        tenant.realm = realms.filter(realm => realm._id.toString() === tenant.realmId)[0];
    }
    return tenant;
}

async function getEmailStatus(id, term) {
    const query = {};
    if (id) {
        query.tenantId = ObjectID(id);
    }
    if (term) {
        query.term = term;
    }
    return await Emails.find(
        query, {
            _id: false,
            tenantId: true,
            term: true,
            document: true,
            to: true,
            sentDate: true
        });
}

function insertEmailStatus(status) {
    new Emails(status).save();
}

async function exit_preheating_db() {
    logger.debug('db exiting...');
    if (client) {
        await client.close();
    }
    logger.debug('db exited');
}

module.exports = {
    start,
    exit,
    getTenant,
    getEmailStatus,
    insertEmailStatus
};