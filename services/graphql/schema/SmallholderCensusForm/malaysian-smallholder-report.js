const { v4: uuidV4 } = require("uuid");
const { assertValidSession } = require("../../authentication");
const {
  createPdf,
  renderFooter,
  renderHeader,
  defaultPageMargins,
  defaultTableLayout,
  noBorderTableLayout,
} = require("../../pdf");
const dayjs = require("dayjs");
require("dayjs/locale/ms-my");
require("dayjs/locale/en");
dayjs.locale("en");
const localeData = require("dayjs/plugin/localeData");
dayjs.extend(localeData);
const weekOfYear = require("dayjs/plugin/weekOfYear");
dayjs.extend(weekOfYear);
const lodash = require("lodash");
const FlexSearch = require("flexsearch");

const formatNumber = (num, c = 0, d = ",", t = ",", fallback = "-") => {
  // if (!num && fallback) return fallback;

  c = isNaN((c = Math.abs(c))) ? 2 : c;
  d = d == undefined ? "." : d;
  t = t == undefined ? "," : t;
  var n = num,
    s = n < 0 ? "-" : "",
    i = String(parseInt((n = Math.abs(Number(n) || 0).toFixed(c)))),
    j = (j = i.length) > 3 ? j % 3 : 0;
  return (
    s +
    (j ? i.substr(0, j) + t : "") +
    i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + t) +
    (c
      ? d +
        Math.abs(n - i)
          .toFixed(c)
          .slice(2)
      : "")
  );
};

