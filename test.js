// const express = require('express');
// const morgan = require('morgan');
// const cors = require('cors');

// const app = express();

// const PORT = 5000;

// app.use(cors());
// app.use(morgan('tiny'));
// app.get('/', (req, res) => {
//   console.log(`host: ${req.get('host')}\nhostname: ${req.hostname}`);
//   return res.status(200).send('<h1>Hello world!</h1>');
// });

// app.listen(PORT, () => {
//   console.log('Listening on: %d', PORT);
// });

const mongoose = require('mongoose');
const Auth = require('./models/users/auth.model');
const User = require('./models/users/user.model');

mongoose.set('useCreateIndex', true);

mongoose.connect('mongodb://127.0.0.1:27017/',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connexion à MongoDB réussie !');
    Auth.findOne({ name: 'default' })
      .then(auth => {
        auth.privileges = [
          ...auth.privileges,
          {
            app: 'workspace',
            permissions: [{
              struct: 'all',
              access: 'write'
            }]
          }
        ];
        auth.save()
          .then(() => console.log('correa'))
          .catch(error => console.log(error));
      })
      .catch(error => console.log(error));
  })
  .catch(
    () => console.log('Connexion à MongoDB échouée !\nVeuillez entrez une adresse correcte dans la variable d\'environnement MONGODB_URI')
    );