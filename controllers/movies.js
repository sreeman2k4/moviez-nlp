
const Movie=require("../models/movies");
const Comment=require("../models/comments");
const {cloudinary}=require("../cloudinary");
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');


const languages=["none","telugu","tamil","english","hindi"];
const genres=["none","love","suspence","comedy","horror","action"];

const pythonPath = 'C:\\Users\\sreem\\AppData\\Local\\Programs\\Python\\Python312\\python.exe';

module.exports.showmovies=async(req,res)=>{
        const movies=await Movie.find({})
    res.render("movies/show.ejs",{movies,languages,genres})
}
module.exports.newmovie=async(req,res)=>{
   res.render("movies/new.ejs",{languages,genres})
}
module.exports.moviesearch=async(req,res)=>{
    
    const movies=await Movie.find({$or:[{name:{$regex:req.query.dsearch}},{hero:{$regex:req.query.dsearch}},{heroine:{$regex:req.query.dsearch}},{ott:{$regex:req.query.dsearch}},{year:{$regex:req.query.dsearch}},{language:{$regex:req.query.dsearch}},{genre:{$regex:req.query.dsearch}},{rating:{$regex:req.query.dsearch}}]});
    res.render("movies/show.ejs",{movies,languages,genres})
}

module.exports.movieselected=async(req,res)=>{
    const {id}=req.params;
   const movie=await Movie.findById(id).populate("comments")
   const results=await Movie.find({genre:`${movie.genre}`})
   
   if(results){
    res.render("movies/info.ejs",{movie,results});
   }else{
    res.render("movies/info.js",{movie})
   }
}
module.exports.movieedit=async(req,res)=>{
    const {id}=req.params;
    const movie=await Movie.findById(id);
    res.render("movies/edit.ejs",{movie,languages,genres})
}

module.exports.movieaddtowatchlist=async(req,res)=>{
    const {id}=req.params;
    const user=req.user;
    const movies=await Movie.findById(id);
    user.watchlists.push(movies);
    await movies.save();
    await user.save();
    req.flash("success","added to watchlist")
    res.redirect("/movies")  
  }
  module.exports.movieadd=async(req,res)=>{
   
    const movie=new Movie(req.body.movie);
    movie.images=req.files.map(f=>({url:f.path,filename:f.filename}))
    await movie.save();
    req.flash("success","added a movie successfully");
    res.redirect("/movies")
  }
  
  module.exports.addcomments = async (req, res) => {
    try {
        const { id } = req.params;
        const movie = await Movie.findById(id);
        const text = req.body.comment.comment;
        console.log(text);

        if (!text) {
            return res.status(400).json({ error: 'Text is required' });
        }

        const escapedText = text.replace(/"/g, '\\"');
        const pythonScriptPath = path.join(__dirname, '../text-processor.py');
        const command = `"${pythonPath}" "${pythonScriptPath}" "${escapedText}"`;

        // Promisify exec to use with async/await
        const execPromise = (cmd) => {
            return new Promise((resolve, reject) => {
                exec(cmd, (error, stdout, stderr) => {
                    if (error) {
                        return reject({ message: error.message, stderr });
                    }
                    if (stderr) {
                        return reject({ message: 'Python Script Error', stderr });
                    }
                    resolve(stdout.trim());
                });
            });
        };

        const pythonOutput = await execPromise(command);
        console.log(`Python script output: ${pythonOutput}`);

        if (pythonOutput) {
            // Log and redirect if Python script output is not empty
            console.error(`Python script returned: ${pythonOutput}`);
            req.flash("error", "Comment contains prohibited content");
            return res.redirect(`/movies/${movie._id}`);
        }

        // If no output from Python script, proceed with adding the comment
        const comment=new Comment(req.body.comment);
   movie.comments.push(comment);
   const user=req.user;
   user.comments.push(comment)
    await comment.save();
    await movie.save();
     await user.save();
    //  console.log(req.user)
    req.flash("success","posted a comment")
    res.redirect(`/movies/${movie._id}`)
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
module.exports.deletecomment=async(req,res)=>{
   
    const {id,commentid}=req.params;
    const movie=await Movie.findByIdAndUpdate(id,{$pull:{comments:commentid}});
    const comment=await Comment.findById(commentid)
    req.flash("success","removed a comment")
    res.redirect(`/movies/${movie._id}`)
}
module.exports.deletemovie=async(req,res)=>{
    const {id}=req.params;
    const movie=await Movie.findById(id);
   // console.log(movie)
    const result=await Movie.deleteOne(movie);
    req.flash("success","successfully deleted a movie")
    res.redirect(`/movies`)

}




module.exports.movieupdate=async(req,res)=>{
    const {id}=req.params;
   const movie= await Movie.findByIdAndUpdate(id,req.body.movie,{runValidators:true,new:true})
   const images=req.files.map(f=>({url:f.path,filename:f.filename}))
   movie.images.push(...images);
   
   if(req.body.deleteimages)
   {
    for(let filename of req.body.deleteimages){
       await cloudinary.uploader.destroy(filename)
    }
    await movie.updateOne({$pull:{images:{filename:{$in:req.body.deleteimages}}}})
   }
   await movie.save();
   req.flash("success","successfully updated")
    res.redirect(`/movies/${id}`)
}