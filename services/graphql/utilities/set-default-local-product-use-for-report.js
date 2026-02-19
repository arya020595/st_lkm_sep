require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const data = await collection("LocalSITCProducts").find({}).toArray();

  let counter = 0;
  for (let d of data) {
    counter += 1;
    console.log(`Processing ${counter} of ${data.length}`);

    let useForReport = false;
    if (d.useForReport) {
      useForReport = d.useForReport;
    }
    await collection("LocalSITCProducts").updateOne(
      {
        _id: d._id,
      },
      {
        $set: {
          useForReport,
        },
      },
    );
  }
  console.log("Done...");
};
start();
