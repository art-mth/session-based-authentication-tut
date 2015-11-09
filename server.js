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
// have to use MemoryStore which is a huge memory leak and can eat up all our RAM and make our application
// extremely slow. Also the sessions will be gone if the server restarts what obviusly should not happen.
var MongoStore = require('connect-mongo')(session);

// module for logging our requests to the server
var morgan = require("morgan");
//A nice way to load environment variables that you do not want to store in your source code
var habitat = require("habitat");
var env = habitat.load(__dirname + "/.env");

var port = process.env.PORT || 3000;
var app = express();

app.use(morgan("dev"));
// the bodyParser urlencoded parses bodies of Content-Type application/x-www-form-urlencoded
// most browsers send form data like this. The extended option specifies the deserialization
// algorithm. Either qs or querystring. They vary in complexity and it is a question of what you need
// for your use case. If you send complex data which is not flat(array, object) you will need qs
// that only happens when you send data from an ajax request and not from html forms
// forms do not send nested data so extended false --> queryString is enough
app.use(bodyParser.urlencoded({
  extended: false
}));

// setting up the session handling
app.use(session({
  store: new MongoStore({
    mongooseConnection: db.connection
  }),
  // Or use your local mongo database
  // store: new MongoStore({ url: "mongodb://localhost/test-session" });
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
      // compare saved and user input password
      bcrypt.compare(password, user.password, function(err, isMatch) {
        if (isMatch) {
          req.session.regenerate(function() {
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
