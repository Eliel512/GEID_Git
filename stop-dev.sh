#!/bin/bash
# Arrêt propre : PM2 (GEID) + Docker (MongoDB + Redis)

RED="\e[31m"
GREEN="\e[32m"
YELLOW="\e[33m"
BLUE="\e[34m"
MAGENTA="\e[35m"
BOLD="\e[1m"
RESET="\e[0m"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${YELLOW}${BOLD}Arrêt de GEID (PM2)...${RESET}"
pm2 stop GEID --silent && echo -e "${RED}GEID stoppé.${RESET}" || true
pm2 delete GEID --silent || true

echo -e "${YELLOW}${BOLD}Arrêt des containers Docker...${RESET}"
docker compose -f "$SCRIPT_DIR/docker-compose.yml" down
echo -e "${RED}${BOLD}MongoDB et Redis stoppés.${RESET}"

echo -e "${GREEN}${BOLD}Tous les services sont arrêtés. Les données restent dans ./data/${RESET}"
