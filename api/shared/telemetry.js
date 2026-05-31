function logInfo(context, event, properties = {}) {
    context.log({
        severity: "Information",
        event,
        properties,
    });
}

function logWarn(context, event, properties = {}) {
    context.log.warn({
        severity: "Warning",
        event,
        properties,
    });
}

function logError(context, event, error, properties = {}) {
    context.log.error({
        severity: "Error",
        event,
        properties,
        errorMessage: error?.message || String(error),
        stack: error?.stack || "",
    });
}

module.exports = {
    logInfo,
    logWarn,
    logError,
};
