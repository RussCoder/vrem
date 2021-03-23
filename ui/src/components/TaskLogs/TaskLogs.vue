<script>
import TaskLogTable from "@/components/TaskLogs/TaskLogTable";
import { ActionTypes } from "@/constants";

export default {
    components: { TaskLogTable },

    mounted() {
        this.$store.dispatch(ActionTypes.UPDATE_TASK_LOGS);
    },

    computed: {
        sortedLogs() {
            const logs = this.$store.getters.taskLogs;
            if (!logs) return {};

            const sortedLogs = {};
            let dayStart = Infinity;
            let dayEnd = 0;
            let dayLogs = [];

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
}

</script>

<template>
    <template v-for="[dayStart, logs] of Object.entries(sortedLogs)" :key="dayStart">
        <h2>{{ new Date(+dayStart).toLocaleDateString('ru') }}</h2>
        <TaskLogTable :logs="logs" />
    </template>
</template>

<style lang="scss" scoped>

</style>