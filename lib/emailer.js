const logger = require('winston');
const config = require('./config');
const mailgun = require('mailgun-js')(config.MAILGUN);
const ObjectID = require('mongodb').ObjectID;
const Email = require('./model/email');
const emailData = require('./emaildata');
const emailRecipients = require('./emailrecipients');
const emailContent = require('./emailcontent');
const emailAttachments = require('./emailattachments');

const _sendToMailGun = email => {
    return new Promise((resolve, reject) => {
        mailgun.messages().send(email, function (error, body) {
            if (error) {
                return reject(error);
            }
            resolve(body);
        });
    });
};

const status = async (recordId, params) => {
    let query = {};
    if (recordId) {
        query.recordId = ObjectID(recordId);
    }
    if (params) {
        query = {
            ...query,
            params
        };
    }
    return await Email.find(
        query, {
            _id: false,
            templateName: true,
            recordId: true,
            params: true,
            sentTo: true,
            sentDate: true
        }, { sort: { sentDate: -1 } }
    );
};

const send = async (locale, templateName, recordId, params) => {
    const result = {
        templateName,
        recordId,
        params
    };

    let data;
    try {
        data = await emailData.build(locale, templateName, recordId, params);
    } catch (error) {
        logger.error(error);
        return [{
            ...result,
            error: {
                status: 404,
                message: error
            }
        }];
    }
    logger.debug(data);

    let recipientsList;
    try {
        recipientsList = await emailRecipients.build(locale, templateName, recordId, params, data);
    } catch (error) {
        logger.error(error);
        return [{
            ...result,
            error: {
                status: 422,
                message: error
            }
        }];
    }
    logger.debug(recipientsList);

    const attachments = await emailAttachments.build(locale, templateName, recordId, params, data);
    let content;
    try {
        content = await emailContent.build(locale, templateName, recordId, params, data);
    } catch (error) {
        logger.error(error);
        return [{
            ...result,
            error: {
                status: 422,
                message: error
            }
        }];
    }

    return await Promise.all(recipientsList.map(async recipients => {
        if (!recipients.to) {
            return {
                ...result,
                error: {
                    status: 422,
                    message: 'email not set'
                }
            };
        }

        const email = {
            ...recipients,
            ...content,
            ...attachments
        };
        logger.debug(email);

        let status;
        if (config.PRODUCTIVE) {
            status = await _sendToMailGun(email);
            logger.info(`${templateName} sent to ${recordId} at ${recipients.to}`);
        } else {
            status = {
                id: '<devid>',
                to: email.to,
                message: 'email not sent dev mode activated'
            };
            logger.warn(`DEV MODE ACTIVATED: ${templateName} not sent to ${recordId} at ${recipients.to}`);
        }
        logger.debug(status);

        new Email({
            templateName,
            recordId,
            params,
            sentTo: recipients.to,
            sentDate: new Date()
        }).save();

        return {
            ...result,
            email: recipients.to,
            status
        };
    }));
};

module.exports = {
    send,
    status
};
