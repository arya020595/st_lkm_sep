require("dotenv").config();
const mongodbConnection = require("../mongodb-connection");
const { v4: uuidV4 } = require("uuid");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");

const MONTH = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();
  try {
    console.log("1....");
    const foundEstateInformation = await collection("EstateInformations")
      .find({
        _deletedAt: {
          $exists: false,
        },
      })
      .toArray();

    console.log("2....");
    await collection("Acesndat").createIndex({
      recid: 1,
    });

    console.log("3....");
    const listData = await collection("Acesndat").find({}).toArray();
    console.log("4....");
    const chunks = splitArrayIntoChunks(listData, 1000);

    let counter = 0;
    for (let chk of chunks) {
      counter += 1;

      console.log(`Proses ${counter} dari ${chunks.length}`);
      chk = chk.map(c => {
        let data = c;
        data = populateImportedData(data);
        data.recordId = "" + parseInt(data.recordId);
        data.estateId = "" + parseInt(data.estateId);

        if (data.code) {
          data.code = "" + data.code;
          data.code = data.code.trim();
        }
        if (data.oldCode) {
          data.oldCode = "" + data.oldCode;
          data.oldCode = data.oldCode.trim();
        }

        if (data.statement) {
          data.statement = "" + data.statement;
          data.statement = data.statement.trim();
        }

        if (data.value) {
          data.value = "" + data.value;
          data.value = parseFloat(data.value.trim());
        }
        const estateInfo = foundEstateInformation.find(
          est => est.estateId === data.estateId,
        );

        data = {
          ...data,
          _id: uuidV4(),
          estateInformationId: estateInfo?._id || "",
          _createdAt: dayjs().add(1, "second").toISOString(),
          _updatedAt: dayjs().add(1, "second").toISOString(),
        };
        return data;
      });

      await collection(
        "EstateCensusHakMilikPertubuhanAndSeksyenValuesDump",
      ).insertMany(chk);
    }

    // let totalData = listData.length;
    // let counter = 0;

    // let lists = [];
    // let remainings = [];
    // for (let data of listData) {
    //   counter += 1;

    //   if (counter % 5000 === 0) {
    //     counter === 0;
    //     let prosesLoading = parseInt((counter / totalData) * 100);
    //     console.log(
    //       `Process ${counter} from ${listData.length} ${prosesLoading}%`,
    //     );
    //   }
    //   data = populateImportedData(data);
    //   data.recordId = "" + parseInt(data.recordId);
    //   data.estateId = "" + parseInt(data.estateId);

    //   if (data.code) {
    //     data.code = "" + data.code;
    //     data.code = data.code.trim();
    //   }
    //   if (data.oldCode) {
    //     data.oldCode = "" + data.oldCode;
    //     data.oldCode = data.oldCode.trim();
    //   }

    //   if (data.statement) {
    //     data.statement = "" + data.statement;
    //     data.statement = data.statement.trim();
    //   }

    //   if (data.value) {
    //     data.value = "" + data.value;
    //     data.value = parseFloat(data.value.trim());
    //   }
    //   const estateInfo = foundEstateInformation.find(
    //     est => est.estateId === data.estateId,
    //   );

    //   data = {
    //     ...data,
    //     _id: uuidV4(),
    //     estateInformationId: estateInfo?._id || "",
    //     _createdAt: dayjs().add(1, "second").toISOString(),
    //     _updatedAt: dayjs().add(1, "second").toISOString(),
    //   };
    //   lists.push(data);

    //   if (listData.length - counter === 3534) {
    //     console.log("Bulk Update Remaining..");
    //     // await bulkOperations(lists, collection);
    //     await collection(
    //       "EstateCensusHakMilikPertubuhanAndSeksyenValuesDump",
    //     ).insertMany(lists);

    //     await sleep(1500);
    //   } else {
    //     if (lists.length % 5000 === 0) {
    //       console.log("Bulk Update..");
    //       // await bulkOperations(lists, collection);
    //       await collection(
    //         "EstateCensusHakMilikPertubuhanAndSeksyenValuesDump",
    //       ).insertMany(lists);

    //       await sleep(1500);
    //       lists = [];
    //     }
    //   }

    //   // await collection(
    //   //   "EstateCensusHakMilikPertubuhanAndSeksyenValues",
    //   // ).findOneAndUpdate(
    //   //   {
    //   //     recordId: data.recordId,
    //   //   },
    //   //   {
    //   //     $setOnInsert: {
    //   //       _id: uuidV4(),
    //   //     },
    //   //     $set: {
    //   //       ...data,
    //   //       estateInformationId: estateInfo?._id || "",
    //   //       _createdAt: dayjs().add(1, "second").toISOString(),
    //   //       _updatedAt: dayjs().add(1, "second").toISOString(),
    //   //     },
    //   //   },
    //   //   {
    //   //     upsert: true,
    //   //   },
    //   // );
    // }
  } catch (err) {
    console.error(err);
  }
};
start();

// const bulkOperations = async (lists, collection) => {
//   const bulk = await collection(
//     "EstateCensusHakMilikPertubuhanAndSeksyenValuesDump",
//   ).initializeUnorderedBulkOp();
//   counter = 0;
//   for (const document of lists) {
//     counter += 1;
//     const { recordId, ...body } = document;
//     bulk
//       .find({ recordId })
//       .upsert()
//       .updateOne({
//         $setOnInsert: {
//           _id: uuidV4(),
//         },
//         $set: {
//           ...body,
//         },
//       });
//   }
//   await bulk.execute();
// };

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
const populateImportedData = data => {
  // console.log({ data });
  let estateInfo = {
    ...mapImportedData(data, estateInfoImporKey),
  };

  for (const key of Object.keys(estateInfo)) {
    if (key === "censusYear") {
      estateInfo[key] = parseInt(estateInfo[key]);
    } else if (key === "_createdAt" || key === "_updatedAt") {
      if (estateInfo[key]) {
        estateInfo[key] = dayjs(estateInfo[key]).toISOString();
      }
    } else {
      if (estateInfo[key] === "NULL") {
        estateInfo[key] = "";
      }
    }
  }
  return estateInfo;
};

const estateInfoImporKey = {
  estid: "estateId",
  code: "code",
  value: "value",
  statement: "statement",
  cenyear: "censusYear",
  oldcode: "oldCode",
  migrated: "migrated",
  countrepl: "countrepl",
  recid: "recordId",
};

const mapImportedData = (data, keys) => {
  const newData = {};
  Object.keys(keys).forEach(key => {
    const newKey = keys[key];
    if (data[key.toLocaleLowerCase()]) {
      newData[newKey] = data[key];
      newData[newKey] = sanitizeCellValue(newData[newKey]);
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
function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

// Function to split an array into chunks
function splitArrayIntoChunks(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    chunks.push(chunk);
  }
  return chunks;
}
