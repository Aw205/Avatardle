const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {

    const query = {
        text: "SELECT *, TO_CHAR(created_at, 'HH24:MI') AS time FROM leaderboard WHERE mode = $1 ORDER BY id DESC",
        values: [req.query.mode]
    };
    db.query(query, (err, queryRes) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }
        return res.json(queryRes.rows);
    });
});

router.post('/', (req, res) => {

    const query = {
        text: `INSERT INTO leaderboard (username, mode, guesses, element) VALUES ($1, $2, $3, $4)`,
        values: [req.body.username, req.body.mode, req.body.guesses, req.body.element],
    };
    db.query(query, (err) => {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: err.message });
        }
        return res.sendStatus(204);
    });
});

router.get('/blitz', (req, res) => {

    const query = {
        text: "SELECT *, TO_CHAR(created_at, 'HH24:MI') AS time FROM blitz_leaderboard WHERE mode = $1 ORDER BY score DESC",
        values: [req.query.mode]
    };
    db.query(query, (err, queryRes) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }
        return res.json(queryRes.rows);
    });
});

router.post('/blitz', (req, res) => {

    const query = {
        text: `INSERT INTO blitz_leaderboard (username, mode, score, streak, element) VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (username) DO UPDATE SET score = EXCLUDED.score, streak = EXCLUDED.streak`,
        values: [req.body.username, req.body.mode, req.body.score, req.body.streak, req.body.element],
    };
    db.query(query, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.sendStatus(204);
    });
});

module.exports = router;