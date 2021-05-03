# Vrem

## About / О проекте

**Vrem** is an open-source automatic/manual time-tracker. Its name originates
from a Russian word _"время" (vremya)_ which means "time". It's shortened to
only 4 symbols for brevity which is handy in case of CLI utilities. Right now
Vrem has both a command-line interface and a basic UI and works **only on
Windows.**

______________

**Vrem** - это программа для автоматического учета времени использования
приложений на компьютере, так называемый "тайм-трекер". Название программы - это
сокращенное интернационализированное слово "время". В данный момент с программой
можно работать как с утилитой командной строки, так и через графический
пользовательский интерфейс. Пока что Vrem работает **только на Windows.**

## Installation

> IMPORTANT: It works only on Windows with Node.js 12+ and
> contains a prebuilt binary for Windows x64.

> In case of another architecture (x32), compilation will be needed.
> Read in the [node-gyp's README](https://github.com/nodejs/node-gyp#readme) what tools
> are required to compile a C++ program.

To install Vrem run:

```
npm i -g vrem
```

Note that if you update the package, **its auto-tracking process stops**, and
you have to relaunch it manually via `vrem on`.

## Usage

Vrem adds one global executable `vrem`. It has the following commands:

- `vrem help` - show all available commands.
- `vrem on` - start the auto-tracking process.
- `vrem off` - stop the auto-tracking process.
- `vrem ui` - start the UI server if required and open the UI in the browser.
- `vrem server on` - start the UI server.
- `vrem server off` - stop the UI server.
- `vrem start <task_name>` - start a manual task.
- `vrem stop` - stop the current manual task.
- `vrem report` - show the statistics of apps usage (general and within each
  manual task). Without arguments it shows the statistics for today. But you can
  specify the dates:
  - `vrem report 2020-09-01` - to show the report for a specific date
  - `vrem report --from 2020-09-01 --to 2020-09-10` - to show the report for a
    period.
- `vrem status` - check the current task and wether server and tracker processes
  are running.

Also, you can get help message for each command, e.g. `vrem help report`.

Once you installed Vrem, run `vrem on`.  
Then open different windows (focus on each window not less than 1 second).  
Then run `vrem report` to see the statistics.  
There is so called "idle time" in the report. The period of idleness begins
after 90 seconds since the last mouse movement or key press.

It's up to you how to add Vrem to system startup.

Vrem keeps all its logs in the folder `C:\Users\<UserName>\.vrem`, or you can
get the exact path via

```cmd
node -e "console.log(require('path').resolve(require('os').userInfo().homedir, '.vrem'))"
```

However, it's recommended not to change the database manually (since in case of
its lock, the tracking process will crash). It better to copy the database file
and then study its copy.

## License (Unlicense) / Лицензия (Нелицензия)

This is free and unencumbered software released into the public domain. Read
more on https://unlicense.org/ or in the [LICENSE file](LICENSE).

<hr>

Данный проект является свободным программным обеспечением и общественным
достоянием. Читайте подробнее на https://unlicense.org/ или
в [файле лицензии](LICENSE).