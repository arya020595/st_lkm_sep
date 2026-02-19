const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const parseJson = require("json-parse-even-better-errors");

const resolvers = {
  Query: {
    allEstateCensusHakMilikPertubuhanAndSeksyenInformation: async (
      self,
      params,
      context,
    ) => {
      await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenInformations")
        .createIndex({
          code: 1,
        });

      return await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenInformations")
        .find({
          ...params,
          code: {
            $regex: /^Q003/i,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          censusYear: -1,
        })
        .toArray();
    },
    paginatedEstateCensusHakMilikPertubuhanAndSeksyenInformation: async (
      self,
      params,
      context,
    ) => {
      let query = {};
      if (params.filters) {
        try {
          let filters = parseJson(params.filters);
          // console.log({ filters });
          for (const filter of filters) {
            query[filter.id] = {
              $regex: filter.value,
              $options: "si",
            };
          }
        } catch (err) {
          console.warn(err);
        }
      }

      let results = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenInformations")
        .find({
          ...query,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          code: 1,
        })
        .skip(params.pageIndex || 0)
        .limit(params.pageSize || 10)
        .toArray();
      // console.log({ results, query });
      return results;
    },
    countValidationCode: async (self, params, context) => {
      return await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenInformations")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        // .sort({
        //   _createdAt: -1,
        // })
        // .limit(100)
        // .toArray();
        .count();
    },
  },
  Mutation: {
    estateCensusHakMilikAndSeksyenInfoByCode: async (self, params, context) => {
      await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenInformations")
        .createIndex({
          code: 1,
        });

      let foundSeksyenInfo = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenInformations")
        .findOne({
          code: params.code,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (!foundSeksyenInfo) {
        throw new Error("Invalid Codes");
      }

      if (foundSeksyenInfo.rawJsonRowData) {
        const json = JSON.parse(foundSeksyenInfo.rawJsonRowData);

        if (json.lstate && json.lstate === "1") {
          foundSeksyenInfo = {
            ...foundSeksyenInfo,
            lstate: true,
          };
        } else {
          foundSeksyenInfo = {
            ...foundSeksyenInfo,
            lstate: false,
          };
        }
      }

      return foundSeksyenInfo;
      // let cvalid1 = null,
      //   cvalid2 = null,
      //   cvalid3 = null;

      // let isValid = false;

      // if (foundSeksyenInfo.cvalid1) {
      //   const inputString = foundSeksyenInfo.cvalid1;
      //   const delimiterPattern = /([+-])/g;
      //   const result = inputString.split(delimiterPattern);

      //   let total = 0;

      //   let previous = 0;
      //   for (const input of result) {
      //     if (input !== "+" && input !== "-") {
      //       const tmp = await context
      //         .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
      //         .findOne({
      //           code: input,
      //           censusYear: params.year,
      //           estateInformationId: params.estateId,
      //           ...NOT_DELETED_DOCUMENT_QUERY,
      //         });

      //       if (!tmp) {
      //         previous = 0;
      //       } else {
      //         previous = tmp.value;
      //       }
      //     }

      //     // console.log({ total, found, input });

      //     if (input === "+") {
      //       total = total + previous;
      //     }

      //     if (input === "-") {
      //       total = total - previous;
      //     }
      //   }
      //   cvalid1 = total;
      // }

      // if (foundSeksyenInfo.cvalid2) {
      //   const inputString = foundSeksyenInfo.cvalid2;
      //   const delimiterPattern = /([+-])/g;
      //   const result = inputString.split(delimiterPattern);

      //   let total = 0;

      //   let previous = 0;
      //   for (const input of result) {
      //     if (input !== "+" && input !== "-") {
      //       const tmp = await context
      //         .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
      //         .findOne({
      //           code: input,
      //           censusYear: params.year,
      //           estateInformationId: params.estateId,
      //           ...NOT_DELETED_DOCUMENT_QUERY,
      //         });

      //       if (!tmp) {
      //         previous = 0;
      //       } else {
      //         previous = tmp.value;
      //       }
      //     }

      //     // console.log({ total, found, input });

      //     if (input === "+") {
      //       total = total + previous;
      //     }

      //     if (input === "-") {
      //       total = total - previous;
      //     }
      //   }
      //   cvalid2 = total;
      // }

      // if (foundSeksyenInfo.cvalid3) {
      //   const inputString = foundSeksyenInfo.cvalid3;
      //   const delimiterPattern = /([+-])/g;
      //   const result = inputString.split(delimiterPattern);

      //   let total = 0;

      //   let previous = 0;
      //   for (const input of result) {
      //     if (input !== "+" && input !== "-") {
      //       const tmp = await context
      //         .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
      //         .findOne({
      //           code: input,
      //           censusYear: params.year,
      //           estateInformationId: params.estateId,
      //           ...NOT_DELETED_DOCUMENT_QUERY,
      //         });

      //       if (!tmp) {
      //         previous = 0;
      //       } else {
      //         previous = tmp.value;
      //       }
      //     }

      //     // console.log({ total, found, input });

      //     if (input === "+") {
      //       total = total + previous;
      //     }

      //     if (input === "-") {
      //       total = total - previous;
      //     }
      //   }
      //   cvalid3 = total;
      // }

      // if (cvalid1) {
      //   if (cvalid1 === params.value) {
      //     isValid = true;
      //   }
      // }

      // if (cvalid2) {
      //   if (cvalid2 === params.value) {
      //     isValid = true;
      //   }
      // }

      // if (cvalid3) {
      //   if (cvalid3 === params.value) {
      //     isValid = true;
      //   }
      // }

      // // console.log({ cvalid1, cvalid2, cvalid3 });
      // if (!cvalid1 && !cvalid2 && !cvalid3) {
      //   isValid = true;
      // }
      // if (isValid) {
      //   return foundSeksyenInfo;
      // } else {
      //   return {
      //     _id: "ERR",
      //     code: "",
      //     description: "",
      //     value: 0,
      //   };
      // }

      // if (!foundInformation) {
      //   // throw new Error("Code not foundInformation in database");

      //   const foundEstateCensusCodes = await context
      //     .collection("EstateCensusCodes")
      //     .findOne({
      //       ...params,
      //       ...NOT_DELETED_DOCUMENT_QUERY,
      //     });

      //   if (!foundEstateCensusCodes) {
      //     throw new Error("Code not in database");
      //   }
      //   return foundEstateCensusCodes;
      // }
      // return foundInformation;
    },
    createEstateCensusHakMilikPertubuhanAndSeksyenCode: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      let newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenInformations")
        .findOne({
          code: newData.code,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Dupliacte Code");
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName:
          "EstateCensusHakMilikPertubuhanAndSeksyenInformations",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenInformations")
        .insertOne(newData);

      return "ok";
    },
    updateEstateCensusHakMilikPertubuhanAndSeksyenCode: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenInformations")
        .findOne({
          _id: params._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName:
          "EstateCensusHakMilikPertubuhanAndSeksyenInformations",
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
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenInformations")
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

      return "ok";
    },
    deleteEstateCensusHakMilikPertubuhanAndSeksyenCode: async (
      self,
      params,
      context,
    ) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenInformations")
        .findOne({
          _id: params._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName:
          "EstateCensusHakMilikPertubuhanAndSeksyenInformations",
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

      await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenInformations")
        .updateOne(
          {
            _id: params._id,
          },
          {
            $set: {
              ...params,
              _deletedAt: new Date().toISOString(),
            },
          },
        );

      return "ok";
    },
  },
};
exports.resolvers = resolvers;
