var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var promise = require('bluebird');


// used to import routes for laster modularization
//var routes = require('./routes/index');
//var users = require('./routes/users');
//var to_do = require('./routes/to_do');

var options =  {
  promiseLib: promise
};

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// used for routes, again, will be added later
//app.use('/', routes);
//app.use('/users', users);
//app.use('/to_do',to_do);

var pgp = require('pg-promise')(options);
var db = pgp('postgres://postgres:123@localhost:5432/to_do');



// gets all the users
app.get('/users',function(req,res,next){
  db.any('SELECT name FROM users')
  .then(function(data){
    console.log("all the users names has been listed");
    res.render('login',{ data: data });
  })
  .catch(function(err){
    return next(err);
  });
});

//the root route
app.get('/',function(req,res){
  res.render('index');
});

// creates new user
app.post("/",function(req,res,next){
  var newName = req.body.username;
  var pass = req.body.password;
  if(newName ==='') {
    res.render('index', {newName:'That was not a valid name'});
    return;
  }
   db.none('INSERT INTO users(name,password)'+'values(${newName},${password})',{ newName:newName,password:pass}) 
  .then(function (data){  
    res.render('index', {newName:'Account Created'})
  })
  .catch(function (data){
    var err = new Error('Already exists or username invalid');
    //return next(err);
    res.render('index', {newName:'That was not a valid name'})
  });
  console.log("new user "+newName+" has been created");
});

//loads the to-do page of a user with all thier old to-do's
app.post("/users",function(req,res,next){
  var newName=req.body.username;
  var pass=req.body.password;
  db.one('select * from users where name=${username} and password=${password} ' ,{username:newName,password:pass})
   .then(function (data){
    var ID = data.id;
    db.manyOrNone('select id,message,userid from messages where userId=${id}',{id:ID})
      .then(function(data){
        console.log("user "+ newName+ "'s stuff has been loaded"); 
        res.render('to_do',{username:newName,data:data,userId:ID})
      })
      .catch(function(data){
        var err = new Error ('name found, message-getter messed up');
        return next(err);
      })
   })
   .catch(function(data){
    var err = new Error('name not found or password incorrect');
    return next(err);
   });
});

// this is the redirect to load the users pages
app.get('/users/:userId/:newName',function(req,res,next)
{
  var userID=req.params.userId;
  var oldName = req.params.newName;
  db.any('select id,message,userid from messages where userid=${id}' ,{id:userID})
      .then(function(data){
        console.log("user "+ oldName+ "'s stuff has been loaded, with new mesasge"); 
        res.render('to_do',{username:oldName,data:data,userId:userID})
      })
      .catch(function(err){
        return next(err);
      }); 
});
// add's a new to-do message
app.post("/to_do/:userId/:username",function(req,res,next){
  var ID = req.params.userId;
  var newName = req.params.username;
  var newMessage = req.body.newTodo;

  // first we insert the new message
  db.none('insert into messages (userid,message) values (${1},${2})',{1:ID,2:newMessage})
  .then(function(){})
  .catch(function(err)
  {
      var err = new Error('message not added');
      return next(err);
  });

  // second we reload the page with the new message
  res.redirect('/users/'+ID+'/'+newName);

});

// delete to-do message
app.post("/delete/to_do/:id/:userid",function(req,res,next){
  var messageID = req.params.id;
  var userID = req.params.userid;
  var newName="";

  // first i need to get the name to load in for later
  db.one('select * from users where id=$1',userID)
  .then(function(data){
    newName = data.name;
  })
  .catch(function(data){
        var err = new Error('failed to get the name');
        return next(err);
  });
  // second we delete the message and reload the page
  console.log(newName);
  db.none('delete from messages where id=$1',messageID)
  .then(function(data){console.log("message deleted");
    res.redirect('/users/'+userID+'/'+newName);})
  .catch(function(data){
        var errorr = new Error('message not deleted');
        return next(err);
  });

      
});




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});


module.exports = app;
