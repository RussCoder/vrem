<script>
import { rpc } from '../api';

export default {

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
        async formReport() {
            const report = {
                startDate: this.startDate,
                endDate: this.endDate,
                ...await rpc.getReport(this.startDate, this.endDate),
            };
            report.totalActiveTime = report.entries.reduce((sum, entry) => {
                return sum + entry.time;
            }, 0);

            this.report = report;
        },
        formTimeString(time) {
            const hours = Math.floor(time / (60 * 60 * 1000));
            time -= hours * 60 * 60 * 1000;
            const minutes = Math.floor(time / 60 / 1000);
            time -= minutes * 60 * 1000;
            const secs = Math.floor(time / 1000);
            return `${hours ? hours + 'h ' : ''}${minutes ? minutes + 'm ' : ''}${secs ? secs + 's' : ''}`;
        },
    }
}
</script>

<template>
    <div>
        <h2>The Report</h2>
        <form @submit.prevent="formReport">
            <div class="time">
                <span>Start date:</span>
                <input v-model="startDate" type="date" />
            </div>
            <div class="time">
                <span>End date:</span>
                <input v-model="endDate" type="date" />
            </div>
            <input type="submit" value="Form the report" />
        </form>
        <div class="report" v-if="report">
            <h3>
                Report for dates from {{ report.startDate }} to
                {{ report.endDate }}
            </h3>
            <ul>
                <li v-for="(entry, i) in report.entries" :key="i">
                    <span class="time_string">{{
                        formTimeString(entry.time)
                    }}</span>
                    - {{ entry.description }}
                </li>
            </ul>
            <div style="color: green">
                Total active time: {{ formTimeString(report.totalActiveTime) }}
            </div>
            <div style="color: orange">
                Idle time: {{ formTimeString(report.idleTime) }}
            </div>
            <div style="color: blue">
                Total time:
                {{ formTimeString(report.totalActiveTime + report.idleTime) }}
            </div>
        </div>
    </div>
</template>

<style lang="scss" scoped>
    .time {
        margin: 1em;

        span {
            display: inline-block;
            min-width: 5em;
        }
    }

    .report {
        font-family: Consolas, monospace;

        .time_string {
            display: inline-block;
            min-width: 6em;
        }
    }
</style>