const moment = require('moment');
const invoice = require('../invoice');

module.exports = {
  get: async (locale, tenantId, params) => {
    const momentTerm = moment(params.term, 'YYYYMMDDHH').locale(locale);
    const momentToday = moment().locale(locale);
    const dueDate = moment(momentTerm).add(10, 'days');
    const dueDay = dueDate.isoWeekday();

    if (dueDay === 6) {
      dueDate.subtract(1, 'days');
    } else if (dueDay === 7) {
      dueDate.add(1, 'days');
    }

    let billingDay = momentToday;
    if (dueDate.isSameOrBefore(momentToday)) {
      const today = moment(momentTerm);
      const day = today.isoWeekday();
      if (day === 6) {
        today.subtract(1, 'days');
      } else if (day === 7) {
        today.add(1, 'days');
      }
      billingDay = today;
    }

    const { landlord, tenant, period } = await invoice.get(
      locale,
      tenantId,
      params
    );

    // data that will be injected in the email content files (ejs files)
    return {
      landlord,
      tenant,
      period,
      today: billingDay.format('LL'),
      billingRef: `${moment(params.term, 'YYYYMMDDHH')
        .locale(locale)
        .format('MM_YY')}_${tenant.reference}`,
      dueDate: dueDate.format('LL'),
    };
  },
};
