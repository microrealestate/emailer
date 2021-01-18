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
        landlord.name = landlord.isCompany ? landlord.companyInfo.name : landlord.contacts[0].name;
        delete tenant.realmId;

        tenant.rents = tenant.rents.filter(rent => rent.term === Number(params.term));

        const momentTerm = moment(params.term, 'YYYYMMDDHH').locale(locale);
        const momentToday = moment().locale(locale);

        // data that will be injected in the email content files (ejs files)
        return {
            landlord,
            tenant,
            period: momentTerm.format('MMMM YYYY'),
            today: momentToday.format('LL')
        };
    }
};