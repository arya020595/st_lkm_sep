require("dotenv").config({
  path: "../../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  let countries = await collection("Countries").find({}).toArray();
  countries = countries.reduce((all, country) => {
    if (!all[country._id]) {
      all[country._id] = {};
    }
    all[country._id] = country;
    return all;
  }, {});

  let sitcProduct = await collection("LocalSITCProducts").find({}).toArray();
  sitcProduct = sitcProduct.reduce((all, sitc) => {
    if (!all[sitc._id]) {
      all[sitc._id] = {};
    }
    all[sitc._id] = sitc;
    return all;
  }, {});

  let infoStatuses = await collection("InfoStatuses").find({}).toArray();
  infoStatuses = infoStatuses.reduce((all, info) => {
    if (!all[info._id]) {
      all[info._id] = {};
    }
    all[info._id] = info;
    return all;
  }, {});

  const listData = await collection("DomesticTradeDatas")
    .find({})
    .sort({})
    .toArray();

  for (let data of listData) {
    let updateObject = {};
    if (countries[data.countryId]) {
      updateObject.countryName = countries[data.countryId].name;
    }
    if (sitcProduct[data.localSITCProductId]) {
      updateObject.localSITCCode =
        sitcProduct[data.localSITCProductId].sitcCode;
      updateObject.localSITCProduct =
        sitcProduct[data.localSITCProductId].product;
    }
    if (infoStatuses[data.infoStatusId]) {
      updateObject.infoStatusName = infoStatuses[data.infoStatusId].description;
    }

    let quantity = 0;
    if (data.originalFieldObj) {
      quantity = data.originalFieldObj.ExportQuantity;
    } else {
      quantity = data.quantity;
    }
    await collection("DomesticTradeDatas").updateOne(
      {
        _id: data._id,
      },
      {
        $set: {
          ...updateObject,
          quantity,
        },
      },
    );
  }
  console.log("Done...");
};
start();
