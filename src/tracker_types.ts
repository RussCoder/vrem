export interface SubprogramJson {
    path: string | null,
    timestamp: number,
    description?: string | null,
}

export interface Subprogram extends SubprogramJson {
    parent: Program,
}

export interface Program {
    timestamp: number,
    path: string,
    description: string,
}

export interface LogEntryData extends Partial<Subprogram> {
    begin?: boolean,
    end?: boolean,
    idle?: boolean,
}

export function isSubprogram(p: Program | Subprogram | null): p is Subprogram {
    return !!(p && (p as Subprogram).parent);
}