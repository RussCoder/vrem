<script>
export default {
    name: "App",
};
</script>

<template>
    <div class="header">
        <span class="logo">Vrem</span>
        <RouterLink class="nav_button" to="/">Log</RouterLink>
        <RouterLink class="nav_button" to="/report">Report</RouterLink>
    </div>
    <div class="content">
        <RouterView />
    </div>
</template>

<style lang="scss" scoped>
    .nav_button {
        margin: 0 1em;
        font-size: 1.5em;
        text-decoration: none;
        color: darkblue;
        display: inline-block;

        &.active {
            font-weight: bold;
            border-bottom: 2px solid;
        }
    }

    .header {
        margin: 0;
        padding: 0.5em 1em 1.5em 1em;
        box-shadow: 0 2px 3px 0 gray;
        font-size: 16px;
    }

    .logo {
        font-size: 48px;
        color: darkgreen;
        font-weight: bold;
        margin-right: 2em;
    }

    .content {
        font-size: 1.6rem;
        padding: 2rem;
    }
</style>

<style>
    html,
    body {
        padding: 0;
        margin: 0;
        font-size: 10px;
    }
</style>
