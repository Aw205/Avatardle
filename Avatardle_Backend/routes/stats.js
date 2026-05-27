const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {

    const query = "SELECT * FROM stats WHERE type='daily'";
    db.query(query, (err, queryRes) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to retrieve data' });
        }
        return res.json(queryRes.rows[0]);
    });
});

router.patch('/', (req, res) => {

    const allowedModes = new Set(['classic', 'quote', 'picture', 'music']);
    const { mode } = req.body;

    if (!allowedModes.has(mode)) {
        return res.sendStatus(400);
    }

    const query = `UPDATE stats SET ${mode}_completion = ${mode}_completion + 1 WHERE type='daily'`;
    db.query(query, (err) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to update stats' });
        }
        return res.sendStatus(204);
    });
});

module.exports = router;
