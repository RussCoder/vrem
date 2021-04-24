import colors from "./colors";
import db from "./db";
import migrate0 from "./migrations/migration0";

console.info(colors.yellow(`
Note that the auto-tracking process is stopped.
Run "${colors.green('vrem on')}" to launch it.
`));

migrate0(db); // it should be done in the db file, but if db is already created for some reason, we have to do it here