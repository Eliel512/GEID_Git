#!/bin/bash
# Demarrage local : Docker (MongoDB + Redis) + PM2 (GEID)

set -e

RED="\e[31m"
GREEN="\e[32m"
YELLOW="\e[33m"
BLUE="\e[34m"
MAGENTA="\e[35m"
CYAN="\e[36m"
BOLD="\e[1m"
RESET="\e[0m"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

clear

# --- Arrêt propre des anciens processus PM2 ---
pm2 flush --silent || true
pm2 stop all --silent && echo -e "${RED}${BOLD}PM2 : tous les processus stoppés.${RESET}" || true
pm2 delete all --silent && echo -e "${RED}${BOLD}PM2 : tous les processus supprimés.${RESET}" || true

# --- Création des dossiers de données locaux si absents ---
mkdir -p "$SCRIPT_DIR/data/mongodb"
mkdir -p "$SCRIPT_DIR/data/redis"

# --- Démarrage des containers Docker ---
echo -e "${CYAN}${BOLD}Démarrage des services Docker (MongoDB + Redis)...${RESET}"
docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d

# --- Attente MongoDB ---
echo -e "${YELLOW}Attente de MongoDB sur le port 27017...${RESET}"
wait-on tcp:127.0.0.1:27017 --timeout 60000
echo -e "${GREEN}MongoDB prêt !${RESET}"

# --- Attente Redis ---
echo -e "${YELLOW}Attente de Redis sur le port 6379...${RESET}"
wait-on tcp:127.0.0.1:6379 --timeout 60000
echo -e "${GREEN}Redis prêt !${RESET}"

# --- Démarrage de l'application GEID via PM2 ---
echo -e "${BLUE}${BOLD}Démarrage de GEID...${RESET}"
pm2 start "$SCRIPT_DIR/ecosystem.config.js" --only GEID --env production --silent

echo -e "${YELLOW}Attente de GEID sur le port 3001...${RESET}"
wait-on tcp:127.0.0.1:3001 --timeout 60000

echo -e "${YELLOW}Attente de GEID sur le port 3002...${RESET}"
wait-on tcp:127.0.0.1:3002 --timeout 60000

echo -e "${YELLOW}Attente de GEID sur le port 3003...${RESET}"
wait-on tcp:127.0.0.1:3003 --timeout 60000

echo -e "${YELLOW}Attente de GEID sur le port 3004...${RESET}"
wait-on tcp:127.0.0.1:3004 --timeout 60000

echo -e "${GREEN}${BOLD}GEID prêt !${RESET}"

echo -e "${MAGENTA}${BOLD}Tous les services sont démarrés !${RESET}"
echo -e "${CYAN}  MongoDB  → 127.0.0.1:27017        (données : ./data/mongodb)${RESET}"
echo -e "${CYAN}  Redis    → 127.0.0.1:6379          (données : ./data/redis)${RESET}"
echo -e "${CYAN}  GEID     → ports 3001-3004         (PM2 fork x4)${RESET}"

pm2 list
