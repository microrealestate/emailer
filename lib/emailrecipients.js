const path = require('path');

module.exports = {
    build: async (templateName, recordId, params, data) => {
        const recipients = require(path.join(__dirname, 'emailparts', 'recipients', templateName));
        return await recipients.get(recordId, params, data);
    }
};