const generateMalaysianSmallholderReport = async (self, params, context) => {
  assertValidSession(context.activeSession);
  // console.log("generateMalaysianSmallholderReport", params);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------

  let allEstateCensusStateCodes = [];
  let allEstateCensusStateDistricts = [];
  if (!params.segment) {
    allEstateCensusStateCodes = await context
      .collection("EstateCensusStateCodes")
      .find({
        _deletedAt: {
          $exists: false,
        },
      })
      .toArray();
    // console.log({ allEstateCensusStateCodes });
  } else if (params.segment === "Semenanjung") {
    allEstateCensusStateCodes = await context
      .collection("EstateCensusStateCodes")
      .find({
        _deletedAt: {
          $exists: false,
        },
      })
      .toArray();
    allEstateCensusStateCodes = allEstateCensusStateCodes.filter(i => {
      const stateCode = parseInt(i.stateCode);
      return stateCode <= 11;
    });
    // console.log({ allEstateCensusStateCodes });
  } else if (params.segment === "Sabah") {
    allEstateCensusStateCodes = await context
      .collection("EstateCensusStateCodes")
      .find({
        stateCode: "12", // Sabah
        _deletedAt: {
          $exists: false,
        },
      })
      .toArray();
    allEstateCensusStateDistricts = await context
      .collection("EstateCensusStateDistricts")
      .find({
        stateCode: "12", // Sabah
        _deletedAt: {
          $exists: false,
        },
      })
      .sort({
        districtCode: 1,
      })
      .toArray();
  } else if (params.segment === "Sarawak") {
    allEstateCensusStateCodes = await context
      .collection("EstateCensusStateCodes")
      .find({
        stateCode: "13", // Sarawak
        _deletedAt: {
          $exists: false,
        },
      })
      .toArray();
    allEstateCensusStateDistricts = await context
      .collection("EstateCensusStateDistricts")
      .find({
        stateCode: "13", // Sarawak
        _deletedAt: {
          $exists: false,
        },
      })
      .sort({
        districtCode: 1,
      })
      .toArray();
  }

  // ########################################################################
  // ------------------------------------------------------------------------
  const questionQueries = [
    {
      code: "B0401",
      questionCodeId: "04",
    },
    {
      code: "B0501",
      questionCodeId: "05",
    },
    {
      code: "I0101",
      questionCodeId: "01",
    },
    //
    {
      code: "B0402",
      questionCodeId: "04",
    },
    {
      code: "B0502",
      questionCodeId: "05",
    },
  ];
  const questions = {};
  for (const query of questionQueries) {
    const foundQuestion = await context
      .collection("SmallholderCensusQuestions")
      .findOne({
        ...query,
      });
    if (!foundQuestion) continue;
    const foundQuestionId = foundQuestion._id;
    questions[foundQuestionId] = foundQuestion;
  }
  const questionIds = Object.keys(questions);

  await context.collection("SmallholderCensusQuestionnaireData").createIndex({
    questionIds: 1,
    year: 1,
  });
  const allSmallholderCensusQuestionnaireData = !questionIds.length
    ? []
    : await context
        .collection("SmallholderCensusQuestionnaireData")
        .find({
          questionIds: {
            $in: questionIds,
          },
          year: String(params.year),
        })
        .toArray();
  // console.log(
  //   "allSmallholderCensusQuestionnaireData",
  //   allSmallholderCensusQuestionnaireData.length,
  //   questionIds,
  //   // params,
  // );

  let allValues = [];
  for (const item of allSmallholderCensusQuestionnaireData) {
    for (const key in item.data) {
      let value = parseFloat(item.data[key] || "0");
      const question = questions[key];
      allValues.push({
        _id: uuidV4(),
        questionId: key,
        year: parseInt(item.year),
        value,
        code: question?.code || "",
        stateName: item.smallholder.stateName,
        stateCode: item.smallholder.stateCode,
        districtName: item.smallholder.districtName,
        districtCode: item.smallholder.districtCode,
        localRegionId: item.localRegionId,
        smallholderId: item.smallholderId,
      });
    }
  }
  // console.log({ allValues });
  let indexedValues = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: [
        "code",
        "stateName",
        "stateCode",
        "districtName",
        "districtCode",
        "year",
      ],
    },
  });
  indexedValues.add(allValues);

  // ########################################################################
  // ------------------------------------------------------------------------

  const REPORT_SPECS = {
    "Jadual 1a": {
      TITLE: `Jadual 1a: Perangkaan Utama Pekebun Kecil Koko di ${
        !params.segment
          ? "Malaysia"
          : params.segment === "Semenanjung"
          ? "Semenanjung Malaysia"
          : params.segment === "Sabah"
          ? "Sabah"
          : params.segment === "Sarawak"
          ? "Sarawak"
          : ""
      }`,
      SUBTITLE: ``,
      QUERIES: {},
      // BASE_FONT_SIZE: 10,
      PAGE_ORIENTATION: "portrait",
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      RESOLVE_ROWS: async () => {
        if (!params.segment) {
          allEstateCensusStateCodes = await context
            .collection("EstateCensusStateCodes")
            .find({
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          return allEstateCensusStateCodes;
        } else if (params.segment === "Semenanjung") {
          allEstateCensusStateCodes = await context
            .collection("EstateCensusStateCodes")
            .find({
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          allEstateCensusStateCodes = allEstateCensusStateCodes.filter(i => {
            const stateCode = parseInt(i.stateCode);
            return stateCode <= 11;
          });
          return allEstateCensusStateCodes;
        } else if (params.segment === "Sabah") {
          allEstateCensusStateCodes = await context
            .collection("EstateCensusStateCodes")
            .find({
              stateCode: "12", // Sabah
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: "12", // Sabah
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          return allEstateCensusStateDistricts;
        } else if (params.segment === "Sarawak") {
          allEstateCensusStateCodes = await context
            .collection("EstateCensusStateCodes")
            .find({
              stateCode: "13", // Sarawak
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: "13", // Sarawak
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          return allEstateCensusStateDistricts;
        }
      },
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            valueAlignment: "center",
          },
          {
            colSpan: 4,
            text: "Maklumat Tanaman Koko",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0401", "B0501"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0401", "B0501"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Bil. Pekebun",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            rowSpan: 3,
            text: "Jumlah Pekebun\n(Bil)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            rowSpan: 3,
            text: "Jumlah Keluasan\n(ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Aktif",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0401", "B0501"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0401", "B0501"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Terbiar",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Jumlah Pekebun\n(Bil)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Jumlah Keluasan\n(ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? {
                    text: context.row.districtName,
                    value: context.row.districtName,
                  }
                : {
                    text: context.row.stateName,
                    value: context.row.stateName,
                  },
            valueAlignment: "center",
          },
          {
            text: "Bil. Pekebun",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0401", "B0501"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" || params.segment === "Sarawak"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                let sumValues = foundValues.reduce((sumValues, item) => {
                  if (item.value > 0) {
                    if (!allSmallholderIds[item.smallholderId]) {
                      allSmallholderIds[item.smallholderId] = [];
                    }
                    allSmallholderIds[item.smallholderId].push(columnCode);
                  }
                  return sumValues + item.value;
                }, 0);

                sum += sumValues;
                // if (sumValues > 0) {
                //   console.log({
                //     columnCode,
                //     stateName: context.row.stateName,
                //     sumValues,
                //     sum,
                //     countFoundValues: foundValues.length,
                //   });
                // }
              }

              for (const key in allSmallholderIds) {
                if (allSmallholderIds[key].length < columnCodes) {
                  delete allSmallholderIds[key];
                }
              }
              allSmallholderIds = Object.keys(allSmallholderIds);
              let value = allSmallholderIds.length;
              // let value = Math.round(sum);

              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0401", "B0501"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" || params.segment === "Sarawak"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                let sumValues = foundValues.reduce((sumValues, item) => {
                  if (item.value > 0) {
                    if (!allSmallholderIds[item.smallholderId]) {
                      allSmallholderIds[item.smallholderId] = [];
                    }
                    allSmallholderIds[item.smallholderId].push(columnCode);
                  }
                  return sumValues + item.value;
                }, 0);

                sum += sumValues;
                // if (sumValues > 0) {
                //   console.log({
                //     columnCode,
                //     stateName: context.row.stateName,
                //     sumValues,
                //     sum,
                //     countFoundValues: foundValues.length,
                //   });
                // }
              }

              // for (const key in allSmallholderIds) {
              //   if (allSmallholderIds[key].length < columnCodes) {
              //     delete allSmallholderIds[key];
              //   }
              // }
              // allSmallholderIds = Object.keys(allSmallholderIds);
              // let value = allSmallholderIds.length;
              let value = Math.round(sum);

              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Bil. Pekebun",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" || params.segment === "Sarawak"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                let sumValues = foundValues.reduce((sumValues, item) => {
                  if (item.value > 0) {
                    if (!allSmallholderIds[item.smallholderId]) {
                      allSmallholderIds[item.smallholderId] = [];
                    }
                    allSmallholderIds[item.smallholderId].push(columnCode);
                  }
                  return sumValues + item.value;
                }, 0);

                sum += sumValues;
                // if (sumValues > 0) {
                //   console.log({
                //     columnCode,
                //     stateName: context.row.stateName,
                //     sumValues,
                //     sum,
                //     countFoundValues: foundValues.length,
                //   });
                // }
              }

              for (const key in allSmallholderIds) {
                if (allSmallholderIds[key].length < columnCodes) {
                  delete allSmallholderIds[key];
                }
              }
              allSmallholderIds = Object.keys(allSmallholderIds);
              let value = allSmallholderIds.length;
              // let value = Math.round(sum);

              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" || params.segment === "Sarawak"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                let sumValues = foundValues.reduce((sumValues, item) => {
                  if (item.value > 0) {
                    if (!allSmallholderIds[item.smallholderId]) {
                      allSmallholderIds[item.smallholderId] = [];
                    }
                    allSmallholderIds[item.smallholderId].push(columnCode);
                  }
                  return sumValues + item.value;
                }, 0);

                sum += sumValues;
                // if (sumValues > 0) {
                //   console.log({
                //     columnCode,
                //     stateName: context.row.stateName,
                //     sumValues,
                //     sum,
                //     countFoundValues: foundValues.length,
                //   });
                // }
              }

              // for (const key in allSmallholderIds) {
              //   if (allSmallholderIds[key].length < columnCodes) {
              //     delete allSmallholderIds[key];
              //   }
              // }
              // allSmallholderIds = Object.keys(allSmallholderIds);
              // let value = allSmallholderIds.length;
              let value = Math.round(sum);

              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah Pekebun\n(Bil)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              let value = context.rowValues["1"] + context.rowValues["3"];
              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah Keluasan\n(ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              let value = context.rowValues["2"] + context.rowValues["4"];
              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 1b": {
      TITLE: `Jadual 1b: Perangkaan Utama Pekebun Kecil Koko di ${
        !params.segment
          ? "Malaysia"
          : params.segment === "Semenanjung"
          ? "Semenanjung Malaysia"
          : params.segment === "Sabah"
          ? "Sabah"
          : params.segment === "Sarawak"
          ? "Sarawak"
          : ""
      }`,
      SUBTITLE: ``,
      QUERIES: {},
      // BASE_FONT_SIZE: 10,
      PAGE_ORIENTATION: "portrait",
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      RESOLVE_ROWS: async () => {
        if (!params.segment) {
          allEstateCensusStateCodes = await context
            .collection("EstateCensusStateCodes")
            .find({
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          return allEstateCensusStateCodes;
        } else if (params.segment === "Semenanjung") {
          allEstateCensusStateCodes = await context
            .collection("EstateCensusStateCodes")
            .find({
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          allEstateCensusStateCodes = allEstateCensusStateCodes.filter(i => {
            const stateCode = parseInt(i.stateCode);
            return stateCode <= 11;
          });
          return allEstateCensusStateCodes;
        } else if (params.segment === "Sabah") {
          allEstateCensusStateCodes = await context
            .collection("EstateCensusStateCodes")
            .find({
              stateCode: "12", // Sabah
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: "12", // Sabah
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          return allEstateCensusStateDistricts;
        } else if (params.segment === "Sarawak") {
          allEstateCensusStateCodes = await context
            .collection("EstateCensusStateCodes")
            .find({
              stateCode: "13", // Sarawak
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: "13", // Sarawak
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          return allEstateCensusStateDistricts;
        }
      },
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            valueAlignment: "center",
          },
          {
            colSpan: 4,
            text: "Maklumat Tanaman Koko",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0402", "B0502"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0402", "B0502"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Bil. Pekebun",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            rowSpan: 3,
            text: "Jumlah Pekebun\n(Bil)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            rowSpan: 3,
            text: "Jumlah Keluasan\n(ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Aktif",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0402", "B0502"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0402", "B0502"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Terbiar",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Jumlah Pekebun\n(Bil)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Jumlah Keluasan\n(ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? {
                    text: context.row.districtName,
                    value: context.row.districtName,
                  }
                : {
                    text: context.row.stateName,
                    value: context.row.stateName,
                  },
            valueAlignment: "center",
          },
          {
            text: "Bil. Pekebun",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0402", "B0502"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" || params.segment === "Sarawak"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                let sumValues = foundValues.reduce((sumValues, item) => {
                  if (item.value > 0) {
                    if (!allSmallholderIds[item.smallholderId]) {
                      allSmallholderIds[item.smallholderId] = [];
                    }
                    allSmallholderIds[item.smallholderId].push(columnCode);
                  }
                  return sumValues + item.value;
                }, 0);

                sum += sumValues;
                // if (sumValues > 0) {
                //   console.log({
                //     columnCode,
                //     stateName: context.row.stateName,
                //     sumValues,
                //     sum,
                //     countFoundValues: foundValues.length,
                //   });
                // }
              }

              for (const key in allSmallholderIds) {
                if (allSmallholderIds[key].length < columnCodes) {
                  delete allSmallholderIds[key];
                }
              }
              allSmallholderIds = Object.keys(allSmallholderIds);
              let value = allSmallholderIds.length;
              // let value = Math.round(sum);

              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0402", "B0502"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" || params.segment === "Sarawak"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                let sumValues = foundValues.reduce((sumValues, item) => {
                  if (item.value > 0) {
                    if (!allSmallholderIds[item.smallholderId]) {
                      allSmallholderIds[item.smallholderId] = [];
                    }
                    allSmallholderIds[item.smallholderId].push(columnCode);
                  }
                  return sumValues + item.value;
                }, 0);

                sum += sumValues;
                // if (sumValues > 0) {
                //   console.log({
                //     columnCode,
                //     stateName: context.row.stateName,
                //     sumValues,
                //     sum,
                //     countFoundValues: foundValues.length,
                //   });
                // }
              }

              // for (const key in allSmallholderIds) {
              //   if (allSmallholderIds[key].length < columnCodes) {
              //     delete allSmallholderIds[key];
              //   }
              // }
              // allSmallholderIds = Object.keys(allSmallholderIds);
              // let value = allSmallholderIds.length;
              let value = Math.round(sum);

              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Bil. Pekebun",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" || params.segment === "Sarawak"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                let sumValues = foundValues.reduce((sumValues, item) => {
                  if (item.value > 0) {
                    if (!allSmallholderIds[item.smallholderId]) {
                      allSmallholderIds[item.smallholderId] = [];
                    }
                    allSmallholderIds[item.smallholderId].push(columnCode);
                  }
                  return sumValues + item.value;
                }, 0);

                sum += sumValues;
                // if (sumValues > 0) {
                //   console.log({
                //     columnCode,
                //     stateName: context.row.stateName,
                //     sumValues,
                //     sum,
                //     countFoundValues: foundValues.length,
                //   });
                // }
              }

              for (const key in allSmallholderIds) {
                if (allSmallholderIds[key].length < columnCodes) {
                  delete allSmallholderIds[key];
                }
              }
              allSmallholderIds = Object.keys(allSmallholderIds);
              let value = allSmallholderIds.length;
              // let value = Math.round(sum);

              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" || params.segment === "Sarawak"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                let sumValues = foundValues.reduce((sumValues, item) => {
                  if (item.value > 0) {
                    if (!allSmallholderIds[item.smallholderId]) {
                      allSmallholderIds[item.smallholderId] = [];
                    }
                    allSmallholderIds[item.smallholderId].push(columnCode);
                  }
                  return sumValues + item.value;
                }, 0);

                sum += sumValues;
                // if (sumValues > 0) {
                //   console.log({
                //     columnCode,
                //     stateName: context.row.stateName,
                //     sumValues,
                //     sum,
                //     countFoundValues: foundValues.length,
                //   });
                // }
              }

              // for (const key in allSmallholderIds) {
              //   if (allSmallholderIds[key].length < columnCodes) {
              //     delete allSmallholderIds[key];
              //   }
              // }
              // allSmallholderIds = Object.keys(allSmallholderIds);
              // let value = allSmallholderIds.length;
              let value = Math.round(sum);

              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah Pekebun\n(Bil)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              let value = context.rowValues["1"] + context.rowValues["3"];
              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah Keluasan\n(ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              let value = context.rowValues["2"] + context.rowValues["4"];
              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 2a": {
      TITLE: `Jadual 2a: Keluasan Tanaman Cukup Umur dan Muda Pekebun Kecil Koko di ${
        !params.segment
          ? "Malaysia"
          : params.segment === "Semenanjung"
          ? "Semenanjung Malaysia"
          : params.segment === "Sabah"
          ? "Sabah"
          : params.segment === "Sarawak"
          ? "Sarawak"
          : ""
      }`,
      SUBTITLE: ``,
      QUERIES: {},
      // BASE_FONT_SIZE: 10,
      PAGE_ORIENTATION: "portrait",
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      RESOLVE_ROWS: async () => {
        if (!params.segment) {
          allEstateCensusStateCodes = await context
            .collection("EstateCensusStateCodes")
            .find({
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          return allEstateCensusStateCodes;
        } else if (params.segment === "Semenanjung") {
          allEstateCensusStateCodes = await context
            .collection("EstateCensusStateCodes")
            .find({
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          allEstateCensusStateCodes = allEstateCensusStateCodes.filter(i => {
            const stateCode = parseInt(i.stateCode);
            return stateCode <= 11;
          });
          return allEstateCensusStateCodes;
        } else if (params.segment === "Sabah") {
          allEstateCensusStateCodes = await context
            .collection("EstateCensusStateCodes")
            .find({
              stateCode: "12", // Sabah
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: "12", // Sabah
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          return allEstateCensusStateDistricts;
        } else if (params.segment === "Sarawak") {
          allEstateCensusStateCodes = await context
            .collection("EstateCensusStateCodes")
            .find({
              stateCode: "13", // Sarawak
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: "13", // Sarawak
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          return allEstateCensusStateDistricts;
        }
      },
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            valueAlignment: "center",
          },
          {
            colSpan: 4,
            text: "Maklumat Tanaman Koko",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0402", "B0502"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0402", "B0502"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Bil. Pekebun",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            rowSpan: 3,
            text: "Jumlah Pekebun\n(Bil)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            rowSpan: 3,
            text: "Jumlah Keluasan\n(ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Muda < 3 Tahun",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0402", "B0502"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0402", "B0502"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Cukup Umur > 3 Tahun",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Jumlah Pekebun\n(Bil)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Jumlah Keluasan\n(ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? {
                    text: context.row.districtName,
                    value: context.row.districtName,
                  }
                : {
                    text: context.row.stateName,
                    value: context.row.stateName,
                  },
            valueAlignment: "center",
          },
          {
            text: "Bil. Pekebun",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0402", "B0502"],
            statsPrecision: 0,
            resolveValue: context => {
              const YEARS = [
                parseInt(params.year) - 0,
                parseInt(params.year) - 1,
                parseInt(params.year) - 2,
              ];

              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" || params.segment === "Sarawak"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                let sumValues = foundValues
                  .filter(item => YEARS.includes(item.year))
                  .reduce((sumValues, item) => {
                    if (item.value > 0) {
                      if (!allSmallholderIds[item.smallholderId]) {
                        allSmallholderIds[item.smallholderId] = [];
                      }
                      allSmallholderIds[item.smallholderId].push(columnCode);
                    }
                    return sumValues + item.value;
                  }, 0);

                sum += sumValues;
                // if (sumValues > 0) {
                //   console.log({
                //     columnCode,
                //     stateName: context.row.stateName,
                //     sumValues,
                //     sum,
                //     countFoundValues: foundValues.length,
                //   });
                // }
              }

              for (const key in allSmallholderIds) {
                if (allSmallholderIds[key].length < columnCodes) {
                  delete allSmallholderIds[key];
                }
              }
              allSmallholderIds = Object.keys(allSmallholderIds);
              let value = allSmallholderIds.length;
              // let value = Math.round(sum);

              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0402", "B0502"],
            statsPrecision: 0,
            resolveValue: context => {
              const YEARS = [
                parseInt(params.year) - 0,
                parseInt(params.year) - 1,
                parseInt(params.year) - 2,
              ];

              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" || params.segment === "Sarawak"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                let sumValues = foundValues
                  .filter(item => YEARS.includes(item.year))
                  .reduce((sumValues, item) => {
                    if (item.value > 0) {
                      if (!allSmallholderIds[item.smallholderId]) {
                        allSmallholderIds[item.smallholderId] = [];
                      }
                      allSmallholderIds[item.smallholderId].push(columnCode);
                    }
                    return sumValues + item.value;
                  }, 0);

                sum += sumValues;
                // if (sumValues > 0) {
                //   console.log({
                //     columnCode,
                //     stateName: context.row.stateName,
                //     sumValues,
                //     sum,
                //     countFoundValues: foundValues.length,
                //   });
                // }
              }

              // for (const key in allSmallholderIds) {
              //   if (allSmallholderIds[key].length < columnCodes) {
              //     delete allSmallholderIds[key];
              //   }
              // }
              // allSmallholderIds = Object.keys(allSmallholderIds);
              // let value = allSmallholderIds.length;
              let value = Math.round(sum);

              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Bil. Pekebun",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            resolveValue: context => {
              const YEARS = [
                parseInt(params.year) - 0,
                parseInt(params.year) - 1,
                parseInt(params.year) - 2,
              ];

              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" || params.segment === "Sarawak"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                let sumValues = foundValues
                  .filter(item => item.year < YEARS[0])
                  .reduce((sumValues, item) => {
                    if (item.value > 0) {
                      if (!allSmallholderIds[item.smallholderId]) {
                        allSmallholderIds[item.smallholderId] = [];
                      }
                      allSmallholderIds[item.smallholderId].push(columnCode);
                    }
                    return sumValues + item.value;
                  }, 0);

                sum += sumValues;
                // if (sumValues > 0) {
                //   console.log({
                //     columnCode,
                //     stateName: context.row.stateName,
                //     sumValues,
                //     sum,
                //     countFoundValues: foundValues.length,
                //   });
                // }
              }

              for (const key in allSmallholderIds) {
                if (allSmallholderIds[key].length < columnCodes) {
                  delete allSmallholderIds[key];
                }
              }
              allSmallholderIds = Object.keys(allSmallholderIds);
              let value = allSmallholderIds.length;
              // let value = Math.round(sum);

              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["I0101"],
            statsPrecision: 0,
            resolveValue: context => {
              const YEARS = [
                parseInt(params.year) - 0,
                parseInt(params.year) - 1,
                parseInt(params.year) - 2,
              ];

              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" || params.segment === "Sarawak"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                let sumValues = foundValues
                  .filter(item => item.year < YEARS[0])
                  .reduce((sumValues, item) => {
                    if (item.value > 0) {
                      if (!allSmallholderIds[item.smallholderId]) {
                        allSmallholderIds[item.smallholderId] = [];
                      }
                      allSmallholderIds[item.smallholderId].push(columnCode);
                    }
                    return sumValues + item.value;
                  }, 0);

                sum += sumValues;
                // if (sumValues > 0) {
                //   console.log({
                //     columnCode,
                //     stateName: context.row.stateName,
                //     sumValues,
                //     sum,
                //     countFoundValues: foundValues.length,
                //   });
                // }
              }

              // for (const key in allSmallholderIds) {
              //   if (allSmallholderIds[key].length < columnCodes) {
              //     delete allSmallholderIds[key];
              //   }
              // }
              // allSmallholderIds = Object.keys(allSmallholderIds);
              // let value = allSmallholderIds.length;
              let value = Math.round(sum);

              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah Pekebun\n(Bil)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              let value = context.rowValues["1"] + context.rowValues["3"];
              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah Keluasan\n(ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              let value = context.rowValues["2"] + context.rowValues["4"];
              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 2b": {
      TITLE: `Jadual 2b: Keluasan Tanaman Koko Mengikut Jenis Tanaman Tunggal Dan Selingan di ${
        !params.segment
          ? "Malaysia"
          : params.segment === "Semenanjung"
          ? "Semenanjung Malaysia"
          : params.segment === "Sabah"
          ? "Sabah"
          : params.segment === "Sarawak"
          ? "Sarawak"
          : ""
      }`,
      SUBTITLE: ``,
      QUERIES: {},
      // BASE_FONT_SIZE: 10,
      PAGE_ORIENTATION: "portrait",
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      RESOLVE_ROWS: async () => {
        if (!params.segment) {
          allEstateCensusStateCodes = await context
            .collection("EstateCensusStateCodes")
            .find({
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          return allEstateCensusStateCodes;
        } else if (params.segment === "Semenanjung") {
          allEstateCensusStateCodes = await context
            .collection("EstateCensusStateCodes")
            .find({
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          allEstateCensusStateCodes = allEstateCensusStateCodes.filter(i => {
            const stateCode = parseInt(i.stateCode);
            return stateCode <= 11;
          });
          return allEstateCensusStateCodes;
        } else if (params.segment === "Sabah") {
          allEstateCensusStateCodes = await context
            .collection("EstateCensusStateCodes")
            .find({
              stateCode: "12", // Sabah
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: "12", // Sabah
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          return allEstateCensusStateDistricts;
        } else if (params.segment === "Sarawak") {
          allEstateCensusStateCodes = await context
            .collection("EstateCensusStateCodes")
            .find({
              stateCode: "13", // Sarawak
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();
          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: "13", // Sarawak
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          return allEstateCensusStateDistricts;
        }
      },
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            valueAlignment: "center",
          },
          {
            colSpan: 4,
            text: "Maklumat Tanaman Koko",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0401"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0401"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Bil. Pekebun",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0501"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0501"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            rowSpan: 3,
            text: "Jumlah Pekebun\n(Bil)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            rowSpan: 3,
            text: "Jumlah Keluasan\n(ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Tanaman Tunggal",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0401"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0401"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Tanaman Selingan",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0501"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0501"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Jumlah Pekebun\n(Bil)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Jumlah Keluasan\n(ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? {
                    text: context.row.districtName,
                    value: context.row.districtName,
                  }
                : {
                    text: context.row.stateName,
                    value: context.row.stateName,
                  },
            valueAlignment: "center",
          },
          {
            text: "Bil. Pekebun",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0401"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" || params.segment === "Sarawak"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                let sumValues = foundValues.reduce((sumValues, item) => {
                  if (item.value > 0) {
                    if (!allSmallholderIds[item.smallholderId]) {
                      allSmallholderIds[item.smallholderId] = [];
                    }
                    allSmallholderIds[item.smallholderId].push(columnCode);
                  }
                  return sumValues + item.value;
                }, 0);

                sum += sumValues;
                // if (sumValues > 0) {
                //   console.log({
                //     columnCode,
                //     stateName: context.row.stateName,
                //     sumValues,
                //     sum,
                //     countFoundValues: foundValues.length,
                //   });
                // }
              }

              for (const key in allSmallholderIds) {
                if (allSmallholderIds[key].length < columnCodes) {
                  delete allSmallholderIds[key];
                }
              }
              allSmallholderIds = Object.keys(allSmallholderIds);
              let value = allSmallholderIds.length;
              // let value = Math.round(sum);

              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0401"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" || params.segment === "Sarawak"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                let sumValues = foundValues.reduce((sumValues, item) => {
                  if (item.value > 0) {
                    if (!allSmallholderIds[item.smallholderId]) {
                      allSmallholderIds[item.smallholderId] = [];
                    }
                    allSmallholderIds[item.smallholderId].push(columnCode);
                  }
                  return sumValues + item.value;
                }, 0);

                sum += sumValues;
                // if (sumValues > 0) {
                //   console.log({
                //     columnCode,
                //     stateName: context.row.stateName,
                //     sumValues,
                //     sum,
                //     countFoundValues: foundValues.length,
                //   });
                // }
              }

              // for (const key in allSmallholderIds) {
              //   if (allSmallholderIds[key].length < columnCodes) {
              //     delete allSmallholderIds[key];
              //   }
              // }
              // allSmallholderIds = Object.keys(allSmallholderIds);
              // let value = allSmallholderIds.length;
              let value = Math.round(sum);

              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Bil. Pekebun",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0501"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" || params.segment === "Sarawak"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                let sumValues = foundValues.reduce((sumValues, item) => {
                  if (item.value > 0) {
                    if (!allSmallholderIds[item.smallholderId]) {
                      allSmallholderIds[item.smallholderId] = [];
                    }
                    allSmallholderIds[item.smallholderId].push(columnCode);
                  }
                  return sumValues + item.value;
                }, 0);

                sum += sumValues;
                // if (sumValues > 0) {
                //   console.log({
                //     columnCode,
                //     stateName: context.row.stateName,
                //     sumValues,
                //     sum,
                //     countFoundValues: foundValues.length,
                //   });
                // }
              }

              for (const key in allSmallholderIds) {
                if (allSmallholderIds[key].length < columnCodes) {
                  delete allSmallholderIds[key];
                }
              }
              allSmallholderIds = Object.keys(allSmallholderIds);
              let value = allSmallholderIds.length;
              // let value = Math.round(sum);

              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Keluasan (ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0501"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" || params.segment === "Sarawak"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                let sumValues = foundValues.reduce((sumValues, item) => {
                  if (item.value > 0) {
                    if (!allSmallholderIds[item.smallholderId]) {
                      allSmallholderIds[item.smallholderId] = [];
                    }
                    allSmallholderIds[item.smallholderId].push(columnCode);
                  }
                  return sumValues + item.value;
                }, 0);

                sum += sumValues;
                // if (sumValues > 0) {
                //   console.log({
                //     columnCode,
                //     stateName: context.row.stateName,
                //     sumValues,
                //     sum,
                //     countFoundValues: foundValues.length,
                //   });
                // }
              }

              // for (const key in allSmallholderIds) {
              //   if (allSmallholderIds[key].length < columnCodes) {
              //     delete allSmallholderIds[key];
              //   }
              // }
              // allSmallholderIds = Object.keys(allSmallholderIds);
              // let value = allSmallholderIds.length;
              let value = Math.round(sum);

              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah Pekebun\n(Bil)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              let value = context.rowValues["1"] + context.rowValues["3"];
              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah Keluasan\n(ha)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              let value = context.rowValues["2"] + context.rowValues["4"];
              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
        ],
      ],
    },
  };
  // ------------------------------------------------------------------------
  // ########################################################################

  const {
    TITLE = "",
    SUBTITLE = "",
    QUERIES = {},
    GROUPED_FOOTERS_CONFIG = [],
    PAGE_ORIENTATION = "landscape",
    BASE_FONT_SIZE = 11,
    NO_HEADERS = false,
    RESOLVE_ROWS = () => {
      return [];
    },
    SUB_ROWS = [],
    COLUMNS = [
      [
        {
          text: "EstId",
          alignment: "center",
          bold: true,
          columnWidth: 80,
          pivotColumn: true,
          // resolveValue: renderEstateId,
        },
      ],
    ],
  } = REPORT_SPECS[params.code] || {};
  const COLUMN_SPECS = COLUMNS[COLUMNS.length - 1];

  let allRows = [];
  if (RESOLVE_ROWS) {
    allRows = await RESOLVE_ROWS();
    if (!allRows) {
      allRows = [];
    }
  }
  console.log(
    "allRows",
    allRows.length,
    // allRows
  );
  // ------------------------------------------------------------------------
  // ########################################################################

  const docDefinition = {
    pageMargins: [20, 30, 20, 45],
    pageSize: "A4",
    // pageOrientation: "portrait",
    pageOrientation: PAGE_ORIENTATION || "landscape",
    // header:
    //   metadata.letter.useLetterHead === "Ya"
    //     ? renderHeader(
    //         companyInformation,
    //         // , [1]
    //       )
    //     : null,
    // footer: (currentPage, pageCount) => [
    //   {
    //     text: "Tarik Cetak " + dayjs().format("DD/MM/YYYY"),
    //     alignment: "left",
    //     // lineHeight: 1,
    //     // marginTop: 4,
    //     marginBottom: 0,
    //     marginLeft: 20,
    //     fontSize: BASE_FONT_SIZE,
    //   },
    //   {
    //     text: "Page " + currentPage.toString() + " of " + pageCount,
    //     alignment: "left",
    //     // lineHeight: 1,
    //     // marginTop: 4,
    //     marginBottom: 8,
    //     marginLeft: 20,
    //     fontSize: BASE_FONT_SIZE,
    //   },
    // ],
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        fontSize:
          PAGE_ORIENTATION === "landscape"
            ? BASE_FONT_SIZE + 1
            : BASE_FONT_SIZE,
        // marginTop: 10,
        layout: {
          ...noBorderTableLayout,
          paddingLeft: () => 3,
          paddingRight: () => 3,
        },
        table: {
          widths: PAGE_ORIENTATION === "landscape" ? [650, 140] : [407, 140],
          body: [
            [
              {
                text: TITLE || "",
                // alignment: "center",
                bold: true,
                colSpan: 2,
              },
              "",
            ],
            [
              {
                text: SUBTITLE || "",
                // alignment: "center",
                italics: true,
                colSpan: 2,
              },
              "",
            ],
          ],
        },
      },
      {
        marginTop: 10,
        layout: {
          ...defaultTableLayout,
          paddingTop: () => 4,
          paddingBottom: () => 4,
          paddingLeft: () => 3,
          paddingRight: () => 3,
        },
        table: {
          widths: [...COLUMN_SPECS.map(spec => spec.columnWidth || 50)],
          body: [
            // ...COLUMNS,
            ...(() => {
              let table = [];

              if (NO_HEADERS) {
              } else {
                COLUMNS.forEach((columns, columnsIndex) => {
                  // if (columnsIndex === COLUMNS.length - 1) {
                  table.push([
                    ...columns.map(column => {
                      return {
                        ...column,
                        text: [
                          column.text,
                          !column.hideSubLabels ? "\n" : "",
                          !column.hideSubLabels && column.alias
                            ? {
                                text: `${column.alias}\n`,
                                bold: false,
                                italics: true,
                                fontSize: BASE_FONT_SIZE - 2,
                              }
                            : "",
                          !column.hideColumnCodes && column.columnCodes
                            ? {
                                text: (column.columnCodes || []).join(" + "),
                                bold: false,
                                fontSize: BASE_FONT_SIZE - 4,
                              }
                            : "",
                        ],
                      };
                    }),
                  ]);
                  //   return;
                  // }

                  // table.push(columns);
                });
              }

              let allStats = {};
              COLUMN_SPECS.forEach((spec, specIndex) => {
                // if (spec.pivotColumn) return;
                allStats[specIndex] = {
                  total: 0,
                  rowResults: [],
                };
              });

              for (const row of allRows) {
                if (!SUB_ROWS || SUB_ROWS.length === 0) {
                  let rowValues = {};
                  table.push([
                    ...COLUMN_SPECS.map((spec, specIndex) => {
                      const result =
                        (spec.resolveValue &&
                          spec.resolveValue({
                            row,
                            spec,
                            rowValues,
                          })) ||
                        {};
                      // console.log(spec.text, row, result);

                      if (!spec.pivotColumn) {
                        rowValues[specIndex] = lodash.round(
                          (result && result.value) || 0,
                          spec.statsPrecision || 0,
                        );

                        allStats[specIndex].total += lodash.round(
                          (result && result.value) || 0,
                          spec.statsPrecision || 0,
                        );
                      }

                      allStats[specIndex].rowResults.push(result);

                      return {
                        text: formatNumber(0, spec.statsPrecision || 0),
                        // bold: true,
                        alignment:
                          spec.valueAlignment ||
                          (spec.pivotColumn ? "left" : "right"),
                        ...result,
                      };
                    }),
                  ]);
                } else {
                  continue;
                  for (const subRow of SUB_ROWS) {
                    let rowValues = {};
                    console.log(
                      "subRow",
                      estateInformation.estateId,
                      subRow.rowCodes,
                    );
                    table.push([
                      ...COLUMN_SPECS.map((spec, specIndex) => {
                        const result =
                          (spec.resolveValue &&
                            spec.resolveValue({
                              spec,
                              estateInformation,
                              rowValues,
                              subRow,
                            })) ||
                          {};

                        rowValues[spec.alias || specIndex] = lodash.round(
                          (result && result.value) || 0,
                          spec.statsPrecision || 0,
                        );

                        if (subRow.includedForDistrictStats) {
                          districtStats[specIndex] += lodash.round(
                            (result && result.value) || 0,
                            spec.statsPrecision || 0,
                          );
                        }

                        return {
                          text: formatNumber(0, spec.statsPrecision || 0),
                          // bold: true,
                          alignment: spec.pivotColumn ? "left" : "right",
                          ...result,
                        };
                      }),
                    ]);
                  }
                }
              }

              if (GROUPED_FOOTERS_CONFIG.includes("allStats")) {
                table.push([
                  ...COLUMN_SPECS.map((spec, specIndex) => {
                    if (spec.pivotColumn) {
                      return {
                        text: [
                          "JUMLAH",
                          // { text: "\nTotal", italics: true, bold: false },
                        ],
                        bold: true,
                        alignment: spec.valueAlignment || "center",
                      };
                    }

                    if (spec.resolveTotalValue) {
                      allStats[specIndex].total = spec.resolveTotalValue(
                        allStats[specIndex],
                      );
                    }

                    return {
                      text: formatNumber(
                        lodash.round(
                          (allStats[specIndex] && allStats[specIndex].total) ||
                            0,
                          spec.statsPrecision || 0,
                        ),
                        spec.statsPrecision || 0,
                      ),
                      bold: true,
                      alignment: spec.valueAlignment || "right",
                    };
                  }),
                ]);
              } else {
                // table.pop();
              }

              return table;
            })(),
          ],
        },
      },
    ],
  };

  return await createPdf({
    docDefinition,
    filename: `${
      params.segment || "Malaysian"
    } Smallholder Report - ${TITLE.split(":").join("")}.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

module.exports = {
  generateMalaysianSmallholderReport,
};
