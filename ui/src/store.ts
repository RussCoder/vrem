import { createStore, StoreOptions } from 'vuex'
import { MutationTypes, ActionTypes } from './constants';
import { rpc } from "@/api";
import { UITaskLogEntry, UITaskLogEntryUpdate } from "@backend/task";

export interface State {
    taskLogs: UITaskLogEntry[] | null,
    currentProgram: any,
    hasConnectionWithServer: boolean | null,
}

const getters = {
    taskLogs: (state: State) => state.taskLogs,
    currentProgram: (state: State) => state.currentProgram,
    hasConnectionWithServer: (state: State) => state.hasConnectionWithServer,
};

export const storeOptions: StoreOptions<State> = {
    state() {
        return {
            taskLogs: null,
            currentProgram: null,
            hasConnectionWithServer: null,
        };
    },
    getters,
    mutations: {
        [MutationTypes.SET_TASK_LOGS](state, newLogs: UITaskLogEntry[]) {
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
        async [ActionTypes.UPDATE_TASK_LOG_ENTRY](ctx, payload: UITaskLogEntryUpdate) {
            await rpc.updateTaskLogEntry(payload);
            ctx.dispatch(ActionTypes.UPDATE_TASK_LOGS);
        },
    }
};

export type GettersType = {
    [key in keyof typeof getters]: ReturnType<(typeof getters)[key]>
};

export default createStore<State>(storeOptions);