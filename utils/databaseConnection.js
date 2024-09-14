//const UserModel = require('./model/user'); // Ensure this path is correct
const mongoose = require('mongoose')

async function DatabaseConnection (){
     // Connecting to MongoDB through mongoose
   await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud/comments');

    // On connection successful
    mongoose.connection.on('connected', () => {
        console.log('Mongoose connected to MongoDB');
        return "hello";
    });

    // On connection fail error
    mongoose.connection.on('error', (err) => {
        console.error('Mongoose connection error:', err);
    });

    // On connection disconnected
    mongoose.connection.on('disconnected', () => {
        console.log('Mongoose disconnected from MongoDB');
    })
}

module.exports = DatabaseConnection;