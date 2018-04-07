const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const expressWinston = require('express-winston');
const logger = require('winston');
const config = require('./lib/config');
const emailer = require('./lib/emailer');

process.on('SIGINT', async () => {
    process.exit(0);
});

(async () => {
    // configure default logger
    logger.remove(logger.transports.Console);
    logger.add(logger.transports.Console, {
        level: config.LOGGER_LEVEL,
        colorize: true
    });

    if (!fs.existsSync(config.TEMPLATES_DIRECTORY)) {
        logger.error(`no email templates found in ${config.TEMPLATES_DIRECTORY}`);
        process.exit(1);
    }

    if (!fs.existsSync(config.TEMPORARY_DIRECTORY)) {
        fs.mkdirSync(config.TEMPORARY_DIRECTORY);
    }

    logger.debug('starting rest API...');
    const app = express();

    // Express log through out winston
    app.use(expressWinston.logger({
        transports: [
            new logger.transports.Console({
                json: false,
                colorize: true
            })
        ],
        meta: false, // optional: control whether you want to log the meta data about the request (default to true)
        msg: String, //'HTTP {{req.method}} {{req.url}}', // optional: customize the default logging message. E.g. "{{res.statusCode}} {{req.method}} {{res.responseTime}}ms {{req.url}}"
        expressFormat: true, // Use the default Express/morgan request formatting, with the same colors. Enabling this will override any msg and colorStatus if true. Will only output colors on transports with colorize set to true
        colorStatus: true // Color the status code, using the Express/morgan color palette (default green, 3XX cyan, 4XX yellow, 5XX red). Will not be recognized if expressFormat is true
        //ignoreRoute: function( /*req, res*/ ) {
        //    return false;
        //} // optional: allows to skip some log messages based on request and/or response
    }));

    app.use(expressWinston.errorLogger({
        transports: [
            new logger.transports.Console({
                json: false,
                colorize: true
            })
        ]
    }));

    // parse application/x-www-form-urlencoded
    app.use(bodyParser.urlencoded({ extended: false }));

    // parse application/json
    app.use(bodyParser.json());

    //     id,        // tenant Id
    //     term       // YYYYMMDDHH (ex. 2018030100)
    app.get('/emailer/status/:id?/:term', async (req, res) => {
        try {
            const result = await emailer.status(
                req.params.id,
                req.params.term
            );
            res.json(result);
        } catch(exc) {
            res.status(500).send(exc);
            logger.error(exc);
        }
    });

    // body = {
    //     document,  // invoice, rentcall
    //     id,        // tenant Id
    //     term       // YYYYMMDDHH (ex. 2018030100)
    // }
    app.post('/emailer', async (req, res) => {
        try {
            res.json(await emailer.send(
                req.body.document,
                req.body.id,
                req.body.term
            ));
        } catch(exc) {
            const result = Object.assign({}, req.body);
            result.error = exc.message;
            res.status(500).send([result]);
            logger.error(result);
            logger.error(exc);
        }
    });

    try {
        // Run server
        const http_port = config.PORT;
        await app.listen(http_port)
            .on('error', (error) => {
                throw new Error(error);
            });
        logger.debug(`Rest API listening on port ${http_port}`);
        logger.debug('Rest API ready');
        logger.info(`NODE_ENV ${process.env.NODE_ENV}`);
        logger.info(`Mode productive ${config.PRODUCTIVE}`);
        logger.info(`Databases ${config.BASE_DB_URL} / ${config.DB_URL}`);
        logger.info(`MailGun domain ${config.MAILGUN.domain}`);
        logger.info('Emailer ready');
    } catch (exc) {
        logger.error(exc.message);
        process.exit(1);
    }
})();