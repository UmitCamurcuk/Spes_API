const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    Name: {
        type: String,
        required: true
    },
    LastName: {
        type: String,
        required: true
    },
    UserName: {
        type: String,
        required: true,
    },
    Password: {
        type: String,
        required: true
    },
    Email: {
        type: String,
        required: true
    },
    BirthDate: {
        type: Date,
    },
    Roles: [{
        type: ObjectId,
        ref: 'Roles'
    }],
    Phone: {
        type: String,
    },
    isActive: {
        type: Boolean,
    },
    Location: {
        type: String,
    },
}, { timestamps: true })

module.exports = mongoose.model('Users', userSchema);