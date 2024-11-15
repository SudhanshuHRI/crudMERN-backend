const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const UserModel = require('./model/user'); // Ensure this path is correct
const otpSchema = require("./model/otp")
const multer = require('multer');
const bcrypt = require('bcrypt')
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const redis = require('redis');
const path = require('path')


const secretKey = 'Sudhanshu@221254';
const app = express();

const storage = multer.diskStorage({
    destination: function (req, file, cb) { cb(null, "uploads/") },
    filename: function (req, file, cb) { cb(null, Date.now() + path.extname(file.originalname)) }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    // fileFilter: function (req, file, cb) {
    //     const fileTypes = /jpeg|jpg|png|gif/;
    //     const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    //     const mimetype = fileTypes.test(file.mimetype)

    //     // console.log(extname,mimetype,fileTypes,file.mimetype)

    //     if (extname && mimetype) {
    //         return cb(null, true)
    //     } else {
    //         cb("Error: Image only")
    //     }
    // }


});

// Middlewares
app.use(cors({
    origin: ['http://localhost:3000'], // Adjust this to your frontend URL
    credentials: true // Allow credentials (cookies) to be sent
}

));

app.use("/uploads", express.static('uploads'))

app.use(express.json({ limit: '10mb' }));

const authenticateToken = (req, res, next) => {

    //if token is send through headers
    //const authHeader = req.headers['authorization'];
    //const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    //if token is saved in cookies:method 1
    const cookie = req.headers.cookie;
    let token = "";
    if (cookie) {
        const jwtCookie = cookie.split('; ').find(row => row.startsWith('jwt='));
        token = jwtCookie ? jwtCookie.split('=')[1] : undefined;
    } else {
        token = undefined;
    }


    //if token is saved in cookies:method 2

    //const token = req.cookie.jwt; //"jwt" cookie name

    if (!token) return res.status(401).send({ status: 401, message: 'Token required.' });

    const varifyTkn = varifyJwtToken(token);
    if (varifyTkn) {
        next();
    } else {
        res.status(403).send({ status: 403, message: 'Invalid Token' });
    }
}

// functions
const generateToken = (emailId) => {

    // payload means this information is used to generate token.
    const payload = {
        email: emailId
    };

    // this will generate a token that will expire in 1 hour.
    const token = jwt.sign(payload, secretKey, {
        expiresIn: '1h', // Token expiration time
    });

    return token;
}

const varifyJwtToken = (token) => {



    try {
        const result = jwt.verify(token, secretKey);
        return result;
    } catch (error) {
        return false;
    }



}

// Routes
app.get('/', async (req, res) => {
    res.status(200).json({ status: 200, message: "Welcome to MERN Crud..." });
});

app.get('/api/getUsers', authenticateToken, async (req, res) => {

    try {
        await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');
        if (mongoose.connection.readyState === 1) {
            const existingItem = await UserModel.find({});
            if (existingItem) {
                res.status(200).json({ status: 200, message: "Users Found.", data: existingItem })
            } else {
                res.status(404).json({ status: 404, message: "No user found!!" })
            }

        }
    } catch (error) {
        res.status(500).json({ status: 500, message: "Unable to connect to database!!" });
    }


});

app.get('/api/getUsers/:id', authenticateToken, async (req, res) => {

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        res.status(404).json({ status: 404, message: `No such Id : ${id}` })
    }

    await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');

    if (mongoose.connection.readyState === 1) {

        const existingItem = await UserModel.find({ _id: id });
        if (existingItem) {
            res.status(200).json({ status: 200, message: "User Found.", data: existingItem })
        } else {
            res.status(404).json({ status: 404, message: `No user found with id : ${id}` })
        }

    } else {
        res.status(500).json({ status: 500, messsage: "Unable to connect to database!!" });
    }

});

app.put('/api/UpdateUser/:id', upload.single('photo'), authenticateToken, async (req, res) => {

    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        return res.status(404).json({ status: 404, message: `No such Id : ${id}` })
    }

    const updatedData = req.body;



    if (req.file) {
        const allowedFromats = ["image/png", "image/jpg", "image/jpeg", "image/gif"]

        if (!allowedFromats.includes(req.file.mimetype)) {
            return res.json({ status: 500, message: "invalid photo format" })
        }
        updatedData.photo = req.file.path;

    }

    console.log("updateData:", updatedData)
    await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');
    if (mongoose.connection.readyState === 1) {
        const updatedValue = await UserModel.findByIdAndUpdate(id, updatedData, { new: true });
        if (!updatedValue) {
            return res.status(404).send('Value not found!!');
        }
        else {
            return res.status(200).json({ status: 200, message: "Details updated.", data: updatedValue });
        }

    }


});

app.delete('/api/DeleteUser/:id', authenticateToken, async (req, res) => {

    const { id } = req.params;

    await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');
    if (mongoose.connection.readyState === 1) {
        const deletedUser = await UserModel.findByIdAndDelete(id);
        if (deletedUser) { res.json({ status: 200, message: "user deleted!!" }) }
    }

});

