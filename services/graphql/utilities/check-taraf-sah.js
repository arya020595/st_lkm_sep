require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");
const FlexSearch = require("flexsearch");
const lodash = require("lodash");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const tarafSah = await collection("EstateCensusTarafSah").find({}).toArray();

  const ts = lodash.uniq(tarafSah.map(tf => tf.legalStatus));
  console.log({ ts });
};
start();
