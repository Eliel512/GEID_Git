const mongoose = require('mongoose');
const Chat = require('./models/chat');

mongoose.connect('mongodb://127.0.0.1:27017',
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !\nVeuillez entrez une adresse correcte dans la variabled de la variable d\'environnement MONGODB_URI'));


(
  async () => {
    const isExists = await Chat.exists({ members: { $elemMatch: { _id: "628b448e69f93ad38f0f13a1", role: 'simple' } } });
    console.log(isExists);
  }
)();