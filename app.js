var express = require('express');
var path = require('path');
//var bodyParser = require('body-parser');
var mongojs = require('mongojs');
var db = mongojs('newreviews', ['review']);
var dbl = mongojs('newreviews', ['users']);
var qs = require('querystring');
var ObjectId = require('mongodb').ObjectId;


// Configuring Passport
//var passport = require('passport');
// var expressSession = require('express-session');
// app.use(expressSession({secret: 'donkeysun'}));
// app.use(passport.initialize());
// app.use(passport.session());


var app = express();
var success = 0;
var fail = 0;
var categoryList = [];
var successMessage = false;
var dangerMessage = false;

//set the list of distinct categorys to categoryList
db.review.distinct(
   "category",
   {}, // query object
   (function(err, docs){
        if(err){
            return console.log(err);
        }
        if(docs){
            //console.log(docs);
            for(let i=0; i<docs.length; i++) {
              console.log(docs[i])
              db.review.findOne({category: docs[i]}, function(err, docs) {
                //console.log(docs);
                //console.log(i);
                if(err) {
                  console.log(err)
                } else {
                  console.log(i)
                  console.log(docs.category);
                  console.log(docs.image);
                  categoryList.push({ name: docs.category, image: docs.image });
                }
              });
            };
        };
      })
);

console.log(categoryList);

//MIDDLEWARE
//set bodyparser MIDDLEWARE
//app.use(bodyParser.urlencoded({ extended: false }));
//set static path (path middleware)
app.use(express.static(path.join(__dirname, 'public')));
//template engine settings (ejs middleware)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

//set up passport
// passport.use(new LocalStrategy({
//     usernameField: 'email',
//     passwordField: 'password',
//     session: false
//   },
//   function(email, password, done) {
//     User.findOne({ email: email }, function (err, user) {
//       if (err) { return done(err); }
//       if (!user) { return done(null, false); }
//       if (!user.verifyPassword(password)) { return done(null, false); }
//       return done(null, user);
//     });
//   }
// ));

//add default route
app.get('/', function(req, res) {
      res.render('index', {
        title: "",
        categoryList : categoryList,
        successMessage: successMessage,
        dangerMessage: dangerMessage,
      });
      successMessage = false;
      dangerMessage = false;
});

app.get('/articles/:cat', function(req, res) {
  var cat = req.params.cat;
  db.review.find(function(err, docs){
    res.render('reviews', {
      title: "",
      reviews : docs,
      success: success,
      fail: fail,
      category: cat,
      successMessage: successMessage,
      dangerMessage: dangerMessage,
    });
    successMessage = false;
    dangerMessage = false;
  });
});

app.get('/add/article', function(req, res) {
  res.render('addarticle', {
    title: "",
    successMessage: successMessage,
    dangerMessage: dangerMessage,
  });
  successMessage = false;
  dangerMessage = false;
});

app.get('/edit/article', function(req, res) {
  db.review.find(function(err, docs){
    res.render('editdel', {
      title: "",
      reviews : docs,
      successMessage: successMessage,
      dangerMessage: dangerMessage,
    });
    successMessage = false;
    dangerMessage = false;
  });
});

//add a new article
app.post('/add/article/submit', function (req, res) {
    if (req.method == 'POST') {
        var body = '';

        req.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6)
                req.connection.destroy();
        });

        req.on('end', function () {
            var post = qs.parse(body);
            var subm = {
              image: post.image,
              name: post.name,
              category: post.category,
              rating: post.rating,
              content: post.content
            };
            db.review.insert([subm]);
            console.log("Added record");
            console.log(post.name);
        });
    }
  successMessage = "Article has been edited";
  res.redirect('/');
});

//edit article from db (direct to edit page)
app.get('/edit/article', function(req, res) {
  db.review.find(function(err, docs){
    res.render('adminLogin', {
      title: "",
      reviews : docs,
      successMessage: successMessage,
      dangerMessage: dangerMessage,
    });
    successMessage = false;
    dangerMessage = false;
  });
});

//delete article from db
app.get('/articles/delete/:id', function(req, res) {
  var articleID = req.params.id;
  db.review.remove({_id: ObjectId(articleID)}, function(err) {
    if (err) {
      dangerMessage = "Article could not be deleted, error: " + err;
    } else {
      successMessage = "Article has been deleted";
      res.redirect('/');
    }
  });
});

//edit article and update DB (final)
app.get('/articles/edit/:id', function(req, res) {
  var articleID = req.params.id;
  article = db.review.findOne({_id: ObjectId(articleID)}, function(err, docs) {
    res.render('edit', {
      title: "Edit",
      article: docs,
      successMessage: successMessage,
      dangerMessage: dangerMessage,
    });
    successMessage = false;
    dangerMessage = false;
  });
});

app.get('/search/:te', function(req, res) {
  var term = req.params.te;
  //console.log('test');
  console.log(term);
  db.review.find({name : {$regex : '.*' + term + '.*', $options : 'i'}}, function(err, docs){
    res.render('searchResults', {
      title: "",
      reviews : docs,
      successMessage: successMessage,
      dangerMessage: dangerMessage,
    });
    successMessage = false;
    dangerMessage = false;
  });
});

app.post('/search', function (req, res) {
    if (req.method == 'POST') {
        var body = '';

        req.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6)
                req.connection.destroy();
        });

        req.on('end', function () {
            var post = qs.parse(body);
            res.redirect('/search/' + post.searchb);
        });
    }

});

//edit articles
app.post('/add/edit/submit', function (req, res) {
    if (req.method == 'POST') {
        var body = '';

        req.on('data', function (data) {
            body += data;

            // Too much POST data, kill the connection!
            // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
            if (body.length > 1e6)
                req.connection.destroy();
        });

        req.on('end', function () {
            var post = qs.parse(body);
            var subm = {
              _id: ObjectId(post._id),
              name: post.name,
              category: post.category,
              rating: post.rating,
              content: post.content,
              image: post.image
            };
            db.review.update({ _id: ObjectId(post._id)},subm, function(err, result) {
              if (err) {
                console.log(err);
              } else {
                successMessage = "Article has been edited in the database";
                res.redirect('/');
              }

            });
            console.log("updated record");
            console.log(post.name);


        });
    }

});

//Start server
app.listen(3000, function() {
  console.log('Server has started.... ');
});
