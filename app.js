const { response } = require("express");
const express = require("express");
const GridFsStorage = require("multer-gridfs-storage");
const multer = require("multer");
const Grid = require("gridfs-stream");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
app.use(bodyParser.json());

const conn = mongoose.createConnection("mongodb://localhost:27017/file-upload");
let gfs;
conn.once("open", () => {
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection("images");
  // all set!
});

const storage = new GridFsStorage({
  url: "mongodb://localhost:27017/file-upload",
  file: (req, file) => {
    return {
      filename: "file_" + Date.now(),
      bucketName: "images",
    };
  },
});

const upload = multer({ storage });

app.post("/upload/image", upload.single("images"), (req, res) => {
  console.log("Executed /upload Route");
  res.json(req.file);
});

app.get("/images/:filename", (req, res) => {
  gfs.files.findOne({ filename: req.params.filename }, (err, file) => {
    if (file) {
      const readStream = gfs.createReadStream(file.filename);
      readStream.pipe(res);
    } else {
      res.status(404).json({ err: "file not found" });
    }
  });
});

app.post("/upload/images", upload.array("images"), (req, res) => {
  res.json(req.files);
});

//LISTENING TO A PORT
const port = 5000;
app.listen(port, () => {
  console.log(`The server is up on port ${port}`);
});
