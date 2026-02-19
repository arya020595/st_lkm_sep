require("dotenv").config({
  path: "../../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  let states = await collection("States").find({}).toArray();
  states = states.reduce((all, stat) => {
    if (!all[stat._id]) {
      all[stat._id] = {};
    }
    all[stat._id] = stat;
    return all;
  }, {});

  let entrepreneur = await collection("Entrepreneurs").find({}).toArray();
  entrepreneur = entrepreneur.reduce((all, ent) => {
    if (!all[ent._id]) {
      all[ent._id] = {};
    }
    all[ent._id] = ent;
    return all;
  }, {});

  const bcsProduction = await collection("EntrepreneurProductionAndSaleses")
    .find({})
    .sort({
      year: -1,
      _createdAt: -1,
    })
    .toArray();

  for (let bcs of bcsProduction) {
    let updateObject = {};

    if (states[bcs.stateId]) {
      updateObject.stateName = states[bcs.stateId].description;
    }
    if (entrepreneur[bcs.entrepreneurId]) {
      updateObject.entrepreneurName = entrepreneur[bcs.entrepreneurId].name;
    }

    await collection("EntrepreneurProductionAndSaleses").updateOne(
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
