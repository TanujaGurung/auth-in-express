require("dotenv").config();
const express = require("express");

const app = express();
const bcrypt = require("bcrypt");

const port = 8080;

const jwt = require("jsonwebtoken");

app.use(express.json());

const users = [
  {
    name: "Tanu",
    email: "e@e",
    password: "$2b$10$d2y3Xc5rtlok3BHXCivSR.2PPVYrG3NUa/bUtBNgWo4uN64Dn9plO",
  },
];
const posts = [
  { id: 1, title: "title1" },
  { id: 2, title: "title2" },
  { id: 3, title: "title3" },
];
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: false }));

app.get("/", authenticate, (req, res) => {
  console.log("req.usrre", req.user);
  res.render("home.ejs", { name: req.user.name });
});

app.get("/register", (req, res) => {
  res.render("register.ejs");
});

app.post("/register", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    users.push({
      id: Date.now().toString(),
      user: req.body.name,
      email: req.body.email,
      password: hashedPassword,
    });
    //  res.send()
    //    res.status(201).send()
    res.redirect("/login");
  } catch {
    // res.status(500).send()
    res.redirect("/register");
  }
  console.log("users", users);
});
app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.post("/login", async (req, res) => {
  const user = users.find((user) => user.email == req.body.email);
  console.log("user", user);

  if (!user) {
    return res.send("No User found !!");
  }
  try {
    // hashedPassword = await bcrypt.hash(user.password, 10)
    // console.log(await bcrypt.compare(req.body.password, hashedPassword))
    if (await bcrypt.compare(req.body.password, user.password)) {
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET);
      return res.send(accessToken);
    } else {
      return res.send("password wrong!!");
    }
  } catch {
    return res.send("something went wrong");
  }
});

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
  console.log(`app is running at ${port}`);
});
