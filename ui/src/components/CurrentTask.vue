<script>
import { PhPlayCircle, PhStopCircle } from 'phosphor-vue';
import { rpc } from "@/api";
import { makeDurationString } from "@/utils";
import { ActionTypes } from "@/constants";

export default {
    data() {
        return {
            currentTask: null,
            displayedName: '',
            time: null,
        }
    },
    async mounted() {
        this.currentTask = await rpc.getCurrentTask();
    },
    computed: {
        name: {
            get() {
                return this.displayedName || (this.currentTask ? this.currentTask.name : '');
            },
            set(value) {
                this.displayedName = value;
            }
        }
    },
    methods: {
        updateTime() {
            this.time = Date.now() - this.currentTask.startTime;
        },

        makeDurationString(ms) {
            return makeDurationString(ms);
        },

        async startTask() {
            const result = await rpc.startTask(this.name);
            if (result.success) {
                this.currentTask = result.activeTask;
            }
        },

        async stopCurrentTask() {
            const stoppedTask = await rpc.stopCurrentTask();
            if (stoppedTask) {
                Object.assign(this.$data, this.$options.data.apply(this));
                this.$store.dispatch(ActionTypes.UPDATE_TASK_LOGS);
            }
        },
    },
    watch: {
        currentTask(value, oldValue) {
            clearInterval(this.interval);
            this.interval = null;
            if (!value) {
                Object.assign(this.$data, this.$options.data.call(this));
            } else {
                this.updateTime();
                this.interval = setInterval(() => this.updateTime(), 1000);
            }
        },
    },
    components: {
        PhPlayCircle, PhStopCircle
    },
};
</script>

<template>
    <div class="current_program">
        <input v-model="name" placeholder="Enter the task name here" />
        <span class="time">{{ makeDurationString(time) }}</span>
        <PhPlayCircle v-if="!currentTask" weight="fill" color="darkgreen" @click="startTask" />
        <PhStopCircle v-if="currentTask" weight="fill" color="darkred" @click="stopCurrentTask" />
    </div>
</template>

<style lang="scss" scoped>
    .current_program {
        display: inline-flex;
        margin: 0 1em;
        width: 30em;

        input {
            flex: 1 1 10em;
            align-self: center;
            height: 2em;
            border-radius: 3px;
            border: 1px solid gray;
        }

        svg {
            font-size: 48px;
            margin-left: 0.5em;
            cursor: pointer;
        }

        .time {
            font-family: monospace;
            align-self: center;
            margin: 0 0.5em;
        }
    }
</style>