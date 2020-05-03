const path = require('path');
const fs = require('fs');
const axios = require('axios');
const logger = require('winston');
const config = require('./config');

module.exports = {
    get(templateId, data) {
        return new Promise((resolve, reject) => {
            try {
                const uri = `${config.PDFGENERATOR_URL}/${data.document}/${data.tenantId}/${data.term}`;
                const fileDir = path.join(config.TEMPORARY_DIRECTORY, templateId);
                if (!fs.existsSync(fileDir)){
                    fs.mkdirSync(fileDir);
                }
                const filePath = path.join(fileDir, `${data.filename}.pdf`);
                const wStream = fs.createWriteStream(filePath);
                wStream.on('error', err => reject(err));
                wStream.on('finish', () => resolve(filePath));
                logger.debug(`GET document ${uri}`);
                axios.get(uri, { responseType: 'stream' })
                    .then(response => {
                        response.data.pipe(wStream);
                    });
            } catch (exc) {
                reject(exc);
            }
        });
    }
};