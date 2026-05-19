const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const fetch = require('node-fetch');
const { HttpsProxyAgent } = require("https-proxy-agent");
const cookieParser = require("cookie-parser");

const db = require('./db');
const verifyToken = require('./middleware/verifyToken');

const app = express();
const port = process.env.PORT || 6060;
const proxyAgent = new HttpsProxyAgent(process.env.FIXIE_URL);

const allowedOrigins = [
    "http://localhost:4200",
    "https://avatardle.com"
];
const authRoutes = require('./routes/auth');
const discoveredCharactersRoutes = require('./routes/discovered-characters');
const leaderboardRoutes = require('./routes/leaderboard');
const statsRoutes = require('./routes/stats');
const userRoutes = require('./routes/users');

app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true
}));

app.use('/auth', authRoutes);
app.use('/discovered-characters', discoveredCharactersRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/stats', statsRoutes);
app.use('/users', userRoutes);

app.get('/getCharacters', (req, res) => {

    let sql = "SELECT * FROM characters";
    db.query(sql, (err, queryRes) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }
        return res.json(queryRes.rows);
    });
});

app.patch('/updateProfile', verifyToken, (req, res) => {

    const query = {
        text: `UPDATE user_profiles SET bio = $1, element = $2, favorite_characters = $3, favorite_ship = $4 WHERE user_id = $5`,
        values: [req.body.bio, req.body.element, req.body.favorite_characters, req.body.favorite_ship, req.user.user_id]
    };

    db.query(query, (err, queryRes) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.sendStatus(204);
    });
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