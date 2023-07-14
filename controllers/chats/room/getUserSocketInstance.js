const serverStore = require('../../../serverStore');

module.exports = (req, res) => {
    try{
        const userDetails = serverStore.getUserSocketInstance(res.locals.userId).socket;
        res.status(200).send(`${userDetails}`);
    }catch(err){
        console.log(err);
        res.status(500).json(err);
    }
};