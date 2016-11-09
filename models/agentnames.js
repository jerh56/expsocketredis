var mongoose = require('mongoose');
var userSchema = mongoose.Schema({
    nombre: String,
    idroom: String,
    cantidad: { type: Number, default: 0 }
});
module.exports = mongoose.model('agentnames', userSchema);