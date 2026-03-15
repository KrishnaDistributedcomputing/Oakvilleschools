# ============================================================
# Oakville Schools Directory — Azure Deployment (PowerShell)
# Deploys infrastructure + builds & pushes Docker images
# ============================================================
param(
    [string]$ResourceGroup = "rg-oakvilleschools-prod",
    [string]$Location = "canadacentral",
    [string]$ProjectName = "oakvilleschools",
    [string]$Environment = "prod",
    [string]$DbAdminUser = "oakvilleadmin",
    [string]$RedisSku = "Basic"
)

$ErrorActionPreference = "Stop"

# ---------- Common Tags ----------
$Tags = @{
    Project             = "OakvilleSchoolsDirectory"
    Environment         = $Environment
    ManagedBy           = "AzureCLI"
    Application         = "oakville-schools"
    Owner               = "oakville-schools-team"
    CostCenter          = "education-directory"
    DataClassification  = "Public"
}
$TagString = ($Tags.GetEnumerator() | ForEach-Object { "$($_.Key)=$($_.Value)" }) -join " "

Write-Host "=== Oakville Schools Directory — Azure Deployment ===" -ForegroundColor Cyan
Write-Host ""

# ---------- Step 1: Login check ----------
Write-Host "[1/8] Checking Azure login..." -ForegroundColor Yellow
try {
    $account = az account show 2>&1 | ConvertFrom-Json
    Write-Host "  Subscription: $($account.id)"
} catch {
    Write-Host "  Not logged in. Running 'az login'..." -ForegroundColor Red
    az login
}

# ---------- Step 2: Create Resource Group ----------
Write-Host "[2/8] Creating resource group: $ResourceGroup..." -ForegroundColor Yellow
az group create `
    --name $ResourceGroup `
    --location $Location `
    --tags $TagString.Split(" ") | Out-Null
Write-Host "  Resource group created with tags." -ForegroundColor Green

# ---------- Step 3: DB password ----------
Write-Host "[3/8] Setting database password..." -ForegroundColor Yellow
$DbPassword = Read-Host -Prompt "  Enter PostgreSQL admin password" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($DbPassword)
$DbAdminPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)
[System.Runtime.InteropServices.Marshal]::ZeroFreeBSTR($BSTR)

# ---------- Step 4: Deploy Bicep ----------
Write-Host "[4/8] Deploying Azure infrastructure (Bicep)..." -ForegroundColor Yellow
$deployment = az deployment group create `
    --resource-group $ResourceGroup `
    --template-file infra/main.bicep `
    --parameters `
        environment=$Environment `
        location=$Location `
        projectName=$ProjectName `
        dbAdminUser=$DbAdminUser `
        dbAdminPassword=$DbAdminPassword `
        redisSku=$RedisSku `
    --query "properties.outputs" `
    -o json | ConvertFrom-Json

$AcrLoginServer = $deployment.acrLoginServer.value
$VanityWeb = $deployment.vanityWebUrl.value
$VanityApi = $deployment.vanityApiUrl.value
$FrontDoor = $deployment.frontDoorEndpoint.value
$DirectApi = $deployment.directApiUrl.value
$DirectWeb = $deployment.directWebUrl.value
$PostgresHost = $deployment.postgresHost.value
$RedisHost = $deployment.redisHost.value
$StorageName = $deployment.storageAccountName.value
$DnsInstructions = $deployment.dnsInstructions.value

Write-Host ""
Write-Host "  ┌────────────────────────────────────────────────┐" -ForegroundColor Cyan
Write-Host "  │         VANITY URLs (public-facing)            │" -ForegroundColor Cyan
Write-Host "  ├────────────────────────────────────────────────┤" -ForegroundColor Cyan
Write-Host "  │  Web:  $VanityWeb" -ForegroundColor Green
Write-Host "  │  API:  $VanityApi" -ForegroundColor Green
Write-Host "  │  CDN:  $FrontDoor" -ForegroundColor Green
Write-Host "  ├────────────────────────────────────────────────┤" -ForegroundColor Cyan
Write-Host "  │         DIRECT URLs (internal)                 │" -ForegroundColor DarkGray
Write-Host "  ├────────────────────────────────────────────────┤" -ForegroundColor DarkGray
Write-Host "  │  API:  $DirectApi" -ForegroundColor DarkGray
Write-Host "  │  Web:  $DirectWeb" -ForegroundColor DarkGray
Write-Host "  ├────────────────────────────────────────────────┤" -ForegroundColor Cyan
Write-Host "  │         INFRASTRUCTURE                         │" -ForegroundColor DarkGray
Write-Host "  ├────────────────────────────────────────────────┤" -ForegroundColor DarkGray
Write-Host "  │  ACR:      $AcrLoginServer" -ForegroundColor DarkGray
Write-Host "  │  Postgres: $PostgresHost" -ForegroundColor DarkGray
Write-Host "  │  Redis:    $RedisHost" -ForegroundColor DarkGray
Write-Host "  │  Storage:  $StorageName" -ForegroundColor DarkGray
Write-Host "  └────────────────────────────────────────────────┘" -ForegroundColor Cyan
Write-Host ""
Write-Host "  DNS: $DnsInstructions" -ForegroundColor Yellow

# ---------- Step 5: ACR Login ----------
Write-Host "[5/8] Logging into Container Registry..." -ForegroundColor Yellow
$AcrName = $AcrLoginServer.Split(".")[0]
az acr login --name $AcrName

# ---------- Step 6: Build and push images ----------
Write-Host "[6/8] Building and pushing Docker images..." -ForegroundColor Yellow

Write-Host "  Building API image..."
docker build -t "$AcrLoginServer/$ProjectName-api:latest" -f Dockerfile .
docker push "$AcrLoginServer/$ProjectName-api:latest"

Write-Host "  Building Playwright worker image..."
docker build -t "$AcrLoginServer/$ProjectName-playwright:latest" -f Dockerfile.playwright .
docker push "$AcrLoginServer/$ProjectName-playwright:latest"

Write-Host "  Building Web image..."
docker build -t "$AcrLoginServer/$ProjectName-web:latest" -f web/Dockerfile ./web
docker push "$AcrLoginServer/$ProjectName-web:latest"

# ---------- Step 7: Restart services ----------
Write-Host "[7/8] Restarting App Services..." -ForegroundColor Yellow
az webapp restart --resource-group $ResourceGroup --name "app-api-$ProjectName-$Environment"
az webapp restart --resource-group $ResourceGroup --name "app-web-$ProjectName-$Environment"

# ---------- Step 8: Summary ----------
Write-Host ""
Write-Host "[8/8] Deployment Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  VANITY URLs:" -ForegroundColor White
Write-Host "    Website: $VanityWeb" -ForegroundColor Green
Write-Host "    API:     $VanityApi" -ForegroundColor Green
Write-Host ""
Write-Host "  Search resources by tag:" -ForegroundColor Gray
Write-Host "    az resource list --tag Project=OakvilleSchoolsDirectory -o table"
Write-Host "    az resource list --tag Component=API -o table"
Write-Host "    az resource list --tag Component=Frontend -o table"
Write-Host "    az resource list --tag Component=Network -o table"
Write-Host "    az resource list --tag ResourceType=FrontDoor -o table"
Write-Host "    az resource list --tag ResourceType=PostgreSQL -o table"
Write-Host "    az resource list --tag Environment=prod -o table"
Write-Host "    az resource list --tag 'VanityURL_Web' -o table"
Write-Host ""
