const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const moment = require('moment');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
//const Pusher = require('pusher');
//const helmet = require('helmet');
const stuffRoutes = require('./routes/stuff');
const userRoutes = require('./routes/user');
const adminRoutes = require('./routes/admin');
const auth = require('./middleware/auth');
const adminAuth = require('./middleware/adminAuth');
const RequestLog = require('./models/request_log');

/*const pusher = new Pusher({
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_APP_KEY,
    secret: process.env.PUSHER_APP_SECRET,
    cluster: process.env.PUSHER_APP_CLUSTER
});*/

function getIp(req) {
    let ip = req.connection.remoteAddress;
    ip = ip.replace('::ffff:', '');
  
    if (ip == '137.184.96.252') {
      ip = req.headers['x-real-ip'];
    }
  
    return ip;
}

app = express();

app.set('trust proxy', true);
app.set('views', path.join(__dirname, 'views'));
require('hbs').registerHelper('toJson', data => JSON.stringify(data));
app.set('view engine', 'hbs');

morgan.token('clientIp', function (req, res) { return getIp(req) });

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
	res.setHeader("Access-Control-Allow-Credentials", "true");
	res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
	next();
});

//app.use(helmet());
app.use(cors());
app.use(morgan(function (tokens, req, res) {
    return [
      tokens.clientIp(req, res), '-', '-',
      tokens.method(req, res),
      tokens.url(req, res),
      tokens.status(req, res),
      tokens.res(req, res, 'content-length'), '-',
      tokens['response-time'](req, res), 'ms'
    ].join(' ')
}));
app.use(compression());
app.use((req, res, next) => {
    let requestTime = Date.now();
    res.on('finish', () => {
        if (req.path === '/analytics' || req.path.startsWith('/imgs') || req.path.startsWith('/static') ) {
            return;
        }

        RequestLog.create({
            url: req.path,
            method: req.method,
            responseTime: (Date.now() - requestTime) / 1000, // convert to seconds
            day: moment(requestTime).format("dddd"),
            hour: moment(requestTime).hour()
        });

        // trigger a message with the updated analytics
       /* require('./analytics_service').getAnalytics()
            .then(analytics => pusher.trigger('analytics', 'updated', {analytics}));*/
    });
    next();
});

app.use('/ressources', express.static(path.join(__dirname, 'ressources')));
app.use('/workspace', express.static(path.join(__dirname, 'workspace')));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/stuff', stuffRoutes);
app.use('/api/auth', userRoutes);
app.use('/admin', auth, adminAuth, adminRoutes);
app.get('/analytics', (req, res, next) => {
    require('./analytics_service').getAnalytics()
        .then(analytics => res.render('analytics', { analytics: JSON.stringify(analytics) }))
	.catch(error => {
		console.log(error);
		res.redirect('/');
	});
});
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/index.html'));
});

module.exports = app;
