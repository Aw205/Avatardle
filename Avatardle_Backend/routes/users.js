const express = require('express');
const router = express.Router();
const db = require('../db');

router.get("/:username", (req, res) => {
    const query = {
        text: `SELECT p.* FROM user_profiles p JOIN users u ON p.user_id = u.user_id WHERE u.username = $1`,
        values: [req.params.username]
    }
    db.query(query, (err, queryRes) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        else if (queryRes.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        return res.json(queryRes.rows[0]);
    });
});

router.get('/:username/discovered-characters', (req, res) => {

    const query = {
        text: `SELECT COUNT(*) FROM discovered_characters WHERE user_id = (SELECT user_id FROM users WHERE username = $1)`,
        values: [req.params.username]
    }
    db.query(query, (err, queryRes) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }
        return res.json(queryRes.rows[0]);
    });
});

module.exports = router;
