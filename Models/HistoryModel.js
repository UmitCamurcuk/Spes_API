const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const Schema = mongoose.Schema ;

const userSchema = new Schema({
    entityId: {
        type: ObjectId,
        required: true,
    },
    entityType: {
        type: String,
        required: true,
    },
    Description:{
        type:String,
        required:true,
    },
    Code : {
        type: String,
        required : true
    },
    ChangedValues : {
        type: Object,
        required : true,
    },
    Comment : {
        type: String,
        required : false
    },
    CreatedUser: {
        type: ObjectId,
        ref: 'users'
    },
    UpdatedUser: {
        type: ObjectId,
        ref: 'users'
    },
}, {timestamps: true})

module.exports = mongoose.model('History',userSchema);