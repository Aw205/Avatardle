const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const fetch = require('node-fetch');
const { Pool } = require('pg');
const { HttpsProxyAgent } = require("https-proxy-agent");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 6060;
const proxyAgent = new HttpsProxyAgent(process.env.FIXIE_URL);
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
});
const allowedOrigins = [
    "http://localhost:4200",
    "https://avatardle.com/"
];

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

app.get('/getStats', (req, res) => {

    let sql = "SELECT * FROM stats WHERE type='daily'";

    pool.query(sql, (err, queryRes) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }
        return res.json(queryRes.rows[0]);
    });
});

app.get('/getCharacters', (req, res) => {

    let sql = "SELECT * FROM characters";

    pool.query(sql, (err, queryRes) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }
        return res.json(queryRes.rows);
    });
});

app.patch('/updateStats', (req, res) => {

    let sql = `UPDATE stats SET ${req.body.mode}_completion = ${req.body.mode}_completion + 1 `;
    pool.query(sql);
    return res.status(200);
});

app.get('/getLeaderboard', (req, res) => {

    let sql = `SELECT *, TO_CHAR(created_at, 'HH24:MI') AS time FROM leaderboard ORDER BY id DESC`;
    pool.query(sql, (err, queryRes) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }
        return res.json(queryRes.rows);
    });
});

app.patch('/updateLeaderboard', (req, res) => {

    const query = {
        text: `INSERT INTO leaderboard (username, guesses, element) VALUES ($1, $2, $3)`,
        values: [req.body.username, req.body.guesses, req.body.element],
    };

    pool.query(query, (err, queryRes) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        return res.sendStatus(204);
    });
});

app.get('/users/:username/discovered-characters', (req, res) => {

    const query = {
        text: `SELECT COUNT(*) FROM discovered_characters WHERE user_id = (SELECT user_id FROM users WHERE username = $1)`,
        values: [req.params.username]
    }
    pool.query(query, (err, queryRes) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }
        return res.json(queryRes.rows[0]);
    });
});

app.get('/discovered-characters', verifyToken, (req, res) => {

    const query = {
        text: `SELECT * FROM discovered_characters WHERE user_id = $1`,
        values: [req.user.user_id]
    }
    pool.query(query, (err, queryRes) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }
        return res.json(queryRes.rows);
    });
});

app.patch('/discovered-characters', verifyToken, (req, res) => {

    const query = {
        text: `INSERT INTO discovered_characters (user_id, character_id) VALUES ($1, $2) ON CONFLICT (user_id, character_id) DO UPDATE SET guess_count = discovered_characters.guess_count + 1`,
        values: [req.user.user_id, req.body.character_id],
    };

    pool.query(query, (err, queryRes) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        return res.sendStatus(204);
    });
});

app.patch('/updateProfile', verifyToken, (req, res) => {

    const query = {
        text: `UPDATE user_profiles SET bio = $1, element = $2, favorite_characters = $3, favorite_ship = $4 WHERE user_id = $5`,
        values: [req.body.bio, req.body.element, req.body.favorite_characters, req.body.favorite_ship, req.user.user_id]
    };

    pool.query(query, (err, queryRes) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        return res.sendStatus(204);
    });
});

function verifyToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.sendStatus(401);
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.sendStatus(403);
    }
}

app.get("/me", verifyToken, (req, res) => {
    const query = {
        text: `SELECT * FROM user_profiles WHERE user_id = $1`,
        values: [req.user.user_id]
    }
    pool.query(query, (err, queryRes) => {
        res.json({ ...queryRes.rows[0], username: req.user.username });
    });
});

app.get("/users/:username", (req, res) => {
    const query = {
        text: `SELECT p.* FROM user_profiles p JOIN users u ON p.user_id = u.user_id WHERE u.username = $1`,
        values: [req.params.username]
    }
    pool.query(query, (err, queryRes) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        else if (queryRes.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(queryRes.rows[0]);
    });
});

app.post("/signup", async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Missing fields" });
    }
    const client = await pool.connect();
    const hashed = await bcrypt.hash(password, 10);
    try {
        await client.query('BEGIN');
        const query1 = 'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING user_id;';
        const userRes = await client.query(query1, [username, hashed]);
        const user_id = userRes.rows[0].user_id;
        const query2 = 'INSERT INTO user_profiles (user_id, element) VALUES ($1, $2);';
        const elements = ["Fire", "Air", "Water", "Earth"]
        const randElement = elements[Math.floor(Math.random() * elements.length)];
        await client.query(query2, [user_id, randElement]);
        await client.query('COMMIT');
        res.sendStatus(204);
    } catch (e) {
        await client.query('ROLLBACK');
        if (e.code === '23505') {
            return res.sendStatus(409);
        }
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        client.release();
    }
});

app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const query = {
        text: "SELECT * FROM users WHERE username = $1",
        values: [username],
    };
    pool.query(query, async (err, queryRes) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        const user = queryRes.rows[0];
        if (!user) {
            return res.status(401);
        }
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.sendStatus(401);
        }
        const token = jwt.sign({ username: user.username, user_id: user.user_id }, process.env.JWT_SECRET, { expiresIn: "7d" });
        res.cookie("token", token, { httpOnly: true, secure: true, sameSite: "none", maxAge: 604800000 });
        return res.json({ username: username });
    });
});

app.post("/logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "none"
    });
    return res.sendStatus(204);
});

app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});

cron.schedule('0 0 * * *', async () => {

    let query = `SELECT * FROM stats WHERE type='daily'`;
    pool.query(query, (err, queryRes) => {

        if (err) {
            return console.error(err.message);
        }

        const stats = queryRes.rows[0];
        const date = new Date().toLocaleDateString("en-US", { timeZone: "UTC" });
        const dailyStats = {
            content: `Today's stats ~ ${date}\n-# (\# of people completed)`,
            embeds: [
                {
                    title: `__${date}__`,
                    description: `👑 Classic - ${stats.classic_completion}\n💬 Quote - ${stats.quote_completion}\n🖼️ Picture - ${stats.picture_completion}\n🎵 Music - ${stats.music_completion}`,
                    color: 12092939
                }
            ]
        };
        fetch(process.env.DISCORD_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dailyStats),
            agent: proxyAgent
        }).then(response => {
            if (!response.ok) {
                throw new Error(`Discord error ${response.status}: ${response.statusText}`);
            }
            console.log("Discord webhook POST successful.");
        }).catch(error => {
            console.error("Discord webhook fetch error:", error);
        });
        let sql = `UPDATE stats SET classic_completion = 0, quote_completion = 0, picture_completion = 0, music_completion = 0 WHERE type='daily'; TRUNCATE TABLE leaderboard RESTART IDENTITY;`;
        pool.query(sql);
    });

});