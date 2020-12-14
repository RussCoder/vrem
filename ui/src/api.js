let id = 1;

export const rpc = new Proxy({}, {
    get(target, prop) {
        return async (...params) => {
            const data = await fetch('/api/jsonrpc2', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    //jsonrpc: '2.0',
                    method: prop,
                    params: params,
                    id: id++,
                })
            }).then(r => r.json());

            if (data.error) {
                if (data.error) {
                    throw new Error(data.error.message);
                }
            }
            return data.result;
        };
    },
});