const jwt = require("jsonwebtoken");

const config = process.env;

function search(nameKey, myArray) {
  for (let i = 0; i < myArray.length; i++) {
    if (myArray[i]._id === nameKey) {
      return true
    } else return false;
  }
}

const verifyToken = (permissionCode) => {
  return (req, res, next) => {
    const token =
      req.body.token || req.query.token || req.headers["x-access-token"];

    if (!token) {
      return res.status(403).send("A token is required for authentication");
    }
    try {
      const decoded = jwt.verify(token, config.API_SECRET_KET);
      req.user = decoded;
    }
    catch (err) {
      return res.status(401).send("Invalid Token");
    }
    try {
      if (permissionCode !== null) {
        const isPermission = req.user.userrole.find(item => item._id === permissionCode);
        if (!isPermission) { throw new Error('Permission Denied !'); }
      }
      // Break this try, even though there is no exception here.
    } catch (err) {
      return res.status(200).send({
        Code: 401,
        Message:'You cannot make this action.'
      });
    }
    return next();
  }
}

module.exports = verifyToken;