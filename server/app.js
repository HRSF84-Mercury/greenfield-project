const express = require('express');
const path = require('path');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const db = require('../database/db.js');
const bodyParser = require('body-parser');
const Promise = require('bluebird');
const bcrypt = Promise.promisifyAll(require('bcrypt'));
const saltRounds = 10;
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('passport');
const axios = require('axios');
const { createPokemon, createTurnlog, createPlayer } = require('./helpers/creators.js'); 
const { damageCalculation } = require('../game-logic.js');

const dist = path.join(__dirname, '/../client/dist');



/* ======================== MIDDLEWARE ======================== */

app.use(bodyParser());
app.use(express.static(dist));

app.use(cookieParser());
app.use(session({
  secret: 'odajs2iqw9asjxzascatsas22',
  resave: false,
  saveUninitialized: false,
  // cookie: { secure: true },
}));
app.use(passport.initialize());
app.use(passport.session());

// ** Webpack middleware **
// Note: Make sure while developing that bundle.js is NOT built - delete if it is in dist directory

if (process.env.NODE_ENV !== 'production') {
  const webpack = require('webpack');
  const webpackDevMiddleware = require('webpack-dev-middleware');
  const webpackHotMiddleware = require('webpack-hot-middleware');
  const config = require('../webpack.config.js');
  const compiler = webpack(config);

  app.use(webpackHotMiddleware(compiler));
  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: config.output.publicPathdist
  }));
}

/* =============================================================== */ 


/* ======================== GAME STATE =========================== */

/* The state of all games currently happening are saved in the 
'games' object.

The sample shape of a game is:

  {
    player1: object,
    player2: object,
    playerTurn: string ('player1' or 'player2')
  }

Refer to './helpers/creators.js' for more detail 
on what is inside each player object

*/

const games = {};

/* =============================================================== */ 



/* =============== SOCKET CONNECTION / LOGIC ===================== */

io.on('connection', (socket) => {
  
  /* socket.on('join game')

  The first check is to see if there is a game in the games object with this id, and if there is not, it initializes a new one with this new player.This means creating a new socket 'room' via socket.join() using the game's URL name. Once the player is created, update the game state and emit to player one ONLY that he / she is player1 by emitting directly to that socket id. 

  If the game already exists but there is no player 2, it creates that player and first emits to that client directly that it is player2 as well as to the newly created room that the game is now ready, and it sends down the game's state to both clients to parse out and render. 

  */ 

  socket.on('join game', (data) => {
    socket.join(data.gameid);
    if (!(data.gameid in games)) {
      createPlayer(data, 'player1')
      .then(player1 => {
        games[data.gameid] = {
          player1,
          player2: null,
          playerTurn: 'player1'
        }
        io.to(socket.id).emit('player', player1);
      });
    } else if (data.gameid in games && !games[data.gameid].player2) {
      createPlayer(data, 'player2')
      .then(player2 => {
        games[data.gameid].player2 = player2; 
        io.to(socket.id).emit('player', player2);
        io.to(data.gameid).emit('ready', games[data.gameid]);
      });
    } else {
        io.to(socket.id).emit('gamefull', 'this game is full!');
    }
  });

  socket.on('chat message', (data) => {
    io.to(data.gameid).emit('chat message', data)
  });

  /* socket.on('attack') / socket.on('switch')

  These two functions both involve updating the game's state in some way and re-sending it back down to the client once it has been fully processed. Different events are emitted back to the client based on the state of the game, and can be extended to add more complexity into the game. 

  */ 

  socket.on('attack', (data) => {
    const game = games[data.gameid];
    const player = game.playerTurn;
    const opponent = game.playerTurn === 'player1' ? 'player2' : 'player1'
    const turnResults = damageCalculation(game[player], game[opponent]);
    game[opponent].pokemon[0].health -= turnResults.damageToBeDone;
    const turnlog = createTurnlog(game, turnResults, 'attack');
    io.to(data.gameid).emit('attack processed', {
      basicAttackDialog: turnlog
    })
    if (
      game[opponent].pokemon[0].health <= 0 && 
      game[opponent].pokemon[1].health <= 0 && 
      game[opponent].pokemon[2].health <= 0
    ) {
      game[opponent].pokemon[0].health = 0; 
      io.to(data.gameid).emit('turn move', game);      
      io.to(data.gameid).emit('gameover', { name: game[player].name });
    } else if (game[opponent].pokemon[0].health <= 0) {
      game[opponent].pokemon[0].health = 0; 
      game.playerTurn = opponent;
      io.to(data.gameid).emit('turn move', game);    
    } else {
      game.playerTurn = opponent;
      io.to(data.gameid).emit('turn move', game);
    }
  });

  socket.on('switch', data => {
    const game = games[data.gameid];
    const player = game.playerTurn;
    const opponent = game.playerTurn === 'player1' ? 'player2' : 'player1';
    game[player].pokemon.unshift(game[player].pokemon.splice(data.index, 1)[0]);
    const turnlog = createTurnlog(game, null, 'switch');
    game.playerTurn = opponent;
    io.to(data.gameid).emit('attack processed', {
      basicAttackDialog: turnlog
    });
    io.to(data.gameid).emit('turn move', game);
  })

});

