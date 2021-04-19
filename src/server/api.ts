import { getProgramLogEntriesForDates } from "../data_utils";
import { getCurrentTask, getTaskLogs, stopCurrentTask, startTask } from "../task";
import { getReport } from "../report";

const apiMethods = {
    getLogEntries: getProgramLogEntriesForDates,
    getReport,
    getCurrentTask,
    stopCurrentTask,
    startTask,
    getTaskLogs,
};

export type ApiMethods = typeof apiMethods;
export default apiMethods as typeof apiMethods & Record<string, Function>;