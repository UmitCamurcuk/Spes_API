const express = require("express");
const router = express.Router();
const userModel = require('../Models/UserModel');
const roleModel = require('../Models/RoleModel');
const permissionModel = require('../Models/PermissionModel');
const verifyToken = require("../Middlewares/auth");


router.get("/getUsers", verifyToken("654cf05e3c6a0da072527383"), async (req, res) => {
    const allUsers = await userModel.find()
        .populate({
            path: 'Role',
            model: roleModel,
            select: 'Name Description -_id',
            populate: {
                path: 'Permissions',
                model: permissionModel,
                select: 'Name Description -_id',
            }
        })
        .exec();

    if (!allUsers) return res.status(200).send('There is no Item')

    return res.status(200).send(allUsers);
});

router.get("/getUser", verifyToken("654cf05e3c6a0da072527383"), async (req, res) => {
    const user = await userModel.find({ 'Name': req.query.Name })
        .populate({
            path: 'Role',
            model: roleModel,
            select: 'Name Description -_id',
            populate: {
                path: 'Permissions',
                model: permissionModel,
                select: 'Name Description -_id',
            }
        })
        .exec();
    if (!user) return res.status(200).send('There is no Item')

    return res.status(200).send(user);
});

router.get("/getMyUserInfo", verifyToken("654cf05e3c6a0da072527383"), async (req, res) => {
    const allUsers = await userModel.find({ _id: req.user.userId })
        .populate({
            path: 'Role',
            model: roleModel,
            select: 'Name Description -_id',
            populate: {
                path: 'Permissions',
                model: permissionModel,
                select: 'Name Description -_id',
            }
        })
        .exec();
    if (!allUsers) return res.status(200).send('There is no Item')

    return res.status(200).send(allUsers);
});

router.post('/CreateUser', verifyToken("654d43d93c6a0da07252738a"), async (req, res) => {
    //Check is user created already before ? 

    var user = await userModel.find({
        UserName: req.body.UserName
    })

    if (user.length > 0) return res.status(200).send('This username is Already Taken.');
    user = await userModel.find({
        Email: req.body.Email
    })
    if (user.length > 0) return res.status(200).send('This Email is Already Taken.');


    const newUser = new userModel(
        {
            Name: req.body.Name,
            LastName: req.body.LastName,
            UserName: req.body.UserName,
            Password: req.body.Password,
            Email: req.body.Email,
            BirthDate: req.body.BirthDate,
            Role: req.body.Role,
            Phone: req.body.Phone,
            Location: req.body.Location,
            isActive: req.body.isActive,
        }
    )
    newUser.save();
    return res.status(200).send('User Saved')
})
module.exports = router;