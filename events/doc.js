// Importation du module 'events'
const EventEmitter = require('events');
const createHandler = require('../handlers/doc/create');

// Création d'une nouvelle instance de EventEmitter
const docEvent = new EventEmitter();

// Définition d'un gestionnaire d'événements pour l'événement
docEvent.on('create', createHandler);

// Exportation de l'instance de EventEmitter
module.exports = docEvent;