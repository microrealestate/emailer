const path = require('path');
const ejs = require('ejs');

const _templatesDir = path.join(__dirname, 'emailparts', 'templates');

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
    build: async (templateName, data) => {
        const subjectTemplateFile = path.join(_templatesDir, templateName, 'subject.ejs');
        const subject = await _renderFile(subjectTemplateFile, data);
        const htmlTemplateFile = path.join(_templatesDir, templateName, 'body_html.ejs');
        const html = await _renderFile(htmlTemplateFile, data);
        const textTemplateFile = path.join(_templatesDir, templateName, 'body_text.ejs');
        const text = await _renderFile(textTemplateFile, data);
        return { subject, text, html };
    }
};