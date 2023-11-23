const express = require("express");
const router = express.Router();
const attributeModel = require('../Models/AttributesModel');
const userModel = require('../Models/UserModel');
const itemTypeModel = require('../Models/ItemTypeModel');
const verifyToken = require("../Middlewares/auth");

router.get("/getItemTypes", verifyToken("654d443c3c6a0da07252739f"), async (req, res) => {
    const allItemTypes = await itemTypeModel.find()
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role'
        })
        .populate({
            path: 'Attributes',
            model: attributeModel,
            select: 'Name Code Type isRequired'
        })
        .exec();
    if (!allItemTypes) return res.status(200).send('There is no ItemTypes')
    return res.status(200).send(allItemTypes);
});

router.get("/getItemType", verifyToken("654d443c3c6a0da07252739f"), async (req, res) => {
    const itemType = await itemTypeModel.findOne({ 'Code' : req.query.Code })
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role'
        })
        .populate({
            path: 'Attributes',
            model: attributeModel,
            select: 'Name Code Type isRequired'
        })
        .exec();
    if (!itemType) return res.status(200).send('There is no ItemType')

    return res.status(200).send(itemType);
});

router.post("/ItemTypesTableData", verifyToken("654d44613c6a0da0725273ab"), async (req, res) => {
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
        const allItemTypes = await itemTypeModel.find(filterCriteria)
            .sort(sortObject)
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize))
            .populate({
                path: 'CreatedUser UpdatedUser',
                model: userModel,
                select: 'Name LastName Role'
            })
            .populate({
                path: 'Attributes',
                model: attributeModel,
            })
            .exec();
        const totalRows = await itemTypeModel.countDocuments();
        const response = {
            data: {
                rows: allItemTypes,
                page: page,
                rowsPerPage: pageSize,
                sortObject: sortObject,
                totalRows: totalRows
            },
        }
        if (allItemTypes.length === 0) return res.status(200).send(response);
        return res.status(200).send(response);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }




});

router.post('/CreateItemType', verifyToken("654d443f3c6a0da0725273a2"), async (req, res) => {
    //Check is attribute created already before ?
    var itemType = await itemTypeModel.find({
        Code: req.body.Code
    })
    if (itemType.length > 0) return res.status(200).send('This Attribute Code is Already Taken.');
    const newItemType = new itemTypeModel(
        {
            Name: req.body.Name,
            Code: req.body.Code,
            Attributes: req.body.Attributes,
            ShowOnNavbar: req.body.ShowOnNavbar,
            CreatedUser: req.user.userId,
            UpdatedUser: req.user.userId,
            isActive: req.body.isActive
        }
    )
    newItemType.save();
    return res.status(200).send('ItemType Saved')
})



router.get("/getNavigationLinks", verifyToken(null), async (req, res) => {
    const itemType = await itemTypeModel.find({ 'ShowOnNavbar' : true })
        .exec();
    if (!itemType) return res.status(200).send('There is no ItemType')

    return res.status(200).send(itemType);
});
module.exports = router;