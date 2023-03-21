const dotenv = require('dotenv');
const express = require('express');
const cookieparser = require('cookie-parser');
const jwt = require('jsonwebtoken')


// Configuring dotenv
dotenv.config();

const app = express();

// Setting up middlewares to parse request body and cookies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieparser());
const port = 8080;

const posts = [
    { id: 1, title: "title1" },
    { id: 2, title: "title2" },
    { id: 3, title: "title3" },
  ];

const userCredentials = {
    username: 'admin',
    password: 'admin123',
    email: 'admin@gmail.com'
}

app.get("/login", (req, res) => {
    res.render("login.ejs");
  });

app.post('/login', (req, res) => {
    // Destructuring username & password from body
    const { username, password } = req.body;
    console.log("req.body", req.body)
    console.log("username", username)
    console.log("password", password)

    // Checking if credentials match
    if (username === userCredentials.username && 
        password === userCredentials.password) {
        
        //creating a access token
        const accessToken = jwt.sign({
            username: userCredentials.username,
            email: userCredentials.email
        }, process.env.ACCESS_TOKEN_SECRET, {
            expiresIn: '30s'
        });
        // Creating refresh token not that expiry of refresh 
        //token is greater than the access token
        
        const refreshToken = jwt.sign({
            username: userCredentials.username,
        }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: '1d' });

        // Assigning refresh token in http-only cookie 
        res.cookie('jwt', refreshToken, { httpOnly: true, 
            sameSite: 'None', secure: true, 
            maxAge: 24 * 60 * 60 * 1000 });
        return res.json({ accessToken });
    }
    else {
        // Return unauthorized error if credentials don't match
        return res.status(406).json({ 
            message: 'Invalid credentials' });
    }
})

app.post('/refresh', (req, res) => {
    if (req.cookies?.jwt) {

        // Destructuring refreshToken from cookie
        const refreshToken = req.cookies.jwt;

        // Verifying refresh token
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, 
        (err, decoded) => {
            if (err) {

                // Wrong Refesh Token
                return res.status(406).json({ message: 'Unauthorized' });
            }
            else {
                // Correct token we send a new access token
                const accessToken = jwt.sign({
                    username: userCredentials.username,
                    email: userCredentials.email
                }, process.env.ACCESS_TOKEN_SECRET, {
                    expiresIn: '10m'
                });
                return res.json({ accessToken });
            }
        })
    } else {
        return res.status(406).json({ message: 'Unauthorized' });
    }
})

app.get("/posts", authenticate, (req, res) => {
    res.send(posts);
  });


function authenticate(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
      if (err) res.send("access declined");
      req.user = user;
      next();
    });
  }
  
app.listen(port, () => {
    console.log(`Server active on http://localhost:${port}!`);
})