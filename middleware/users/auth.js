const jwt = require('jsonwebtoken');
const serverStore = require('../../serverStore');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1];
        const decodedToken = jwt.verify(token, process.env.TOKEN_KEY);
        const userId = decodedToken._id;        

        /*if(req.body.userId && req.body.userId !== userId){
            throw 'Invalid user id';
        }else{*/
        res.locals.userId = userId;
        req.userId = userId;
        next();
        //}
    } catch {
        if (/^\/room\/call\/[a-zA-Z0-9]{9}$/.test(req.path)) {
            next();
        }else{
            res.status(401).json({ error: new Error('Invalid request') });
        }
    }
};