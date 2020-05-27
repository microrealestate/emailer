const config = require('../../../config');

module.exports = {
    get: (recordId, params, data) => {
        if (!data.tenant && !data.tenant.contacts) {
            throw new Error('tenant has not any contact emails');
        }

        const recipientsList =  data.tenant.contacts
            .filter(contact => contact.email)
            .reduce((acc, { email }) => {
                if (acc.find(({ to }) => to === email.toLowerCase())) {
                    return acc;
                }
                let recipients = {
                    from: config.EMAIL.FROM,
                    to: email.toLowerCase()
                };
                if (config.EMAIL.REPLY_TO) {
                    recipients = {
                        ...recipients,
                        'h:Reply-To': config.EMAIL.REPLY_TO
                    };
                }
                if (config.PRODUCTIVE && config.EMAIL.BCC) {
                    recipients = {
                        ...recipients,
                        bcc: config.EMAIL.BCC
                    };
                }

                acc.push(recipients);
                return acc;
            }, []);

        if (!recipientsList || !recipientsList.length) {
            throw new Error('tenant has not any contact emails');
        }

        return recipientsList;
    }
};