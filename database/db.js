const Sequelize = require('sequelize');
const rgx = new RegExp(/postgres:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
const match = process.env.DATABASE_URL ? process.env.DATABASE_URL.match(rgx) : 'postgres://wairrcwaikkuob:b6f7a04b36dc888549bcedd0c99f7cec9c18eb3e83bda91f24bd31fbe60eba50@ec2-50-16-199-246.compute-1.amazonaws.com:5432/d10sjl0jdmpqhu'.match(rgx);

sequelize = new Sequelize(match[5], match[1], match[2], {
    dialect:  'postgres',
    protocol: 'postgres',
    port:     match[4],
    host:     match[3],
    logging: false,
    dialectOptions: {
        ssl: true
    }
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });

const Users = sequelize.define('userito', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    username: Sequelize.STRING,
    password: Sequelize.STRING,
    email: Sequelize.STRING
  }
  , {
    timestamps: false
  });

const Pokemon = sequelize.define('pokerito', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    unique: true
  },
  name: Sequelize.STRING,
  types: Sequelize.ARRAY(Sequelize.TEXT),
  baseHealth: Sequelize.INTEGER,
  baseAttack: Sequelize.INTEGER,
  baseDefense: Sequelize.INTEGER,
  backSprite: Sequelize.STRING,
  frontSprite: Sequelize.STRING
},
  {
    timestamps: false
});

const WinLoss = sequelize.define('winlossito', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    unique: true
  },
  gameDate: Sequelize.DATE,
  winner_id: Sequelize.INTEGER,
  winner_pokemon: Sequelize.Array(Sequelize.INTEGER),
  loser_id: Sequelize.INTEGER,
  loser_pokemon: Sequelize.Array(Sequelize.INTEGER)
});

Users.sync();
Pokemon.sync();

// Users
//   .findAll()
//   .then(allUsers => {
//     console.log('all users')
//     console.log(allUsers)
//   })
const saveUser = (username, password, email) =>  {
  return Users
    .findOne({ where: { username } })
    .then(userFound => {
      if (userFound) return 'Username Already Exists';
      else return Users
        .findOne({ where: { email } })
    })
    .then(userFoundOrUsernameExists => {
      if (userFoundOrUsernameExists) {
        return userFoundOrUsernameExists === 'Username Already Exists'  ?
        'Username Already Exists':
        'Email Already Exists';
      }
      else return Users.create({ username, password, email });
    })
};

const savePokemon = (pokemonObj) => {
  console.log('IN SAVE POKEMON!');
  Pokemon.create(pokemonObj).then((data) => {
    // console.log('DATA: ', data);
    console.log('POKEMON SAVED TO DB!')
  })
  .catch((err) => {
    console.log('POKEMON SAVED ERROR: ', err);
  });
}

// Users

//   .findAll()
//   .then(users => {
//     console.log("FOUND USERS")
//     console.log(users);
//   })



module.exports = {
  connecttion: sequelize,
  saveUser: saveUser,
  Users: Users,
  Pokemon: Pokemon
}

// POSTGRES WITHOUT SEQUELIZE
// const { Client } = require('pg');

// const client = new Client({
//   connectionString: process.env.DATABASE_URL || 'postgres://wairrcwaikkuob:b6f7a04b36dc888549bcedd0c99f7cec9c18eb3e83bda91f24bd31fbe60eba50@ec2-50-16-199-246.compute-1.amazonaws.com:5432/d10sjl0jdmpqhu',
//   ssl: true,
// });

// client.connect();

// client.query(`
//   CREATE TABLE USERINFO(
//     ID INT         PRIMARY KEY  NOT NULL,
//     USERNAME       CHAR(50)     NOT NULL,
//     PASSWORD       CHAR(50)     NOT NULL,
//     EMAIL          CHAR(50)     NOT NULL
//   );
//   `, (err, resp) => {
//   if (err) {
//     console.log('errored');
//     throw err;
//   }
//   // client.query(`
//   // SELECT password FROM company
//   // `, (err, resp) => {
//   //   if (err) {
//   //     console.log('errored 2');
//   //     throw err;
//   //   }
//   //   console.log('not errored');
//   //   console.log(resp);
//   // })
//   // client.query(`
//   // INSERT INTO company (ID, USERNAME, PASSWORD) VALUES (NULL, 'DAVID', 'BOWIE');
//   // `, (err, resp) => {
//   //   console.log('ADDED INTO DB');
//   //   console.log(resp)
//   //   client.end();
//   // })
// });
