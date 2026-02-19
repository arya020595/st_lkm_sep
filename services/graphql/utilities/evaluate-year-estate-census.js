require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const estateCensus = await collection(
    "EstateCensusHakMilikPertubuhanAndSeksyenValues",
  )
    .find({})
    .toArray();

  console.log("estateCensus", estateCensus.length);

  let counter = 0;
  for (const estate of estateCensus) {
    counter += 1;

    console.log(`Processing ${counter} of ${estateCensus.length}`);
    let year = 0;
    if (estate.censusYear) {
      year = estate.censusYear;
    } else {
      year = estate.year;
    }
    await collection("EstateCensusYearLists").findOneAndUpdate(
      {
        estateId: estate.estateId,
        year,
      },
      {
        $setOnInsert: {
          _id: uuidv4(),
          estateId: estate.estateId,
          _createdAt: new Date().toISOString(),
        },
        $set: {
          year,
          _updatedAt: new Date().toISOString(),
        },
      },
      {
        upsert: true,
      },
    );
  }
};
start();
