param name string
param location string
param tags object

resource logs 'Microsoft.OperationalInsights/workspaces@2023-09-01' = {
  name: '${name}-logs'
  location: location
  tags: tags
  properties: { retentionInDays: 30 }
}

resource insights 'Microsoft.Insights/components@2020-02-02' = {
  name: '${name}-insights'
  location: location
  kind: 'web'
  tags: tags
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logs.id
  }
}

output applicationInsightsConnectionString string = insights.properties.ConnectionString
output logAnalyticsCustomerId string = logs.properties.customerId
@secure()
output logAnalyticsSharedKey string = logs.listKeys().primarySharedKey
