require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  let results = await collection(
    "EstateCensusHakMilikPertubuhanAndSeksyenValuesTMP"
  )
    .find({
      cenyear: 2022,
      $or: [{ code: { $regex: "K06702" } }],
    })
    .toArray();

  for (const res of results) {
    let newRecord = {
      recid: res.recid,
      censusYear: res.cenyear,
      estateId: "" + parseInt(res.estid),
      code: res.code.trim(),
      value: parseFloat(res.value.trim()),
    };

    const found = await collection(
      "EstateCensusHakMilikPertubuhanAndSeksyenValues"
    ).findOne({
      censusYear: newRecord.censusYear,
      estateId: newRecord.estateId,
      code: newRecord.code,
      value: newRecord.value,
    });

    if (found) {
      console.log("Found existing record, skipping:", newRecord);
    } else {
      const estateInformation = await collection("EstateInformations").findOne({
        estateId: newRecord.estateId,
      });
      await collection(
        "EstateCensusHakMilikPertubuhanAndSeksyenValues"
      ).insertOne({
        _id: uuidv4(),
        estateId: newRecord.estateId,
        code: newRecord.code,
        value: newRecord.value,
        censusYear: newRecord.censusYear,
        recordId: "" + newRecord.recid,
        estateInformationId: estateInformation._id,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      });
    }
  }
  console.log("Done processing records.");
};
start();
