require("dotenv").config({
  path: "../../../.env",
});
const fs = require("fs");
const shelljs = require("shelljs");
const yesno = require("yesno");
const mongodbConnection = require("../mongodb-connection");
const path = require("path");

const start = async () => {
  try {
    const { collection, mongodb, mongoClient } = await mongodbConnection();

    if (!process.argv[2]) {
      throw {
        message: `Please specify backup file to restore. Example: yarn db:restore ./DB-2020-07-30.tar.zst`
      }
    }
    const fullpath = path.resolve(process.cwd(), process.argv[2]);
    const pathParseResult = path.parse(fullpath);
    const targetDirname = pathParseResult.name.split(".")[0];
    const targetFilename = pathParseResult.base;
    // console.log({ fullpath, targetDirname, targetFilename });
    const ok = await yesno({
      question: `Are you sure you want to continue restoring ${targetFilename}? (y/n)`,
    });
    if (!ok) {
      process.exit();
    }

    const exportPath = targetDirname;
    shelljs.exec(`zstd -f -d ${targetFilename} -o ${targetDirname}.tar`);
    shelljs.exec(`tar -xvf ${targetDirname}.tar`);
    shelljs.exec(`rm ${targetDirname}.tar`);
    if (!fs.existsSync(exportPath)) {
      fs.mkdirSync(exportPath, {
        recursive: true,
      });
    }

    const fileNames = fs
      .readdirSync(exportPath)
      .filter((name) => name.endsWith(".json"));
    console.log("Got", fileNames.length, "collections");
    for (const fileName of fileNames) {
      const rawData = fs.readFileSync(path.resolve(exportPath, fileName));
      const data = JSON.parse(rawData);
      const collectionName = fileName.replace(".json", "");
      console.log(collectionName + ".json", "Got", data.length, "data");

      const bulk = await mongodb
        .collection(collectionName)
        .initializeUnorderedBulkOp();
      for (const document of data) {
        const { _id, ...body } = document;
        bulk
          .find({ _id })
          .upsert()
          .updateOne({
            $setOnInsert: {
              _id,
            },
            $set: {
              ...body,
            },
          });
      }
      await bulk.execute();
    }

    shelljs.exec(`rm -rf ${exportPath}`);
  } catch (e) {
    console.log(e);
  }
  process.exit();
};

start();
