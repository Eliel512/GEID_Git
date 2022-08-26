let mongoose = require('mongoose');

const archiveDB = mongoose.connection.useDb('archives');

let RequestLog = archiveDB.model('RequestLog', {
    url: String,
    method: String,
    responseTime: Number,
    day: String,
    hour: Number
});

module.exports = RequestLog;
