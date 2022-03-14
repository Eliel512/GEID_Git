const { Book } = require('../models/book');
const { bookFrozen } = require('../models/frozen');
const { User } = require('../models/user');
const getHost = require('./getHost').getHost();
const fs = require('fs');

exports.create = (req, res, next) => {
  const { userId, frozenId } = req.body;
  User.findOne({ _id: userId })
    .then(user => {
      if(user.grade["permission"].find(el => el === 'bibliotheque')){
        bookFrozen.findOneAndDelete({ _id: frozenId },{
          projection:{
            sendedAt:0, _id:0, __v:0, createdBy:0
          }
        })
          .then(frozen => {
            const fileUrl = frozen.fileUrl.split(`${getHost}`)[1];
            const contentUrl = '.' + frozen["contentUrl"].split(`${getHost}`)[1];
            delete frozen.frozenType;
            delete frozen.fileUrl;
            const book = new Book({
              ...frozen
            });
            Book.findOne({ contentUrl: book.contentUrl })
              .then(boook => {
                boook ?
                  res.status(400)
                  .json({
                     message: 'Le fichier envoyé est déjà enregistré sur le serveur.'
                    }) : book.save()
                          .then(() => {
                            fs.link(fileUrl,
                              contentUrl,
                              err => {
                                if(err){
                                    console.log(err);
                                    return res.status(500).json({ message: 'Erreur interne du serveur' });
                                }else{
                                  res.status(201).json({ message: 'Livre enregistré !' });
                                }
                              });
                          })
                          .catch(error => res.status(400).json({ error }));
              })
              .catch(error => res.status(500).json({ error }));
          })
          .catch(error => res.status(400).json({ error }));
      }else{
        return res.status(401).json({ message: 'Non authorisé' });
      }
    })
    .catch(error => res.status(400).json({ error }));
};

exports.getOne = (req, res, next) => {
  Book.findOne({
    _id: req.params.id.split('=')[1]
  }).then(
    (book) => {
      res.status(200).json(book);
    }
  ).catch(
    (error) => {
      res.status(404).json({
        error: error
      });
    }
  );
};

exports.modify = (req, res, next) => {
  const bookData = JSON.parse(req.body.book);
  const bookObject = req.file ?
  {
    ...bookData,
    contentUrl: `${req.protocol}://${getHost}/ressources/mediatheque/bibliotheque/${req.file.filename}`
  } : { ...bookData };
  const bookId = JSON.parse(req.params.path.split('=')[1])["id"];
  Book.findOneAndUpdate({ _id: bookId }, { ...bookObject, _id: bookId })
    .then(book => {
      if(!req.file){
        res.status(200).json({ message: 'Livre modifié !'});
      }else{
        const filename = book.contentUrl.split('/ressources/mediatheque/bibliotheque/')[1];
        fs.unlink(`ressources/mediatheque/bibliotheque/${filename}`, () => {
          res.status(200).json({ message: 'Livre modifié !'})
        });
      }

    })
    .catch(error => res.status(400).json({ error })); 
};

exports.delete = (req, res, next) => {
  Book.findOne({ _id: req.params.id.split('=')[1] })
    .then(book => {
      const filename = book.contentUrl.split('/ressources/mediatheque/bibliotheque/')[1];
      fs.unlink(`ressources/mediatheque/bibliotheque/${filename}`, () => {
        Book.deleteOne({ _id: req.params.id.split('=')[1] })
          .then(() => res.status(200).json({ message: 'Livre supprimé !'}))
          .catch(error => res.status(400).json({ error }));
      });
    })
    .catch(error => res.status(500).json({ error }));
};

exports.getAll = (req, res, next) => {
  Book.find({  }).then(
    (books) => {
      res.status(200).json(books);
    }
  ).catch(
    (error) => {
      res.status(400).json({
        error: error
      });
    }
  );
};

exports.deleteAll = (req, res, next) => {
  const count = 0;
  Book.find({  })
    .then(books => {
      books.length ? (() => {
        for(const book of books){
            const filename = book.contentUrl.split('/ressources/mediatheque/bibliotheque/')[1];
            fs.unlink(`ressources/mediatheque/bibliotheque/${filename}`, () => {
              count++
            });
        }
        count ? Book.deleteMany({  })
              .then(count => res.status(200).json({ message: `${count.deletedCount} données supprimées !`}))
              .catch(error => res.status(400).json({ error })) :
                res.status(500).json({ message: "fichiers non supprimés" });
      })() : res.status(200).json({ message: 'Vide.'});
    })
    .catch(error => res.status(500).json({ error }));
};