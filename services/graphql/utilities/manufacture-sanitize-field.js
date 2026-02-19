require("dotenv").config({
  path: "../../../.env",
});

const { v4: uuidv4 } = require("uuid");
const mongodbConnection = require("../mongodb-connection");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();

  const data = await collection("Manufacturers")
    .find({
      // _id: "83770e81-7f47-46f3-9488-11a1df3df45b",
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();

  for (let d of data) {
    let newData = {};

    if (!d["originalFieldObj"]) {
      for (const key of Object.keys(d)) {
        if (typeof d[key] === "object") {
          if (d[key].richText) {
            newData[key] = d[key].richText[0].text;
          }
        } else {
          newData[key] = d[key];
        }
      }

      await collection("Manufacturers").updateOne(
        {
          _id: newData._id,
        },
        {
          $set: {
            ...newData,
          },
        },
      );
    }
  }
  console.log("Done...");
};
start();

const populateImportedData = data => {
  let cocoaWarehouse = {
    ...mapImportedData(data, cocoaWarehousImporKey),
  };

  return cocoaWarehouse;
};

const cocoaWarehousImporKey = {
  name: "name",
  address: "address",
  branch: "branch",
  countryId: "countryId",
  email: "email",
  factory: "factory",
  market: "market",
  productManufactured: "productManufactured",
  productSpesification: "productSpesification",
  stateId: "stateId",
  telephone: "telephone",
  website: "website",
  contactPerson: "contactPerson",
  fax: "fax",
};

const mapImportedData = (data, keys) => {
  const newData = {};
  Object.keys(keys).forEach(key => {
    const newKey = keys[key];
    if (data[key.toLocaleLowerCase()]) {
      newData[newKey] = data[key];
      newData[newKey] = sanitizeCellValue(newData[newKey]);
    } else {
      newData[newKey] = "";
    }
  });
  return newData;
};
const sanitizeCellValue = cellValue => {
  if (typeof cellValue === "string") {
    // do nothing
  } else if (typeof cellValue === "object") {
    if (cellValue.richText) {
      // Rich Text Type
      cellValue = cellValue.richText.map(rt => rt.text || "").join("");
    } else if (cellValue.text) {
      cellValue = cellValue.text;
    } else if (cellValue.result) {
      // Formula Type
      cellValue = cellValue.result;
    }
  }
  return cellValue || "";
};
