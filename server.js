const pw = process.env['PW']
const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser'); 
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//Database connection
let uri = 'mongodb+srv://Michael:'+pw+'@cluster0.blnca.mongodb.net/db1?retryWrites=true&w=majority';
mongoose.connect(uri,{useNewUrlParser: true , useUnifiedTopology: true});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

//Schema definitions
let exerciseSchema = new mongoose.Schema({
  description: {type: String, required:true},
  duration: {type: Number , required : true},
  date : String,
})

let userSchema = new mongoose.Schema({
  username: {type: String, required: true },
  log: [exerciseSchema]
})

//Model definitions
let Exercise = mongoose.model('session',exerciseSchema);

let User = mongoose.model('user',userSchema);

app.post('/api/users',bodyParser.urlencoded({ extended: false }),(req,res)=>{
let newUser = new User({username:req.body.username})
//saves a new user
newUser.save((err,savedUser)=>{
  if(!err){
    let responseObject = {};
    responseObject['username']=savedUser.username;
    responseObject['_id'] = savedUser.id;
    res.json(responseObject);
  }
 
})

})

app.get('/api/users',(req,res)=>{
//Finds and sends all stored users
User.find({},(err,allUsers)=>{
if(!err){
  res.json(allUsers)

}

});


})

app.post('/api/users/:id/exercises',bodyParser.urlencoded({ extended: false }),(req,res)=>{
// Creates a new Exercise object using form data
console.log(req.body._id);
let newSession = new Exercise({
  description: req.body.description,
  duration: parseInt(req.body.duration),
  date : req.body.date
});
//Stores the current date if date is not provided within the form. Converts it to the required format
if(newSession.date === ''){
  newSession.date = new Date().toISOString().substring(0,10);
}
User.findByIdAndUpdate( //FInds user by Id and populates user info with added info
  req.body._id
,
{$push : {log: newSession}},
{new: true},
(err,updatedUser)=>{
  if(!err){
  let resObject = {};
  resObject['_id'] = updatedUser._id;
  resObject['username'] = updatedUser.username;
  resObject['date'] = new Date(newSession.date).toDateString();
  resObject['description'] = newSession.description;
  resObject['duration'] = newSession.duration;
  res.json(resObject);
  }
  }
)

 
})

//Retrieves a full exercise log of any user by Id
app.get('/api/users/:id/logs',(req,res)=>{
var limit = req.query.limit;
var from = req.query.from;
var to = req.query.to;
User.findById(
  req.params.id,(err,result)=>{
  let resObject = result;

 if(from || to){
let fromDate = new Date (0);
let toDate = new Date()

 if(from){
   fromDate = new Date(from);
 }

 if(to){
   toDate = new Date(to);
 }

fromDate = fromDate.getTime();
toDate = toDate.getTime();

resObject.log = resObject.log.filter(
(session)=>{
  let sessionDate = new Date(session.date).getTime();
   
   return sessionDate >= fromDate && sessionDate <= toDate;

})

 }
    if(limit){
    resObject.log = resObject.log.slice(0,limit)
  }

  resObject.count = result.log.length;
  res.json(resObject);
  }
)
})