const permissionModel = require('../Models/PermissionModel');



const checkPermission = (permissionId) => {
    return (req, res, next) => {
        const token =
            req.body.token || req.query.token || req.headers["x-access-token"];
        if (!token) {
            return res.status(403).send("A token is required for authentication");
        }
        try {
            const decoded = jwt.verify(token, config.API_SECRET_KET);
            req.user = decoded;
        } catch (err) {
            return res.status(401).send("Invalid Token");
        }
        return next();
    }
};

module.exports = verifyToken;