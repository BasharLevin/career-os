using '../main.bicep'

param environmentName = 'dev'
param location = 'swedencentral'
param sqlAdministratorLogin = 'careerosadmin'
param tags = {
  application: 'career-os'
  environment: 'development'
  managedBy: 'bicep'
}

// Supply sqlAdministratorPassword securely at deployment time; never commit it.
