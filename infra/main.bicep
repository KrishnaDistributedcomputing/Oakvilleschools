// ============================================================
// Oakville Schools Directory — Azure Infrastructure (Bicep)
// All resources tagged consistently for searchability
// ============================================================

targetScope = 'resourceGroup'

// ---------- Parameters ----------
@description('Environment name')
@allowed(['dev', 'staging', 'prod'])
param environment string = 'prod'

@description('Azure region')
param location string = resourceGroup().location

@description('Project prefix for naming')
param projectName string = 'oakvilleschools'

@description('PostgreSQL admin username')
@secure()
param dbAdminUser string

@description('PostgreSQL admin password')
@secure()
param dbAdminPassword string

@description('Redis cache SKU')
@allowed(['Basic', 'Standard', 'Premium'])
param redisSku string = 'Basic'

@description('Custom vanity domain for the website (e.g. schools.oakville.directory)')
param customDomainWeb string = ''

@description('Custom vanity domain for the API (e.g. api.oakville.directory)')
param customDomainApi string = ''

// ---------- Tags applied to every resource ----------
var commonTags = {
  Project: 'OakvilleSchoolsDirectory'
  Environment: environment
  ManagedBy: 'Bicep'
  Application: 'oakville-schools'
  Owner: 'oakville-schools-team'
  CostCenter: 'education-directory'
  DataClassification: 'Public'
  CreatedDate: '2026-03-15'
}

// ---------- Naming convention ----------
// Clear demarcation: <tier>-<component>-<project>-<env>
// Tiers:  infra | data | app | worker | net | mon
// Examples:
//   mon-logs-oakvilleschools-prod     (monitoring → log analytics)
//   data-psql-oakvilleschools-prod    (data tier → postgresql)
//   app-api-oakvilleschools-prod      (app tier → api)
//   net-fd-oakvilleschools-prod       (network tier → front door)
var suffix = '${projectName}-${environment}'
var shortSuffix = 'osd-${environment}'  // Short suffix for resources with name length limits
var uniqueSuffix = uniqueString(resourceGroup().id, projectName)

// ============================================================
// 1. Log Analytics Workspace (for monitoring)
// ============================================================
resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: 'mon-logs-${suffix}'
  location: location
  tags: union(commonTags, {
    ResourceType: 'LogAnalytics'
    Purpose: 'Monitoring and diagnostics'
  })
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: 30
  }
}

// ============================================================
// 2. Application Insights
// ============================================================
resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: 'mon-ai-${suffix}'
  location: location
  kind: 'web'
  tags: union(commonTags, {
    ResourceType: 'ApplicationInsights'
    Purpose: 'Application performance monitoring'
  })
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
  }
}

// ============================================================
// 3. Azure Container Registry
// ============================================================
resource acr 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: 'infracr${uniqueSuffix}'
  location: location
  tags: union(commonTags, {
    ResourceType: 'ContainerRegistry'
    Purpose: 'Docker image storage'
  })
  sku: {
    name: 'Basic'
  }
  properties: {
    adminUserEnabled: true
  }
}

// ============================================================
// 4. PostgreSQL Flexible Server
// ============================================================
resource postgres 'Microsoft.DBforPostgreSQL/flexibleServers@2023-12-01-preview' = {
  name: 'data-psql-${suffix}'
  location: location
  tags: union(commonTags, {
    ResourceType: 'PostgreSQL'
    Purpose: 'Primary database for school records'
    DataStore: 'Relational'
  })
  sku: {
    name: 'Standard_B1ms'
    tier: 'Burstable'
  }
  properties: {
    version: '16'
    administratorLogin: dbAdminUser
    administratorLoginPassword: dbAdminPassword
    storage: {
      storageSizeGB: 32
    }
    backup: {
      backupRetentionDays: 7
      geoRedundantBackup: 'Disabled'
    }
    highAvailability: {
      mode: 'Disabled'
    }
  }
}

