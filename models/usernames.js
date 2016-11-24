var mongoose = require('mongoose');
var userSchema = mongoose.Schema({
    nombre: String,
    socketid: String,
    idroom: String
});

module.exports = mongoose.model('usernames', userSchema);