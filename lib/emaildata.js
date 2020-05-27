const path = require('path');

module.exports = {
    build: async (templateName, recordId, params) => {
        const data = require(path.join(__dirname, 'emailparts', 'data', templateName));
        return await data.get(recordId, params);
    }
};