resource postgresDb 'Microsoft.DBforPostgreSQL/flexibleServers/databases@2023-12-01-preview' = {
  parent: postgres
  name: 'oakville_schools'
  properties: {
    charset: 'UTF8'
    collation: 'en_US.utf8'
  }
}

resource postgresFirewall 'Microsoft.DBforPostgreSQL/flexibleServers/firewallRules@2023-12-01-preview' = {
  parent: postgres
  name: 'AllowAzureServices'
  properties: {
    startIpAddress: '0.0.0.0'
    endIpAddress: '0.0.0.0'
  }
}

// ============================================================
// 5. Azure Cache for Redis
// ============================================================
resource redis 'Microsoft.Cache/redis@2023-08-01' = {
  name: 'data-redis-${suffix}'
  location: location
  tags: union(commonTags, {
    ResourceType: 'RedisCache'
    Purpose: 'BullMQ job queue and caching'
    DataStore: 'Cache'
  })
  properties: {
    sku: {
      name: redisSku
      family: redisSku == 'Premium' ? 'P' : 'C'
      capacity: 0
    }
    enableNonSslPort: false
    minimumTlsVersion: '1.2'
  }
}

// ============================================================
// 6. Storage Account (for raw HTML snapshots)
// ============================================================
resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: 'datast${uniqueSuffix}'
  location: location
  tags: union(commonTags, {
    ResourceType: 'StorageAccount'
    Purpose: 'Raw HTML snapshots and crawl artifacts'
    DataStore: 'BlobStorage'
  })
  sku: {
    name: 'Standard_LRS'
  }
  kind: 'StorageV2'
  properties: {
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    supportsHttpsTrafficOnly: true
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2023-05-01' = {
  parent: storage
  name: 'default'
}

resource snapshotsContainer 'Microsoft.Storage/storageAccounts/blobServices/containers@2023-05-01' = {
  parent: blobService
  name: 'snapshots'
  properties: {
    publicAccess: 'None'
  }
}

// ============================================================
// 7. App Service Plan (Linux containers)
// ============================================================
resource appServicePlan 'Microsoft.Web/serverfarms@2023-12-01' = {
  name: 'app-plan-${suffix}'
  location: location
  tags: union(commonTags, {
    ResourceType: 'AppServicePlan'
    Purpose: 'Compute hosting for API and web app'
  })
  kind: 'linux'
  sku: {
    name: 'B1'
    tier: 'Basic'
  }
  properties: {
    reserved: true // Linux
  }
}

// ============================================================
// 8. API App Service (Express backend)
// ============================================================
resource apiApp 'Microsoft.Web/sites@2023-12-01' = {
  name: 'app-api-${suffix}'
  // Vanity: api.oakville.directory → this App Service
  location: location
  tags: union(commonTags, {
    ResourceType: 'AppService'
    Purpose: 'REST API backend for school directory'
    Component: 'API'
    Runtime: 'Node.js'
  })
  kind: 'app,linux,container'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|${acr.properties.loginServer}/${projectName}-api:latest'
      alwaysOn: true
      httpLoggingEnabled: true
      appSettings: [
        { name: 'DATABASE_URL', value: 'postgresql://${dbAdminUser}:${dbAdminPassword}@${postgres.properties.fullyQualifiedDomainName}:5432/oakville_schools?sslmode=require' }
        { name: 'REDIS_URL', value: 'rediss://:${redis.listKeys().primaryKey}@${redis.properties.hostName}:${redis.properties.sslPort}' }
        { name: 'DOCKER_REGISTRY_SERVER_URL', value: 'https://${acr.properties.loginServer}' }
        { name: 'DOCKER_REGISTRY_SERVER_USERNAME', value: acr.listCredentials().username }
        { name: 'DOCKER_REGISTRY_SERVER_PASSWORD', value: acr.listCredentials().passwords[0].value }
        { name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE', value: 'false' }
        { name: 'APPINSIGHTS_INSTRUMENTATIONKEY', value: appInsights.properties.InstrumentationKey }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'API_PORT', value: '3001' }
        { name: 'WEBSITES_PORT', value: '3001' }
      ]
    }
    httpsOnly: true
  }
}

