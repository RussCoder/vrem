<script lang="ts">
import { defineComponent } from "vue";
import { rpc } from '@/api';
import ProgramReport from "@/components/TheReport/ProgramReport.vue";
import { NTabs, NTabPane, NButton } from "naive-ui";
import { makeDurationString } from "@backend/shared_utils";

export default defineComponent({
    components: { ProgramReport, NTabs, NTabPane, NButton },
    data() {
        const date = new Date();
        const today = new Date(date.valueOf() - 60000 * date.getTimezoneOffset()).toISOString().split('T')[0];

        return {
            startDate: today,
            endDate: today,
            report: null as any,
        };
    },

    created() {
        this.formReport();
    },

    methods: {
        makeDurationString,
        async formReport() {
            this.report = {
                startDate: this.startDate,
                endDate: this.endDate,
                ...await rpc.getReport(this.startDate, this.endDate),
            };
        },
    }
});
</script>

<template>
    <div>
        <h2>The Report</h2>
        <form @submit.prevent="formReport" class="controls">
            <div class="time">
                <span>Start date:</span>
                <input v-model="startDate" type="date" />
            </div>
            <div class="time">
                <span>End date:</span>
                <input v-model="endDate" type="date" />
            </div>
            <NButton attr-type="submit" type="primary">Form the report</NButton>
        </form>
        <NTabs type="line" class="report_wrapper" v-if="report">
            <NTabPane name="General report">
                <div class="report">
                    <h3>
                        Report for dates from {{ report.startDate }} to
                        {{ report.endDate }}
                    </h3>
                    <ProgramReport :report="report.programReport" />
                </div>
            </NTabPane>
            <NTabPane v-for="(taskReport, i) in report.taskReport" :name="taskReport.name" :key="i">
                <div class="report">
                    <h3>
                        Task report: <span style="color: darkblue">{{ taskReport.name }}</span>
                        <span style="color: green" v-if="taskReport.current"> (running)</span>
                    </h3>
                    <h3>Total time: <span style="color: darkblue">{{ makeDurationString(taskReport.time) }}</span></h3>
                    <ProgramReport :report="taskReport.programReport" />
                </div>
            </NTabPane>
        </NTabs>
    </div>
</template>

<style lang="scss" scoped>
    .report_wrapper {
        margin: 1em;
        line-height: 1.6;

        .label {
            font-size: 1.2em;
            font-family: Consolas, monospace;
        }

        .report {
            margin-left: 1em;
            font-family: Consolas, monospace;
        }
    }

    .controls {
        display: flex;
        align-items: center;

        .time {
            margin-right: 1.5em;

            span {
                display: inline-block;
                min-width: 5em;
            }
        }
    }
</style>