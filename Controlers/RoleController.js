const express = require("express");
const router = express.Router();
const permissionModel = require('../Models/PermissionModel');
const roleModel = require('../Models/RoleModel');
const userModel = require('../Models/UserModel');
const verifyToken = require("../Middlewares/auth");

router.get("/getRoles", verifyToken, async (req, res) => {
    const allRoles = await roleModel.find()
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role'
        })
        .populate({
            path: 'Permissions',
            model: userModel,
            select: 'Name Description'
        })
        .exec();
    if (!allRoles) return res.status(200).send('There is no Role')
    return res.status(200).send(allRoles);
});

router.get("/getRole", verifyToken, async (req, res) => {
    const role = await roleModel.findOne({ 'Name': req.query.Name })
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role'
        })
        .populate({
            path: 'Permissions',
            model: userModel,
            select: 'Name Description'
        })
        .exec();
    if (!role) return res.status(200).send('There is no Role')
    return res.status(200).send(role);
});

router.post('/CreateRole', verifyToken, async (req, res) => {
    //Check is permission created already before ?
    var role = await roleModel.find({
        Name: req.body.Name
    })
    if (role.length > 0) return res.status(200).send('This role Name is Already Taken.');
    const newRole = new roleModel(
        {
            Name: req.body.Name,
            Description: req.body.Description,
            Permissions: req.body.Permissions,
            CreatedUser: req.user.userId,
            UpdatedUser: req.user.userId
        }
    )
    newRole.save();
    return res.status(200).send('Role Saved')
})
module.exports = router;