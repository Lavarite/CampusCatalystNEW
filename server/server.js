require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./src/db');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const port = 3001;
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Middleware to parse JSON bodies
app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes and origins

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const verifyGoogleToken = async (token) => {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
};

app.post('/api/login', async (req, res) => {
    const { email, password, token } = req.body;

    if (token) {
        // Google login
        try {
            const googleUser = await verifyGoogleToken(token);
            if (googleUser) {
                db.query('SELECT * FROM accounts WHERE email = ?', [googleUser.email], async (err, results) => {
                    if (err) throw err;
                    if (results.length > 0) {
                        const jwtToken = jwt.sign({ id: results[0].id, role: results[0].role }, process.env.JWT_SECRET, { expiresIn: '1d' });
                        res.json({ message: "Logged in successfully", token: jwtToken });
                    } else {
                        res.status(401).json({ message: "Incorrect email or password" });
                    }
                });
            } else {
                res.status(401).json({ message: "Invalid Google token" });
            }
        } catch (error) {
            res.status(401).json({ message: "Failed to authenticate with Google", error: error.toString() });
        }
    } else {
        // Regular login
        db.query('SELECT * FROM accounts WHERE email = ?', [email], async (err, results) => {
            if (err) throw err;
            if (results.length > 0) {
                if (password === results[0].password) {
                    const jwtToken = jwt.sign({ id: results[0].id, role: results[0].role }, process.env.JWT_SECRET, { expiresIn: '1d' });
                    res.json({ message: "Logged in successfully", token: jwtToken });
                } else {
                    res.status(401).json({ message: "Incorrect email or password" });
                }
            } else {
                res.status(401).json({ message: "Incorrect email or password" });
            }
        });
    }
});

function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

app.get('/api/validateToken', authenticateToken, (req, res) => {
    console.log(req.user);
    if (req.user) {
        res.json({ valid: true, id: req.user.id, role: req.user.role });
    } else {
        res.json({ valid: false });
    }
});

const getLessons = (role, day = '', month = '', year = '', id = '') => {
    day = day || new Date().getDate();
    month = month || new Date().getMonth() + 1; // JavaScript month starts at 0
    year = year || new Date().getFullYear();

    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const timestamp = new Date(dateString);
    const setDay = timestamp.getDay() || 7;
    const weekOfYear = Math.floor((timestamp - new Date(timestamp.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000)) + 1;
    const weekType = (weekOfYear % 2 === 0) ? 'B' : 'A';

    const accountIdWhere = id ? `AND (cls.account_id = '${id}' OR clt.account_id = '${id}') ` : '';

    const query = `SELECT c.id, c.name, cs.day_of_week, cs.session_start, cs.session_end, cs.classroom
                   FROM class_schedule cs
                            INNER JOIN classes c ON cs.class_id = c.id
                            INNER JOIN class_students cls ON c.id = cls.class_id
                            INNER JOIN class_teachers clt ON c.id = clt.class_id
                   WHERE cs.day_of_week = '${setDay}' AND (cs.week = '${weekType}' OR cs.week = 'Both')
                       ${accountIdWhere}
                   ORDER BY cs.session_start`;

    return new Promise((resolve, reject) => {
        db.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
};

// Express route to get lessons
app.get('/api/lessons', async (req, res) => {
    const { role, day, month, year, id } = req.query;
    try {
        const lessons = await getLessons(role, day, month, year, id);
        res.json(lessons);
    } catch (error) {
        res.status(500).send('Server error');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}.`);
});
