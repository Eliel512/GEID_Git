const Type = require('./models/type');
const Role = require('./models/roles');

let types = "CORRESPONDANCES COMPTES-RENDUS PROCES-VERBAUX NOTES BONS PLANS RAPPORTS LIVRES REGISTRES DOSSIERS-ADMINISTRATIFS DOSSIERS-FINANCIERS DOSSIERS-TECHNIQUES ORDRES ATTESTATIONS COMMISSIONS DECISIONS CADRES LEGISLATIONS BORDEREAUX DECHARGES";
types = types.split(' ');
types.push("TERMES DE REFERENCE");
types.push("AUTRES");
const TYPES = [];
for(type of types){
    TYPES.push({
        name: type
    });
}
for(type of TYPES){
    switch(type['name']){
        case 'NOTES': type['subtypes'] = ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS'];
        break;
        case 'CORRESPONDANCES': type['subtypes'] = ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER'];
        break;
        case 'BONS': type['subtypes'] = ['BONS D\'ENTREE', 'BONS DE SORTIE'];
        break;
        case 'PLANS': type['subtypes'] = ['PLANS STRATEGIQUES', 'PLANS OPERATIONNELS', 'PLANS TRIMESTRIELS', 'CLASSIFICATIONS', 'CLASSEMENTS'];
        break;
        case 'RAPPORTS': type['subtypes'] = ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE'];
        break;
        case 'ORDRES': type['subtypes'] = ['ORDRES DE SERVICE', 'ORDRES DE MISSION'];
        break;
        case 'CADRES': type['subtypes'] = ['CADRES DE MISE EN OEUVRE', 'CADRES DE SUIVI D\'EVALUATION', 'CADRES DE PERFORMANCE'];
        break;
        case 'LIVRES': type['subtypes'] = ['LIVRES', 'REVUES', 'BROCHURES', 'ARTICLES'];
        break;
        case 'REGISTRES': type['subtypes'] = ['PRESENCES', 'ACCUSES DE RECEPTION', 'ANNUAIRES', 'INVITATIONS', 'REGISTRES DE CREANCE', 'REGISTRES DE CREDIT', 'LIVRES DE CAISSE', 'REPERTOIRES DES ARCHIVES', 'CALENDRIERS DE CONSERVATION'];
        break;
        case 'LEGISLATIONS': type['subtypes'] = ['ARCHIVISTIQUES ET ACTES NORMATIFS', 'REGLEMENTATIONS ET CONTENTIEUX'];
        break;
        case 'BORDEREAUX': type['subtypes'] = ['BORDEREAUX DE VERSEMENT', 'BORDEREAUX D\'ELIMINATION', 'BORDEREAUX DE TRANSFERT', 'RECUS'];
        break;
        case 'DOSSIERS-ADMINISTRATIFS': type['subtypes'] = ['ROUTINES', 'RECRUTEMENTS', 'PROMOTIONS', 'DISCIPLINES', 'DETACHEMENTS', 'MISES EN DISPONIBILITE'];
        break;
        case 'DOSSIERS-FINANCIERS': type['subtypes'] = ['EN TRAITEMENT', 'CLOTURES'];
        break;
        case 'DOSSIERS-TECHNIQUES': type['subtypes'] = ['EN TRAITEMENT', 'CLOTURES'];
        break;
    }
}

