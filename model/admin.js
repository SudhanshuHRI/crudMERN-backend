const mongoose = require('mongoose');
const bcrypt = require('bcrypt')
const AdminSchema = new mongoose.Schema({
    name: {
        type: String,
        // required: true
    },
    email: {
        type: String,
        // required: true,
        // unique: true
    },
    phone: {
        type: String,
        // required: true
    },
    city: {
        type: String
    },
    photo: {
        type: String 
    },
    password: {
        type: String 
    }
});

AdminSchema.pre('save', async function (next) {
    const user = this;
    if (!user.isModified('password')) return next(); // Only hash if the password is new or modified
  
    try {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(user.password, salt); // Hash the password with a salt
      next();
    } catch (err) {
      next(err);
    }
  });

const Admin = mongoose.model('AdminModel', AdminSchema);

// Export the model
module.exports = Admin;