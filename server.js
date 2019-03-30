// Dependencies
var express = require("express");
var exphbs = require('express-handlebars');

var logger = require("morgan");
var mongoose = require("mongoose");
var moment = require("moment");

// Scraping tools
var cheerio = require("cheerio");
var axios = require("axios");

// Require all models
var db = require("./models");

// Initialize Express
var PORT = process.env.PORT || 3000;

var app = express();
var exphbs = require("express-handlebars");


// Configure middleware
// Use morgan logger for logging requests
app.use(logger("dev"));
// Parse request body as JSON
app.use(express.urlencoded({extended: true}));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));
app.engine('handlebars', exphbs({
  defaultLayout: 'main'
}));
app.set('view engine', 'handlebars');

// Connect to the Mongo DB
// mongoose.connect("mongodb://localhost/testScrapeDB", { useNewUrlParser: true });
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/testScrapeDB";

mongoose.connect(MONGODB_URI, { useNewUrlParser: true });


 // Routes
app.get("/", function(req, res) {
  res.send(index.html);
});

// A GET route for scraping the website
app.get("/scrape", function(req, res) {
  axios.get("https://www.sfchronicle.com/").then(function(response) {
    var $ = cheerio.load(response.data);

    $("article h2").each(function(i, element) {

      var result = {};

      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");

      db.Article.create(result)
        .then(function(dbArticle) {
          console.log(dbArticle);
        })
        .catch(function(err) {
          console.log(err);
        });
    });

    res.send("Scrape Complete");
  });
});
// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  
  db.Article
    .find({})
    .sort({articleCreated:-1})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function(req, res) {

  db.Article
    .findOne({ _id: req.params.id })
    .populate("note")
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function(req, res) {

  db.Note
    .create(req.body)
    .then(function(dbNote) {
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
    })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for saving/updating article to be saved
app.put("/saved/:id", function(req, res) {

  db.Article
    .findByIdAndUpdate({ _id: req.params.id }, { $set: { isSaved: true }})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for getting saved article
app.get("/saved", function(req, res) {

  db.Article
    .find({ isSaved: true })
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});

// Route for deleting/updating saved article
app.put("/delete/:id", function(req, res) {

  db.Article
    .findByIdAndUpdate({ _id: req.params.id }, { $set: { isSaved: false }})
    .then(function(dbArticle) {
      res.json(dbArticle);
    })
    .catch(function(err) {
      res.json(err);
    });
});


// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});