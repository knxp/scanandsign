const { CosmosClient } = require('@azure/cosmos');
const config = require('../config');

module.exports = async function (context, req) {
    try {
        // Validate request
        if (!req.body || !req.body.data || !req.body.color || !req.body.gridPosition) {
            context.res = {
                status: 400,
                body: { error: 'Missing required fields' }
            };
            return;
        }

        // Initialize Cosmos DB client
        const client = new CosmosClient({
            endpoint: process.env.COSMOS_ENDPOINT,
            key: process.env.COSMOS_KEY
        });

        const database = client.database(config.database.name);
        const container = database.container(config.database.container);

        // Create signature document
        const signature = {
            id: Date.now().toString(),
            data: req.body.data,
            color: req.body.color,
            timestamp: new Date().toISOString(),
            location: req.body.location || 'Unknown',
            deviceId: req.body.deviceId,
            gridPosition: req.body.gridPosition
        };

        // Save to Cosmos DB
        await container.items.create(signature);

        context.res = {
            status: 201,
            body: { message: 'Signature saved successfully', id: signature.id }
        };
    } catch (error) {
        context.log.error('Error saving signature:', error);
        context.res = {
            status: 500,
            body: { error: 'Internal server error' }
        };
    }
}; 