// ============================================================
// 9. Web App Service (Next.js frontend)
// ============================================================
resource webApp 'Microsoft.Web/sites@2023-12-01' = {
  name: 'app-web-${suffix}'
  // Vanity: schools.oakville.directory → this App Service
  location: location
  tags: union(commonTags, {
    ResourceType: 'AppService'
    Purpose: 'Next.js directory website frontend'
    Component: 'Frontend'
    Runtime: 'Node.js'
  })
  kind: 'app,linux,container'
  properties: {
    serverFarmId: appServicePlan.id
    siteConfig: {
      linuxFxVersion: 'DOCKER|${acr.properties.loginServer}/${projectName}-web:latest'
      alwaysOn: true
      httpLoggingEnabled: true
      appSettings: [
        { name: 'NEXT_PUBLIC_API_URL', value: 'https://${apiApp.properties.defaultHostName}' }
        { name: 'DOCKER_REGISTRY_SERVER_URL', value: 'https://${acr.properties.loginServer}' }
        { name: 'DOCKER_REGISTRY_SERVER_USERNAME', value: acr.listCredentials().username }
        { name: 'DOCKER_REGISTRY_SERVER_PASSWORD', value: acr.listCredentials().passwords[0].value }
        { name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE', value: 'false' }
        { name: 'APPINSIGHTS_INSTRUMENTATIONKEY', value: appInsights.properties.InstrumentationKey }
        { name: 'APPLICATIONINSIGHTS_CONNECTION_STRING', value: appInsights.properties.ConnectionString }
        { name: 'WEBSITES_PORT', value: '3000' }
      ]
    }
    httpsOnly: true
  }
}

// ============================================================
// 10. Container App Environment + Worker (Playwright)
// ============================================================
resource containerAppEnv 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: 'worker-env-${shortSuffix}'
  location: location
  tags: union(commonTags, {
    ResourceType: 'ContainerAppEnvironment'
    Purpose: 'Container app environment for background workers'
  })
  properties: {
    appLogsConfiguration: {
      destination: 'log-analytics'
      logAnalyticsConfiguration: {
        customerId: logAnalytics.properties.customerId
        sharedKey: logAnalytics.listKeys().primarySharedKey
      }
    }
  }
}

resource schedulerWorker 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'wkr-sched-${shortSuffix}'
  location: location
  tags: union(commonTags, {
    ResourceType: 'ContainerApp'
    Purpose: 'Cron scheduler and crawler workers'
    Component: 'Scheduler'
    Runtime: 'Node.js'
  })
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        { name: 'acr-password', value: acr.listCredentials().passwords[0].value }
        { name: 'database-url', value: 'postgresql://${dbAdminUser}:${dbAdminPassword}@${postgres.properties.fullyQualifiedDomainName}:5432/oakville_schools?sslmode=require' }
        { name: 'redis-url', value: 'rediss://:${redis.listKeys().primaryKey}@${redis.properties.hostName}:${redis.properties.sslPort}' }
      ]
    }
    template: {
      containers: [
        {
          name: 'scheduler'
          image: '${acr.properties.loginServer}/${projectName}-api:latest'
          command: ['node', 'dist/scheduler/jobScheduler.js']
          resources: {
            cpu: json('0.5')
            memory: '1Gi'
          }
          env: [
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'REDIS_URL', secretRef: 'redis-url' }
          ]
        }
      ]
      scale: {
        minReplicas: 1
        maxReplicas: 1
      }
    }
  }
}

