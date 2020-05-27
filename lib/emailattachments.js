const path = require('path');

module.exports = {
    build: async (templateName, recordId, params, data) => {
        const attachments = require(path.join(__dirname, 'emailparts', 'attachments', templateName));
        return await attachments.get(recordId, params, data);
    }
};