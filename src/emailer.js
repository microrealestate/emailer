const logger = require('winston');
const config = require('./config');
const Email = require('./model/email');
const emailData = require('./emaildata');
const emailRecipients = require('./emailrecipients');
const emailContent = require('./emailcontent');
const emailAttachments = require('./emailattachments');
const emailEngine = require('./emailengine');

const status = async (recordId, startTerm, endTerm) => {
  const query = {};
  if (recordId) {
    query.recordId = recordId;
  }
  if (startTerm && endTerm) {
    query.$and = [
      { 'params.term': { $gte: startTerm } },
      { 'params.term': { $lte: endTerm } },
    ];
  } else if (startTerm) {
    query.params = {
      term: startTerm,
    };
  }

  return await Email.find(
    query,
    {
      _id: false,
      templateName: true,
      recordId: true,
      params: true,
      sentTo: true,
      sentDate: true,
    },
    { sort: { sentDate: -1 } }
  );
};

const send = async (
  authorizationHeader, // Bearer accessToken
  locale,
  organizationId,
  templateName,
  recordId,
  params
) => {
  const result = {
    templateName,
    recordId,
    params,
  };

  let data;
  try {
    logger.debug('fetch email data');
    data = await emailData.build(locale, templateName, recordId, params);
  } catch (error) {
    logger.error(error);
    return [
      {
        ...result,
        error: {
          status: 404,
          message: `no data found for ${templateName} recordId: ${recordId}`,
        },
      },
    ];
  }
  logger.debug(data);

  let recipientsList;
  try {
    logger.debug('get email recipients');
    recipientsList = await emailRecipients.build(
      locale,
      templateName,
      recordId,
      params,
      data
    );
  } catch (error) {
    logger.error(error);
    return [
      {
        ...result,
        error: {
          status: 422,
          message: `cannot get recipients for ${templateName}`,
        },
      },
    ];
  }
  logger.debug(recipientsList);

  let attachments;
  try {
    logger.debug('add email attachments');
    attachments = await emailAttachments.build(
      authorizationHeader,
      locale,
      organizationId,
      templateName,
      recordId,
      params,
      data
    );
  } catch (error) {
    logger.error(error);
    return [
      {
        ...result,
        error: {
          status: 404,
          message: `cannot add attachments for ${templateName}`,
        },
      },
    ];
  }

  let content;
  try {
    logger.debug('get email content');
    content = await emailContent.build(
      locale,
      templateName,
      recordId,
      params,
      data
    );
  } catch (error) {
    logger.error(error);
    return [
      {
        ...result,
        error: {
          status: 422,
          message: `cannot get email content for ${templateName}`,
        },
      },
    ];
  }

  return await Promise.all(
    recipientsList.map(async (recipients) => {
      if (!recipients.to) {
        return {
          ...result,
          error: {
            status: 422,
            message: 'email not set',
          },
        };
      }

      const email = {
        ...recipients,
        ...content,
        ...attachments,
      };
      logger.debug(email);

      let status;
      if (config.ALLOW_SENDING_EMAILS) {
        status = await emailEngine.sendEmail(email, data);
        new Email({
          templateName,
          recordId, // tenantId
          params,
          sentTo: recipients.to,
          sentDate: new Date(),
          emailId: status.id,
          status: 'queued',
        }).save();
        logger.info(`${templateName} sent to ${recordId} at ${recipients.to}`);
      } else {
        status = {
          id: '<devid>',
          to: email.to,
          message: 'email not sent, email sending disabled',
        };
        logger.warn(
          `ALLOW_SENDING_EMAILS DISABLED: ${templateName} not sent to ${recordId} at ${recipients.to}`
        );
      }
      logger.debug(status);

      return {
        ...result,
        email: recipients.to,
        status,
      };
    })
  );
};

module.exports = {
  send,
  status,
};
