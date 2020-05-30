const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const config = require('./config');

const _templatesDir = path.join(__dirname, 'emailparts', 'contents');

const _renderFile = (templateFile, data) => {
    return new Promise((resolve, reject) => {
        ejs.renderFile(templateFile, data, { root: _templatesDir  }, (err, html) => {
            if (err) {
                return reject(err);
            }
            resolve(html);
        });
    });
};

module.exports = {
    build: async (locale, templateName, recordId, params, emailData) => {
        const contentPackagePath = path.join(_templatesDir, templateName, locale);
        if (!fs.existsSync(contentPackagePath)) {
            throw new Error(`cannot generate email content for ${templateName}. Template not found`);
        }

        const data  = {
            ...emailData,
            config
        };
        const subject = await _renderFile(path.join(contentPackagePath, 'subject.ejs'), data);
        const html = await _renderFile(path.join(contentPackagePath, 'body_html.ejs'), data);
        const text = await _renderFile(path.join(contentPackagePath, 'body_text.ejs'), data);
        return { subject, text, html };
    }
};