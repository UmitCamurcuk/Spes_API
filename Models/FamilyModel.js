const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema ;

const familySchema = new Schema({
    Name : {
        type: String,
        required : true
    },
    Code : {
        type: String,
        required : true
    },
    ItemType: {
        type: ObjectId,
        ref: 'itemtypes',
        required:false
    },
    AttributeGroups: [{
        type: ObjectId,
        ref: 'attributegroups'
    }],
    Attributes: [{
        type: ObjectId,
        ref: 'attributes'
    }],
    CreatedUser : {
        type: ObjectId,
        ref: 'users'
    },
    UpdatedUser : {
        type: ObjectId,
        ref: 'users'
    },
    isActive : {
        type: Boolean,
    },
}, {timestamps: true})

module.exports = mongoose.model('Family',familySchema);