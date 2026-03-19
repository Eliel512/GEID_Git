#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  GEID — Création d'un utilisateur archiviste de test
#  Usage : bash create-test-user.sh
# ══════════════════════════════════════════════════════════════

set -euo pipefail

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║    GEID — Création de l'utilisateur de test      ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════════╝${NC}"
echo

read -rp "  Prénom        [Jean-Pierre]        : " INPUT_FNAME
FNAME="${INPUT_FNAME:-Jean-Pierre}"

read -rp "  Nom           [MUKENDI]            : " INPUT_LNAME
LNAME="${INPUT_LNAME:-MUKENDI}"

read -rp "  Email         [archiviste@geid.local]: " INPUT_EMAIL
EMAIL="${INPUT_EMAIL:-archiviste@geid.local}"

read -rp "  Téléphone     [+243821000001]      : " INPUT_PHONE
PHONE="${INPUT_PHONE:-+243821000001}"

read -rp "  Rôle unique   [archiviste-test]    : " INPUT_ROLE
ROLE="${INPUT_ROLE:-archiviste-test}"

echo -n "  Mot de passe  [Archiviste@1234]   : "
read -rs INPUT_PASSWORD
echo
PASSWORD="${INPUT_PASSWORD:-Archiviste@1234}"

echo
echo -e "  ${YELLOW}Résumé :${NC}"
echo -e "  • Nom     : ${BOLD}${FNAME} ${LNAME}${NC}"
echo -e "  • Email   : ${BOLD}${EMAIL}${NC}"
echo -e "  • Tél.    : ${BOLD}${PHONE}${NC}"
echo -e "  • Rôle    : ${BOLD}${ROLE}${NC}"
echo -e "  • Accès   : ${BOLD}archives (écriture totale)${NC}"
echo

read -rp "  Confirmer ? [O/n] : " CONFIRM
CONFIRM="${CONFIRM:-O}"

if [[ ! "$CONFIRM" =~ ^[OoYy]$ ]]; then
  echo -e "${RED}  Annulé.${NC}"
  exit 0
fi

echo
echo -e "${YELLOW}  Connexion à MongoDB et création en cours...${NC}"
echo

node --require dotenv/config "$SCRIPT_DIR/_seed-test.js" \
  --email="$EMAIL" \
  --password="$PASSWORD" \
  --fname="$FNAME" \
  --lname="$LNAME" \
  --phone="$PHONE" \
  --role="$ROLE"

echo
echo -e "${GREEN}${BOLD}  ✔  Utilisateur de test créé avec succès !${NC}"
echo -e "${GREEN}  → Email       : ${EMAIL}${NC}"
echo -e "${GREEN}  → Mot de passe: (celui saisi)${NC}"
echo -e "${GREEN}  → Rôle        : ${ROLE}${NC}"
echo
