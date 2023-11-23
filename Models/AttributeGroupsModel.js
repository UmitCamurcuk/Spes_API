const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attributeGroupsSchema = new Schema({
    Name: {
        type: String,
        required: true
    },
    Code: {
        type: String,
        required: true
    },
    Attributes: [{
        type: ObjectId,
        ref: 'attributegroups',
        required: false
    }],
    ItemTypes: [{
        type: ObjectId,
        ref: 'attributegroups',
        required: false
    }],
    isActive: {
        type: Boolean,
    },
    CreatedUser: {
        type: ObjectId,
        ref: 'users'
    },
    UpdatedUser: {
        type: ObjectId,
        ref: 'users'
    }
}, { timestamps: true })

module.exports = mongoose.model('AttributeGroups', attributeGroupsSchema);