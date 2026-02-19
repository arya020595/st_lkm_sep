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
    const foundEstateInfo = await collection("EstateInformations").findOne({
      estateId: d.estateId,
    });
    await collection(
      "EstateCensusHakMilikPertubuhanAndSeksyenValues",
    ).updateOne(
      {
        _id: d._id,
      },
      {
        $set: {
          estateInformationId: foundEstateInfo?._id || "",
        },
      },
    );
  }
  console.log("Done...");
};
start();
