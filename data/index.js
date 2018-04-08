const mongoose = require('mongoose');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const { URL } = require('url');
const logger = require('winston');
const config = require('../lib/config');
const Emails = require('./model/emails');

let client, connection, base_db;

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
        const base_db_url = new URL(config.BASE_DB_URL);
        const base_db_name = base_db_url.pathname.slice(1);
        let origin = base_db_url.origin;
        if (origin == 'null') {
            origin = `${base_db_url.protocol}//${base_db_url.hostname}${base_db_url.port?`:${base_db_url.port}`:''}`;
        }

        client = await MongoClient.connect(origin);
        base_db = await client.db(base_db_name);
        logger.debug('db ready');
    }
}

async function getTenant(id, term) {
    const tenant = await base_db.collection('occupants').findOne({_id: ObjectID(id)});
    if (tenant) {
        tenant.rents = tenant.rents.filter(rent => rent.term === Number(term));
        const realms = await base_db.collection('realms').find().toArray();
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
        }, {sort: {sentDate: -1}});
}

function insertEmailStatus(status) {
    new Emails(status).save();
}

async function exit_base_db() {
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