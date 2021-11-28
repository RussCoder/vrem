<script lang="ts">
import { defineComponent, PropType } from "vue";
import { makeTimeDurationString } from "@/utils";
import EditableDateTime from "./EditableDateTime.vue";
import { UITaskLogEntry, UITaskLogEntryUpdate } from "@backend/task";
import { TrashBinSharp } from "@vicons/ionicons5";
import { useDialog, useMessage } from "naive-ui";
import EditableTextLine from "@/components/TaskLogs/EditableTextLine.vue";
import { rpc } from "@/api";
import { useStore } from "vuex";
import { ActionTypes } from "@/store";

export default defineComponent({
    components: { EditableTextLine, EditableDateTime, TrashBinSharp },
    props: {
        logs: Array as PropType<UITaskLogEntry[]>,
    },
    emits: {
        change: (data: UITaskLogEntryUpdate) => !!data.id,
    },
    setup() {
        const message = useMessage();
        const dialog = useDialog();
        const store = useStore();

        return {
            handleConfirm(entry: UITaskLogEntry) {
                dialog.warning({
                    title: `Are you sure?`,
                    content: `Delete "${entry.taskName}" (duration: ${makeTimeDurationString(entry.endTime - entry.startTime)})`,
                    positiveText: 'Yes',
                    negativeText: 'No',
                    onPositiveClick: async () => {
                        await rpc.deleteTaskLogEntry(entry.id);
                        await store.dispatch(ActionTypes.updateTaskLogs);
                        message.success(`The entry "${entry.taskName}" was deleted`);
                    },
                })
            },
        }
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
            <th style="text-align: center">*</th>
        </tr>
        <tr class="row" v-for="entry of logs" :key="entry.id">
            <td class="task_name">
                <EditableTextLine
                    @change="$emit('change', {id: entry.id, taskName: $event})"
                    :value="entry.taskName"
                />
            </td>
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
            <td class="controls">
                <TrashBinSharp class="trash_button" @click="handleConfirm(entry)" />
            </td>
        </tr>
    </table>

</template>

<style lang="scss" scoped>
    table {
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

    .task_name {
        width: 40em;
    }

    .controls {
        width: 3em;
        text-align: center;
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

    .trash_button {
        color: #b60606;
        cursor: pointer;
        width: 1em;

        &:hover {
            transform: scale(1.1);
        }
    }
</style>