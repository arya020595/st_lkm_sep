const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const { assertValidSession } = require("../../authentication");
const jwt = require("jsonwebtoken");
const TOKENIZE = process.env.TOKENIZE;

const resolvers = {
  Query: {
    allBasicCocoaStatisticDomesticGrindings: async (self, params, context) => {
      await context
        .collection("BasicCocoaStatisticDomesticGrindings")
        .createIndex({
          year: -1,
        });

      return await context
        .collection("BasicCocoaStatisticDomesticGrindings")
        .find({
          year: params.years
            ? {
                $in: params.years.map(year => parseInt(year)),
              }
            : parseInt(params.year || dayjs().format("YYYY")),
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
    },
    countBasicCocoaStatisticDomesticGrindings: async (
      self,
      params,
      context,
    ) => {
      return await context
        .collection("BasicCocoaStatisticDomesticGrindings")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .count();
    },
    allBasicCocoaStatisticDomesticGrindingsTokenized: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);

      let results = await context
        .collection("BasicCocoaStatisticDomesticGrindings")
        .find({
          year: params.years
            ? {
                $in: params.years.map(year => parseInt(year)),
              }
            : parseInt(params.year || dayjs().format("YYYY")),
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const regions = await context
        .collection("Regions")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      const indexedRegion = regions.reduce((all, reg) => {
        if (!all[reg._id]) {
          all[reg._id] = {};
        }
        all[reg._id] = reg;
        return all;
      }, {});

      results = results.map(res => {
        let production = null;
        if (res.production) {
          production = res.production;
        } else {
          production = {
            cocoaButter: 0,
            cocoaLiquorMass: 0,
            cocoaPowder: 0,
            cocoaCake: 0,
          };
        }

        let fob = null;
        if (res.fob) {
          fob = res.fob;
        } else {
          fob = {
            cocoaButter: 0,
            cocoaLiquorMass: 0,
            cocoaPowder: 0,
            cocoaCake: 0,
          };
        }

        let MonthlyLocalSales = null;
        if (res.monthlyLocalSales) {
          MonthlyLocalSales = res.monthlyLocalSales;
        } else {
          MonthlyLocalSales = {
            cocoaButter: 0,
            cocoaLiquorMass: 0,
            cocoaPowder: 0,
            cocoaCake: 0,
          };
        }

        let MonthlyExport = null;
        if (res.monthlyExport) {
          MonthlyExport = res.monthlyExport;
        } else {
          MonthlyExport = {
            cocoaButter: 0,
            cocoaLiquorMass: 0,
            cocoaPowder: 0,
            cocoaCake: 0,
          };
        }
        let localPurchasePeninsula = 0;
        if (res.localPurchasePeninsula) {
          localPurchasePeninsula = res.localPurchasePeninsula;
        } else if (res.localPurchase) {
          localPurchasePeninsula = res.localPurchase;
        }

        return {
          ...res,
          LocalRegion: indexedRegion[res.regionId],
          fob,
          production,
          MonthlyLocalSales,
          MonthlyExport,
          localPurchasePeninsula,
        };
      });

      const payload = {
        results,
      };

      let token = jwt.sign(payload, TOKENIZE);
      return token;
    },
  },
  Mutation: {
    createBasicCocoaStatisticDomesticGrinding: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      const newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context
        .collection("BasicCocoaStatisticDomesticGrindings")
        .findOne({
          year: newData.year,
          month: newData.month,
          // regionId: newData.regionId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });
      if (foundExisted) {
        throw new Error(`Year, and Month`);
      }

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticDomesticGrindings",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("BasicCocoaStatisticDomesticGrindings")
        .insertOne(newData);
      return "success";
    },
    updateBasicCocoaStatisticDomesticGrinding: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("BasicCocoaStatisticDomesticGrindings")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticDomesticGrindings",
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

      await context
        .collection("BasicCocoaStatisticDomesticGrindings")
        .updateOne(
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
    deleteBasicCocoaStatisticDomesticGrinding: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("BasicCocoaStatisticDomesticGrindings")
        .findOne({
          _id: params._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticDomesticGrindings",
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

      await context
        .collection("BasicCocoaStatisticDomesticGrindings")
        .updateOne(
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
    createBasicCocoaStatisticDomesticGrindingTokenized: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      const tokenized = jwt.verify(params.tokenizedInput, TOKENIZE);

      const { iat, ...payloadTokenized } = tokenized;

      const newData = {
        _id: uuidv4(),
        ...payloadTokenized,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context
        .collection("BasicCocoaStatisticDomesticGrindings")
        .findOne({
          year: newData.year,
          month: newData.month,
          // regionId: newData.regionId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });
      if (foundExisted) {
        throw new Error(`Year, and Month`);
      }

      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticDomesticGrindings",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("BasicCocoaStatisticDomesticGrindings")
        .insertOne(newData);

      return "success";
    },
    updateBasicCocoaStatisticDomesticGrindingTokenized: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const tokenized = jwt.verify(params.tokenizedInput, TOKENIZE);

      const { iat, ...payloadTokenized } = tokenized;

      const found = await context
        .collection("BasicCocoaStatisticDomesticGrindings")
        .findOne({
          _id: payloadTokenized._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticDomesticGrindings",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...payloadTokenized,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("BasicCocoaStatisticDomesticGrindings")
        .updateOne(
          {
            _id: payloadTokenized._id,
          },
          {
            $set: {
              ...payloadTokenized,
              _updatedAt: new Date().toISOString(),
            },
          },
        );

      return "success";
    },
    deleteBasicCocoaStatisticDomesticGrindingTokenized: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const tokenized = jwt.verify(params.tokenizedInput, TOKENIZE);

      const { iat, ...payloadTokenized } = tokenized;

      const found = await context
        .collection("BasicCocoaStatisticDomesticGrindings")
        .findOne({
          _id: payloadTokenized._id,
        });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "BasicCocoaStatisticDomesticGrindings",
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

      await context
        .collection("BasicCocoaStatisticDomesticGrindings")
        .updateOne(
          {
            _id: payloadTokenized._id,
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
  BasicCocoaStatisticDomesticGrinding: {
    localPurchasePeninsula: self =>
      self.localPurchasePeninsula
        ? self.localPurchasePeninsula
        : self.localPurchase
        ? self.localPurchase
        : 0,
    LocalRegion: async (self, params, context) => {
      return await context.collection("Regions").findOne({
        _id: self.regionId,
      });
    },
    production: self => {
      if (self.production) {
        return self.production;
      }
      return {
        cocoaButter: 0,
        cocoaLiquorMass: 0,
        cocoaPowder: 0,
        cocoaCake: 0,
      };
    },
    fob: self => {
      if (self.fob) {
        return self.fob;
      }
      return {
        cocoaButter: 0,
        cocoaLiquorMass: 0,
        cocoaPowder: 0,
        cocoaCake: 0,
      };
    },
    MonthlyLocalSales: self => {
      if (self.monthlyLocalSales) {
        return self.monthlyLocalSales;
      }
      return {
        cocoaButter: 0,
        cocoaLiquorMass: 0,
        cocoaPowder: 0,
        cocoaCake: 0,
      };
    },
    MonthlyExport: self => {
      if (self.monthlyExport) {
        return self.monthlyExport;
      }
      return {
        cocoaButter: 0,
        cocoaLiquorMass: 0,
        cocoaPowder: 0,
        cocoaCake: 0,
      };
    },
  },
};
exports.resolvers = resolvers;
