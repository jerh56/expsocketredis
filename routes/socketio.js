
module.exports = function(io){
var app = require('express');
var uuid = require('uuid4');
var router = app.Router();
var Usernames = require('../models/usernames.js');
var Agentnames = require('../models/agentnames.js');
var Userlist = require('../models/userlist.js');

// usernames which are currently connected to the chat
var usernames = new Array();
var userlist = new Array();
var agentnames = new Array();
//var agentnames = {};
var currentroom ="";
// rooms which are currently available in chat
//var rooms = new Array();

//Cada ciertos milisegundos ejecuta esta funcion para buscar agentes disponibles
setInterval(function(){
  //console.log('test');
  var agentroom = '0';
  var posRoom = 0;
  if (userlist.length > 0){
    //console.log(userlist);
    for (var agentname in agentnames){
        //console.log(agentnames[agentname].nombre);
       if (agentnames[agentname].cantidad < 3 ){
         agentnames[agentname].cantidad = agentnames[agentname].cantidad + 1;
         console.log(agentnames[agentname].cantidad);
         posRoom = ("0" + agentnames[agentname].cantidad).slice(-2);
         agentroom = agentnames[agentname].idroom;
         var waitforagent = false;
         var username ='';
         //for (var posusername in userlist){
            Userlist.findOne({},function(err,doc){
              if(err){

              }
              else{
                console.log(doc);
                console.log(userlist[posusername].nombre);
                console.log(userlist[posusername].idroom);
                //username = userlist[posusername].nombre;
                //currentroom = userlist[posusername].idroom;

                username = doc.nombre;
                currentroom = doc.idroom;
                io.sockets.in(currentroom).emit('updatechat', 'MENSAJERO RTC', 'Hay agente disponible ');
                io.sockets.in(agentroom).emit('newuser', 'MENSAJERO RTC',username, currentroom, posRoom);
                io.sockets.in(currentroom).emit('updatechat', 'MENSAJERO RTC','Te esta atendiendo ' + agentnames[agentname].nombre, posRoom,currentroom);
                userlist.splice(posusername,1);
              }

            });

            
            //break;
         //}    
         break;
       }
    }
 }   
}, 3000); 

io.sockets.on('connection', function (socket){
    var socketId = socket.id;
    var clientIp = socket.request.connection.remoteAddress;
    console.log('Id: ' + socket.id);
    console.log('Id: ' + socket.client.id);
    console.log(clientIp);
    // when the client emits 'adduser', this listens and executes
    
    // cuando un usuario se conecta se produce este evento
    socket.on('adduser', function(username){
      socket.posRoom ='';     
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
        console.log(agentnames);
        for (var agentname in agentnames){
        //console.log(agentnames[agentname].nombre);
          if (agentnames[agentname].cantidad < 3 ){
            agentnames[agentname].cantidad = agentnames[agentname].cantidad + 1;
            console.log(agentnames[agentname].cantidad);
            socket.posRoom = ("0" + agentnames[agentname].cantidad).slice(-2);
            agentroom = agentnames[agentname].idroom;
            waitforagent = false;
            break;
          }
        }
        // Sino encontro agente disponible se manda a la lista de espera.
        if (waitforagent){
              //Se agrega a la lista de usuario para que 
          
          newUserlist = new Userlist();
          newUserlist.nombre = username;
          newUserlist.idroom = currentroom;
          newUserlist.save(function(err){
              //if (!err) 
                console.log('Se tiene un usuario en espera');
          });

          if (userlist.length == 0){
              userlist[0] = ({"nombre":username, "idroom":currentroom});
              // add the client's username to the wait list
          }
          else{
              userlist.push ({"nombre":username, "idroom":currentroom});
              // add the client's username to the wait list
              console.log(userlist);
          }
          socket.isuser = true;
          socket.room = currentroom;
          // add the client's username to the global list
          
          newUsername = new Usernames();
          newUsername.nombre = username;
          newUsername.socketid = socket.id;
          newUsername.save(function(err){
              //if (!err) 
                console.log('Se conectó un usuario');
          });

          if (usernames.length == 0){
              usernames[0] = ({"nombre":username, "socketid":socket.id});
              // add the client's username to the wait list
          }
          else{
              usernames.push ({"nombre":username, "socketid":socket.id});
              // add the client's username to the wait list
                 
          }
          // send client to room 1
          socket.join(currentroom);
          socket.emit('updatechat', 'MENSAJERO RTC', 'Todos nuestros agentes estan ocupados, por favor espere');
        }
        else{
          console.log(currentroom);
          // Si es usuario asigna un valor verdadero al flag
          socket.isuser = true;
          socket.room = currentroom;
          // add the client's username to the global list
          
          newUsername = new Usernames();
          newUsername.nombre = username;
          newUsername.socketid = socket.id;
          newUsername.save(function(err){
              //if (!err) 
                console.log('Se conectó un usuario');
          });
          if (usernames.length == 0){
              usernames[0] = ({"nombre":username, "socketid":socket.id});
                   // add the client's username to the wait list
          }
          else{
              usernames.push ({"nombre":username, "socketid":socket.id});
              // add the client's username to the wait list
                 
          }
          //usernames[username] = username;
          // send client to room 1
          socket.join(currentroom);
          // eco al room del agente
          //socket.broadcast.to(agentna).emit('newuser', 'MENSAJERO RTC',username, currentroom, socket.posRoom);
          // eco al room del agente
          socket.broadcast.to(agentroom).emit('newuser', 'MENSAJERO RTC',username, currentroom, socket.posRoom);
          // echo to client they've connected
          //El evento updatechat envia usuario que emite, Datos, Posicion (se descontinuara), ID del room (solo en caso de que el mensaje vaya para un usuario y no un agente)
          socket.emit('updatechat', 'MENSAJERO RTC', 'Te esta atendiendo ' + currentroom, socket.posRoom, currentroom);
          // echo to room 1 that a person has connected to their room
          socket.broadcast.to(agentroom).emit('updatechat', 'MENSAJERO RTC', username + ' se ha conectado a ' + currentroom, '');
          socket.emit('updaterooms', agentnames, agentroom);
          console.log('Se conecto el usuario: ' + username);
        }
      }
    });


  socket.on('addagent', function(agentname){
    if ((agentname != null)  && (agentname!="")){
      // store the username in the socket session for this client
      socket.isuser = false;
      socket.agentname = agentname;
      // store the room name in the socket session for this client
      var idroom = uuid();
      // Se toma el identificador como id del room
      currentroom = idroom;
      socket.room = idroom;
      //cantidad = 0 esta cantidad
      newAgentname = new Agentnames();
      newAgentname.nombre = agentname;
      newAgentname.idroom = idroom;
      newAgentname.save(function(err){
          if (!err) console.log('Se conectó un agente');
      });

      if (agentnames.length == 0){
        agentnames[0] = ({"nombre":agentname, "cantidad":0, "idroom":idroom});
        // add the client's username to the global list
        //rooms[0] = agentname;
      }
      else{
        agentnames.push ({"nombre":agentname, "cantidad":0, "idroom":idroom});
        // add the client's username to the global list
        //rooms[agentname] = agentname; 
       
      }
      // Obtener numero de rooms que puede atender el agente
      // send client to room por default
      socket.join(idroom);
      //socket.join(agentname+'02');
      // echo to client they've connected
      socket.emit('updatechat', 'MENSAJERO RTC', 'AGENTE: ' + agentname,'');
      // echo to room 1 that a person has connected to their room
      socket.broadcast.to(idroom).emit('updatechat', 'MENSAJERO RTC', agentname + ' es el agente disponible en esta sala', '');
      socket.emit('updaterooms', agentnames, agentname);
      socket.emit('conectedagent',idroom);
      console.log('Se conecto el agente: ' + agentname);
    }
  });


    // Este evento sucede cuando un nuevo usuario se conecto y lo va a atender un agente
    socket.on('addagentroom', function(idroom,agentname,username,pos){
      if ((idroom != null)  && (idroom!="")){
        // Obtener numero de rooms que puede atender el agente
        // send client to room por default
        socket.join(idroom);
        // echo to client they've connected
        socket.emit('updatechat', 'MENSAJERO RTC', 'Bienvenido: ' + agentname, pos, idroom);
        // echo to room 1 that a person has connected to their room:
        socket.broadcast.to(idroom).emit('updatechat', 'MENSAJERO RTC', 'Sala: ' + idroom, pos, idroom);
        io.sockets.in(idroom).emit('updatechat', 'MENSAJERO RTC', 'Se conecto el usuario ' + username , pos, idroom);
        socket.emit('updaterooms', agentnames, idroom);
        console.log('Se conecto el agente: ' + agentname);
      }
    });

    // when the client emits 'sendchat', this listens and executes
    socket.on('sendchat', function (data) {
      // we tell the client to execute 'updatechat' with 2 parameters
      io.sockets.in(socket.room).emit('updatechat', socket.username, data,socket.posRoom, socket.room);
      console.log(socket.username);
      console.log(socket.room);
    });

    // Cuando el agente emite un mensaje sendchatagent
    socket.on('sendchatagent', function (data,roomname,pos){
      io.sockets.in(roomname).emit('updatechat', socket.agentname, data,pos);
      console.log(socket.room);
      console.log(socket.agentname);
      console.log(data);
    });

    socket.on('switchRoom', function(newroom){
      socket.leave(socket.room); // leave the current room (stored in session)
      socket.join(newroom); // join new room, received as function parameter
      socket.emit('updatechat', 'MENSAJERO RTC', 'te has conectado a '+ newroom);
      // sent message to OLD room
      socket.broadcast.to(socket.room).emit('updatechat', 'MENSAJERO RTC', socket.username+' ha salido de la sala');
      // update socket session room title
      socket.room = newroom;
      socket.broadcast.to(newroom).emit('updatechat', 'MENSAJERO RTC', socket.username+' se ha unido a esta sala');
      socket.emit('updaterooms', agentnames, newroom);
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function(){
        if (socket.isuser === true){
          // remove the username from global usernames list
          //delete usernames[socket.username];
          for (var posusername in usernames){
             if (usernames[posusername].socketid === socket.id ){
               console.log("se elimino el usuario " + usernames[posusername].nombre)
               console.log(usernames);
               usernames.splice(posusername,1);
               console.log(usernames);
               break;
              }
          }  
          // update list of users in chat, client-side
          io.sockets.emit('updateusers', usernames);
          // echo globally that this client has left
          // preguntar si es usuario para avisar al agente que se desconecto
          io.sockets.in(socket.room).emit('updatechat', 'MENSAJERO RTC', "Se desconecto el usuario " + socket.username, socket.posRoom,socket.room);
          console.log("Se desconecto el usuario " + socket.username)
          socket.broadcast.emit('updatechat', 'MENSAJERO RTC', socket.username + ' se ha desconectado');
          socket.leave(socket.room);
          console.log('Se desconecto el usuario: ' + socket.username);
       }
       else{
          if (socket.isuser === false){
            for (var posagentname in agentnames){
              //console.log(agentnames[agentname].nombre);
              if (agentnames[posagentname].idroom === socket.room ){
                 console.log("se elimino al agente " + agentnames[posagentname].nombre)
                 console.log(agentnames);
                 agentnames.splice(posagentname,1);
                 console.log(agentnames);
                 //delete agentnames[agentname];
                 break;
              }
            }  
            // update list of users in chat, client-side
            io.sockets.emit('updateusers', usernames);
            // echo globally that this client has left
            //io.sockets.in(socket.room).emit('updatechat', 'MENSAJERO RTC', "Se desconecto el agente " + socket.agentname, socket.posRoom);
            socket.broadcast.emit('updatechat', 'MENSAJERO RTC', socket.agentname + ' se ha desconectado');
            socket.emit('updaterooms', agentnames, socket.agentname);
            // falta modificar esta linea
            socket.leave(socket.room);
            console.log('Se desconecto el agente: ' + socket.agentname);
            console.log(socket.room);
          }
       }
    });

    socket.on('typing', function(data){
      io.sockets.in(socket.room).emit('istyping', socket.username, data,socket.posRoom, socket.room);
      console.log(socket.id + 'is typing');
    });
  });
 return router;
}