const Event = require('../../models/archives/event.model');
const User = require('../../models/users/user.model');

module.exports = async (req, res, next) => {
    let userRole;
    try {
        userRole = User.findOne({ _id: res.locals.userId }, { 'grade.role': 1 }).grade.role;
    } catch (error) {
        console.log(error);
        return res.status(500).json({ message: 'Une erreur est survenue' });
    }    
    Event.find({ administrativeUnits: userRole })
        .then(events => {
            res.status(200).json(events);
        })
        .catch(error => {
            console.log(error);
            res.status(500).json({ message: 'Une erreur est survenue' });
        });
};