<script>
import ProgramLogEntry from './ProgramLogEntry.vue';
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
        ProgramLogEntry,
    },
}
</script>

<template>
    <h2>Log list</h2>
    <ul>
        <ProgramLogEntry v-for="(item, i) in logEntries" :key="i" :entry="item" />
    </ul>
</template>