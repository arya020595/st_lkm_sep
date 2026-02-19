require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const allEntrepreneurs = await collection("Entrepreneurs").find({}).toArray();
  const states = await collection("States")
    .find({
      _deletedAt: { $exists: false },
    })
    .toArray();
  let ids = [];
  for (const entrepreneur of allEntrepreneurs) {
    if (entrepreneur.stateId && !entrepreneur.state) {
      const state = states.find(s => s._id === entrepreneur.stateId);
      ids.push({
        _id: entrepreneur._id,
        state: state.description.toUpperCase(),
      });
    }
  }
  console.log(ids);
};
start();
