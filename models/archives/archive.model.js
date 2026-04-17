const mongoose = require('mongoose'),
	{ Schema } = require('mongoose');
const uniqueValidator= require('mongoose-unique-validator');
const isValidObjectId = require('../../tools/isValidObjectId');

const archiveSchema = new Schema({
	version: {
		type: String,
		required: [false, "Le champ 'version' est requis"]
	},
	classNumber: {
		type: String,
		required: [false, "Le champ 'classNumber' est requis"],
		unique: false
	},
	refNumber: {
		type: String,
		required: [false, "Le champ 'refNumber' est requis"],
		unique: false
	},
	type: {
		type: {
			type: String,
			required: [true, "Le champ 'type.type' est requis"]
		},
		subtype: {
			type: String,
			required: false
		},
		profil: {
			type: String,
			ref: 'profil',
			validate: {
				validator: value => isValidObjectId(value),
				message: () => "Au champ 'type.profil' doit correspondre un _id de profil valide"
			},
			required: [true, "Le champ 'type.profil' est requis"]
		}
	},
	designation: {
		type: String,
		required: [true, "Le champ 'designation' est requis"], 
		unique: true
	},
	description: {
		type: String,
		required: [true, "Le champ 'description' est requis"],
	},
	language: {
		type: String,
		required: [true, "Le champ 'language' est requis"],
		default: 'FR'
	},
	tags: {
		type: [String],
		required: false
	},
	ref: {
		type: [String],
		required: false
	},
	administrativeUnit: {
		type: String,
		ref: 'roles',
		validate: {
            validator: role => isValidObjectId(role),
            message: () => "Au champ 'administrativeUnit' doit correspondre un _id de role valide"
        },
		required: false  // Auto-rempli depuis le rôle de l'utilisateur connecté
	},
	folder: {
		type: String,
		required: false  // Auto-déduit du type de document
	},
	// Référence vers le dossier physique dans la hiérarchie d'archivage
	record: {
		type: String,
		ref: 'record',
		validate: {
			validator: value => !value || isValidObjectId(value),
			message: () => "Au champ 'record' doit correspondre un _id de dossier valide"
		},
		required: false
	},
	// Référence vers le document physique (subdivision du dossier)
	document: {
		type: String,
		ref: 'document',
		validate: {
			validator: value => !value || isValidObjectId(value),
			message: () => "Au champ 'document' doit correspondre un _id de document valide"
		},
		required: false
	},
	validated: {
		type: Boolean,
		required: true,
		default: false
	},
	// Cycle de vie : état courant du document
	status: {
		type: String,
		enum: ['PENDING', 'ACTIVE', 'SEMI_ACTIVE', 'PERMANENT', 'PROPOSED_ELIMINATION', 'DESTROYED',
		       'pending', 'validated', 'archived', 'disposed',
		       'actif', 'intermédiaire', 'historique', 'détruit'],
		default: 'PENDING'
	},
	// Historique des transitions du cycle de vie
	lifecycleHistory: [{
		status: { type: String },
		changedAt: { type: Date, default: Date.now },
		changedBy: { type: String, ref: 'users' },
		note: { type: String, default: '' }
	}],
	// DUA — Durée d'Utilité Administrative (directives archivage RDC)
	// Modele par etape : chaque phase a sa propre duree et sa propre startDate.
	// Le scheduler quotidien fait les transitions auto (ACTIVE -> SEMI_ACTIVE,
	// puis SEMI_ACTIVE -> PERMANENT ou PROPOSED_ELIMINATION selon sortFinal).
	dua: {
		// Phase active (age courant) — demarre a la validation
		active: {
			value:     { type: Number, required: false },
			unit:      { type: String, enum: ['years', 'months'], required: false },
			startDate: { type: Date, required: false }
		},
		// Phase intermediaire (age semi-actif) — demarre au passage SEMI_ACTIVE
		semiActive: {
			value:     { type: Number, required: false },
			unit:      { type: String, enum: ['years', 'months'], required: false },
			startDate: { type: Date, required: false }
		},
		// Destination finale a l'expiration de la phase intermediaire
		sortFinal: { type: String, enum: ['conservation', 'elimination'], required: false },

		// ── Compat legacy (ancien modele single-dua) ──
		// Ces champs restent presents pour les archives existantes en DB.
		// Lus comme "semiActive" en fallback si dua.semiActive n'est pas defini.
		value:     { type: Number, required: false },
		unit:      { type: String, enum: ['years', 'months'], required: false },
		startDate: { type: Date, required: false }
	},
	fileUrl: {
		type: String,
		required: true
	}
	// event: {
	// 	type: String,
	// 	ref: 'event',
	// 	validate: {
    //         validator: event => isValidObjectId(event),
    //         message: () => "Au champ 'event' doit correspondre un _id de event valide"
    //     },
	// 	required: false
	// },
	// form: {
	// 	type: String,
	// 	ref: 'form',
	// 	validate: {
	// 		validator: form => isValidObjectId(form),
	// 		message: () => "Au champ 'form' doit correspondre un _id de form valide"
	// 	},
	// 	required: false
	// }
}, { discriminatorKey: 'kind', timestamps: true });


archiveSchema.plugin(uniqueValidator);

// ─── Index de recherche plein-texte ──────────────────────────────────────────
// Permet d'utiliser $text dans les requêtes de recherche unifiée.
// Les poids donnent la priorité à la désignation, puis aux tags et numéros.
archiveSchema.index(
	{
		designation:  'text',
		description:  'text',
		folder:       'text',
		classNumber:  'text',
		refNumber:    'text',
		tags:         'text',
	},
	{
		weights: { designation: 10, tags: 5, classNumber: 3, refNumber: 3, description: 1, folder: 1 },
		name: 'archive_text_search',
	}
);

//const archiveDB = mongoose.connection.useDb('archives');

const Archive = mongoose.model('archives', archiveSchema);

//const archiveSchemaProfil = archiveSchema.clone();

module.exports = Archive;