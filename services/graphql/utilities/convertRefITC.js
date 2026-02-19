require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const refSITC = await collection("RefSITC").find({}).toArray();

  for (let sitc of refSITC) {
    delete sitc._id;

    const localSITC = {
      _id: uuidv4(),
      ...sitc,
    };
    await collection("LocalSITCProducts").insertOne(localSITC);

    const globalSITC = {
      _id: uuidv4(),
      ...sitc,
    };
    await collection("GlobalSITCProducts").insertOne(globalSITC);
  }
  console.log("Done...")
};
start();
