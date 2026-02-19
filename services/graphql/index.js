require("dotenv").config({
  path: "../../.env",
});
const express = require("express");
const bodyParser = require("body-parser");
const {
  ApolloServer,
  mergeSchemas,
  makeExecutableSchema,
} = require("apollo-server-express");
const mongodbConnection = require("./mongodb-connection");
const {
  authenticate,
  makeSureDefaultUsersAreExists,
} = require("./authentication");
const { createLoaders } = require("./data-loader");
const initEmailer = require("./emailer");
const initS3 = require("./s3");
require("isomorphic-unfetch");
const { IncomingWebhook } = require("@slack/webhook");
const initClickHouse = require("./clickhouse");

const { lstatSync, readdirSync, existsSync } = require("fs");
const { join } = require("path");
const { composeTypeDefs } = require("./schema/helpers");
const { merge } = require("lodash");
const cors = require("cors");

const isDirectory = (source) => lstatSync(source).isDirectory();
const getDirectories = (source) =>
  readdirSync(source)
    .map((name) => join(source, name))
    .filter(isDirectory);

const mergeResolvers = (resolvers) => {
  let resultingResolvers = {};
  resolvers.forEach((resolver) => {
    resultingResolvers = merge(resultingResolvers, resolver);
  });
  return resultingResolvers;
};

// ############# Populate customTypes
let populatedCustomTypes = [];
const schemaDirs = getDirectories(__dirname + "/schema");
for (const dir of schemaDirs) {
  try {
    const { customTypes } = require(dir + "/types");
    populatedCustomTypes = [...populatedCustomTypes, ...customTypes];
  } catch (e) {
    console.log(
      `Error loading custom types from ${
        dir.split("/")[dir.split("/").length - 1]
      }/types`,
      e.message
    );
    // process.exit();
  }
}
populatedCustomTypes = populatedCustomTypes.join("\n");

// ############# Populate rootTypes and build schema, and also resolvers
const populatedSchemas = [];
let populatedResolvers = [];
for (const dir of schemaDirs) {
  const schemaName = dir.split("/")[dir.split("/").length - 1];
  try {
    if (existsSync(dir + "/types.js")) {
      const { rootTypes } = require(dir + "/types");
      if (!rootTypes) {
        continue;
      }
      const newSchema = makeExecutableSchema({
        typeDefs: composeTypeDefs([rootTypes, populatedCustomTypes].join("\n")),
      });
      populatedSchemas.push(newSchema);
    }

    try {
      if (existsSync(dir + "/resolvers.js")) {
        const { resolvers } = require(dir + "/resolvers");
        populatedResolvers.push(resolvers);
      }
    } catch (e) {
      console.log(`Error populating ${schemaName}/resolvers`, e);
    }
  } catch (e) {
    console.log(
      // `Error while loading schema of ${dir.split("/")[dir.split("/").length - 1]}!`,
      `Error while loading ${schemaName}/types >>`,
      e.message
    );
    // process.exit();
  }
}

const schema = mergeSchemas({
  schemas: populatedSchemas,
  resolvers: mergeResolvers(populatedResolvers),
});

// send only telegram bot
const TelegramBot = require("node-telegram-bot-api");
const TELEGRAM_BOT_TOKEN = "1536649260:AAGlkh9A7tJYI1CIbjbfbPKQPmKxqUq7k1M";
const telegramBot = new TelegramBot(TELEGRAM_BOT_TOKEN, { polling: false });
const TARGET_CHAT_ID = -441637362;
const reportToTelegram = (message) => {
  telegramBot.sendMessage(TARGET_CHAT_ID, message);
};

