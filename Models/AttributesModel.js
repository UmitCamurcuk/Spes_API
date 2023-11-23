const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const attributeSchema = new Schema({
    Name: {
        type: String,
        required: true
    },
    Code: {
        type: String,
        required: true
    },
    Type: {
        type: String,
        required: true,
    },
    ItemTypes: [{
        type: ObjectId,
        ref: 'itemtypes'
    }],
    AttributeGroups: [{
        type: ObjectId,
        ref: 'attributegroups'
    }],
    AttributeValidations: [{
        Validation: {
            type: ObjectId,
            ref: 'attributevalidations'
        },
        Value: {
            type: String
        }
    }],
    isRequired: {
        type: Boolean,
        default: false
    },
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
    },
}, { timestamps: true })

module.exports = mongoose.model('Attributes', attributeSchema);