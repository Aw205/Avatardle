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

    const query = `UPDATE stats SET ${req.body.mode}_completion = ${req.body.mode}_completion + 1 `;
    db.query(query);
    return res.status(200);
});

module.exports = router;
