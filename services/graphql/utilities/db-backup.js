require("dotenv").config({
  path: "../../../.env",
});
const fs = require("fs");
const shelljs = require("shelljs");
const mongodbConnection = require("../mongodb-connection");
const dayjs = require("dayjs");
const yargs = require("yargs/yargs");
const { hideBin } = require("yargs/helpers");
const argv = yargs(hideBin(process.argv)).argv;
console.log({ argv });

let TRIM_LONG_TEXT = argv.minimal;
let COLLECTION_WHITELISTS = !argv.minimal ? [] : ["Users", "UserRoles"];

let COLLECTION_BLACKLISTS = [];

const start = async () => {
  const targetDirname = "DB-" + dayjs().format("YYYY-MM-DD");
  const targetFilename = "DB-" + dayjs().format("YYYY-MM-DD") + ".tar.zst";

  try {
    const { collection, mongodb, mongoClient } = await mongodbConnection();
    const collections = await mongodb.listCollections().toArray();

    const exportPath = process.cwd() + "/" + targetDirname;
    if (fs.existsSync(exportPath)) {
      shelljs.exec(`rm -rf ${exportPath}`);
    }
    fs.mkdirSync(exportPath, {
      recursive: true,
    });

    for (const collection of collections) {
      if (
        COLLECTION_WHITELISTS &&
        COLLECTION_WHITELISTS.length > 0 &&
        !COLLECTION_WHITELISTS.includes(collection.name)
      ) {
        continue;
      }
      if (
        COLLECTION_BLACKLISTS &&
        COLLECTION_BLACKLISTS.length > 0 &&
        !!COLLECTION_BLACKLISTS.includes(collection.name)
      ) {
        continue;
      }
      if (
        collection.name === "EstateCensusHakMilikPertubuhanAndSeksyenValuesDump"
      ) {
        continue;
      }

      let query = {};
      let data = await mongodb
        .collection(collection.name)
        .find(query)
        .toArray();
      if (TRIM_LONG_TEXT) {
        data = data.map(row => {
          let trimmedRow = {};
          Object.keys(row).map(key => {
            const value = row[key];
            if (typeof value === "string" && value.length > 200) {
              trimmedRow[key] = null;
              // console.log("> Trimming", key, value.length);
            } else {
              trimmedRow[key] = value;
            }
          });
          return trimmedRow;
        });
      }
      if (data.length > 0) {
        console.log(collection.name + ".json", "Got", data.length, "data");
        fs.writeFileSync(
          exportPath + "/" + collection.name + ".json",
          JSON.stringify(data),
        );
      }
    }

    shelljs.exec(`rm ${process.cwd()}/${targetFilename}`);
    shelljs.exec(
      `tar --use-compress-program zstd -cf ${targetFilename} ${targetDirname}`,
    );
    shelljs.exec(`rm -rf ${exportPath}`);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }

  console.log("\n=====================================");
  console.log(`Backup created: ${targetFilename}\n`);
  process.exit();
};

start();
