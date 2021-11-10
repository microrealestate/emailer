const path = require('path');
const fs = require('fs');
const axios = require('axios');
const logger = require('winston');
const config = require('../../config');

module.exports = (
  authorizationHeader,
  organizationId,
  templateName,
  recordId,
  params,
  filename
) => {
  return new Promise((resolve, reject) => {
    try {
      const uri = `${config.PDFGENERATOR_URL}/documents/${templateName}/${recordId}/${params.term}`;
      const fileDir = path.join(config.TEMPORARY_DIRECTORY, templateName);
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir);
      }
      const filePath = path.join(fileDir, `${filename}.pdf`);
      const wStream = fs.createWriteStream(filePath);
      wStream.on('error', (err) => reject(err));
      wStream.on('finish', () => resolve(filePath));
      logger.debug(`GET document ${uri}`);
      axios
        .get(uri, {
          responseType: 'stream',
          headers: { authorization: authorizationHeader, organizationId },
        })
        .then((response) => {
          response.data.pipe(wStream);
        })
        .catch(reject);
    } catch (exc) {
      reject(exc);
    }
  });
};
