const express = require("express");
const router = express.Router();
const attributeModel = require('../Models/AttributesModel');
const attributeGroupModel = require('../Models/AttributeGroupsModel');
const userModel = require('../Models/UserModel');
const attributeValidationsModel = require('../Models/AttributeValidationsModel')
const familyModel = require('../Models/FamilyModel');
const itemTypeModel = require('../Models/ItemTypeModel');
const verifyToken = require("../Middlewares/auth");
const RoleModel = require("../Models/RoleModel");

router.get("/getItemTypes", verifyToken("6594547bf508cdc5c4e4665c"), async (req, res) => {
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

router.get("/getItemType", verifyToken("6594547bf508cdc5c4e4665c"), async (req, res) => {
    const itemType = await itemTypeModel.findOne({ 'Code': req.query.Code })
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role',
        })
        .populate({
            path: 'Attributes',
            model: attributeModel,
            populate: {
                path: 'AttributeValidations.Validation',
                model: attributeValidationsModel,
            }
        })

        .populate({
            path: 'Families',
            model: familyModel,
            populate: {
                path: 'AttributeGroups',
                model: attributeGroupModel,
                populate: {
                    path: 'Attributes',
                    model: attributeModel,
                    populate: {
                        path: 'AttributeValidations.Validation',
                        model: attributeValidationsModel,
                    }
                }
            }
        })
        .exec();
    if (!itemType) return res.status(200).send('There is no ItemType');

    const families = [];
    const attributeGroups = [];
    const attributes = [];

    itemType.Families?.forEach(familyVal => {
        familyVal.AttributeGroups.forEach(attrGroup => {
            attrGroup.Attributes.forEach(attr => {
                const attributeValidations = [];
                attr.AttributeValidations.forEach(attrVal => {
                    attributeValidations.push({
                        _id: attrVal.Validation._id,
                        Name: attrVal.Validation.Name,
                        Code: attrVal.Validation.Code,
                        Type: attrVal.Validation.Type,
                        Value: attrVal.Value
                    })
                })
                attributes.push({
                    _id: attr._id,
                    Name: attr.Name,
                    Code: attr.Code,
                    Type: attr.Type,
                    ItemTypes: attr.ItemTypes,
                    AttributeValidations: attributeValidations,
                    isRequired: attr.isRequired,
                })
            })
            attributeGroups.push({
                _id: attrGroup._id,
                Name: attrGroup.Name,
                Code: attrGroup.Code,
                ItemTypes: attrGroup.ItemTypes,
                Attributes: attributes,
                isActive: attrGroup.isActive,
                CreatedUser: attrGroup.CreatedUser,
            })
            families.push({
                _id: familyVal._id,
                Name: familyVal.Name,
                Code: familyVal.Code,
                ItemType: familyVal.ItemType,
                AttributeGroups: attributeGroups,
            })
        })
    })

    const otherAttr = [];
    itemType.Attributes?.forEach(item => {
        const tempAttrVal = [];
        item.AttributeValidations.forEach(attrValidation => {
            tempAttrVal.push({
                Name: attrValidation.Validation.Name,
                Code: attrValidation.Validation.Code,
                Type: attrValidation.Validation.Type,
                Value: attrValidation.Value
            })
        })
        otherAttr.push({
            Name: item.Name,
            Code: item.Code,
            Type: item.Type,
            AttributeValidations: tempAttrVal,
            isRequired: item.isRequired,
            CreatedUser: item.CreatedUser,
        })
    })

    const response = {
        Code: itemType.Code,
        Name: itemType.Name,
        Families: families,
        OtherAttributes: otherAttr,
        ShowOnNavbar: itemType.ShowOnNavbar,
        isActive: itemType.isActive,
        UpdatedUser: itemType.UpdatedUser.Name + ' ' + itemType.UpdatedUser.LastName,
        updatedAt: itemType.updatedAt,
        CreatedUser: itemType.CreatedUser.Name + ' ' + itemType.CreatedUser.LastName,
        createdAt: itemType.createdAt,
    }

    return res.status(200).send(response);
});

router.post("/ItemTypesTableData", verifyToken("6594547bf508cdc5c4e4665c"), async (req, res) => {
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

router.post('/CreateItemType', verifyToken("659453a2f508cdc5c4e46633"), async (req, res) => {
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
            Families: req.body.Families,
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
    const itemType = await itemTypeModel.find({ 'ShowOnNavbar': true })
        .exec();
    if (!itemType) return res.status(200).send('There is no ItemType')

    return res.status(200).send(itemType);
});
module.exports = router;