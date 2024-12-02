const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.post('/register', (req, res) => {
    const {username, password} = req.body;
    res.json({requestData:{username,password}});
});

app.listen(4000);
// mongodb+srv://blog:<vorSmLh4HX7Ovx7x>@cluster0.6rxfm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
// un: blog
// pw: vorSmLh4HX7Ovx7x