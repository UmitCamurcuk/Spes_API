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
      const isPermission = search(permissionCode, req.user.userrole);
      if (isPermission === false) { throw new Error('Permission Denied !'); } // Break this try, even though there is no exception here.
    } catch (err) {
      return res.status(200).send("Permission Denied !!");
    }
    return next();
  }
}

module.exports = verifyToken;