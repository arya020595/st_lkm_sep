require("dotenv").config();
const mongodbConnection = require("../mongodb-connection");
const { v4: uuidV4 } = require("uuid");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();
  try {
    // Read the contents of the JSON file
    // const data = await fs.readFileSync(jsonFilePath, "utf-8");

    // Parse the JSON data into a JavaScript object
    // const jsonData = JSON.parse(data);

    // Log the contents of the JSON file to the console
    process.exit();
  } catch (err) {
    console.error(err);
  }
};
start();
