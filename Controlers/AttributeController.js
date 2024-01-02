const express = require("express");
const router = express.Router();
const attributeModel = require('../Models/AttributesModel');
const attributeValidationsModel = require('../Models/AttributeValidationsModel');
const attributeGroupModel = require('../Models/AttributeGroupsModel')
const userModel = require('../Models/UserModel');
const verifyToken = require("../Middlewares/auth");
const HistoryModel = require("../Models/HistoryModel");


/////////////////////////////////////////////////////////////////////////// ATTRIBUTE //////////////////////////////////////////////////////////////////////////////////////////


router.get("/getAttributes", verifyToken("65945466f508cdc5c4e46650"), async (req, res) => {
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

router.get("/getAttribute", verifyToken("65945466f508cdc5c4e46650"), async (req, res) => {
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
            select: 'Name Code Type'
        })
        .exec();
    if (!attribute) return res.status(200).send('There is no Attributes')

    const tempAttrVal = [];
    attribute.AttributeValidations.forEach(attrValidation => {
        tempAttrVal.push({
            _id: attrValidation.Validation._id,
            Name: attrValidation.Validation.Name,
            Code: attrValidation.Validation.Code,
            Type: attrValidation.Validation.Type,
            Value: attrValidation.Value
        })
    })
    const response = {
        _id: attribute._id,
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

router.post('/CreateAttribute', verifyToken("65945286f508cdc5c4e46605"), async (req, res) => {
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

    const attributeGroupsNames = []; // Boş bir dizi oluştur
    // req.body.AttributeGroups içindeki her bir AttributeGroup için dön
    for (const groupId of req.body.AttributeGroups) {
        // groupId'yi kullanarak AttributeGroup'u bul ve adını al
        const attributeGroup = await attributeGroupModel.findById(groupId);
        if (attributeGroup) {
            attributeGroupsNames.push(attributeGroup.Name);
        }
    }

    const NewAttributeHistory = new HistoryModel({
        entityId: newAttributeId,
        entityType: 'Attribute',
        Description:'Attribute Creation',
        Code: '1011',
        ChangedValues: {
            Name: { oldValue: null, newValue: req.body.Name },
            Code: { oldValue: null, newValue: req.body.Code },
            Type: { oldValue: null, newValue: req.body.Type },
            ItemTypes: { oldValue: [], newValue: req.body.ItemTypes },
            AttributeGroups: { oldValue: [], newValue: attributeGroupsNames },
            AttributeValidations: { oldValue: [], newValue: attributeGroupsNames },
            isRequired: { oldValue: null, newValue: req.body.isRequired },
            isActive: { oldValue: null, newValue: req.body.isActive },
        },
        Comment: null,
        CreatedUser: req.user.userId,
        UpdatedUser: req.user.userId
    })
    NewAttributeHistory.save();

    return res.status(200).send({
        Code: 200,
        Status: 'OK',
        Message: 'Attribute Saved',
        Data: newAttribute
    })
});

router.put('/UpdateAttribute', verifyToken("659452caf508cdc5c4e46608"), async (req, res) => {
    //Check is attribute created already before ?
    const attributeId = req.body._id;

    try {
        // var olan özniteliği bul
        const existingAttribute = await attributeModel.findById(attributeId);

        // öznitelik bulunamazsa hata döndür
        if (!existingAttribute) {
            return res.status(404).json({
                Code: 404,
                Status: 'FALSE',
                Message: 'Attribute not found.',
                Data: {}
            });
        }
        const newAttributeGroupIds = req.body.AttributeGroups || [];
        const oldAttributeGroupIds = existingAttribute.AttributeGroups || [];
        // özniteliği güncelle
        existingAttribute.Name = req.body.Name || existingAttribute.Name;
        existingAttribute.Code = req.body.Code || existingAttribute.Code;
        existingAttribute.Type = req.body.Type || existingAttribute.Type;
        existingAttribute.ItemTypes = req.body.ItemTypes || existingAttribute.ItemTypes;
        existingAttribute.AttributeGroups = req.body.AttributeGroups || existingAttribute.AttributeGroups;
        existingAttribute.AttributeValidations = req.body.AttributeValidations || existingAttribute.AttributeValidations;
        existingAttribute.isRequired = req.body.isRequired || existingAttribute.isRequired;
        existingAttribute.isActive = req.body.isActive || existingAttribute.isActive;
        existingAttribute.UpdatedUser = req.user.userId;

        // attribute grubunu değiştirdiyse, mevcut gruplardan çıkar
        oldAttributeGroupIds.forEach(async (groupId) => {
            if (!newAttributeGroupIds.includes(groupId.toString())) {
                // Attribute'ü eski AttributeGroup'tan çıkar
                await attributeGroupModel.findByIdAndUpdate(groupId, {
                    $pull: { Attributes: attributeId },
                });
            }
        });

        // attribute grubunu değiştirdiyse, yeni gruplara eklenir
        newAttributeGroupIds.forEach(async (groupId) => {
            if (!oldAttributeGroupIds.includes(groupId.toString())) {
                // Attribute'ü yeni AttributeGroup'a ekler
                await attributeGroupModel.findByIdAndUpdate(groupId, {
                    $push: { Attributes: attributeId },
                });
            }
        });

        // güncellenmiş özniteliği kaydet
        attributeModel.updateOne({ _id: attributeId }, existingAttribute)
            .then(result => {
                console.error('Güncellenen Data:', result);
            })
            .catch(error => {
                console.error('Güncelleme Hatası:', error);
            });

        return res.status(200).json({
            Code: 200,
            Status: 'OK',
            Message: 'Attribute updated',
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            Code: 500,
            Status: 'FALSE',
            Message: 'Internal Server Error',
            Data: {}
        });
    }
});

router.delete('/DeleteAttribute', verifyToken("659452d5f508cdc5c4e4660b"), async (req, res) => {
    try {
        const attributeId = req.query._id;
        const deletedDocument = await attributeModel.findByIdAndRemove(attributeId);
        if (deletedDocument) {
            // AttributeGroups modelindeki ilgili belgeleri güncelle
            const updateResult = await attributeGroupModel.updateMany(
                { Attributes: attributeId },
                { $pullAll: { Attributes: [attributeId] } }
            );

            if (updateResult.modifiedCount > 0) {
                res.status(200).json({
                    Code: 200,
                    Status: 'OK',
                    Message: 'Belge Başarıyla Silindi ve AttributeGroups Güncellendi.',
                    Data: deletedDocument
                });
            } else {
                console.log('AttributeGroups Güncellenemedi.');
                res.status(500).json({
                    Code: 500,
                    Status: 'FALSE',
                    Message: 'AttributeGroups Güncelleme Hatası',
                    Data: {}
                });
            }
        } else {
            res.status(404).json({
                Code: 404,
                Status: 'FALSE',
                Message: 'Belge Bulunamadı.',
                Data: {}
            });
        }
    } catch (error) {
        console.error('Silme Hatası:', error);
        res.status(500).json({
            Code: 500,
            Status: 'FALSE',
            Message: 'Internal Server Error',
            Data: {}
        });
    }
});

router.post("/AttributesTableData", verifyToken("65945466f508cdc5c4e46650"), async (req, res) => {
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


/////////////////////////////////////////////////////////////////////////// ATTRIBUTE VALIDATIONS //////////////////////////////////////////////////////////////////////////////////////////

router.get("/getAttributeValidation", verifyToken("65945466f508cdc5c4e46650"), async (req, res) => {
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

router.post('/CreateAttributeValidations', verifyToken("65945466f508cdc5c4e46650"), async (req, res) => {
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
});

/////////////////////////////////////////////////////////////////////////// ATTRIBUTE GROUPS //////////////////////////////////////////////////////////////////////////////////////////

router.get("/getAttributeGroup", verifyToken("6594546af508cdc5c4e46653"), async (req, res) => {
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

router.get("/getAttributeGroups", verifyToken("6594546af508cdc5c4e46653"), async (req, res) => {
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

router.post('/CreateAttributeGroup', verifyToken("65945314f508cdc5c4e4660e"), async (req, res) => {
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
});

router.post("/AttributeGroupsTableData", verifyToken("6594546af508cdc5c4e46653"), async (req, res) => {
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
            .sort(sortObject)
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

module.exports = router;