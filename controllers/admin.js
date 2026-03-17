/**
 * controllers/admin.js — Contrôleurs pour l'administration des utilisateurs et rôles
 *
 * Ce module contient les contrôleurs pour la gestion administrative :
 * - CRUD des utilisateurs (création, lecture, modification)
 * - Gestion des permissions et des rôles
 * - Création des espaces de travail utilisateur
 * - Validation des hiérarchies de rôles
 */

const User = require("../models/users/user.model");
const Role = require("../models/users/role.model");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const _ = require("lodash");

/**
 * Crée la structure de dossiers pour un nouvel utilisateur
 * @param {import('express').Response} res - Response Express
 * @param {import('mongoose').Document} user - Document utilisateur
 */
const buildWorkspace = (res, user) => {
  const basePath = `./workspace/${user._id}`;

  // Crée les dossiers nécessaires pour l'espace de travail utilisateur
  const folders = ["images", "videos", "documents"];
  let currentFolder = 0;

  const createNextFolder = () => {
    if (currentFolder >= folders.length) {
      return res.status(201).json({
        message: "Inscription réussie!",
      });
    }

    const folderPath = `${basePath}/${folders[currentFolder]}`;
    fs.mkdir(folderPath, { recursive: true }, (err) => {
      if (err) {
        console.log(err);
        return res.status(500).json({ err });
      }
      currentFolder++;
      createNextFolder();
    });
  };

  createNextFolder();
};

/**
 * Récupère tous les utilisateurs (sans mots de passe ni champs sensibles)
 */
exports.getAllUsers = (req, res, next) => {
  User.find({}, { __v: 0, password: 0, _id: 0 })
    .then((users) => res.status(200).json(users))
    .catch((error) => {
      console.log(error);
      res.status(500).json({ message: 'Une erreur est survenue' });
    });
};

/**
 * Recherche des utilisateurs par propriété spécifique
 * @param {Object} req.params.datas - Contient props et value pour la recherche
 */
exports.getUsersByProps = (req, res, next) => {
  const { props, value } = req.params.datas;
  const query = {};
  query[props] = value;
  User.find(query, { __v: 0, password: 0 })
    .then((users) => res.status(200).json(users))
    .catch((error) => {
      console.log(error);
      res.status(400).json(error);
    });
};

/**
 * Récupère un utilisateur spécifique par son ID
 */
exports.getOneUser = (req, res, next) => {
  User.findOne({ _id: req.params.userId }, { __v: 0, password: 0 })
    .then((user) => res.status(200).json(user))
    .catch(() => res.status(404).json({ message: "Utilisateur introuvable" }));
};

exports.AddOneUser = (req, res, next) => {
  const userObject = {
    ...req.body,
  };
  delete userObject._id;
  delete userObject.password;
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      Role.findOne({ name: req.body.grade["role"] })
        .then((role) => {
          role
            ? (() => {
                const user = new User({
                  ...userObject,
                  password: hash,
                });
                user
                  .save()
                  .then(() => buildWorkspace(res, user))
                  .catch((error) => {
                    console.log(error);
                    res.status(400).json({ message: 'Impossible de créer l\'utilisateur' });
                  });
              })()
            : (() => {
                return res.status(400).json({ message: "Grade incorrect" });
              })();
        })
        .catch((error) => {
          console.log(error);
          res.status(500).json({ message: 'Une erreur est survenue' });
        });
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ message: 'Une erreur est survenue' });
    });
};

exports.modifyUser = (req, res, next) => {
  const userObject = {
    ...req.body,
  };
  delete userObject.userId;
  delete userObject._id;
  User.updateOne(
    { _id: req.body.userId },
    { ...userObject, _id: req.body.userId }
  )
    .then(() =>
      res.status(200).json({ message: "Utilisateur mis à jour avec succès !" })
    )
    .catch((error) => {
      console.log(error);
      res.status(400).json({ message: 'Impossible de modifier l\'utilisateur' });
    });
};

exports.modifyUserPermission = (req, res, next) => {
  User.updateOne(
    { _id: req.body.userId },
    { $set: { "grade.permission": req.body.permissions } }
  )
    .then(() => {
      User.findOne({ _id: req.body.userId }, { "grade.permission": 1, __id: 0 })
        .then((grade) => {
          res.status(200).json({
            message: "Utilisateur mis à jour avec succès !",
            permissions: grade.permission,
          });
        })
        .catch((error) => {
          console.log(error);
          res.status(500).json({ message: 'Une erreur est survenue' });
        });
    })
    .catch((error) => {
      console.log(error);
      res.status(400).json({ message: 'Impossible de modifier les permissions' });
    });
};

exports.addOrRemoveUserPermission = (req, res, next) => {
  const mode = req.params.mode;
  switch (mode) {
    case "add":
      User.findOne({ _id: req.body.userId })
        .then((user) => {
          user.grade["permission"].push(req.body.permission);
          user
            .save()
            .then(() =>
              res.status(200).json({
                message: "Utilisateur mis à jour avec succès !",
                permissions: grade.permission,
              })
            )
            .catch((error) => {
              console.log(error);
              res.status(500).json({ message: 'Une erreur est survenue' });
            });
        })
        .catch((error) => {
          console.log(error);
          res.status(400).json({ message: 'Impossible de modifier les permissions' });
        });
      break;
    case "remove":
      User.findOne({ _id: req.body.userId })
        .then((user) => {
          _.remove(
            user.grade["permission"],
            (el) => el === req.body.permission
          );
          user
            .save()
            .then(() =>
              res.status(200).json({
                message: "Utilisateur mis à jour avec succès !",
              })
            )
            .catch((error) => {
              console.log(error);
              res.status(500).json({ message: 'Une erreur est survenue' });
            });
        })
        .catch((error) => {
          console.log(error);
          res.status(400).json({ message: 'Impossible de modifier les permissions' });
        });
      break;
    default:
      res.status(400).json({ message: "Mode incorrect" });
  }
};

exports.getAllRoles = (req, res, next) => {
  Role.find({}, { _id: 0, __v: 0 })
    .then((roles) => {
      res.status(200).json(roles);
    })
    .catch((error) => {
      console.log(error);
      res.status(500).json({ message: 'Une erreur est survenue' });
    });
};

exports.addOneRole = async (req, res, next) => {
  const roleObject = {
    ...req.body,
  };
  delete roleObject._id;
  const role = new Role({
    ...roleObject,
  });

  try {
    const parentExists = await Role.exists({ name: role.parent });
    if (!parentExists) {
      return res
        .status(400)
        .json({ message: `Le role ${role.parent} n'existe pas` });
    }
    await Role.updateOne(
      { name: role.parent },
      { $push: { childs: role.name } }
    );
    for (child of role.childs) {
      const isExists = await Role.exists({ name: child });
      if (!isExists) {
        return res
          .status(400)
          .json({ message: `Le role ${child} n'existe pas` });
      }
    }
  } catch (err) {
    console.log(err);
    res.status(400).json({ message: "Parent incorrect" });
  }

  role
    .save()
    .then(() => {
      res.status(201).json({
        message: "Opération éffectuée avec succès!",
      });
    })
    .catch((error) => {
      console.log(error);
      res.status(400).json({ message: 'Impossible de créer le rôle' });
    });
};
