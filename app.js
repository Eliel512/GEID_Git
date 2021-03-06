const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const stuffRoutes = require('./routes/stuff');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const auth = require('./middleware/auth');
const adminAuth = require('./middleware/adminAuth');

app = express();

mongoose.connect(process.env.MONGODB_URI,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !\nVeuillez entrez une adresse correcte dans la variabled de la variable d\'environnement MONGODB_URI'));

const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('connected');
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
	next();
});

app.use(helmet());
app.use(cors());
app.use(morgan("tiny"));
app.use(compression());

app.use('/ressources', express.static(path.join(__dirname, 'ressources')));
app.use('/workspace', express.static(path.join(__dirname, 'workspace')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/stuff', stuffRoutes);
app.use('/api/auth', userRoutes);
app.use('/admin', auth, adminAuth, adminRoutes);
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
})

module.exports = app;