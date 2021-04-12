import { createStore } from 'vuex'
import { MutationTypes, ActionTypes } from './constants';
import { rpc } from "@/api";

// Create a new store instance.
export default createStore({
    state() {
        return {
            taskLogs: null,
            currentProgram: null,
            hasConnectionWithServer: null,
        };
    },
    getters: {
        taskLogs: state => state.taskLogs,
        currentProgram: state => state.currentProgram,
        hasConnectionWithServer: state => state.hasConnectionWithServer,
    },
    mutations: {
        [MutationTypes.SET_TASK_LOGS](state, newLogs) {
            state.taskLogs = newLogs;
        },
        [MutationTypes.SET_CURRENT_PROGRAM](state, payload) {
            state.currentProgram = payload;
        },
        [MutationTypes.SET_HAS_CONNECTION_WITH_SERVER](state, payload) {
            state.hasConnectionWithServer = payload;
        },
    },
    actions: {
        async [ActionTypes.UPDATE_TASK_LOGS](ctx) {
            ctx.commit(MutationTypes.SET_TASK_LOGS, await rpc.getTaskLogs());
        },
        [ActionTypes.PROCESS_NOTIFICATION_FROM_SERVER](ctx, payload) {
            // console.log('process notification', payload);
            switch (payload.type) {
                case 'current_program':
                    ctx.commit(MutationTypes.SET_CURRENT_PROGRAM, payload.value);
                    break;
                default:
                    console.warn("Got unknown notification from the server \n", payload);
            }
        },
    }
});