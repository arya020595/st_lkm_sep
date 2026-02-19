require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");
const FlexSearch = require("flexsearch");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  // const prices = await collection("DomesticCocoaPrices")
  //   .find({
  //     centreId: "85463571-cf3e-4c64-a21a-eba6b674aacf",
  //     date: {
  //       $gte: "2022-01-01",
  //       $lte: "2022-12-31",
  //     },
  //   })
  //   .toArray();

  // const indexedPrice = new FlexSearch({
  //   tokenize: "strict",
  //   doc: {
  //     id: "_id",
  //     field: ["centreId", "date", "buyerId"],
  //   },
  // });
  // indexedPrice.add(prices);

  console.log("Indexing..");
  await collection("DomesticTradeDatas").createIndex({
    year: 1,
    type: 1,
    month: 1,
  });
  let domesticTradeData = await collection("DomesticTradeDatas")
    .find({
      year: 2023,
      type: "Export",
      $or: [
        { sitcCode: "1801009000" },
        { sitcCode: "1801001000" },
        { localSITCCode: "1801.00.100" },
        { localSITCCode: "1801.00.900" },
      ],
      _deletedAt: { $exists: false },
    })
    .sort({
      month: 1,
    })
    .toArray();

  let quantity = 0;
  for (const data of domesticTradeData) {
    quantity = quantity + data.quantity;
  }
  console.log(quantity)
};
start();
