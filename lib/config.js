const path = require('path');
const root_dir = path.join(__dirname, '..');

module.exports = {
    LOGGER_LEVEL: process.env.LOGGER_LEVEL || 'debug',
    PRODUCTIVE: process.env.PRODUCTIVE || false,
    PORT: process.env.PORT || 8083,
    DB_URL: process.env.MONGO_URL || process.env.DB_URL || 'mongodb://localhost/emaildb',
    BASE_DB_URL: process.env.MONGO_URL || process.env.BASE_DB_URL || 'mongodb://localhost/sampledb',
    MAILGUN: {
        apiKey: process.env.MAILGUN_API_KEY || 'your_api_key',
        domain: process.env.MAILGUN_DOMAIN || 'mg.example.com'
    },
    PDFGENERATOR_URL: process.env.PDFGENERATOR_URL ||'http://localhost:8082/pdfgenerator',
    DATA_DIRECTORY: process.env.PDF_DIRECTORY || path.join(root_dir, '/data'),
    TEMPLATES_DIRECTORY: process.env.TEMPLATES_DIRECTORY || path.join(root_dir, '/templates'),
    TEMPORARY_DIRECTORY: process.env.TEMPORARY_DIRECTORY || path.join(root_dir, '/tmp'),
    EMAIL: {
        FROM: process.env.EMAIL_FROM || 'Example <noreply@example.com>',
        REPLY_TO: process.env.EMAIL_REPLY_TO || 'customer-service@example.com',
        BCC: process.env.EMAIL_BCC || 'manager1@example.com,manager2@example.com'
    }
};