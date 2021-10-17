import { getProgramLogEntriesForDates, programLogTypes } from "../data_utils";
import { getCurrentTask, getTaskLogs, stopCurrentTask, startTask, updateTaskLogEntry } from "../task";
import { getReport } from "../report";
import { getAllPrograms } from "../program";

const apiMethods = {
    getLogEntries: getProgramLogEntriesForDates,
    getReport,
    getCurrentTask,
    stopCurrentTask,
    startTask,
    getTaskLogs,
    updateTaskLogEntry,
    getProgramLogTypes: () => programLogTypes,
    getAllPrograms,
};

export type ApiMethods = typeof apiMethods;
export default apiMethods as typeof apiMethods & Record<string, Function>;