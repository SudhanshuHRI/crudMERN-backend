
const mongoose = require('mongoose');

const otpValidate = new mongoose.Schema({
    otp: {
        type: Number,
    },
    email:{
        type:String,
        unique:true
    },
    createdAt: {
        type: Date,
        default: Date.now
      },
    
});


const otpSchema = mongoose.model('otp', otpValidate);
// Export the model
module.exports = otpSchema;