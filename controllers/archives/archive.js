const Archive = require('../../models/archives/archive.model');
const Role = require('../../models/users/role.model');
const User = require('../../models/users/user.model');
const fs = require('fs');
const path = require('path');

exports.getOne = (req, res, next) => {
  Archive.findById(req.params.id)
    .then(archive => {
      if (!archive) return res.status(404).json({ error: 'Archive introuvable' });
      res.status(200).json(archive);
    })
    .catch(error => res.status(500).json({ error }));
};

/**
 * PUT /api/stuff/archives/:id
 * Modifie les champs éditables d'une archive (designation, description, tags).
 */
exports.modify = (req, res) => {
  const setFields = {};
  if (req.body.designation !== undefined) setFields.designation = req.body.designation;
  if (req.body.description !== undefined) setFields.description = req.body.description;
  if (req.body.tags       !== undefined) setFields.tags        = req.body.tags;

  // Rattachement / détachement d'un dossier physique
  // record: null  → détache   record: "<id>" → attache
  if (req.body.record !== undefined) {
    setFields.record = req.body.record || null;
  }

  Archive.findByIdAndUpdate(
    req.params.id,
    { $set: setFields },
    { new: true, runValidators: false }
  )
    .then(archive => {
      if (!archive) return res.status(404).json({ error: 'Archive introuvable' });
      res.status(200).json(archive);
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({ error: 'Une erreur est survenue' });
    });
};

/**
 * DELETE /api/stuff/archives/:id
 * Supprime une archive et tente d'effacer le fichier associé.
 */
exports.delete = (req, res) => {
  Archive.findByIdAndDelete(req.params.id)
    .then(archive => {
      if (!archive) return res.status(404).json({ error: 'Archive introuvable' });
      if (archive.fileUrl) {
        const mainDir = path.dirname(require.main.filename);
        try { fs.unlinkSync(path.join(mainDir, archive.fileUrl)); }
        catch (e) { console.log('File deletion warning:', e.message); }
      }
      res.status(200).json({ message: 'Archive supprimée' });
    })
    .catch(error => {
      console.log(error);
      res.status(500).json({ error: 'Une erreur est survenue' });
    });
};

exports.getStruct = (req, res, next) => {
  User.findOne({ _id: JSON.parse(req.params.struct)["userId"] })
    .then(user => {
      Role.findOne({ name: JSON.parse(req.params.struct)["structName"] })
        .then(role => {
          if(!role){
            return res.status(400).json({childs: [], docTypes: []});
          }
          if(user.grade["role"] === role["name"]){
            return res.status(200).json({childs: role["childs"], docTypes: role["docTypes"]});
          }
          let parent = role["parent"];
          (async () => {
            while(user.grade["role"] !== parent){
              if(!parent){
                return res.status(401).json({ error: Error("L'utilisateur n'a pas le droit d'accès à la archive")});
              }
              let role = await Role.findOne({ name: parent })
              if(!role){
                return res.status(404).json({childs: [], docTypes: []});
              }
              parent = role["parent"];
            }
            return res.status(200).json({childs: role["childs"], docTypes: role["docTypes"]});
          })();
        })
        .catch(error => res.status(404).json({ error }));
    })
    .catch(error => res.status(404).json({ error }));
};