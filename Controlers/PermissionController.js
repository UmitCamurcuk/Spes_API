const express = require("express");
const router = express.Router();
const permissionModel = require('../Models/PermissionModel');
const roleModel = require('../Models/RoleModel')
const userModel = require('../Models/UserModel');
const verifyToken = require("../Middlewares/auth");

router.get("/getPermissions", verifyToken("65945485f508cdc5c4e46662"), async (req, res) => {
    const allPermissions = await permissionModel.find()
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role',
            populate: {
                path: 'Roles',
                model: roleModel,
                select: 'Name -_id',
            }
        })
        .exec();
    if (!allPermissions) return res.status(200).send('There is no Permission')
    return res.status(200).send(allPermissions);
});

router.get("/getPermission", verifyToken("65945485f508cdc5c4e46662"), async (req, res) => {
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

router.post('/CreatePermission', verifyToken('6594542bf508cdc5c4e46647'), async (req, res) => {
    //Check is permission created already before ?
    var permission = await permissionModel.find({
        Name: req.body.Name
    })
    if (permission.length > 0) return res.status(200).send('This permission Name is Already Taken.');
    const newpermission = new permissionModel(
        {
            Name: req.body.Name,
            Code: req.body.Code,
            Description: req.body.Description,
            Type: req.body.Type,
            Group: req.body.Group,
            CreatedUser: req.user.userId,
            UpdatedUser: req.user.userId
        }
    )
    newpermission.save();
    return res.status(200).send({
        Code: 200,
        Status: 'OK',
        Message: 'Permission Saved',
        Data: newpermission
    })
})

router.post("/PermissionsTableData", verifyToken("65945485f508cdc5c4e46662"), async (req, res) => {
    try {
        const { page, pageSize, orderBy, order } = req.body;
        const sortObject = {};
        sortObject[orderBy] = order === 'desc' ? -1 : 1;
        let filterCriteria = req.body.filters;
        Object.keys(filterCriteria).forEach((key, value) => {
            if (filterCriteria[key] === '') {
                delete filterCriteria[key];
            } else {
                filterCriteria[key] = { $regex: '.*' + filterCriteria[key] + '.*', $options: 'i' }
            }
        });

        const allPermissions = await permissionModel.find(filterCriteria)
            .sort({ CreatedAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize))
            .exec();

        const totalRows = await permissionModel.countDocuments();
        const response = {
            data: {
                rows: allPermissions,
                page: page,
                rowsPerPage: pageSize,
                sortObject: sortObject,
                totalRows: totalRows
            },
        }
        if (allPermissions.length === 0) return res.status(200).send(response);
        return res.status(200).send(response);
    } catch (error) {
        res.status(500).json({ error: error });
    }
});

module.exports = router;