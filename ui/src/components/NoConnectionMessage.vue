<template>
    <div class="no_connection_message">
        <span>No connection with the server</span>
    </div>
</template>

<style lang="scss" scoped>
    .no_connection_message {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 1;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;

        @keyframes pulse {
            from {
                opacity: 0.7;
            }
            to {
                opacity: 1;
            }
        }

        span {
            z-index: 2;
            font-size: 4rem;
            font-family: monospace;
            font-weight: bold;
            color: #ff0000;
            animation: 1s cubic-bezier(.09, .82, .47, .97) infinite alternate pulse;
        }
    }
</style>