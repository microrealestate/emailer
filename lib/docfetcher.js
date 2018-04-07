const path = require('path');
const fs = require('fs');
const http = require('http');
const logger = require('winston');
const config = require('./config');

async function request(uri) {
    return await new Promise((resolve, reject) => {
        const req = http.request(uri);
        req.on('error', err => {
            reject(err);
        });
        req.on('response', res => {
            if (res.statusCode>299) {
                logger.error(`GET document ${uri} ${res.statusCode}`);
                const error = {
                    uri,
                    error: `${res.statusCode} ${res.statusMessage}`
                };
                reject(error);
            } else {
                logger.debug(`GET document ${uri} ${res.statusCode}`);
                resolve(res);
            }
        });
        req.end();
    });
}

module.exports = {
    get(templateId, data) {
        return new Promise(async (resolve, reject) => {
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
                const res = await request(uri);
                res.pipe(wStream);
            } catch (exc) {
                reject(exc);
            }
        });
    }
};