require("dotenv").config();
const mongodbConnection = require("../mongodb-connection");
const { v4: uuidV4 } = require("uuid");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();
  const startDate = "1992-01-01";
  const endDate = "2024-02-29";
  try {
    const prices = await collection("GlobalPriceFutureMarketReuters")
      .find({
        date: {
          $gte: startDate,
          $lte: endDate,
        },
        _deletedAt: {
          $exists: false,
        },
      })
      .toArray();

    console.log("prices", prices.length);
    let lists = [];
    for (const pr of prices) {
      const foundDuplicate = prices.filter(p => p.date === pr.date);
      if (foundDuplicate.length > 1) {
        lists.push(pr);
      }
    }

    let keep = [];
    let deleted = [];
    for (const list of lists) {
      const keysLength = Object.keys(list).length;
      if (keysLength < 10) {
        await collection("GlobalPriceFutureMarketReuters").updateOne(
          {
            _id: list._id,
          },
          {
            $set: {
              _deletedAt: new Date().toISOString(),
            },
          },
        );
      } else {
        const foundIndex = keep.findIndex(k => k.date === list.date);
        if (foundIndex === -1) {
          keep.push(list);
        } else {
          deleted.push(list);
        }
      }
    }
    console.log("keep", keep.length);

    for (const del of deleted) {
      await collection("GlobalPriceFutureMarketReuters").updateOne(
        {
          _id: del._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );
    }

    process.exit();
  } catch (err) {
    console.error(err);
  }
};
start();
