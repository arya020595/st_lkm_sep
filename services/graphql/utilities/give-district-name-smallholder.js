require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const smallholders = await collection("Smallholders").find({}).toArray();
  const districts = await collection("SmallholderDistricts").find({}).toArray();

  for (const holder of smallholders) {
    const found = districts.find(d => d.guid === holder.districtGuid);

    if (!found) {
    } else {
      await collection("Smallholders").updateOne(
        {
          _id: holder._id,
        },
        {
          $set: {
            districtName: found.name,
          },
        },
      );
    }
  }
  console.log("Done...");
};
start();
