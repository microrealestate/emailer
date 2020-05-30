const moment = require('moment');
const Tenant = require('../../../model/tenant');

module.exports = {
    get: async (locale, tenantId, params) => {
        const dbTenant = await Tenant.findOne({ _id: tenantId }).populate('realmId').populate('properties.propertyId');
        if (!dbTenant.rents.length) {
            throw new Error('term not found');
        }

        const tenant = dbTenant.toObject();
        const landlord = tenant.realmId;
        landlord.name = landlord.isCompany ? landlord.company : landlord.manager;

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