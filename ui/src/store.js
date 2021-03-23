import { createStore } from 'vuex'
import { MutationTypes, ActionTypes } from './constants';
import { rpc } from "@/api";

// Create a new store instance.
export default createStore({
    state() {
        return {
            taskLogs: null,
        };
    },
    getters: {
        taskLogs: state => state.taskLogs,
    },
    mutations: {
        [MutationTypes.SET_TASK_LOGS](state, newLogs) {
            state.taskLogs = newLogs;
        },
    },
    actions: {
        async [ActionTypes.UPDATE_TASK_LOGS](ctx) {
            ctx.commit(MutationTypes.SET_TASK_LOGS, await rpc.getTaskLogs());
        },
    }
});