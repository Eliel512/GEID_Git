const User = require('../models/user');

exports.add = (req, res, next) => {
    User.updateOne({ _id: req.body.userId }, {$set: {'grade.permission': req.body.permissions}})
      .then(() => {
          res.status(200).json({ message: 'Succès!' })
      })
      .catch(error => {
          console.log(error);
          res.status(400).json({ error })
        });
}