let jwt = require('express-jwt');
let mongoose = require('mongoose');
let User = mongoose.model('User');
let UnauthorizedResponse = require('express-http-response').UnauthorizedResponse;

function getTokenFromHeader(req){
  if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Token' ||
      req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
    return req.headers.authorization.split(' ')[1];
  }
  return null;
}

const user = (req, res, next) => {
    User.findById(req.payload.payload.id).then(function(user){
      if(!user){
        next(new UnauthorizedResponse ());
      }
      req.user = user
      next();
    }).catch(next);
}

let auth = {
    required: jwt({
      secret: 'shhhh',
      userProperty: 'payload',
      getToken: getTokenFromHeader
    }),
    optional: jwt({
      secret: 'shhhh',
      userProperty: 'payload',
      credentialsRequired: false,
      getToken: getTokenFromHeader
    }),
    user
  };
  
  module.exports = auth;