const express = require("express");
const router = express.Router();
const attributeModel = require('../Models/AttributesModel');
const itemTypeModel = require('../Models/ItemTypeModel');
const itemModel = require('../Models/ItemModel')
const userModel = require('../Models/UserModel');
const verifyToken = require("../Middlewares/auth");

router.get("/getItems", verifyToken("65945475f508cdc5c4e46659"), async (req, res) => {
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

router.get("/getItem", verifyToken("65945475f508cdc5c4e46659"), async (req, res) => {
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

router.post('/CreateItem', verifyToken('65945384f508cdc5c4e4662a'), async (req, res) => {
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

router.post("/ItemsTableData", verifyToken("65945475f508cdc5c4e46659"), async (req, res) => {
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
        const allItems = await itemModel.find(filterCriteria)
            .sort({ CreatedAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize))
            .populate({
                path: 'CreatedUser UpdatedUser',
                model: userModel,
                select: 'Name LastName Role'
            })
            .exec();
        const totalRows = await itemModel.countDocuments();
        const response = {
            data: {
                rows: allItems,
                page: page,
                rowsPerPage: pageSize,
                sortObject: sortObject,
                totalRows: totalRows
            },
        }
        if (allItems.length === 0) return res.status(200).send(response);
        return res.status(200).send(response);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;