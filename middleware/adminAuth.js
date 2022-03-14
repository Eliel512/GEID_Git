const User = require('../models/user');

module.exports = (req, res, next) => {
    const userId = res.locals.userId;
    (async () => {
        const { permission } = await User.findOne(
            {_id: userId},
            {"grade.permission": 1, _id:0}
            ).grade;
        if(permission.find(el => el === 'admin')){
            next();
        }else{
            res.status(401).json({ message: 'Non authorisé' })
        }
    })();
};