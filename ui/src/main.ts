import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router';
import ProgramLogList from './components/ProgramLogs/ProgramLogList.vue';
import TheReport from './components/TheReport/TheReport.vue';
import TaskLogs from "@/components/TaskLogs/TaskLogs.vue";
import store from "@/store";
import ThePrograms from "@/components/ThePrograms/ThePrograms.vue";
//import 'element-plus/lib/theme-chalk/index.css';

const router = createRouter({
    history: createWebHistory(),
    linkActiveClass: 'active',
    routes: [{
        path: '/',
        component: TaskLogs,
    }, {
        path: '/program-logs',
        component: ProgramLogList,
    }, {
        path: '/report',
        component: TheReport,
    }, {
        path: '/programs',
        component: ThePrograms,
    }],
});

createApp(App)
    .use(router)
    .use(store)
    .mount('#app');
