require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../../mongodb-connection");
const FlexSearch = require("flexsearch");
const lodash = require("lodash");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const context = {
    collection,
  };

  let smallholders = await context
    .collection("Smallholders")
    .find({})
    .toArray();

  smallholders = smallholders.map(sm => {
    return {
      ...sm,
      stateName: sm.stateName ? sm.stateName.toUpperCase().trim() : "",
      perlimentName: sm.perlimentName
        ? sm.perlimentName.toUpperCase().trim()
        : "",
    };
  });

  let states = smallholders.filter(sm => sm.stateName);

  smallholders = smallholders.filter(sm => sm.stateName === "SARAWAK");

  let perlimentName = lodash.uniq(smallholders.map(sm => sm.perlimentName));

  for (const p of perlimentName) {
    // console.log(p);
  }
  states = lodash.uniq(states.map(sm => sm.stateName));

  for (const st of states) {
    console.log(st);
  }
  // console.log(maklumatBorang.map(m => m.estateId));
};
start();
