const express = require("express");
const router = express.Router();
const attributeModel = require('../Models/AttributesModel');
const attributeValidationsModel = require('../Models/AttributeValidationsModel');
const attributeGroupModel = require('../Models/AttributeGroupsModel')
const userModel = require('../Models/UserModel');
const roleModel = require('../Models/RoleModel');
const verifyToken = require("../Middlewares/auth");


/////////////////////////////////////////////////////////////////////////// ATTRIBUTE //////////////////////////////////////////////////////////////////////////////////////////


router.get("/getAttributes", verifyToken("654d44613c6a0da0725273ab"), async (req, res) => {
    const allAttributes = await attributeModel.find()
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role -_id'
        })
        .populate({
            path: 'AttributeGroups',
            model: attributeGroupModel,
            select: 'Name Code isActive  -_id'
        })
        .populate({
            path: 'AttributeValidations.Validation',
            model: attributeValidationsModel,
            select: 'Name Code Type -_id'
        })
        .exec();
    if (!allAttributes) return res.status(200).send('There is no Attributes');

    const response = [];
    allAttributes.forEach(item => {
        const tempAttrVal = [];
        item.AttributeValidations.forEach(attrValidation => {
            tempAttrVal.push({
                Name: attrValidation.Validation.Name,
                Code: attrValidation.Validation.Code,
                Type: attrValidation.Validation.Type,
                Value: attrValidation.Value
            })
        })
        response.push({
            Name: item.Name,
            Code: item.Code,
            Type: item.Type,
            ItemTypes: item.ItemTypes,
            AttributeGroups: item.AttributeGroups,
            AttributeValidations: tempAttrVal,
            isRequired: item.isRequired,
            CreatedUser: item.CreatedUser,
        })
    })
    return res.status(200).send(response);
});


router.get("/getAttribute", verifyToken("654d44613c6a0da0725273ab"), async (req, res) => {
    const attribute = await attributeModel.findOne({ '_id': req.query._id })
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role'
        })
        .populate({
            path: 'AttributeGroups',
            model: attributeGroupModel,
        })
        .populate({
            path: 'AttributeValidations.Validation',
            model: attributeValidationsModel,
            select: 'Name Code Type -_id'
        })
        .exec();
    if (!attribute) return res.status(200).send('There is no Attributes')

    const tempAttrVal = [];
    attribute.AttributeValidations.forEach(attrValidation => {
        tempAttrVal.push({
            Name: attrValidation.Validation.Name,
            Code: attrValidation.Validation.Code,
            Type: attrValidation.Validation.Type,
            Value: attrValidation.Value
        })
    })
     const  response = {
        Name: attribute.Name,
        Code: attribute.Code,
        Type: attribute.Type,
        ItemTypes: attribute.ItemTypes,
        AttributeGroups: attribute.AttributeGroups,
        AttributeValidations: tempAttrVal,
        isRequired: attribute.isRequired,
        CreatedUser: attribute.CreatedUser,
    }

    return res.status(200).send(response);
});

router.post("/AttributesTableData", verifyToken("654d44613c6a0da0725273ab"), async (req, res) => {
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
        const allAttributes = await attributeModel.find(filterCriteria)
            .sort({ CreatedAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize))
            .populate({
                path: 'CreatedUser UpdatedUser',
                model: userModel,
                select: 'Name LastName Role'
            })
            .populate({
                path: 'AttributeGroups',
                model: attributeGroupModel,
                select: 'Name -_id'
            })
            .exec();
        const totalRows = await attributeModel.countDocuments();
        const response = {
            data: {
                rows: allAttributes,
                page: page,
                rowsPerPage: pageSize,
                sortObject: sortObject,
                totalRows: totalRows
            },
        }
        if (allAttributes.length === 0) return res.status(200).send(response);
        return res.status(200).send(response);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});