let ROLES = [
    {
        name: "SECRETARIAT GENERAL",
        childs: ["SECRETARIAT ADMINISTRATIF DU SECRETAIRE GENERAL", "CELLULE TECHNIQUE D'APPUI", "CELLULE DE GESTION DES PROJETS ET DES MARCHES PUBLICS", "DIRECTION GENERALE DE POLITIQUE ET PROGRAMMATION BUDGETAIRE", "DIRECTION GENERALE DEVELOPPEMENT & SUIVI DES PERFORMANCES", "DIRECTION COORDINATION INFORMATIQUE INTERMINISTERIELLE", "DIRECTION CONTROLE BUDGETAIRE", "DIRECTION SUIVI & EXPLOITATION DES OPERATIONS DE REMUNERATION", "DIRECTION INTENDANCE GENERALE ET DES CREDITS CENTRALISES", "DIRECTION DES RESSOURCES HUMAINES", "DIRECTION ADMINISTRATIVE ET FINANCIERE", "DIRECTION ETUDES ET PLANIFICATION", "DIRECTION ARCHIVES & NOUVELLES TECHNOLOGIES DE L'INFORMATION ET DE LA COMMUNICATION"],
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "ATTESTATIONS",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
            {
                name: "COMMISSIONS",
            },
            {
                name: "DECISIONS",
            },
            {
                name: "ORDRES",
                subtypes: ['ORDRES DE SERVICE', 'ORDRES DE MISSION']
            },/*
            {
                name: "",
                subtypes: []
            },
            {
                name: "",
                subtypes: []
            }*/
        ]
    },
    {
        name: "SECRETARIAT ADMINISTRATIF DU SECRETAIRE GENERAL",
        childs: ["BUREAU COURRIER", "BUREAU RELATIONS PUBLIQUES ET PROTOCOLE"],
        parent: "SECRETARIAT GENERAL",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "ATTESTATIONS",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
            {
                name: "COMMISSIONS",
            },
            {
                name: "DECISIONS",
            },
            {
                name: "ORDRES",
                subtypes: ['ORDRES DE SERVICE', 'ORDRES DE MISSION']
            },
        ]
    },
    {
        name: "CELLULE TECHNIQUE D'APPUI",
        childs: ["SECRETARIAT CTA", "POOL JURIDIQUE ET CONTENTIEUX", "POOL COMMUNICATION INTERNE ET EXTERNE", "POOL AUDIT INTERNE", "POOL FOCAL ETHIQUE"],
        parent: "SECRETARIAT GENERAL",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
            {
                name: "COMMISSIONS",
            },
            {
                name: "LEGISLATION, REGLEMENTATIONS ET CONTENTIEUX",
            },
            {
                name: "COMMUNICATIONS",
            },
        ]
    },
    {
        name: "CELLULE DE GESTION DES PROJETS ET DES MARCHES PUBLICS",
        childs: ["SECRETARIAT CGPMP", "POOL PREPARATION DES MARCHES", "POOL PROGRAMMATION & SUIVI D'EXECUTION BUDGETAIRE DES MARCHES", "POOL PASSATION DES MARCHES", "POOL SUIVI EXECUTION DES MARCHES"],
        parent: "SECRETARIAT GENERAL",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "DOSSIERS DE PASSATION DE MARCHES",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
            {
                name: "COMMISSIONS",
            },
            {
                name: "REGISTRES",
                subtypes: ['PRESENCES', 'ACCUSES DE RECEPTION', 'ANNUAIRES', 'INVITATIONS', 'REGISTRES DE CREANCE', 'REGISTRES DE CREDIT', 'LIVRES DE CAISSE', 'REPERTOIRES DES ARCHIVES', 'CALENDRIERS DE CONSERVATION']
            },
            {
                name: "DECISIONS",
            },
        ]
    },
    {
        name: "DIRECTION GENERALE DE POLITIQUE ET PROGRAMMATION BUDGETAIRE",
        childs: ["SECRETARIAT ADMINISTRATIF DGPB", "DIRECTION DES RECETTES", "DIRECTION DES DEPENSES I", "DIRECTION DES DEPENSES II", "DIRECTION SYNTHESE ET PROGRAMMATION BUDGETAIRES", "DIRECTION DEPENSES ORGANISMES PUBLICS ET COMPTES SPECIAUX"],
        parent: "SECRETARIAT GENERAL",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "OUTILS DU TRAVAIL",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
            {
                name: "DOSSIERS",
            },
        ]
    },
    {
        name: "DIRECTION GENERALE DEVELOPPEMENT & SUIVI DES PERFORMANCES",
        childs: ["SECRETARIAT ADMINISTRATIF DGDSP", "DIRECTION DEVELOPPEMENT ET SYNTHESES DES PERFORMANCES", "DIRECTION SUIVI PERFORMANCES POUVOIR CENTRAL", "DIRECTION SUIVI PERFORMANCE MARCHES PUBLICS", "DIRECTION SUIVI PERFORMANCES PROVINCES & ETD"],
        parent: "SECRETARIAT GENERAL",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "OUTILS DU TRAVAIL",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
            {
                name: "DOSSIERS",
            },
        ]
    },
    {
        name: "DIRECTION COORDINATION INFORMATIQUE INTERMINISTERIELLE",
        childs: ["SECRETARIAT CII", "DIVISION EXPLOITATION", "DIVISION MAINTENANCE RESEAUX ET MATERIELS", "DIVISION INTRANET ET PROGRAMME", "DIVISION APPUI AUX PROVINCES ET SECURITE"],
        parent: "SECRETARIAT GENERAL",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "OUTILS DU TRAVAIL",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
            {
                name: "DOSSIERS",
            },
        ]
    },
    {
        name: "DIRECTION CONTROLE BUDGETAIRE",
        childs: ["SECRETARIAT CONTROLE BUDGETAIRE", "DIVISION CONTROLE DES SERVICES CENTRAUX", "DIVISION CONTROLEURS BUDGETAIRES AFFECTES", "DIVISION CONTROLE ORGANISMES PUBLICS ET COMPTES SPECIAUX", "DIVISION COMPTABILITES", "DIVISION REGLEMENTATION ET EXPLOITATION"],
        parent: "SECRETARIAT GENERAL",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "OUTILS DU TRAVAIL",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
            {
                name: "DOSSIERS",
            },
        ]
    },
    {
        name: "DIRECTION SUIVI & EXPLOITATION DES OPERATIONS DE REMUNERATION",
        childs: ["SECRETARIAT DSOR", "DIVISION OPERATIONS SOUV. ECONOMIE ET INFASTUCTURES", "DIVISION OPERATIONS SECTEURS SOCIAUX ET ADMINISTRATION GENERALE", "DIVISION RELATIONS EXTERIEURES/LIAISON INTER PROGRAMME", "DIVISION INFORMATIONS STATISTIQUES ET COMPTABLES", "DIVISION EXPLOITATION ET MECANISATION DES OPERATIONS DE REMUNERATION", "DIVISION OPERATIONS ORGANISMES PUBLICS ET COMPTES SPECIAUX"],
        parent: "SECRETARIAT GENERAL",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "OUTILS DU TRAVAIL",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
            {
                name: "DOSSIERS",
            },
        ]
    },
    {
        name: "DIRECTION INTENDANCE GENERALE ET DES CREDITS CENTRALISES",
        childs: ["SECRETARIAT INTENDANCE", "DIVISION CHARGES ENERGETIQUES", "DIVISION CHARGES SOCIALES ET CREDITS CENTRALISES", "DIVISION PATRIMOINE"],
        parent: "SECRETARIAT GENERAL",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "OUTILS DU TRAVAIL",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
            {
                name: "DOSSIERS",
            },
        ]
    },
    {
        name: "DIRECTION DES RECETTES",
        childs: ["SECRETARIAT DIRECTION DES RECETTES", "DIVISION RECETTES FISCALES", "DIVISION RECETTES NON FISCALES", "DIVISION DES RECETTES EXTERIEURES, PETROLIERS PRODUCTEURS ET EXCEPTIONNELLES", "DIVISION INVESTIGATIONS DES RECETTES"],
        parent: "DIRECTION GENERALE DE POLITIQUE ET PROGRAMMATION BUDGETAIRE",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
        ]
    },
    {
        name: "DIRECTION SYNTHESE ET PROGRAMMATION BUDGETAIRES",
        childs: ["SECRETARIAT DIRECTION SYNTHESE ET PROGRAMMATION BUDGETAIRES", "DIVISION CADRAGE ET SYNTHESE BUDGETAIRES", "DIVISION REGLEMENTATION ET SUIVI", "DIVISION EXPLOITATION ET MECANISATION BUDGETAIRE"],
        parent: "DIRECTION GENERALE DE POLITIQUE ET PROGRAMMATION BUDGETAIRE",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
        ]
    },
    {
        name: "DIRECTION DES DEPENSES I",
        childs: ["SECRETARIAT DIRECTION DES DEPENSES I", "DIVISION DEPENSES DES INSTITUTIONS ET SECTEURS DE SECURITE ET ORDRE PUBLIC", "DIVISION DES DEPENSES DES SECTEURS ECONOMIE, FINANCES ET INFRASTRUCTURES"],
        parent: "DIRECTION GENERALE DE POLITIQUE ET PROGRAMMATION BUDGETAIRE",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
        ]
    },
    {
        name: "DIRECTION DES DEPENSES II",
        childs: ["SECRETARIAT DIRECTION DES DEPENSES II", "DIVISION DEPENSES SECTEURS SOCIAUX ET DE PRODUTION", "DIVISION DEPENSES DES SECTEURS DE DIPLOMATIE ET D’ADMINISTRATION GENERALE"],
        parent: "DIRECTION GENERALE DE POLITIQUE ET PROGRAMMATION BUDGETAIRE",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
        ]
    },
    {
        name: "DIRECTION DEPENSES ORGANISMES PUBLICS ET COMPTES SPECIAUX",
        childs: ["SECRETARIAT DIRECTION DEPENSES ORGANISMES PUBLICS ET COMPTES SPECIAUX", "DIVISION DES ORGANISMES PUBLICS", "DIVISION COMPTES SPECIAUX"],
        parent: "DIRECTION GENERALE DE POLITIQUE ET PROGRAMMATION BUDGETAIRE",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
        ]
    },
    {
        name: "DIRECTION DEVELOPPEMENT ET SYNTHESES DES PERFORMANCES",
        childs: ["SECRETARIAT DIRECTION DEVELOPPEMENT ET SYNTHESES DES PERFORMANCES", "DIVISION DEVELOPPEMENT PERFORMANCES", "DIVISION SYNTHESE ET REGLEMENTATION", "DIVISION DEV. PERFORMANCES PROV. ETD.  & ORG. PUBL. RATT."],
        parent: "DIRECTION GENERALE DEVELOPPEMENT & SUIVI DES PERFORMANCES",
        docTypes: TYPES
    },
    {
        name: "DIRECTION SUIVI PERFORMANCES POUVOIR CENTRAL",
        childs: ["SECRETARIAT DIRECTION SUIVI PERFORMANCES POUVOIR CENTRAL", "DIVISION SUIVI DES PERFORMANCES SOUVERAINETE, ECONOMIE ET INFRASTRUCTURES", "DIVISION SUIVI DES PERFORMANCES SECTEURS SOCIAUX ET ADMINISTRATION GENERALE", "DIVISION SUIVI DES PERFORMANCES ORGANISMES PUBLICS ET COMPTES SPECIAUX"],
        parent: "DIRECTION GENERALE DEVELOPPEMENT & SUIVI DES PERFORMANCES",
        docTypes: TYPES
    },
    {
        name: "DIRECTION SUIVI PERFORMANCE MARCHES PUBLICS",
        childs: ["SECRETARIAT DIRECTION SUIVI PERFORMANCE MARCHES PUBLICS", "DIVISION PERFORMANCES MARCHES PUBLICS/POUVOIR CENTRAL", "DIVISION PERFORMANCES MARCHES PUBLICS/PROVINCES & ETD", "DIVISION CENTRALISATION ET EXPLOITATION"],
        parent: "DIRECTION GENERALE DEVELOPPEMENT & SUIVI DES PERFORMANCES",
        docTypes: TYPES
    },
    {
        name: "DIRECTION SUIVI PERFORMANCES PROVINCES & ETD",
        childs: ["SECRETARIAT DIRECTION SUIVI PERFORMANCES PROVINCES & ETD", "DIVISION SUIVI DES PERFORMANCES I", "DIVISION SUIVI DES PERFORMANCES II", "DIVISION SUIVI DES PERFORMANCES III"],
        parent: "DIRECTION GENERALE DEVELOPPEMENT & SUIVI DES PERFORMANCES",
        docTypes: TYPES
    },
    {
        name: "DIRECTION DES RESSOURCES HUMAINES",
        childs: ["SECRETARIAT DRH", "DIVISION CAPITAL HUMAIN", "DIVISION GESTION ET DEVELOPPEMENT DES COMPETENCES", "DIVISION ACTIONS SOCIALES"],
        parent: "SECRETARIAT GENERAL",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "MESURES ADMINISTRATIVES ET DISCIPLINAIRES",
            },
            {
                name: "DOSSIERS DU PERSONNEL",
            },
            {
                name: "DONNEES STATISTIQUES DU PERSONNEL",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
            {
                name: "COMMISSIONS",
            },
        ]
    },
    {
        name: "DIRECTION ADMINISTRATIVE ET FINANCIERE",
        childs: ["SECRETARIAT DAF", "DIVISION PREPARATION ET SUIVI DU BUDGET-PROGRAMME", "DIVISION EXECUTION DU BUDGET-PROGRAMMES", "DIVISION LOGISTIQUE ET INTENDANCE"],
        parent: "SECRETARIAT GENERAL",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "LOGISTIQUES, MAINTENANCE DU PATRIMOINE",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
            {
                name: "PREPARATION BUDGETAIRE",
            },
            {
                name: "GESTION FINANCIERE",
            },
        ]
    },
    {
        name: "DIRECTION ETUDES ET PLANIFICATION",
        childs: ["SECRETARIAT DEP", "DIVISION ETUDES, DOCUMENTATION ET INFORMATIONS", "DIVISION STRATEGIES ET COOPERATION INTERNATIONALE", "DIVISION PROGRAMMATION ET SUIVI"],
        parent: "SECRETARIAT GENERAL",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "POLITIQUES ET STRATEGIES SECTORIELLES",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
        ]
    },
    {
        name: "DIRECTION ARCHIVES & NOUVELLES TECHNOLOGIES DE L'INFORMATION ET DE LA COMMUNICATION",
        childs: ["SECRETARIAT DANTIC", "DIVISION ARCHIVES, BIBLIOTHEQUE ET PUBLICATIONS", "DIVISION NOUVELLES TECHNOLOGIES DE L'INFORMATION ET DE LA COMMUNICATION"],
        parent: "SECRETARIAT GENERAL",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "OUTILS DU TRAVAIL",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
            {
                name: "DOSSIERS",
            },
        ]
    },
    {
        name: "SECRETARIAT DIRECTION SYNTHESE ET PROGRAMMATION BUDGETAIRES",
        childs: [],
        parent: "DIRECTION SYNTHESE ET PROGRAMMATION BUDGETAIRES",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT DIRECTION DES RECETTES",
        childs: [],
        parent: "DIRECTION DES RECETTES",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT DIRECTION DES DEPENSES I",
        childs: [],
        parent: "DIRECTION DES DEPENSES I",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT DIRECTION DES DEPENSES II",
        childs: [],
        parent: "DIRECTION DES DEPENSES II",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT DIRECTION DEPENSES ORGANISMES PUBLICS ET COMPTES SPECIAUX",
        childs: [],
        parent: "DIRECTION DEPENSES ORGANISMES PUBLICS ET COMPTES SPECIAUX",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT CONTROLE BUDGETAIRE",
        childs: [],
        parent: "DIRECTION CONTROLE BUDGETAIRE",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT DSOR",
        childs: [],
        parent: "DIRECTION SUIVI & EXPLOITATION DES OPERATIONS DE REMUNERATION",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT CII",
        childs: [],
        parent: "DIRECTION COORDINATION INFORMATIQUE INTERMINISTERIELLE",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT INTENDANCE",
        childs: [],
        parent: "DIRECTION INTENDANCE GENERALE ET DES CREDITS CENTRALISES",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT DIRECTION DEVELOPPEMENT ET SYNTHESES DES PERFORMANCES",
        childs: [],
        parent: "DIRECTION DEVELOPPEMENT ET SYNTHESES DES PERFORMANCES",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT DIRECTION SUIVI PERFORMANCES POUVOIR CENTRAL",
        childs: [],
        parent: "DIRECTION SUIVI PERFORMANCES POUVOIR CENTRAL",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT DIRECTION SUIVI PERFORMANCE MARCHES PUBLICS",
        childs: [],
        parent: "DIRECTION SUIVI PERFORMANCE MARCHES PUBLICS",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT DIRECTION SUIVI PERFORMANCES PROVINCES & ETD",
        childs: [],
        parent: "DIRECTION SUIVI PERFORMANCES PROVINCES & ETD",
        docTypes: TYPES
    },
    {
        name: "DIVISION CADRAGE ET SYNTHESE BUDGETAIRES",
        childs: ["BUREAU CADRAGE BUDGETAIRE", "BUREAU SYNTHESE BUDGETAIRE"],
        parent: "DIRECTION SYNTHESE ET PROGRAMMATION BUDGETAIRES",
        docTypes: TYPES
    },
    {
        name: "DIVISION REGLEMENTATION ET SUIVI",
        childs: ["BUREAU REGLEMENTATION ET LOIS DE FINANCES", "BUREAU SUIVI ET STATISTIQUES"],
        parent: "DIRECTION SYNTHESE ET PROGRAMMATION BUDGETAIRES",
        docTypes: TYPES
    },
    {
        name: "DIVISION EXPLOITATION ET MECANISATION BUDGETAIRE",
        childs: ["BUREAU EXPLOITATION", "BUREAU MECANISATION BUDGETAIRE"],
        parent: "DIRECTION SYNTHESE ET PROGRAMMATION BUDGETAIRES",
        docTypes: TYPES
    },
    {
        name: "DIVISION RECETTES FISCALES",
        childs: ["BUREAU RECETTES DES IMPOTS", "BUREAU RECETTES DE DOUANES ET ACCISES"],
        parent: "DIRECTION DES RECETTES",
        docTypes: TYPES
    },
    {
        name: "DIVISION RECETTES NON FISCALES",
        childs: ["BUREAU RECETTES ADMINISTRATIVES ET DE PARTICTIPATIONS", "BUREAU RECETTES JUDICIAIRES ET DOMANIALES"],
        parent: "DIRECTION DES RECETTES",
        docTypes: TYPES
    },
    {
        name: "DIVISION DES RECETTES EXTERIEURES, PETROLIERS PRODUCTEURS ET EXCEPTIONNELLES",
        childs: ["BUREAU RECETTES EXTERIEURES", "BUREAU RECETTES DES PETROLIERS PRODUCTEURS ET EXCEPTIONNELLES"],
        parent: "DIRECTION DES RECETTES",
        docTypes: TYPES
    },
    {
        name: "DIVISION INVESTIGATIONS DES RECETTES",
        childs: ["BUREAU INVESTIGATIONS DES RECETTES FISCALES", "BUREAU INVESTIGATIONS DES RECETTES NON FISCALES", "BUREAU INVESTIGATIONS DES RECETTES EXTERIEURES ET DES PETROLIERS PRODUCTEURS"],
        parent: "DIRECTION DES RECETTES",
        docTypes: TYPES
    },
    {
        name: "DIVISION DEPENSES DES INSTITUTIONS ET SECTEURS DE SECURITE ET ORDRE PUBLIC",
        childs: ["BUREAU DEPENSES DES INSTITUTIONS", "BUREAU DEPENSES DE DEFENSE, ORDRE ET SECURITE"],
        parent: "DIRECTION DES DEPENSES I",
        docTypes: TYPES
    },
    {
        name: "DIVISION DES DEPENSES DES SECTEURS ECONOMIE, FINANCES ET INFRASTRUCTURES",
        childs: ["BUREAU DEPENSES DES SECTEURS ECONOMIQUE ET FINANCIER", "BUREAU DES DEPENSES DU SECTEUR DES INFRASTRUCTURES"],
        parent: "DIRECTION DES DEPENSES I",
        docTypes: TYPES
    },
    {
        name: "DIVISION DEPENSES SECTEURS SOCIAUX ET DE PRODUTION",
        childs: ["BUREAU DEPENSES SECTEURS DE PRODUCTION", "BUREAU DEPENSES DES SECTEURS SOCIAUX"],
        parent: "DIRECTION DES DEPENSES II",
        docTypes: TYPES
    },
    {
        name: "DIVISION DEPENSES DES SECTEURS DE DIPLOMATIE ET D’ADMINISTRATION GENERALE",
        childs: ["BUREAU DEPENSES DES SECTEURS JUDICIAIRE ET DE DIPLOMATIE", "BUREAU DEPENSES D’ADMINISTRATION GENERALE"],
        parent: "DIRECTION DES DEPENSES II",
        docTypes: TYPES
    },
    {
        name: "DIVISION DES ORGANISMES PUBLICS",
        childs: ["BUREAU BUDGETS ANNEXES", "BUREAU ORGANISMES AUTONOMES"],
        parent: "DIRECTION DEPENSES ORGANISMES PUBLICS ET COMPTES SPECIAUX",
        docTypes: TYPES
    },
    {
        name: "DIVISION COMPTES SPECIAUX",
        childs: ["BUREAU COMPTES D’AFFECTATION SPECIALE", "BUREAU COMPTES DE CONCOURS FINANCIERS ET PROCÉDURES PARTICULIÈRES", "BUREAU DEPENSES SERVICES DECONCENTRES"],
        parent: "DIRECTION DEPENSES ORGANISMES PUBLICS ET COMPTES SPECIAUX",
        docTypes: TYPES
    },
    {
        name: "DIVISION CONTROLE DES SERVICES CENTRAUX",
        childs: ["BUREAU SOUVERAINETE", "BUREAU SECTEURS SOCIAUX ET ADMINISTRATION GENERALE", "BUREAU ECONOMIE ET INFRASTRUCTURES"],
        parent: "DIRECTION CONTROLE BUDGETAIRE",
        docTypes: TYPES
    },
    {
        name: "DIVISION CONTROLEURS BUDGETAIRES AFFECTES",
        childs: ["CORPS DE CBA/Sces CENTRAUX", "CORPS DE CBA/ORGANISMES PUBLICS & COMPTES SPECIAUX"],
        parent: "DIRECTION CONTROLE BUDGETAIRE",
        docTypes: TYPES
    },
    {
        name: "DIVISION CONTROLE ORGANISMES PUBLICS ET COMPTES SPECIAUX",
        childs: ["BUREAU ORGANISMES PUBLICS", "BUREAU COMPTES SPECIAUX", "BUREAU SERVICES DECONCENTRES"],
        parent: "DIRECTION CONTROLE BUDGETAIRE",
        docTypes: TYPES
    },
    {
        name: "DIVISION COMPTABILITES",
        childs: ["BUREAU COMPTABILITE DES SERVICES CENTRAUX", "BUREAU COMPTABILITE DES SERVICES DECONCENTRES, ORGANISMES PUBLICS ET COMPTES SPECIAUX"],
        parent: "DIRECTION CONTROLE BUDGETAIRE",
        docTypes: TYPES
    },
    {
        name: "DIVISION REGLEMENTATION ET EXPLOITATION",
        childs: ["BUREAU REGLEMENTATION", "BUREAU EXPLOITATION"],
        parent: "DIRECTION CONTROLE BUDGETAIRE",
        docTypes: TYPES
    },
    {
        name: "DIVISION OPERATIONS SOUV. ECONOMIE ET INFASTUCTURES",
        childs: ["BUREAU INSTITUTIONS", "BUREAU DEFENSE, ORDRE ET SECURITE", "BUREAU ECONOMIE", "BUREAU INFRASTRUCTURES"],
        parent: "DIRECTION SUIVI & EXPLOITATION DES OPERATIONS DE REMUNERATION",
        docTypes: TYPES
    },
    {
        name: "DIVISION OPERATIONS SECTEURS SOCIAUX ET ADMINISTRATION GENERALE",
        childs: ["BUREAU SECTEURS SOCIAUX / SANTE", "BUREAU SECTEURS SOCIAUX / ENSEIGNEMENT", "BUREAU SECTEURS SOCIAUX / CULTURE, SPORTS & LOISIRS", "BUREAU ADMINISTRATION GENERALE", "BUREAU SERVICES DECONCENTRES"],
        parent: "DIRECTION SUIVI & EXPLOITATION DES OPERATIONS DE REMUNERATION",
        docTypes: TYPES
    },
    {
        name: "DIVISION RELATIONS EXTERIEURES/LIAISON INTER PROGRAMME",
        childs: ["BUREAU SOUVERAINETE, ECONOMIE ET INFRASTRUCTURES", "BUREAU SECTEURS SOCIAUX, ADMINISTRATION GENERALE ET SERVICES DECONCENTRES", "BUREAU ORGANISMES PUBLICS ET COMPTES SPECIAUX", "BUREAU BANCARISATION"],
        parent: "DIRECTION SUIVI & EXPLOITATION DES OPERATIONS DE REMUNERATION",
        docTypes: TYPES
    },
    {
        name: "DIVISION INFORMATIONS STATISTIQUES ET COMPTABLES",
        childs: ["BUREAU CENTRALISATION ET EXPLOITATION DES DONNEES", "BUREAU STATISTIQUES PAIE ET SUIVI"],
        parent: "DIRECTION SUIVI & EXPLOITATION DES OPERATIONS DE REMUNERATION",
        docTypes: TYPES
    },
    {
        name: "DIVISION EXPLOITATION ET MECANISATION DES OPERATIONS DE REMUNERATION",
        childs: ["BUREAU ETUDES", "BUREAU EXPLOITATION", "BUREAU MECANISATION DES OPERATIONS DES REMUNERATIONS"],
        parent: "DIRECTION SUIVI & EXPLOITATION DES OPERATIONS DE REMUNERATION",
        docTypes: TYPES
    },
    {
        name: "DIVISION OPERATIONS ORGANISMES PUBLICS ET COMPTES SPECIAUX",
        childs: ["BUREAU ORGANISMES PUBLICS", "BUREAU COMPTES SPECIAUX"],
        parent: "DIRECTION SUIVI & EXPLOITATION DES OPERATIONS DE REMUNERATION",
        docTypes: TYPES
    },
    {
        name: "DIVISION EXPLOITATION",
        childs: ["BUREAU EXPLOITATION", "BUREAU ARCHIVAGE", "BUREAU CENTRE D'ASSISTANCE (HELPDESK)"],
        parent: "DIRECTION COORDINATION INFORMATIQUE INTERMINISTERIELLE",
        docTypes: TYPES
    },
    {
        name: "DIVISION MAINTENANCE RESEAUX ET MATERIELS",
        childs: ["BUREAU RESEAU", "BUREAU MAINTENANCE MATERIELS", "BUREAU ADMINISTRATION SYSTEMES"],
        parent: "DIRECTION COORDINATION INFORMATIQUE INTERMINISTERIELLE",
        docTypes: TYPES
    },
    {
        name: "DIVISION INTRANET ET PROGRAMME",
        childs: ["BUREAU PROGRAMME", "BUREAU INTRANET", "BUREAU GENIE INFORMATIQUE", "BUREAU ADMINISTRATION BASES DE DONNEES"],
        parent: "DIRECTION COORDINATION INFORMATIQUE INTERMINISTERIELLE",
        docTypes: TYPES
    },
    {
        name: "DIVISION APPUI AUX PROVINCES ET SECURITE",
        childs: ["BUREAU APPUI AUX PROVINCES ET AUTRES SERVICES", "BUREAU SECURITE INFORMATIQUE"],
        parent: "DIRECTION COORDINATION INFORMATIQUE INTERMINISTERIELLE",
        docTypes: TYPES
    },
    {
        name: "DIVISION CHARGES ENERGETIQUES",
        childs: ["BUREAU EAU", "BUREAU ELECTRICITE", "BUREAU CARBURANT ET LUBRIFIANTS"],
        parent: "DIRECTION INTENDANCE GENERALE ET DES CREDITS CENTRALISES",
        docTypes: TYPES
    },
    {
        name: "DIVISION CHARGES SOCIALES ET CREDITS CENTRALISES",
        childs: ["BUREAU BAUX A LOYERS", "BUREAU SOINS MEDICAUX, PHARMACEUTIQUES ET FRAIS FUNERAIRES", "BUREAU TELECOMMUNICATIONS"],
        parent: "DIRECTION INTENDANCE GENERALE ET DES CREDITS CENTRALISES",
        docTypes: TYPES
    },
    {
        name: "DIVISION PATRIMOINE",
        childs: ["BUREAU COMPTABILITE DES MATIERES", "BUREAU INVENTAIRES", "BUREAU PRETS, AVANCES ET GARANTIES DE L’ETAT"],
        parent: "DIRECTION INTENDANCE GENERALE ET DES CREDITS CENTRALISES",
        docTypes: TYPES
    },
    {
        name: "DIVISION DEVELOPPEMENT PERFORMANCES",
        
        childs: ["BUREAU DEVELOPPEMENT SECTEURS SOUV., ECO. & INFRAS", "BUREAU DEVELOPPEMENT SECTEURS SOC. ET ADM. GEN.", "BUREAU DEV. SECTEURS ORG. PUBL. & COMPTES SPECIAUX"],
        parent: "DIRECTION DEVELOPPEMENT ET SYNTHESES DES PERFORMANCES",
        docTypes: TYPES
    },
    {
        name: "DIVISION SYNTHESE ET REGLEMENTATION",
        childs: ["CORPS D’ANALYSTES DES PERFORMANCES"],
        parent: "DIRECTION DEVELOPPEMENT ET SYNTHESES DES PERFORMANCES",
        docTypes: TYPES
    },
    {
        name:"DIVISION DEV. PERFORMANCES PROV. ETD.  & ORG. PUBL. RATT.",
        childs: ["BUREAU DEVELOPPEMENT PROVINCES", "BUREAU DEVELOPPEMENT ETD", "BUREAU DEV. ORG. PUBL. RATT"],
        parent: "DIRECTION DEVELOPPEMENT ET SYNTHESES DES PERFORMANCES",
        docTypes: TYPES
    },
    {
        name: "DIVISION SUIVI DES PERFORMANCES SOUVERAINETE, ECONOMIE ET INFRASTRUCTURES",
        childs: ["BUREAU SUIVI DES PERFORMANCES SOUVERAINETE", "BUREAU SUIVI DES PERFORMANCES ECONOMIE ET INFRASTRUCTURES"],
        parent: "DIRECTION SUIVI PERFORMANCES POUVOIR CENTRAL",
        docTypes: TYPES
    },
    {
        name: "DIVISION SUIVI DES PERFORMANCES SECTEURS SOCIAUX ET ADMINISTRATION GENERALE",
        childs: ["BUREAU SUIVI DES PERFORMANCES DES SECTEURS SOCIAUX ET PRODUCTION", "BUREAU SUIVI DES PERFORMANCES DE L’ADMINISTRATION GENERALE ET DIPLOMATIE"],
        parent: "DIRECTION SUIVI PERFORMANCES POUVOIR CENTRAL",
        docTypes: TYPES
    },
    {
        name:  "DIVISION SUIVI DES PERFORMANCES ORGANISMES PUBLICS ET COMPTES SPECIAUX",
        childs: ["BUREAU SUIVI DES PERFORMANCES DES ORGANISMES PUBLICS", "BUREAU SUIVI DES PERFORMANCES COMPTES SPECIAUX"],
        parent: "DIRECTION SUIVI PERFORMANCES POUVOIR CENTRAL",
        docTypes: TYPES
    },
    {
        name: "DIVISION PERFORMANCES MARCHES PUBLICS/POUVOIR CENTRAL",
        childs: ["BUREAU PERFO. MARCHES DES TRAVAUX", "BUREAU PERFO.  MARCHES DES PRESTATIONS INTELLECTUELLES", "BUREAU PERFO. MARCHES DES FOURNITURES ET DES SERVICES"],
        parent: "DIRECTION SUIVI PERFORMANCE MARCHES PUBLICS",
        docTypes: TYPES
    },
    {
        name: "DIVISION PERFORMANCES MARCHES PUBLICS/PROVINCES & ETD",
        childs: ["BUREAU PERFO. MARCHES DES TRAVAUX", "BUREAU PERFO.  MARCHES DES PRESTATIONS INTELLECTUELLES", "BUREAU PERFO. MARCHES DES FOURNITURES ET DES SERVICES"],
        parent: "DIRECTION SUIVI PERFORMANCE MARCHES PUBLICS",
        docTypes: TYPES
    },
    {
        name: "DIVISION CENTRALISATION ET EXPLOITATION",
        childs: ["BUREAU TECHNIQUE", "BUREAU SUIVI RECETTES & STATISTIQUES"],
        parent: "DIRECTION SUIVI PERFORMANCE MARCHES PUBLICS",
        docTypes: TYPES
    },
    {
        name: "DIVISION SUIVI DES PERFORMANCES I",
        childs: ["BUREAU SUIVI DES PERFORMANCES I(7 PROVINCES + ETD)", "BUREAU SUIVI DES PERFORMANCES I (6 PROVINCES + ETD)"],
        parent: "DIRECTION SUIVI PERFORMANCES PROVINCES & ETD",
        docTypes: TYPES
    },
    {
        name: "DIVISION SUIVI DES PERFORMANCES II",
        childs: ["BUREAU SUIVI DES PERFORMANCES II(7 PROVINCES + ETD)", "BUREAU SUIVI DES PERFORMANCES II(6 PROVINCES + ETD)"],
        parent: "DIRECTION SUIVI PERFORMANCES PROVINCES & ETD",
        docTypes: TYPES
    },
    {
        name: "DIVISION SUIVI DES PERFORMANCES III",
        childs: ["BUREAU SUIVI DES PERFORMANCES DES BUDGETS ANNEXES SECTEURS SOCIAUX", "BUREAU SUIVI DES PERFORMANCES BUDGETS ANNEXES ET AUTRES SECTEURS"],
        parent: "DIRECTION SUIVI PERFORMANCES PROVINCES & ETD",
        docTypes: TYPES
    },
    {
        name: "DIVISION ARCHIVES, BIBLIOTHEQUE ET PUBLICATIONS",
        childs: ["BUREAU ARCHIVES", "BUREAU BIBLIOTHEQUE, PHOTOTHEQUE ET FILMOTHEQUE", "BUREAU PRODUCTION ET PUBLICATION"],
        parent: "DIRECTION ARCHIVES & NOUVELLES TECHNOLOGIES DE L'INFORMATION ET DE LA COMMUNICATION",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "OUTILS DU TRAVAIL",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
            {
                name: "DOSSIERS",
            },
        ]
    },
    {
        name: "DIVISION NOUVELLES TECHNOLOGIES DE L'INFORMATION ET DE LA COMMUNICATION",
        childs: ["BUREAU RESEAUX ET SITE INTERNET", "BUREAU ETUDE ET DEVELOPPEMENT DES APPLICATIONS INFORMATIQUES", "BUREAU MAINTENANCE DES EQUIPEMENTS INFORMATIQUES"],
        parent: "DIRECTION ARCHIVES & NOUVELLES TECHNOLOGIES DE L'INFORMATION ET DE LA COMMUNICATION",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "OUTILS DU TRAVAIL",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
            {
                name: "DOSSIERS",
            },
        ]
    },
    {
        name: "DIVISION ETUDES, DOCUMENTATION ET INFORMATIONS",
        childs: ["BUREAU DOCUMENTATION ET INFORMATION", "BUREAU ETUDES, ANALYSES ET PROSPECTIVE"],
        parent: "DIRECTION ETUDES ET PLANIFICATION",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "POLITIQUES ET STRATEGIES SECTORIELLES",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
        ]
    },
    {
        name: "DIVISION STRATEGIES ET COOPERATION INTERNATIONALE",
        childs: ["BUREAU STRATEGIES", "BUREAU COOPERATION INTERNATIONALE"],
        parent: "DIRECTION ETUDES ET PLANIFICATION",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "POLITIQUES ET STRATEGIES SECTORIELLES",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
        ]
    },
    {
        name: "DIVISION PROGRAMMATION ET SUIVI",
        childs: ["BUREAU PROGRAMMATION", "BUREAU SUIVI ET EVALUATION"],
        parent: "DIRECTION ETUDES ET PLANIFICATION",
        docTypes: [
            {
                name: "CORRESPONDANCES",
                subtypes: ['COURRIERS ENTRANTS', 'COURRIERS SORTANTS', 'COURRIERS A TRAITER', 'COURRIERS SENSIBLES', 'COURRIERS URGENTS', 'COURRIERS A CONSERVER']
            },
            {
                name: "TERMES DE REFERENCE",
            },
            {
                name: "COMPTES-RENDUS",
            },
            {
                name: "PROCES-VERBAUX",
            },
            {
                name: "NOTES",
                subtypes: ['NOTES CIRCULAIRES', 'NOTES TECHNIQUES', 'INSTRUCTIONS', 'DIRECTIVES', 'NORMES', 'ORIENTATIONS']
            },
            {
                name: "POLITIQUES ET STRATEGIES SECTORIELLES",
            },
            {
                name: "RAPPORTS",
                subtypes: ['RAPPORTS DE SERVICE', 'RAPPORTS DE MISSION', 'RAPPORTS D\'ACTIVITE', 'RAPPORTS DE STAGE']
            },
        ]
    },
    {
        name: "DIVISION PREPARATION ET SUIVI DU BUDGET-PROGRAMME",
        childs: ["BUREAU PREPARATION BUDGETAIRE", "BUREAU SUIVI BUDGETAIRE"],
        parent: "DIRECTION ADMINISTRATIVE ET FINANCIERE",
        docTypes: TYPES
    },
    {
        name: "DIVISION EXECUTION DU BUDGET-PROGRAMMES",
        childs: ["BUREAU ENGAGEMENT ET LIQUIDATION", "BUREAU ORDONNANCEMENT ET COMPTABILITE ADMINISTRATIVE"],
        parent: "DIRECTION ADMINISTRATIVE ET FINANCIERE",
        docTypes: TYPES
    },
    {
        name: "DIVISION LOGISTIQUE ET INTENDANCE",
        childs: ["BUREAU LOGISTIQUE", "BUREAU INTENDANCE ET MAINTENANCE", "BUREAU SURVEILLANCE ET SECURITE"],
        parent: "DIRECTION ADMINISTRATIVE ET FINANCIERE",
        docTypes: TYPES
    },
    {
        name: "DIVISION CAPITAL HUMAIN",
        childs: ["BUREAU GESTION ET SUIVI DE CARRIERE", "BUREAU GESTION ET SUIVI DE CARRIERE DES AGENTS DES SERVICES SPECIALISES", "BUREAU ELEMENTS DE PAIE", "BUREAU QUALITE DE VIE AU TRAVAIL"],
        parent: "DIRECTION DES RESSOURCES HUMAINES",
        docTypes: TYPES
    },
    {
        name: "DIVISION GESTION ET DEVELOPPEMENT DES COMPETENCES",
        childs: ["BUREAU SUIVI ET EVALUATION DES COMPETENCES ET DES PERFORMANCES", "BUREAU GESTION PREVISIONNELLE DES EFFECTIFS, DES EMPLOIS ET DES COMPETENCES", "BUREAU FORMATION"],
        parent: "DIRECTION DES RESSOURCES HUMAINES",
        docTypes: TYPES
    },
    {
        name: "DIVISION ACTIONS SOCIALES",
        childs: ["BUREAU ASSISTANCE SOCIALE", "BUREAU RELATIONS PROFESSIONNELLES, ACTIVITES CULTURELLES, SPORTIVES ET LUDIQUES"],
        parent: "DIRECTION DES RESSOURCES HUMAINES",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT CTA",
        childs: [],
        parent: "CELLULE TECHNIQUE D'APPUI",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT CGPMP",
        childs: [],
        parent: "CELLULE DE GESTION DES PROJETS ET DES MARCHES PUBLICS",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT ADMINISTRATIF DGPB",
        childs: ["SECRETARIAT DU SECRETARIAT ADMINISTRATIF DGPB"],
        parent: "DIRECTION GENERALE DE POLITIQUE ET PROGRAMMATION BUDGETAIRE",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT TECHNIQUE DGPB",
        childs: [],
        parent: "DIRECTION GENERALE DE POLITIQUE ET PROGRAMMATION BUDGETAIRE",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT DU SECRETARIAT ADMINISTRATIF DGPB",
        childs: [],
        parent: "SECRETARIAT ADMINISTRATIF DGPB",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT ADMINISTRATIF DGDSP",
        childs: ["SECRETARIAT TECHNIQUE DU SECRETARIAT ADMINISTRATIF DGDSP"],
        parent: "DIRECTION GENERALE DEVELOPPEMENT & SUIVI DES PERFORMANCES",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT TECHNIQUE DU SECRETARIAT ADMINISTRATIF DGDSP",
        childs: [],
        parent: "SECRETARIAT ADMINISTRATIF DGDSP",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT DANTIC",
        childs: [],
        parent: "DIRECTION ARCHIVES, NOUVELLES TECHNOLOGIES DE L'INFORMATION ET DE LA COMMUNICATION",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT DEP",
        childs: [],
        parent: "DIRECTION ETUDES ET PLANIFICATION",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT DAF",
        childs: [],
        parent: "DIRECTION ADMINISTRATIVE ET FINANCIERE",
        docTypes: TYPES
    },
    {
        name: "SECRETARIAT DRH",
        childs: [],
        parent: "DIRECTION DES RESSOURCES HUMAINES",
        docTypes: TYPES
    },
    {
        name: "BUREAU CADRAGE BUDGETAIRE",
        childs: [],
        parent: "DIVISION CADRAGE ET SYNTHESE BUDGETAIRES",
        docTypes: TYPES
    },
    {
        name: "BUREAU SYNTHESE BUDGETAIRE",
        childs: [],
        parent: "DIVISION CADRAGE ET SYNTHESE BUDGETAIRES",
        docTypes: TYPES
    },
    {
        name: "BUREAU REGLEMENTATION ET LOIS DE FINANCES",
        childs: [],
        parent: "DIVISION REGLEMENTATION ET SUIVI",
        docTypes: TYPES
    },
    {
        name: "BUREAU SUIVI ET STATISTIQUES",
        childs: [],
        parent: "DIVISION REGLEMENTATION ET SUIVI",
        docTypes: TYPES
    },
    {
        name: "BUREAU EXPLOITATION",
        childs: [],
        parent: "DIVISION EXPLOITATION ET MECANISATION BUDGETAIRE",
        docTypes: TYPES
    },
    {
        name: "BUREAU MECANISATION BUDGETAIRE",
        childs: [],
        parent: "DIVISION EXPLOITATION ET MECANISATION BUDGETAIRE",
        docTypes: TYPES
    },
    {
        name: "BUREAU RECETTES DES IMPOTS",
        childs: [],
        parent: "DIVISION RECETTES FISCALES",
        docTypes: TYPES
    },
    {
        name: "BUREAU RECETTES DE DOUANES ET ACCISES",
        childs: [],
        parent: "DIVISION RECETTES FISCALES",
        docTypes: TYPES
    },
    {
        name: "BUREAU RECETTES ADMINISTRATIVES ET DE PARTICTIPATIONS",
        childs: [],
        parent: "DIVISION RECETTES NON FISCALES",
        docTypes: TYPES
    },
    {
        name: "BUREAU RECETTES JUDICIAIRES ET DOMANIALES",
        childs: [],
        parent: "DIVISION RECETTES NON FISCALES",
        docTypes: TYPES
    },
    {
        name: "BUREAU RECETTES EXTERIEURES",
        childs: [],
        parent: "DIVISION DES RECETTES EXTERIEURES, PETROLIERS PRODUCTEURS ET EXCEPTIONNELLES",
        docTypes: TYPES
    },
    {
        name: "BUREAU RECETTES DES PETROLIERS PRODUCTEURS ET EXCEPTIONNELLES",
        childs: [],
        parent: "DIVISION DES RECETTES EXTERIEURES, PETROLIERS PRODUCTEURS ET EXCEPTIONNELLES",
        docTypes: TYPES
    },
    {
        name: "BUREAU INVESTIGATIONS DES RECETTES FISCALES",
        childs: [],
        parent: "DIVISION INVESTIGATIONS DES RECETTES",
        docTypes: TYPES
    },
    {
        name: "BUREAU INVESTIGATIONS DES RECETTES EXTERIEURES ET DES PETROLIERS PRODUCTEURS",
        childs: [],
        parent: "DIVISION INVESTIGATIONS DES RECETTES",
        docTypes: TYPES
    },
    {
        name: "BUREAU INVESTIGATIONS DES RECETTES NON FISCALES",
        childs: [],
        parent: "DIVISION INVESTIGATIONS DES RECETTES",
        docTypes: TYPES
    },
    {
        name: "BUREAU DEPENSES DES INSTITUTIONS",
        childs: [],
        parent: "DIVISION DEPENSES DES INSTITUTIONS ET SECTEURS DE SECURITE ET ORDRE PUBLIC",
        docTypes: TYPES
    },
    {
        name: "BUREAU DEPENSES DE DEFENSE, ORDRE ET SECURITE",
        childs: [],
        parent: "DIVISION DEPENSES DES INSTITUTIONS ET SECTEURS DE SECURITE ET ORDRE PUBLIC",
        docTypes: TYPES
    },
    {
        name: "BUREAU DEPENSES DES SECTEURS ECONOMIQUE ET FINANCIER",
        childs: [],
        parent: "DIVISION DES DEPENSES DES SECTEURS ECONOMIE, FINANCES ET INFRASTRUCTURES",
        docTypes: TYPES
    },
    {
        name: "BUREAU DES DEPENSES DU SECTEUR DES INFRASTRUCTURES",
        childs: [],
        parent: "DIVISION DES DEPENSES DES SECTEURS ECONOMIE, FINANCES ET INFRASTRUCTURES",
        docTypes: TYPES
    },
    {
        name: "BUREAU DEPENSES SECTEURS DE PRODUCTION",
        childs: [],
        parent: "DIVISION DEPENSES SECTEURS SOCIAUX ET DE PRODUTION",
        docTypes: TYPES
    },
    {
        name: "BUREAU DEPENSES DES SECTEURS SOCIAUX",
        childs: [],
        parent: "DIVISION DEPENSES SECTEURS SOCIAUX ET DE PRODUTION",
        docTypes: TYPES
    },
    {
        name: "",
        childs: [],
        parent: "",
        docTypes: TYPES
    },
    {
        name: "",
        childs: [],
        parent: "",
        docTypes: TYPES
    },
    {
        name: "BUREAU ARCHIVES",
        childs: [],
        parent: "DIVISION ARCHIVES, BIBLIOTHEQUE ET PUBLICATIONS",
        docTypes: TYPES
    },
    {
        name: "BUREAU BIBLIOTHEQUE, PHOTOTHEQUE ET FILMOTHEQUE",
        childs: [],
        parent: "DIVISION ARCHIVES, BIBLIOTHEQUE ET PUBLICATIONS",
        docTypes: TYPES
    },
    {
        name: "BUREAU PRODUCTION ET PUBLICATION",
        childs: [],
        parent: "DIVISION ARCHIVES, BIBLIOTHEQUE ET PUBLICATIONS",
        docTypes: TYPES
    },
    {
        name: "BUREAU RESEAUX ET SITE INTERNET",
        childs: [],
        parent: "DIVISION NOUVELLES TECHNOLOGIES DE L'INFORMATION ET DE LA COMMUNICATION",
        docTypes: TYPES
    },
    {
        name: "BUREAU ETUDE ET DEVELOPPEMENT DES APPLICATIONS INFORMATIQUES",
        childs: [],
        parent: "DIVISION NOUVELLES TECHNOLOGIES DE L'INFORMATION ET DE LA COMMUNICATION",
        docTypes: TYPES
    },
    {
        name: "BUREAU MAINTENANCE DES EQUIPEMENTS INFORMATIQUES",
        childs: [],
        parent: "DIVISION NOUVELLES TECHNOLOGIES DE L'INFORMATION ET DE LA COMMUNICATION",
        docTypes: TYPES
    },
    {
        name: "BUREAU DOCUMENTATION ET INFORMATION",
        childs: [],
        parent: "DIVISION ETUDES, DOCUMENTATION ET INFORMATIONS",
        docTypes: TYPES
    },
    {
        name: "BUREAU ETUDES, ANALYSES ET PROSPECTIVE",
        childs: [],
        parent: "DIVISION ETUDES, DOCUMENTATION ET INFORMATIONS",
        docTypes: TYPES
    },
    {
        name: "BUREAU STRATEGIES",
        childs: [],
        parent: "DIVISION STRATEGIES ET COOPERATION INTERNATIONALE",
        docTypes: TYPES
    },
    {
        name: "BUREAU COOPERATION INTERNATIONALE",
        childs: [],
        parent: "DIVISION STRATEGIES ET COOPERATION INTERNATIONALE",
        docTypes: TYPES
    },
    {
        name: "BUREAU PROGRAMMATION",
        childs: [],
        parent: "DIVISION PROGRAMMATION ET SUIVI",
        docTypes: TYPES
    },
    {
        name: "BUREAU SUIVI ET EVALUATION",
        childs: [],
        parent: "DIVISION PROGRAMMATION ET SUIVI",
        docTypes: TYPES
    },
    {
        name: "BUREAU PREPARATION BUDGETAIRE",
        childs: [],
        parent: "DIVISION PREPARATION ET SUIVI DU BUDGET-PROGRAMME",
        docTypes: TYPES
    },
    {
        name: "BUREAU SUIVI BUDGETAIRE",
        childs: [],
        parent: "DIVISION PREPARATION ET SUIVI DU BUDGET-PROGRAMME",
        docTypes: TYPES
    },
    {
        name: "BUREAU ENGAGEMENT ET LIQUIDATION",
        childs: [],
        parent: "DIVISION EXECUTION DU BUDGET-PROGRAMMES",
        docTypes: TYPES
    },
    {
        name: "BUREAU ORDONNANCEMENT ET COMPTABILITE ADMINISTRATIVE",
        childs: [],
        parent: "DIVISION EXECUTION DU BUDGET-PROGRAMMES",
        docTypes: TYPES
    },
    {
        name: "BUREAU LOGISTIQUE",
        childs: [],
        parent: "DIVISION LOGISTIQUE ET INTENDANCE",
        docTypes: TYPES
    },
    {
        name: "BUREAU INTENDANCE ET MAINTENANCE",
        childs: [],
        parent: "DIVISION LOGISTIQUE ET INTENDANCE",
        docTypes: TYPES
    },
    {
        name: "BUREAU SURVEILLANCE ET SECURITE",
        childs: [],
        parent: "DIVISION LOGISTIQUE ET INTENDANCE",
        docTypes: TYPES
    },
    {
        name: "BUREAU GESTION ET SUIVI DE CARRIERE",
        childs: [],
        parent: "DIVISION CAPITAL HUMAIN",
        docTypes: TYPES
    },
    {
        name: "BUREAU GESTION ET SUIVI DE CARRIERE DES AGENTS DES SERVICES SPECIALISES",
        childs: [],
        parent: "DIVISION CAPITAL HUMAIN",
        docTypes: TYPES
    },
    {
        name: "BUREAU ELEMENTS DE PAIE",
        childs: [],
        parent: "DIVISION CAPITAL HUMAIN",
        docTypes: TYPES
    },
    {
        name: "BUREAU QUALITE DE VIE AU TRAVAIL",
        childs: [],
        parent: "DIVISION CAPITAL HUMAIN",
        docTypes: TYPES
    },
    {
        name: "BUREAU SUIVI ET EVALUATION DES COMPETENCES ET DES PERFORMANCES",
        childs: [],
        parent: "DIVISION GESTION ET DEVELOPPEMENT DES COMPETENCES",
        docTypes: TYPES
    },
    {
        name: "BUREAU GESTION PREVISIONNELLE DES EFFECTIFS, DES EMPLOIS ET DES COMPETENCES",
        childs: [],
        parent: "DIVISION GESTION ET DEVELOPPEMENT DES COMPETENCES",
        docTypes: TYPES
    },
    {
        name: "BUREAU FORMATION",
        childs: [],
        parent: "DIVISION GESTION ET DEVELOPPEMENT DES COMPETENCES",
        docTypes: TYPES
    },
    {
        name: "BUREAU ASSISTANCE SOCIALE",
        childs: [],
        parent: "DIVISION ACTIONS SOCIALES",
        docTypes: TYPES
    },
    {
        name: "BUREAU RELATIONS PROFESSIONNELLES, ACTIVITES CULTURELLES, SPORTIVES ET LUDIQUES",
        childs: [],
        parent: "DIVISION ACTIONS SOCIALES",
        docTypes: TYPES
    },
    {
        name: "BUREAU COURRIER",
        childs: [],
        parent: "SECRETARIAT ADMINISTRATIF DU SECRETAIRE GENERAL",
        docTypes: TYPES
    },
    {
        name: "BUREAU RELATIONS PUBLIQUES ET PROTOCOLE",
        childs: [],
        parent: "SECRETARIAT ADMINISTRATIF DU SECRETAIRE GENERAL",
        docTypes: TYPES
    },
    {
        name: "POOL JURIDIQUE ET CONTENTIEUX INTERNE",
        childs: [],
        parent: "CELLULE TECHNIQUE D'APPUI",
        docTypes: TYPES
    },
    {
        name: "POOL COMMUNICATION INTERNE ET EXTERNE",
        childs: [],
        parent: "CELLULE TECHNIQUE D'APPUI",
        docTypes: TYPES
    },
    {
        name: "POOL AUDIT INTERNE",
        childs: [],
        parent: "CELLULE TECHNIQUE D'APPUI",
        docTypes: TYPES
    },
    {
        name: "POINT FOCAL ETHIQUE",
        childs: [],
        parent: "CELLULE TECHNIQUE D'APPUI",
        docTypes: TYPES
    },
    {
        name: "POOL PREPARATION DES MARCHES",
        childs: [],
        parent: "CELLULE DE GESTION DES PROJETS ET DES MARCHES PUBLICS",
        docTypes: TYPES
    },
    {
        name: "POOL PROGRAMMATION ET SUIVI D’EXECUTION BUDGETAIRE DES MARCHES",
        childs: [],
        parent: "CELLULE DE GESTION DES PROJETS ET DES MARCHES PUBLICS",
        docTypes: TYPES
    },
    {
        name: "POOL PASSATION DES MARCHES",
        childs: [],
        parent: "CELLULE DE GESTION DES PROJETS ET DES MARCHES PUBLICS",
        docTypes: TYPES
    },
    {
        name: "POOL SUIVI EXECUTION DES MARCHES",
        childs: [],
        parent: "CELLULE DE GESTION DES PROJETS ET DES MARCHES PUBLICS",
        docTypes: TYPES
    }
];

const GRADES = ["SECRETAIRE GENERAL", "SECRETAIRE", "DIRECTEUR GENERAL", "DIRECTEUR", "CHEF DE DIVISION", "CHEF DE BUREAU"];

let filler;
Type.find({  })
  .then(doctypes => {
      hasElement = doctypes.length > 0 ? true : false;
      if(!hasElement){
        let counter = 0;
        for(type of TYPES){
            filler = new Type(type);
            filler.save()
            .then(() => {
                counter += 1;
                if(counter >= TYPES.length){
                    console.log('Ajout des types de document effectué')
                }
            })
            .catch(error => console.log(error));
        }
        
      }
  })
  .catch(error => console.log(error));

Role.find({  })
  .then(roles => {
    hasElement = roles.length > 0 ? true: false;
    if(!hasElement){
      let counter = 0;
      for(role of ROLES){
          filler = new Role(role);
          filler.save()
          .then(() => {
              counter += 1;
              if(counter >= ROLES.length){
                  console.log('Ajout des structures effectué')
              }
          })
          .catch(error => console.log(error));
      }
      
    }
  })
  .catch(error => console.log(error));

exports.GRADES = GRADES;
exports.ROLES = ROLES;