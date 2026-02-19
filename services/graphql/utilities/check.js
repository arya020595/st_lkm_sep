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

  let results = await collection(
    "EstateCensusHakMilikPertubuhanAndSeksyenValuesTMP",
  )
    .find({
      cenyear: 2021,
      $or: [{ code: { $regex: "A01405" } }, { code: { $regex: "A01410" } }],
    })
    .toArray();

  results = results.map(res => {
    let value = res.value.trim();
    value = parseFloat(value);
    return {
      ...res,
      code: res.code.trim(),
      value,
    };
  });

  results = results.filter(res => res.value >= 201 && res.value <= 300);
  console.log(results);
};
start();
