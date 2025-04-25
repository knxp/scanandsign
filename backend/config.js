module.exports = {
    database: {
        name: process.env.DATABASE_NAME || 'scanandsign',
        container: process.env.CONTAINER_NAME || 'signatures'
    }
}; 