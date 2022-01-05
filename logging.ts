/*
Simple logger for typescript

Credit to Adrian Hall: https://adrianhall.github.io/cloud/2019/06/30/building-an-efficient-logger-in-typescript/

Usage:
    import { logging } from 'logging'
    logging.configure().registerConsoleLogger()
    const logger = logging.getLogger('obsidian-twitter-embeds.main')
*/
import { EventEmitter } from 'events';

export type LogEntryFormatter = (entry: LogEntry) => string

export class LogManager extends EventEmitter {
    private options: LogOptions = {
        minLevels: {
            '': 'info'
        }
    }

    private entryFormatter: LogEntryFormatter = ((entry: LogEntry) => {
        return `[${entry.module}] ${entry.level.toUpperCase()}: ${entry.message}`
    })


    private consoleLoggerRegistered = false

    public configure(options?: LogOptions, formatter?: LogEntryFormatter): LogManager {
        this.options = Object.assign({}, this.options, options)
        this.entryFormatter = formatter ?? this.entryFormatter
        return this
    }

    public getLogger(_module: string): Logger {
        let minLevel = 'none'
        let match = ''

        for (const key in this.options.minLevels) {
            if (_module.startsWith(key) && key.length >= match.length) {
                minLevel = this.options.minLevels[key]
                match = key
            }
        }

        return new Logger(this, _module, minLevel)
    }

    public onLogEntry(listener: (logEntry: LogEntry) => void): LogManager {
        this.on('log', listener)
        return this
    }

    public registerConsoleLogger(): LogManager {
        if (this.consoleLoggerRegistered) {
            return this
        }

        this.onLogEntry((logEntry: LogEntry) => {
            const msg = this.entryFormatter(logEntry)
            switch (logEntry.level) {
                case 'trace':
                    console.trace(msg)
                    break
                case 'debug':
                    console.debug(msg)
                    break
                case 'info':
                    console.info(msg)
                    break
                case 'warn':
                    console.warn(msg)
                    break
                case 'error':
                    console.error(msg)
                    break
                default:
                    console.log(`{${logEntry.level}} ${msg}`)
            }
        })

        this.consoleLoggerRegistered = true
        return this
    }
}

export interface LogEntry {
    level: string;
    module: string;
    location?: string;
    message: string;
}

export interface LogOptions {
    minLevels: { [module: string]: string }
}

export const logging = new LogManager();

export class Logger {
    private logManager: LogManager
    private minLevel: number
    private module: string
    private readonly levels: { [key: string]: number } = {
        'trace': 1,
        'debug': 2,
        'info': 3,
        'warn': 4,
        'error': 5
    }

    constructor(logManager: LogManager, _module: string, minLevel: string) {
        this.logManager = logManager
        this.module = _module
        this.minLevel = this.levelToInt(minLevel)
    }

    private levelToInt(minLevel: string): number {
        if (minLevel.toLowerCase() in this.levels) {
            return this.levels[minLevel.toLowerCase()]
        }
        return 99
    }


    public log(logLevel: string, message: string): void {
        const level = this.levelToInt(logLevel)
        if (level < this.minLevel) {
            return
        }

        const logEntry: LogEntry = { level: logLevel, module: this.module, message };

        // Obtain the line/file
        const error = new Error("");
        if (error.stack) {
            const cla = error.stack.split("\n");
            let idx = 1;
            while (idx < cla.length && cla[idx].includes("at Logger.Object.")) idx++;
            if (idx < cla.length) {
                logEntry.location = cla[idx].slice(cla[idx].indexOf("at ") + 3, cla[idx].length);
            }
        }

        this.logManager.emit('log', logEntry);
    }

    public trace(message: string): void { this.log('trace', message); }
    public debug(message: string): void { this.log('debug', message); }
    public info(message: string): void  { this.log('info', message); }
    public warn(message: string): void  { this.log('warn', message); }
    public error(message: string): void { this.log('error', message); }


}
