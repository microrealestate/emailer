const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const EmailSchema = mongoose.Schema({
    tenantId: ObjectId,
    term: Number,
    document: String,
    to: String,
    sentDate: Date
});

module.exports = mongoose.model('emails', EmailSchema);