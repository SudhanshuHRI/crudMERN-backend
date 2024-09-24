const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UserModel = require('./model/user'); // Ensure this path is correct
const multer = require('multer');
const bcrypt = require('bcrypt')
const Joi = require('joi');


const app = express();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Routes
app.get('/', async (req, res) => {
    res.json({ message: "Welcome to MERN" });
});

app.get('/api/getDummyUsers', async (req, res) => {

    await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/sample_mflix');

    if (mongoose.connection.readyState === 1) {
        console.log("Connection successfull")
        const usersSchema = new mongoose.Schema({
            name: String,
            email: String,
            password: String
        })
        const item = mongoose.model('users', usersSchema)

        const existingItem = await item.find({});
        res.json(existingItem)

    } else {
        res.json("Connection not successfull");
    }
});

app.get('/api/getUsers', async (req, res) => {

    await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');

    if (mongoose.connection.readyState === 1) {
        console.log("Connection successfull")
        const existingItem = await UserModel.find({});
        res.json(existingItem)

    } else {
        res.json("Connection not successfull");
    }
});

app.get('/api/getUsers/:id', async (req, res) => {

    const { id } = req.params;

    await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');

    if (mongoose.connection.readyState === 1) {
        console.log("Connection successfull")
        // const usersSchema = new mongoose.Schema({
        //     name: String,
        //     email: String,
        //     password: String
        // })
        // const item = mongoose.model('users', usersSchema)

        const existingItem = await UserModel.find({ _id: id });
        res.json(existingItem)

    } else {
        res.json("Connection not successfull");
    }
});

app.post('/api/register', upload.single('photo'), async (req, res) => {

    try {

        console.log('Uploaded Files:', req.file);
        await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');
        if (mongoose.connection.readyState === 1) {
            console.log("Connection successfull")
            const firstname = req.body.firstName; //yhn par wo naam padega jo postman ke key me likha hai;
            const lastname = req.body.lastName;
            const email = req.body.email;
            const phone = req.body.phone;
            const password = req.body.password;
            const city = req.body.city;
            const profilephoto = req.file;

            console.log("firstname :",firstname);
            console.log("lastname :",lastname);
            console.log("email :",email);
            console.log("phone :",phone);
            console.log("password :",password);
            console.log("city :",city);
            console.log("photo:",profilephoto)
            




            const hashpassword = await bcrypt.hash(password,10);

            const user = new UserModel({
                firstName: firstname,
                lastName: lastname,
                email: email.toLowerCase(),
                phone: phone,
                city: city,
                photo: profilephoto.buffer,
                password:hashpassword
            });

            await user.save();
            res.status(201).json(user);
        } else {
            res.json("Connection not successfull");
        }



    } catch (err) {
        console.error("Error processing request:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.put('/api/UpdateUser/:id', upload.single('photo'), async (req, res) => {

    const { id } = req.params;

    const firstname = req.body.fname;
    const lastname = req.body.lname;
    const email = req.body.email;
    const phone = req.body.phone;
    const city = req.body.city;
    const photo = req.file;

    console.log("first", firstname)

    await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');
    if (mongoose.connection.readyState === 1) {
        const updatedUser = await UserModel.findByIdAndUpdate(
            id,
            {
                firstName: firstname,
                lastName: lastname,
                email: email,
                phone: phone,
                city: city,
                photo: photo
            },
            { new: true, runValidators: true } // Options to return the updated document
        );

        if (updatedUser) { res.json({ "updated Data": updatedUser }) }
        else { res.json({ "message": "unable to update" }) }
    }



    // try {
    //     console.log('Request Body:', req.body.example);
    //     console.log('Uploaded Files:', req.file);

    //     await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');
    //     if (mongoose.connection.readyState === 1) {
    //         console.log("Connection successfull")
    //         const firstname = req.body.fname;
    //         const lastname = req.body.lname;
    //         const email = req.body.email;
    //         const phone = req.body.phone;
    //         const city = req.body.city;
    //         const profilephoto = req.file;

    //         const user = new UserModel({
    //             firstName: firstname,
    //             lastName: lastname,
    //             email: email,
    //             phone: phone,
    //             city: city,
    //             photo: profilephoto.path
    //         });

    //         await user.save();
    //         res.status(201).json(user);
    //     } else {
    //         res.json("Connection not successfull");
    //     }



    // } catch (err) {
    //     console.error("Error processing request:", err);
    //     res.status(500).json({ error: 'Internal Server Error' });
    // }
});

app.delete('/api/DeleteUser/:id', async (req, res) => {

    const { id } = req.params;

    await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');
    if (mongoose.connection.readyState === 1) {
        const deletedUser = await UserModel.findByIdAndDelete(id);
        if (deletedUser) { res.json({ message: "user deleted!!" }) }
    }

});

app.post('/api/login', async (req, res) => {

    try {
        const email = req.body.email.toLowerCase();
        const password = req.body.password;

        await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');
        if (mongoose.connection.readyState === 1) {

            const checkUser = await UserModel.findOne({email})
            
          
            if (!checkUser) return res.status(404).json({ error: 'User not found' });

            const isMatch = await bcrypt.compare(password, checkUser.password);

            if (!isMatch) {
                return res.status(401).json({ error: 'Invalid password' });
            }
            res.json({ message: "Login successful!" });
        } else {
            res.status(400).json({ message: "Unable to connect to database" })
        }


    } catch (err) {
        res.status(500).json({ error: 'Login failed: ' + err.message });
    }


});



// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

// Server is live on this port
app.listen(3000, () => {
    console.log("Server is running on port 3000");
});


