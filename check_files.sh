#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo "Checking for required files in the multi-agentic project..."
echo

# Check Docker files
echo -e "${YELLOW}Checking Docker files:${NC}"
files=(
  "docker-compose.yml"
  "frontend/Dockerfile"
  "middle/Dockerfile"
  "pip.conf"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${RED}✗${NC} $file (missing)"
  fi
done
echo

# Check frontend files
echo -e "${YELLOW}Checking frontend files:${NC}"
files=(
  "frontend/package.json"
  "frontend/public/index.html"
  "frontend/public/manifest.json"
  "frontend/public/robots.txt"
  "frontend/src/App.js"
  "frontend/src/index.js"
  "frontend/src/reportWebVitals.js"
  "frontend/src/pages/ChatPage.js"
  "frontend/src/pages/SettingsPage.js"
  "frontend/src/pages/HistoryPage.js"
  "frontend/src/utils/AppContext.js"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${RED}✗${NC} $file (missing)"
  fi
done
echo

# Check middle container files
echo -e "${YELLOW}Checking middle container files:${NC}"
files=(
  "middle/requirements.txt"
  "middle/.env"
  "middle/app/main.py"
  "middle/app/__init__.py"
  "middle/app/api/__init__.py"
  "middle/app/api/message.py"
  "middle/app/api/history.py"
  "middle/app/api/prompt_template.py"
  "middle/app/api/models.py"
  "middle/app/models/__init__.py"
  "middle/app/models/schemas.py"
  "middle/app/services/__init__.py"
  "middle/app/services/ollama_service.py"
  "middle/app/services/history_service.py"
  "middle/app/services/prompt_template_service.py"
  "middle/app/utils/__init__.py"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${RED}✗${NC} $file (missing)"
  fi
done
echo

# Check documentation files
echo -e "${YELLOW}Checking documentation files:${NC}"
files=(
  "README.md"
  "plan.md"
  "data-schema.md"
  "sequence-diagrams.md"
  "architecture-diagrams.md"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo -e "  ${GREEN}✓${NC} $file"
  else
    echo -e "  ${RED}✗${NC} $file (missing)"
  fi
done
echo

echo "File check complete!" 