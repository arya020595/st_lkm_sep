require("dotenv").config({
  path: "../../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  let categories = await collection("Categories").find({}).toArray();
  categories = categories.reduce((all, cat) => {
    if (!all[cat._id]) {
      all[cat._id] = {};
    }
    all[cat._id] = cat;
    return all;
  }, {});

  let divisions = await collection("Divisions").find({}).toArray();
  divisions = divisions.reduce((all, div) => {
    if (!all[div._id]) {
      all[div._id] = {};
    }
    all[div._id] = div;
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

  const employments = await collection("Employments")
    .find({})
    .sort({
      year: -1,
      _createdAt: -1,
    })
    .toArray();

  for (let emp of employments) {
    let updateObject = {};

    if (regions[emp.localRegionId]) {
      updateObject.regionName = regions[emp.localRegionId].description;
    }
    if (divisions[emp.divisionId]) {
      updateObject.divisionName = divisions[emp.divisionId].description;
    }
    if (categories[emp.categoryId]) {
      updateObject.categoryName = categories[emp.categoryId].description;
    }
    await collection("Employments").updateOne(
      {
        _id: emp._id,
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
