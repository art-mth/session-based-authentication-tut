#Session-Based Authentication#

This repo contains the code for one of my blogposts on Session-Based Authentication. If you have not read it you can do so [here](http://arthurmathies.com/2015/11/08/Authentication1/).

##Usage##
If you want to play around with the code feel free to clone the repo.

In order to get the code to run you will need to set up a few things.

* run `npm install`

* Switch out the database var dbUri = "mongodb://"+dbuser+":"+dbpassword+"@ds045614.mongolab.com:45614/authentication-tut" in `db.js` line 14 to your own local or remote database.

* Create a file named .env and add data of the following form to it. Obviously using your own data.

```
	{
  "SESSION_SECRET": "Your very secret secret",
  "DB_USER": "yourDatabaseUsername",
  "DB_PASSWORD": "yourDatabasePassword"
}

```

* start your server with `node server.js`

* open your Web browser on localhost:3000

You should be all set.

##License##
MIT &copy; [Arthur Mathies](https://github.com/arthurmathies)