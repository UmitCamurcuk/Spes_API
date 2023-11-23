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
    AttributeType: {
        type: String,
        required: true,
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

module.exports = mongoose.model('AttributeValidations', attributeSchema);