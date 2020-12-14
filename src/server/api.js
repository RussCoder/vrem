'use strict';

const dataUtils = require('../data_utils');
const { getReport } = require('../report');

module.exports = {
    async getLogEntries() {
        const logs = [];
        for await (const entry of dataUtils.getLogEntriesForDates()) {
            logs.push(entry);
        }

        return logs;
    },

    async getReport(from, to) {
        return await getReport(from, to);
    },
};