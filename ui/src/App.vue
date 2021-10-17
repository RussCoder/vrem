<script>
import CurrentTask from "@/components/CurrentTask";
import CurrentProgram from "@/components/CurrentProgram";
import NoConnectionMessage from "@/components/NoConnectionMessage";
import { NMessageProvider } from "naive-ui";

export default {
    name: "App",
    components: { CurrentTask, CurrentProgram, NoConnectionMessage, NMessageProvider },
};
</script>

<template>
    <NoConnectionMessage v-if="$store.getters.hasConnectionWithServer === false" />
    <header class="header">
        <span class="logo">Vrem</span>
        <div class="current_state">
            <CurrentTask />
            <CurrentProgram />
        </div>
    </header>
    <nav>
        <RouterLink class="nav_button" to="/">Task Logs</RouterLink>
        <RouterLink class="nav_button" to="/program-logs">Program Logs</RouterLink>
        <RouterLink class="nav_button" to="/report">Report</RouterLink>
        <RouterLink class="nav_button" to="/programs">Programs</RouterLink>
    </nav>
    <div class="content">
        <NMessageProvider placement="bottom-left">
            <RouterView />
        </NMessageProvider>
    </div>
</template>

<style lang="scss" scoped>
    nav {
        display: flex;
        flex-direction: column;
        font-size: 24px;
        padding: 1em 1em 0 1em;
        height: 100%;
        width: 9em;
        box-sizing: border-box;

        .nav_button {
            margin: 0.5em 0;
            text-decoration: none;
            color: inherit;
            display: inline-block;
            padding: 0.3em 10px;
            box-sizing: border-box;
            white-space: nowrap;
            --active-color: #032da0;

            &:hover {
                color: var(--active-color);
            }

            &.active {
                border-left: 5px solid;
                color: var(--active-color);
                border-color: var(--active-color);
                padding-right: 6px;
            }
        }
    }

    .header {
        margin: 0;
        padding: 0.5em 1em 1.5em 1em;
        font-size: 16px;
        grid-column: 1 / -1;
        display: flex;
        align-items: center;

        .current_state {
            display: flex;
        }

        .logo {
            font-size: 48px;
            color: darkgreen;
            font-weight: bold;
            margin-right: 2em;
        }
    }

    .content {
        font-size: 16px;
        padding: 2em 2rem 2rem 3em;
        overflow: auto;
        height: 100%;
        box-sizing: border-box;
        background: white;
        box-shadow: inset 0 0 2px 0 gray;
        border-radius: 1em 0 0 0;
    }
</style>

<style>
    html,
    body {
        padding: 0;
        margin: 0;
        font-size: 10px;
        font-family: v-sans, Arial, sans-serif;
    }

    #app {
        display: grid;
        grid-template-columns: auto 1fr;
        grid-template-rows: auto 1fr;
        height: 100vh;
        margin: 0;
        box-sizing: border-box;
        background-color: rgba(224, 241, 248, 0.22);
    }
</style>
