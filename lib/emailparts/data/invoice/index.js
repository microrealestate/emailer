const moment = require('moment');
const Tenants = require('../../../model/tenants');

module.exports = {
    get: async (tenantId, params) => {
        const data = {};
        const tenant = await Tenants.get(tenantId, params.term);
        data.tenant = tenant;

        const locale = params.locale || 'fr';

        const momentTerm = moment(params.term, 'YYYYMMDDHH').locale(locale);
        const momentToday = moment().locale(locale);
        data.period = momentTerm.format('MMMM YYYY');
        data.today = momentToday.format('LL');

        return data;
    }
};