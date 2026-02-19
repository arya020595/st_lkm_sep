require("dotenv").config({
  path: "../../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  let countries = await collection("Countries").find({}).toArray();
  countries = countries.reduce((all, c) => {
    if (!all[c._id]) {
      all[c._id] = {};
    }
    all[c._id] = c;
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

  let centres = await collection("Centres").find({}).toArray();
  centres = centres.reduce((all, c) => {
    if (!all[c._id]) {
      all[c._id] = {};
    }
    all[c._id] = c;
    return all;
  }, {});

  const listData = await collection("Manufacturers")
    .find({})
    .sort({
      year: -1,
      _createdAt: -1,
    })
    .toArray();

  for (let data of listData) {
    let updateObject = {};
    if (countries[data.countryId]) {
      updateObject.countryName = countries[data.countryId].name;
    }
    if (states[data.stateId]) {
      updateObject.stateName = states[data.stateId].description;
    }
    if (centres[data.centreId]) {
      updateObject.centreName = centres[data.centreId].description;
    }

    await collection("Manufacturers").updateOne(
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
