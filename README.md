# Vrem

## About / О проекте

**Vrem** is an open-source automatic time-tracker. Its name originates from a
Russian word _"время" (vremya)_ which means "time". It's shortened to only 4
symbols for brevity which is handy in case of CLI utilities. Right now Vrem has
only a command-line interface and works only on Windows. 

______________

**Vrem** - это программа для автоматического учета времени использования 
приложений на компьютере, так называемый "тайм-трекер". Название программы - это
сокращенное интернационализированное слово "время". В данный момент программа 
представляет собой утилиту командной строки и работает только на Windows.

## Installation

> Important! It works only on Windows and requires a C++ compiler.
> Also you have to install `node-gyp` globally: `npm i -g node-gyp`.
> Read in the [node-gyp's README](https://github.com/nodejs/node-gyp#readme) what tools
> are required and how to install them.

Node.js 12 is recommended, but probably the 10th version also will do.

```
npm i -g vrem
```

Note that if you update the package, **its auto-tracking process stops** and you
have to relaunch it manually via `vrem start`.  

## Usage

Vrem adds one global executable `vrem`. It has the following commands:

- `vrem help` - show all available commands.
- `vrem start` - start the auto-tracking process.
- `vrem stop` - stop the auto-tracking process.
- `vrem report` - show the statistics of apps usage. Without arguments it shows
  the statistics for today. But you can specify the dates:
    - `vrem report 2020-09-01` - to show the report for a specific date
    - `vrem report --from 2020-09-01 --to 2020-09-10` - to show the report for a
      period.
- `vrem status` - check whether the auto-tracking process is running.

Also you can get help message for each command, e.g. `vrem help report`. 

Once you installed Vrem, run `vrem start`.  
Then open different windows (focus on each window not less than 1 second).  
Then run `vrem report` to see the statistics.  
There is so called "idle time" in the report. The period of idleness begins
after 90 seconds since the last mouse movement or key press.

Vrem keeps all its logs in the folder `C:\Users\<UserName>\.vrem`, or you can 
get the exact path via

```js
node -e "console.log(require('path').resolve(require('os').userInfo().homedir, '.vrem'))"
```