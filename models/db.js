var mongoose = require('mongoose');
var express = require('express');
var app = express();
var url = process.env.MONGODB_URI;
console.log(url);
mongoose.Promise = global.Promise;
mongoose.connect(url, function(err) {
    if (err){
    	console.log('Hay un error al conectar:' + err);
		throw err;
    } 
    else{
    	console.log('Se conectó a la BD');
    }
});
     
