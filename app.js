var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

 

// FLASH
var flash = require('connect-flash'); // middleware para mensajes en passport
// FLASH

var routes = require('./routes/index');
var users = require('./routes/users');

// EJS
var ejs = require('ejs'); // Render
// EJS


// Mongoose
var dbConfig = require('./models/db.js');
//var mongoose = require('mongoose');
var User = require('./models/user.js');

// Mongoose

var app = express();

// SOCKET.IO
var passportSocketIo = require('passport.socketio');
app.io = require('socket.io')();
// SOCKET.IO

//REDIS
var session = require('express-session'); // Manejo de sesiones
var RedisStore = require('connect-redis')(session); // conexión a REDIS para almacenar sesiones de usuario
var sessionRedis = new RedisStore({
   host: 'redis-10291.c8.us-east-1-2.ec2.cloud.redislabs.com',
   port: 10291,
   db: 0,
   pass: '1j79ol4f'
 });
// REDIS

// PASSPORT
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
//var User = require('./models/user.js');
var bCrypt = require('bcrypt');
// PASSPORT

// view engine setup
app.set('views', path.join(__dirname, 'views'));

// EJS
app.set('view engine', 'html');
app.engine('html', ejs.renderFile);
// EJS
//app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//REDIS
app.use(session({  store: sessionRedis, secret: 'keyboard cat', resave: true, saveUninitialized: true }));
// REDIS
// FLASH
app.use(flash());
// FLASH

// PASSPORT
app.use(passport.initialize());
app.use(passport.session());
// PASSPORT


// SOCKET.IO
app.io.use(passportSocketIo.authorize({
  key: 'connect.sid',
  secret: 'keyboard cat',
  store: sessionRedis,
  passport: passport,
  cookieParser: cookieParser
}));
// SOCKET:IO


app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


// PASSPORT
passport.serializeUser(function(user, done) {
  done(null, user);
});
 
passport.deserializeUser(function(obj, done) {
    done(null, obj);
});


// passport/login.js
passport.use('login', new LocalStrategy({
    passReqToCallback : true,
    usernameField: 'email'  // Aqui en lugar de usuario uso el email
   },
  function(req,username, password, done) { 
    // check in mongo if a user with username exists or not
    User.findOne({ 'email' :  username }, 
      function(err, user) {
        // In case of any error, return using the done method

        if (err)
          return done(err);
        // Username does not exist, log error & redirect back
        if (!user){
          console.log('No se encontró el usuario' + username);
          return done(null, false, req.flash('message', 'La cuenta no existe.'));                 
        }

        // if(user.provider=='google' || user.provider=='facebook'){
        //   return done(null, false, req.flash('message', 'La cuenta se registró con Google o Facebook y no es válida.'));                 
        // }

        // if(user.usertype !='user' && user.usertype !='business'){
        //   return done(null, false, req.flash('message', 'La cuenta no es de un usuario válido'));                 
        // }

        // User exists but wrong password, log the error 
        if (!isValidPassword(user, password)){
          console.log('Contraseña inválida');
          return done(null, false, req.flash('message', 'Contraseña inválida.'));
        }
        // // User exists but is disabled, log the error 
        // if (isDisabled(user)){
        //   console.log('Usuario inhabilitado');
        //   return done(null, false, req.flash('message', 'Cuenta inhabilitada, favor de entrar a tu bandeja de correo para habilitar tu cuenta'));
        // }
        // User and password both match, return user from 
        // done method which will be treated like success
        return done(null, user,req.flash('message', 'Inicio de sesión correcto.'));
      }
    );
}));

passport.use('signup', new LocalStrategy({
    passReqToCallback : true,
    usernameField: 'email'
  },
  function(req, username, password, done) {
    //console.log("prueba");
    findOrCreateUser = function(){
      // find a user in Mongo with provided username
     // var acceptTerm = req.param('accept_terms');
     // if (acceptTerm === undefined){
     //    return done(null, false,{message:'Acepte los términos y condiciones por favor'});
     // }
     User.findOne({'email':username},function(err, user) {
        // In case of any error return
         if (err){
           console.log('Error al crear cuenta: '+err);
           return done(err);
         }
         //console.log("prueba 2");
       // already exists
        //var v_userlongname = req.param('userlongname');
        if (user){ //  && v_userlongname !== 'demoimgnpro' ) {
          console.log('User already exists');
          return done(null, false,req.flash('message', 'Usuario ya existe.'));
        } 
        else {
          // if there is no user with that email
          // create the user
          var newUser = new User();
          // set the user's local credentials

          console.log(req.params);
          console.log(req.query);
          console.log(req.body);
          newUser.username = req.body.userlongname;
          newUser.password = createHash(password);
          newUser.email = username;
          console.log(newUser);
          //newUser.accept_terms = req.param('accept_terms');
          //newUser.usertype = 'user';
          // if(config.register.usermustactivate == true){
          //   newUser.disabled = true;
          // }
          // else
          // {
          //   newUser.disabled = false;
          // }
          

 
          // save the user
          newUser.save(function(err) {
            if (err){
              console.log('No se pudo guardar el usuario: '+err);  
              throw err;  
            }
            console.log('Se registró correctamente el usuario');
            return done(null, newUser, req.flash('message', 'Se registró correctamente el usuario.'));
            
            // var mailOptions = {
            //     from: '"Welcome" <welcome@mail-imgnpro.com>', // sender address
            //     to: username, // list of receivers
            //     subject: 'Hello', // Subject line
            //     text: 'Welcome', // plaintext body
            //     //html: '<a href="www.imgnpro.com/confirmuser"</a>' // html body
            //     html: '<html>Hi '+ newUser.userlongname  +  '.<br><b>To confirm your account please click the link below</b><br><a href="' + req.headers.host + '/confirmuser/' + newUser._id+'">Confirm acccount</a><br>' + req.headers.host + '/confirmuser/' + newUser._id + '</html>' // html body
            // };
            // console.log(mailOptions);
            // //send mail with defined transport object
            // transporter.sendMail(mailOptions, function(error, info){
            //     if(error){
            //         return console.log(error);
            //     }
            //     console.log('Message sent: ' + info.response);
            // });
            // createfreespec(newUser._id,function(err,message_spec){
            //   console.log(message_spec);
            //   return done(null, newUser, {message:'Se registró correctamente el usuario'});
            // }); 
            
          });
        }
      });

    };
 
    // Delay the execution of findOrCreateUser and execute 
    // the method in the next tick of the event loop
    process.nextTick(findOrCreateUser);
  }));



var isValidPassword = function(user, password){
  return bCrypt.compareSync(password, user.password);
}

// Generates hash using bCrypt
var createHash = function(password){
 return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
}


// PASSPORT




module.exports = app;
