const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const FlexSearch = require("flexsearch");
const { listCodes } = require("./listcodes");
const resolvers = {
  Query: {
    allEstateCensusSeksyen: async (self, params, context) => {
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
            $not: /^Q003/i,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          censusYear: -1,
        })
        .toArray();
    },
  },
  Mutation: {
    createEstateCensusSeksyen: async (self, params, context) => {
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
      newData["estateId"] = "" + parseInt(newData.estateId);
      if (!newData.value) {
        newData.value = 0;
      }
      const foundEstateInformation = await context
        .collection("EstateInformations")
        .findOne({
          estateId: newData.estateId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });
      if (!foundEstateInformation) {
        throw new Error("Estate Information Not Found");
      }

      const status = await codeValidation(newData, context.collection);

      console.log({ status, newData });
      if (status.message !== "ok") {
        return status;
      }

      const foundExisted = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .findOne({
          estateId: newData.estateId,
          censusYear: newData.censusYear,
          code: newData.code,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Duplicate Code");
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
    updateEstateCensusSeksyen: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .findOne({
          _id: params._id,
        });

      const updatedData = {
        ...found,
        ...params,
      };

      if (!updatedData.value) {
        updatedData.value = 0;
      }

      const status = await codeValidation(updatedData, context.collection);

      if (status.message !== "ok") {
        return status;
      }

      updatedData["estateId"] = "" + parseInt(updatedData.estateId);

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
      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .updateOne(
          {
            _id: params._id,
          },
          {
            $set: {
              ...updatedData,
              _updatedAt: new Date().toISOString(),
            },
          }
        );
      if (status.message !== "ok") {
        return status;
      }
    },
    deleteEstateCensusSeksyen: async (self, params, context) => {
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
          }
        );
      return "ok";
    },
  },
  EstateCensusSeksyen: {
    estateId: (self) => {
      let PREFIX = "00000";
      const estateId = self.estateId.length;
      const res = PREFIX.slice(0, estateId * -1) + self.estateId;
      return res;
    },
    EstateCensusHakMilikPertubuhanAndSeksyenInformation: async (
      self,
      params,
      context
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
  const predefinedCodes = listCodes();

  await collection(
    "EstateCensusHakMilikPertubuhanAndSeksyenValues"
  ).createIndex({
    code: 1,
  });

  await collection(
    "EstateCensusHakMilikPertubuhanAndSeksyenInformations"
  ).createIndex({
    code: 1,
  });

  const foundCodeInfo = await collection(
    "EstateCensusHakMilikPertubuhanAndSeksyenInformations"
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
    if (data.code.includes("K067")) {
      const found = predefinedCodes.previousCodeYears.find(
        (d) => d === data.code
      );

      let getData = null;
      if (found) {
        if (data.code === "K06702") {
          getData = await collection(
            "EstateCensusHakMilikPertubuhanAndSeksyenValues"
          ).findOne({
            code: "K07402",
            estateId: "" + parseInt(data.estateId),
            censusYear: data.censusYear - 1,
            _deletedAt: {
              $exists: false,
            },
          });
        } else {
          getData = await collection(
            "EstateCensusHakMilikPertubuhanAndSeksyenValues"
          ).findOne({
            code: data.code,
            censusYear: data.censusYear - 1,
            _deletedAt: {
              $exists: false,
            },
          });
        }

        if (!getData) {
          return {
            message: data.value !== 0 ? "Invalid Value" : "ok",
            value: 0,
            cvalid1: "",
            cvalid2: "",
            cvalid3: "",
            formulaValue: "",
            cvalid: "",
          };
        }
        console.log({ getData, data });
        return {
          message: data.value !== getData.value ? "Invalid Value" : "ok",
          value: getData.value,
          cvalid1: "",
          cvalid2: "",
          cvalid3: "",
          formulaValue: "",
          cvalid: "",
        };
      }
    } else {
      return {
        message: "ok",
        value: 0,
        cvalid1: "",
        cvalid2: "",
        cvalid3: "",
        formulaValue: "",
        cvalid: "",
      };
    }
  }

  let message = {
    cvalid1: foundCodeInfo?.cvalid1 || "",
    cvalid2: foundCodeInfo?.cvalid2 || "",
    cvalid3: foundCodeInfo?.cvalid3 || "",
    formulaValue: "",
    cvalid: "",
  };

  let listCodeCValid1 = [],
    listCodeCValid2 = [],
    listCodeCValid3 = [];

  let indexedCValid1 = [];

  if (foundCodeInfo.cvalid1) {
    const inputString = foundCodeInfo.cvalid1;
    const delimiterPattern = /([+\-/])/g;
    const result = inputString.split(delimiterPattern);

    const found = predefinedCodes.previousCodeYears.find(
      (d) => d === data.code
    );

    listCodeCValid1 = result.filter(
      (res) => res !== "+" && res !== "-" && res !== "/"
    );

    listCodeCValid1 = await collection(
      "EstateCensusHakMilikPertubuhanAndSeksyenValues"
    )
      .find({
        estateId: "" + parseInt(data.estateId),
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
      let tmp = [];
      if (found) {
        tmp = indexedCValid1.where({
          code: input,
          censusYear:
            data.code === "K06715" ? data.censusYear : data.censusYear - 1,
        });
      } else {
        tmp = indexedCValid1.where({
          code: input,
          censusYear: data.censusYear,
        });
      }
      lists.push({
        operator: input,
        value: tmp.length > 0 ? parseFloat(tmp[0].value) : 0,
        year: tmp.length > 0 ? tmp[0].censusYear : "",
        code: tmp.length > 0 ? tmp[0].code : "",
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

    const found = predefinedCodes.previousCodeYears.find(
      (d) => d === data.code
    );

    listCodeCValid2 = result.filter(
      (res) => res !== "+" && res !== "-" && res !== "/"
    );

    listCodeCValid2 = await collection(
      "EstateCensusHakMilikPertubuhanAndSeksyenValues"
    )
      .find({
        estateId: "" + parseInt(data.estateId),
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
      let tmp = [];
      if (found) {
        tmp = indexedCValid2.where({
          code: input,
          censusYear: data.censusYear - 1,
        });
      } else {
        tmp = indexedCValid2.where({
          code: input,
          censusYear: data.censusYear,
        });
      }

      lists.push({
        operator: input,
        value: tmp.length > 0 ? parseFloat(tmp[0].value) : 0,
        year: tmp.length > 0 ? tmp[0].censusYear : "",
        code: tmp.length > 0 ? tmp[0].code : "",
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

    const found = predefinedCodes.previousCodeYears.find(
      (d) => d === data.code
    );

    listCodeCValid3 = result.filter(
      (res) => res !== "+" && res !== "-" && res !== "/"
    );

    listCodeCValid3 = await collection(
      "EstateCensusHakMilikPertubuhanAndSeksyenValues"
    )
      .find({
        estateId: "" + parseInt(data.estateId),
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
      let tmp = [];
      if (found) {
        tmp = indexedCValid3.where({
          code: input,
          censusYear: data.censusYear - 1,
        });
      } else {
        tmp = indexedCValid3.where({
          code: input,
          censusYear: data.censusYear,
        });
      }

      lists.push({
        operator: input,
        value: tmp.length > 0 ? parseFloat(tmp[0].value) : 0,
        year: tmp.length > 0 ? tmp[0].censusYear : "",
        code: tmp.length > 0 ? tmp[0].code : "",
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
      cvalid: foundCodeInfo.cvalid3,
      formulaValue: formulaValueArrays.join(""),
      message: data.value !== total ? "Invalid value!" : "ok",
      value: total,
    };
  }

  console.log({ message });

  //###### OLD ########
  // let lists = [];

  // if (foundCodeInfo.cvalid1) {
  //   const inputString = foundCodeInfo.cvalid1;
  //   const delimiterPattern = /([+\-/])/g;
  //   const result = inputString.split(delimiterPattern);

  //   for (const input of result) {
  //     const tmp = await collection(
  //       "EstateCensusHakMilikPertubuhanAndSeksyenValues",
  //     )
  //       .find({
  //         code: input,
  //         estateId: data.estateId,
  //         ...NOT_DELETED_DOCUMENT_QUERY,
  //       })
  //       .sort({
  //         censusYear: -1,
  //       })
  //       .limit(1)
  //       .toArray();

  //     lists.push({
  //       operator: input,
  //       value: tmp.length > 0 ? parseFloat(tmp[0].value) : 0,
  //     });
  //   }

  //   let total = parseFloat(lists[0].value);
  //   for (let i = 1; i < lists.length; i += 2) {
  //     const operator = lists[i].operator;
  //     const operand = parseFloat(lists[i + 1].value);

  //     if (operator === "+") {
  //       total += operand;
  //     } else if (operator === "-") {
  //       total -= operand;
  //     } else if (operator === "/") {
  //       total /= operand;
  //     }
  //   }
  //   if (total > 0) {
  //     total = parseFloat(parseFloat(total).toFixed(2));
  //   }

  //   message = {
  //     ...message,
  //     message: data.value !== total ? "Invalid value!" : "ok",
  //     value: total,
  //   };
  // }

  // lists = [];

  // if (foundCodeInfo.cvalid2) {
  //   const inputString = foundCodeInfo.cvalid2;
  //   const delimiterPattern = /([+\-/])/g;
  //   const result = inputString.split(delimiterPattern);

  //   for (const input of result) {
  //     const tmp = await collection(
  //       "EstateCensusHakMilikPertubuhanAndSeksyenValues",
  //     )
  //       .find({
  //         code: input,
  //         estateId: data.estateId,
  //         ...NOT_DELETED_DOCUMENT_QUERY,
  //       })
  //       .sort({
  //         censusYear: -1,
  //       })
  //       .limit(1)
  //       .toArray();

  //     lists.push({
  //       operator: input,
  //       value: tmp.length > 0 ? parseFloat(tmp[0].value) : 0,
  //     });
  //   }

  //   let total = parseFloat(lists[0].value);
  //   for (let i = 1; i < lists.length; i += 2) {
  //     const operator = lists[i].operator;
  //     const operand = parseFloat(lists[i + 1].value);

  //     if (operator === "+") {
  //       total += operand;
  //     } else if (operator === "-") {
  //       total -= operand;
  //     } else if (operator === "/") {
  //       total /= operand;
  //     }
  //   }
  //   if (total > 0) {
  //     total = parseFloat(parseFloat(total).toFixed(2));
  //   }

  //   message = {
  //     ...message,
  //     message: data.value !== total ? "Invalid value!" : "ok",
  //     value: total,
  //   };
  // }

  // lists = [];
  // if (foundCodeInfo.cvalid3) {
  //   const inputString = foundCodeInfo.cvalid3;
  //   const delimiterPattern = /([+\-/])/g;
  //   const result = inputString.split(delimiterPattern);

  //   for (const input of result) {
  //     const tmp = await collection(
  //       "EstateCensusHakMilikPertubuhanAndSeksyenValues",
  //     )
  //       .find({
  //         code: input,
  //         estateId: data.estateId,
  //         ...NOT_DELETED_DOCUMENT_QUERY,
  //       })
  //       .sort({
  //         censusYear: -1,
  //       })
  //       .limit(1)
  //       .toArray();

  //     lists.push({
  //       operator: input,
  //       value: tmp.length > 0 ? parseFloat(tmp[0].value) : 0,
  //     });
  //   }

  //   let total = parseFloat(lists[0].value);
  //   for (let i = 1; i < lists.length; i += 2) {
  //     const operator = lists[i].operator;
  //     const operand = parseFloat(lists[i + 1].value);

  //     if (operator === "+") {
  //       total += operand;
  //     } else if (operator === "-") {
  //       total -= operand;
  //     } else if (operator === "/") {
  //       total /= operand;
  //     }
  //   }

  //   if (total > 0) {
  //     total = parseFloat(parseFloat(total).toFixed(2));
  //   }

  //   message = {
  //     ...message,
  //     message: data.value !== total ? "Invalid value!" : "ok",
  //     value: total,
  //   };
  // }

  return message;
};
