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
    .collection("EstateCensusStateCodes")
    .find({
      stateCode: "12",
    })
    .toArray();

  const estateInfo = await context
    .collection("EstateInformations")
    .find({
      stateCode: "12",
    })
    .toArray();

  const maklumatBorang = await context
    .collection("EstateCensusMaklumatBorang")
    .find({
      censusYear: 2021,
      estateId: {
        $in: estateInfo.map(est => est.estateId),
      },
      // estateStatus: {
      //   $in: ["Aktif", "Terbiar", "Tiada", ""],
      // },
    })
    .toArray();

  console.log(
    "estateInfo",
    estateInfo.length,
    "maklumatBorang",
    maklumatBorang.length,
  );
  // console.log(maklumatBorang);

  const listValues = await context
    .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
    .find({
      censusYear: 2021,
      _deletedAt: {
        $exists: false,
      },
      code: { $in: ["M10022", "M10044"] },
      estateId: {
        $in: estateInfo.map(est => est.estateId),
      },
    })
    .toArray();

  console.log("listValues", listValues.length);
  console.log(
    "jumlah",
    listValues.map(val => val.value).reduce((acc, curr) => acc + curr, 0),
  );

  // console.log(maklumatBorang.map(m => m.estateId));
};
start();
