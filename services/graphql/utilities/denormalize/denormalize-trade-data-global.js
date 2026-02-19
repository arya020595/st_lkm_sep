require("dotenv").config({
  path: "../../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  let countries = await collection("Countries").find({}).toArray();

  let countryRegion = await collection("CountryRegions")
    .find({
      _id: {
        $in: countries.map(c => c.countryRegionId),
      },
    })
    .toArray();

  countryRegion = countryRegion.reduce((all, reg) => {
    if (!all[reg._id]) {
      all[reg._id] = {};
    }
    all[reg._id] = reg;
    return all;
  }, {});

  countries = countries.reduce((all, country) => {
    if (!all[country._id]) {
      all[country._id] = {};
    }

    let countryRegionName = "";
    if (country.countryRegionId && countryRegion[country.countryRegionId]) {
      countryRegionName = countryRegion[country.countryRegionId].description;
    }
    all[country._id] = {
      ...country,
      countryRegionName,
    };
    return all;
  }, {});

  let sitcProduct = await collection("GlobalSITCProducts").find({}).toArray();
  sitcProduct = sitcProduct.reduce((all, sitc) => {
    if (!all[sitc._id]) {
      all[sitc._id] = {};
    }
    all[sitc._id] = sitc;
    return all;
  }, {});

  const listData = await collection("GlobalTradeDatas")
    .find({})
    .sort({})
    .toArray();

  for (let data of listData) {
    let updateObject = {};
    if (countries[data.countryId]) {
      updateObject.countryName = countries[data.countryId].name;
      updateObject.countryRegionName =
        countries[data.countryId].countryRegionName;
    }
    if (sitcProduct[data.globalSITCProductId]) {
      updateObject.globalSITCCode =
        sitcProduct[data.globalSITCProductId].product;
    }

    await collection("GlobalTradeDatas").updateOne(
      {
        _id: data._id,
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
