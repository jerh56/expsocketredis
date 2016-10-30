var mongoose = require('mongoose');
var userSchema = mongoose.Schema({
    username: String,
    password: String,
    email: String,
    createdAt: {type:Date, default: Date.now}
});

module.exports = mongoose.model('User_prueba', userSchema);