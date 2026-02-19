const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const FlexSearch = require("flexsearch");

const resolvers = {
  Query: {
    allEstateCensusHakMilikPertubuhan: async (self, params, context) => {
      await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .createIndex({
          estateInformationId: 1,
          censusYear: 1,
        });

      return await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .find({
          ...params,
          code: {
            $regex: /^Q003/i,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          // censusYear: -1,
          code: 1,
        })
        .toArray();
    },
  },
  Mutation: {
    createEstateCensusHakMilikPertubuhan: async (self, params, context) => {
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
      const foundEstateInformation = await context
        .collection("EstateInformations")
        .findOne({
          estateId: newData.estateId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });
      if (!foundEstateInformation) {
        throw new Error("Estate Information Not Found");
      }
      const foundExisted = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .findOne({
          estateId: newData.estateId,
          censusYear: newData.censusYear,
          code: params.code,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Dupliacte Estate ID & Census Year");
      }

      const status = await codeValidation(newData, context.collection);

      if (status.message !== "ok") {
        return status;
      }

      newData["estateInformationId"] = foundEstateInformation._id;

      const payload = {
        _id: uuidv4(),
        affectedCollectionName:
          "EstateCensusHakMilikPertubuhanAndSeksyenValues",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .insertOne(newData);
      return status;
    },
    updateEstateCensusHakMilikPertubuhan: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .findOne({
          _id: params._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName:
          "EstateCensusHakMilikPertubuhanAndSeksyenValues",
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

      const updatedData = {
        ...found,
        ...params,
      };

      const status = await codeValidation(updatedData, context.collection);
      if (status.message !== "ok") {
        return status;
      }
      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
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
      return status;
    },
    deleteEstateCensusHakMilikPertubuhan: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .findOne({
          _id: params._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName:
          "EstateCensusHakMilikPertubuhanAndSeksyenValues",
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
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
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
      return "ok";
    },
  },
  EstateCensusHakMilikPertubuhan: {
    estateId: self => {
      let PREFIX = "00000";
      const estateId = self.estateId.length;
      const res = PREFIX.slice(0, estateId * -1) + self.estateId;
      return res;
    },
    EstateCensusHakMilikPertubuhanAndSeksyenInformation: async (
      self,
      params,
      context,
    ) => {
      return await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenInformations")
        .findOne({
          code: self.code,
        });
    },
  },
};
exports.resolvers = resolvers;

const codeValidation = async (data, collection) => {
  await collection(
    "EstateCensusHakMilikPertubuhanAndSeksyenValues",
  ).createIndex({
    code: 1,
  });

  await collection(
    "EstateCensusHakMilikPertubuhanAndSeksyenInformations",
  ).createIndex({
    code: 1,
  });

  // console.log({ data });
  const foundCodeInfo = await collection(
    "EstateCensusHakMilikPertubuhanAndSeksyenInformations",
  ).findOne({
    code: data.code,
    ...NOT_DELETED_DOCUMENT_QUERY,
  });

  if (!foundCodeInfo) {
    return {
      message: "Code not found!",
      value: 0,
    };
  }

  if (
    !foundCodeInfo.cvalid1 &&
    !foundCodeInfo.cvalid2 &&
    !foundCodeInfo.cvalid3
  ) {
    return {
      message: "ok",
      value: 0,
      cvalid1: "",
      cvalid2: "",
      cvalid3: "",
      formulaValue: "",
    };
  }

  let message = {
    cvalid1: foundCodeInfo?.cvalid1 || "",
    cvalid2: foundCodeInfo?.cvalid2 || "",
    cvalid3: foundCodeInfo?.cvalid3 || "",
    formulaValue: "",
  };

  let listCodeCValid1 = [],
    listCodeCValid2 = [],
    listCodeCValid3 = [];

  let indexedCValid1 = [];
  if (foundCodeInfo.cvalid1) {
    const inputString = foundCodeInfo.cvalid1;
    const delimiterPattern = /([+\-/])/g;
    const result = inputString.split(delimiterPattern);

    listCodeCValid1 = result.filter(
      res => res !== "+" && res !== "-" && res !== "/",
    );

    listCodeCValid1 = await collection(
      "EstateCensusHakMilikPertubuhanAndSeksyenValues",
    )
      .find({
        estateId: "" + parseInt(data.estateId),
        censusYear: data.censusYear,
        code: {
          $in: listCodeCValid1,
        },
        _deletedAt: {
          $exists: false,
        },
      })
      .sort({ censusYear: -1 })
      .toArray();

    indexedCValid1 = new FlexSearch({
      tokenize: "strict",
      doc: {
        id: "_id",
        field: ["estateId", "censusYear", "code"],
      },
    });
    indexedCValid1.add(listCodeCValid1);

    let lists = [];

    for (const input of result) {
      const tmp = indexedCValid1.where({
        code: input,
        censusYear: data.censusYear,
      });

      lists.push({
        operator: input,
        value: tmp.length > 0 ? parseFloat(tmp[tmp.length - 1].value) : 0,
        year: tmp.length > 0 ? tmp[tmp.length - 1].censusYear : "",
        code: tmp.length > 0 ? tmp[tmp.length - 1].code : "",
      });
    }

    let total = parseFloat(lists[0].value);
    let formulaValueArrays = ["" + total];
    for (let i = 1; i < lists.length; i += 2) {
      const operator = lists[i].operator;
      const operand = parseFloat(lists[i + 1].value);

      if (operator === "+") {
        formulaValueArrays.push("" + operator, "" + operand);
        total += operand;
      } else if (operator === "-") {
        total -= operand;
      } else if (operator === "/") {
        total /= operand;
      }
    }
    if (total > 0) {
      total = parseFloat(parseFloat(total).toFixed(2));
    }

    message = {
      ...message,
      cvalid: foundCodeInfo.cvalid1,
      formulaValue: formulaValueArrays.join(""),
      message: data.value !== total ? "Invalid value!" : "ok",
      value: total,
    };
  }

  let indexedCValid2 = [];
  if (foundCodeInfo.cvalid2) {
    const inputString = foundCodeInfo.cvalid2;
    const delimiterPattern = /([+\-/])/g;
    const result = inputString.split(delimiterPattern);

    listCodeCValid2 = result.filter(
      res => res !== "+" && res !== "-" && res !== "/",
    );

    listCodeCValid2 = await collection(
      "EstateCensusHakMilikPertubuhanAndSeksyenValues",
    )
      .find({
        estateId: "" + parseInt(data.estateId),
        censusYear: data.censusYear,
        code: {
          $in: listCodeCValid2,
        },
        _deletedAt: {
          $exists: false,
        },
      })
      .sort({ censusYear: -1 })
      .toArray();

    indexedCValid2 = new FlexSearch({
      tokenize: "strict",
      doc: {
        id: "_id",
        field: ["estateId", "censusYear", "code"],
      },
    });
    indexedCValid2.add(listCodeCValid2);

    let lists = [];

    for (const input of result) {
      const tmp = indexedCValid2.where({
        code: input,
        censusYear: data.censusYear,
      });

      lists.push({
        operator: input,
        value: tmp.length > 0 ? parseFloat(tmp[tmp.length - 1].value) : 0,
        year: tmp.length > 0 ? tmp[tmp.length - 1].censusYear : "",
        code: tmp.length > 0 ? tmp[tmp.length - 1].code : "",
      });
    }

    let total = parseFloat(lists[0].value);
    let formulaValueArrays = ["" + total];
    for (let i = 1; i < lists.length; i += 2) {
      const operator = lists[i].operator;
      const operand = parseFloat(lists[i + 1].value);

      if (operator === "+") {
        formulaValueArrays.push("" + operator, "" + operand);
        total += operand;
      } else if (operator === "-") {
        total -= operand;
      } else if (operator === "/") {
        total /= operand;
      }
    }
    if (total > 0) {
      total = parseFloat(parseFloat(total).toFixed(2));
    }

    message = {
      ...message,
      cvalid: foundCodeInfo.cvalid2,
      formulaValue: formulaValueArrays.join(""),
      message: data.value !== total ? "Invalid value!" : "ok",
      value: total,
    };
  }

  let indexedCValid3 = [];
  if (foundCodeInfo.cvalid3) {
    const inputString = foundCodeInfo.cvalid3;
    const delimiterPattern = /([+\-/])/g;
    const result = inputString.split(delimiterPattern);

    listCodeCValid3 = result.filter(
      res => res !== "+" && res !== "-" && res !== "/",
    );

    listCodeCValid3 = await collection(
      "EstateCensusHakMilikPertubuhanAndSeksyenValues",
    )
      .find({
        estateId: "" + parseInt(data.estateId),
        censusYear: data.censusYear,
        code: {
          $in: listCodeCValid3,
        },
        _deletedAt: {
          $exists: false,
        },
      })
      .sort({ censusYear: -1 })
      .toArray();

    indexedCValid3 = new FlexSearch({
      tokenize: "strict",
      doc: {
        id: "_id",
        field: ["estateId", "censusYear", "code"],
      },
    });
    indexedCValid3.add(listCodeCValid3);

    let lists = [];

    for (const input of result) {
      const tmp = indexedCValid3.where({
        code: input,
        censusYear: data.censusYear,
      });

      lists.push({
        operator: input,
        value: tmp.length > 0 ? parseFloat(tmp[tmp.length - 1].value) : 0,
        year: tmp.length > 0 ? tmp[tmp.length - 1].censusYear : "",
        code: tmp.length > 0 ? tmp[tmp.length - 1].code : "",
      });
    }

    let total = parseFloat(lists[0].value);
    let formulaValueArrays = ["" + total];
    for (let i = 1; i < lists.length; i += 3) {
      const operator = lists[i].operator;
      const operand = parseFloat(lists[i + 1].value);

      if (operator === "+") {
        formulaValueArrays.push("" + operator, "" + operand);
        total += operand;
      } else if (operator === "-") {
        total -= operand;
      } else if (operator === "/") {
        total /= operand;
      }
    }
    if (total > 0) {
      total = parseFloat(parseFloat(total).toFixed(3));
    }

    message = {
      ...message,
      cvalid: foundCodeInfo.cvalid3,
      formulaValue: formulaValueArrays.join(""),
      message: data.value !== total ? "Invalid value!" : "ok",
      value: total,
    };
  }

  if (foundCodeInfo.code === "Q00338") {
    if (data.value !== 100) {
      message = {
        ...message,
        message: `Exceeding value for code ${foundCodeInfo.code}. Value must be 100`,
      };
    }
  }

  return message;
};
