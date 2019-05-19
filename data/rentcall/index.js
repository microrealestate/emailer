const moment = require('moment');
const i18n = require('../locale');
const db = require('../');

module.exports = {
    async get(params) {
        await db.start();

        const tenant = await db.getTenant(params.tenantId, params.term);
        const locale = params.locale || 'fr';
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

        const data = {
            tenant,
            billingRef: `${moment(params.term, 'YYYYMMDDHH').locale(locale).format('MM_YY')}_${tenant.reference}`,
            period: momentTerm.format('MMMM YYYY'),
            today: billingDay.format('LL'),
            dueDate: dueDate.format('LL')
        };

        return {
            ...data,
            filename: `${i18n(locale)[`short_${params.document}`]}-${tenant.name}-${data.billingRef}`
        };
    }
};