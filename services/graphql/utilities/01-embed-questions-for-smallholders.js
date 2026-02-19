require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const allQuestionnaires = await collection("SmallholderCensusQuestionnaires")
    .find({})
    .toArray();

  let countUpdates = 0;
  for (let item of allQuestionnaires) {
    if (item.questions) continue;

    // ################################
    let foundQuestions = await collection("SmallholderCensusQuestionnaires")
      .find({
        _id: {
          $in: item.questionIds || [],
        },
      })
      .toArray();
    let questions = (item.questionIds || [])
      .map(id => foundQuestions.find(q => q._id === id))
      .filter(item => !!item);
    // console.log({ questions }, item.questionIds, questions);
    // ################################

    await collection("SmallholderCensusQuestionnaires").updateOne(
      {
        _id: item._id,
      },
      {
        $set: {
          questions,
        },
      },
    );
    countUpdates += 1;
  }
  console.log("Done...", { countUpdates });
  process.exit();
};
start();
