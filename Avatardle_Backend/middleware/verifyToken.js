const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.sendStatus(401);
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.sendStatus(403);
    }
}

module.exports = verifyToken;
