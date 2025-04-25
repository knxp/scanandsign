const { CosmosClient } = require('@azure/cosmos');
const config = require('../config');

module.exports = async function (context, req) {
    try {
        // Initialize Cosmos DB client
        const client = new CosmosClient({
            endpoint: process.env.COSMOS_ENDPOINT,
            key: process.env.COSMOS_KEY
        });

        const database = client.database(config.database.name);
        const container = database.container(config.database.container);

        // Get query parameters
        const limit = parseInt(req.query.limit) || 100;
        const offset = parseInt(req.query.offset) || 0;

        // Query signatures
        const querySpec = {
            query: 'SELECT * FROM c ORDER BY c.timestamp DESC OFFSET @offset LIMIT @limit',
            parameters: [
                { name: '@offset', value: offset },
                { name: '@limit', value: limit }
            ]
        };

        const { resources: signatures } = await container.items.query(querySpec).fetchAll();

        context.res = {
            status: 200,
            body: signatures
        };
    } catch (error) {
        context.log.error('Error retrieving signatures:', error);
        context.res = {
            status: 500,
            body: { error: 'Internal server error' }
        };
    }
}; 