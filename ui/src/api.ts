import store from "@/store";
import { ActionTypes } from "@/store";
import { MutationTypes } from "@/store";
import { ApiMethods } from "@backend/server/api";

let id = 1;

let ws;

const requestMap = {};

let connectionPromiseResolve;
let connectionPromise;
const resetConnectionPromise = () => {
    connectionPromise = new Promise(resolve => connectionPromiseResolve = resolve);
};

resetConnectionPromise();
const apiUrl = 'ws://localhost:3210/vrem-api';

function connect() {
    console.info(`Trying to connect ...`);
    ws = new WebSocket(apiUrl);

    ws.onopen = () => {
        store.commit(MutationTypes.setHasConnectionWithServer, true);
        connectionPromiseResolve();
        console.info(`%cConnection opened`, `color: green`);
    };

    ws.onerror = () => {};

    ws.onclose = (code, reason) => {
        console.warn(`Connection closed `, code, reason);
        store.commit(MutationTypes.setHasConnectionWithServer, false);
        resetConnectionPromise();
        connect();
    };

    ws.onmessage = (e) => {
        const data = JSON.parse(e.data);

        if (data.id) {
            const callbacks = requestMap[data.id];
            delete requestMap[data.id];
            if (callbacks) {
                data.error ? callbacks.reject(data.error) : callbacks.resolve(data.result);
            } else {
                console.warn("Got message with id, but there is no saved callbacks", data);
            }
        } else if (data.type) {
            void store.dispatch(ActionTypes.processNotificationFromServer, data);
        } else {
            console.warn('Got neither notification nor response from server', data)
        }
    };
}

connect();

type PromisifiedApiMethods = {
    [key in keyof ApiMethods]: (...params: Parameters<ApiMethods[key]>) => Promise<ReturnType<ApiMethods[key]>>
}

export const rpc = new Proxy({}, {
    get(target, prop) {
        return (...params) => {
            return connectionPromise.then(() => new Promise((resolve, reject) => {
                const requestId = id++;
                ws.send(JSON.stringify({
                    //jsonrpc: '2.0',
                    method: prop,
                    params: params,
                    id: requestId,
                }));

                requestMap[requestId] = { resolve, reject };
            }));
        };
    },
}) as PromisifiedApiMethods;