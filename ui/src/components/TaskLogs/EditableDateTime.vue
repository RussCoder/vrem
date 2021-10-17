<script lang="ts">
import { computed, defineComponent, reactive, ref } from "vue";

export default defineComponent({
    props: {
        timestamp: {
            type: Number,
            required: true,
        }
    },
    emits: {
        change: (timestamp: number) => Number.isInteger(timestamp),
    },
    setup(props, { emit }) {
        const it = reactive<Record<string, string | null>>({
            _timeString: null,
            _dateString: null
        });

        const timeString = computed({
            get: () => it._timeString !== null ? it._timeString : new Date(props.timestamp).toLocaleTimeString('ru'),
            set: value => it._timeString = value,
        });

        const dateString = computed({
            get: () => it._dateString !== null ? it._dateString : new Date(props.timestamp).toLocaleDateString('ru'),
            set: value => it._dateString = value
        });

        const root = ref<HTMLSpanElement>();
        const time = ref<HTMLInputElement>();
        const date = ref<HTMLInputElement>();
        const editing = ref(false);

        const submit = () => {
            editing.value = false;
            if (time.value?.validity.patternMismatch || date.value?.validity.patternMismatch) {
                it._timeString = null;
                it._dateString = null;
            } else {
                const parts = /(\d\d)\.(\d\d)\.(\d\d\d\d)/.exec(dateString.value);
                if (!parts) return;
                const timestamp = Date.parse(`${parts[3]}-${parts[2]}-${parts[1]}T${timeString.value}`);
                if (Math.abs(timestamp - props.timestamp) < 1000) return;
                emit('change', timestamp);
            }
        }

        const onFocusOut = (e: FocusEvent) => {
            if (!root.value?.contains(e.relatedTarget as HTMLInputElement)) {
                it._timeString = null;
                it._dateString = null;
                editing.value = false;
            }
        }

        return { dateString, timeString, root, time, date, editing, onFocusOut, submit };
    },
    watch: {
        editing(value) {
            this.$nextTick(() => {
                if (value && this.$refs.time instanceof HTMLInputElement) {
                    this.$refs.time.focus();
                }
            });
        }
    },
});
</script>

<template>
    <span
        v-if="!editing"
        class="root shared"
        @click="editing = true"
    >
        <span class="time">{{ timeString }}</span>
        <span class="date">{{ dateString }}</span>
    </span>
    <span
        v-if="editing"
        ref="root"
        class="editing_root shared"
        @focusout="onFocusOut"
        @keypress.enter="submit"
    >
        <input ref="time" pattern="\d\d:\d\d:\d\d" class="time" v-model="timeString" />
        <input ref="date" pattern="\d\d\.\d\d\.\d\d\d\d" class="date" v-model="dateString" />
    </span>
</template>

<style lang="scss" scoped>
    .shared {
        display: inline-flex;
        flex-direction: column;
        align-items: center;
        width: 5em;
        box-sizing: border-box;
        border-radius: 5px;
    }

    .root {
        &:hover {
            background: #e9ebec;
        }

        .date {
            font-size: 0.7em;
            opacity: 0.7;
        }
    }

    .editing_root {
        input {
            text-align: center;
            outline: none;
            margin: 0;
            border: 1px solid lightgray;
            border-radius: 3px;
            font-family: v-sans, sans-serif;
        }

        input.time {
            box-sizing: border-box;
            width: 90%;
            margin-bottom: 2px;
            font-size: 1em;
        }

        input.date {
            width: 70%;
            font-size: 0.7em;
        }

        input:invalid {
            border-color: red;
        }
    }
</style>