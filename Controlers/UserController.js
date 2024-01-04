const express = require("express");
const router = express.Router();
const userModel = require('../Models/UserModel');
const roleModel = require('../Models/RoleModel');
const permissionModel = require('../Models/PermissionModel');
const verifyToken = require("../Middlewares/auth");


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

router.get("/getMyUserInfo", verifyToken(null), async (req, res) => {
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
            Role: req.body.Role,
            Phone: req.body.Phone,
            Location: req.body.Location,
            isActive: req.body.isActive,
        }
    )
    newUser.save();
    return res.status(200).send('User Saved')
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