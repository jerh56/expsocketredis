var express = require('express');
var router = express.Router();
var passport = require('passport');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


// PASSPORT
  router.get('/login', function(req, res) {
    //console.log(req.flash('message'));
   
    //res.render('login', {message: 'dfjhdjhsjd'});
    var msjres = req.flash('message');
    res.render('login', {message: msjres[0]});

  });

  router.get('/register', function(req, res) {
    // Display the Login page with any flash message, if any
    res.render('register', {message: req.flash('message')});
  });

 router.get('/principal',
 	require('connect-ensure-login').ensureLoggedIn('/login'),function(req, res){
 		console.log(req.user);
          res.render('principal', {message: req.flash('message'), user: req.user});
 });


  router.get('/signup_success', require('connect-ensure-login').ensureLoggedIn('/login'),
    function(req, res){
        //var msjres = req.flash('success');
        //res.setHeader('Content-Type', 'application/json');
        //res.send(JSON.stringify({ error: 0, message: msjres[0]}));
		res.render('principal', {message: req.flash('success'), user: req.user});

  });


  // Si sucede un error al registrar un usuario se ejecuta esta ruta
  router.get('/signup_error', function(req, res) {
     var msjres = req.flash('message');
    // if (msjres[0]!= undefined){
         //console.log(msjres[0]);
         //res.setHeader('Content-Type', 'application/json');
         //res.send(JSON.stringify({ error: 1, message: msjres[0]}));
        console.log(req.flash('failure'));
    	res.render('principal', {message: msjres[0], user: req.user});
    // }
    // else {
    //      res.redirect('/');
    // }
  });


// PASSPORT


// SOCKET.IO
router.get('/chat',
 	require('connect-ensure-login').ensureLoggedIn('/login'),function(req, res){
 		console.log(req.user);
          res.render('chat', {message: req.flash('message'), user: req.user});
 });
// SOCKEY.IO



// PASSPORT
  router.post('/signin', passport.authenticate('login', {
    successRedirect: '/principal',
    failureRedirect: '/login',
    failureFlash : true,
    successFlash : true 
  }));
 
  router.post('/signup', passport.authenticate('signup', {
    successRedirect: '/signup_success',
    failureRedirect: '/signup_error',
    failureFlash : true, 
    successFlash : true 
  }));
// PASSPORT

module.exports = router;
