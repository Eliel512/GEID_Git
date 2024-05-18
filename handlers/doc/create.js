const LifeLog = require('../../models/log/lifecycle.model');
const EventLog = require('../../models/log/eventlog.model');
const fs = require('fs');
const path = require('path');

module.exports = doc => {
    const mainDir = path.dirname(require.main.filename);
    const file = path.join(mainDir, doc.contentUrl);
    try{
        const stats = fs.statSync(file);
        const newRegistration = new LifeLog({
            doc: doc._id,
            format: doc.format,
            size: stats.size
        });
        newRegistration.save()
            .then(() => {
                const createEvent = new EventLog({
                    doc: doc._id,
                    author: doc.author,
                    event: 'create',
                    completed: true
                });
                createEvent.save()
                    .then(() => {
                        console.log('correa');
                    })
                    .catch(error => {
                        console.log(error);
                    })
            })
            .catch(error => {
                console.log(error);
            });
    }catch(error){
        console.log(error);
    }
};