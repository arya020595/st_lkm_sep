const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const { assertValidSession } = require("../../authentication");
const TOKENIZE = process.env.TOKENIZE;
const jwt = require("jsonwebtoken");
const resolvers = {
  Query: {
    futurePriceByDate: async (self, params, context) => {
      return await context.collection("GlobalCocoaPriceFutures").findOne({
        ...NOT_DELETED_DOCUMENT_QUERY,
        date: params.date,
      });
    },
    allFuturePrices: async (self, params, context) => {
      await context.collection("GlobalCocoaPriceFutures").createIndex({
        date: 1,
      });
      const startDate = dayjs(params.date)
        .startOf("month")
        .format("YYYY-MM-DD");

      const endDate = dayjs(params.date).endOf("month").format("YYYY-MM-DD");
      return await context
        .collection("GlobalCocoaPriceFutures")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .toArray();
    },
    countDataFuturePrices: async (self, params, context) => {
      return await context
        .collection("GlobalCocoaPriceFutures")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .count();
    },
    allFuturePricesTokenized: async (self, params, context) => {
      await context.collection("GlobalCocoaPriceFutures").createIndex({
        date: 1,
      });
      const startDate = dayjs(params.date)
        .startOf("month")
        .format("YYYY-MM-DD");

      const endDate = dayjs(params.date).endOf("month").format("YYYY-MM-DD");
      let results = await context
        .collection("GlobalCocoaPriceFutures")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
          date: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .toArray();

      const source = await context.collection("Sources").find({
        ...NOT_DELETED_DOCUMENT_QUERY
      }).toArray();

      const indexedSource = source.reduce((all, source) => {
        if (!all[source._id]) {
          all[source._id] = {};
        }
        all[source._id] = source
        return all;
      }, {});

      results = results.map((q) => {
        return {
          ...q,
          Source: indexedSource[q.sourceId] ? indexedSource[q.sourceId] : null
        }
      })

      const payload = {
        results,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    futurePriceByDateTokenized: async (self, params, context) => {
      let results = await context.collection("GlobalCocoaPriceFutures").findOne({
        ...NOT_DELETED_DOCUMENT_QUERY,
        date: params.date,
      });
      const source = await context.collection("Sources").findOne({
        _id: results?.sourceId || "",
        ...NOT_DELETED_DOCUMENT_QUERY
      });

      results = {
        ...results,
        Source: source ? source : null
      }

      const payload = {
        results,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    }
  },
  Mutation: {
    createFuturePrice: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCocoaPriceFutures",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalCocoaPriceFutures").insertOne(newData);

      // const { _id, iccoPoundsterling, iccoEx, londonEx, nyEx, sgEx, ...d } =
      //   newData;
      // const reuterPrices = {
      //   _id: uuidv4(),
      //   ...d,
      //   iccoPound: iccoPoundsterling,
      //   iccoEX: iccoEx,
      //   sgEX: sgEx,
      //   londonEX: londonEx,
      //   nyEX: nyEx,
      //   futurePriceId: _id,
      //   _createdAt: new Date().toISOString(),
      //   _updatedAt: new Date().toISOString(),
      // };

      // await context.collection("GlobalReutersPrices").insertOne(reuterPrices);
      return "success";
    },
    updateFuturePrice: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      // const { _id, iccoPoundsterling, iccoEx, londonEx, nyEx, sgEx, ...d } =
      //   params;

      const found = await context
        .collection("GlobalCocoaPriceFutures")
        .findOne({
          _id: params._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCocoaPriceFutures",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...params,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalCocoaPriceFutures").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            ...params,
            _updatedAt: new Date().toISOString(),
          },
        },
      );

      // await context.collection("GlobalReutersPrices").updateOne(
      //   {
      //     futurePriceId: params._id,
      //   },
      //   {
      //     $set: {
      //       ...d,
      //       iccoPound: iccoPoundsterling,
      //       iccoEX: iccoEx,
      //       sgEX: sgEx,
      //       nyEX: nyEx,
      //       londonEX: londonEx,
      //       _updatedAt: new Date().toISOString(),
      //     },
      //   },
      // );
      return "success";
    },
    deleteFuturePrice: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context
        .collection("GlobalCocoaPriceFutures")
        .findOne({
          _id: params._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCocoaPriceFutures",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          _deletedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "DELETE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalCocoaPriceFutures").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );
      // await context.collection("GlobalReutersPrices").updateOne(
      //   {
      //     futurePriceId: params._id,
      //   },
      //   {
      //     $set: {
      //       _deletedAt: new Date().toISOString(),
      //     },
      //   },
      // );
      return "success";
    },
    createFuturePriceTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, Source, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const newData = {
        _id: uuidv4(),
        ...decryptedParams,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCocoaPriceFutures",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalCocoaPriceFutures").insertOne(newData);

      return "Success"
    },
    updateFuturePriceTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      // const { _id, iccoPoundsterling, iccoEx, londonEx, nyEx, sgEx, ...d } =
      //   params;
      const { iat, Source, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const found = await context
        .collection("GlobalCocoaPriceFutures")
        .findOne({
          _id: decryptedParams._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCocoaPriceFutures",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...decryptedParams,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalCocoaPriceFutures").updateOne(
        {
          _id: decryptedParams._id,
        },
        {
          $set: {
            ...decryptedParams,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
    },
    deleteFuturePriceTokenized: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const { iat, ...decryptedParams } = jwt.verify(params.tokenized, TOKENIZE);

      const found = await context
        .collection("GlobalCocoaPriceFutures")
        .findOne({
          _id: decryptedParams._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalCocoaPriceFutures",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          _deletedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "DELETE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalCocoaPriceFutures").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );
      return "Success"
    }
  },
  FuturePrice: {
    Source: async (self, parasm, context) => {
      return await context.collection("Sources").findOne({
        _id: self.sourceId,
      });
    },
  },
};
exports.resolvers = resolvers;
