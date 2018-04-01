const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
const logger = require('winston');
const config = require('./config');
const mailgun = require('mailgun-js')(config.MAILGUN);
const dp = require('./datapicker');
const df = require('./docfetcher');

async function status(tenantId, term) {
    const document = 'status';
    return await dp.get(document, {document, tenantId, term});
}

async function emailer(document, tenantId, term) {
    const data = await dp.get(document, {document, tenantId, term});

    const result = {document, tenantId, term};
    if (!data.tenant) {
        result.error = 'tenant not found';
        logger.error(result);
        return [result];
    }
    result.name = data.tenant.name;
    if (data.tenant.rents.length === 0) {
        result.error = 'term not found';
        logger.error(result);
        return [result];
    }
    if (!data.tenant.contacts || data.tenant.contacts.length === 0) {
        result.error = 'tenant has not any contact emails';
        logger.error(result);
        return [result];
    }
    const email_addresses = data.tenant.contacts
        .filter(contact => contact.email)
        .map(contact => contact.email);
    if (email_addresses.length === 0) {
        result.error = 'tenant has not any contact emails';
        logger.warn(result);
        return [result];
    }
    const results = [];
    const email_data = {document, tenantId, term};
    Object.assign(email_data, data);
    for (let email_address of email_addresses) {
        const currentResult = {document, tenantId, term};
        currentResult.name = data.tenant.name;
        if (!email_address) {
            currentResult.error = `tenant ${data.tenant.name} has an empty email`;
            logger.warn(currentResult.error);
        } else {
            currentResult.to = email_address;
            const email = {};
            Object.assign(email, emailRecipients(email_address));
            Object.assign(email, await emailAttachment(document, email_data));
            Object.assign(email, await emailContent(document, email_data));
            currentResult.status = await send(email);
            dp.insert({
                tenantId,
                term,
                document,
                to: email_address,
                sentDate: new Date()
            });
            logger.debug(currentResult);
            if (config.PRODUCTIVE) {
                logger.info(`${document} sent to ${data.tenant.name} at ${email_addresses}`);
            } else {
                logger.warn(`DEV MODE ACTIVATED: ${document} not sent to ${data.tenant.name} at ${email_addresses}`);
            }
        }
        results.push(currentResult);
    }
    return results;
}

function emailRecipients(to) {
    const recipients = {
        from: config.EMAIL.FROM,
        'h:Reply-To': config.EMAIL.REPLY_TO,
        to,
    };
    if (config.PRODUCTIVE) {
        Object.assign(recipients, {bcc: config.EMAIL.BCC});
    }
    return recipients;
}

async function emailAttachment(templateId, data) {
    const filePath = await df.get(templateId, data);
    return {
        attachment: fs.createReadStream(filePath)
    };
}

async function emailContent(templateId, data) {
    const subjectTemplateFile = path.join(config.TEMPLATES_DIRECTORY, templateId, 'subject.ejs');
    const subject = await renderFile(subjectTemplateFile, data);
    const htmlTemplateFile = path.join(config.TEMPLATES_DIRECTORY, templateId, 'body_html.ejs');
    const html = await renderFile(htmlTemplateFile, data);
    const textTemplateFile = path.join(config.TEMPLATES_DIRECTORY, templateId, 'body_text.ejs');
    const text = await renderFile(textTemplateFile, data);
    return {subject, text, html};
}

function renderFile(templateFile, data) {
    return new Promise((resolve, reject) => {
        ejs.renderFile(templateFile, data, {root: config.TEMPLATES_DIRECTORY}, (err, html) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(html);
        });
    });
}

function send(email) {
    return new Promise((resolve, reject) => {
        if (config.PRODUCTIVE) {
            mailgun.messages().send(email, function (error, body) {
                if (error) {
                    reject(error);
                    return;
                }
                resolve(body);
            });
        } else {
            resolve({
                id: '<devid>',
                to: email.to,
                message: 'email not sent dev mode activated'
            });
        }
    });
}

module.exports = {
    send: emailer,
    status
};