app.post('/api/register', upload.single('photo'), async (req, res) => {

    console.log("req.file:", req.file)

    const firstname = req.body.firstName; //yhn par wo naam padega jo postman ke key me likha hai;
    const lastname = req.body.lastName;
    const email = req.body.email;
    const phone = req.body.phone;
    const password = req.body.password;
    const city = req.body.city;
    const profilephoto = req.file.path;

    // console.log("req.body:", req.body)
    console.log("req.file:", req.file)
    // console.log("profilephoto:", profilephoto)

    const schema = Joi.object({
        firstName: Joi.string().required(),
        lastName: Joi.string().required(),
        email: Joi.string().required().email(),
        phone: Joi.string().required(),
        password: Joi.string().required(),
        city: Joi.string().required(),
    });


    const { error } = schema.validate(req.body); // Validate request body against the schema

    if (error) {
        // Send error response if validation fails
        return res.status(400).json({
            message: 'Validation failed',
            error: error.details[0].message,  // Send validation error message
        });
    } else {
        try {

            await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');
            if (mongoose.connection.readyState === 1) {
                console.log("Connection successfull")

                const hashpassword = await bcrypt.hash(password, 10);

                const user = new UserModel({
                    firstName: firstname,
                    lastName: lastname,
                    email: email.toLowerCase(),
                    phone: phone,
                    city: city,
                    photo: profilephoto ? profilephoto : "",
                    password: hashpassword
                });



                try {
                    await user.save();
                } catch (error) {
                    console.log("try-catch error:", error)
                    res.json({ status: 500, Error: error })
                }



                res.status(201).json({ status: 201, message: "User registered successfully.", UserData: user });
            } else {
                res.json({ status: 400, message: "Connection not successfull!!" });
            }

        } catch (err) {
            res.status(500).json({ status: 500, message: 'Something went wrong!!', Error: err });
        }
    }
});

app.post('/api/login', async (req, res) => {

    const schema = Joi.object({
        email: Joi.string().required(),
        password: Joi.string().required(),
    });

    const { error } = schema.validate(req.body);

    if (error) {
        return res.status(400).json({
            message: 'Validation failed',
            error: error.details[0].message,
        });
    }

    try {
        const email = req.body.email;
        const password = req.body.password;

        if (email == "" || email == undefined) {
            res.json({ status: 400, message: "Email is required!!" })
        } else if (password == "" || password == undefined) {
            res.json({ status: 400, message: "Password is required!!" })
        } else {
            await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');
            if (mongoose.connection.readyState === 1) {

                const checkUser = await UserModel.findOne({ email: email.toLowerCase() })
                if (!checkUser) return res.status(404).json({ error: 'User not found' });

                const isMatch = await bcrypt.compare(password, checkUser.password);
                if (!isMatch) return res.status(401).json({ status: 401, error: 'Invalid password' });

                const getToken = generateToken(email)

                res.cookie('jwt', getToken, {
                    httpOnly: true, // Makes the cookie inaccessible to JavaScript
                    //secure: false,   // Use true in production when using HTTPS
                    sameSite: 'strict', // Prevents CSRF attacks by restricting cross-site requests
                    maxAge: 60 * 60 * 1000, // Token expiration time in milliseconds (1 hour here)
                });

                res.status(200).json({ status: 200, message: "Login successfull!", user: checkUser });

            } else {
                res.status(400).json({ message: "Unable to connect to database" })
            }
        }
    } catch (err) {
        res.status(500).json({ error: 'Login failed: ' + err.message });
    }

});

