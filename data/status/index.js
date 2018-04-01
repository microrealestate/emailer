const db = require('../');

module.exports = {
    async get(params) {
        await db.start();
        return await db.getEmailStatus(params.tenantId, params.term);
    }
};