const express = require("express");
const router = express.Router();
const verifyToken = require("../Middlewares/auth");
require("dotenv").config();
const HistoryModel = require("../Models/HistoryModel");
const UserModel = require("../Models/UserModel");
const RoleModel = require("../Models/RoleModel");


router.get("/getHistory", verifyToken(null), async (req, res) => {
    const history = await HistoryModel.find({ 'entityId': req.query._id })
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: UserModel,
            select: 'Name LastName Role -_id',
            populate: {
                path: 'Role',
                model: RoleModel,
                select: 'Name -_id',
            }
        })
        .exec();
    if (!history) return res.status(200).send('There is no History')
    return res.status(200).send(history);
});


module.exports = router;