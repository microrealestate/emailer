const express = require('express');
const logger = require('winston');
const emailer = require('./emailer');

const apiRouter = express.Router();

// parse locale
apiRouter.use((req, res, next) => {
    const supportedLocales = ['en-US', 'fr-FR'].map(locale => locale.toLowerCase());
    const defaultLocale = 'en-US';

    let locale = req.get('Application-Locale') || 'en-US';
    if (!supportedLocales.includes(locale.toLowerCase())) {
        locale = defaultLocale;
    } else {
        const [lang, country] = locale.split('-');
        locale = `${lang.toLowerCase()}-${country.toUpperCase()}`;
    }
    req.locale = locale;
    next();
});

//     recordId,      // DB record Id
//     params         // extra parameters (ex. { term: 2018030100 })
apiRouter.get('/emailer/status/:recordId?/:term', async (req, res) => {
    try {
        const { recordId, ...params } = req.params;
        const result = await emailer.status(recordId, params);
        res.json(result);
    } catch(exc) {
        logger.error(exc);
        res.status(500).send({
            status: 500,
            message: exc.message
        });
    }
});

// body = {
//     templateName,  // email template name (invoice, rentcall, rentcall-reminder...)
//     recordId,      // DB record Id
//     params         // extra parameters (ex. { term: 2018030100 })
// }
apiRouter.post('/emailer', async (req, res) => {
    try {
        const { templateName, recordId, params } = req.body;

        if (![
            'invoice',
            'rentcall',
            'rentcall_last_reminder',
            'rentcall_reminder',
            'reset_password'
        ].includes(templateName)) {
            return res.sendStatus(404);
        }

        const results = await emailer.send(
            req.locale,
            templateName,
            recordId,
            params
        );

        if (!results || !results.length) {
            return res.sendStatus(404);
        }

        if (results.length === 1 && results[0].error) {
            return res.status(results[0].error.status).json(results[0].error);
        }

        res.json(results);
    } catch(exc) {
        logger.error(exc);
        res.status(500).json({
            status: 500,
            message: exc.message
        });
    }
});

module.exports = apiRouter;
