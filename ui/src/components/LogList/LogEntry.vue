<template>
    <div class="log_entry">
        <div class="time">{{ formattedDate }}</div>
        <div class="description">{{ text }}</div>
    </div>
</template>

<script>
export default {
    props: {
        entry: Object,
    },
    created() {
        //console.log({ ...this.entry });
    },
    computed: {
        formattedDate() {
            const date = new Date(this.entry.timestamp);
            return date.toLocaleDateString("ru") + " " + date.toLocaleTimeString("ru");
        },

        text() {
            if (this.entry.begin) return "begin";
            if (this.entry.end) return "end";
            if (this.entry.idle) return 'idle';
            return this.entry.description || this.entry.path;
        },
    },
};
</script>

<style scoped>
    .log_entry {
        margin: 1em 0;
        border-bottom: 1px solid gray;
        display: flex;
    }

    .time {
        margin-right: 1em;
    }
</style>