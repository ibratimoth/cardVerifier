const {Sequelize} =  require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    logging: false
});

const connectionDB = async() => {
    try {
        await sequelize.authenticate();
        console.log(`Coonected to database ${process.env.DB_DATABASE}`)
    } catch (error) {
        console.log('Error while connecting to database:', error);
    }
}

module.exports = {
    connectionDB,
    sequelize
}
