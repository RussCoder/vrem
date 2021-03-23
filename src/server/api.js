'use strict';

const dataUtils = require('../data_utils');
const { getReport } = require('../report');
const manualTask = require('../manualTask');

module.exports = {
    getLogEntries() {
        return dataUtils.getProgramLogEntriesForDates();
    },

    getReport(from, to) {
        return getReport(from, to);
    },

    getCurrentTask() {
        return manualTask.getCurrentTask();
    },

    stopCurrentTask() {
        return manualTask.stopCurrentTask();
    },

    startTask(name) {
        return manualTask.startTask(name);
    },

    getTaskLogs(limit, offset) {
        return manualTask.getTaskLogs(limit, offset);
    },
};