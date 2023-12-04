const express = require("express");
const router = express.Router();
const attributeModel = require('../Models/AttributesModel');
const itemTypeModel = require('../Models/ItemTypeModel');
const itemModel = require('../Models/ItemModel');
const userModel = require('../Models/UserModel');
const familyModel = require('../Models/FamilyModel');
const verifyToken = require("../Middlewares/auth");
const AttributeGroupsModel = require("../Models/AttributeGroupsModel");
const AttributeValidationsModel = require("../Models/AttributeValidationsModel");

router.get("/getFamilies", verifyToken("654d44733c6a0da0725273b7"), async (req, res) => {
    const allFamilies = await familyModel.find()
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role'
        })
        .populate({
            path: 'AttributeGroups',
            model: AttributeGroupsModel,
            populate: {
                path: 'Attributes',
                model: attributeModel,
                populate: {
                    path: 'AttributeValidations.Validation',
                    model: AttributeValidationsModel,
                }
            }
        })
        .exec();
    if (!allFamilies) return res.status(200).send('There is no Family');

    const response = [];
    const attributeGroups = [];
    const attributes = [];

    allFamilies.forEach(familyVal => {
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
            response.push({
                _id: familyVal._id,
                Name: familyVal.Name,
                Code: familyVal.Code,
                ItemType: familyVal.ItemType,
                AttributeGroups: attributeGroups,
            })
        })
    })

    return res.status(200).send(response);
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
    if (family.length > 0) return res.status(200).send({
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
        Data: newFamily
    })
})
module.exports = router;