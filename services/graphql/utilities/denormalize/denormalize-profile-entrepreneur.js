require("dotenv").config({
  path: "../../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  let entrepreneurs = await collection("Entrepreneurs").find({}).toArray();
  entrepreneurs = entrepreneurs.map(ent => {
    return {
      ...ent,
      state: ent.state ? ent.state.toUpperCase() : "",
    };
  });

  let states = await collection("States").find({}).toArray();
  states = states.map(st => {
    return {
      ...st,
      description: st.description.toUpperCase(),
    };
  });

  const indexedState = states.reduce((all, st) => {
    if (!all[st.description]) {
      all[st.description] = {};
    }
    all[st.description] = st;
    return all;
  }, {});

  for (const entrepreneur of entrepreneurs) {
    let updateObject = {};
    if (indexedState[entrepreneur.state]) {
      updateObject.stateId = indexedState[entrepreneur.state]._id;
    }

    await collection("Entrepreneurs").updateOne(
      {
        _id: entrepreneur._id,
      },
      {
        $set: {
          ...updateObject,
        },
      },
    );
  }
  console.log("Done..");
};
start();
