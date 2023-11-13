const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const rolesSchema = new Schema({
    Name: {
        type: String,
        required: true
    },
    Description: {
        type: String,
        required: true
    },
    Permissions: [{
        type: ObjectId,
        ref: 'Permissions'
    }],
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
module.exports = mongoose.model('Roles', rolesSchema);