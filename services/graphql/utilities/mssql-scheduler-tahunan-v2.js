require("dotenv").config({
  path: "../../../.env",
});
const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");
const readlineSync = require("readline-sync");
const dayjs = require("dayjs");
require("dayjs/locale/ms-my");
require("dayjs/locale/en");
dayjs.locale("en");
const localeData = require("dayjs/plugin/localeData");
dayjs.extend(localeData);
const weekOfYear = require("dayjs/plugin/weekOfYear");
dayjs.extend(weekOfYear);
const lodash = require("lodash");
const FlexSearch = require("flexsearch");
const sql = require("mssql");
const schedule = require("node-schedule");


const start = async () => {

  const { collection, mongodb, mongoClient } = await mongodbConnection();

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

  // Run every day at 12:00 PM
  const mssqlPool = await sql.connect(sqlConfig);
  const transaction = new sql.Transaction(mssqlPool);

  // const date = readlineSync.question("Year (YYYY): ");
  schedule.scheduleJob("0 0 1 1 *", async () => {
    const date = dayjs().subtract(1, "year").format("YYYY");
    if (!date) {
      throw new Error("Invalid date"); 
    }
    await scheduleTahunan({
      context: { collection },
      date,
      mssqlPool,
      transaction,
    });
  });

};

const scheduleTahunan = async ({ context, transaction, mssqlPool, date }) => {
  console.log("Schedule every year");
  console.log("Scheduler DOne");

  const yearIds = [parseInt(date)];

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  const allCentres = await context
    .collection("Centres")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();

  const regions = await context
    .collection("Regions")
    .find({
      _id: {
        $in: allCentres.map(c => c.regionId),
      },
    })
    .toArray();

  const indexedRegion = regions.reduce((all, reg) => {
    if (!all[reg._id]) {
      all[reg._id] = {};
    }
    all[reg._id] = reg;
    return all;
  }, {});

  const indexedCentres = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["code"],
    },
  });
  indexedCentres.add(allCentres);

  let query = {
    $or: [],
  };
  for (const year of yearIds) {
    query.$or.push({
      date: {
        $gte: dayjs().set("year", year).startOf("year").format("YYYY-MM-DD"),
        $lte: dayjs().set("year", year).endOf("year").format("YYYY-MM-DD"),
      },
    });
  }
  if (query.$or.length === 0) {
    delete query.$or;
  }
  // query.centreId = {
  //   $in: ["85463571-cf3e-4c64-a21a-eba6b674aacf"],
  // };
  await context.collection("DomesticCocoaPrices").createIndex({
    date: 1,
  });
  const allDomesticCocoaPrices = await context
    .collection("DomesticCocoaPrices")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  const indexedDomesticCocoaPrices = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["centreId"],
    },
  });
  indexedDomesticCocoaPrices.add(allDomesticCocoaPrices);
  // console.log(
  //   JSON.stringify({ params, query }, null, 4),
  //   allDomesticCocoaPrices.length,
  // );

  let lists = [];

  for (const centre of allCentres) {
    let pricesPerDates = indexedDomesticCocoaPrices.where({
      centreId: centre._id,
    });
    if (pricesPerDates.length === 0) continue;

    let annualStats = {};
    [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(monthIndex => {
      let monthlyStats = {
        wetPrice: {
          max: "",
          min: "",
          average: 0,
          total: 0,
          count: 0,
          countDayOfWeek: 0,
        },
        smc1: {
          max: "",
          min: "",
          average: 0,
          total: 0,
          count: 0,
          countDayOfWeek: 0,
        },
        smc2: {
          max: "",
          min: "",
          average: 0,
          total: 0,
          count: 0,
          countDayOfWeek: 0,
        },
        smc3: {
          max: "",
          min: "",
          average: 0,
          total: 0,
          count: 0,
          countDayOfWeek: 0,
        },
      };

      const endDateOfMonth = dayjs()
        .set("month", monthIndex)
        .set("year", yearIds[0])
        .endOf("month");
      let currentDate = dayjs()
        .set("month", monthIndex)
        .set("year", yearIds[0])
        .startOf("month");

      do {
        let pricesPerDates = indexedDomesticCocoaPrices.where({
          centreId: centre._id,
          date: currentDate.format("YYYY-MM-DD"),
        });
        // if (pricesPerDates.length === 0) continue;

        // --------------------------------------------------------------
        // Average Prices Per Month -------------------------------------
        let prices = {};
        for (const price of pricesPerDates) {
          // const groupKey = price.date.split("-")?.[1] || "";
          const groupKey = price.date;
          // console.log("date", price.date, groupKey);
          if (!groupKey) continue;
          if (!prices[groupKey]) {
            prices[groupKey] = {
              ...price,
            };
            for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
              prices[groupKey][key] = 0;
            }
          }

          for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
            if (!price[key]) continue;
            prices[groupKey][key] += price[key];

            if (!prices[groupKey]["count" + key]) {
              prices[groupKey]["count" + key] = 0;
            }
            prices[groupKey]["count" + key] += 1;
          }
        }

        for (const groupKey in prices) {
          for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
            const count = prices[groupKey]["count" + key];
            const sum = prices[groupKey][key];
            prices[groupKey][key] =
              sum !== 0 && count !== 0 ? Math.round(sum / count) : 0;
          }
        }
        // console.log({ prices });
        prices = Object.values(prices);
        // --------------------------------------------------------------

        // const prices = indexedDomesticCocoaPrices.where({
        //   date: currentDate.format("YYYY-MM-DD"),
        // });
        // if (prices.length === 0) {
        //   currentDate = currentDate.add(1, "day");
        //   continue;
        // }

        const stats = {
          wetPrice: {
            max: "",
            min: "",
            average: 0,
            total: 0,
            count: 0,
          },
          smc1: {
            max: "",
            min: "",
            average: 0,
            total: 0,
            count: 0,
          },
          smc2: {
            max: "",
            min: "",
            average: 0,
            total: 0,
            count: 0,
          },
          smc3: {
            max: "",
            min: "",
            average: 0,
            total: 0,
            count: 0,
          },
        };
        for (const price of prices) {
          for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
            const value = price[key] || 0;
            if (!value) continue;
            if (stats[key].max === "" || stats[key].max < value) {
              stats[key].max = value;
            }
            if (stats[key].min === "" || stats[key].min > value) {
              stats[key].min = value;
            }
            stats[key].total += value;
            stats[key].count += 1;
          }
        }

        for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
          stats[key].average =
            stats[key].total > 0 && stats[key].count > 0
              ? lodash.round(stats[key].total / stats[key].count, 0)
              : 0;

          if (
            monthlyStats[key].max === "" ||
            monthlyStats[key].max < stats[key].max
          ) {
            monthlyStats[key].max = stats[key].max;
          }
          if (
            monthlyStats[key].min === "" ||
            monthlyStats[key].min > stats[key].min
          ) {
            if (stats[key].min > 0) {
              monthlyStats[key].min = stats[key].min;
            }
          }
          if (stats[key].average) {
            monthlyStats[key].total += stats[key].average;
            monthlyStats[key].count += 1;
          }
          monthlyStats[key].countDayOfWeek += 1;
        }
        // console.log(currentDate.format("YYYY-MM-DD"), prices.length, {
        //   stats,
        // });

        currentDate = currentDate.add(1, "day");
      } while (!currentDate.isAfter(endDateOfMonth));

      for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
        monthlyStats[key].average =
          monthlyStats[key].total > 0 && monthlyStats[key].count > 0
            ? lodash.round(monthlyStats[key].total / monthlyStats[key].count, 0)
            : 0;

        if (!monthlyStats[key].count) continue;
      }

      annualStats[monthIndex] = monthlyStats;
    });

    const stats = {
      wetPrice: {
        max: "",
        min: "",
        average: 0,
        total: 0,
        count: 0,
        countDayOfWeek: 0,
      },
      smc1: {
        max: "",
        min: "",
        average: 0,
        total: 0,
        count: 0,
        countDayOfWeek: 0,
      },
      smc2: {
        max: "",
        min: "",
        average: 0,
        total: 0,
        count: 0,
        countDayOfWeek: 0,
      },
      smc3: {
        max: "",
        min: "",
        average: 0,
        total: 0,
        count: 0,
        countDayOfWeek: 0,
      },
    };
    for (const monthIndex in annualStats) {
      for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
        const value = annualStats[monthIndex][key].average;
        // console.log(monthIndex, key, value);
        if (!value) continue;
        if (stats[key].max === "" || stats[key].max < value) {
          stats[key].max = value;
        }
        if (stats[key].min === "" || stats[key].min > value) {
          stats[key].min = value;
        }
        stats[key].total += value;
        stats[key].count += 1;
      }
    }

    // if (centre.description.toUpperCase() === "TAWAU") {
    //   console.log(JSON.stringify(stats, null, 4));
    // }

    for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
      stats[key].average =
        stats[key].total > 0 && stats[key].count > 0
          ? lodash.round(stats[key].total / stats[key].count, 0)
          : 0;
    }

    lists.push({
      // centreId: centre._id,
      // code: centre.code,
      // centreIDNo: parseInt(
      //   centre.originalFieldObj ? centre.originalFieldObj.ID : 0,
      // ),
      // name: centre.description,
      // sequence: parseFloat(centre.sequence ? centre.sequence : 0),

      // wetHigh: stats["wetPrice"].max,
      // wetLow: stats["wetPrice"].min,
      // wetAverage: stats["wetPrice"].average,

      // smc1High: stats["smc1"].max,
      // smc1Low: stats["smc1"].min,
      // smc1Average: stats["smc1"].average,

      // smc2High: stats["smc2"].max,
      // smc2Low: stats["smc2"].min,
      // smc2Average: stats["smc2"].average,

      // smc3High: stats["smc3"].max,
      // smc3Low: stats["smc3"].min,
      // smc3Average: stats["smc3"].average,

      Year: yearIds[0],
      Pusat: centre.code,
      Pusat_Kod: centre.description.slice(0, 50),
      CentreID: parseInt(
        centre.originalFieldObj ? centre.originalFieldObj.ID : 0,
      ),
      CentreDesc: centre.description,
      BSH_High: stats["wetPrice"]?.max || 0,
      BSH_Low: stats["wetPrice"]?.min || 0,
      BSH_Avg: stats["wetPrice"]?.average || 0,
      SMC1A_High: stats["smc1"]?.max || 0,
      SMC1A_Low: stats["smc1"]?.min || 0,
      SMC1A_Avg: stats["smc1"]?.average || 0,
      SMC1B_High: stats["smc2"]?.max || 0,
      SMC1B_Low: stats["smc2"]?.min || 0,
      SMC1B_Avg: stats["smc2"]?.average || 0,
      SMC1C_High: stats["smc3"]?.max || 0,
      SMC1C_Low: stats["smc3"]?.min || 0,
      SMC1C_Avg: stats["smc3"]?.average || 0,
      CentreSeq: parseInt(centre.seq ? centre.seq : 0),
      RegionID: indexedRegion[centre.regionId]
        ? indexedRegion[centre.regionId].code
        : "",
      RegionDesc: indexedRegion[centre.regionId]
        ? indexedRegion[centre.regionId].description
        : "",
    });
  }

  for (const list of lists) {
    console.log(list)
    await sleep(10000);

    //Save to mongodDB
    console.log("Save to Mongo DB");
    await context.collection("YearlyDomesticCocoaPriceLogs").insertOne({
      _id: uuidv4(),
      ...list,
      _createdAt: new Date().toISOString(),
      _updatedAt: new Date().toISOString(),
    });

    transaction.begin(err => {
      if (err) {
        console.log("Error transaction begin", err);
      }

      const request = new sql.Request(transaction);
      request.query(
        `INSERT INTO dbo.htahunan (Year, Pusat, Pusat_Kod, CentreID, CentreDesc, BSH_High, BSH_Low, BSH_Avg, SMC1A_High, SMC1A_Low,
                SMC1A_Avg, SMC1B_High, SMC1B_Low, SMC1B_Avg, SMC1C_High, SMC1C_Low, SMC1C_Avg, CentreSeq, RegionID, RegionDesc) VALUES (
                  ${list.Year}, '${list.Pusat}', '${list.Pusat_Kod}', ${list.CentreID}, '${list.CentreDesc}', ${list.BSH_High}, ${list.BSH_Low}, ${list.BSH_Avg},
                  ${list.SMC1A_High}, ${list.SMC1A_Low}, ${list.SMC1A_Avg}, ${list.SMC1B_High}, ${list.SMC1B_Low}, ${list.SMC1B_Avg},
                  ${list.SMC1C_High}, ${list.SMC1C_Low}, ${list.SMC1C_Avg}, ${list.CentreSeq}, '${list.RegionID}', '${list.RegionDesc}'
                )`,
        (err, result) => {
          if (err) {
            console.log("Error MSSQL", err);
          }
          transaction.commit(err => {
            if (err) {
              console.log("Error Transaction");
            }
            console.log("Transaction Ommited");
          });
        },
      );
    });
  }

  console.log("Done...")
  return;
};

start();

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
