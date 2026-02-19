require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const estateCensus = await collection(
    "EstateCensusHakMilikPertubuhanAndSeksyenInformations",
  )
    .find({})
    .toArray();

  // console.log("estateCensus", estateCensus.length);

  let counter = 0;
  for (let estate of estateCensus) {
    counter += 1;
    console.log(`Proses ${counter} of ${estateCensus.length}`);

    if (estate.rawJsonRowData) {
      const parsed = JSON.parse(estate.rawJsonRowData);
      await collection(
        "EstateCensusHakMilikPertubuhanAndSeksyenInformations",
      ).updateOne(
        {
          _id: estate._id,
        },
        {
          $set: {
            cvalid1: parsed.cvalid1,
            cvalid2: parsed.cvalid2,
            cvalid3: parsed.cvalid3,
          },
        },
      );
    }
  }
};
start();
