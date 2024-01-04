const express = require("express");
const router = express.Router();
const permissionModel = require('../Models/PermissionModel');
const roleModel = require('../Models/RoleModel');
const userModel = require('../Models/UserModel');
const verifyToken = require("../Middlewares/auth");
const HistoryModel = require("../Models/HistoryModel");

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
    const role = await roleModel.findOne({ '_id': req.query._id })
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role'
        })
        .populate({
            path: 'Permissions',
            model: permissionModel,
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
            Users: req.body.Users,
            isActive: true,
            CreatedUser: req.user.userId,
            UpdatedUser: req.user.userId
        }
    )
    newRole.save();

    // Update users with the new role
    const usersToUpdate = await userModel.find({ _id: { $in: req.body.Users } });
    usersToUpdate.forEach(async (user) => {
        user.Roles.push(newRole._id);
        await user.save();
    });

    const newRoleHistory = new HistoryModel({
        entityId: newRole._id,
        entityType: 'Role',
        Description: 'Role Creation',
        Code: '1021',
        ChangedValues: {
            Name: { oldValue: null, newValue: req.body.Name },
            Description: { oldValue: null, newValue: req.body.Description },
            Permissions: { oldValue: [], newValue: req.body.Permissions },
            Users: { oldValue: [], newValue: req.body.Users },
            isActive: { oldValue: null, newValue: true },
            isRequired: { oldValue: null, newValue: req.body.isRequired },
            isActive: { oldValue: null, newValue: req.body.isActive },
        },
        Comment: null,
        CreatedUser: req.user.userId,
        UpdatedUser: req.user.userId
    })
    newRoleHistory.save();

    return res.status(200).send({
        Code: 200,
        Status: 'OK',
        Message: 'Role Group Saved',
        Data: newRole,
    })
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
        res.status(500).json({ error: error });
    }
});

module.exports = router;