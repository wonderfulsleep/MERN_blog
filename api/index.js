const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

// encryption
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const secret = 'asdfasfdsfasdfadsf43whtehadsafAS#';


const app = express();

app.use(cors({credentials:true, origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());

// connect to mongoose
mongoose.connect('mongodb+srv://blog:vorSmLh4HX7Ovx7x@cluster0.6rxfm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0');

app.post('/register', async (req, res) => {
    const {username, password} = req.body;
    try {
        const userDoc = await User.create({
            username, 
            password:bcrypt.hashSync(password, salt),
        });
        res.json(userDoc);
    } catch(e) {
        res.status(400).json(e);
    }
});

// check login information
app.post('/login', async (req, res) => {
    const{username, password} = req.body;
    const userDoc = await User.findOne({username})
    const passOk = bcrypt.compareSync(password, userDoc.password);
    
    if (passOk) {
        // respond with json web token
        jwt.sign({username, id:userDoc._id}, secret, {}, (err, token) => {
            if (err) throw err;
            res.cookie('token', token).json({
                id:userDoc._id,
                username,
            });
        })

    } else {
        // not logged in
        res.status(400).json('wrong credentials');
    }
 });

// endpoint to check that there's a valid login cookie
app.get('/profile', (req, res) => {
    // console.log(req.cookies);
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, (err, info) =>  {
        // this is not caught yet
        if (err) throw err;
        res.json(info);
    });
});

// logout functionality
app.post('/logout', (req, res) => {
    res.cookie('token', '').json('ok');
});


app.listen(4000);
// mongodb+srv://blog:<vorSmLh4HX7Ovx7x>@cluster0.6rxfm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
// un: blog
// pw: vorSmLh4HX7Ovx7x