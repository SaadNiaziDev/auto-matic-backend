const router = require("express").Router();
const User = require("../../models/User");
const {
  OkResponse,
  BadRequestResponse,
  InternalServerErrorResponse,
} = require("express-http-response");
const auth = require("../../middleware/auth.js");
let recoverPersonalSignature = require("eth-sig-util").recoverPersonalSignature;
let bufferToHex = require("ethereumjs-util").bufferToHex;
const jwt =require("jsonwebtoken");

router.get('/', (req, res, next) => {
  if(req.query.accountAddress || typeof req.query.accountAddress != 'undefined'){
      User.findOne({accountAddress: req.query.accountAddress},(err, result) => {
          if(err){
              console.log(err);
          }else{
              next(new OkResponse({result: result}));
          }
      });
  }else{
      next(new OkResponse({result: null}));
  }
});

router.post("/", (req, res, next) => {
  const accountAddress = req.body.publicAddress;
  const signature = req.body.signature;
  const nonce = req.body.nonce;
  if (!signature || !accountAddress) {
    return res
      .status(400)
      .send({ error: "Request should have signature and publicAddress" });
  }

  const msg = `I am signing-up using my one-time nonce: ${nonce}`;

  // We now are in possession of msg, publicAddress and signature. We
  // will use a helper from eth-sig-util to extract the address from the signature
  const msgBufferHex = bufferToHex(Buffer.from(msg, "utf8"));
  const address = recoverPersonalSignature({
    data: msgBufferHex,
    sig: signature,
  });

  // The signature verification is successful if the address found with
  // sigUtil.recoverPersonalSignature matches the initial publicAddress
  if (address.toLowerCase() == accountAddress.toLowerCase()) {
    let user = new User();
    user.accountAddress = req.body.publicAddress;
    user.save((err, result) => {
      if (!err) {
        next(new OkResponse({ result: result }));
      }
    });
  } else {
    res.status(401).send({
      error: "Signature verification failed",
    });
    return null;
  }
});

router.post("/auth", (req, res, next) => {
  const accountAddress = req.body.accountAddress;
  const signature = req.body.signature;
  if (!signature || !accountAddress) {
    return res
      .status(400)
      .send({ error: "Request should have signature and publicAddress" });
  }

  User.findOne({ accountAddress: accountAddress })
    .then((user) => {
      if (!user) {
        res.status(401).send({
          error: `User with publicAddress ${publicAddress} is not found in database`,
        });
        return null;
      }
      return user;
    })
    .then((user) => {
      if (!user) {
        // Should not happen, we should have already sent the response
        throw new Error('User is not defined in "Verify digital signature".');
      }
      const msg = `I am signing my one-time nonce: ${user.nonce}`;

      // We now are in possession of msg, publicAddress and signature. We
      // will use a helper from eth-sig-util to extract the address from the signature
      const msgBufferHex = bufferToHex(Buffer.from(msg, "utf8"));
      const address = recoverPersonalSignature({
        data: msgBufferHex,
        sig: signature,
      });

      // The signature verification is successful if the address found with
      // sigUtil.recoverPersonalSignature matches the initial publicAddress
      if (address.toLowerCase() == accountAddress.toLowerCase()) {
        return user;
      } else {
        res.status(401).send({
          error: "Signature verification failed",
        });
        return null;
      }
    })
    .then((user) => {
      if (!user) {
        // Should not happen, we should have already sent the response
        throw new Error(
          'User is not defined in "Generate a new nonce for the user".'
        );
      }
      user.nonce = Math.floor(Math.random() * 10000);
      return user.save();
    })
    .then((user) => {
      try {
        return new Promise((resolve, reject) =>
          jwt.sign(
            {
              payload: {
                id: user._id,
                accountAddress,
              },
            },
            "shhhh", //Will put in .env
            {
              algorithm: "HS256",
            },
            (err, token) => {
              if (err) {
                return reject(err);
              }
              if (!token) {
                return new Error("Empty token");
              }
              return resolve(token);
            }
          )
        );
      } catch (e) {
        console.log(e);
      }
    })
    .then(async (accessToken) => {
      res.send({ accessToken: accessToken });
    })
    .catch(next);
});

router.get("/show", (req, res, next) => {
  User.find({}, (err, user) => {
    if (!err && user) {
      next(new OkResponse({ message: "user found" }));
    } else if (err) {
      next(new BadRequestResponse({ message: "User not found" }));
    } else {
      next(
        new InternalServerErrorResponse({ message: "something bad happened" })
      );
    }
  });
});

router.post("/deposit", (req, res, next) => {
  try {
    if(!req.body.depositAmount || !req.body.userAddress){
      console.log("Please enter")
      //next(new BadRequestResponse("Send required details"));
    }else if(req.body.depositAmount && req.body.userAddress){
      User.findOne({accountAddress:req.body.userAddress},(err, user) => {
        if(user){
          user.depositAmount.push({
            amount:req.body.depositAmount,
          });
          user.save((err,result)=>{
            if(result){
              next(new OkResponse({ message: "amount has been deposited"}))
            }else if(err){
              next(new BadRequestResponse({ message: "Failed to deposit amount"}));
            }
          })
        }else if(err){
          next(new BadRequestResponse("Account not found"));
        }
      })
    }
  } catch (err) {
    next(new BadRequestResponse("Catch Block"));
  }
});

router.post("/total/:accountAddress", async (req, res, next) => {
  let cashDeposit = 0;
  let totalRecords = await User.find({
    accountAddress: req.params.accountAddress,
  });
  console.log(totalRecords.length);
  for (var i = 0; i < totalRecords.length; i++) {
    cashDeposit = cashDeposit + totalRecords[i].depositAmount;
  }
  if (cashDeposit) {
    console.log(cashDeposit);
    next(res.send({ cashDeposit }));
  } else if (cashDeposit === 0) {
    next(
      new BadRequestResponse({
        message: "Something bad happened, please try again later",
      })
    );
  }
});

module.exports = router;
