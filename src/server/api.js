'use strict';

const dataUtils = require('../data_utils');
const { getReport } = require('../report');

module.exports = {
    getLogEntries() {
        return dataUtils.getAutoLogEntriesForDates();
    },

    getReport(from, to) {
        return getReport(from, to);
    },
};