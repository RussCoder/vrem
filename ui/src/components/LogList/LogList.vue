<template>
    <h2>Log list</h2>
    <ul>
        <LogEntry v-for="(item, i) in logEntries" :key="i" :entry="item" />
    </ul>
</template>

<script>
import LogEntry from './LogEntry.vue';
import { rpc } from '@/api';

export default {
    data() {
        return {
            logEntries: [],
        };
    },
    async created() {
        this.logEntries = await rpc.getLogEntries();
        this.logEntries.reverse();
    },
    components: {
        LogEntry,
    },
}
</script>