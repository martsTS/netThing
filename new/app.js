var app = require('express')(),
    server = require('http').createServer(app),
    io = require('socket.io').listen(server),
    ent = require('ent'), // bloc HTML characters
    fs = require('fs');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended:false})

// DB connection
var db_connect = require('db_connect');

// sessions
var session = require('cookie-session');
// var userId = null;
app.use(session({secret: 'todotopsecret'}))
.use(function(req, res, next) {
    if (typeof(req.session.userId) == 'undefined') {
        req.session.userId = null;
    }
    next();
});


// Chargement de la page index.html
app.get('/', function (req, res) {
  res.sendfile(__dirname + '/login.html');

});

// Chargement de la page login.html
app.post('/login', urlencodedParser, function (req, res) {
    if (req.body.login != '' && req.body.pwd != ''){
        db_connect.getUserData(req.body.login, function(err, data) {
            if (err) {
                // error handling code goes here
                // console.log("ERROR : ",err);
                res.redirect('/');
            } else if(typeof(data) != "undefined"){            
                // code to execute on data retrieval
                if (data.password == req.body.pwd) {
                    if (typeof(req.session.userId) == 'undefined') {
                        req.session.userId = data.id;
                    }
                    // userId = req.session.userId;
                    res.sendfile(__dirname + '/I5.html');
                    io.sockets.on('connection',function(socket){
                        socket.emit('userId_data', req.session.userId);
                    });
                    var username = data.name;
                } else {
                    res.redirect('/');
                }
            } else {
                res.redirect('/');
            }
        });
        
    }
});

app.post('/I5/fight', function(req, res) {
    res.sendfile(__dirname + '/test.html');
});

// app.post('/I5/save', urlencodedParser,function (req, res) {
//      db_connect.getResourceData(req.session.userId, function(err, data) {
//         if (err) {
//             res.sendfile(__dirname + '/I5.html');
//         } else if (typeof(data) != "undefined") {
//             console.log(req.body);
//             db_connect.udpateResourceData(req.session.userId, req.body.wood, req.body.veg, req.body.meat, req.body.stone, req.body.iron, req.body.gold, req.body.people, req.body.horses, req.body.sheep, req.body.army, req.body.happiness, req.body.wars, req.body.developments, req.body.wheat);
//         } else {
//             db_connect.addResourceData(req.session.userId, req.body.wood, req.body.veg, req.body.meat, req.body.stone, req.body.iron, req.body.gold, req.body.people, req.body.horses, req.body.sheep, req.body.army, req.body.happiness, req.body.wars, req.body.developments, req.body.wheat);
//         }
//     });
//     res.sendfile(__dirname + '/I5.html');
// });

io.sockets.on('connection', function (socket) {
    // Dès qu'on nous donne un pseudo, on le stocke en variable de session et on informe les autres personnes
    socket.on('ask_resource_data', function(userId) {
        var result = null;
        db_connect.getResourceData(userId, function(err, data) {
            
            if (err) {
                // return null;
            } else if (typeof(data) != "undefined") {
                result = {wood:data.wood, veg:data.veg, meat:data.veg, stone:data.stone, iron:data.iron, gold:data.gold, people:data.people, horses:data.horse, sheep:data.sheep, army:data.army, happiness:data.happiness, wars:data.wars, developments:data.developments, wheat:data.wheat};
            } else {
                // return null;
            }
            socket.emit('resource_data', result);
        });
        
    });

    // Dès qu'on reçoit un message, on récupère le pseudo de son auteur et on le transmet aux autres personnes
    socket.on('message', function (message) {
  
        db_connect.getResourceData(message.userId, function(err, data) {
            if (err) {
                res.sendfile(__dirname + '/I5.html');
            } else if (typeof(data) != "undefined") {
                db_connect.udpateResourceData(message.userId, message.wood, message.veg, message.meat, message.stone, message.iron, message.gold, message.people, message.horses, message.sheep, message.army, message.happiness, message.wars, message.developments, message.wheat);
            } else {
                db_connect.addResourceData(message.userId, message.wood, message.veg, message.meat, message.stone, message.iron, message.gold, message.people, message.horses, message.sheep, message.army, message.happiness, message.wars, message.developments, message.wheat);
            }
        });
        // socket.broadcast.emit('message', {pseudo: socket.pseudo, message: message});
    }); 

    socket.on('send_armyNum', function(message) {
        db_connect.getResourceData(message.userId, function(err, data) {
            if (err) {
                // return null;
            } else if (typeof(data) != "undefined") {
                db_connect.udpateResourceData1(message.userId, message.armyNum, message.happiness, message.gold);
            } else {
                // return null;
            }
        });
    });

    socket.on('new_user', function(user) {
        db_connect.getUserData1(user, function(err, data1) {
            if (err) {
                // error handling code goes here
                // console.log("ERROR : ",err);
            } else if(typeof(data1) != "undefined"){            
                // code to execute on data retrieval
                db_connect.getResourceData(user, function(err, data2) {
                    socket.broadcast.emit('new_user', {userName: data1.name, army:data2.army});
                });
            } else {
                // res.redirect('/');
            }
        });
    });
});



server.listen(8080);
