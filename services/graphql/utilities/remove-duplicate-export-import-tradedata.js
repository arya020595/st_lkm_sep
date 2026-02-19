require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");
const FlexSearch = require("flexsearch");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();
  const countries = await collection("Countries")
    .find({
      _deletedAt: { $exists: false },
    })
    .toArray();

  const domesticTradeDatas = await collection("DomesticTradeDatas")
    .find({
      year: 2024,
      month: 2,
      type: "Export",
      _deletedAt: { $exists: false },
    })
    .toArray();

  let duplicates = {};

  for(const tradeData of domesticTradeDatas) {
    // const foundDuplicate =     
  }

  console.log("Done...");
};
start();
