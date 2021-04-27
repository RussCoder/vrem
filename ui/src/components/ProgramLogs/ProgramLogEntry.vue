<script lang="ts">
import { defineComponent, inject, PropType } from "vue";
import { programLogsTypesKey } from "@/constants";
import { ProgramLogEntry } from "@backend/data_utils";

export default defineComponent({
    props: {
        entry: {
            type: Object as PropType<ProgramLogEntry>,
            required: true,
        }
    },
    setup(props) {
        const programLogTypes = inject(programLogsTypesKey);
        if (!programLogTypes) throw new Error('ProgramLogTypes are required!');
        const isSpecial = programLogTypes.value.program !== props.entry.type;

        return {
            isSpecial,
            formattedDate() {
                const date = new Date(props.entry.timestamp);
                return date.toLocaleDateString("ru") + " " + date.toLocaleTimeString("ru");
            },

            text() {
                //console.log(props.entry.type, programLogTypes.begin);
                switch (props.entry.type) {
                    case programLogTypes.value.begin:
                        return 'begin';
                    case programLogTypes.value.end:
                        return 'end';
                    case programLogTypes.value.idle:
                        return 'idle';
                    default:
                        return props.entry.description || props.entry.path;
                }
            },
        };
    },
});
</script>

<template>
    <div class="log_entry">
        <div class="time">{{ formattedDate() }}</div>
        <div :class="{ description: true, special: isSpecial }">{{ text() }}</div>
    </div>
</template>

<style scoped>
    .log_entry {
        margin: 1em 0;
        display: flex;
    }

    .time {
        margin-right: 1em;
        color: brown;
        white-space: nowrap;
    }

    .special {
        font-weight: bold;
        color: orange;
    }
</style>