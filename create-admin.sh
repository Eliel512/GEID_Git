#!/usr/bin/env bash
# ══════════════════════════════════════════════════════════════
#  GEID — Création d'un utilisateur administrateur par défaut
#  Usage : bash create-admin.sh
# ══════════════════════════════════════════════════════════════

set -euo pipefail

# ── Couleurs ──────────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo
echo -e "${CYAN}${BOLD}╔══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}${BOLD}║    GEID — Création de l'administrateur       ║${NC}"
echo -e "${CYAN}${BOLD}╚══════════════════════════════════════════════╝${NC}"
echo

# ── Saisie : Prénom ───────────────────────────────────────────
read -rp "  Prénom        [Admin]          : " INPUT_FNAME
FNAME="${INPUT_FNAME:-Admin}"

# ── Saisie : Nom ──────────────────────────────────────────────
read -rp "  Nom           [GEID]           : " INPUT_LNAME
LNAME="${INPUT_LNAME:-GEID}"

# ── Saisie : Email ────────────────────────────────────────────
read -rp "  Email         [admin@geid.local]: " INPUT_EMAIL
EMAIL="${INPUT_EMAIL:-admin@geid.local}"

# ── Saisie : Téléphone ────────────────────────────────────────
read -rp "  Téléphone     [+243810000000]  : " INPUT_PHONE
PHONE="${INPUT_PHONE:-+243810000000}"

# ── Saisie : Mot de passe (masqué) ───────────────────────────
echo -n "  Mot de passe  [Admin@1234]     : "
read -rs INPUT_PASSWORD
echo
PASSWORD="${INPUT_PASSWORD:-Admin@1234}"

echo
echo -e "  ${YELLOW}Résumé :${NC}"
echo -e "  • Nom     : ${BOLD}${FNAME} ${LNAME}${NC}"
echo -e "  • Email   : ${BOLD}${EMAIL}${NC}"
echo -e "  • Tél.    : ${BOLD}${PHONE}${NC}"
echo -e "  • Rôle    : ${BOLD}admin (toutes permissions)${NC}"
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

# ── Script Node.js injecté via heredoc ───────────────────────
node --require dotenv/config "$SCRIPT_DIR/_seed-admin.js" \
  --email="$EMAIL" \
  --password="$PASSWORD" \
  --fname="$FNAME" \
  --lname="$LNAME" \
  --phone="$PHONE"

echo
echo -e "${GREEN}${BOLD}  ✔  Administrateur créé avec succès !${NC}"
echo -e "${GREEN}  → Email    : ${EMAIL}${NC}"
echo -e "${GREEN}  → Mot de passe : (celui saisi)${NC}"
echo
