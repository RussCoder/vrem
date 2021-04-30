import colors from "../colors";
import constants from "../constants";
import db from "../db";
import migrate0 from "../migrations/migration0";
import { isProcessAlive } from "../process";

migrate0(db); // it should be done in the db file, but if db is already created for some reason, we have to do it here

async function check() {
    if (!(await isProcessAlive(constants.autoTrackerSocketPath))) {
        console.warn(colors.yellow(
            "The auto-tracking process is stopped.\n" +
            `Run "${colors.green('vrem on')}" to start it.`
        ));
    }

    if (!(await isProcessAlive(constants.serverSocketPath))) {
        console.warn(colors.yellow(
            "The server process is stopped.\n" +
            `Run "${colors.green('vrem server on')}" to start it.`
        ));
    }
}

void check();