/* =============================================================== */


/* =============== AUTHENTICATION ROUTES / LOGIC ================= */


app.post('/login', (req, resp) => {
  console.log('post request on /login');
  const username = req.body.username;
  const password = req.body.password;


  console.log('username', username);
  console.log('password', password);
  db.Users
  .findOne({where: { username } })
  .then(user => {
    // finds user
    // not found => end resp
    // found => compare passwords
    // don't match => end resp
    // login
    if (!user) {
      resp.writeHead(201, {'Content-Type': 'text/plain'});
      resp.end('Username Not Found');
    }
    else {
      const hash = user.dataValues.password;
      return bcrypt.compare(password, hash)
    }
  })
  .then(passwordsMatch => {
    if (!passwordsMatch) {
      resp.writeHead(201, {'Content-Type': 'text/plain'});
      resp.end('Passwords Do Not Match');
    }
    else {
      req.session.username = username;
      req.session.loggedIn = true;
      resp.redirect('/welcome');
    }
  })
})

app.post('/signup', (req, resp) => {
  console.log('post request on /signup');
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  bcrypt.hash(password, saltRounds)
    .then(hash => db.saveUser(username, hash, email))
    .then(newuser => {
      if (newuser.dataValues) {
        req.login({ user_id: newuser.id }, err => {
            if (err) throw err;
            console.log("NEW USER ID:", newuser.id);
            req.session.username = username;
            req.session.loggedIn = true;
            let session = JSON.stringify(req.session);
            resp.writeHead(201, {'Content-Type': 'app/json'});
            resp.end(session);
          });
      }
      else if (newuser.match('Username Already Exists')) {
        resp.writeHead(201, {'Content-Type': 'text/plain'});
        resp.end('Username Already Exists');
      }
      else if (newuser.match('Email Already Exists')) {
        resp.writeHead(201, {'Content-Type': 'text/plain'});
        resp.end('Email Already Exists');
      }
    })
    .catch(err => {
      throw new Error(err)
    });
})
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.get('/user', (req, resp) => {
  resp.end(JSON.stringify({
    username: req.session.username,
    loggedIn: req.session.loggedIn
  }));
})

app.get('/logout', (req, resp) => {
  req.session.destroy(err => {
    if (err) throw err;
    resp.redirect('/login');
  });
});

/* =============================================================== */


// a catch-all route for BrowserRouter - enables direct linking to this point.

app.get('/*', (req, resp) => {
    resp.sendFile(dist + '/index.html');
});


var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('listening on *:' + port);
});

module.exports = app;
