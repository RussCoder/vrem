<script lang="ts">
import { ProgramReport } from "@backend/report";
import { defineComponent, PropType } from "vue";
import { makeDurationString } from "@backend/shared_utils";

export default defineComponent({
    props: {
        report: {
            type: Object as PropType<ProgramReport>,
            required: true,
        }
    },
    computed: {
        totalActiveTime(): number {
            return this.report.entries.reduce((sum, entry) => {
                return sum + entry.time;
            }, 0);
        }
    },
    methods: {
        makeDurationString,
    }
});
</script>

<template>
    <div class="report">
        <div style="color: green">
            Total active time: {{ makeDurationString(totalActiveTime) }}
        </div>
        <div style="color: orange">
            Idle time: {{ makeDurationString(report.idleTime) }}
        </div>
        <div style="color: blue">
            Total time:
            {{ makeDurationString(totalActiveTime + report.idleTime) }}
        </div>
        <ul>
            <li v-for="(entry, i) in report.entries" :key="i">
                <span class="time_string">
                    <span style="color: darkgreen; white-space: pre">
                        {{ `(${Math.round(entry.time / totalActiveTime * 10000) / 100}%) `.padEnd(9) }}
                    </span>
                    <span style="white-space: pre">{{ makeDurationString(entry.time).padEnd(11) }}</span>
                </span> - {{ entry.description }}
            </li>
        </ul>
    </div>
</template>

<style lang="scss" scoped>
    .report {
        font-family: Consolas, monospace;

        .time_string {
            display: inline-block;
            min-width: 6em;
        }
    }
</style>