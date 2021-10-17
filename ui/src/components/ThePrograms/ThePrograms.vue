<script lang="ts">
import { defineComponent } from "vue";
import { rpc } from '@/api';
import { makeDurationString } from "@backend/utils";
import { DbProgram } from "@backend/program";

export default defineComponent({
    data() {
        return {
            programs: [] as DbProgram[],
        };
    },

    created() {
        this.loadPrograms();
    },

    methods: {
        makeDurationString,
        async loadPrograms() {
            this.programs = await rpc.getAllPrograms();
        },
    }
})
</script>

<template>
    <div>
        <h2>The Programs</h2>
        <table v-if="programs.length" class="programs_table">
            <tr>
                <th>ID</th>
                <th class="description">Description</th>
                <th class="path">Path</th>
            </tr>
            <tr v-for="program in programs" :key="program.id">
                <td>{{ program.id }}</td>
                <td>
                    {{ program.description }}
                    <span v-if="!program.description" class="no_description">no description</span>
                </td>
                <td class="path_cell">{{ program.path }}</td>
            </tr>
        </table>
    </div>
</template>

<style lang="scss" scoped>
    .programs_table {
        border-collapse: separate;
        border-spacing: 0 0.5em;

        th:nth-child(1) {
            min-width: 4em;
        }

        th.description {
            min-width: 20em;
        }

        .path_cell {
            text-overflow: ellipsis;
        }

        td, th {
            padding: 0.5em;
            text-align: left;
        }

        tr:first-child {
            background: lightblue;
        }

        tr:nth-child(2n) {
            background: aliceblue;
        }

        .no_description {
            font-style: italic;
            color: darkorange;
        }
    }
</style>