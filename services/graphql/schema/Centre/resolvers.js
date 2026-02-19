const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;
const resolvers = {
  Query: {
    allCentre: async (self, params, context) => {
      return await context
        .collection("Centres")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          code: 1,
        })
        .toArray();
    },
    domesticPriceByCentrePerMonth: async (self, params, context) => {
      // const startDate = dayjs(params.date)
      //   .startOf("month")
      //   .format("YYYY-MM-DD");
      // const endDate = dayjs(params.date).endOf("month").format("YYYY-MM-DD");
      const allCentres = await context
        .collection("Centres")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          code: 1,
        })
        .toArray();

      await context.collection("DomesticCocoaPrices").createIndex({
        centreId: 1,
        date: 1,
      });

      const dailyDomesticCocoaPrices = await context
        .collection("DomesticCocoaPrices")
        .find({
          centreId: {
            $in: allCentres.map(c => c._id),
          },
          date: params.date,
          ...NOT_DELETED_DOCUMENT_QUERY,
          // date: {
          //   $gte: startDate,
          //   $lte: endDate,
          // },
        })
        .toArray();

      const indexedDomesticCocoaPrice = dailyDomesticCocoaPrices.reduce(
        (all, price) => {
          if (!all[price.centreId]) {
            all[price.centreId] = [];
          }
          all[price.centreId].push(price);
          return all;
        },
        {},
      );

      let results = [];
      for (const centre of allCentres) {
        let countPrice = 0;
        let listPriceDates = [];
        let DomesticCocoaPrice = {
          wetHigh: 0,
          wetLow: 0,
          wetAverage: 0,

          smc1High: 0,
          smc1Low: 0,
          smc1Average: 0,

          smc2High: 0,
          smc2Low: 0,
          smc2Average: 0,

          smc3High: 0,
          smc3Low: 0,
          smc3Average: 0,
        };
        if (indexedDomesticCocoaPrice[centre._id]) {
          countPrice = indexedDomesticCocoaPrice[centre._id].length;
          listPriceDates = indexedDomesticCocoaPrice[centre._id].map(
            c => c.date,
          );

          listPriceDates = [...new Set(listPriceDates)];
          const wetPriceArray = indexedDomesticCocoaPrice[centre._id]
            .map(p => p.wetPrice)
            .filter(wp => wp !== 0);

          const wetHigh =
            wetPriceArray.length > 0 ? Math.max(...wetPriceArray) : 0;
          const wetLow =
            wetPriceArray.length > 0 ? Math.min(...wetPriceArray) : 0;

          let wetAverage = 0;
          if (wetPriceArray.length > 0) {
            wetAverage =
              wetPriceArray.reduce((acc, curr) => acc + curr, 0) /
              wetPriceArray.length;
            wetAverage = wetAverage.toFixed(4);
          }

          const smc1PriceArray = indexedDomesticCocoaPrice[centre._id]
            .map(p => p.smc1)
            .filter(sm1 => sm1 !== 0);
          const smc1High =
            smc1PriceArray.length > 0 ? Math.max(...smc1PriceArray) : 0;
          const smc1Low =
            smc1PriceArray.length > 0 ? Math.min(...smc1PriceArray) : 0;

          let smc1Average = 0;
          if (smc1PriceArray.length > 0) {
            smc1Average =
              smc1PriceArray.reduce((acc, curr) => acc + curr, 0) /
              smc1PriceArray.length;
            smc1Average = smc1Average.toFixed(4);
          }

          const smc2PriceArray = indexedDomesticCocoaPrice[centre._id]
            .map(p => p.smc2)
            .filter(sm2 => sm2 !== 0);
          const smc2High =
            smc2PriceArray.length > 0 ? Math.max(...smc2PriceArray) : 0;
          const smc2Low =
            smc2PriceArray.length > 0 ? Math.min(...smc2PriceArray) : 0;

          let smc2Average = 0;
          if (smc2PriceArray.length > 0) {
            smc2Average =
              smc2PriceArray.reduce((acc, curr) => acc + curr, 0) /
              smc2PriceArray.length;
            smc2Average = smc2Average.toFixed(4);
          }

          const smc3PriceArray = indexedDomesticCocoaPrice[centre._id]
            .map(p => p.smc3)
            .filter(sm3 => sm3 !== 0);
          const smc3High =
            smc3PriceArray.length > 0 ? Math.max(...smc3PriceArray) : 0;
          const smc3Low =
            smc3PriceArray.length > 0 ? Math.min(...smc3PriceArray) : 0;

          let smc3Average = 0;
          if (smc3PriceArray.length > 0) {
            smc3Average =
              smc3PriceArray.reduce((acc, curr) => acc + curr, 0) /
              smc3PriceArray.length;
            smc3Average = smc3Average.toFixed(4);
          }

          DomesticCocoaPrice = {
            wetHigh,
            wetLow,
            wetAverage,

            smc1High,
            smc1Low,
            smc1Average,

            smc2High,
            smc2Low,
            smc2Average,

            smc3High,
            smc3Low,
            smc3Average,
          };
        }
        results.push({
          ...centre,
          countPrice,
          listPriceDates,
          DomesticCocoaPrice,
        });
      }
      return results;
    },
    domesticPriceByCentrePerMonthTokenized: async (self, params, context) => {
      const allCentres = await context
        .collection("Centres")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          code: 1,
        })
        .toArray();

      await context.collection("DomesticCocoaPrices").createIndex({
        centreId: 1,
        date: 1,
      });

      const dailyDomesticCocoaPrices = await context
        .collection("DomesticCocoaPrices")
        .find({
          centreId: {
            $in: allCentres.map(c => c._id),
          },
          date: params.date,
          ...NOT_DELETED_DOCUMENT_QUERY,
          // date: {
          //   $gte: startDate,
          //   $lte: endDate,
          // },
        })
        .toArray();

      const indexedDomesticCocoaPrice = dailyDomesticCocoaPrices.reduce(
        (all, price) => {
          if (!all[price.centreId]) {
            all[price.centreId] = [];
          }
          all[price.centreId].push(price);
          return all;
        },
        {},
      );

      let results = [];
      for (const centre of allCentres) {
        let countPrice = 0;
        let listPriceDates = [];
        let DomesticCocoaPrice = {
          wetHigh: 0,
          wetLow: 0,
          wetAverage: 0,

          smc1High: 0,
          smc1Low: 0,
          smc1Average: 0,

          smc2High: 0,
          smc2Low: 0,
          smc2Average: 0,

          smc3High: 0,
          smc3Low: 0,
          smc3Average: 0,
        };
        if (indexedDomesticCocoaPrice[centre._id]) {
          countPrice = indexedDomesticCocoaPrice[centre._id].length;
          listPriceDates = indexedDomesticCocoaPrice[centre._id].map(
            c => c.date,
          );

          listPriceDates = [...new Set(listPriceDates)];
          const wetPriceArray = indexedDomesticCocoaPrice[centre._id]
            .map(p => p.wetPrice)
            .filter(wp => wp !== 0);

          const wetHigh =
            wetPriceArray.length > 0 ? Math.max(...wetPriceArray) : 0;
          const wetLow =
            wetPriceArray.length > 0 ? Math.min(...wetPriceArray) : 0;

          let wetAverage = 0;
          if (wetPriceArray.length > 0) {
            wetAverage =
              wetPriceArray.reduce((acc, curr) => acc + curr, 0) /
              wetPriceArray.length;
            wetAverage = wetAverage.toFixed(4);
          }

          const smc1PriceArray = indexedDomesticCocoaPrice[centre._id]
            .map(p => p.smc1)
            .filter(sm1 => sm1 !== 0);
          const smc1High =
            smc1PriceArray.length > 0 ? Math.max(...smc1PriceArray) : 0;
          const smc1Low =
            smc1PriceArray.length > 0 ? Math.min(...smc1PriceArray) : 0;

          let smc1Average = 0;
          if (smc1PriceArray.length > 0) {
            smc1Average =
              smc1PriceArray.reduce((acc, curr) => acc + curr, 0) /
              smc1PriceArray.length;
            smc1Average = smc1Average.toFixed(4);
          }

          const smc2PriceArray = indexedDomesticCocoaPrice[centre._id]
            .map(p => p.smc2)
            .filter(sm2 => sm2 !== 0);
          const smc2High =
            smc2PriceArray.length > 0 ? Math.max(...smc2PriceArray) : 0;
          const smc2Low =
            smc2PriceArray.length > 0 ? Math.min(...smc2PriceArray) : 0;

          let smc2Average = 0;
          if (smc2PriceArray.length > 0) {
            smc2Average =
              smc2PriceArray.reduce((acc, curr) => acc + curr, 0) /
              smc2PriceArray.length;
            smc2Average = smc2Average.toFixed(4);
          }

          const smc3PriceArray = indexedDomesticCocoaPrice[centre._id]
            .map(p => p.smc3)
            .filter(sm3 => sm3 !== 0);
          const smc3High =
            smc3PriceArray.length > 0 ? Math.max(...smc3PriceArray) : 0;
          const smc3Low =
            smc3PriceArray.length > 0 ? Math.min(...smc3PriceArray) : 0;

          let smc3Average = 0;
          if (smc3PriceArray.length > 0) {
            smc3Average =
              smc3PriceArray.reduce((acc, curr) => acc + curr, 0) /
              smc3PriceArray.length;
            smc3Average = smc3Average.toFixed(4);
          }

          DomesticCocoaPrice = {
            wetHigh,
            wetLow,
            wetAverage,

            smc1High,
            smc1Low,
            smc1Average,

            smc2High,
            smc2Low,
            smc2Average,

            smc3High,
            smc3Low,
            smc3Average,
          };
        }
        results.push({
          ...centre,
          countPrice,
          listPriceDates,
          DomesticCocoaPrice,
        });
      }

      const payload = {
        results,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
    countDomesticCocoaPrices: async (self, params, context) => {
      return await context
        .collection("DomesticCocoaPrices")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .count();
    },
  },

  Mutation: {
    createCentre: async (self, params, context) => {
      assertValidSession(context.activeSession);
      const newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context.collection("Centres").findOne({
        code: newData.code,
        regionId: newData.regionId,
        ...NOT_DELETED_DOCUMENT_QUERY,
      });

      if (foundExisted) {
        throw new Error("Duplicate Code And Region");
      }

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Centres",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("Centres").insertOne(newData);
      return "success";
    },
    updateCentre: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("Centres").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Centres",
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

      await context.collection("Centres").updateOne(
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
      return "success";
    },
    deleteCentre: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("Centres").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "Centres",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...params,
          _deletedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "DELETE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("Centres").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
  },

  Centre: {
    LocalRegion: async (self, params, context) => {
      return await context.collection("Regions").findOne({
        _id: self.regionId,
      });
    },
  },
};

exports.resolvers = resolvers;
