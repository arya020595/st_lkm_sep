require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const allEntrepreneurs = await collection("Entrepreneurs").find({}).toArray();

  let ids = [];
  for (const entrepreneur of allEntrepreneurs) {
    if (!entrepreneur.premiseAddress && entrepreneur.rawJsonRowData) {
      const rawJsonRowData = JSON.parse(entrepreneur.rawJsonRowData);

      const premiseAddress =
        rawJsonRowData["ALAMAT PRIMIS PENGELUARAN / KILANG"];

      await collection("Entrepreneurs").updateOne(
        { _id: entrepreneur._id },
        { $set: { premiseAddress } },
      );
    }
  }
  console.log("done");
};
start();
