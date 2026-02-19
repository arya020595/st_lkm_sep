require("dotenv").config({
  path: "../../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  let regions = await collection("Regions").find({}).toArray();
  regions = regions.reduce((all, reg) => {
    if (!all[reg._id]) {
      all[reg._id] = {};
    }
    all[reg._id] = reg;
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

  let infoStatuses = await collection("InfoStatuses").find({}).toArray();
  infoStatuses = infoStatuses.reduce((all, info) => {
    if (!all[info._id]) {
      all[info._id] = {};
    }
    all[info._id] = info;
    return all;
  }, {});

  const bcsProduction = await collection(
    "BasicCocoaStatisticDomesticProductions",
  )
    .find({})
    .sort({
      year: -1,
      _createdAt: -1,
    })
    .toArray();

  for (let bcs of bcsProduction) {
    let updateObject = {};
    if (regions[bcs.regionId]) {
      updateObject.regionName = regions[bcs.regionId].description;
    }
    if (states[bcs.stateId]) {
      updateObject.stateName = states[bcs.stateId].description;
    }
    if (infoStatuses[bcs.infoStatusId]) {
      updateObject.infoStatusName = infoStatuses[bcs.infoStatusId].description;
    }

    if (bcs.originalFieldObj) {
      updateObject = {
        smallholdingProduction: bcs.originalFieldObj.Smallh_Area,
        estateProduction: bcs.originalFieldObj.Estate_Area,
      };
    }

    await collection("BasicCocoaStatisticDomesticProductions").updateOne(
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
