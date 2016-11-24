
module.exports = function(io){
var app = require('express');
var uuid = require('uuid4');
var router = app.Router();
var Usernames = require('../models/usernames.js');
var Agentnames = require('../models/agentnames.js');
var WaitList = require('../models/waitlist.js');
var Msglist = require('../models/msglist.js');
// usernames which are currently connected to the chat
//var agentnames = new Array();
var currentroom ="";
//Cada ciertos milisegundos ejecuta esta funcion para buscar agentes disponibles
setInterval( function(){
  var agentroom = '0';
  WaitList.count({},function(err,nCount){
      if ( nCount > 0 ){
        Agentnames.findOne( {cantidad:{$lt:3}}, function(err,agentdoc){
          if(err){
            console.log(err);
          }
          else if(agentdoc){
            agentroom = agentdoc.idroom; // id del cuarto del agente 
            agentdoc.cantidad = agentdoc.cantidad + 1;
            agentdoc.save( function(err){
              if (err){
                console.log(err);
              }
              else
              {
                var username ='';
                WaitList.findOne({},function(err,waitdoc){
                  if(err){
                    console.log(err);
                  }
                  else{
                    username = waitdoc.nombre; //nombre del usuario en espera
                    currentroom = waitdoc.idroom; // id del cuarto del usuario en espera
                    io.sockets.in(currentroom).emit('updatechat', 'SERVER', 'Hay agente disponible ');
                    io.sockets.in(agentroom).emit('newuser', 'SERVER',username, currentroom); // se le avisa al agente que hay un usuario por atender
                    io.sockets.in(currentroom).emit('updatechat', 'SERVER','Te está atendiendo ' + agentdoc.nombre, currentroom);
                    waitdoc.remove({ _id: waitdoc._id }, function(err) {
                        if (err) {
                            console.log('Error')
                        }
                        else {
                            console.log('Se eliminó correctamente ')
                        }
                    });
                  }
                });
              }
            });
          }
       });  
      }
  });
}, 3000); 

io.sockets.on('connection', function (socket){
    var socketId = socket.id;
    var clientIp = socket.request.connection.remoteAddress;
    console.log('Id: ' + socket.id);
    console.log('Id: ' + socket.client.id);
    console.log(clientIp);
    // when the client emits 'adduser', this listens and executes
    
    // cuando un usuario se conecta se produce este evento
    socket.on('connectuser', function(username){
      if ((username != null)  && (username !="")){
        // store the username in the socket session for this client
        socket.username = username;
        // store the room name in the socket session for this client
        //se genera un identificador para el room
        var waitforagent = true;
        var idroom = uuid();
        // Se toma el identificador como id del room
        currentroom = idroom;
        agentroom = '0';
        //Se busca al agente disponible de los agentes conectados
        //console.log(agentnames);
        Agentnames.findOne({cantidad:{$lt:3}}, function(err,doc){
          if(err){
            console.log(err);
          }
          else if(!doc){
            newWaitList = new WaitList();
            newWaitList.nombre = username;
            newWaitList.idroom = currentroom;
            newWaitList.save(function(err){
                if (!err) console.log('Se tiene un usuario en espera');
            });
            socket.isuser = true;
            socket.room = currentroom;
            // add the client's username to the global list
            newUsername = new Usernames();
            newUsername.nombre = username;
            newUsername.socketid = socket.id;
            newUsername.save(function(err){
                if (!err) console.log('Se conectó un usuario');
            });
            socket.join(currentroom);
            socket.emit('updatechat', 'SERVER', 'Todos nuestros agentes estan ocupados, por favor espere');
          }
          else{
            console.log(doc);
            agentroom = doc.idroom;
            doc.cantidad = doc.cantidad + 1;
            doc.save(function(err){
              if (err){
                console.log(err);
              }
              else
              {
                console.log("Se aumentó la cantidad de usuarios atendidos");
                console.log(currentroom);
                // Si es usuario asigna un valor verdadero al flag
                socket.isuser = true;
                socket.room = currentroom;
                // add the client's username to the global list
                newUsername = new Usernames();
                newUsername.nombre = username;
                newUsername.socketid = socket.id;
                newUsername.save(function(err){
                    if (!err) console.log('Se conectó un usuario');
                });
                // send client to room 1
                socket.join(currentroom);
                // eco al room del agente
                socket.broadcast.to(agentroom).emit('newuser', 'SERVER',username, currentroom);
                // echo to client they've connected
                //El evento updatechat envia usuario que emite, Datos, Posicion (se descontinuara), ID del room (solo en caso de que el mensaje vaya para un usuario y no un agente)
                socket.emit('updatechat', 'SERVER', 'Te está atendiendo ' + currentroom, currentroom);
                // echo to room 1 that a person has connected to their room
                socket.broadcast.to(agentroom).emit('updatechat', 'SERVER', username + ' se ha conectado a ' + currentroom, '');
                //socket.emit('updaterooms', agentnames, agentroom);
                console.log('Se conectó el usuario: ' + username);
              }
            });
          }
        });
      }
    });


  socket.on('connectagent', function(agentname){
    if ((agentname != null)  && (agentname!="")){
      // store the username in the socket session for this client
      socket.isuser = false;
      socket.agentname = agentname;
      // store the room name in the socket session for this client
      var idroom = uuid(); // se obtiene el id del cuarto para el agente
      // Se toma el identificador como id del room
      currentroom = idroom;
      socket.room = idroom;
      //cantidad = 0 esta cantidad
      newAgentname = new Agentnames();
      newAgentname.nombre = agentname;
      newAgentname.idroom = idroom;
      newAgentname.save(function(err){
          if (err){
            console.log('Se conectó un agente');
          }
          else{
            socket.join(idroom); // se asigna al agente al cuarto con el id obtenido por medio de UUID
            //socket.join(agentname+'02');
            // echo to client they've connected
            socket.emit('updatechat', 'SERVER', 'AGENTE: ' + agentname,'');
            // echo to room 1 that a person has connected to their room
            socket.broadcast.to(idroom).emit('updatechat', 'SERVER', agentname + ' es el agente disponible en esta sala', '');
            //socket.emit('updaterooms', agentnames, agentname);
            socket.emit('conectedagent',idroom);
            console.log('Se conectó el agente: ' + agentname);
          } 
      });
    }
  });

  // Este evento sucede cuando un nuevo usuario se conecto y lo va a atender un agente
  socket.on('addagentroom', function(idroom,agentname,username){
      if ((idroom != null)  && (idroom!="")){
        // Obtener numero de rooms que puede atender el agente
        // send client to room por default
        socket.join(idroom);
        // echo to client they've connected
        socket.emit('updatechat', 'SERVER', 'Bienvenido: ' + agentname, idroom);
        // echo to room 1 that a person has connected to their room:
        socket.broadcast.to(idroom).emit('updatechat', 'SERVER', 'Sala: ' + idroom, idroom);
        io.sockets.in(idroom).emit('updatechat', 'SERVER', 'Se conectó el usuario ' + username , idroom);
        //socket.emit('updaterooms', agentnames, idroom);
        console.log('Se conectó el agente: ' + agentname);
      }
    });

    // when the client emits 'sendchat', this listens and executes
    socket.on('sendchat', function (data) {
      // we tell the client to execute 'updatechat' with 2 parameters
      io.sockets.in(socket.room).emit('updatechat', socket.username, data, socket.room);
      var newMsglist = new Msglist();
      newMsglist.username = socket.username;
      newMsglist.userid = socket.request.user._id;
      newMsglist.room = socket.room;
      newMsglist.usertype = 'user';
      newMsglist.message = data;
      newMsglist.date_msg = Date.now();
      newMsglist.save(function(err){
        if (err){
          console.log('error');
        }
        else
        {
          console.log('se guardó un mensaje de usuario')
        }
      });
      console.log(socket.username);
      console.log(socket.room);
    });

    // Cuando el agente emite un mensaje sendchatagent
    socket.on('sendchatagent', function (data,idroom){
      io.sockets.in(idroom).emit('updatechat', socket.agentname, data, idroom);
      var newMsglist = new Msglist();
      newMsglist.username = socket.agentname;
      newMsglist.userid = socket.request.user._id;
      newMsglist.room = idroom;
      newMsglist.usertype = 'agent';
      newMsglist.message = data;
      newMsglist.date_msg = Date.now();
      newMsglist.save(function(err){
        if (err){
          console.log('error');
        }
        else
        {
          console.log('se guardó un mensaje de usuario')
        }
      });
      console.log(socket.room);
      console.log(socket.agentname);
      console.log(data);
    });

    socket.on('switchRoom', function(newroom){
      socket.leave(socket.room); // leave the current room (stored in session)
      socket.join(newroom); // join new room, received as function parameter
      socket.emit('updatechat', 'SERVER', 'te has conectado a '+ newroom);
      // sent message to OLD room
      socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' ha salido de la sala');
      // update socket session room title
      socket.room = newroom;
      socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' se ha unido a esta sala');
      //socket.emit('updaterooms', agentnames, newroom);
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function(){
        if (socket.isuser === true){
          // remove the username from global usernames list
          //delete usernames[socket.username];
          Usernames.remove({ socketid: socket.id }, function(err) {
              if (err) {
                  console.log(err)
              }
              else {
                  Usernames.find({},function(err,rUsernames){
                    if (err){
                      console.log(err);
                    }
                    else{
                      console.log(rUsernames);
                      io.sockets.emit('updateusers', rUsernames);
                      // echo globally that this client has left
                      // preguntar si es usuario para avisar al agente que se desconecto
                      io.sockets.in(socket.room).emit('updatechat', 'SERVER', "Se desconectó el usuario " + socket.username,socket.room);
                      console.log("Se desconectó el usuario " + socket.username)
                      socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' se ha desconectado');
                      socket.leave(socket.room);
                    }
                  });  
              }
          });
       }
       else{
          if (socket.isuser === false){
            Agentnames.findOne({idroom: socket.room }, function(err, agentdoc){
              if (err){
                  console.log(err);
              }else if (agentdoc){
                Agentnames.remove({idroom: socket.room}, function(err){
                  if (err){
                    console.log(err);
                  }
                  else{
                    // echo globally that this client has left
                    socket.broadcast.emit('updatechat', 'SERVER', socket.agentname + ' se ha desconectado');
                    //socket.emit('updaterooms', agentnames, socket.agentname);
                    // falta modificar esta linea
                    socket.leave(socket.room);
                    console.log('Se desconectó el agente: ' + socket.agentname);
                    console.log(socket.room);
                  }
                });
              }
              else{
                console.log("No se encontró el id del cuarto del agente");
              }

            });
            //io.sockets.emit('updateusers', usernames);
          }
       }
    });

    socket.on('typing', function(data){
      io.sockets.in(socket.room).emit('istyping', socket.username, data, socket.room);
      console.log(socket.id + 'is typing');
    });
  });
 return router;
}