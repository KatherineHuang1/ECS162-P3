// server.js
// where your node app starts

// include modules
const express = require("express");

const multer = require("multer");
const bodyParser = require("body-parser");
const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

let storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, __dirname + "/images");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
// let upload = multer({dest: __dirname+"/assets"});
let upload = multer({ storage: storage });

//====================create db====================
// This creates an interface to the file if it already exists, and makes the
// file if it does not.
const postcardDB = new sqlite3.Database("postcards.db");

// Actual table creation; only runs if "Postcards.db" is not found or empty
// Does the database table exist?
let cmd =
  " SELECT name FROM sqlite_master WHERE type='table' AND name='PostcardTable' ";
postcardDB.get(cmd, function (err, val) {
  console.log(err, val);
  if (val == undefined) {
    console.log("No database file - creating one");
    createPostcardDB();
  } else {
    console.log("Database file found");
  }
});

function createPostcardDB() {
  // explicitly declaring the rowIdNum protects rowids from changing if the
  // table is compacted; not an issue here, but good practice
  const cmd =
    "CREATE TABLE PostcardTable ( randomStringId TEXT PRIMARY KEY UNIQUE, image TEXT, color TEXT, font TEXT, message TEXT )";
  postcardDB.run(cmd, function (err, val) {
    if (err) {
      console.log("Database creation failure", err.message);
    } else {
      console.log("Created database");
    }
  });
}

// ==========constructing the server pipeline==========
const app = express();
// Handle a post request containing JSON
app.use(bodyParser.json());

// Serve static files out of public directory
app.use(express.static("public"));

// Also serve static files out of /images
app.use("/images", express.static("images"));

// Handle GET request to base URL with no other route specified
// by sending creator.html, the main page of the app
app.get("/", function (request, response) {
  response.sendFile(__dirname + "/public/creator.html");
});

//==============display postcard(post)==============
// A middleware function to handles the GET query /display
// Observe that it either ends up sending the HTTP response or calls next(), so it
// is a valid middleware function.
// send the current postcard to the webpage for this kind of GET request
// The middleware function handlePostcard is defined above
//app.get("/display?*", handlePostcard);

app.post("/display", function (request, response) {
  // Url processing
  console.log("handlePostcard start");

  let url = request.originalUrl;
  let infoList = url.substring(url.indexOf("?") + 4); // initial url is /studentList/list?*, get the substring starting from the character after '?id='
  console.log("get id:", url);
  console.log("get id:", infoList);
  let cmd = "SELECT * FROM PostcardTable where randomStringId = " + infoList;

  postcardDB.all(cmd, function (err, rows) {
    if (err) {
      console.log("Database reading error", err.message);
      next();
    } else {
      // send postcard to browser in HTTP response body as JSON
      response.json(rows);
      console.log("rows", rows);
    }
  });
});

//==============upload image(post)==============
// Next, the the two POST AJAX queries
// Handle a post request to upload an image.
app.post("/upload", upload.single("newImage"), function (request, response) {
  console.log(
    "Recieved",
    request.file.originalname,
    request.file.size,
    "bytes"
  );
  if (request.file) {
    // file is automatically stored in /images,
    // even though we can't see it.
    // We set this up when configuring multer
    response.end("recieved " + request.file.originalname);
  } else throw "error";
});

//==============upload postcard(post)==============
//generate random string as part of the URL
function makeid(length) {
  return Math.random().toString(36).substring(length);
}

// gets JSON data into req.body
app.post("/saveDisplay", function (req, res) {
  let r = makeid(2);
  console.log("random", r);

  console.log("server recieved", req.body);
  let cardId = r;
  let image = req.body.image;
  let color = req.body.color;
  let font = req.body.font;
  let message = req.body.message;

  // put data into database
  const cmd =
    " INSERT INTO PostcardTable ( randomStringId, image, color, font, message ) VALUES (?,?,?,?,?)";
  postcardDB.run(cmd, cardId, image, color, font, message, function (err) {
    if (err) {
      console.log("DB insert error", err.message);
      //next();
    } else {
      //let newId = this.lastID; // the rowid of last inserted item
      console.log("send response new random string:", r);
      res.status(200).send(r);
    }
  });
});

// The GET AJAX query is handled by the static server, since the
// file postcardData.json is stored in /public

// listen for requests :)
// var listener = app.listen(process.env.PORT, function () {
//   console.log("Your app is listening on port " + listener.address().port);
// });

app.listen(8888, () => {
  console.log(`Your app is listening on port ${8888}`);
});
