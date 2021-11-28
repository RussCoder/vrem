<script lang="ts">
import { defineComponent } from "vue";
import TaskLogTable from "./TaskLogTable.vue";
import { ActionTypes } from "@/store";
import { UITaskLogEntryUpdate } from "@backend/task";
import { NDialogProvider } from "naive-ui";

export default defineComponent({
    components: { TaskLogTable, NDialogProvider },

    mounted() {
        this.$store.dispatch(ActionTypes.updateTaskLogs);
    },

    computed: {
        sortedLogs() {
            const logs = this.$store.getters.taskLogs;
            if (!logs) return {};

            const sortedLogs = {};
            let dayStart = Infinity;
            let dayEnd = 0;
            let dayLogs: typeof logs = [];

            const updateTimeBorders = timestamp => {
                if (dayStart !== Infinity) {
                    sortedLogs[dayStart] = dayLogs;
                    dayLogs = [];
                }

                const date = new Date(timestamp);
                date.setHours(0, 0, 0, 0);
                dayStart = date.valueOf();
                date.setHours(23, 59, 59, 999);
                dayEnd = date.valueOf();
            };

            for (const entry of logs) {
                if (entry.startTime < dayStart) {
                    updateTimeBorders(entry.startTime);
                }
                dayLogs.push(entry);
            }

            return sortedLogs;
        }
    },
    methods: {
        onChange(data: UITaskLogEntryUpdate) {
            this.$store.dispatch(ActionTypes.updateTaskLogEntry, data);
        },
    }
});
</script>

<template>
    <NDialogProvider>
        <template v-for="[dayStart, logs] of Object.entries(sortedLogs)" :key="dayStart">
            <h2>{{ new Date(+dayStart).toLocaleDateString('ru') }}</h2>
            <TaskLogTable :logs="logs" @change="onChange" />
        </template>
    </NDialogProvider>
</template>

<style lang="scss" scoped>

</style>