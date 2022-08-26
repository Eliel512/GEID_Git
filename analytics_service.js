const RequestLog = require('./models/request_log');
    
module.exports = {
    getAnalytics() {
        let getTotalRequests = RequestLog.count();
        let getStatsPerRoute = RequestLog.aggregate([
            {
                $group: {
                    _id: {url: '$url', method: '$method'},
                    responseTime: {$avg: '$response_time'},
                    numberOfRequests: {$sum: 1},
                }
            }
        ]);

        let getRequestsPerDay = RequestLog.aggregate([
            {
                $group: {
                    _id: '$day',
                    numberOfRequests: {$sum: 1}
                }
            },
            { $sort: {numberOfRequests: 1} }
        ]);

        let getRequestsPerHour = RequestLog.aggregate([
            {
                $group: {
                    _id: '$hour',
                    numberOfRequests: {$sum: 1}
                }
            },
            {$sort: {numberOfRequests: 1}}
        ]);

        let getAverageResponseTime = RequestLog.aggregate([
            {
                $group: {
                    _id: null,
                    averageResponseTime: {$avg: '$responseTime'}
                }
            }
        ]);

        return Promise.all([
            getAverageResponseTime,
            getStatsPerRoute,
            getRequestsPerDay,
            getRequestsPerHour,
            getTotalRequests
        ]).then(results  => {
            return {
                averageResponseTime: results[0][0].averageResponseTime,
                statsPerRoute: results [1],
                requestsPerDay: results[2],
                requestsPerHour: results[3],
                totalRequests: results[4],
            };
        })
    }
};
