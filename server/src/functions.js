const jwt = require("jsonwebtoken");
const db = require("./db");
const {OAuth2Client} = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const verifyGoogleToken = async (token) => {
    const ticket = await client.verifyIdToken({
        idToken: token,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    return ticket.getPayload();
};

const verifyLogin = async (email, password, token) => {
    if (token) {
        // Google login
        try {
            const googleUser = await verifyGoogleToken(token);
            if (googleUser) {
                return new Promise((resolve, reject) => {
                    db.query('SELECT * FROM accounts WHERE email = ?', [googleUser.email], async (err, results) => {
                        if (err) throw err;
                        if (results.length > 0) {
                            const jwtToken = jwt.sign({
                                id: results[0].id,
                                role: results[0].role
                            }, process.env.JWT_SECRET, {expiresIn: '1d'});
                            resolve({message: "Logged in successfully", token: jwtToken});
                        } else {
                            reject("Incorrect email or password");
                        }
                    });
                });
            } else {
                throw "Invalid Google token";
            }
        } catch (error) {
            throw "Failed to authenticate with Google" + error.toString();
        }
    } else {
        return new Promise((resolve, reject) => {
            db.query('SELECT * FROM accounts WHERE email = ?', [email], async (err, results) => {
                if (err) throw err;
                if (results.length > 0) {
                    if (password === results[0].password) {
                        const jwtToken = jwt.sign({
                            id: results[0].id,
                            role: results[0].role
                        }, process.env.JWT_SECRET, {expiresIn: '1d'});
                        resolve({message: "Logged in successfully", token: jwtToken});
                    } else {
                        reject("Incorrect email or password");
                    }
                } else {
                    reject("Incorrect email or password");
                }
            });
        });
    }
}

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

const getLessons = (token, day = '', month = '', year = '') => {
    const {id, role} = jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return {id: 'error', role: 'error'};
        return user;
    });
    day = day || new Date().getDate();
    month = month || new Date().getMonth() + 1; // JavaScript month starts at 0
    year = year || new Date().getFullYear();

    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const timestamp = new Date(dateString);
    const setDay = timestamp.getDay() || 7;
    const weekOfYear = Math.floor((timestamp - new Date(timestamp.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000)) + 1;
    const weekType = (weekOfYear % 2 === 0) ? 'B' : 'A';

    const query = `SELECT c.id, c.name, cs.day_of_week, cs.session_start, cs.session_end, cs.classroom
                   FROM class_schedule cs
                            INNER JOIN classes c ON cs.class_id = c.id
                            INNER JOIN class_${role}s cr ON c.id = cr.class_id
                   WHERE cs.day_of_week = '${setDay}' AND (cs.week = '${weekType}' OR cs.week = 'Both') 
                   AND cr.account_id = '${id}' 
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

const getClasses = async (token, sneak)=> {
    const {id, role} = jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return {id: 'error', role: 'error'};
        return user;
    });
    const query = `SELECT * FROM classes c
                            JOIN class_${role}s cr ON c.id = cr.class_id
                            WHERE cr.account_id = ${id}`;
    return new Promise((resolve, reject) => {
        let data = [];
        db.query(query, (error, results) => {
            if (error) {
                reject(error);
            } else {
                data = results;
            }
        });
        if (sneak) {
            const announcementQuery = `SELECT an.*
                                       FROM announcements an
                                                INNER JOIN (
                                           SELECT DISTINCT DATE(deadline_date) AS deadline_date
                                           FROM announcements
                                       WHERE DATE(deadline_date) > CURRENT_DATE
                                       ORDER BY DATE(deadline_date) ASC
                                           LIMIT 2
                                           ) AS subquery ON DATE(an.deadline_date) = subquery.deadline_date
                                           JOIN class_students cr ON an.class_id = cr.class_id
                                       WHERE cr.account_id = 1
                                       ORDER BY DATE(an.deadline_date) ASC
                                           LIMIT 4;;
            `;
            db.query(announcementQuery, (error, result) => {
                console.log(result)
                if (error) reject(error);
                else resolve(data.map(item => ({ ...item, announcements: result.filter(announcement => announcement.class_id === item.id) })));
            });
        } else {
            resolve(data);
        }
    });
}

const getClass = async (classId, token) => {
    const {id: accountId, role} = jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return {id: 'error', role: 'error'};
        return user;
    });
    const queries = [
        {
            query: `SELECT * FROM classes WHERE id = ?;`,
            params: [classId]
        },
        {
            query: accountId
                ? `SELECT an.* FROM announcements an
                       JOIN student_announcements sa ON an.announcement_id = sa.announcement_id
                       WHERE an.class_id = ? AND sa.account_id = ?;`
                : `SELECT * FROM announcements WHERE class_id = ? ORDER BY assigned_date;`,
            params: accountId ? [classId, accountId] : [classId]
        },
        {
            query: accountId
                ? `SELECT * FROM attendance WHERE class_id = ? AND account_id = ?;`
                : `SELECT * FROM attendance WHERE class_id = ?;`,
            params: accountId ? [classId, accountId] : [classId]
        },
        {
            query: `SELECT * FROM class_schedule WHERE class_id = ?;`,
            params: [classId]
        },
        {
            query: `SELECT account_id FROM class_students WHERE class_id = ?;`,
            params: [classId]
        },
        {
            query: `SELECT account_id FROM class_teachers WHERE class_id = ?;`,
            params: [classId]
        },
        {
            query: `SELECT t.*, GROUP_CONCAT(ta.announcement_id ORDER BY ta.announcement_id) as announcement_ids
                     FROM topics t
                     LEFT JOIN topic_announcements ta ON t.topic_id = ta.topic_id
                     WHERE t.class_id = ?
                     GROUP BY t.topic_id;`,
            params: [classId]
        }
    ];

    try {
        const classExists = await new Promise((resolve, reject) => {
            const query = `SELECT name FROM classes WHERE id = ? AND ? REGEXP '^-?[0-9]+$';`;
            db.query(query, [classId, classId], (error, results) => {
                if (error) return resolve(false);
                resolve(results.length > 0);
            });
        });

        if (!classExists) {
            throw new Error('404');
        }

        if (accountId) {
            const isAuthorized = await new Promise((resolve, reject) => {
                const query = `
                    SELECT account_id FROM (
                        SELECT account_id FROM class_students WHERE class_id = ? AND account_id = ?
                        UNION
                        SELECT account_id FROM class_teachers WHERE class_id = ? AND account_id = ?
                    ) AS union_table LIMIT 1;
                `;
                db.query(query, [classId, accountId, classId, accountId], (error, results) => {
                    if (error) resolve(false);
                    resolve(results.length > 0);
                });
            });
            if (!isAuthorized) {
                throw new Error('401');
            }
        }

        const results = await Promise.all(queries.map(async ({ query, params }) => {
            return new Promise((resolve, reject) => {
                db.query(query, params, (error, result) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve(result);
                    }
                });
            });
        }));

        return {
            classData: results[0],
            announcements: results[1],
            attendance: results[2],
            schedule: results[3],
            students: results[4],
            teachers: results[5],
            topics: results[6].map(topic => ({
                ...topic,
                announcement_ids: topic.announcement_ids ? topic.announcement_ids.split(',').map(Number) : []
            }))
        };
    } catch (error) {
        throw error;
    }
};

const getTodo = async (token) => {
    const {id: accountId, role} = jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return {id: 'error', role: 'error'};
        return user;
    });
    const queries = [
        {
            query: `SELECT c.name, c.id
                    FROM classes c
                             JOIN class_students cs ON c.id = cs.class_id
                    WHERE cs.account_id = ?;`,
            params: [accountId]
        },
        {
            query: `SELECT a.class_id, a.announcement_id, a.title, a.deadline_date
                    FROM announcements a
                             JOIN class_students cs ON a.class_id = cs.class_id
                    WHERE cs.account_id = ? AND a.type = 'as';`,
            params: [accountId]
        },
    ]

    const results = await Promise.all(queries.map(async ({query, params}) => {
        return new Promise((resolve, reject) => {
            db.query(query, params, (error, result) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }));

    return {
        classes: results[0],
        announcements: results[1],
    };
}




module.exports = {
    verifyGoogleToken,
    verifyLogin,
    authenticateToken,
    getLessons,
    getClasses,
    getClass,
    getTodo,
};
