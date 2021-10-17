<script lang="ts">
import { defineComponent, PropType } from "vue";
import { makeTimeDurationString } from "@/utils";
import EditableDateTime from "./EditableDateTime.vue";
import { UITaskLogEntry, UITaskLogEntryUpdate } from "@backend/task";

export default defineComponent({
    components: { EditableDateTime },
    props: {
        logs: Array as PropType<UITaskLogEntry[]>,
    },
    emits: {
        change: (data: UITaskLogEntryUpdate) => !!data.id,
    },
    methods: {
        getDuration(entry) {
            return makeTimeDurationString(entry.endTime - entry.startTime);
        }
    }
});
</script>

<template>
    <table>
        <tr>
            <th>Task name</th>
            <th>Duration</th>
            <th>Time</th>
        </tr>
        <tr class="row" v-for="entry of logs" :key="entry.id">
            <td class="task_name">{{ entry.taskName }}</td>
            <td class="duration">{{ getDuration(entry) }}</td>
            <td class="time">
                <div class="flex">
                    <EditableDateTime
                        :timestamp="entry.startTime"
                        @change="$emit('change', {id: entry.id, startTime: $event})"
                    />
                    <span> - </span>
                    <EditableDateTime
                        :timestamp="entry.endTime"
                        @change="$emit('change', {id: entry.id, endTime: $event})"
                    />
                </div>
            </td>
        </tr>
    </table>

</template>

<style lang="scss" scoped>
    table {
        width: 50em;
        font-size: 20px;
        margin-bottom: 2em;
        vertical-align: middle;
    }

    th {
        text-align: left;
        font-weight: normal;
        color: gray;
        font-family: monospace;
    }

    td {
        border-bottom: 1px solid lightgray;
    }

    .duration {
        width: 7em;
    }

    .time {
        width: 10em;
        white-space: nowrap;

        .flex {
            display: flex;
            align-items: center;
            height: 3em;
        }
    }
</style>