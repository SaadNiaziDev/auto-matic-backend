const mongoose = require("mongoose");
const Schema = mongoose.Schema();
const jwt = require("jsonwebtoken");
const crypto = require("crypto");

const UserSchema = mongoose.Schema({
  accountAddress: { type: String, default: "null" },
  depositAmount: [{
    amount:{ type: Number, default: 0 },
    date: { type: Date, default: Date.now() },
  }],
  nonce: { type: Number, default: Math.floor(Math.random() * 9999) + 1000 },
},{timestamps: true});


module.exports = mongoose.model("User", UserSchema);
