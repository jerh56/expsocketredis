var mongoose = require('mongoose');
var userSchema = mongoose.Schema({
    nombre: String,
    socketid: String
});

module.exports = mongoose.model('usernames', userSchema);