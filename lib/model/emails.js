const mongoose = require('mongoose');

const ObjectId = mongoose.Schema.Types.ObjectId;

const EmailSchema = mongoose.Schema({
    templateName: String,
    recordId: ObjectId,
    params: {},
    sentTo: String,
    sentDate: Date
});

module.exports = mongoose.model('emails', EmailSchema);