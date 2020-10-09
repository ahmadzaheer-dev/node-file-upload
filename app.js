const express = require("express");
const GridFsStorage = require("multer-gridfs-storage");
const multer = require("multer");
const Grid = require("gridfs-stream");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const path = require("path");
const methodOverride = require('method-override');

const app = express();
app.use(bodyParser.json());
app.use(express.static(__dirname + "/public"));
app.use(methodOverride('_method'));
app.set("views", path.join(__dirname, "views"));

//SETTING VIEW ENGINE TO EJS
app.set("view engine", "ejs");

//ESTABLISHING CONNECTION FOR MONGODB
const conn = mongoose.createConnection("mongodb://localhost:27017/file-upload");
let gfs;

//USING GRIDFS_STREAM
conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("images");
});

//CREATING A NEW STORAGE WITH MULTER_GRIDFS_STORAGE
const storage = new GridFsStorage({
  url: "mongodb://localhost:27017/file-upload",
  file: (req, file) => {
    return {
      filename: "file_" + Date.now(),
      bucketName: "images",
    };
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/jpeg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

//SETTING UP MULTER CONFIGURATION
const upload = multer({ storage, fileFilter });

//DEFAULT URL RENDERING
app.get("/", (req, res) => {
  res.render("pages/index");
});

//ROUTE FOR VIEWING ALL IMAGES
app.get("/view", (req, res) => {
  gfs.files.find().toArray((err, files) => {
    if (files) {
      res.status(200).render("pages/view", { files: files });
    } else {
      files = null;
      res.status(200).render("pages/view", { files: files });
    }
  });
});

//API ROUTE FOR UPLOADING SINGLE IMAGE
app.post("/api/upload", upload.single("images"), (req, res) => {
  if (req.file) {
    res.status(200).redirect("/");
  } else {
    res
      .status(404)
      .json({ err: "Could not process file. Only image/jpg,jpeg,png allowed" });
  }
});

//API ROUTE FOR STREAMING SINGLE IMAGE
app.get("/view/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (file) {
      let readstream = gfs.createReadStream(file);
      readstream.pipe(res);

    } else {
      res.send({ err: "Image doesn't exist" });
    }
  });
});

//LISTENING TO A PORT
const port = 5000;
app.listen(port, () => {
  console.log(`The server is up on port ${port}`);
});
