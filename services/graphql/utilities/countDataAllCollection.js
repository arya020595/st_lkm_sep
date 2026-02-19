require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");
const lodash = require("lodash");
const fs = require("fs");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();
  const collections = await mongodb.listCollections().toArray();

  let results = [];
  for (const collection of collections) {
    const data = await mongodb
      .collection(collection.name)
      .find({
        _deletedAt: {
          $exists: false,
        },
      })
      .count();

    results.push({
      collectionName: collection.name,
      totalData: data,
    });
  }
  results = lodash.orderBy(results, ["collectionName"], ["asc"]);

  fs.writeFileSync("./countCollectionData.json", JSON.stringify(results));

  console.log("Done...");
};
start();
