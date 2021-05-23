//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
var _ = require("lodash");
const methodOverride = require('method-override');
const mongoose = require("mongoose");
const homeStartingContent = " A platform exclusively for programmers. Scroll down to find relevant posts -> Go to Compose to write your own post. So what are you waiting for ? Get started ";
const aboutContent = "Here you can post your doubts or answer queries related to programming be it development, Operating Systems or even the coding questions where you get stuck. Also feel free to share your interview experiences and blogs. Programmer's Pole feels proud to be online platform to discuss Computer Science :) Alles Gute! ";
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const app = express();
const Schema = mongoose.Schema;

app.use(session({
	secret: process.env.SECRET,
	resave: false,
	saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));
mongoose.connect("mongodb+srv://admin-devanshi:test1234@cluster0.mecry.mongodb.net/blogDB",{useNewUrlParser: true}, { useUnifiedTopology: true });
const opts = { toJSON: { virtuals: true } };
const userSchema = new mongoose.Schema({
	email: String,
	password: String,
	
});

userSchema.plugin(passportLocalMongoose);

const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

const postSchema = new Schema({
	title: String,
	content: String,
	author:{
		type: Schema.Types.ObjectId,
			ref: "User"
	},
	date: String,
	reviews: [
		{
			type: Schema.Types.ObjectId,
			ref: "Review"
		}
	]
},opts);
const reviewSchema = {
	body: String,
	rating: Number,
	author:{
		type: Schema.Types.ObjectId,
			ref: "User"
	}
};
const Post = mongoose.model("Post",postSchema);
const Review = mongoose.model("Review",reviewSchema);

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use((req,res,next)=>{
	res.locals.currentUser = req.user;
	next();
});
app.get("/",function(req,res){
	Post.find({},function(err,posts){
		if(err)
			console.log(err);
		else{
		  res.render("home" ,{StartingContent: homeStartingContent, posts:posts});
		}
	});
	
})

app.get("/about",function(req,res){
	res.render("about",{Content: aboutContent});
})

app.get("/login", function(req,res){
	res.render("login");
});

app.get("/register", function(req,res){
	res.render("register");
});

app.get("/compose",function(req,res){
	
	if(req.isAuthenticated()){
		res.render("compose");
	}
	else{
		res.redirect("/login");
	}
})

app.post("/compose",function(req,res){
	
		const post = new Post({
		title: req.body.title,
		content:req.body.text,
		author: req.user._id,
		date: Date()
	});
	post.save();
	//posts.push(post);
	res.redirect("/");
	
	
})
app.get('/posts/:postId',function(req,res){
	const requestedId = req.params.postId;
	Post.findOne({_id: requestedId}, function(err,foundPost){
		if(err){
			console.log(err);
		}
		res.render("post",{post:foundPost});
		
	}).populate({
	path: 'reviews',
	populate: {
		path: 'author'
	}
}).populate('author');
	
});

app.get('/posts/:postId/edit',function(req,res){
	const requestedId = req.params.postId;
	Post.findOne({_id: requestedId}, function(err,foundPost){
		if(err){
			console.log(err);
		}
		res.render("edit",{post:foundPost});
	})
});

app.delete('/posts/:postId',function(req,res){
	const {postId} = req.params;
	Post.findOneAndDelete({_id :  postId },function(err,obj){
		if(err)
			console.log(err);
		
	});
	res.redirect("/");
});

app.put('/posts/:postId',function(req,res){
	const {postId} = req.params;
	
	Post.findOneAndUpdate({_id : postId},{title: req.body.title,
		content:req.body.text},function(obj,err){
		if(err)
			console.log(err);
					
	});
	res.redirect(`/posts/${postId}`);
});

app.post('/posts/:postId/reviews',function(req,res){
	//const post = Post.findById(req.params.postId);
	const requestedId = req.params.postId;
	Post.findOne({_id: requestedId}, function(err,foundPost){
		if(err){
			console.log(err);
		}
		else{
			const review = new Review({
		body: req.body.review,
		author: req.user._id
		});
	foundPost.reviews.push(review);
	 review.save();
	 //foundPost.reviews = review;
	 foundPost.save();
	res.redirect(`/posts/${foundPost._id}`);
		}
	});
	
});

app.delete('/posts/:postId/reviews/:reviewId',function(req,res){
	const {postId, reviewId} = req.params;
	Post.findOneAndUpdate({_id : postId},{$pull :{ reviews: {_id: reviewId}}},function(obj,err){
		if(err)
			console.log(err);
		
	});
	Review.findOneAndDelete({_id :  reviewId },function(err,obj){
		if(err)
			console.log(err);
		
	});
	res.redirect(`/posts/${postId}`);
//console.log("hi");
});

app.post("/register", function(req,res){
	User.register({username: req.body.username},req.body.password, function(err, user){
		if(err){
			console.log(err);
			res.redirect("/register");
		}
		else{
			passport.authenticate("local")(req, res, function(){
				res.redirect("/");
			});
		}
	});
	
});

app.post("/login", function(req,res){
	const user = new User({
		username: req.body.username,
		password: req.body.password
	});

	req.login(user, function(err){
		if(err){
			console.log(err);
			
		}
		else{
			passport.authenticate("local")(req, res, function(){
				res.redirect("/");
			});
		}
	});

});

app.get("/logout", function(req,res){
	req.logout();
	res.redirect("/");
});
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);
app.listen(port, function() {
  console.log("Server has started ");
});
