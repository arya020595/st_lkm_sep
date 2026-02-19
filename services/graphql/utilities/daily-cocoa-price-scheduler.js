require("dotenv").config({
  path: "../../../.env",
});
const mongodbConnection = require("../mongodb-connection");
const dayjs = require("dayjs");
const { v4: uuidv4 } = require("uuid");
const schedule = require("node-schedule");
var mysql = require("mysql");
let addressMysql = "192.168.1.77\\mcbcloud";
var mysqlConnection = mysql.createConnection({
  host: addressMysql,
  user: "app_sep",
  password: "LD2022",
  database: "MSSQL 2019",
});

const start = async () => {
  mysqlConnection.connect();
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const job = schedule.scheduleJob("*/1 * * * * *", async () => {
    console.log("The answer to life, the universe, and everything!");

    const currentDate = dayjs().format("YYYY-MM-DD");

    const centres = await collection("Centres")
      .find({
        description: {
          $in: ["Tawau", "Kuching", "Raub"],
        },
      })
      .toArray();

    const domesticPrices = await collection("DomesticCocoaPrices")
      .find({
        centreId: {
          $in: centres.map(c => c._id),
        },
        date: currentDate, //currentDate,
      })
      .toArray();

    const indexedPriceByCentre = domesticPrices.reduce((all, price) => {
      if (!all[price.centreId]) {
        all[price.centreId] = [];
      }
      all[price.centreId].push(price);
      return all;
    }, {});

    const latestData = await collection("DailyDomesticCocoaPriceLogs")
      .find({
        centreId: {
          $in: centres.map(c => c._id),
        },
      })
      .toArray();

    let counter = latestData.length;
    for (const centre of centres) {
      counter += 1;
      let newData = {
        counter,
        centreId: centre._id,
        name: centre.name,
        sequence: parseFloat(centre.sequence ? centre.sequence : 0),
        wetHigh: 0,
        wetLow: 0,
        wetAverage: 0,

        smc1High: 0,
        smc1Low: 0,
        smc1Average: 0,

        smc2High: 0,
        smc2Low: 0,
        smc2Average: 0,

        smc3High: 0,
        smc3Low: 0,
        smc3Average: 0,
      };

      if (indexedPriceByCentre[centre._id]) {
        const wetPriceArray = indexedPriceByCentre[centre._id].map(
          p => p.wetPrice,
        );
        const wetHigh = Math.max(...wetPriceArray);
        const wetLow = Math.min(...wetPriceArray);
        let wetAverage =
          wetPriceArray.reduce((acc, curr) => acc + curr, 0) /
          wetPriceArray.length;
        wetAverage = wetAverage.toFixed(4);

        const smc1PriceArray = indexedPriceByCentre[centre._id].map(
          p => p.smc1,
        );
        const smc1High = Math.max(...smc1PriceArray);
        const smc1Low = Math.min(...smc1PriceArray);
        let smc1Average =
          smc1PriceArray.reduce((acc, curr) => acc + curr, 0) /
          smc1PriceArray.length;
        smc1Average = smc1Average.toFixed(4);

        const smc2PriceArray = indexedPriceByCentre[centre._id].map(
          p => p.smc2,
        );
        const smc2High = Math.max(...smc2PriceArray);
        const smc2Low = Math.min(...smc2PriceArray);
        let smc2Average =
          smc2PriceArray.reduce((acc, curr) => acc + curr, 0) /
          smc2PriceArray.length;
        smc2Average = smc2Average.toFixed(4);

        const smc3PriceArray = indexedPriceByCentre[centre._id].map(
          p => p.smc3,
        );
        const smc3High = Math.max(...smc3PriceArray);
        const smc3Low = Math.min(...smc3PriceArray);
        let smc3Average =
          smc3PriceArray.reduce((acc, curr) => acc + curr, 0) /
          smc3PriceArray.length;
        smc3Average = smc3Average.toFixed(4);

        newData = {
          ...newData,
          wetHigh,
          wetLow,
          wetAverage,

          smc1High,
          smc1Low,
          smc1Average,

          smc2High,
          smc2Low,
          smc2Average,

          smc3High,
          smc3Low,
          smc3Average,
        };
      }

      newData = {
        _id: uuidv4(),
        ...newData,
        date: dayjs().format("YYYY-MM-DD"),
        timeStamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      //Save to mongodDB
      console.log("Save to Mongo DB");
      await collection("DailyDomesticCocoaPriceLogs").insertOne(newData);

      //Save to Mysql
      var post = {
        recid: counter,
        TARIKH: newData.date,
        PUSAT: newData.name,
        BSH_TGG: newData.wetHigh,
        BSH_RDH: newData.wetLow,
        BSH_PUR: newData.wetAverage,
        SMC1A_TGG: newData.smc1High,
        SMC1A_RDH: newData.smc1Low,
        SMC1A_PUR: newData.smc1Average,
        SMC1B_TGG: newData.smc2High,
        SMC1B_RDH: newData.smc2Low,
        SMC1B_PUR: newData.smc2Average,
        SMC1C_TGG: newData.smc3High,
        SMC1C_RDH: newData.smc3Low,
        SMC1C_PUR: newData.smc3Average,
        SEQ: newData.sequence,
      };
      var query = mysqlConnection.query(
        "INSERT INTO dbo.tmp_harian SET ?",
        post,
        function (error, results, fields) {
          if (error) throw error;
          // Neat!
        },
      );
      console.log(query.sql);

      // let smc1 = 0,
      //   smc2 = 0,
      //   smc3 = 0;
      // if (
      //   indexedPriceByCentre[centre._id] &&
      //   indexedPriceByCentre[centre._id].length > 0
      // ) {
      //   let counter = 0;
      //   for (const price of indexedPriceByCentre[centre._id]) {
      //     counter += 1;
      //     smc1 += price.smc1;
      //     smc2 += price.smc2;
      //     smc3 += price.smc3;
      //   }

      //   smc1 = parseFloat(smc1 / counter);
      //   smc2 = parseFloat(smc2 / counter);
      //   smc3 = parseFloat(smc3 / counter);
      // }

      // const newData = {
      //   _id: uuidv4(),
      //   centreId: centre._id,
      //   description: centre.description,
      //   smc1,
      //   smc2,
      //   smc3,
      //   date: dayjs().format("YYYY-MM-DD"),
      //   timeStamp: dayjs().format("YYYY-MM-DD HH:mm:ss"),
      //   _createdAt: new Date().toISOString(),
      //   _updatedAt: new Date().toISOString(),
      // };

      // await collection("DailyDomesticCocoaPriceLogs").insertOne(newData);
    }
  });

  console.log("Done...");
};
start();
