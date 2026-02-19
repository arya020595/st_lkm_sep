require("dotenv").config();
const mongodbConnection = require("../mongodb-connection");
const { v4: uuidV4 } = require("uuid");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();
  const prices = await collection("GlobalPriceFutureMarketReuters")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  try {
    const jsonData = require("./tbIntCocoaPrices_new_1-json.json");
    for (const data of jsonData) {
      const date = dayjs(data.Date).format("YYYY-MM-DD");

      const found = prices.filter(p => p.date === date);
      if (found.length > 1) {
        throw new Error("ERR");
      } else {
        await collection("GlobalPriceFutureMarketReuters").updateOne(
          {
            date: date,
          },
          {
            $set: {
              londonHigh: parseFloat(data.LondonHigh),
              londonLow: parseFloat(data.LondonLow),
              londonAvg: parseFloat(data.LondonAvg),
              londonEx: parseFloat(data.LondonEX),
              londonPrice: parseFloat(data.LondonPrice),

              nyHigh: parseFloat(data.NYHigh),
              nyLow: parseFloat(data.NYLow),
              nyAvg: parseFloat(data.NYAvg),
              nyEx: parseFloat(data.NYEX),
              nyPrice: parseFloat(data.NYPrice),

              sgHigh: parseFloat(data.SGHigh),
              sgLow: parseFloat(data.SGLow),
              sgAvg: parseFloat(data.SGAvg),
              sgEx: parseFloat(data.SGEX),
              sgPrice: parseFloat(data.SGPrice),

              iccoPoundsterling: parseFloat(data.ICCOPound),
              iccoUSD: parseFloat(data.ICCOUSD),
              iccoAvg: parseFloat(data.ICCOAvg),
              iccoEx: parseFloat(data.ICCOEX),
              iccoPrice: parseFloat(data.ICCOPrice),

              different: parseFloat(data.Different),

              originalFieldObj: data,
            },
          },
        );
      }
    }

    process.exit();
  } catch (err) {
    console.error(err);
  }
};
start();
