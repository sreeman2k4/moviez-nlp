const User=require("../models/users")
const Movie=require("../models/movies")


module.exports.home=(req,res)=>{
     res.render("openpage/home.ejs")
 }
 module.exports.signup=(req,res)=>{
    res.render("openpage/signup.ejs")
}
module.exports.signin=(req,res)=>{
    res.render("openpage/login.ejs")
}
module.exports.about=(req,res)=>{
    res.render("openpage/about.ejs")
}
module.exports.logout=(req,res)=>{
    
    req.logout(function(err) {
        if (err) {
            // Handle error if logout fails
            console.error(err);
            return next(err);
        }
        // Redirect the user to the home page after successful logout
        res.redirect("/");
    });
}

module.exports.signingin=async(req,res)=>{
    res.redirect(`/movies`);
  }
  module.exports.registeringin=async(req,res)=>{
    try{
        const {username,email,password}=req.body;
     const applieduser=new User({username,email});
     console.log(applieduser)
     const user=await User.register(applieduser,password)
     const movies=await Movie.find({})
     res.redirect("/movies")
    }catch(e){
        req.flash("error",e.message);
        res.redirect("/signup")   
    }
 }