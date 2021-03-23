BEGIN IMMEDIATE;

CREATE TABLE "Tags" (
	"id" INTEGER PRIMARY KEY,
	"name" TEXT NOT NULL,
);
CREATE UNIQUE INDEX name ON Tags(name);

CREATE TABLE "Tasks" (
	"id" INTEGER PRIMARY KEY,
	"name" TEXT NOT NULL
);

CREATE TABLE "TaskTags" (
	"taskId" INTEGER NOT NULL,
	"tagId" INTEGER NOT NULL,
	UNIQUE("taskId","tagId")
);

CREATE TABLE "CurrentTask" (
	"id" INTEGER PRIMARY KEY,
	"taskId" INTEGER NOT NULL REFERENCES Tasks(id),
	"startTime" INTEGER NOT NULL
);

CREATE TABLE "TaskLogs" (
	"id" INTEGER PRIMARY KEY,
	"taskId" INTEGER NOT NULL REFERENCES Tasks(id),
	"startTime" INTEGER NOT NULL,
	"endTime" INTEGER NOT NULL
);
CREATE INDEX startTime ON TaskLogs(startTime);

CREATE TABLE Programs (
	"id" INTEGER PRIMARY KEY,
	"path" TEXT NOT NULL,
	"description" TEXT NOT NULL DEFAULT ""
);
CREATE INDEX path ON Programs(path);

CREATE TABLE ProgramLogTypes (
	"id" INTEGER PRIMARY KEY,
    "type" TEXT NOT NULL
);
INSERT INTO ProgramLogTypes (id, type) VALUES
    (0, "program"),
    (1, "begin"),
    (2, "end"),
    (3, "idle");

CREATE TABLE ProgramLogs (
	"timestamp" INTEGER PRIMARY KEY,
	"type" INTEGER NOT NULL DEFAULT 0 REFERENCES ProgramLogTypes(id),
	"programId" INTEGER REFERENCES Programs(id)
);

PRAGMA user_version = 1;

COMMIT;