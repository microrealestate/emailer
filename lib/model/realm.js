const mongoose = require('mongoose');

const RealmSchema = mongoose.Schema({
    creation: Date,

    // individual details
    name: String,

    // company details
    isCompany: Boolean,
    company: String,
    legalForm: String,
    manager: String,
    capital: Number,
    rcs: String,
    siret: String,
    vatNumber: String,

    // address
    street1: String,
    street2: String,
    zipCode: String,
    city: String,

    //contact
    contact: String,
    phone1: String,
    phone2: String,
    email: String,

    // bank account
    bank: String,
    rib: String,

    // Users
    administrator: String,
    user1: String,
    user2: String,
    user3: String,
    user4: String,
    user5: String,
    user6: String,
    user7: String,
    user8: String,
    user9: String,
    user10: String
});

module.exports = mongoose.model('Realm', RealmSchema);
