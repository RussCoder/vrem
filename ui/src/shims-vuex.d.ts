import { Store } from 'vuex'
import { GettersType, State } from "./store";

declare module '@vue/runtime-core' {
    interface ComponentCustomProperties {
        $store: Omit<Store<State>, 'getters'> & { getters: GettersType }
    }
}