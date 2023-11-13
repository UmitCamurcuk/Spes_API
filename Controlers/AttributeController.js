const express = require("express");
const router = express.Router();
const attributeModel = require('../Models/AttributesModel');
const userModel = require('../Models/UserModel');
const verifyToken = require("../Middlewares/auth");

router.get("/getAttributes", verifyToken("654d44613c6a0da0725273ab"), async (req, res) => {
    const allAttributes = await attributeModel.find()
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role'
        })
        .exec();
    if (!allAttributes) return res.status(200).send('There is no Attributes')
    return res.status(200).send(allAttributes);
});

router.get("/getAttribute", verifyToken("654d44613c6a0da0725273ab"), async (req, res) => {
    const attribute = await attributeModel.findOne({ 'Code': req.query.Code })
        .populate({
            path: 'CreatedUser UpdatedUser',
            model: userModel,
            select: 'Name LastName Role'
        })
        .exec();
    if (!attribute) return res.status(200).send('There is no Item')

    return res.status(200).send(attribute);
});

router.post('/CreateAttribute', verifyToken("654d44643c6a0da0725273ae"), async (req, res) => {
    //Check is attribute created already before ?
    var attribute = await attributeModel.find({
        Code: req.body.Code
    })
    if (attribute.length > 0) return res.status(200).send('This Attribute Code is Already Taken.');
    const newAttribute = new attributeModel(
        {
            Name: req.body.Name,
            Code: req.body.Code,
            Type: req.body.Type,
            ItemTypes: req.body.ItemTypes,
            isRequired: req.body.isRequired,
            CreatedUser: req.user.userId,
            UpdatedUser: req.user.userId
        }
    )
    newAttribute.save();
    return res.status(200).send('User Saved')
})
module.exports = router;