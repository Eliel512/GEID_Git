const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017',
    { useNewUrlParser: true,
      useUnifiedTopology: true })
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !\nVeuillez entrez une adresse correcte dans la variabled de la variable d\'environnement MONGODB_URI'));
  
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('connected');
});

const User = require('./models/user');
const Message = require('./models/message');
const Space = require('./models/space');

(async () => {
    user = await User.findOne({ email: /dantic/i });
    const space = new Space({
        description: 'space',
        members: [{
            _id: user._id,
            role: 'simple'
        }],
        channels: [{
            _id: 'feiiiiiiiiii',
            number: 45
        }]
    });

    //console.log(space)

    space.save();
})();