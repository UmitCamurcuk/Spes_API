const mongoose = require('mongoose');
const Schema = mongoose.Schema ;

const userSchema = new Schema({
    Type : {
        type: String,
        required : true
    },
    Code : {
        type: String,
        required : true
    },
    ChangedValues : {
        type: String,
        required : true,
    },
    Comment : {
        type: String,
        required : true
    },
    CreatedUser: {
        type: ObjectId,
        ref: 'users'
    },
}, {timestamps: true})

module.exports = mongoose.model('Users',userSchema);