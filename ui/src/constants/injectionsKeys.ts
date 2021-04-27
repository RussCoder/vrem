import { InjectionKey, ComputedRef } from "vue";
import { ProgramLogTypes } from "@backend/data_utils";

export const programLogsTypesKey: InjectionKey<ComputedRef<ProgramLogTypes>> = Symbol('programLogTypes');