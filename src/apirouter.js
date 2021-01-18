const express = require('express');
const locale = require('locale');
const logger = require('winston');
const emailer = require('./emailer');

const apiRouter = express.Router();

// parse locale
apiRouter.use(locale(['fr-FR', 'en-US', 'pt-BR'], 'en-US'));

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

        let results = [];
        try {
            results = await emailer.send(
                req.rawLocale.code,
                templateName,
                recordId,
                params
            );
        } catch(error) {
            return res.sendStatus(500);
        }

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
