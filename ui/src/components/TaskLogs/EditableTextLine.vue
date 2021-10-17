<script lang="ts">
import { computed, defineComponent, PropType, ref, watchPostEffect } from "vue";

export default defineComponent({
    props: {
        value: {
            type: String as PropType<string>,
            required: true,
        }
    },
    emits: {
        change: (text: string) => typeof text === 'string',
    },
    setup(props, { emit }) {
        const _text = ref<string|null>(null);
        const text = computed({
            get: () => _text.value === null ? props.value : _text.value,
            set: value => _text.value = value,
        });

        const editing = ref(false);
        const root = ref<HTMLInputElement>();

        const submit = () => {
            editing.value = false;

            if (props.value !== text.value) {
                emit('change', text.value);
            }
        }

        watchPostEffect(() => {
            if (editing.value && root.value) {
                root.value.focus();
            }
        });

       const onBlur = () => {
            editing.value = false;
            _text.value = null;
        };

        return { root, editing, submit, text, onBlur };
    },
});
</script>

<template>
    <span
        v-if="!editing"
        @click="editing = true"
    >
        {{ text }}
    </span>
    <input ref="root" v-if="editing" v-model="text" @blur="onBlur" @keypress.enter="submit" />
</template>

<style lang="scss" scoped>
    * {
        display: inline-block;
        width: calc(100% - 1em);
        padding: 0.2em;
        border-radius: 3px;
    }

    span:hover {
        background: #e9ebec;
    }

    input {
        font-family: inherit;
        border: 1px solid lightgray;
        font-size: 1em;
        width: calc(100% - 1em);
        outline: none;
    }
</style>