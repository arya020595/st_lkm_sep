require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const data = await collection("DomesticTradeDatas").find({}).toArray();

  let counter = 0;
  for (let d of data) {
    counter += 1;
    console.log(`Processing ${counter} of ${data.length}`);
    if (d.originalFieldObj) {
      await collection("DomesticTradeDatas").updateOne(
        {
          _id: d._id,
        },
        {
          $set: {
            quantity: parseFloat(d.originalFieldObj.ExportQuantity),
            value: parseFloat(d.originalFieldObj.ExportValue),
          },
        },
      );
    }
  }
  console.log("Done...");
};
start();
