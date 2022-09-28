const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET');
        const userId = decodedToken.user._id;
        const user = decodedToken.user;

        if(req.body.userId && req.body.userId !== userId){
            throw 'Invalid user id';
        }else{
            res.locals.user = user;
            res.locals.userId = userId;
            req.userId = decodedToken.user._id;
            next();
        }
    } catch {
        res.status(401).json({ error: new Error('Invalid request') });
    }
};