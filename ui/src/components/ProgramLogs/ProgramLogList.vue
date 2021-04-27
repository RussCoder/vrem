<script lang="ts">
import ProgramLogEntry from './ProgramLogEntry.vue';
import { rpc } from '@/api';
import { computed, defineComponent } from "vue";
import { programLogsTypesKey } from "@/constants";
import { ProgramLogTypes, ProgramLogEntry as ProgramLogEntryType } from "@backend/data_utils";

export default defineComponent({
    data() {
        return {
            programLogTypes: null as null | ProgramLogTypes,
            logEntries: [] as ProgramLogEntryType[],
            lastFetchedTime: null as null | number,
        };
    },
    async created() {
        this.programLogTypes = await rpc.getProgramLogTypes();
        await this.updateList();
    },
    watch: {
        ['$store.getters.currentProgram']() {
            this.updateList();
        }
    },
    methods: {
        async updateList() {
            const list = await rpc.getLogEntries(...(this.lastFetchedTime ? [this.lastFetchedTime + 1] : []));
            list.reverse();
            this.logEntries = [...list, ...this.logEntries];
            this.lastFetchedTime = this.logEntries[0].timestamp;
        },
    },
    provide() {
        return {
            [programLogsTypesKey as symbol]: computed(() => this.programLogTypes),
        };
    },
    components: {
        ProgramLogEntry,
    },
});
</script>

<template>
    <h2>Log list</h2>
    <ul>
        <template v-if="logEntries.length">
            <ProgramLogEntry v-for="item in logEntries" :key="item.timestamp" :entry="item" />
        </template>
    </ul>
</template>