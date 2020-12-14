import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router';
import LogList from './components/LogList/LogList.vue';
import TheReport from './components/TheReport.vue';


const router = createRouter({
    history: createWebHistory(),
    linkActiveClass: 'active',
    routes: [{
        path: '/',
        component: LogList,
    }, {
        path: '/report',
        component: TheReport,
    }],
})

createApp(App).use(router).mount('#app')
