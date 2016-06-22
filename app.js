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
    console.log(data);
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
  console.log(newName);
  db.none('INSERT INTO users(name)'+'values(${username})', req.body) 
  .then(function (data){  
    res.render('index', {newName:'Account Created'})
  })
  .catch(function (data){
    var err = new Error('Already exists');
    return next(err);
  });
});

//loads the user pages, shows user name and all thier messages
app.post("/users",function(req,res,next){
  var newName=req.body.username;
  db.one('select * from users where name=${username} ' ,{username:newName})
   .then(function (data){
    var ID = data.id;
    db.manyOrNone('select id,message from messages where userId=${id}',{id:ID})
      .then(function(data){
        console.log(data); 
        res.render('to_do',{username:newName,data:data,id:ID})
      })
      .catch(function(data){
        var err = new Error ('name found, message-getter messed up');
        return next(err);
      })
   })
   .catch(function(data){
    var err = new Error('name not found');
    return next(err);
   });

});
// add to-do message
app.post("/to_do",function(req,res,next){

});
// delete to-do message
app.post("/delete/to_do/:id",function(req,res,next){
  var  id = req.params.id;
  db.none('delete from messages where id=$1',id)
  .then(function(data){
    res.render('to_do'){username:newName,data:data,deleteMessage:'Message Deleted'},id:id}
  })
  .catch(function(data){
  });
})







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
