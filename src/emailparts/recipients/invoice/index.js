const config = require('../../../config');

module.exports = {
    get: (recordId, params, data) => {
        if (!data.tenant && !data.tenant.contacts) {
            throw new Error('tenant has not any contact emails');
        }

        if (!data.landlord.email) {
            throw new Error('landlord has not defined any contact emails');
        }

        const landlordEmail = data.landlord.email.toLowerCase();

        const recipientsList =  data.tenant.contacts
            .filter(contact => contact.email)
            .reduce((acc, { email }) => {
                if (acc.find(({ to }) => to === email.toLowerCase())) {
                    return acc;
                }
                let recipients = {
                    from: landlordEmail,
                    to: email.toLowerCase(),
                    'h:Reply-To': landlordEmail
                };
                if (config.PRODUCTIVE && data.landlord.collaborators.length) {
                    recipients = {
                        ...recipients,
                        bcc: data.landlord.collaborators.join(',')
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