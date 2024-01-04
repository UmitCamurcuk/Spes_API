const express = require("express");
const router = express.Router();
require("dotenv").config();
const jwt = require('jsonwebtoken')
const userModel = require('../Models/UserModel');
const roleModel = require('../Models/RoleModel');
const permissionModel = require('../Models/PermissionModel');


router.post("/Login", async (req, res) => {
    const user = await userModel.findOne({ 'UserName': req.body.UserName , 'Password' : req.body.Password })
        .populate({
            path: 'Roles',
            model: roleModel,
            select: 'Name Description _id',
            populate: {
                path: 'Permissions',
                model: permissionModel,
                select: '_id',
            }
        })
        .exec();
    if (!user) return res.status(200).send({
        Status: 400,
        Error:'Invalid Username Or Password',
        Message : 'Invalid Username or Password'
    })
    const token = jwt.sign(
        {
            userId: user._id,
            username: user.Name,
            userlastname: user.LastName,
            userrole: user.Roles
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