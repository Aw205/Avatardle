const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const verifyToken = require('../middleware/verifyToken');
const db = require('../db');

const AUTH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 30 * 24 * 60 * 60 * 1000
};
const DEFAULT_ELEMENTS = ["Fire", "Air", "Water", "Earth"];

function getRandomElement() {
    return DEFAULT_ELEMENTS[Math.floor(Math.random() * DEFAULT_ELEMENTS.length)];
}

function issueAuthCookie(res, user) {
    const token = jwt.sign({ username: user.username, user_id: user.user_id }, process.env.JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, AUTH_COOKIE_OPTIONS);
}

async function createUserWithProfile(client, userQuery, userValues) {
    const userRes = await client.query(userQuery, userValues);
    const user_id = userRes.rows[0].user_id;

    await client.query('INSERT INTO user_profiles (user_id, element) VALUES ($1, $2);', [user_id, getRandomElement()]);

    return { user_id, username: userValues[0] };
}

router.get("/me", verifyToken, async (req, res) => {
    try {
        const queryRes = await db.query({
            text: `SELECT * FROM user_profiles WHERE user_id = $1`,
            values: [req.user.user_id]
        });
        if (queryRes.rows.length === 0) {
            return res.sendStatus(404);
        }
        return res.json({ ...queryRes.rows[0], username: req.user.username });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

router.post("/signup", async (req, res) => {

    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: "Missing fields" });
    }
    const client = await db.connect();
    const hashed = await bcrypt.hash(password, 10);
    try {
        await client.query('BEGIN');
        await createUserWithProfile(client, 'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING user_id;', [username, hashed]);
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

router.post("/login", async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Missing fields" });
    }

    try {
        const queryRes = await db.query({
            text: "SELECT * FROM users WHERE username = $1",
            values: [username],
        });
        const user = queryRes.rows[0];
        if (!user || !user.password_hash) {
            return res.sendStatus(401);
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.sendStatus(401);
        }

        issueAuthCookie(res, user);
        return res.json({ username: username });
    } catch (err) {
        console.error(err.message);
        return res.status(500).json({ error: err.message });
    }
});

router.post("/logout", (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        secure: true,
        sameSite: "lax"
    });
    return res.sendStatus(204);
});

router.get('/discord', (req, res) => {

    const state = crypto.randomBytes(16).toString('hex');

    res.cookie('discord_oauth_state', state, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 10 * 60 * 1000,
    });

    const params = new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        redirect_uri: "https://api.avatardle.com/auth/discord/callback",
        response_type: 'code',
        scope: 'identify',
        state,
    });

    res.redirect(`https://discord.com/oauth2/authorize?${params}`);
});

router.get('/discord/callback', async (req, res) => {

    const { code, state } = req.query;
    if (!code || state !== req.cookies.discord_oauth_state) {
        return res.sendStatus(400);
    }
    res.clearCookie('discord_oauth_state');
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: process.env.DISCORD_CLIENT_ID,
            client_secret: process.env.DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: "https://api.avatardle.com/auth/discord/callback",
        }),
    });

    if (!tokenRes.ok) {
        return res.sendStatus(401);
    }
    const tokenData = await tokenRes.json();
    const userRes = await fetch('https://discord.com/api/users/@me', {
        headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
        },
    });
    if (!userRes.ok) {
        return res.sendStatus(401);
    }
    const discordUser = await userRes.json();
    let queryParams = new URLSearchParams({
        username: discordUser.username,
        id: discordUser.id,
        avatar: discordUser.avatar
    });

    const query = {
        text: 'SELECT * FROM users WHERE discord_id = $1',
        values: [discordUser.id],
    };
    db.query(query, async (err, queryRes) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (queryRes.rows.length == 0) {
            return res.redirect(`https://avatardle.com/complete-profile?${queryParams.toString()}`);
        }
        const user = queryRes.rows[0];
        if (!user) {
            return res.sendStatus(401);
        }
        issueAuthCookie(res, user);
        return res.redirect('https://avatardle.com');
    });
});

router.post('/discord/signup', async (req, res) => {

    const { username, discord_id } = req.body;
    const client = await db.connect();
    try {
        await client.query('BEGIN');
        const user = await createUserWithProfile(client, 'INSERT INTO users (username, discord_id) VALUES ($1, $2) RETURNING user_id;', [username, discord_id]);
        await client.query('COMMIT');

        issueAuthCookie(res, user);
        return res.json({ username: username });

    } catch (e) {
        await client.query('ROLLBACK');
        if (e.code === '23505') {
            return res.status(409).json({ constraint: e.constraint });
        }
        res.status(500).json({ error: "Internal Server Error" });
    } finally {
        client.release();
    }
});

module.exports = router;
