#!/bin/bash
# ============================================================
# Oakville Schools Directory — Azure Deployment Script
# Deploys infrastructure + builds & pushes Docker images
# ============================================================
set -euo pipefail

# ---------- Configuration ----------
RESOURCE_GROUP="rg-oakvilleschools-prod"
LOCATION="canadacentral"
PROJECT_NAME="oakvilleschools"
ENVIRONMENT="prod"
DB_ADMIN_USER="oakvilleadmin"

# Common tags applied at resource group level too
TAGS="Project=OakvilleSchoolsDirectory Environment=${ENVIRONMENT} ManagedBy=AzureCLI Application=oakville-schools Owner=oakville-schools-team CostCenter=education-directory DataClassification=Public"

echo "=== Oakville Schools Directory — Azure Deployment ==="
echo ""

# ---------- Step 1: Login check ----------
echo "[1/8] Checking Azure login..."
az account show > /dev/null 2>&1 || { echo "Not logged in. Run 'az login' first."; exit 1; }
SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "  Subscription: ${SUBSCRIPTION_ID}"

# ---------- Step 2: Create Resource Group with tags ----------
echo "[2/8] Creating resource group: ${RESOURCE_GROUP}..."
az group create \
  --name "${RESOURCE_GROUP}" \
  --location "${LOCATION}" \
  --tags ${TAGS}

# ---------- Step 3: Prompt for DB password ----------
echo "[3/8] Setting database password..."
read -s -p "  Enter PostgreSQL admin password: " DB_ADMIN_PASSWORD
echo ""

# ---------- Step 4: Deploy Bicep template ----------
echo "[4/8] Deploying Azure infrastructure (Bicep)..."
DEPLOYMENT_OUTPUT=$(az deployment group create \
  --resource-group "${RESOURCE_GROUP}" \
  --template-file infra/main.bicep \
  --parameters \
    environment="${ENVIRONMENT}" \
    location="${LOCATION}" \
    projectName="${PROJECT_NAME}" \
    dbAdminUser="${DB_ADMIN_USER}" \
    dbAdminPassword="${DB_ADMIN_PASSWORD}" \
    redisSku="Basic" \
  --query "properties.outputs" \
  -o json)

# Parse outputs
ACR_LOGIN_SERVER=$(echo "${DEPLOYMENT_OUTPUT}" | python3 -c "import sys,json; print(json.load(sys.stdin)['acrLoginServer']['value'])")
API_URL=$(echo "${DEPLOYMENT_OUTPUT}" | python3 -c "import sys,json; print(json.load(sys.stdin)['apiUrl']['value'])")
WEB_URL=$(echo "${DEPLOYMENT_OUTPUT}" | python3 -c "import sys,json; print(json.load(sys.stdin)['webUrl']['value'])")
POSTGRES_HOST=$(echo "${DEPLOYMENT_OUTPUT}" | python3 -c "import sys,json; print(json.load(sys.stdin)['postgresHost']['value'])")

echo "  ACR: ${ACR_LOGIN_SERVER}"
echo "  API: ${API_URL}"
echo "  Web: ${WEB_URL}"

# ---------- Step 5: Login to ACR ----------
echo "[5/8] Logging into Container Registry..."
az acr login --name "${ACR_LOGIN_SERVER%%.*}"

# ---------- Step 6: Build and push Docker images ----------
echo "[6/8] Building and pushing Docker images..."

echo "  Building API image..."
docker build -t "${ACR_LOGIN_SERVER}/${PROJECT_NAME}-api:latest" -f Dockerfile .
docker push "${ACR_LOGIN_SERVER}/${PROJECT_NAME}-api:latest"

echo "  Building Playwright worker image..."
docker build -t "${ACR_LOGIN_SERVER}/${PROJECT_NAME}-playwright:latest" -f Dockerfile.playwright .
docker push "${ACR_LOGIN_SERVER}/${PROJECT_NAME}-playwright:latest"

echo "  Building Web image..."
docker build -t "${ACR_LOGIN_SERVER}/${PROJECT_NAME}-web:latest" -f web/Dockerfile ./web
docker push "${ACR_LOGIN_SERVER}/${PROJECT_NAME}-web:latest"

# ---------- Step 7: Run database migration ----------
echo "[7/8] Running database migration..."
DATABASE_URL="postgresql://${DB_ADMIN_USER}:${DB_ADMIN_PASSWORD}@${POSTGRES_HOST}:5432/oakville_schools?sslmode=require"

az webapp config appsettings set \
  --resource-group "${RESOURCE_GROUP}" \
  --name "app-api-${PROJECT_NAME}-${ENVIRONMENT}" \
  --settings DATABASE_URL="${DATABASE_URL}" > /dev/null

# Trigger restart to pick up new images
echo "[8/8] Restarting services..."
az webapp restart --resource-group "${RESOURCE_GROUP}" --name "app-api-${PROJECT_NAME}-${ENVIRONMENT}"
az webapp restart --resource-group "${RESOURCE_GROUP}" --name "app-web-${PROJECT_NAME}-${ENVIRONMENT}"

echo ""
echo "=== Deployment Complete ==="
echo "  API:  ${API_URL}"
echo "  Web:  ${WEB_URL}"
echo ""
echo "  To find all resources by tag:"
echo "    az resource list --tag Project=OakvilleSchoolsDirectory -o table"
echo "    az resource list --tag Component=API -o table"
echo "    az resource list --tag Environment=prod -o table"
echo ""
