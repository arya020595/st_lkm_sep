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

  let tarafSah = await context
    .collection("EstateCensusTarafSah")
    .find({})
    .toArray();

  tarafSah = tarafSah.map(tf => tf.legalStatus);

  console.log("tarafSah", tarafSah.length);
  
};
start();
