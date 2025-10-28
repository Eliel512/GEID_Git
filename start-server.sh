#!/bin/bash
# Sequential PM2 startup with colored output and wait-on

set -e

# Define colors
RED="\e[31m"
GREEN="\e[32m"
YELLOW="\e[33m"
BLUE="\e[34m"
MAGENTA="\e[35m"
CYAN="\e[36m"
BOLD="\e[1m"
RESET="\e[0m"

clear
pm2 flush --silent || true
pm2 stop all --silent && echo -e "${RED}${BOLD}All processes stopped.${RESET}" || true
pm2 delete all --silent && echo -e "${RED}${BOLD}All processes deleted.${RESET}" || true

systemctl stop mongod || true
systemctl stop redis-server || true

echo -e "${BLUE}${BOLD}Starting MongoDB...${RESET}"
pm2 start ecosystem.config.js --only mongo --silent

echo -e "${YELLOW}Waiting for MongoDB to be ready on port 27017...${RESET}"
wait-on tcp:127.0.0.1:27017
echo -e "${GREEN}MongoDB is ready!${RESET}"

echo -e "${BLUE}${BOLD}Starting Redis...${RESET}"
pm2 start ecosystem.config.js --only redis-server --silent

echo -e "${YELLOW}Waiting for Redis to be ready on port 6379...${RESET}"
wait-on tcp:127.0.0.1:6379
echo -e "${GREEN}Redis is ready!${RESET}"

echo -e "${BLUE}${BOLD}Starting GEID...${RESET}"
pm2 start ecosystem.config.js --only GEID --env production --silent

echo -e "${YELLOW}Waiting for GEID to be ready on port 81...${RESET}"
wait-on tcp:127.0.0.1:81

echo -e "${YELLOW}Waiting for GEID to be ready on port 82...${RESET}"
wait-on tcp:127.0.0.1:82

echo -e "${YELLOW}Waiting for GEID to be ready on port 83...${RESET}"
wait-on tcp:127.0.0.1:83

echo -e "${YELLOW}Waiting for GEID to be ready on port 84...${RESET}"
wait-on tcp:127.0.0.1:84
echo -e "${GREEN}GEID is ready!${RESET}"

echo -e "${MAGENTA}${BOLD}All services started successfully in order!${RESET}"

pm2 list
