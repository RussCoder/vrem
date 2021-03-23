<script>
import { makeDurationString } from "@/utils";

export default {
    props: {
        logs: Array,
    },
    methods: {
        getDuration(entry) {
            return makeDurationString(entry.endTime - entry.startTime);
        }
    }

}
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
                {{
                    new Date(entry.startTime).toLocaleTimeString('ru')
                    + ' - ' + new Date(entry.endTime).toLocaleTimeString('ru')
                }}
            </td>
        </tr>
    </table>

</template>

<style lang="scss" scoped>
    table {
        width: 50em;
        font-size: 20px;
        margin-bottom: 2em;
    }

    th {
        text-align: left;
        font-weight: normal;
        color: gray;
        font-family: monospace;
    }

    td {
        padding: 1em 0;
        border-bottom: 1px solid lightgray;
    }

    .row {
        padding: 1em;
    }

    .duration {
        width: 7em;
    }

    .time {
        width: 10em;
    }
</style>