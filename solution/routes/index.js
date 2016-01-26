'use strict';
var express = require('express');
var router = express.Router();
var tweetBank = require('../tweetBank');
var models = require('../models');
var User = models.User;
var Tweet = models.Tweet;

module.exports = function makeRouterWithSockets (io) {

  // a reusable function
  function respondWithAllTweets (req, res, next){

    // var allTheTweets = tweetBank.list();
    Tweet.findAll({include: [User]})
    .then(function(tweets){
      res.render('index', {
      title: 'Twitter.js',
      tweets: tweets,
      showForm: true
      });
    });    
  }

  // here we basically treet the root view and tweets view as identical
  router.get('/', respondWithAllTweets);


  router.get('/tweets', respondWithAllTweets);

  // single-user page

  router.get('/users/:username', function(req, res, next){
    Tweet.findAll({
      include: [ 
        { model: User, 
          where: {name: req.params.username}
        }]
    })
    .then(function(tweets){
      res.render('index', {
        title: 'Twitter.js',
        tweets: tweets,
        showForm: true,
        username: req.params.username
      });
    });    
  });


  // single-tweet page
  router.get('/tweets/:id', function(req, res, next){
    Tweet.findAll ({
      include: [ User ],
      where: {id: req.params.id}
    }).then(function(tweet) {
        res.render('index', {
        title: 'Twitter.js',
        tweets: tweet // an array of only one element ;-)
        });
    });
  });

  function getUserId(name) {
    return User.findOne({ where: {name: name} })
  }


  // create a new tweet
  router.post('/tweets', function(req, res, next){
    // console.log('req.body.name:', req.body.name);
    getUserId(req.body.name)
    .then(function(user){

      if (user) return user;
      else return User.create( {name: req.body.name})

    })
    .then(function(user){
      Tweet.create({ 
        tweet: req.body.text, 
        UserId: user.id
      })
      .then(function(tweet){
        io.sockets.emit('new_tweet', tweet);
        res.redirect('/');
      })
    })
  });

  router.delete('/tweets/:id', function(req, res, next){
    console.log('called delete', req.params.id);
  });
  //to delete
  // router.post('/tweets', function(req, res, next){
  //   var newTweet = tweetBank.add(req.body.name, req.body.text);
  //   io.sockets.emit('new_tweet', newTweet);
  //   res.redirect('/');
  // });



  // // replaced this hard-coded route with general static routing in app.js
  // router.get('/stylesheets/style.css', function(req, res, next){
  //   res.sendFile('/stylesheets/style.css', { root: __dirname + '/../public/' });
  // });

  return router;
}
