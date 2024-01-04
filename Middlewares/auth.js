const jwt = require("jsonwebtoken");

const config = process.env;

const generateRefreshToken = (user) => {
  const refreshToken = jwt.sign(
    {
        userId: user._id,
        username: user.Name,
        userlastname: user.LastName,
        userrole: user.Role.Permissions
    },
    process.env.API_SECRET_KET,
    {
        expiresIn: "15m",
    }
);
  // refreshToken'i güvenli bir şekilde saklayın, veritabanında ya da başka bir güvenli ortamda
  return refreshToken;
};

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
        const isPermission = req.user.userrole[0].Permissions.find(item => item._id === permissionCode);
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