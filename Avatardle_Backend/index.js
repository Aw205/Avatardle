const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const fetch = require('node-fetch');
const { Pool } = require('pg');
const { HttpsProxyAgent } = require("https-proxy-agent");
const app = express();
const port = process.env.PORT || 6060;
const proxyAgent = new HttpsProxyAgent(process.env.FIXIE_URL);
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
});

app.use(express.json())
app.use(cors());

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

app.patch('/updateStats', (req, res) => {

    let sql = `UPDATE stats SET ${req.body.mode}_completion = ${req.body.mode}_completion + 1 `;
    pool.query(sql);
    return res.status(200);
});

app.get('/getLeaderboard', (req, res) => {

    let sql = `SELECT * FROM leaderboard ORDER BY id DESC`;
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
        text: `INSERT INTO leaderboard (username, guesses, time) VALUES ($1, $2, $3)`,
        values: [req.body.username, req.body.guesses, req.body.time],
    };

    pool.query(query, (err, queryRes) => {
        if (err) {
            console.error(err.message);
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