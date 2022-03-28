const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
var bodyParser = require('body-parser');
const cors = require('cors');
httpResponse = require('express-http-response');
const cronJob = require('./cron-job/crons.js');



dotenv.config({ path: "./config/config.env" });

const app = express();
const route = require("./routes");

mongoose.connect(
  process.env.DB_URL,
  () => {
    console.log('Connected to MongoDB');
  }
);

//mongoose.set('debug', true);
app.use(bodyParser.urlencoded({ extended: false }))
app.use(cors({
  origin: 'http://localhost:3000'
}));

require("./models/User");

//app.use(express.json());
app.use(bodyParser.json())
app.use(route);
app.use(httpResponse.Middleware);


app.listen(process.env.PORT, () => {
  console.log("listening on port " + process.env.PORT);
  cronJob();
});