const express = require('express');
const cors = require('cors');
const mongoose = require("mongoose");
const User = require('./models/User');
const Post = require('./models/Post');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const fs = require('fs');

// store user-uploaded images
const multer = require('multer');
const uploadMiddleware = multer({dest: 'uploads/'});

// encryption
const bcrypt = require('bcryptjs');
const salt = bcrypt.genSaltSync(10);
const secret = 'asdfasfdsfasdfadsf43whtehadsafAS#';


const app = express();

app.use(cors({credentials:true, origin:'http://localhost:3000'}));
app.use(express.json());
app.use(cookieParser());
// use images from uploads folder
app.use('/uploads', express.static(__dirname + '/uploads'))

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
        // console.log(info);
        if (err) throw err;
        res.json(info);
    });
});

// logout functionality
app.post('/logout', (req, res) => {
    res.cookie('token', '').json('ok');
});

app.post('/post', uploadMiddleware.single('file'), async (req, res) => {
    // rename file and add file type
    const {path, originalname, filename, destination} = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = destination + filename + '.' + ext;
    fs.renameSync(path, newPath);
    // multer changing destination from uploads/ to uploads\\
    // console.log(newPath);


    // getting user ID through webtoken
    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) =>  {
        if (err) throw err;

        // save rest of post information to database
        const {title, summary, content} = req.body;
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover:newPath,
            author:info.id,
        });
        res.json(postDoc);
    });
});

app.get('/post', async (req, res) => {
    res.json(
        await Post.find()
        .populate('author', ['username'])
        .sort({createdAt: -1})
        .limit(20)
    );
});

app.put('/post', uploadMiddleware.single('file'), async (req, res) => {
    // if image was changed
    let newPath = null;
    if (req.file) {
        const {path, originalname, filename, destination} = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        newPath = destination + filename + '.' + ext;
        fs.renameSync(path, newPath);
    }

    const {token} = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) =>  {
        if (err) throw err;
        const {id, title, summary, content} = req.body;
        const postDoc = await Post.findById(id);
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        if (!isAuthor) {
            return res.status(400).json('You are not the author');
        }

        // save rest of post information to database
        await Post.findByIdAndUpdate(
            id,
            {
                title,
                summary,
                content,
                cover: newPath ? newPath : postDoc.cover,
            }
        );
        res.json('ok');
    });

});

app.get('/post/:id', async (req, res) => {
    const {id} = req.params;
    const postDoc = await Post.findById(id).populate('author', ['username']);
    res.json(postDoc);
});

app.listen(4000);
// mongodb+srv://blog:vorSmLh4HX7Ovx7x@cluster0.6rxfm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
// un: blog
// pw: vorSmLh4HX7Ovx7x