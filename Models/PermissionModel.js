const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const permissionsSchema = new Schema({
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
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

module.exports = mongoose.model('Permissions', permissionsSchema);