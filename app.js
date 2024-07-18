const express = require('express');
const app = express();

const path = require('path');
const userModel = require('./models/user');
const postModel = require('./models/post');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');


app.set('view engine', 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/register', async (req, res) => {
    let { name, username, email, age, password } = req.body;
    let user = await userModel.findOne({ email });
    if (user) {
        return res.status(500).send("User already registered")
    }

    bcrypt.genSalt(10, function (err, salt) {
        bcrypt.hash(req.body.password, salt, async (err, hash) => {
            let user = await userModel.create({
                username,
                name,
                age,
                email,
                password: hash
            });

            let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
            res.cookie("token", token);
            res.redirect("/profile");
        })
    })
})

app.get('/login', (req, res) => {
    res.render('login');
});

app.post('/login', async (req, res) => {
    let { email, password } = req.body;
    let user = await userModel.findOne({ email });
    if (!user) return res.status(500).send("Something went Wrong");

    bcrypt.compare(password, user.password, (err, result) => {
        if (result) {
            let token = jwt.sign({ email: email, userid: user._id }, "shhhh");
            res.cookie("token", token);
            res.status(200).redirect('/profile');
        }
        else res.redirect('/');
    })

});

app.get('/profile', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    res.render('profile', { user });
});

app.get('/post/create', isLoggedIn, (req, res) => {
    res.render('post');
});

app.post('/post/create', isLoggedIn, async (req, res) => {
    let users = await userModel.findOne({ email: req.user.email });

    let post = await postModel.create({
        user: users._id,
        content: req.body.content
    });
    users.post.push(post._id);
    await users.save();
    res.redirect("/post/view")
});

app.get("/post/view", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email }).populate("post");
    res.render('viewposts', { user });
});

app.get("/like/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id }).populate("user");

    // Check if the user has already liked the post, if not add the user id to the likes array, otherwise remove it.

    if(post.likes.indexOf(req.user.userid) === -1) {
        post.likes.push(req.user.userid);
    }
    else {
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }
    await post.save();
    res.redirect('/post/view');
});

app.get("/edit/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id });

    res.render('editpost', { post });

});

app.post("/update/:id", isLoggedIn, async (req, res) => {
    let post = await postModel.findOneAndUpdate({ _id: req.params.id }, {content: req.body.content});

   res.redirect("/post/view");
});

app.get('/edit/profile', isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    res.render('editprofile', { user });
});

app.get('/logout', (req, res) => {
    res.cookie("token", "");
    res.redirect("/");
});

function isLoggedIn(req, res, next) {
    // console.log(req.cookies.token);
    if (req.cookies.token === "") res.redirect('/login');

    else {
        let data = jwt.verify(req.cookies.token, "shhhh");
        //req.user is used to acces the data of the user in the oter routes too 
        req.user = data;
    }
    next();
}

app.listen(3000);