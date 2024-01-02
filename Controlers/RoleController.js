const express = require("express");
const router = express.Router();
const permissionModel = require('../Models/PermissionModel');
const roleModel = require('../Models/RoleModel');
const userModel = require('../Models/UserModel');
const verifyToken = require("../Middlewares/auth");

router.get("/getRoles", verifyToken(null), async (req, res) => {
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

router.get("/getRole", verifyToken(null), async (req, res) => {
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

router.post('/CreateRole', verifyToken(null), async (req, res) => {
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

router.post("/RolesTableData", verifyToken(null), async (req, res) => {
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

        const allRoles = await roleModel.find(filterCriteria)
            .sort({ CreatedAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize))
            .populate({
                path: 'Permissions',
                model: permissionModel,
                select: 'Name Code isActive  -_id'
            })
            .exec();
         
        const totalRows = await roleModel.countDocuments();
        const response = {
            data: {
                rows: allRoles,
                page: page,
                rowsPerPage: pageSize,
                sortObject: sortObject,
                totalRows: totalRows
            },
        }
        if (allRoles.length === 0) return res.status(200).send(response);
        return res.status(200).send(response);
    } catch (error) {
        res.status(500).json({ error: error});
    }
});

module.exports = router;