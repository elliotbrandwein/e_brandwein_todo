var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var promise = require('bluebird');

var routes = require('./routes/index');
var users = require('./routes/users');
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
app.use('/', routes);
app.use('/users', users);


var pgp = require('pg-promise')(options);
var db = pgp('postgres://postgres:123@localhost:5432/to_do');

app.get('/users',function(req,res,next){
  db.any('SELECT * FROM users')
  .then(function(data){
    res.render('index',{ data: data });
  })
  .catch(function(err){
    return next(err);
  });
});

app.get('/',function(req,res){
  db.none().then({}).catch({});
  res.render('index');
});

app.post("/",function(req,res,next){
  var newName = req.body.username;
  console.log(newName);
  //"insert into users (name)"+" values ({$username})", newName
  db.none('INSERT INTO users(name)'+'values(${username})', req.body) 
  .then(function (data){  
    res.render('to_do', {username:newName})
  })
  .catch(function (data){
    var err = new Error('Already exists');
    return next(err);
  });
});
app.post("/users",function(req,res){
  var newName=req.body.username;
  db.one('select * from users where name={$username}' ,req.body)
   .then(function (data){
     res.render('to_do',{username:newName})
   })
   .catch(function(data){
    var err = new Error('name not found');
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
