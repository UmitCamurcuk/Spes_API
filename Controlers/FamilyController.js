const express = require("express");
const router = express.Router();
const attributeModel = require('../Models/AttributesModel');
const itemTypeModel = require('../Models/ItemTypeModel');
const itemModel = require('../Models/ItemModel');
const userModel = require('../Models/UserModel');
const familyModel = require('../Models/FamilyModel');
const verifyToken = require("../Middlewares/auth");

router.get("/getFamilies", verifyToken("654d44733c6a0da0725273b7"), async (req, res) => {
    const allFamilies = await familyModel.find()
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role'
        })
        .exec();
    if (!allFamilies) return res.status(200).send('There is no Family')
    return res.status(200).send(allFamilies);
});

router.get("/getFamily", verifyToken("654d44733c6a0da0725273b7"), async (req, res) => {
    const item = await familyModel.findOne({ 'Code': req.query.Code })
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role'
        })
        .exec();
    if (!item) return res.status(200).send('There is no Item')

    return res.status(200).send(item);
});

router.post('/CreateFamily', verifyToken("654d44763c6a0da0725273ba"), async (req, res) => {
    //Check is attribute created already before ?
    console.log(1)
    var family = await familyModel.find({
        Code: req.body.Code
    })
    if (family.length > 0) return  res.status(200).send({
        Code: 500,
        Status: 'FALSE',
        Message: 'This Family Code Already Taken'
    })
    console.log(req.body.Attributes)
    const newFamily = new familyModel(
        {
            Name: req.body.Name,
            Code: req.body.Code,
            ItemType: req.body.ItemType === '' && null,
            AttributeGroups: req.body.AttributeGroups,
            Attributes: req.body.Attributes,
            CreatedUser: req.user.userId,
            UpdatedUser: req.user.userId,
            isActive: true
        }
    )

    newFamily.save();
    return res.status(200).send({
        Code: 200,
        Status: 'OK',
        Message: 'Family Saved',
        Data : newFamily
    })
})
module.exports = router;