resource playwrightWorker 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'wkr-playwright-${shortSuffix}'
  location: location
  tags: union(commonTags, {
    ResourceType: 'ContainerApp'
    Purpose: 'Playwright browser automation worker'
    Component: 'PlaywrightWorker'
    Runtime: 'Node.js + Chromium'
  })
  properties: {
    managedEnvironmentId: containerAppEnv.id
    configuration: {
      registries: [
        {
          server: acr.properties.loginServer
          username: acr.listCredentials().username
          passwordSecretRef: 'acr-password'
        }
      ]
      secrets: [
        { name: 'acr-password', value: acr.listCredentials().passwords[0].value }
        { name: 'database-url', value: 'postgresql://${dbAdminUser}:${dbAdminPassword}@${postgres.properties.fullyQualifiedDomainName}:5432/oakville_schools?sslmode=require' }
        { name: 'redis-url', value: 'rediss://:${redis.listKeys().primaryKey}@${redis.properties.hostName}:${redis.properties.sslPort}' }
      ]
    }
    template: {
      containers: [
        {
          name: 'playwright-worker'
          image: '${acr.properties.loginServer}/${projectName}-playwright:latest'
          resources: {
            cpu: json('1.0')
            memory: '2Gi'
          }
          env: [
            { name: 'DATABASE_URL', secretRef: 'database-url' }
            { name: 'REDIS_URL', secretRef: 'redis-url' }
          ]
        }
      ]
      scale: {
        minReplicas: 0
        maxReplicas: 2
      }
    }
  }
}

// ============================================================
// 11. Azure Front Door — Vanity URLs + CDN
// Routes:
//   schools.oakville.directory  → Web App (frontend)
//   api.oakville.directory      → API App (backend)
//   <default>.azurefd.net/      → Web App
//   <default>.azurefd.net/api/* → API App
// ============================================================
resource frontDoor 'Microsoft.Cdn/profiles@2024-02-01' = {
  name: 'net-fd-${suffix}'
  location: 'global'
  tags: union(commonTags, {
    ResourceType: 'FrontDoor'
    Purpose: 'Vanity URL routing, CDN, and WAF'
    Component: 'Network'
    VanityURL_Web: !empty(customDomainWeb) ? customDomainWeb : 'app-web-${suffix}.azurewebsites.net'
    VanityURL_API: !empty(customDomainApi) ? customDomainApi : 'app-api-${suffix}.azurewebsites.net'
  })
  sku: {
    name: 'Standard_AzureFrontDoor'
  }
}

// --- Front Door Endpoint (the *.azurefd.net vanity hostname) ---
resource fdEndpoint 'Microsoft.Cdn/profiles/afdEndpoints@2024-02-01' = {
  parent: frontDoor
  name: 'ep-${projectName}'
  location: 'global'
  tags: union(commonTags, {
    ResourceType: 'FrontDoorEndpoint'
    Purpose: 'Primary vanity endpoint'
  })
  properties: {
    enabledState: 'Enabled'
  }
}

// --- Origin Group: Web Frontend ---
resource ogWeb 'Microsoft.Cdn/profiles/originGroups@2024-02-01' = {
  parent: frontDoor
  name: 'og-web-frontend'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
    }
    healthProbeSettings: {
      probePath: '/'
      probeRequestType: 'HEAD'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 60
    }
  }
}

resource originWeb 'Microsoft.Cdn/profiles/originGroups/origins@2024-02-01' = {
  parent: ogWeb
  name: 'origin-web'
  properties: {
    hostName: webApp.properties.defaultHostName
    httpPort: 80
    httpsPort: 443
    originHostHeader: webApp.properties.defaultHostName
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
  }
}

// --- Origin Group: API Backend ---
resource ogApi 'Microsoft.Cdn/profiles/originGroups@2024-02-01' = {
  parent: frontDoor
  name: 'og-api-backend'
  properties: {
    loadBalancingSettings: {
      sampleSize: 4
      successfulSamplesRequired: 3
    }
    healthProbeSettings: {
      probePath: '/api/health'
      probeRequestType: 'GET'
      probeProtocol: 'Https'
      probeIntervalInSeconds: 60
    }
  }
}

