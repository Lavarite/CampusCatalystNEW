require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const func = require('./src/functions');

const app = express();
const port = 3001;

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes and origins

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/api/login', async (req, res) => {
    const { email, password, token } = req.body;
    if (!((email && password) || token)) {
        res.status(401).send("Unauthorised");
    }
    try {
        const loginStaus = await func.verifyLogin(email, password, token);
        console.log(loginStaus);
        res.json(loginStaus);
    } catch (error) {
        res.status(401).send(error);
    }
});

app.get('/api/validateToken', func.authenticateToken, (req, res) => {
    if (req.user) {
        res.json({ valid: true, id: req.user.id, role: req.user.role });
    } else {
        res.json({ valid: false });
    }
});

app.get('/api/lessons', async (req, res) => {
    const { token, day, month, year } = req.query;
    try {
        const lessons = await func.getLessons(token, day, month, year);
        res.json(lessons);
    } catch (error) {
        res.status(500).send('Server error');
    }
});

app.get('/api/classes', async (req, res) => {
    const {token, sneak} = req.query;
    try {
        const classes = await func.getClasses(token, sneak);
        res.json(classes);
    } catch (error) {
        res.status(500).send('Server error')
    }
});

app.get('/api/class', async (req, res) => {
    const {id: classId, token} = req.query;
    try {
        const classData = await func.getClass(classId, token);
        res.json(classData);
    } catch (error) {
        if (error.message) res.status(parseInt(error.message)).send('');
        else res.status(500).send('');
    }
});

app.get('/api/user/todo', async (req, res) => {
    const {token} = req.query;
    try {
        const classData = await func.getTodo(token);
        res.json(classData);
    } catch (error) {
        if (error.message) res.status(parseInt(error.message)).send('');
        else res.status(500).send('');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
});
