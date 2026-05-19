const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {

    const query = "SELECT *, TO_CHAR(created_at, 'HH24:MI') AS time FROM leaderboard ORDER BY id DESC";
    db.query(query, (err, queryRes) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }
        return res.json(queryRes.rows);
    });
});

router.post('/', (req, res) => {

    const query = {
        text: `INSERT INTO leaderboard (username, guesses, element) VALUES ($1, $2, $3)`,
        values: [req.body.username, req.body.guesses, req.body.element],
    };
    db.query(query, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.sendStatus(204);
    });
});

module.exports = router;