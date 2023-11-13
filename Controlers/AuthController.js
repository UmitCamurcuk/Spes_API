const express = require("express");
const router = express.Router();
require("dotenv").config();
const jwt = require('jsonwebtoken')
const userModel = require('../Models/UserModel');
const roleModel = require('../Models/RoleModel');
const permissionModel = require('../Models/PermissionModel');


router.post("/Login", async (req, res) => {
    const user = await userModel.findOne({ 'UserName': req.body.UserName })
        .populate({
            path: 'Role',
            model: roleModel,
            select: '_id',
            populate: {
                path: 'Permissions',
                model: permissionModel,
                select: '_id',
            }
        })
        .exec();
    if (!user) return res.status(200).send('There is no Item')
    const token = jwt.sign(
        {
            userId: user._id,
            username: user.Name,
            userlastname: user.LastName,
            userrole: user.Role.Permissions
        },
        process.env.API_SECRET_KET,
        {
            expiresIn: "2h",
        }
    );
    const response = {
        status : 200,
        token : token,
        userInfo : user
    }
    return res.status(200).send(response);
});

module.exports = router;