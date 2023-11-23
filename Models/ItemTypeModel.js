const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
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
        ref: 'attributes'
    }],
    Families: [{
        type: ObjectId,
        ref: 'families'
    }],
    ShowOnNavbar: {
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
    isActive: {
        type: Boolean,
    },
}, { timestamps: true })

module.exports = mongoose.model('ItemTypes', userSchema);