const moment = require('moment');
const Tenant = require('../../../model/tenant');

module.exports = {
    get: async (locale, tenantId, params) => {
        const dbTenant = await Tenant.findOne({ _id: tenantId }).populate('realmId').populate('properties.propertyId');
        if (!dbTenant) {
            throw new Error('tenant not found');
        }

        if (!dbTenant.rents.length) {
            throw new Error('term not found');
        }

        const tenant = dbTenant.toObject();
        const landlord = tenant.realmId;
        landlord.name = landlord.isCompany ? landlord.company : landlord.manager;
        landlord.collaborators = [
            landlord.user1,
            landlord.user2,
            landlord.user3,
            landlord.user4,
            landlord.user5,
            landlord.user6,
            landlord.user7,
            landlord.user8,
            landlord.user9,
            landlord.user10
        ].filter(email => !!email).map(email => email.toLowerCase());
        delete landlord.user1;
        delete landlord.user2;
        delete landlord.user3;
        delete landlord.user4;
        delete landlord.user5;
        delete landlord.user6;
        delete landlord.user7;
        delete landlord.user8;
        delete landlord.user9;
        delete landlord.user10;
        delete tenant.realmId;

        tenant.rents = tenant.rents.filter(rent => rent.term === Number(params.term));

        const momentTerm = moment(params.term, 'YYYYMMDDHH').locale(locale);
        const momentToday = moment().locale(locale);
        const dueDate = moment(momentTerm).add(10, 'days');
        const dueDay = dueDate.isoWeekday();

        if ( dueDay === 6 ) {
            dueDate.subtract(1, 'days');
        } else if ( dueDay === 7 ) {
            dueDate.add(1, 'days');
        }

        let billingDay = momentToday;
        if (dueDate.isSameOrBefore(momentToday)) {
            const today = moment(momentTerm);
            const day = today.isoWeekday();
            if ( day === 6 ) {
                today.subtract(1, 'days');
            } else if ( day === 7 ) {
                today.add(1, 'days');
            }
            billingDay = today;
        }

        // data that will be injected in the email content files (ejs files)
        return {
            landlord,
            tenant,
            period: momentTerm.format('MMMM YYYY'),
            today: billingDay.format('LL'),
            billingRef: `${moment(params.term, 'YYYYMMDDHH').locale(locale).format('MM_YY')}_${tenant.reference}`,
            dueDate: dueDate.format('LL')
        };
    }
};