const ObjectID = require('mongodb').ObjectID;
const { base_db } = require('./index');

module.exports = {
    get: async (id, term) => {
        const tenant = await base_db.client.collection('occupants').findOne({_id: ObjectID(id)});
        if (!tenant) {
            throw new Error('tenant not found');
        }

        tenant.rents = tenant.rents.filter(rent => rent.term === Number(term));
        if (!tenant.rents.length) {
            throw new Error('term not found');
        }

        const realms = await base_db.client.collection('realms').find().toArray();
        tenant.realm = realms.filter(realm => realm._id.toString() === tenant.realmId)[0];

        return tenant;
    }
};