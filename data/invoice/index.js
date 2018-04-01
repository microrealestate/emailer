const moment = require('moment');
const i18n = require('../locale');
const db = require('../');

module.exports = {
    async get(params) {
        await db.start();
        const data = {};
        const tenant = await db.getTenant(params.tenantId, params.term);
        data.tenant = tenant;

        const locale = params.locale || 'fr';

        data.billingRef = `${moment(params.term, 'YYYYMMDDHH').locale(locale).format('MM_YY')}_${tenant.reference}`;
        data.filename = `${i18n(locale)[`short_${params.document}`]}-${tenant.name}-${data.billingRef}`;

        const momentTerm = moment(params.term, 'YYYYMMDDHH').locale(locale);
        const momentToday = moment().locale(locale);
        data.period = momentTerm.format('MMMM YYYY');
        data.today = momentToday.format('LL');

        return data;
    }
};