app.post('/api/loginWithGoogle', async (req, res) => {

    // console.log("req.body:",req.body.token)

    const idToken = req.body.token;
    const userData = req.body.userData;


    try {
        const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        const data = await response.json();

        if (data.error_description) {
            res.status(400).json({ status: 400, message: data.error_description })
        } else {

            const getToken = generateToken(data.email)
            res.cookie('jwt', getToken, {
                httpOnly: true,
                //secure: false,   
                sameSite: 'strict',
                maxAge: 60 * 60 * 1000,
            });

            await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');
            if (mongoose.connection.readyState === 1) {
                console.log("Connection successfull")
                const existingItem = await UserModel.find({ email: userData.email.toLowerCase() });
                console.log("existing item:", existingItem)
                const name = userData.displayName.split(" ")

                if (existingItem.length == 0) {
                    const user = new UserModel({
                        firstName: name[0] ? name[0] : userData.displayName,
                        lastName: name[1] ? name[1] : "",
                        email: userData.email.toLowerCase(),
                        phone: "",
                        city: "",
                        photo: userData.photoURL
                    });
                    await user.save();
                }
            }

            res.status(200).json({ status: 200, message: " GoogleToken is valid + jwt token added in cookies + user saved in database", })
        }
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }

    // const schema = Joi.object({
    //     email: Joi.string().required(),
    //     password: Joi.string().required(),
    // });

    // const { error } = schema.validate(req.body);

    // if (error) {
    //     return res.status(400).json({
    //         message: 'Validation failed',
    //         error: error.details[0].message,
    //     });
    // }

    // try {
    //     const email = req.body.email;
    //     const password = req.body.password;

    //     if (email == "" || email == undefined) {
    //         res.json({ status: 400, message: "Email is required!!" })
    //     } else if (password == "" || password == undefined) {
    //         res.json({ status: 400, message: "Password is required!!" })
    //     } else {
    //         await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');
    //         if (mongoose.connection.readyState === 1) {

    //             const checkUser = await UserModel.findOne({ email: email.toLowerCase() })
    //             if (!checkUser) return res.status(404).json({ error: 'User not found' });

    //             const isMatch = await bcrypt.compare(password, checkUser.password);
    //             if (!isMatch) return res.status(401).json({ status: 401, error: 'Invalid password' });

    //             const getToken = generateToken(email)

    //             res.cookie('jwt', getToken, {
    //                 httpOnly: true, // Makes the cookie inaccessible to JavaScript
    //                 //secure: false,   // Use true in production when using HTTPS
    //                 sameSite: 'strict', // Prevents CSRF attacks by restricting cross-site requests
    //                 maxAge: 60 * 60 * 1000, // Token expiration time in milliseconds (1 hour here)
    //             });

    //             res.status(200).json({ status: 200, message: "Login successfull!" });

    //         } else {
    //             res.status(400).json({ message: "Unable to connect to database" })
    //         }
    //     }
    // } catch (err) {
    //     res.status(500).json({ error: 'Login failed: ' + err.message });
    // }


});

app.post('/api/forgotPassword', async (req, res) => {


    const email = req.body.email;
    const varifyOtp = req.body.otp;


    if (varifyOtp) {
        await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');
        if (mongoose.connection.readyState === 1) {
            const findotp = await otpSchema.findOne({ email: email })
            if (findotp) {

                console.log("findotp.otp", findotp.otp)
                console.log("type of :", typeof findotp.otp)
                console.log("varifyOtp", varifyOtp)
                console.log("varifyOtp :", typeof varifyOtp)
                if (findotp.otp == varifyOtp) {
                    const currentTime = new Date();
                    const expiresAt = new Date(findotp.createdAt);
                    expiresAt.setMinutes(expiresAt.getMinutes() + 5);

                    if (currentTime > expiresAt) {
                        const findotp = await otpSchema.findOneAndDelete({ email: email })
                        return res.status(400).json({ status: 400, message: 'OTP has expired' });
                    } else {
                        const findotp = await otpSchema.findOneAndDelete({ email: email })
                        return res.status(200).json({ status: 200, message: "OTP varified" })
                    }
                } else {
                    return res.status(400).json({ status: 400, message: "Wrong OTP!!" })
                }
            } else {
                return res.status(400).json({ status: 400, message: "No OTP found!!" })
            }

        }


    } else {

        await mongoose.connect('mongodb+srv://salil221254:IIafunHcWjN1XXtq@cluster0.krw4naq.mongodb.net/MERN_crud');
        if (mongoose.connection.readyState === 1) {
            const findotp = await otpSchema.findOne({ email: email })
            if (findotp) {
                res.status(500).json({ status: 500, message: "OTP sent already!!" })
            } else {
                let generatedOtp = Math.floor(Math.random() * 10000);

                if (generatedOtp.toString().length != 4) {
                    generatedOtp = generatedOtp + 1234;
                }

                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    port: 465,
                    secure: true,
                    auth: {
                        user: 'salil221254@gmail.com',
                        pass: 'lrnu pvye liml zygm'
                    }
                });
                const mailOptions = {
                    from: 'salil221254@gmail.com',
                    to: email,
                    subject: 'CRUD OTP',
                    text: `Hi ${email}. \nYour otp is  : ${generatedOtp}`,
                    // html: '<b>Hello world?</b>'                  
                };
                transporter.sendMail(mailOptions, async (error, info) => {
                    if (error) {
                        res.status(400).json({ status: 400, message: error })
                    } else {
                        const user = new otpSchema({
                            email: email,
                            otp: generatedOtp
                        });

                        await user.save();
                        res.status(200).json({ status: 200, message: `OTP send to ${email}`, details: info });
                    }
                });
            }
        }

    }

});

app.get("/api/logout", async (req, res) => {
    res.clearCookie('jwt', { path: '/' });


    res.status(200).json({ status: 200, message: 'Logged out successfully' });
})


// Error handling middleware
// app.use((err, req, res, next) => {
//     console.error('Server error:', err);
//     res.status(500).json({ error: 'Internal Server Error' });
// });

// Server is live on this port
app.listen(5000, () => {
    console.log("Server is running on port 5000");
});


