var mongoose = require('mongoose');
var userSchema = mongoose.Schema({
    nombre: String,
    idroom: String
});

module.exports = mongoose.model('waitlist', userSchema);