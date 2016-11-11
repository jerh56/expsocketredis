var mongoose = require('mongoose');
var express = require('express');
var url = process.env.MONGODB_URI;
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
     
