param name string
param location string
param tags object

resource registry 'Microsoft.ContainerRegistry/registries@2023-11-01-preview' = {
  name: take(replace(name, '-', ''), 50)
  location: location
  tags: tags
  sku: { name: 'Basic' }
  properties: { adminUserEnabled: false }
}

output id string = registry.id
output name string = registry.name
output loginServer string = registry.properties.loginServer