router.post('/CreateAttribute', verifyToken("654d44643c6a0da0725273ae"), async (req, res) => {
    //Check is attribute created already before ?
    var attribute = await attributeModel.find({
        Code: req.body.Code
    })
    if (attribute.length > 0) return res.status(200).send({
        Code: 401,
        Status: 'FALSE',
        Message: 'This Attribute code already taken.',
        Data: {}
    })
    const newAttribute = new attributeModel(
        {
            Name: req.body.Name,
            Code: req.body.Code,
            Type: req.body.Type,
            ItemTypes: req.body.ItemTypes,
            AttributeGroups: req.body.AttributeGroups,
            AttributeValidations: req.body.AttributeValidations,
            isRequired: req.body.isRequired,
            isActive: req.body.isActive,
            CreatedUser: req.user.userId,
            UpdatedUser: req.user.userId
        }
    )
    newAttribute.save();
    const newAttributeId = newAttribute._id;

    if (req.body.AttributeGroups.length > 0) {
        // req.body.AttributeGroups içindeki her bir öğe üzerinde dön
        for (const item of req.body.AttributeGroups) {
            // attributeGroupModel'den belgeyi bul ve bekleyerek al
            const attrGroup = await attributeGroupModel.findOne({ '_id': item });
            // attrGroup bulunamadıysa devam et
            if (!attrGroup) {
                console.error(`Attribute Group with id ${item} not found.`);
                continue;
            }
            // Array'e newAttributeId'yi ekle
            attrGroup.Attributes.push(newAttributeId);
            // Değişiklikleri kaydet
            await attrGroup.save();
        }
    }


    return res.status(200).send({
        Code: 200,
        Status: 'OK',
        Message: 'Attribute Saved',
        Data: newAttribute
    })
})
module.exports = router;




/////////////////////////////////////////////////////////////////////////// ATTRIBUTE VALIDATIONS //////////////////////////////////////////////////////////////////////////////////////////

router.get("/getAttributeValidation", verifyToken("654d44613c6a0da0725273ab"), async (req, res) => {
    const attributeValidations = await attributeValidationsModel.find({ 'AttributeType': req.query.Type })
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role -_id'
        })
        .exec();
    if (!attributeValidations) return res.status(200).send('There is no Attributes')
    return res.status(200).send(attributeValidations);
});



router.post('/CreateAttributeValidations', verifyToken("654d44643c6a0da0725273ae"), async (req, res) => {
    //Check is attribute created already before ?
    var attributeValidations = await attributeValidationsModel.find({
        Code: req.body.Code
    })
    if (attributeValidations.length > 0) return res.status(200).send('This Attribute Validations Code is Already Taken.');
    const newAttributeValidations = new attributeValidationsModel(
        {
            Name: req.body.Name,
            Code: req.body.Code,
            Type: req.body.Type,
            Attributes: req.body?.Attributes,
            CreatedUser: req.user.userId,
            UpdatedUser: req.user.userId
        }
    )
    newAttributeValidations.save();
    return res.status(200).send({
        Code: 200,
        Status: 'OK',
        Message: 'Attribute Validations Saved'
    })
})
module.exports = router;




/////////////////////////////////////////////////////////////////////////// ATTRIBUTE GROUPS //////////////////////////////////////////////////////////////////////////////////////////

router.get("/getAttributeGroup", verifyToken("654d44613c6a0da0725273ab"), async (req, res) => {
    const attributeGroup = await attributeGroupModel.findOne({ '_id': '656f9513f5434a5b05cc5614' })
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role'
        })
        .populate({
            path: 'Attributes',
            model: attributeModel,
            populate: {
                path: 'AttributeValidations.Validation',
                model: attributeValidationsModel,
                select: 'Name Code Type -_id'
            }
        })
        .exec();

    if (!attributeGroup) return res.status(200).send({
        Code: 500,
        Status: 'FALSE',
        Message: 'There is no Attribute Group find'
    })

    const attributes = [];

    attributeGroup.Attributes.forEach(attr => {
        const attributeValidations = [];
        attr.AttributeValidations.forEach(attrVal => {
            attributeValidations.push({
                Name: attrVal.Validation.Name,
                Code: attrVal.Validation.Code,
                Type: attrVal.Validation.Type,
                Value: attrVal.Value
            })
        })
        attributes.push({
            Name: attr.Name,
            Code: attr.Code,
            Type: attr.Type,
            ItemTypes: attr.ItemTypes,
            AttributeValidations: attributeValidations,
            isRequired: attr.isRequired,
        })
    })

    const response = {
        Name: attributeGroup.Name,
        Code: attributeGroup.Code,
        ItemTypes: attributeGroup.ItemTypes,
        Attributes: attributes,
        isActive: attributeGroup.isActive,
        CreatedUser: attributeGroup.CreatedUser,
    }
    return res.status(200).send(response);
});

