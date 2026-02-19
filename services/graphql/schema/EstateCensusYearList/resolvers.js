const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const resolvers = {
  Query: {
    allEstateCensusYearList: async (self, params, context) => {
      return await context
        .collection("EstateCensusYearLists")
        .find({
          year: params.years
            ? {
                $in: params.years.map(year => parseInt(year)),
              }
            : parseInt(params.year || dayjs().format("YYYY")),
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          year: -1,
        })
        .toArray();
    },
    allEstateCensusYearListByEstate: async (self, params, context) => {
      return await context
        .collection("EstateCensusYearLists")
        .find({
          estateId: params.estateId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          year: -1,
        })
        .toArray();
    },
  },
  Mutation: {
    createEstateCensusYearList: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      let years = [];
      for (let i = 0; i <= 10; i++) {
        years.push(params.year - i);
      }

      console.log({ years });

      const foundEstate = await context
        .collection("EstateInformations")
        .findOne({
          estateId: params.estateId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (!foundEstate) {
        throw new Error("Estate Information Not Found!");
      }

      for (const year of years) {
        let newData = {
          _id: uuidv4(),
          ...params,
          year,
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
        };

        const foundExisted = await context
          .collection("EstateCensusYearLists")
          .findOne({
            estateId: newData.estateId,
            year: newData.year,
            ...NOT_DELETED_DOCUMENT_QUERY,
          });

        console.log({ foundExisted });
        if (foundExisted) {
          console.log(
            `Existed.. Skipped for Estate ID ${newData.estateId} Year ${year}`,
          );
        } else {
          const payload = {
            _id: uuidv4(),
            affectedCollectionName: "EstateCensusYearLists",
            affectedDocumentId: newData._id,
            dataBeforeChanges: newData,
            dataAfterChanges: newData,
            modifiedBy: context.activeSession.User,
            timeStamp: new Date().toISOString(),
            action: "CREATE",
          };
          await context.collection("ActivityLogs").insertOne(payload);

          await context.collection("EstateCensusYearLists").insertOne(newData);
        }
      }

      return "ok";
    },
    updateEstateCensusYearList: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const foundEstate = await context
        .collection("EstateInformations")
        .findOne({
          estateId: params.estateId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (!foundEstate) {
        throw new Error("Estate Information Not Found!");
      }

      const found = await context.collection("EstateCensusYearLists").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateCensusYearLists",
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
      await context.collection("EstateCensusYearLists").updateOne(
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
      return "ok";
    },
    deleteEstateCensusYearList: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("EstateCensusYearLists").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateCensusYearLists",
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

      await context.collection("EstateCensusYearLists").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );
      return "ok";
    },
  },
  EstateCensusYearList: {
    estateId: self => {
      let PREFIX = "00000";
      const estateId = self.estateId.length;
      const res = PREFIX.slice(0, estateId * -1) + self.estateId;
      return res;
    },
    EstateInformation: async (self, params, context) => {
      return await context.collection("EstateInformations").findOne({
        estateId: self.estateId,
        ...NOT_DELETED_DOCUMENT_QUERY,
      });
    },
  },
};
exports.resolvers = resolvers;
