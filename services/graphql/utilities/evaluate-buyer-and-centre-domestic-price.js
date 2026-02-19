require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const domesticPrices = await collection("DomesticCocoaPrices")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .sort({
      date: 1,
    })
    .toArray();
  let counter = 0;
  for (let price of domesticPrices) {
    counter += 1;
    console.log(`Processing ${counter} ${domesticPrices.length}`);
    if (price.originalFieldObj) {
      let centreId = String(price.originalFieldObj.CentreID);
      centreId = centreId.replace(/\s+/g, "");
      centreId = centreId.replace(/["']/g, "");

      let buyerId = String(price.originalFieldObj.BuyerID);
      buyerId = buyerId.replace(/\s+/g, "");
      buyerId = buyerId.replace(/["']/g, "");

      const foundBuyer = await collection("Buyers").findOne({
        "originalFieldObj.CentreID": centreId,
        "originalFieldObj.BuyerID": buyerId,
      });

      await collection("DomesticCocoaPrices").updateOne(
        {
          _id: price._id,
        },
        {
          $set: {
            centreId: foundBuyer ? foundBuyer.centreId : "",
            buyerId: foundBuyer ? foundBuyer._id : "",
          },
        },
      );
    }
  }
  console.log("Done..");
};
start();
