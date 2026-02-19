require("dotenv").config({
  path: "../../../.env",
});
const mongodbConnection = require("../mongodb-connection");
const dayjs = require("dayjs");
const { v4: uuidv4 } = require("uuid");
const schedule = require("node-schedule");
const { exec } = require("child_process");
const path = require("path");
const zlib = require("zlib");
const os = require("os");
const fs = require("fs");
const { createReadStream, createWriteStream } = require("fs");
const readlineSync = require("readline-sync");

const sql = require("mssql");
const start = async () => {
  const sqlConfig = {
    user: "app_sep",
    password: "LD2022",
    database: "hharian",
    server: "192.168.1.77\\mcbcloud",
    options: {
      encrypt: false,
      trustServerCertificate: true,
      // enableArithAbort: true,
      // trustConnection: true
    },
  };

  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const date = readlineSync.question("Input Date (YYYY-MM-DD): ");
  const futureMarket = await collection("GlobalPriceFutureMarketReuters")
    .find({
      date,
      iccoPrice: {
        $ne: null
      }
    })
    .toArray();

  console.log("futureMarket", futureMarket.length);
};

start();

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
