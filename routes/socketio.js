
module.exports = function(io){
  //var User = require('../models/user.js');
  //var OrderPacks = require('../models/orderpacks.js');
  var app = require('express');


  
  var router = app.Router();
  // io.on('connection',function(socket){
  //   console.log("entro usuario");
  // });



io.on('connection', function(socket){
  console.log(socket.request.user);
  console.log('a user connected');
  //socket.broadcast.emit('Se conectó un usuario');
  
  // se desconecta el usuario
  socket.on('disconnect', function(){
    console.log('user disconnected');
    console.log(socket.request.user);
  });

});

 return router;
}