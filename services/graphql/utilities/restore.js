const { exec } = require("child_process");
const path = require("path");
const dayjs = require("dayjs");
const zlib = require("zlib");
const os = require("os");
const fs = require("fs");
const { createReadStream, createWriteStream } = require("fs");

const start = () => {
  const backupDir = path.join(
    os.homedir(),
    "Desktop",
    "mongo-backups",
    dayjs().format("YYYY-MM-DD"),
  );

  const gzipFile = path.join(backupDir, "lkm-2023-04-05.gz");
  const dbName = "testdb";

  const command = `mongorestore --gzip --archive=${gzipFile} --nsFrom='lkm.*' --nsTo='${dbName}.*'`;

  const mongorestore = exec(command);

  mongorestore.stdout.on("data", data => {
    console.log(`stdout: ${data}`);
  });

  mongorestore.stderr.on("data", data => {
    console.error(`stderr: ${data}`);
  });

  mongorestore.on("close", code => {
    console.log(`mongorestore exited with code ${code}`);
  });
};
start();
