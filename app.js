const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const moment = require('moment');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
//const helmet = require('helmet');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');
const auth = require('./middleware/users/auth');
const adminAuth = require('./middleware/adminAuth');
const RequestLog = require('./models/request_log');
const gfcpf = require('./public/geid-front-config-platform');

function getIp(req) {
    let ip = req.connection.remoteAddress;
    ip = ip.replace('::ffff:', '');
  
    if (ip == '143.198.110.104' || ip == '127.0.0.1') {
      ip = req.headers['X-Real-IP'];
    }
  
    return ip;
}

app = express();

app.set('trust proxy', true);

morgan.token('clientIp', function (req, res) { return getIp(req) });

mongoose.set('useCreateIndex', true);

mongoose.connect(process.env.MONGODB_URI,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !\nVeuillez entrez une adresse correcte dans la variable d\'environnement MONGODB_URI'));

//const db = mongoose.connection;

// db.on('error', console.error.bind(console, 'connection error:'));
// db.once('open', () => {
//   console.log('connected');
// });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

app.use('/archives', express.static(path.join(__dirname, 'archives')));
app.use('/profils', express.static(path.join(__dirname, 'profils')));
app.use('/workspace', express.static(path.join(__dirname, 'workspace')));
app.use('/salon', express.static(path.join(__dirname, 'salon')));
app.use('/ressources', express.static(path.join(__dirname, 'ressources')));

app.use('/api', apiRoutes);
app.use('/admin', auth, adminAuth, adminRoutes);
app.get('/analytics', (req, res, next) => {
    require('./analytics_service').getAnalytics()
        .then(analytics => res.render('analytics', { analytics: JSON.stringify(analytics) }))
	      .catch(error => {
		      console.log(error);
		      res.redirect('/');
	      });
});

// Geid config frontend apps
gfcpf(app);

module.exports = app;