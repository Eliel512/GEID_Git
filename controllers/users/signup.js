const User = require('../../models/users/user.model');
const Role = require('../../models/users/role.model');
const Auth = require('../../models/users/auth.model');
const WorkspaceFile = require('../../models/workspace/workspaceFile.model');
const bcrypt = require('bcryptjs');

const DEFAULT_FOLDERS = ['Documents', 'Images', 'Videos', 'Autres'];

module.exports = async (req, res) => {
  try {
    const hash = await bcrypt.hash(req.body.password, 10);
    const { role, grade } = req.body.grade;

    const roleDoc = await Role.findOne({ name: role.label });
    if (!roleDoc) {
      return res.status(400).json({ message: 'Grade incorrect.' });
    }

    const authDoc = await Auth.findOne({ name: 'default' }, { _id: 1 });
    if (!authDoc) {
      return res.status(500).json({ message: 'Une erreur est survenue lors de la création du compte.' });
    }

    const user = new User({
      fname: req.body.fname,
      lname: req.body.lname,
      mname: req.body.mname,
      grade: { grade, role: roleDoc.name },
      auth: authDoc._id,
      email: req.body.email,
      phoneCell: req.body.phoneCell,
      password: hash,
    });
    await user.save();

    // Créer les 4 dossiers par défaut dans MongoDB
    const userId = user._id.toString();
    await Promise.all(
      DEFAULT_FOLDERS.map((folderName) =>
        new WorkspaceFile({
          name: folderName,
          owner: userId,
          path: '',
          isDirectory: true,
        }).save()
      )
    );

    res.status(201).json({ message: 'Inscription réussie !' });
  } catch (error) {
    console.error('[signup]', error);
    res.status(500).json({ message: 'Une erreur est survenue lors de la création du compte.' });
  }
};
