// mongoose is a object mapper for mongoDB
var mongoose = require("mongoose");
// habitat makes it easy to read environment variables from named files
var habitat = require("habitat");
// read in data from .env file access via env
var env = habitat.load(__dirname + "/.env");

var dbuser = env.get("db_user");
var dbpassword = env.get("db_password");

// connection url for our mongolab database
// put in your own database URI here and store
// username and password in the .env file.
var dbUri = "mongodb://"+dbuser+":"+dbpassword+"@ds045614.mongolab.com:45614/authentication-tut";

var db = {};

mongoose.connect(dbUri);
db.connection = mongoose.connection;

db.userSchema = new mongoose.Schema({
  "username": String, 
  "password": String
});

db.User = mongoose.model("User", db.userSchema);

module.exports = db;
