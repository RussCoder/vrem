<script>
import { rpc } from '@/api';
import ProgramReport from "@/components/TheReport/ProgramReport";
import { ElTabs, ElButton } from 'element-plus';
import { makeDurationString } from "@backend/utils";

export default {
    components: { ProgramReport, ElTabs, ElButton, ElTabPane: ElTabs.TabPane },
    data() {
        const today = new Date().toISOString().split('T')[0];

        return {
            startDate: today,
            endDate: today,
            report: null,
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
}
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
            <ElButton native-type="submit">Form the report</ElButton>
        </form>
        <ElTabs tab-position="left" class="report_wrapper" v-if="report">
            <ElTabPane>
                <template #label>
                    <span class="label">General report</span>
                </template>
                <div class="report">
                    <h3>
                        Report for dates from {{ report.startDate }} to
                        {{ report.endDate }}
                    </h3>
                    <ProgramReport :report="report.programReport" />
                </div>
            </ElTabPane>
            <ElTabPane v-for="(taskReport, i) in report.taskReport" :key="i">
                <template #label>
                    <span class="label">{{ taskReport.name }}</span>
                </template>
                <div class="report">
                    <h3>
                        Task report: <span style="color: darkblue">{{ taskReport.name }}</span>
                        <span style="color: green" v-if="taskReport.current"> (running)</span>
                    </h3>
                    <h3>Total time: <span style="color: darkblue">{{ makeDurationString(taskReport.time) }}</span></h3>
                    <ProgramReport :report="taskReport.programReport" />
                </div>
            </ElTabPane>
        </ElTabs>
    </div>
</template>

<style lang="scss" scoped>
    .report_wrapper {
        margin: 1em;

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