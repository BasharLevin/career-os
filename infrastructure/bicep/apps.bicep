targetScope = 'resourceGroup'

param environmentName string
param location string = resourceGroup().location
param containerAppsEnvironmentId string
param containerRegistryName string
param imageTag string
param apiMinReplicas int = 1
param webMinReplicas int = 1
param workerMinReplicas int = 1
param tags object = {}

resource registry 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' existing = {
  name: containerRegistryName
}

var registryServer = registry.properties.loginServer
var acrPullRoleId = subscriptionResourceId(
  'Microsoft.Authorization/roleDefinitions',
  '7f951dda-4ed3-4680-a7ca-43fe172d538d'
)

resource api 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'careeros-${environmentName}-api'
  location: location
  tags: tags
  identity: { type: 'SystemAssigned' }
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    configuration: {
      ingress: { external: true, targetPort: 3001, transport: 'http' }
      registries: [{ server: registryServer, identity: 'system' }]
    }
    template: {
      containers: [{
        name: 'api'
        image: '${registryServer}/career-os-api:${imageTag}'
        env: [
          { name: 'NODE_ENV', value: 'production' }
          { name: 'API_PORT', value: '3001' }
          { name: 'APP_VERSION', value: imageTag }
          { name: 'LOG_LEVEL', value: 'info' }
        ]
        resources: { cpu: json('0.5'), memory: '1Gi' }
      }]
      scale: { minReplicas: apiMinReplicas, maxReplicas: 5 }
    }
  }
}

resource web 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'careeros-${environmentName}-web'
  location: location
  tags: tags
  identity: { type: 'SystemAssigned' }
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    configuration: {
      ingress: { external: true, targetPort: 3000, transport: 'http' }
      registries: [{ server: registryServer, identity: 'system' }]
    }
    template: {
      containers: [{
        name: 'web'
        image: '${registryServer}/career-os-web:${imageTag}'
        env: [{ name: 'NODE_ENV', value: 'production' }]
        resources: { cpu: json('0.5'), memory: '1Gi' }
      }]
      scale: { minReplicas: webMinReplicas, maxReplicas: 5 }
    }
  }
}

resource worker 'Microsoft.App/containerApps@2024-03-01' = {
  name: 'careeros-${environmentName}-worker'
  location: location
  tags: tags
  identity: { type: 'SystemAssigned' }
  properties: {
    managedEnvironmentId: containerAppsEnvironmentId
    configuration: { registries: [{ server: registryServer, identity: 'system' }] }
    template: {
      containers: [{
        name: 'worker'
        image: '${registryServer}/career-os-worker:${imageTag}'
        env: [
          { name: 'NODE_ENV', value: 'production' }
          { name: 'WORKER_HEALTH_PORT', value: '3002' }
          { name: 'APP_VERSION', value: imageTag }
          { name: 'LOG_LEVEL', value: 'info' }
        ]
        resources: { cpu: json('0.5'), memory: '1Gi' }
      }]
      scale: { minReplicas: workerMinReplicas, maxReplicas: 3 }
    }
  }
}

resource apiAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(registry.id, api.id, acrPullRoleId)
  scope: registry
  properties: { principalId: api.identity.principalId, principalType: 'ServicePrincipal', roleDefinitionId: acrPullRoleId }
}

resource webAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(registry.id, web.id, acrPullRoleId)
  scope: registry
  properties: { principalId: web.identity.principalId, principalType: 'ServicePrincipal', roleDefinitionId: acrPullRoleId }
}

resource workerAcrPull 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(registry.id, worker.id, acrPullRoleId)
  scope: registry
  properties: { principalId: worker.identity.principalId, principalType: 'ServicePrincipal', roleDefinitionId: acrPullRoleId }
}

output apiUrl string = 'https://${api.properties.configuration.ingress.fqdn}'
output webUrl string = 'https://${web.properties.configuration.ingress.fqdn}'
