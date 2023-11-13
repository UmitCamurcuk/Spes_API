const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema ;

const userSchema = new Schema({
    Name : {
        type: String,
        required : true
    },
    Code : {
        type: String,
        required : true
    },
    ItemType : {
        type: ObjectId,
        ref: 'ItemTypes'
    },
    Family : {
        type: String,
        required : false
    },
    Category : {
        type: String,
        required : false
    },
    Attributes : [{
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

module.exports = mongoose.model('Items',userSchema);