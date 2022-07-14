const winston = require('winston');
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console()
    ]
});

// logger.info('alone or in pairs,');
// logger.info('and over your neighbors dog?');
// logger.warn('Whats great for a snack,');
// logger.info('And fits on your back?');
// logger.error('Its log, log, log');

const LOG_LEVEL = {
    Debug   : 1,
    Info    : 2,
    Warning : 4,
    Error   : 8
}

const logData = (data, level = LOG_LEVEL.Info)=> {
    switch(level) {
        case LOG_LEVEL.Error: logger.error(data); break;
        case LOG_LEVEL.Warn: logger.warn(data); break;
        default: logger.info(data); 
    }
}

const logInfo = (data)=>{
    logger.info(data);
}

const logError = (data)=>{
    logger.error(data);
}

module.exports = {  LOG_LEVEL, logData, logInfo, logError };