resource originApi 'Microsoft.Cdn/profiles/originGroups/origins@2024-02-01' = {
  parent: ogApi
  name: 'origin-api'
  properties: {
    hostName: apiApp.properties.defaultHostName
    httpPort: 80
    httpsPort: 443
    originHostHeader: apiApp.properties.defaultHostName
    priority: 1
    weight: 1000
    enabledState: 'Enabled'
  }
}

// --- Route: /api/* → API Backend ---
resource routeApi 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = {
  parent: fdEndpoint
  name: 'route-api'
  properties: {
    originGroup: {
      id: ogApi.id
    }
    supportedProtocols: ['Https']
    patternsToMatch: ['/api/*']
    forwardingProtocol: 'HttpsOnly'
    httpsRedirect: 'Enabled'
    linkToDefaultDomain: 'Enabled'
    enabledState: 'Enabled'
  }
  dependsOn: [originApi]
}

// --- Route: /* → Web Frontend (catch-all) ---
resource routeWeb 'Microsoft.Cdn/profiles/afdEndpoints/routes@2024-02-01' = {
  parent: fdEndpoint
  name: 'route-web'
  properties: {
    originGroup: {
      id: ogWeb.id
    }
    supportedProtocols: ['Https']
    patternsToMatch: ['/*']
    forwardingProtocol: 'HttpsOnly'
    httpsRedirect: 'Enabled'
    linkToDefaultDomain: 'Enabled'
    enabledState: 'Enabled'
  }
  dependsOn: [originWeb]
}

// --- Custom Domain: Web vanity (if provided) ---
resource customDomainWebResource 'Microsoft.Cdn/profiles/customDomains@2024-02-01' = if (!empty(customDomainWeb)) {
  parent: frontDoor
  name: 'cd-web'
  properties: {
    hostName: customDomainWeb
    tlsSettings: {
      certificateType: 'ManagedCertificate'
      minimumTlsVersion: 'TLS12'
    }
  }
}

// --- Custom Domain: API vanity (if provided) ---
resource customDomainApiResource 'Microsoft.Cdn/profiles/customDomains@2024-02-01' = if (!empty(customDomainApi)) {
  parent: frontDoor
  name: 'cd-api'
  properties: {
    hostName: customDomainApi
    tlsSettings: {
      certificateType: 'ManagedCertificate'
      minimumTlsVersion: 'TLS12'
    }
  }
}

// ============================================================
// Outputs
// ============================================================
// --- Vanity URLs (clear demarcation) ---
output vanityWebUrl string = !empty(customDomainWeb) ? 'https://${customDomainWeb}' : 'https://${fdEndpoint.properties.hostName}'
output vanityApiUrl string = !empty(customDomainApi) ? 'https://${customDomainApi}' : 'https://${fdEndpoint.properties.hostName}/api'
output frontDoorEndpoint string = 'https://${fdEndpoint.properties.hostName}'

// --- Direct App Service URLs (internal) ---
output directApiUrl string = 'https://${apiApp.properties.defaultHostName}'
output directWebUrl string = 'https://${webApp.properties.defaultHostName}'

// --- Infrastructure ---
output acrLoginServer string = acr.properties.loginServer
output postgresHost string = postgres.properties.fullyQualifiedDomainName
output redisHost string = redis.properties.hostName
output storageAccountName string = storage.name
output appInsightsKey string = appInsights.properties.InstrumentationKey

// --- DNS Setup Instructions (when custom domain provided) ---
output dnsInstructions string = !empty(customDomainWeb) ? 'Create CNAME: ${customDomainWeb} → ${fdEndpoint.properties.hostName} AND ${customDomainApi} → ${fdEndpoint.properties.hostName}' : 'No custom domain configured. Default vanity: ${fdEndpoint.properties.hostName}'
