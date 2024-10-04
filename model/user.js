const { required } = require('joi');
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        // required: true
    },
    lastName: {
        type: String,
        // required: true
    },
    email: {
        type: String,
        // required: true,
        unique: true
    },
    phone: {
        type: String,
        // required: true
    },
    city: {
        type: String,
        // required:true
    },
    photo: {
        type: String,
    },
    password:{
        type:String,
        // required:true
    },
    createdAt: {
        type: Date,
        default: Date.now
      },
    
});


const User = mongoose.model('UserModel', userSchema);

// Export the model
module.exports = User;