const express = require("express");
const router = express.Router();
const attributeModel = require('../Models/AttributesModel');
const itemTypeModel = require('../Models/ItemTypeModel');
const itemModel = require('../Models/ItemModel')
const userModel = require('../Models/UserModel');
const verifyToken = require("../Middlewares/auth");

router.get("/getItems", verifyToken("654d44293c6a0da072527393"), async (req, res) => {
    const allItems = await itemModel.find()
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role'
        })
        .populate({
            path: 'ItemType',
            model: itemTypeModel,
            select: 'Name Code Attributes ShowOnNavbar isActive',
            populate:{
                path: 'Attributes',
                model: attributeModel,
                select: 'Name Code'
            }
        })
        .populate({
            path: 'Attributes',
            model: attributeModel,
            select: 'Name Code'
        })
        .exec();
    if (!allItems) return res.status(200).send('There is no Item')
    return res.status(200).send(allItems);
});

router.get("/getItem", verifyToken("654d44293c6a0da072527393"), async (req, res) => {
    const item = await itemModel.findOne({ 'Code': req.query.Code })
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role'
        })
        .populate({
            path: 'Attributes',
            model: attributeModel,
            select: 'Name Code'
        })
        .exec();
    if (!item) return res.status(200).send('There is no Item')

    return res.status(200).send(item);
});

router.post('/CreateItem', verifyToken('654d442f3c6a0da072527396'), async (req, res) => {
    //Check is attribute created already before ?
    //Permission CODE = 654ce0d4b5cfb614f61bae21
    var item = await itemModel.find({
        Code: req.body.Code
    })
    if (item.length > 0) return res.status(200).send('This Item Code is Already Taken.');
    const newItem = new itemModel(
        {
            Name: req.body.Name,
            Code: req.body.Code,
            ItemType: req.body.ItemType,
            Family: req.body.Family,
            Attributes: req.body.Attributes,
            Category: req.body.Category,
            CreatedUser: req.user.userId,
            UpdatedUser: req.user.userId,
            isActive: true
        }
    )

    newItem.save();
    return res.status(200).send('User Saved')
})
module.exports = router;