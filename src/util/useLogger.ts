/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See LICENSE.md in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface ILogFn {
    (message?: any, ...optionalParams: any[]): void;
}

export interface ILogger {
    log: ILogFn;
    warn: ILogFn;
    error: ILogFn;
    info: ILogFn;
    trackSession: (properties?: LogProperties) => void;
    trackError: (error: Error) => void;
    trackEvent: (eventName: string, properties?: LogProperties) => void;
    trackView: (viewName: string, properties?: LogProperties) => void;
    trackMetric: (metricName: string, properties?: LogProperties) => void;
    trackDependency: (dependencyName: string, properties?: LogProperties) => void;
}

export type LogLevel = "log" | "warn" | "error" | "info";
type LogProperties = Record<string, any>;

export const useLogger = (): ILogger => {
    const logFn = (
        level: LogLevel,
        consoleFn: typeof console.log | typeof console.warn | typeof console.error | typeof console.info,
        prefix: string
    ) => {
        return (...args: any[]) => {
            if (!level || level === "log" || level === "warn" || level === "error" || level === "info") {
                consoleFn(`${prefix}`, ...args);
            }
        };
    };

    const stringifyProperties = (properties?: LogProperties): string => {
        return properties ? JSON.stringify(properties) : "";
    };

    const logEvent =
        (level: LogLevel, prefix: string) =>
        (...args: any[]) => {
            const consoleFn = console[level] as
                | typeof console.log
                | typeof console.warn
                | typeof console.error
                | typeof console.info;
            const properties = stringifyProperties(args[0]);
            logFn(level, consoleFn, prefix)(properties);
        };

    const trackSession = (properties?: LogProperties): void => {
        logEvent("log", "Session started.")(properties);
    };

    const trackError = (error: Error): void => {
        logEvent("error", "ERROR:")(error?.message);
    };

    const trackEvent = (eventName: string, properties?: LogProperties): void => {
        logEvent("info", `${eventName}`)(properties);
    };

    const trackView = (viewName: string, properties?: LogProperties): void => {
        logEvent("info", `View: ${viewName}`)(properties);
    };

    const trackMetric = (metricName: string, properties?: LogProperties): void => {
        logEvent("info", `Metric: ${metricName}`)(properties);
    };

    const trackDependency = (dependencyName: string, properties?: LogProperties): void => {
        logEvent("info", `Invoking dependency: ${dependencyName}`)(properties);
    };

    return {
        log: logEvent("log", "LOG:"),
        warn: logEvent("warn", "WARN:"),
        error: logEvent("error", "ERROR:"),
        info: logEvent("info", "INFO:"),
        trackSession,
        trackError,
        trackEvent,
        trackView,
        trackMetric,
        trackDependency,
    };
};
