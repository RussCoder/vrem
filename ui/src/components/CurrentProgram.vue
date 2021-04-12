<script>
import { PhPlayCircle, PhStopCircle } from 'phosphor-vue';
import { makeDurationString } from "@/utils";

export default {
    data() {
        return {
            time: null,
        }
    },
    computed: {
        currentProgram() {
            return this.$store.getters.currentProgram;
        },
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
            this.time = Date.now() - this.currentProgram.timestamp;
        },

        makeDurationString(ms) {
            return makeDurationString(ms);
        },
    },
    watch: {
        currentProgram(value, oldValue) {
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
        <span class="indicator" :data-active="currentProgram ? true : null" />
        <span v-if="!currentProgram">The tracker is stopped.</span>
        <template v-else>
            <span class="description">{{ currentProgram.description }}</span>
            <span class="time">{{ makeDurationString(time) }}</span>
        </template>
    </div>
</template>

<style lang="scss" scoped>
    .current_program {
        display: inline-flex;
        margin: 0 1em;
        width: 30em;
        align-items: center;
        border-left: 1px solid gray;
        padding-left: 3em;
        height: 100%;

        .indicator {
            background: darkred;
            width: 1em;
            height: 1em;
            border-radius: 100px;
            margin-right: 0.5em;


            &[data-active] {
                background: darkgreen;
            }
        }

        .description {
            font-size: 1.5em;
        }

        .time {
            margin-left: 3em;
            font-family: monospace;
        }
    }
</style>