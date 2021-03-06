const { Frozen, bookFrozen, imageFrozen, filmFrozen, ressourceFrozen } = require('../models/frozen');
const User = require('../models/user.js');
const getHost = require('./getHost').getHost();

const path = {
    'ressource': 'archives',
    'book': 'mediatheque/bibliotheque',
    'image': 'mediatheque/phototheque',
    'film': 'mediatheque/filmotheque'
};
const getKeyByValue = (object, value) => {
    if(value == 'mediatheque') throw 'Valeur invalide';
    return Object.keys(object).find(key => object[key].match(value));
}

exports.addOne = (req, res, next) => {
    const { userId, datas, where } = req.body;
    const filename = where.split('/')[1];
    const public = datas.public ? 'public' : false;
    delete datas._id;
    delete datas.public;

    User.findOne({ _id: userId })
      .then(user => {
        let frozen;
        switch(datas.frozenType){
            case 'book':
                frozen = new bookFrozen({
                    ...datas,
                    createdBy: {
                        id: userId,
                        role: user['grade'].role
                    },
                    userId: userId,
                    contentUrl: `${req.protocol}://${getHost}/ressources/${path[datas.frozenType]}/${filename}`,
                    fileUrl: `${req.protocol}://${getHost}/workspace/${userId}/${where}`
                });
            break;
            case 'film':
                frozen = new filmFrozen({
                    ...datas,
                    createdBy: {
                        id: userId,
                        role: user['grade'].role
                    },
                    userId: userId,
                    contentUrl: `${req.protocol}://${getHost}/ressources/${path[datas.frozenType]}/${filename}`,
                    fileUrl: `${req.protocol}://${getHost}/workspace/${userId}/${where}`
                });
            break;
            case 'image':
                frozen = new imageFrozen({
                    ...datas,
                    createdBy: {
                        id: userId,
                        role: user['grade'].role
                    },
                    userId: userId,
                    contentUrl: `${req.protocol}://${getHost}/ressources/${path[datas.frozenType]}/${filename}`,
                    fileUrl: `${req.protocol}://${getHost}/workspace/${userId}/${where}`
                });
            break;
            case 'ressource':
                frozen = new ressourceFrozen({
                    ...datas,
                    createdBy: {
                        id: userId,
                        role: public || user['grade'].role
                    },
                    userId: userId,
                    contentUrl: `${req.protocol}://${getHost}/ressources/archives/${filename}`,
                    fileUrl: `${req.protocol}://${getHost}/workspace/${userId}/${where}`
                });
            break;
            default:
                return res.status(400).json({ message: 'Type incorrect' })
        }
        frozen.save()
          .then(() => {
            res.status(201).json({ message: 'Fichier envoy?? avec succ??s!' })
          })
          .catch(error => {
              console.log(error);
              res.status(400).json({ error })
          })
      })
      .catch(error => {
          console.log(error);
          res.status(400).json({ error });
      })
}

exports.getAllForOne = (req, res, next) => {
    const userId = JSON.parse(req.params.datas)['userId'];
    const where = JSON.parse(req.params.datas)['where'];
    let type;
    try{
        type = getKeyByValue(path, where);
        User.findOne({ _id: userId })
          .then(user => {
              if(user.grade["permission"].find(el => el === where)){
                  Frozen.find({ frozenType: type }, {createdAt: 0, kind: 0, frozenType: 0, userId: 0, contentUrl: 0, __v: 0})
                    .then(frozens => res.status(200).json(frozens))
                    .catch(error => {
                        console.log(error);
                        res.status(400).json({ error })
                    })
              }else{
                  res.status(401).json({ message: 'Non authoris??' })
              }
          })
          .catch(error => {
              console.log(error);
              res.status(400).json({ error })
            });
    }catch(error){
        console.log(error);
        res.status(400).json({ error });
    }
}

exports.modify = (req, res, next) => {
    const { userId, datas, where } = req.body;

    User.findOne({ _id: userId })
      .then(user => {
        let type;
        let frozen;
        try{
            type = getKeyByValue(path, where);
            switch(type){
                case 'book':
                    frozen = new bookFrozen({
                        ...datas,
                        modifiedBy: {
                            id: userId,
                            role: user['grade'].role
                        }
                    });
                break;
                case 'film':
                    frozen = new filmFrozen({
                        ...datas,
                        modifiedBy: {
                            id: userId,
                            role: user['grade'].role
                        }
                    });
                break;
                case 'image':
                    frozen = new imageFrozen({
                        ...datas,
                        modifiedBy: {
                            id: userId,
                            role: user['grade'].role
                        }
                    });
                break;
                case 'ressource':
                    frozen = new ressourceFrozen({
                        ...datas,
                        modifiedBy: {
                            id: userId,
                            role: user['grade'].role
                        }
                    });
                break;
                default:
                    res.status(400).json({ message: 'Type incorrect' })
            }
            if(user.grade["permission"].find(el => el === where)){
                Frozen.updateOne({ _id: datas.id }, { ...frozen, _id: datas.id })
                  .then(() => res.status(200).json({ message: 'Document modifi?? avec succ??s!' }))
                  .catch(error => res.status(400).json({ error }));
            }else{
                res.status(401).json({ message: 'Non authoris??' })
            }
        }catch(error){
            res.status(400).json({ error });
        }
      })
      .catch(error => res.status(400).json({ error }))
}

exports.deleteOne = (req, res, next) => {
    const userId = JSON.parse(req.params.datas)["userId"];
    const frozenType = JSON.parse(req.params.datas)['frozenType'];
    const where = frozenType === 'ressource' ? 'archives' : path[frozenType].split('/')[1];
    User.findOne({ _id: userId })
      .then(user => {
        if(user.grade["permission"].find(el => el === where)){
            Frozen.deleteOne({ _id: JSON.parse(req.params.datas)["frozenId"], frozenType: frozenType })
              .then(count => res.status(200).json({ message: `${count.deletedCount} document(s) supprim??(s)` }))
              .catch(error => res.status(400).json({ error }));
        }
        else{
            res.status(401).json({ message: 'Non authoris??' })
        }
      })
      .catch(error => res.status(400).json({ error }));
}