require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../../mongodb-connection");
const FlexSearch = require("flexsearch");
const lodash = require("lodash");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const context = {
    collection,
  };

  let info = await context
    .collection("EstateCensusMaklumatBorang")
    .find({
      censusYear: 2021,
      estateStatus: { $in: ["Aktif", "Terbiar", "Tiada"] },
    })
    .toArray();

  info = info.map(tf => tf.estateId);
  console.log("info", info.length);
  const values = await context
    .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
    .find({
      censusYear: 2021,
      estateId: {
        $in: ["377", "464", "86", "724", "725", "731", "60"],
      },
      code: {
        $in: ["D03201", "D03401"],
      },
    })
    .toArray();

  console.log("values 1", values.filter(v => v.code === "D03201").length, {
    total: values
      .filter(v => v.code === "D03201")
      .map(v => v.value)
      .reduce((acc, curr) => acc + curr, 0),
  });

  console.log("values 2", values.filter(v => v.code === "D03401").length, {
    total:
      values
        .filter(v => v.code === "D03401")
        .map(v => v.value)
        .reduce((acc, curr) => acc + curr, 0) / 1000,
  });

  const val1 = values
    .filter(v => v.code === "D03201")
    .map(v => v.value)
    .reduce((acc, curr) => acc + curr, 0);

  const val2 = values
    .filter(v => v.code === "D03401")
    .map(v => v.value)
    .reduce((acc, curr) => acc + curr, 0);

  console.log({ jumlah: val2 / val1 });
};
start();
