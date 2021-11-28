import { createStore, StoreOptions } from 'vuex'
import { rpc } from "@/api";
import { CurrentTask, UITaskLogEntry, UITaskLogEntryUpdate } from "@backend/task";
import { MessageApi } from "naive-ui";

export interface State {
    currentTask: CurrentTask | null,
    taskLogs: UITaskLogEntry[] | null,
    currentProgram: any,
    hasConnectionWithServer: boolean | null,
}

function state(): State {
    return {
        currentTask: null,
        taskLogs: null,
        currentProgram: null,
        hasConnectionWithServer: null,
    };
}

const getters: Record<string, (state: State) => any> = {
    taskLogs: (state: State) => state.taskLogs,
    currentProgram: (state: State) => state.currentProgram,
    hasConnectionWithServer: (state: State) => state.hasConnectionWithServer,
    currentTask: (s: State) => s.currentTask,
};

const mutations: Record<string, (state: State, ...args: any[]) => void> = {
    setTaskLogs(state, newLogs: UITaskLogEntry[]) {
        state.taskLogs = newLogs;
    },
    setCurrentProgram(state, payload) {
        state.currentProgram = payload;
    },
    setHasConnectionWithServer(state, payload) {
        state.hasConnectionWithServer = payload;
    },
    setCurrentTask(state, payload) {
        state.currentTask = payload;
    },
};

export const MutationTypes = Object.keys(mutations).reduce((obj, key) => {
    obj[key] = key;
    return obj;
}, {}) as { [key in keyof typeof mutations]: key };

let messageApi: MessageApi | null = null;

const actions = {
    setMessageApi(ctx, payload: MessageApi) {
        messageApi = payload;
    },
    async updateCurrentTask(ctx) {
        const task = await rpc.getCurrentTask();
        ctx.commit(MutationTypes.setCurrentTask, task);
    },
    async startCurrentTask(ctx, payload: string) {
        const result = await rpc.startTask(payload);
        if (result.success && result.activeTask) {
            ctx.commit(MutationTypes.setCurrentTask, result.activeTask);
            messageApi?.success(`The task "${result.activeTask.name}" has been started.`);
        }
        if (result.stoppedTask) {
            messageApi?.info(`The task "${result.stoppedTask.name}" has been stopped.`);
        }
    },
    async stopCurrentTask(ctx) {
        const result = await rpc.stopCurrentTask();
        if (result) {
            ctx.commit(MutationTypes.setCurrentTask, null);
            messageApi?.info(`The task "${result.name}" has been stopped.`);
            await ctx.dispatch(ActionTypes.updateTaskLogs);
        } else {
            messageApi?.error('Cannot stop the current task.');
        }
    },
    async updateTaskLogs(ctx) {
        ctx.commit(MutationTypes.setTaskLogs, await rpc.getTaskLogs());
    },
    processNotificationFromServer(ctx, payload) {
        // console.log('process notification', payload);
        switch (payload.type) {
            case 'current_program':
                ctx.commit(MutationTypes.setCurrentProgram, payload.value);
                break;
            default:
                console.warn("Got unknown notification from the server \n", payload);
        }
    },
    async updateTaskLogEntry(ctx, payload: UITaskLogEntryUpdate) {
        await rpc.updateTaskLogEntry(payload);
        ctx.dispatch(ActionTypes.updateTaskLogs);
    },
    async deleteTaskLogEntry(ctx, payload: number) {
        await rpc.deleteTaskLogEntry(payload);
        ctx.dispatch(ActionTypes.updateTaskLogs);
    }
};

export const ActionTypes = Object.keys(actions).reduce((obj, key) => {
    obj[key] = key;
    return obj;
}, {}) as { [key in keyof typeof actions]: key };

export const storeOptions: StoreOptions<State> = {
    state,
    getters,
    mutations,
    actions,
};

export type GettersType = {
    [key in keyof typeof getters]: ReturnType<(typeof getters)[key]>
};

export default createStore<State>(storeOptions);