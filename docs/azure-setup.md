# Azure Functions Setup Guide

## Prerequisites
1. Azure CLI installed
2. Node.js (Latest LTS version)
3. Azure Functions Core Tools
4. Git repository access

## Step 1: Create Azure Resources

1. Create a new Azure Function App:
```bash
az functionapp create \
  --name scanandsign-api \
  --storage-account scanandsignstorage \
  --consumption-plan-location eastus \
  --resource-group scanandsign-rg \
  --runtime node \
  --runtime-version 18 \
  --functions-version 4
```

2. Create Azure Cosmos DB:
```bash
az cosmosdb create \
  --name scanandsign-db \
  --resource-group scanandsign-rg \
  --kind GlobalDocumentDB \
  --default-consistency-level Eventual
```

## Step 2: Local Development Setup

1. Initialize Azure Functions project:
```bash
func init backend --javascript
cd backend
```

2. Install dependencies:
```bash
npm install @azure/cosmos
npm install @azure/identity
```

3. Create function endpoints:
```bash
func new --name submitSignature --template "HTTP trigger"
func new --name getSignatures --template "HTTP trigger"
```

## Step 3: Environment Configuration

1. Create `local.settings.json` (add to .gitignore):
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "COSMOS_CONNECTION_STRING": "your_connection_string",
    "DATABASE_NAME": "scanandsign",
    "CONTAINER_NAME": "signatures"
  }
}
```

2. Create `config.js` for environment variables:
```javascript
module.exports = {
  database: {
    name: process.env.DATABASE_NAME || 'scanandsign',
    container: process.env.CONTAINER_NAME || 'signatures'
  }
};
```

## Step 4: GitHub Actions Setup

1. Create `.github/workflows/deploy.yml`:
```yaml
name: Deploy Azure Functions

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    
    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm install
      
    - name: Deploy to Azure Functions
      uses: Azure/functions-action@v1
      with:
        app-name: scanandsign-api
        package: backend
        publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

## Step 5: Security Best Practices

1. Never commit sensitive information:
   - Add `local.settings.json` to `.gitignore`
   - Use Azure Key Vault for production secrets
   - Use GitHub Secrets for CI/CD

2. Environment Variables:
   - Use Azure Function App Configuration for production
   - Use local.settings.json for development
   - Never hardcode secrets in code

3. CORS Configuration:
   - Configure allowed origins in Azure Function App
   - Use environment variables for CORS settings

## Step 6: Database Schema

```javascript
// Signature document structure
{
  id: string,          // Unique identifier
  data: string,        // Base64 encoded signature image
  color: string,       // Background color
  timestamp: string,   // ISO date string
  location: string,    // Optional location
  deviceId: string,    // For spam prevention
  gridPosition: {      // Position on the board
    col: number,
    row: number
  }
}
```

## Step 7: API Endpoints

### POST /api/submitSignature
- Accepts signature data
- Validates input
- Stores in Cosmos DB
- Returns success/failure

### GET /api/signatures
- Retrieves all signatures
- Supports pagination
- Returns array of signatures

## Step 8: Deployment

1. Deploy to Azure:
```bash
func azure functionapp publish scanandsign-api
```

2. Configure environment variables in Azure Portal:
   - COSMOS_CONNECTION_STRING
   - DATABASE_NAME
   - CONTAINER_NAME

## Step 9: Testing

1. Local testing:
```bash
func start
```

2. Test endpoints:
```bash
curl -X POST http://localhost:7071/api/submitSignature
curl http://localhost:7071/api/signatures
```

## Step 10: Monitoring

1. Set up Application Insights
2. Configure alerts
3. Monitor usage and costs 