require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const data = await collection(
    "EstateCensusHakMilikPertubuhanAndSeksyenValues",
  )
    .find({})
    .toArray();

  for (let d of data) {
    if (d.value) {
      await collection(
        "EstateCensusHakMilikPertubuhanAndSeksyenValues",
      ).updateOne(
        {
          _id: d._id,
        },
        {
          $set: {
            value: parseFloat(d.value),
          },
        },
      );
    }
  }
  console.log("Done...");
};
start();
