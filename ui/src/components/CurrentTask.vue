<script lang="ts">
import { defineComponent } from "vue";
import PhPlayCircle from '@/assets/icons/play-circle-fill.svg';
import PhStopCircle from '@/assets/icons/stop-circle-fill.svg';
import { makeTimeDurationString } from "@/utils";
import { ActionTypes } from "@/store";
import { CurrentTask } from "@backend/task";

export default defineComponent({
    components: { PhPlayCircle, PhStopCircle },
    setup() {
        return {
            interval: undefined as number | undefined,
        }
    },
    data() {
        return {
            currentTask: null as CurrentTask | null,
            displayedName: '',
            time: null as number | null,
        }
    },
    async mounted() {
        await this.$store.dispatch(ActionTypes.updateCurrentTask);
        this.currentTask = this.$store.getters.currentTask;
    },
    computed: {
        name: {
            get(): string {
                return this.displayedName || (this.currentTask ? this.currentTask.name : '');
            },
            set(value: string) {
                this.displayedName = value;
            }
        }
    },
    methods: {
        updateTime() {
            this.time = Date.now() - (this.currentTask?.startTime || 0);
        },

        makeDurationString(ms) {
            return makeTimeDurationString(ms);
        },

        async startTask() {
            await this.$store.dispatch(ActionTypes.startCurrentTask, this.name);
            this.currentTask = this.$store.getters.currentTask;
        },

        async stopCurrentTask() {
            await this.$store.dispatch(ActionTypes.stopCurrentTask);
            const currentTask = this.$store.getters.currentTask;
            if (!currentTask) {
                Object.assign(this.$data, (this.$options.data as any).apply(this));
            }
        },
    },
    watch: {
        currentTask(value) {
            clearInterval(this.interval);
            this.interval = undefined;
            if (!value) {
                Object.assign(this.$data, (this.$options.data as any).apply(this));
            } else {
                this.updateTime();
                this.interval = setInterval(() => this.updateTime(), 1000);
            }
        },
    },
});
</script>

<template>
    <div class="current_program">
        <input v-model="name" placeholder="Enter a task name here" @keypress.enter="startTask" />
        <span class="time">{{ makeDurationString(time) }}</span>
        <PhPlayCircle v-if="!currentTask" color="darkgreen" @click="startTask" />
        <PhStopCircle v-if="currentTask" color="darkred" @click="stopCurrentTask" />
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
            height: 1.5em;
            border-radius: 3px;
            border: 1px solid gray;
            font-size: 1em;
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