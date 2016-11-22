var mongoose = require('mongoose');
var userSchema = mongoose.Schema({
    username: String,
    userid: String,
    room: String,
    usertype:String,
    message:String,
    date_msg: {type:Date}
});

module.exports = mongoose.model('msglist', userSchema);