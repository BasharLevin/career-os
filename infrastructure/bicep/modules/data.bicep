param name string
param storageAccountName string
param sqlServerName string
param location string
param sqlAdministratorLogin string
@secure()
param sqlAdministratorPassword string
param tags object

resource vault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: take('${name}-kv', 24)
  location: location
  tags: tags
  properties: {
    enableRbacAuthorization: true
    enableSoftDelete: true
    enablePurgeProtection: true
    sku: { family: 'A', name: 'standard' }
    tenantId: tenant().tenantId
  }
}

resource storage 'Microsoft.Storage/storageAccounts@2023-05-01' = {
  name: take(replace(storageAccountName, '-', ''), 24)
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: { name: 'Standard_LRS' }
  properties: {
    allowBlobPublicAccess: false
    minimumTlsVersion: 'TLS1_2'
    supportsHttpsTrafficOnly: true
  }
}

resource sqlServer 'Microsoft.Sql/servers@2023-08-01-preview' = {
  name: sqlServerName
  location: location
  tags: tags
  properties: {
    administratorLogin: sqlAdministratorLogin
    administratorLoginPassword: sqlAdministratorPassword
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

resource database 'Microsoft.Sql/servers/databases@2023-08-01-preview' = {
  parent: sqlServer
  name: 'career-os'
  location: location
  tags: tags
  sku: { name: 'Basic', tier: 'Basic' }
}

output keyVaultName string = vault.name
output sqlDatabaseId string = database.id
output sqlServerFullyQualifiedDomainName string = sqlServer.properties.fullyQualifiedDomainName
output storageAccountName string = storage.name
