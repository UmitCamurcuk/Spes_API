const express = require("express");
const router = express.Router();
const userModel = require('../Models/UserModel');
const roleModel = require('../Models/RoleModel');
const permissionModel = require('../Models/PermissionModel');
const verifyToken = require("../Middlewares/auth");
const HistoryModel = require("../Models/HistoryModel");


router.get("/getUsers", verifyToken(null), async (req, res) => {
    let query = {}; // Boş bir sorgu nesnesi oluşturun

    if (req.query.Role) {
        query.Role = req.query.Role; // Eğer Role belirtilmişse, sorgu nesnesine ekleyin
    }

    const allUsers = await userModel.find(query)
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


router.get("/getUser", verifyToken(null), async (req, res) => {
    const user = await userModel.find({ '_id': req.query._id })
        .populate({
            path: 'Roles',
            model: roleModel,
            select: 'Name Description',
            populate: {
                path: 'Permissions',
                model: permissionModel,
                select: 'Name Description -_id',
            }
        })
        .exec();
    if (!user) return res.status(200).send('There is no Item')

    return res.status(200).send(user[0]);
});

router.get("/getMyUserInfo", verifyToken(null), async (req, res) => {
    const allUsers = await userModel.find({ _id: req.user.userId })
        .populate({
            path: 'Roles',
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

router.post('/CreateUser', verifyToken(null), async (req, res) => {
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
            Roles: req.body.Roles,
            Phone: req.body.Phone,
            Location: req.body.Location,
            isActive: req.body.isActive,
        }
    )
    newUser.save();

    // Update roles with the new user
    const rolesToUpdate = await roleModel.find({ _id: { $in: req.body.Roles } });
    rolesToUpdate.forEach(async (role) => {
        role.Users.push(newUser._id);
        await role.save();
    });


    const newUserHistory = new HistoryModel({
        entityId: newUser._id,
        entityType: 'User',
        Description: 'User Creation',
        Code: '1001',
        ChangedValues: {
            Name: { oldValue: null, newValue: req.body.Name },
            LastName: { oldValue: null, newValue: req.body.LastName },
            UserName: { oldValue: null, newValue: req.body.UserName },
            Email: { oldValue: null, newValue: req.body.Email },
            BirthDate: { oldValue: null, newValue: req.body.BirthDate },
            Phone: { oldValue: null, newValue: req.body.Phone },
            Location: { oldValue: null, newValue: req.body.Location },
            Roles: { oldValue: [], newValue: req.body.RoleNames },
        },
        Comment: null,
        CreatedUser: req.user.userId,
        UpdatedUser: req.user.userId
    })

    newUserHistory.save();

    return res.status(200).send({
        Code: 200,
        Status: 'OK',
        Message: 'User Created',
        Data: newUser,
    })
})

router.post("/SystemUsersTableData", verifyToken(null), async (req, res) => {
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
        const allUsers = await userModel.find(filterCriteria)
            .sort({ CreatedAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize))
            .populate({
                path: 'Roles',
                model: roleModel,
                select: 'Name Description -_id',
                populate: {
                    path: 'Permissions',
                    model: permissionModel,
                    select: 'Name Description -_id',
                }
            })
            .exec();
        const totalRows = await userModel.countDocuments();
        const response = {
            data: {
                rows: allUsers,
                page: page,
                rowsPerPage: pageSize,
                sortObject: sortObject,
                totalRows: totalRows
            },
        }
        if (allUsers.length === 0) return res.status(200).send(response);
        return res.status(200).send(response);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
module.exports = router;