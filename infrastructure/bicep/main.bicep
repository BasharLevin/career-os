targetScope = 'resourceGroup'

@minLength(2)
@maxLength(12)
param environmentName string
param location string = resourceGroup().location
param sqlAdministratorLogin string
@secure()
param sqlAdministratorPassword string
param tags object = {}

var suffix = uniqueString(subscription().subscriptionId, resourceGroup().id, environmentName)
var baseName = 'careeros-${environmentName}'

module observability 'modules/observability.bicep' = {
  name: 'observability'
  params: { name: baseName, location: location, tags: tags }
}

module registry 'modules/registry.bicep' = {
  name: 'registry'
  params: { name: 'careeros${environmentName}${suffix}', location: location, tags: tags }
}

module platform 'modules/platform.bicep' = {
  name: 'platform'
  params: {
    name: baseName
    location: location
    logAnalyticsCustomerId: observability.outputs.logAnalyticsCustomerId
    logAnalyticsSharedKey: observability.outputs.logAnalyticsSharedKey
    tags: tags
  }
}

module data 'modules/data.bicep' = {
  name: 'data'
  params: {
    name: baseName
    storageAccountName: 'careeros${environmentName}${suffix}'
    sqlServerName: '${baseName}-${suffix}'
    location: location
    sqlAdministratorLogin: sqlAdministratorLogin
    sqlAdministratorPassword: sqlAdministratorPassword
    tags: tags
  }
}

output containerAppsEnvironmentId string = platform.outputs.containerAppsEnvironmentId
output containerRegistryName string = registry.outputs.name
output containerRegistryLoginServer string = registry.outputs.loginServer
output keyVaultName string = data.outputs.keyVaultName
output sqlServerFullyQualifiedDomainName string = data.outputs.sqlServerFullyQualifiedDomainName
output storageAccountName string = data.outputs.storageAccountName
