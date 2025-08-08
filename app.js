const express  = require('express');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path')
const {connectionDB} = require('./config/db');
const cardRoutes = require('./routes/cardRoutes');

dotenv.config();
const app = express();

app.use(express.json());
app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('forbidden')
})
app.use('/card', cardRoutes);

const PORT = process.env.PORT || 3004;
const server = app.listen(PORT , () => {
    console.log(`Port is running on port ${PORT} on localhost http://localhost:3004`)
});

module.exports = server;
connectionDB()