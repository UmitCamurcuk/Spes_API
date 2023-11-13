const express = require("express");
const router = express.Router();
const permissionModel = require('../Models/PermissionModel');
const roleModel = require('../Models/RoleModel')
const userModel = require('../Models/UserModel');
const verifyToken = require("../Middlewares/auth");

router.get("/getPermissions", verifyToken, async (req, res) => {
    const allPermissions = await permissionModel.find()
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role',
            populate: {
                path: 'Role',
                model: roleModel,
                select: 'Name -_id',
            }
        })
        .exec();
        console.log(allPermissions)
    if (!allPermissions) return res.status(200).send('There is no Permission')
    return res.status(200).send(allPermissions);
});

router.get("/getPermission", verifyToken, async (req, res) => {
    const permission = await permissionModel.findOne({ 'Name': req.query.Name })
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role'
        })
        .exec();
    if (!permission) return res.status(200).send('There is no Permission')
    return res.status(200).send(permission);
});

router.post('/CreatePermission', verifyToken('654ce0d4b5cfb614f61bae21'), async (req, res) => {
    //Check is permission created already before ?
    var permission = await permissionModel.find({
        Name: req.body.Name
    })
    if (permission.length > 0) return res.status(200).send('This permission Name is Already Taken.');
    const newpermission = new permissionModel(
        {
            Name: req.body.Name,
            Description: req.body.Description,
            CreatedUser: req.user.userId,
            UpdatedUser: req.user.userId
        }
    )
    newpermission.save();
    return res.status(200).send('Permission Saved')
})
module.exports = router;