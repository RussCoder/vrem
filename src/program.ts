import db from './db';

export interface DbProgram {
    id: number,
    path: string,
    description: string,
    parentId: number | null,
}

export function getAllPrograms(): DbProgram[] {
    return db.prepare(
        `SELECT id, path, description, parentId FROM Programs;`
    ).all();
}