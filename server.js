// a lightweight middleware and routing framework for Node
var express = require("express");

// middleware to populate req.body with the parsed body
// can handle different kinds of data from json to URL-encoded
var bodyParser = require("body-parser");
var session = require("express-session");
// cryptographic algorithm module to handle our password encryption
var bcrypt = require("bcrypt-nodejs");
var db = require("./db.js");
// connect-mongo manages the session storage for our app with a mongo database so we do not
// have to use the default MemoryStore which is a huge memory leak and not usable in a production environment
var MongoStore = require('connect-mongo')(session);

// HTTP request logger middleware for express
var morgan = require("morgan");
//A nice way to load environment variables that you do not want to store in your source code
var habitat = require("habitat");
var env = habitat.load(__dirname + "/.env");

var port = process.env.PORT || 3000;
var app = express();

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({
  extended: false
}));

// setting up the session handling
app.use(session({
  store: new MongoStore({
    // reuse the already set up database connection
    mongooseConnection: db.connection
  }),
  // or use your local mongo database
  // store: new MongoStore({ url: "mongodb://localhost/session-storage" });
  secret: env.get("session_secret"),
  resave: false,
  saveUninitialized: true
}));

// protected home route
app.get("/", isLoggedIn, function(req, res) {
  res.sendFile(__dirname + "/index.html");
});

// signin form
app.get("/signin", function(req, res) {
  res.sendFile(__dirname + "/signin.html");
});

// signup form
app.get("/signup", function(req, res) {
  res.sendFile(__dirname + "/signup.html");
});

app.post("/api/signin", function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  // try to retrieve user from database
  db.User.findOne({
    username: username
  }, function(err, user) {
    if (!user) {
      console.log("User: ", username, " does not exists");
      res.redirect("/signin");
    } else {
      // compare user input and saved password
      bcrypt.compare(password, user.password, function(err, isMatch) {
        if (isMatch) {
          // create a session 
          req.session.regenerate(function() {
            // an hour in milliseconds sets the expiration date for the session
            req.session.maxAge = 3600000;
            req.session.user = user;
            res.redirect("/");
          });
        }
      });
    }
  });
});

app.post("/api/signup", function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  db.User.findOne({
    username: username
  }, function(err, user) {
    if (user) {
      console.log("User: ", username, " already exists");
      res.redirect("/signup");
    } else {
      // hash password and store new user in database
      bcrypt.hash(password, null, null, function(err, hash) {
        var user = new db.User({
          username: username,
          password: hash
        });

        user.save(function(err, user) {
          if (err) throw err;
          console.log("saved user to db");
          req.session.regenerate(function(err) {
            if (err) throw err;
            // an hour in milliseconds sets the expiration date for the session
            req.session.maxAge = 3600000;
            req.session.user = user;
            res.redirect("/")
          });
        });
      });
    }
  });
});

// log out user
app.post("/api/logout", function(req, res) {
  req.session.destroy(function(err) {
    if (err) throw err;
    res.redirect("/signin");
  });
});

// checks if user is authenticated
function isLoggedIn(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect("/signin");
  }
}


app.listen(port, function() {
  console.log("Server listening on Port " + port);
});
