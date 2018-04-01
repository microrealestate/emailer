const path = require('path');
const config = require('./config');

module.exports = {
    async get(document, params) {
        const data = require(path.join(config.DATA_DIRECTORY, document));
        return await data.get(params);
    },
    // status = {
    // tenantId,
    // term,
    // document,
    // to: email_address,
    // sentDate: new Date()
    // }
    insert(status) {
        const data = require(path.join(config.DATA_DIRECTORY));
        data.insertEmailStatus(status);
    }
};