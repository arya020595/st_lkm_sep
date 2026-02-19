require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const data = await collection("GlobalTradeDatas").find({}).toArray();

  let counter = 0;
  for (let d of data) {
    counter += 1;
    console.log(`Processing ${counter} of ${data.length}`);
    if (d.originalFieldObj) {
      await collection("GlobalTradeDatas").updateOne(
        {
          _id: d._id,
        },
        {
          $set: {
            year: d.originalFieldObj.Year.trim(),
          },
        },
      );
    }
  }
  console.log("Done...");
};
start();
