// README :The following was used to fill up our pokemon table in our postgres database with shaped data from the pokeapi.
// You will have to decide when and where to call this if your database is in need of persistant pokemon data.
//1) fetchFirst151Pokemon:
//  Use this function to fill up the database with a number of pokemon from the pokeapi in conjuction with savePokemon function in db.js
//  Things to consider:
//    -More than 10 requests to the pokeapi will result in a 504 timeout error (per my experience).
//    -I filled the DB by manually calling this function, each time making only 10 requests (refactor to recursive or setTimeout if needed).
//    -You should only need to fill up your DB with all the pokemon you plan to incorporate once.
//    -The api is free to use but only 300 requests per resource per day are permitted e.g. bulbasaur can be requested 300 times per day.
//2) checkForPokemon:
//     a function that checks how many pokemon rows are in the pokemon table. If there are less rows than the number
//     of pokemon (in this case, less that the original 151 pokemon we wanted), then it excutes a callback i.e. fetchFirst151Pokemon.
const axios = require('axios');
const Promise = require('bluebird');
const db = '../../database/db.js';

const fetchFirst151Pokemon = (callback, pokemonStoredSoFar) => {
  let arrayOfRequests = [];
  //you WILL get a 504 error if you try to process a large number of requests. I did increments of 10.
  for (let i = pokemonStoredSoFar; i <= pokemonStoredSoFar + 10; i++) {
    arrayOfRequests.push(axios.get(`https://pokeapi.co/api/v2/pokemon/${i}/`));
    console.log('A REQUEST WITH ID: ', i);
  }
  console.log('IN FETCH, FETCHING POKES!');
  Promise.all(arrayOfRequests)
    .then((arrOfPromises) => {
      arrOfPromises.forEach((promise) => {
        console.log('SHAPING POKEMON WITH ID: ', promise.data.id);
        let pokemonObj = {};
        pokemonObj.types = [];

        promise.data.types.forEach((typeObj) => {
          pokemonObj.types[typeObj.slot - 1] = typeObj.type.name;
        });

        pokemonObj.name = promise.data.name;
        pokemonObj.id = promise.data.id;
        pokemonObj.baseHealth = promise.data.stats[5].base_stat;
        pokemonObj.baseAttack = promise.data.stats[4].base_stat;
        pokemonObj.baseDefense = promise.data.stats[3].base_stat;
        pokemonObj.backSprite = promise.data.sprites.back_default;
        pokemonObj.frontSprite = promise.data.sprites.front_default;
        console.log('POKEOBJ: ', pokemonObj);
        callback(pokemonObj);

      });
    })
    .catch((err) => {
      console.log('POKEMON FETCH ERROR: ', err);
    });
};


const checkForPokemon = (callback) => {
  db.Pokemon.findAll({})
    .then((data) => {
      if (data.length < 151) {
        console.log('There are less than 151 pokemon in the DB!');
        console.log('NUMBER POKES IN DB: ', data.length);
        callback(db.savePokemon, data.length);
      } else {
        console.log('All 151 pokemon are already in the DB!');
        console.log('NUMBER POKES IN DB: ', data.length)
      }
    });
};

module.exports = {
  fetchFirst151Pokemon: fetchFirst151Pokemon,
  checkForPokemon: checkForPokemon
};