router.get("/getAttributeGroups", verifyToken("654d44613c6a0da0725273ab"), async (req, res) => {
    const allAttributeGroups = await attributeGroupModel.find()
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role -_id'
        })
        .populate({
            path: 'Attributes',
            model: attributeModel,
            populate: {
                path: 'AttributeValidations.Validation',
                model: attributeValidationsModel,
                select: 'Name Code Type -_id'
            }
        })
        .exec();
    if (!allAttributeGroups) return res.status(200).send('There is no Attributes');


    const response = [];
    const attributes = [];
    allAttributeGroups.forEach(item => {
        item.Attributes.forEach(attr => {
            const attributeValidations = [];
            attr.AttributeValidations.forEach(attrVal => {
                attributeValidations.push({
                    Name: attrVal.Validation.Name,
                    Code: attrVal.Validation.Code,
                    Type: attrVal.Validation.Type,
                    Value: attrVal.Value
                })
            })
            attributes.push({
                Name: attr.Name,
                Code: attr.Code,
                Type: attr.Type,
                ItemTypes: attr.ItemTypes,
                AttributeValidations: attributeValidations,
                isRequired: attr.isRequired,
            })
        })
        response.push({
            _id: item._id,
            Name: item.Name,
            Code: item.Code,
            ItemTypes: item.ItemTypes,
            Attributes: attributes,
            isActive: item.isActive,
            CreatedUser: item.CreatedUser,
        })
    })

    return res.status(200).send(response);
});




router.post('/CreateAttributeGroup', verifyToken("654d44643c6a0da0725273ae"), async (req, res) => {
    //Check is attribute created already before ?
    var attributeGroup = await attributeGroupModel.find({
        Code: req.body.Code
    })
    if (attributeGroup.length > 0) return res.status(200).send('This Attribute Validations Code is Already Taken.');
    const newAttributeGroup = new attributeGroupModel(
        {
            Name: req.body.Name,
            Code: req.body.Code,
            Attributes: req.body?.Attributes,
            ItemTypes: req.body.ItemTypes,
            isActive: req.body.isActive,
            CreatedUser: req.user.userId,
            UpdatedUser: req.user.userId
        }
    )
    newAttributeGroup.save();
    return res.status(200).send({
        Code: 200,
        Status: 'OK',
        Message: 'Attribute Group Saved'
    })
})
module.exports = router;


router.post("/AttributeGroupsTableData", verifyToken("654d44613c6a0da0725273ab"), async (req, res) => {
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
        const allAttributeGroups = await attributeGroupModel.find(filterCriteria)
            .sort({ CreatedAt: -1 })
            .skip((page - 1) * pageSize)
            .limit(parseInt(pageSize))
            .populate({
                path: 'CreatedUser UpdatedUser',
                model: userModel,
                select: 'Name LastName Role'
            })
            .exec();
        const totalRows = await attributeGroupModel.countDocuments();
        const response = {
            data: {
                rows: allAttributeGroups,
                page: page,
                rowsPerPage: pageSize,
                sortObject: sortObject,
                totalRows: totalRows
            },
        }
        if (allAttributeGroups.length === 0) return res.status(200).send(response);
        return res.status(200).send(response);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
});