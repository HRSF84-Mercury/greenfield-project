const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USERNAME, process.env.DB_PASSWORD, {
  dialect: 'postgres',
  protocol: 'postgres',
  port: process.env.DB_PORT,
  host: process.env.DB_HOST,
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

const Users = sequelize.define('userito',
  {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    username: Sequelize.STRING,
    password: Sequelize.STRING,
    email: Sequelize.STRING
  },
  {
    timestamps: false
  }
);

const Pokemon = sequelize.define('pokerito',
  {
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

const WinLoss = sequelize.define('winlossito',
  {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      unique: true
    },
    gameDate: Sequelize.DATE,
    winner_id: Sequelize.INTEGER,
    winner_pokemon: Sequelize.ARRAY(Sequelize.INTEGER),
    loser_id: Sequelize.INTEGER,
    loser_pokemon: Sequelize.ARRAY(Sequelize.INTEGER)
  });

Users.sync();
Pokemon.sync();

// Users
//   .findAll()
//   .then(allUsers => {
//     console.log('all users')
//     console.log(allUsers)
//   })
const saveUser = (username, password, email) => {
  return Users
    .findOne({ where: { username } })
    .then(userFound => {
      if (userFound) {
        return 'Username Already Exists';
      } else {
        return Users
          .findOne({ where: { email } });
      }
    })
    .then(userFoundOrUsernameExists => {
      if (userFoundOrUsernameExists) {
        return userFoundOrUsernameExists === 'Username Already Exists' ?
          'Username Already Exists' :
          'Email Already Exists';
      } else {
        return Users.create({ username, password, email });
      }
    });
};

const savePokemon = (pokemonObj) => {
  console.log('IN SAVE POKEMON!');
  Pokemon.create(pokemonObj).then((data) => {
    // console.log('DATA: ', data);
    console.log('POKEMON SAVED TO DB!');
  })
    .catch((err) => {
      console.log('POKEMON SAVED ERROR: ', err);
    });
};

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
};

// POSTGRES WITHOUT SEQUELIZE
// const { Client } = require('pg');

// const client = new Client({
//   connectionString: process.env.DATABASE_URL || ' ****REDACTED**** ',
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
