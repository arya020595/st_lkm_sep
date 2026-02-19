const { exec } = require("child_process");
const path = require("path");
const dayjs = require("dayjs");
const zlib = require("zlib");
const os = require("os");
const fs = require("fs");
const { createReadStream, createWriteStream } = require("fs");

const start = () => {
  const dbName = "db-sep-v2";
  const backupDir = path.join(
    os.homedir(),
    "Desktop",
    "mongo-backups",
    dayjs().format("YYYY-MM-DD"),
  );

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = dayjs().format("YYYY-MM-DD");
  const archiveFile = `${dbName}-${timestamp}.gz`;
  const archivePath = path.join(backupDir, archiveFile);

  const command = `mongodump --db=${dbName} --archive=${archivePath} --gzip`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`mongodump error: ${error}`);
      return;
    }

    console.log(`mongodump stdout:\n${stdout}`);
    console.error(`mongodump stderr:\n${stderr}`);
    const readStream = createReadStream(archivePath);
    const gzip = zlib.createGzip();
    const writeStream = createWriteStream(archivePath + ".gz");

    readStream.pipe(gzip).pipe(writeStream);
  });
};
start();
