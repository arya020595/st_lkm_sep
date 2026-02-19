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
  await collection("GlobalPriceFutureMarketReuters").createIndex({
    date: 1,
  });
  let pricesList = await collection("GlobalPriceFutureMarketReuters")
    .find({
      _deletedAt: { $exists: false },
      // centreId: "85463571-cf3e-4c64-a21a-eba6b674aacf",
      date: {
        $gte: "2023-01-01",
        $lte: "2023-01-31 ",
      },
      label: {
        $exists: true,
      },
      _deletedAt: {
        $exists: false,
      },
    })
    .sort({
      date: 1,
    })
    .toArray();

  console.log("pricesList", pricesList.length);

  let lists = [];
  let deleted = [];
  for (const price of pricesList) {
    const foundIndex = lists.findIndex(p => p.date === price.date);

    if (foundIndex < 0) {
      lists.push(price);
    } else {
      deleted.push(price);
    }
  }

  console.log("total Deleted", deleted.length);

  // let totalValue = 0,
  //   totalCountData = 0;
  // for (const price of pricesList) {
  //   if (price.wetPrice !== 0) {
  //     totalValue += price.wetPrice;
  //     totalCountData++;
  //   }
  // }

  // await collection("GlobalPriceFutureMarketReuters").updateMany(
  //   {
  //     _id: {
  //       $in: deleted.map(d => d._id),
  //     },
  //   },
  //   {
  //     $set: {
  //       _deletedAt: new Date().toISOString(),
  //       note: "DUPLICATE",
  //     },
  //   },
  // );

  console.log("Done...");
};
start();
