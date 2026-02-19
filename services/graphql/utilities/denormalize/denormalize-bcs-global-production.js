require("dotenv").config({
  path: "../../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  let countryRegions = await collection("CountryRegions").find({}).toArray();
  countryRegions = countryRegions.reduce((all, reg) => {
    if (!all[reg._id]) {
      all[reg._id] = {};
    }
    all[reg._id] = reg;
    return all;
  }, {});

  let countries = await collection("Countries").find({}).toArray();
  countries = countries.reduce((all, country) => {
    if (!all[country._id]) {
      all[country._id] = {};
    }
    all[country._id] = country;
    return all;
  }, {});

  const bcsProduction = await collection("GlobalCocoaProductionICCOs")
    .find({})
    .sort({})
    .toArray();

  for (let bcs of bcsProduction) {
    let updateObject = {};
    if (countryRegions[bcs.countryRegionId]) {
      updateObject.countryRegionName =
        countryRegions[bcs.countryRegionId].description;
    }
    if (countries[bcs.countryId]) {
      updateObject.countryName = countries[bcs.countryId].name;
    }

    await collection("GlobalCocoaProductionICCOs").updateOne(
      {
        _id: bcs._id,
      },
      {
        $set: {
          ...updateObject,
        },
      },
    );
  }
  console.log("Done...");
};
start();
