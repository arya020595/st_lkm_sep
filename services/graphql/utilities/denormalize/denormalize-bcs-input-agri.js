require("dotenv").config({
  path: "../../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  let agriInputType = await collection("AgriInputTypes").find({}).toArray();
  agriInputType = agriInputType.reduce((all, agr) => {
    if (!all[agr._id]) {
      all[agr._id] = {};
    }
    all[agr._id] = agr;
    return all;
  }, {});

  let states = await collection("States").find({}).toArray();
  states = states.reduce((all, stat) => {
    if (!all[stat._id]) {
      all[stat._id] = {};
    }
    all[stat._id] = stat;
    return all;
  }, {});

  let regions = await collection("Regions").find({}).toArray();
  regions = regions.reduce((all, reg) => {
    if (!all[reg._id]) {
      all[reg._id] = {};
    }
    all[reg._id] = reg;
    return all;
  }, {});

  const bcsData = await collection("BasicCocoaStatisticDomesticInputAgries")
    .find({})
    .sort({})
    .toArray();

  for (let bcs of bcsData) {
    let updateObject = {};

    if (regions[bcs.regionId]) {
      updateObject.regionName = regions[bcs.regionId].description;
    }
    if (states[bcs.stateId]) {
      updateObject.stateName = states[bcs.stateId].description;
    }
    if (agriInputType[bcs.agriInputTypeId]) {
      updateObject.agriInputTypeName =
        agriInputType[bcs.agriInputTypeId].description;
    }
    await collection("BasicCocoaStatisticDomesticInputAgries").updateOne(
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
