const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/verifyToken')
const db = require('../db');

router.get('/', verifyToken, (req, res) => {

    const query = {
        text: 'SELECT * FROM discovered_characters WHERE user_id = $1',
        values: [req.user.user_id]
    }
    db.query(query, (err, queryRes) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }
        return res.json(queryRes.rows);
    });
});

router.patch('/', verifyToken, (req, res) => {

    const query = {
        text: 'INSERT INTO discovered_characters (user_id, character_id) VALUES ($1, $2) ON CONFLICT (user_id, character_id) DO UPDATE SET guess_count = discovered_characters.guess_count + 1',
        values: [req.user.user_id, req.body.character_id],
    };

    db.query(query, (err) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        return res.sendStatus(204);
    });
});

module.exports = router;