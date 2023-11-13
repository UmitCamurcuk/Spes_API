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
    ItemTypes: [{
        type: ObjectId,
        ref: 'itemtypes'
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