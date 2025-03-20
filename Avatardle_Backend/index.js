const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { Pool } = require('pg');
const app = express();
const port = process.env.PORT || 6060;
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

app.listen(port, () => {
    console.log(`Now listening on port ${port}`);
});

cron.schedule('0 0 * * *', () => {
    let sql = `UPDATE stats SET classic_completion = 0, quote_completion = 0, picture_completion = 0 WHERE type='daily'`;
    pool.query(sql);
});