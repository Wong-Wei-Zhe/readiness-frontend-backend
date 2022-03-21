require("dotenv").config();
const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const bodyParser = require("body-parser");

const uri = process.env.MONGO_URI;
console.log(uri);
const app = express();

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use((req, res, next) => {
  let allowedOrigins = [
    "http://18.140.198.84:8080",
    "http://ec2-18-140-198-84.ap-southeast-1.compute.amazonaws.com:8080",
    "http://18.141.161.10:8080",
    "http://ec2-18-141-161-10.ap-southeast-1.compute.amazonaws.com:8080",
  ];
  let origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  //res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Access-Control-Allow-Headers, Origin , Accept, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers"
  );

  next();
});

var forex = require("./routes/forex");
const watchlist = require("./routes/watchlist");
const crypto = require("./routes/crypto");
const news = require("./routes/news");
const forexhome = require("./routes/forexhome");

app.use("/watchlist", watchlist);
app.use("/forex", forex);
app.use("/crypto", crypto);
app.use("/news", news);
app.use("/forexhome", forexhome);

app.get("/test", (req, res) => {
  res.send({ Status: "Success" });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
