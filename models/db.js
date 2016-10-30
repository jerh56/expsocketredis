var mongoose = require('mongoose');
var express = require('express');
var app = express();


//var url = process.env.MONGODB_URI;
// if (app.get('env') === 'production') {
//  var  url = 'mongodb://admin:123456@ds051903.mlab.com:51903/heroku_554zpg9r';
// }
// else{
// 	if (app.get('env') === 'development'){
var  url = 'mongodb://admin:123456@ds051903.mlab.com:51903/heroku_554zpg9r';	
// 	}
// 	else{
//  		var  url = 'mongodb://admin:123456@ds051903.mlab.com:51903/heroku_554zpg9r';	
// 	}
// }
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
     