const start = async () => {
  const { clickhouse } = initClickHouse();
  const s3 = initS3();
  const { collection, mongodb, mongoClient } = await mongodbConnection();
  await makeSureDefaultUsersAreExists(collection);
  const emailer = initEmailer();
  const server = new ApolloServer({
    schema,
    context: async ({ req }) => {
      const activeSession = await authenticate(req, { collection });
      const loader = createLoaders(collection);
      return {
        collection,
        mongodb,
        mongoClient,
        activeSession,
        loader,
        s3,
        stan: {
          log: () => {},
        },
      };
    },
    cors: true,
    debug: process.env.NODE_ENV !== "production",
    playground: process.env.NODE_ENV !== "production",
    formatError: (error) => {
      console.log(JSON.stringify(error, null, 5));
      // return new Error("Internal server error");
      // Or, you can delete the exception information
      // delete error.extensions.exception;
      return error;
    },
  });
  const app = express();
  app.use(express.json({ limit: "100mb" }));
  const allowedOrigins = [
    "https://sep.koko.my",
    "https://koko.my",
    "https://lkm.koko.my",
    `http://localhost:${process.env.APP_PORT}`
  ];

  app.use(
    cors({
      origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.log(origin);
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    })
  );

  app.get("/callback", (req, res) => {
    return res.json({
      ok: true,
    });
  });
  app.get("/callback/fund", (req, res) => {
    return res.json({
      ok: true,
    });
  });
  app.post("/callback/fund", async (req, res) => {
    try {
      const updatedBill = req.body.bill;

      await collection("WorshipRegistrations").createIndex({
        "Bill._id": 1,
      });
      const foundEventRegistration = await collection(
        "WorshipRegistrations"
      ).findOne({
        "Bill._id": updatedBill._id,
      });

      if (foundEventRegistration) {
        if (updatedBill.status === "PAID") {
        } else if (updatedBill.status === "CANCELLED") {
        } else if (
          updatedBill.status === "EXPIRED" ||
          updatedBill.status === "FAILED" ||
          updatedBill.status === "ERRORED"
        ) {
          // await collection("WorshipRegistrations").updateOne(
          //   {
          //     _id: foundEventRegistration._id,
          //   },
          //   {
          //     $unset: {
          //       Bill: 1,
          //       submittedAt: 1,
          //     },
          //     $set: {
          //       latestBill: foundEventRegistration.Bill,
          //       _updatedAt: new Date().toISOString(),
          //     },
          //   }
          // );

          const foundEventParticipants = await collection("EventParticipants")
            .find({
              eventRegistrationId: foundEventRegistration._id,
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          for (const participant of foundEventParticipants) {
            if (participant.ticketId) {
              await collection("Tickets").updateOne(
                {
                  _id: participant.ticketId,
                  reserved: {
                    $gt: 0,
                  },
                },
                {
                  $inc: {
                    availability: 1,
                    reserved: -1,
                  },
                }
              );
            } else if (participant.batchId) {
              await collection("Batches").updateOne(
                {
                  _id: participant.batchId,
                  reserved: {
                    $gt: 0,
                  },
                },
                {
                  $inc: {
                    availability: 1,
                    reserved: -1,
                  },
                }
              );
            }
          }
        }

        const foundUser = await collection("Users").findOne({
          _id: foundEventRegistration.userId,
        });
        if (
          foundUser
          // && process.env.NODE_ENV === "production"
        ) {
          let message = "";
          if (updatedBill.status === "EXPIRED") {
            message = `Tagihan "${updatedBill.description}" untuk user ${foundUser.username} sebesar Rp${updatedBill.amount} sudah kadaluarsa.`;
          } else if (
            updatedBill.status === "ERRORED" ||
            updatedBill.status === "FAILED"
          ) {
            message = `Tagihan "${updatedBill.description}" untuk user ${foundUser.username} gagal terbayar.`;
          } else if (updatedBill.status === "CANCELLED") {
            // message = `User ${foundUser.username} membatalkan pembayaran "${updatedBill.description}" sebesar Rp${updatedBill.amount}.`;
          } else if (updatedBill.status === "PAID") {
            // message = `User ${foundUser.username} baru saja menyelesaikan pembayaran sebesar Rp${updatedBill.amount} untuk "${updatedBill.description}"!  :sunglasses:`;
          }

          // console.log({ message });
          if (message) {
            const webhookUrl = process.env.DISCORD_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
            if (webhookUrl) {
              const webhook = new IncomingWebhook(webhookUrl);
              webhook
                .send(message)
                .then((res) => {
                  console.log(
                    `Notification webhook sent for ${foundUser.username}!`
                  );
                })
                .catch((err) => {
                  console.error('Webhook notification error:', err);
                });
            }
          }
        }
      }

      return res.json({
        ok: true,
      });
    } catch (err) {
      return res.json({
        ok: false,
        error: err.message,
      });
    }
  });
  app.post("/get_daily_price", async (req, res) => {
    const test = await collection("GlobalPriceFutureMarketReuters").findOne({
      _id: "34ab42a9-316c-49f3-9192-fcf918ef7ca2",
    });

    return res.json({
      ...test,
    });
  });

  server.applyMiddleware({ app });
  const port = parseInt(process.env.GRAPHQL_API_PORT) || 4000;
  const bindIp = process.env.GRAPHQL_API_BIND_IP || "localhost";
  await app.listen(port, bindIp, () => {
    console.log(
      `🚀  GraphQL server ready at http://${bindIp}:${port}${server.graphqlPath}`
    );
  });
};

start();
