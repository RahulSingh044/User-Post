const mongoose = require('mongoose');

// const url = 'mongodb://localhost:27017/miniProject'

// mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });


const userSchema = mongoose.Schema({
    username: String,
    name: String,
    age: Number,
    email: String,
    password: String,
    profileImage: {
        type: String,
        default: "default.jpg"
    },
    post : [
        {type : mongoose.Schema.Types.ObjectId, ref: "post"},
    ]
});

module.exports = mongoose.model('user', userSchema);