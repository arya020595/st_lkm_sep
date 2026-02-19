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

const axios = require("axios");
const fs = require("fs");
const base64Img = require("base64-img");

const formatNumber = (num, c = 0, d = ".", t = ",", fallback = "-") => {
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

const generateEstateCensusReport = async (self, params, context) => {
  assertValidSession(context.activeSession);
  console.log("generateEstateCensusReport", params);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  const allEstateCensusStateCodes = await context
    .collection("EstateCensusStateCodes")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log("allEstateCensusStateCodes", allEstateCensusStateCodes[0]);
  const indexedEstateCensusStateCodes = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["stateName"],
    },
  });
  indexedEstateCensusStateCodes.add(allEstateCensusStateCodes);
  // console.log(
  //   "allEstateCensusStateCodes",
  //   allEstateCensusStateCodes.length,
  // );

  const allEstateCensusStateDistricts = await context
    .collection("EstateCensusStateDistricts")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .sort({
      districtCode: -1,
    })
    .toArray();
  // console.log(
  //   "allEstateCensusStateDistricts",
  //   allEstateCensusStateDistricts[0],
  // );
  const indexedEstateCensusStateDistricts = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["stateCode", "stateCodeId"],
    },
  });
  indexedEstateCensusStateDistricts.add(allEstateCensusStateDistricts);
  // console.log(
  //   "allEstateCensusStateDistricts",
  //   allEstateCensusStateDistricts.length,
  // );

  const allEstateInformations = await context
    .collection("EstateInformations")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log("allEstateInformations", allEstateInformations[0]);
  const indexedEstateInformations = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["estateState", "stateCode", "districtCode"],
    },
  });
  indexedEstateInformations.add(
    allEstateInformations.map(info => ({
      ...info,
      stateCode: String(parseInt(info.stateCode)),
      districtCode: String(parseInt(info.districtCode)),
    })),
  );
  console.log("allEstateInformations", allEstateInformations.length);

  await context.collection("EstateCensusYearLists").createIndex({
    year: 1,
    estateId: 1,
  });
  const allEstateCensusYearLists = await context
    .collection("EstateCensusYearLists")
    .find({
      year: parseInt(params.year),
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log(
  //   "allEstateCensusYearLists",
  //   // allEstateCensusYearLists[0],
  //   allEstateCensusYearLists.length,
  // );
  const indexedEstateCensusYearLists = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["estateId", "year"],
    },
  });
  indexedEstateCensusYearLists.add(allEstateCensusYearLists);

  // ########################################################################
  // -------------------------------------------------------------------------------------------
  const renderEstateId = context => {
    if (context.subRow) {
      return {
        marginTop: -4,
        marginBottom: -4,
        layout: {
          ...defaultTableLayout,
          paddingTop: () => 3,
          paddingBottom: () => 3,
          paddingLeft: () => 0,
          paddingRight: () => 2,
        },
        table: {
          widths: [context.spec.columnWidth - 30, 30],
          body: [
            [
              {
                text: context.subRow.text || "",
                border: [false, false, true, false],
              },
              {
                text: (context.subRow.rowCodes || "").join(" + "),
                alignment: "center",
                border: [true, false, false, false],
              },
            ],
          ],
        },
      };
    }
    return {
      text: ("0000" + context.estateInformation.estateId).slice(-5),
    };
  };
  const sumAllColumnCodesValue = context => {
    const columnCodes = context.spec.columnCodes || [];
    let sum = 0;
    for (const columnCode of columnCodes) {
      let foundValue = null;
      foundValue = indexedValues.where({
        estateInformationId: context.estateInformation._id,
        code: columnCode,
        // code: columnCode + context.rowCode,
      });
      if (foundValue.length > 1) {
        console.log("colCode", columnCode);
        for (const val of foundValue) {
          sum += val?.value || 0;
        }
      } else {
        foundValue = indexedValues.find({
          estateInformationId: context.estateInformation._id,
          code: columnCode,
          // code: columnCode + context.rowCode,
        });
        sum += foundValue?.value || 0;
      }
    }
    // console.log("resolveValue", columnCodes, sum);
    return {
      text: formatNumber(sum, context.spec.statsPrecision || 0),
      value: sum,
    };
  };
  const sumAllColumnCodesWithSubRowCodesValue = context => {
    const columnCodes = context.spec.columnCodes || [];
    const rowCodes = context.subRow.rowCodes || [];
    let sum = 0;
    for (const columnCode of columnCodes) {
      for (const rowCode of rowCodes) {
        const foundValue = indexedValues.find({
          estateInformationId: context.estateInformation._id,
          // code: columnCode,
          code: columnCode + rowCode,
        });
        sum += foundValue?.value || 0;
      }
    }
    // console.log("resolveValue", context, columnCodes, sum);
    return {
      text: formatNumber(sum, context.spec.statsPrecision || 0),
      value: sum,
    };
  };
  let indexedValues = null;

  const REPORT_SPECS = {
    2201: {
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        // "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
      ],
      COLUMNS: [
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            rowSpan: 2,
          },
          {
            text: "Pekerja Estet",
            alignment: "center",
            bold: true,
            colSpan: 3,
          },
          {
            text: "",
            alignment: "center",
            bold: true,
          },
          {
            text: "",
            alignment: "center",
            bold: true,
          },
          {
            text: "Pekerja Kilang",
            alignment: "center",
            bold: true,
            colSpan: 3,
          },
          {
            text: "",
            alignment: "center",
            bold: true,
          },
          {
            text: "",
            alignment: "center",
            bold: true,
          },
          {
            text: "Pekerja Sambilan",
            alignment: "center",
            bold: true,
            colSpan: 3,
          },
          {
            text: "",
            alignment: "center",
            bold: true,
          },
          {
            text: "",
            alignment: "center",
            bold: true,
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Bilangan",
            alias: "b",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: [
              "M09810",
              "M09811a",
              "M09811b",
              "M09812a",
              "M09812b",
              "M09813",
              "M09814a",
              "M09814b",
              "M09815a",
              "M09815b",
              "M09832",
              "M09833a",
              "M09833b",
              "M09834a",
              "M09834b",
              "M09835",
              "M09836a",
              "M09836b",
              "M09837a",
              "M09837b",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Gaji Tahunan",
            alias: "a",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: [
              "M10010",
              "M10011a",
              "M10011b",
              "M10012a",
              "M10012b",
              "M10013",
              "M10014a",
              "M10014b",
              "M10015a",
              "M10015b",
              "M10032",
              "M10033a",
              "M10033b",
              "M10034a",
              "M10034b",
              "M10035",
              "M10036a",
              "M10036b",
              "M10037a",
              "M10037b",
            ],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Purata Gaji Bulanan",
            alias: "a/b/12",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["a"] || 0) /
                (context.rowValues?.["b"] || 0) /
                12;
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
            resolveStateStatsValue: context => {
              // if (context.stateCode.stateName === "PAHANG") {
              //   console.log(context);
              // }
              let value =
                (context.stateStats["2"] || 0) / (context.stateStats["1"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              if (value) {
                value = value / 12;
              }
              return value;
            },
            resolveAllStatsValue: context => {
              // console.log(context);
              let value =
                (context.allStats["2"] || 0) / (context.allStats["1"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              if (value) {
                value = value / 12;
              }
              return value;
            },
          },
          {
            text: "Bilangan",
            alias: "d",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: [
              "M09816",
              "M09817",
              "M09818",
              "M09819",
              "M09838",
              "M09839",
              "M09840",
              "M09841",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Gaji Tahunan",
            alias: "c",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: [
              "M10016",
              "M10017",
              "M10018",
              "M10019",
              "M10038",
              "M10039",
              "M10040",
              "M10041",
            ],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Purata Gaji Bulanan",
            alias: "c/d/12",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["c"] || 0) /
                (context.rowValues?.["d"] || 0) /
                12;
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
            resolveStateStatsValue: context => {
              // if (context.stateCode.stateName === "PAHANG") {
              //   console.log(context);
              // }
              let value =
                (context.stateStats["5"] || 0) / (context.stateStats["4"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              if (value) {
                value = value / 12;
              }
              return value;
            },
            resolveAllStatsValue: context => {
              // console.log(context);
              let value =
                (context.allStats["5"] || 0) / (context.allStats["4"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              if (value) {
                value = value / 12;
              }
              return value;
            },
          },
          {
            text: "Bilangan",
            alias: "f",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: ["M09821", "M09843"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Gaji Tahunan",
            alias: "e",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: ["M10021", "M10043"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Purata Gaji Bulanan",
            alias: "e/f/12",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["e"] || 0) /
                (context.rowValues?.["f"] || 0) /
                12;
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
            resolveStateStatsValue: context => {
              // if (context.stateCode.stateName === "PAHANG") {
              //   console.log(context);
              // }
              let value =
                (context.stateStats["8"] || 0) / (context.stateStats["7"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              if (value) {
                value = value / 12;
              }
              return value;
            },
            resolveAllStatsValue: context => {
              // console.log(context);
              let value =
                (context.allStats["8"] || 0) / (context.allStats["7"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              if (value) {
                value = value / 12;
              }
              return value;
            },
          },
        ],
      ],
    },
    2101: {
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        // "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
      ],
      COLUMNS: [
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            rowSpan: 2,
          },
          {
            text: "Pengurusan Profesional",
            alignment: "center",
            bold: true,
            colSpan: 3,
          },
          {
            text: "",
            alignment: "center",
            bold: true,
          },
          {
            text: "",
            alignment: "center",
            bold: true,
          },
          {
            text: "Pengurusan Bukan Profesional",
            alignment: "center",
            bold: true,
            colSpan: 3,
          },
          {
            text: "",
            alignment: "center",
            bold: true,
          },
          {
            text: "",
            alignment: "center",
            bold: true,
          },
          {
            text: "Kakitangan",
            alignment: "center",
            bold: true,
            colSpan: 3,
          },
          {
            text: "",
            alignment: "center",
            bold: true,
          },
          {
            text: "",
            alignment: "center",
            bold: true,
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Bilangan",
            alias: "b",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: ["M09803", "M09825"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Gaji Tahunan",
            alias: "a",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: ["M10003", "M10025"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Purata Gaji Bulanan",
            alias: "a/b/12",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["a"] || 0) /
                (context.rowValues?.["b"] || 0) /
                12;
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
            resolveStateStatsValue: context => {
              let value =
                (context.stateStats["2"] || 0) / (context.stateStats["1"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              if (value) {
                value = value / 12;
              }
              return value;
            },
            resolveAllStatsValue: context => {
              let value =
                (context.allStats["2"] || 0) / (context.allStats["1"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              if (value) {
                value = value / 12;
              }

              return value;
            },
          },
          {
            text: "Bilangan",
            alias: "d",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: ["M09804", "M09826"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Gaji Tahunan",
            alias: "c",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: ["M10004", "M10026"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Purata Gaji Bulanan",
            alias: "c/d/12",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["c"] || 0) /
                (context.rowValues?.["d"] || 0) /
                12;
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
            resolveStateStatsValue: context => {
              let value =
                (context.stateStats["5"] || 0) / (context.stateStats["4"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              if (value) {
                value = value / 12;
              }
              return value;
            },
            resolveAllStatsValue: context => {
              let value =
                (context.allStats["5"] || 0) / (context.allStats["4"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              if (value) {
                value = value / 12;
              }

              return value;
            },
          },
          {
            text: "Bilangan",
            alias: "f",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: [
              "M09805",
              "M09827",
              "M09806",
              "M09828",
              "M09807",
              "M09829",
              "M09808",
              "M09830",
              "M09809",
              "M09831",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Gaji Tahunan",
            alias: "e",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: [
              "M10005",
              "M10027",
              "M10006",
              "M10028",
              "M10007",
              "M10029",
              "M10008",
              "M10030",
              "M10009",
              "M10031",
            ],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Purata Gaji Bulanan",
            alias: "e/f/12",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["e"] || 0) /
                (context.rowValues?.["f"] || 0) /
                12;
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
            resolveStateStatsValue: context => {
              let value =
                (context.stateStats["8"] || 0) / (context.stateStats["7"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              if (value) {
                value = value / 12;
              }
              return value;
            },
            resolveAllStatsValue: context => {
              let value =
                (context.allStats["8"] || 0) / (context.allStats["7"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              if (value) {
                value = value / 12;
              }

              return value;
            },
          },
        ],
      ],
    },
    2001: {
      BASE_FONT_SIZE: 10.5,
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        // "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
      ],
      COLUMNS: [
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            rowSpan: 3,
          },
          {
            text: "Keluasan",
            alignment: "center",
            bold: true,
            rowSpan: 3,
            columnCodes: ["A01411"],
          },
          {
            text: "Pengeluaran",
            alignment: "center",
            bold: true,
            rowSpan: 3,
            columnCodes: ["D03401"],
          },
          {
            text: "Kos Langsung (RM)",
            alignment: "center",
            bold: true,
            colSpan: 4,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          {
            text: "Kos Tidak Langsung (RM)",
            alignment: "center",
            bold: true,
          },
          {
            text: "Jumlah Kos Keseluruhan (RM)",
            alias: "f",
            alignment: "center",
            bold: true,
            columnCodes: ["b+c+d+e"],
            colSpan: 3,
          },
          {
            text: "Purata Kos Pengeluaran Sehektar (RM/hektar)",
            alignment: "center",
            bold: true,
            columnCodes: ["(f/A01411)"],
            colSpan: 3,
          },
          {
            text: "Purata Kos Pengeluaran Se tan (RM/tan)",
            alignment: "center",
            bold: true,
            columnCodes: ["(f/D03401)*1000"],
            colSpan: 3,
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
          },
          {
            text: "Keluasan",
            alignment: "center",
            bold: true,
          },
          {
            text: "Pengeluaran",
            alignment: "center",
            bold: true,
          },
          {
            text: "Kos Bahan",
            alignment: "center",
            bold: true,
            colSpan: 3,
          },
          { text: "" },
          { text: "" },
          {
            text: "Buruh",
            alias: "d",
            alignment: "center",
            rowSpan: 2,
            bold: true,
            columnCodes: ["M10022", "M10044"],
          },
          {
            rowSpan: 2,
            text: "Bahan",
            alias: "e",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: ["L07727", "L07732", "L07740", "L07807", "L07907"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Jumlah Kos Keseluruhan (RM)",
            alias: "f",
            alignment: "center",
            bold: true,
            columnCodes: ["b+c+d+e"],
          },
          {
            rowSpan: 2,
            text: "Purata Kos Pengeluaran Sehektar (RM/hektar)",
            alignment: "center",
            bold: true,
            columnCodes: ["(f/A01411)"],
          },
          {
            rowSpan: 2,
            text: "Purata Kos Pengeluaran Se tan (RM/tan)",
            alignment: "center",
            bold: true,
            columnCodes: ["(f/D03401)*1000"],
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Keluasan",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pengeluaran",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["D03401"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Input",
            alias: "a",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["I06003", "I06006", "I06305", "I06310"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pemeliharaan",
            alias: "b",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: ["L08307", "L08310", "L08314"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pemulihan",
            alias: "c",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["L08335"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Buruh",
            alias: "d",
            alignment: "center",
            bold: true,
            columnWidth: 60,
            columnCodes: ["M10022", "M10044"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Bahan",
            alias: "e",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: ["L07727", "L07732", "L07740", "L07807", "L07907"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Kos Keseluruhan (RM)",
            alias: "f",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: ["b+c+d+e"],
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["b"] || 0) +
                (context.rowValues?.["c"] || 0) +
                (context.rowValues?.["d"] || 0) +
                (context.rowValues?.["e"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
          },
          {
            text: "Purata Kos Pengeluaran Sehektar (RM/hektar)",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: ["(f/A01411)"],
            statsPrecision: 2,
            resolveValue: context => {
              const foundDivider = indexedValues.find({
                estateInformationId: context.estateInformation._id,
                code: "A01411",
                // code: columnCode + context.rowCode,
              });
              let value =
                (context.rowValues?.["f"] || 0) /
                ((foundDivider && foundDivider.value) || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              // console.log(
              //   context.rowValues?.["f"] || 0,
              //   (foundDivider && foundDivider.value) || 0,
              //   { value },
              // );
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
            resolveStateStatsValue: context => {
              let value =
                (context.stateStats["8"] || 0) / (context.stateStats["1"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              // if (context.stateCode.stateName === "PERAK") {
              //   console.log(context, value);
              // }
              return value;
            },
            resolveAllStatsValue: context => {
              let value =
                (context.allStats["8"] || 0) / (context.allStats["1"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }

              return value;
            },
          },
          {
            text: "Purata Kos Pengeluaran Se tan (RM/tan)",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: ["(f/D03401)*1000"],
            statsPrecision: 2,
            resolveValue: context => {
              const foundDivider = indexedValues.find({
                estateInformationId: context.estateInformation._id,
                code: "D03401",
                // code: columnCode + context.rowCode,
              });
              let value =
                ((context.rowValues?.["f"] || 0) /
                  ((foundDivider && foundDivider.value) || 0)) *
                1000;
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
            resolveStateStatsValue: context => {
              // if (context.stateCode.stateName === "PAHANG") {
              // console.log(context);
              // }
              let value =
                (context.stateStats["8"] || 0) / (context.stateStats["2"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              if (value) {
                value = value * 1000;
              }
              return value;
            },
            resolveAllStatsValue: context => {
              let value =
                (context.allStats["8"] || 0) / (context.allStats["2"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              if (value) {
                value = value * 1000;
              }
              return value;
            },
          },
        ],
      ],
    },
    // 1901: {},
    1701: {
      PAGE_ORIENTATION: "portrait",
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        // "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
      ],
      COLUMNS: [
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Penebangan untuk tanaman semula dan tanaman baru",
            alignment: "center",
            bold: true,
            columnWidth: 85,
            columnCodes: ["A00911"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pengurangan disebabkan keluasan cukup umur",
            alignment: "center",
            bold: true,
            columnWidth: 85,
            columnCodes: ["A01011"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Keluasan yang dijual atau digabung",
            alignment: "center",
            bold: true,
            columnWidth: 85,
            columnCodes: ["A01111"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pelarasan atau kerja ukur",
            alignment: "center",
            bold: true,
            columnWidth: 85,
            columnCodes: ["A01211"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah pengurangan",
            alignment: "center",
            bold: true,
            columnWidth: 85,
            columnCodes: ["A01311"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
      ],
    },
    1601: {
      PAGE_ORIENTATION: "portrait",
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        // "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
      ],
      COLUMNS: [
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Cukup umur",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A01405"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Muda",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A01410"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Luas Koko",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A01422"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
      ],
    },
    1501: {
      BASE_FONT_SIZE: 10.5,
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        // "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
      ],
      COLUMNS: [
        [
          {
            rowSpan: 2,
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            colSpan: 2,
            text: "Kos Tidak langsung",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          {
            colSpan: 8,
            text: "Kos Langsung",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          {
            rowSpan: 3,
            text: "Jumlah Keseluruhan (RM Juta)",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: [
              // Kos Bahan
              "L08307",
              "L08310",
              "I06003",
              "I06305",
              "L08335",
              "L08314",
              // Kos Buruh
              "L08107",
              "L08207",
              "L08110",
              "L08210",
              "L08135",
              "L08235",
              "L08114",
              "L08214",
            ],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            rowSpan: 2,
            text: "Kos Bahan (RM Juta)",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: ["L07727", "L07732", "L07740", "L07807", "L07907"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Kos Buruh (RM Juta)",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: [
              "M10003",
              "M10004",
              "M10005",
              "M10006",
              "M10007",
              "M10008",
              "M10009",
              "M10016",
              "M10017",
              "M10018",
              "M10019",
              "M10021",
              "M10025",
              "M10026",
              "M10027",
              "M10028",
              "M10029",
              "M10030",
              "M10031",
              "M10038",
              "M10039",
              "M10040",
              "M10041",
              "M10043",
            ],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 3,
            text: "Kos Bahan (RM Juta)",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          {
            rowSpan: 2,
            text: "Jumlah Kos Bahan",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: [
              "L08307",
              "L08310",
              "I06003",
              "I06305",
              "L08335",
              "L08314",
            ],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 3,
            text: "Kos Buruh (RM Juta)",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: ["L08307", "L08207", "L08110", "L08210"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          { text: "" },
          { text: "" },
          {
            rowSpan: 2,
            text: "Jumlah Kos Buruh",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: [
              "L08107",
              "L08207",
              "L08110",
              "L08210",
              "L08135",
              "L08235",
              "L08114",
              "L08214",
            ],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Keseluruhan (RM Juta)",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: [
              // Kos Bahan
              "L08307",
              "L08310",
              "I06003",
              "I06305",
              "L08335",
              "L08314",
              // Kos Buruh
              "L08107",
              "L08207",
              "L08110",
              "L08210",
              "L08135",
              "L08235",
              "L08114",
              "L08214",
            ],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Kos Bahan (RM Juta)",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: ["L07727", "L07732", "L07740", "L07807", "L07907"],
            statsPrecision: 2,
            resolveValue: context => {
              const result = sumAllColumnCodesValue(context);
              return {
                text: result.text,
                value: result.value,
                fontSize: result.text.length > 10 ? 9 : BASE_FONT_SIZE,
              };
            },
          },
          {
            text: "Kos Buruh (RM Juta)",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: [
              "M10003",
              "M10004",
              "M10005",
              "M10006",
              "M10007",
              "M10008",
              "M10009",
              "M10016",
              "M10017",
              "M10018",
              "M10019",
              "M10021",
              "M10025",
              "M10026",
              "M10027",
              "M10028",
              "M10029",
              "M10030",
              "M10031",
              "M10038",
              "M10039",
              "M10040",
              "M10041",
              "M10043",
            ],
            statsPrecision: 2,
            resolveValue: context => {
              const result = sumAllColumnCodesValue(context);
              return {
                text: result.text,
                value: result.value,
                fontSize: result.text.length > 10 ? 9 : BASE_FONT_SIZE,
              };
            },
          },
          {
            text: "Kos pemeliharaan (Kawasan muda dan cukup umur)",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: ["L08307", "L08310", "I06003", "I06305"],
            statsPrecision: 2,
            resolveValue: context => {
              const result = sumAllColumnCodesValue(context);
              return {
                text: result.text,
                value: result.value,
                fontSize: result.text.length > 10 ? 9 : BASE_FONT_SIZE,
              };
            },
          },
          {
            text: "Kos pemulihan",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: ["L08335"],
            statsPrecision: 2,
            resolveValue: context => {
              const result = sumAllColumnCodesValue(context);
              return {
                text: result.text,
                value: result.value,
                fontSize: result.text.length > 10 ? 9 : BASE_FONT_SIZE,
              };
            },
          },
          {
            text: "Kos pemerosesan",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: ["L08314"],
            statsPrecision: 2,
            resolveValue: context => {
              const result = sumAllColumnCodesValue(context);
              return {
                text: result.text,
                value: result.value,
                fontSize: result.text.length > 10 ? 9 : BASE_FONT_SIZE,
              };
            },
          },
          {
            text: "Jumlah Kos Bahan",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: [
              "L08307",
              "L08310",
              "I06003",
              "I06305",
              "L08335",
              "L08314",
            ],
            statsPrecision: 2,
            resolveValue: context => {
              const result = sumAllColumnCodesValue(context);
              return {
                text: result.text,
                value: result.value,
                fontSize: result.text.length > 10 ? 9 : BASE_FONT_SIZE,
              };
            },
          },
          {
            text: "Kos pemeliharaan (Kawasan muda dan cukup umur)",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: ["L08307", "L08207", "L08110", "L08210"],
            statsPrecision: 2,
            resolveValue: context => {
              const result = sumAllColumnCodesValue(context);
              return {
                text: result.text,
                value: result.value,
                fontSize: result.text.length > 10 ? 9 : BASE_FONT_SIZE,
              };
            },
          },
          {
            text: "Kos pemulihan",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: ["L08135", "L08235"],
            statsPrecision: 2,
            resolveValue: context => {
              const result = sumAllColumnCodesValue(context);
              return {
                text: result.text,
                value: result.value,
                fontSize: result.text.length > 10 ? 9 : BASE_FONT_SIZE,
              };
            },
          },
          {
            text: "Kos pemerosesan",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: ["L08114", "L08214"],
            statsPrecision: 2,
            resolveValue: context => {
              const result = sumAllColumnCodesValue(context);
              return {
                text: result.text,
                value: result.value,
                fontSize: result.text.length > 10 ? 9 : BASE_FONT_SIZE,
              };
            },
          },
          {
            text: "Jumlah Kos Buruh",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: [
              "L08107",
              "L08207",
              "L08110",
              "L08210",
              "L08135",
              "L08235",
              "L08114",
              "L08214",
            ],
            statsPrecision: 2,
            resolveValue: context => {
              const result = sumAllColumnCodesValue(context);
              return {
                text: result.text,
                value: result.value,
                fontSize: result.text.length > 10 ? 9 : BASE_FONT_SIZE,
              };
            },
          },
          {
            text: "Jumlah Keseluruhan (RM Juta)",
            alignment: "center",
            bold: true,
            columnWidth: 55,
            columnCodes: [
              // Kos Bahan
              "L08307",
              "L08310",
              "I06003",
              "I06305",
              "L08335",
              "L08314",
              // Kos Buruh
              "L08107",
              "L08207",
              "L08110",
              "L08210",
              "L08135",
              "L08235",
              "L08114",
              "L08214",
            ],
            statsPrecision: 2,
            resolveValue: context => {
              const result = sumAllColumnCodesValue(context);
              return {
                text: result.text,
                value: result.value,
                fontSize: result.text.length > 10 ? 9 : BASE_FONT_SIZE,
              };
            },
          },
        ],
      ],
    },
    1401: {
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        // "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
      ],
      COLUMNS: [
        [
          {
            rowSpan: 2,
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            colSpan: 3,
            text: "Warganegara Malaysia",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          {
            colSpan: 3,
            text: "Bukan Warganegara Malaysia",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          {
            rowSpan: 2,
            text: "Jumlah Gunatenaga",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["M09322", "M09344", "M09722", "M09744"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Lelaki",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            columnCodes: ["M09322"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Perempuan",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            columnCodes: ["M09344"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            columnCodes: ["M09322", "M09344"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Lelaki",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            columnCodes: ["M09722"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Perempuan",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            columnCodes: ["M09744"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            columnCodes: ["M09722", "M09744"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Gunatenaga",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            columnCodes: ["M09322", "M09344", "M09722", "M09744"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
      ],
    },
    1301: {
      BASE_FONT_SIZE: 10.5,
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        // "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
        //
        "defaultFootersForEmptyTable",
      ],
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            rowSpan: 3,
            text: "Pemilik bekerja dan rakaniaga aktif",
            alias: "a",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09723"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Pekerja keluarga tidak bergaji",
            alias: "b",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09724"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Pengurusan",
            alias: "c",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 58,
            columnCodes: ["M09725", "M09726"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Kakitangan",
            alias: "d",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 58,
            columnCodes: ["M09727", "M09728", "M09729", "M09730", "M09731"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 6,
            text: "Pekerja bergaji sepenuh masa",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          {
            rowSpan: 3,
            text: "Pekerja Sambilan",
            alias: "k",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09743"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Jumlah Pekerja Bukan Warganegara",
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09741"],
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["a"] || 0) +
                (context.rowValues?.["b"] || 0) +
                (context.rowValues?.["c"] || 0) +
                (context.rowValues?.["d"] || 0) +
                (context.rowValues?.["e"] || 0) +
                (context.rowValues?.["f"] || 0) +
                (context.rowValues?.["g"] || 0) +
                (context.rowValues?.["h"] || 0) +
                (context.rowValues?.["i"] || 0) +
                (context.rowValues?.["j"] || 0) +
                (context.rowValues?.["k"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Pemilik bekerja dan rakaniaga aktif",
            alias: "a",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09723"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pekerja keluarga tidak bergaji",
            alias: "b",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09724"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pengurusan",
            alias: "c",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09725", "M09726"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kakitangan",
            alias: "d",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09727", "M09728", "M09729", "M09730", "M09731"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 2,
            text: "Pekerja Estet",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          {
            colSpan: 2,
            text: "Secara Langsung",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          {
            colSpan: 2,
            text: "Kontrak",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          {
            text: "Pekerja Sambilan",
            alias: "k",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09743"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Pekerja Bukan Warganegara",
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09741"],
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["a"] || 0) +
                (context.rowValues?.["b"] || 0) +
                (context.rowValues?.["c"] || 0) +
                (context.rowValues?.["d"] || 0) +
                (context.rowValues?.["e"] || 0) +
                (context.rowValues?.["f"] || 0) +
                (context.rowValues?.["g"] || 0) +
                (context.rowValues?.["h"] || 0) +
                (context.rowValues?.["i"] || 0) +
                (context.rowValues?.["j"] || 0) +
                (context.rowValues?.["k"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Pemilik bekerja dan rakaniaga aktif",
            alias: "a",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09723"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pekerja keluarga tidak bergaji",
            alias: "b",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09724"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pengurusan",
            alias: "c",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 58,
            columnCodes: ["M09725", "M09726"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kakitangan",
            alias: "d",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 58,
            columnCodes: ["M09727", "M09728", "M09729", "M09730", "M09731"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Secara Langsung",
            alias: "e",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09732", "M09733a", "M09734a", "M09733b", "M09734b"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kontrak",
            alias: "f",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09735", "M09736a", "M09737a", "M09736b", "M09737b"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Mahir",
            alias: "g",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09738"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Tidak Mahir",
            alias: "h",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09739"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Mahir",
            alias: "i",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09740"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Tidak Mahir",
            alias: "j",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09741"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pekerja Sambilan",
            alias: "k",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09743"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Pekerja Bukan Warganegara",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["M09741"],
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["a"] || 0) +
                (context.rowValues?.["b"] || 0) +
                (context.rowValues?.["c"] || 0) +
                (context.rowValues?.["d"] || 0) +
                (context.rowValues?.["e"] || 0) +
                (context.rowValues?.["f"] || 0) +
                (context.rowValues?.["g"] || 0) +
                (context.rowValues?.["h"] || 0) +
                (context.rowValues?.["i"] || 0) +
                (context.rowValues?.["j"] || 0) +
                (context.rowValues?.["k"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
          },
        ],
      ],
    },
    1201: {
      BASE_FONT_SIZE: 10.5,
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        // "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
      ],
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            rowSpan: 3,
            text: "Pemilik bekerja dan rakaniaga aktif",
            alias: "a",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09323"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Pekerja keluarga tidak bergaji",
            alias: "b",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09702"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Pengurusan",
            alias: "c",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 58,
            columnCodes: ["M09704", "M09703"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Kakitangan",
            alias: "d",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 58,
            columnCodes: ["M09327", "M09328", "M09329", "M09330", "M09331"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 6,
            text: "Pekerja bergaji sepenuh masa",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          {
            rowSpan: 3,
            text: "Pekerja Sambilan",
            alias: "k",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09343"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Jumlah Pekerja Bukan Warganegara",
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09341"],
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["a"] || 0) +
                (context.rowValues?.["b"] || 0) +
                (context.rowValues?.["c"] || 0) +
                (context.rowValues?.["d"] || 0) +
                (context.rowValues?.["e"] || 0) +
                (context.rowValues?.["f"] || 0) +
                (context.rowValues?.["g"] || 0) +
                (context.rowValues?.["h"] || 0) +
                (context.rowValues?.["i"] || 0) +
                (context.rowValues?.["j"] || 0) +
                (context.rowValues?.["k"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Pemilik bekerja dan rakaniaga aktif",
            alias: "a",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09323"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pekerja keluarga tidak bergaji",
            alias: "b",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09324"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pengurusan",
            alias: "c",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09325", "M09326"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kakitangan",
            alias: "d",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09327", "M09328", "M09329", "M09330", "M09331"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 2,
            text: "Pekerja Estet",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          {
            colSpan: 2,
            text: "Secara Langsung",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          {
            colSpan: 2,
            text: "Kontrak",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          {
            text: "Pekerja Sambilan",
            alias: "k",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09343"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Pekerja Bukan Warganegara",
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09341"],
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["a"] || 0) +
                (context.rowValues?.["b"] || 0) +
                (context.rowValues?.["c"] || 0) +
                (context.rowValues?.["d"] || 0) +
                (context.rowValues?.["e"] || 0) +
                (context.rowValues?.["f"] || 0) +
                (context.rowValues?.["g"] || 0) +
                (context.rowValues?.["h"] || 0) +
                (context.rowValues?.["i"] || 0) +
                (context.rowValues?.["j"] || 0) +
                (context.rowValues?.["k"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Pemilik bekerja dan rakaniaga aktif",
            alias: "a",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09323"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pekerja keluarga tidak bergaji",
            alias: "b",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09324"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pengurusan",
            alias: "c",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 58,
            columnCodes: ["M09325", "M09326"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kakitangan",
            alias: "d",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 58,
            columnCodes: ["M09827", "M09328", "M09329", "M09330", "M09331"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Secara Langsung",
            alias: "e",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09332", "M09333a", "M09334a", "M09333b", "M09334b"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kontrak",
            alias: "f",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09335", "M09336a", "M09337a", "M09336b", "M09337b"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Mahir",
            alias: "g",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09338"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Tidak Mahir",
            alias: "h",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09339"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Mahir",
            alias: "i",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09340"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Tidak Mahir",
            alias: "j",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09341"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pekerja Sambilan",
            alias: "k",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09343"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Pekerja Bukan Warganegara",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["M09341"],
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["a"] || 0) +
                (context.rowValues?.["b"] || 0) +
                (context.rowValues?.["c"] || 0) +
                (context.rowValues?.["d"] || 0) +
                (context.rowValues?.["e"] || 0) +
                (context.rowValues?.["f"] || 0) +
                (context.rowValues?.["g"] || 0) +
                (context.rowValues?.["h"] || 0) +
                (context.rowValues?.["i"] || 0) +
                (context.rowValues?.["j"] || 0) +
                (context.rowValues?.["k"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
          },
        ],
      ],
    },
    1101: {
      BASE_FONT_SIZE: 10.5,
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        // "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
      ],
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            rowSpan: 3,
            text: "Pemilik bekerja dan rakaniaga aktif",
            alias: "a",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09701"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Pekerja keluarga tidak bergaji",
            alias: "b",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09702"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Pengurusan",
            alias: "c",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 58,
            columnCodes: ["M09704", "M09703"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Kakitangan",
            alias: "d",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 58,
            columnCodes: ["M09705", "M09306", "M09707", "M09708", "M09709"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 6,
            text: "Pekerja bergaji sepenuh masa",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          {
            rowSpan: 3,
            text: "Pekerja Sambilan",
            alias: "k",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09721"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Jumlah Pekerja Bukan Warganegara",
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09719"],
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["a"] || 0) +
                (context.rowValues?.["b"] || 0) +
                (context.rowValues?.["c"] || 0) +
                (context.rowValues?.["d"] || 0) +
                (context.rowValues?.["e"] || 0) +
                (context.rowValues?.["f"] || 0) +
                (context.rowValues?.["g"] || 0) +
                (context.rowValues?.["h"] || 0) +
                (context.rowValues?.["i"] || 0) +
                (context.rowValues?.["j"] || 0) +
                (context.rowValues?.["k"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Pemilik bekerja dan rakaniaga aktif",
            alias: "a",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09701"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pekerja keluarga tidak bergaji",
            alias: "b",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09702"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pengurusan",
            alias: "c",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09704", "M09703"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kakitangan",
            alias: "d",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09705", "M09306", "M09707", "M09708", "M09709"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 2,
            text: "Pekerja Estet",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          {
            colSpan: 2,
            text: "Secara Langsung",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          {
            colSpan: 2,
            text: "Kontrak",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          {
            text: "Pekerja Sambilan",
            alias: "k",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09721"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Pekerja Bukan Warganegara",
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09719"],
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["a"] || 0) +
                (context.rowValues?.["b"] || 0) +
                (context.rowValues?.["c"] || 0) +
                (context.rowValues?.["d"] || 0) +
                (context.rowValues?.["e"] || 0) +
                (context.rowValues?.["f"] || 0) +
                (context.rowValues?.["g"] || 0) +
                (context.rowValues?.["h"] || 0) +
                (context.rowValues?.["i"] || 0) +
                (context.rowValues?.["j"] || 0) +
                (context.rowValues?.["k"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Pemilik bekerja dan rakaniaga aktif",
            alias: "a",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09701"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pekerja keluarga tidak bergaji",
            alias: "b",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09702"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pengurusan",
            alias: "c",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 58,
            columnCodes: ["M09704", "M09703"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kakitangan",
            alias: "d",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 58,
            columnCodes: ["M09705", "M09306", "M09707", "M09708", "M09709"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Secara Langsung",
            alias: "e",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09710", "M09711a", "M09712a", "M09711b", "M09712b"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kontrak",
            alias: "f",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09713", "M09714a", "M09715a", "M09714b", "M09715b"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Mahir",
            alias: "g",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09716"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Tidak Mahir",
            alias: "h",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09717"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Mahir",
            alias: "i",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09716"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Tidak Mahir",
            alias: "j",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09719"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pekerja Sambilan",
            alias: "k",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09721"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Pekerja Bukan Warganegara",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["a"] || 0) +
                (context.rowValues?.["b"] || 0) +
                (context.rowValues?.["c"] || 0) +
                (context.rowValues?.["d"] || 0) +
                (context.rowValues?.["e"] || 0) +
                (context.rowValues?.["f"] || 0) +
                (context.rowValues?.["g"] || 0) +
                (context.rowValues?.["h"] || 0) +
                (context.rowValues?.["i"] || 0) +
                (context.rowValues?.["j"] || 0) +
                (context.rowValues?.["k"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
          },
        ],
      ],
    },
    1001: {
      BASE_FONT_SIZE: 10.5,
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        // "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
      ],
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            rowSpan: 3,
            text: "Pemilik bekerja dan rakaniaga aktif",
            alias: "a",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09301"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Pekerja keluarga tidak bergaji",
            alias: "b",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09302"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Pengurusan",
            alias: "c",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 58,
            columnCodes: ["M09304", "M09303"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Kakitangan",
            alias: "d",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 58,
            columnCodes: ["M09305", "M09306", "M09307", "M09308", "M09309"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 6,
            text: "Pekerja bergaji sepenuh masa",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          {
            rowSpan: 3,
            text: "Pekerja Sambilan",
            alias: "k",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09321"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Jumlah Pekerja Bukan Warganegara",
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09319"],
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["a"] || 0) +
                (context.rowValues?.["b"] || 0) +
                (context.rowValues?.["c"] || 0) +
                (context.rowValues?.["d"] || 0) +
                (context.rowValues?.["e"] || 0) +
                (context.rowValues?.["f"] || 0) +
                (context.rowValues?.["g"] || 0) +
                (context.rowValues?.["h"] || 0) +
                (context.rowValues?.["i"] || 0) +
                (context.rowValues?.["j"] || 0) +
                (context.rowValues?.["k"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Pemilik bekerja dan rakaniaga aktif",
            alias: "a",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09301"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pekerja keluarga tidak bergaji",
            alias: "b",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09302"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pengurusan",
            alias: "c",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09304", "M09303"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kakitangan",
            alias: "d",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09305", "M09306", "M09307", "M09308", "M09309"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 2,
            text: "Pekerja Estet",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          {
            colSpan: 2,
            text: "Secara Langsung",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          {
            colSpan: 2,
            text: "Kontrak",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          {
            text: "Pekerja Sambilan",
            alias: "k",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09321"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Pekerja Bukan Warganegara",
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09319"],
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["a"] || 0) +
                (context.rowValues?.["b"] || 0) +
                (context.rowValues?.["c"] || 0) +
                (context.rowValues?.["d"] || 0) +
                (context.rowValues?.["e"] || 0) +
                (context.rowValues?.["f"] || 0) +
                (context.rowValues?.["g"] || 0) +
                (context.rowValues?.["h"] || 0) +
                (context.rowValues?.["i"] || 0) +
                (context.rowValues?.["j"] || 0) +
                (context.rowValues?.["k"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Pemilik bekerja dan rakaniaga aktif",
            alias: "a",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09301"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pekerja keluarga tidak bergaji",
            alias: "b",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09302"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pengurusan",
            alias: "c",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 58,
            columnCodes: ["M09304", "M09303"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kakitangan",
            alias: "d",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 58,
            columnCodes: ["M09305", "M09306", "M09307", "M09308", "M09309"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Secara Langsung",
            alias: "e",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09310", "M09311a", "M09312a", "M09311b", "M09312b"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kontrak",
            alias: "f",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["M09313", "M09314a", "M09315a", "M09314b", "M09315b"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Mahir",
            alias: "g",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09316"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Tidak Mahir",
            alias: "h",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09317"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Mahir",
            alias: "i",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09316"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Tidak Mahir",
            alias: "j",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09319"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Pekerja Sambilan",
            alias: "k",
            hideAlias: true,
            alignment: "center",
            bold: true,
            columnWidth: 49,
            columnCodes: ["M09321"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Pekerja Bukan Warganegara",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["a"] || 0) +
                (context.rowValues?.["b"] || 0) +
                (context.rowValues?.["c"] || 0) +
                (context.rowValues?.["d"] || 0) +
                (context.rowValues?.["e"] || 0) +
                (context.rowValues?.["f"] || 0) +
                (context.rowValues?.["g"] || 0) +
                (context.rowValues?.["h"] || 0) +
                (context.rowValues?.["i"] || 0) +
                (context.rowValues?.["j"] || 0) +
                (context.rowValues?.["k"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
          },
        ],
      ],
    },
    "0901": {
      BASE_FONT_SIZE: 10.5,
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        // "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
      ],
      COLUMNS: [
        [
          {
            rowSpan: 2,
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            colSpan: 4,
            text: "Sebab Kehilangan Tanaman",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          {
            rowSpan: 2,
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["G04301", "G04302", "G04303", "G04304"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 3,
            text: "Nilai",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          {
            rowSpan: 2,
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 52,
            columnCodes: ["G043a01", "G043a02", "G043a03", "G043a04"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Kekurangan tenaga buruh",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["G04301"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Penyakit dan serangga",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["G04302"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Perubahan cuaca yang ekstrem",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["G04303"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Lain-lain",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["G04304"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["G04301", "G04302", "G04303", "G04304"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kekurangan tenaga buruh",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["G043a01"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Penyakit dan serangga",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["G043a02"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Perubahan cuaca yang ekstrem",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["G043a03"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Lain-lain",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["G043a04"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["G043a01", "G043a02", "G043a03", "G043a04"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
      ],
    },
    "0801": {
      BASE_FONT_SIZE: 10,
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        // "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
      ],
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            colSpan: 5,
            text: "Dipulihkan dalam tahun sebelum tahun Banci",
            alignment: "center",
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          {
            colSpan: 5,
            text: "Dipulihkan dalam tahun Banci",
            alignment: "center",
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          {
            colSpan: 5,
            text: "Bilangan pokok sehektar di kawasan yang dipulihkan",
            alignment: "center",
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            rowSpan: 2,
            text: "Tunggal",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B015a01"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 3,
            text: "Tanaman Selingan",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          {
            rowSpan: 2,
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B015a01", "B015a02", "B015a03", "B015a04"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Tunggal",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B01501"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 3,
            text: "Tanaman Selingan",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          {
            rowSpan: 2,
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B01501", "B01502", "B01503", "B01504"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Tunggal",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B01601"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 3,
            text: "Tanaman Selingan",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          {
            rowSpan: 2,
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B01601", "B01602", "B01603", "B01604"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Tunggal",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B015a01"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kelapa",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B015a02"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kelapa Sawit",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B015a03"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Lain-lain",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B015a04"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B015a01", "B015a02", "B015a03", "B015a04"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Tunggal",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B01501"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kelapa",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B01502"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kelapa Sawit",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B01503"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Lain-lain",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B01504"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B01501", "B01502", "B01503", "B01504"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Tunggal",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B01601"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kelapa",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B01602"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kelapa Sawit",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B01603"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Lain-lain",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B01604"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 40,
            columnCodes: ["B01601", "B01602", "B01603", "B01604"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
      ],
    },
    "0701": {
      BASE_FONT_SIZE: 10.5,
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        // "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
        //
        "defaultFootersForEmptyTable",
      ],
      COLUMNS: [
        [
          {
            rowSpan: 2,
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            colSpan: 5,
            text: "Tahun Banci + 1",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          {
            colSpan: 5,
            text: "Tahun Banci + 2",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Luas hektar ditanam baru dengan koko",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["E03601"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Luas hektar ditanam semula dengan koko",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["E03602"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Luas hektar akan dipulihkan",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["E03603"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kelapa Sawit",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["E03604"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Lain-lain",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["E03605"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Luas hektar ditanam baru dengan koko",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["E03701"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Luas hektar ditanam semula dengan koko",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["E03702"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Luas hektar akan dipulihkan",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["E03703"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kelapa Sawit",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["E03704"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Lain-lain",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["E03705"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
      ],
    },
    "0601": {
      BASE_FONT_SIZE: 10,
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        // "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
      ],
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            colSpan: 5,
            text: "Keluasan Cukup Umur",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          {
            colSpan: 5,
            text: "Keluasan Cukup Umur",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          {
            rowSpan: 3,
            text: "Jumlah Keseluruhan",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            rowSpan: 2,
            text: "Tunggal",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            columnCodes: ["A01401"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 3,
            text: "Tanaman Seliongan",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          {
            rowSpan: 2,
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            columnCodes: ["A01405"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Tunggal",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            columnCodes: ["A01406"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 3,
            text: "Tanaman Seliongan",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          {
            rowSpan: 2,
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            columnCodes: ["A01409"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Keseluruhan",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Tunggal",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            columnCodes: ["A01401"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kelapa",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            columnCodes: ["A01402"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kelapa Sawit",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            columnCodes: ["A01403"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Lain-lain",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            columnCodes: ["A01404"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            columnCodes: ["A01405"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Tunggal",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            columnCodes: ["A01406"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kelapa",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            columnCodes: ["A01407"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kelapa Sawit",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            columnCodes: ["A01408"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Lain-lain",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            columnCodes: ["A01409"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            columnCodes: ["A01410"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah Keseluruhan",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
      ],
    },
    "0504": {
      BASE_FONT_SIZE: 11,
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        "districtStatsIsAlwaysBeRendered",
        //
        "allStats",
      ],
      SUB_ROWS: [
        {
          text: "Telah diterangkan/sedang diterangkan untuk ditanam dengan seberang tanaman",
          rowCodes: ["18"],
          // includedForDistrictStats: true,
        },
        {
          text: "Belum diterangkan",
          rowCodes: ["19"],
          // includedForDistrictStats: true,
        },
        {
          text: "Tanah kosong/bangunan, dll",
          rowCodes: ["20"],
          // includedForDistrictStats: true,
        },
        {
          text: "Jumlah",
          rowCodes: ["21"],
          includedForDistrictStats: true,
        },
        {
          text: "Jumlah Luas Hektar Koko",
          rowCodes: ["22"],
          // includedForDistrictStats: true,
        },
      ],
      COLUMNS: [
        [
          {
            rowSpan: 2,
            text: "Tanaman\nBaki Luas Hektar",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            colSpan: 6,
            text: "Pengurangan dalam luas hektar sepanjang tahun",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
        ],
        [
          {
            text: "Tanaman\nBaki Luas Hektar",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Keluasan ditebang untuk penanaman semula",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A009"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Keluasan cukup umur",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A010"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Keluasan dijual atau digabungkan",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A011"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Pelarasan kerja ukur, pembetulan terbiar, dan lain lain",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A012"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Jumlah Pengurangan",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A013"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Jumlah Luas dimiliki pada tahun banci",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A014"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
        ],
      ],
    },
    "0503": {
      BASE_FONT_SIZE: 11,
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        "districtStatsIsAlwaysBeRendered",
        //
        "allStats",
      ],
      SUB_ROWS: [
        {
          text: "Getah",
          rowCodes: ["12"],
          includedForDistrictStats: false,
        },
        {
          text: "Kelapa Sawit",
          rowCodes: ["13"],
          includedForDistrictStats: false,
        },
        {
          text: "Teh",
          rowCodes: ["14"],
          includedForDistrictStats: false,
        },
        {
          text: "Kelapa",
          rowCodes: ["15"],
          includedForDistrictStats: false,
        },
        {
          text: "Tanaman Lain",
          rowCodes: ["16"],
          includedForDistrictStats: false,
        },
        {
          text: "Jumlah Tanaman Lain",
          rowCodes: ["17"],
          includedForDistrictStats: true,
        },
      ],
      COLUMNS: [
        [
          {
            rowSpan: 2,
            text: "Tanaman\nTanaman Lain",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            colSpan: 6,
            text: "Pengurangan dalam luas hektar sepanjang tahun",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
        ],
        [
          {
            text: "Tanaman\nTanaman Lain",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Keluasan ditebang untuk penanaman semula",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A009"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Keluasan cukup umur",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A010"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Keluasan dijual atau digabungkan",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A011"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Pelarasan kerja ukur, pembetulan terbiar, dan lain lain",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A012"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Jumlah Pengurangan",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A013"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Jumlah Luas dimiliki pada tahun banci",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A014"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
        ],
      ],
    },
    "0502": {
      BASE_FONT_SIZE: 11,
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        "districtStatsIsAlwaysBeRendered",
        //
        "allStats",
      ],
      SUB_ROWS: [
        {
          text: "Tunggal",
          rowCodes: ["06"],
        },
        {
          text: "Selingan Kelapa",
          rowCodes: ["07"],
          includedForDistrictStats: false,
        },
        {
          text: "Selingan Kelapa Sawit",
          rowCodes: ["08"],
          includedForDistrictStats: false,
        },
        {
          text: "Selingan Lain-lain",
          rowCodes: ["09"],
          includedForDistrictStats: false,
        },
        {
          text: "Jumlah",
          rowCodes: ["10"],
          includedForDistrictStats: true,
        },
        {
          text: "Jumlah Luas Hektar Koko",
          rowCodes: ["11"],
          includedForDistrictStats: false,
        },
      ],
      COLUMNS: [
        [
          {
            rowSpan: 2,
            text: "Tanaman\nKawasan Muda",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            colSpan: 6,
            text: "Pengurangan dalam luas hektar sepanjang tahun",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
        ],
        [
          {
            text: "Tanaman\nKawasan Muda",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Keluasan ditebang untuk penanaman semula",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A009"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Keluasan cukup umur",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A010"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Keluasan dijual atau digabungkan",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A011"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Pelarasan kerja ukur, pembetulan terbiar, dan lain lain",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A012"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Jumlah Pengurangan",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A013"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Jumlah Luas dimiliki pada tahun banci",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A014"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
        ],
      ],
    },
    "0501": {
      BASE_FONT_SIZE: 11,
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
      ],
      SUB_ROWS: [
        {
          text: "Tunggal",
          rowCodes: ["01"],
        },
        {
          text: "Selingan Kelapa",
          rowCodes: ["02"],
        },
        {
          text: "Selingan Kelapa Sawit",
          rowCodes: ["03"],
        },
        {
          text: "Selingan Lain-lain",
          rowCodes: ["04"],
        },
        {
          text: "Jumlah",
          rowCodes: ["05"],
          includedForDistrictStats: true,
        },
      ],
      COLUMNS: [
        [
          {
            rowSpan: 2,
            text: "Tanaman\nCukup Umur",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            colSpan: 6,
            text: "Pengurangan dalam luas hektar sepanjang tahun",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
        ],
        [
          {
            text: "Tanaman\nCukup Umur",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Keluasan ditebang untuk penanaman semula",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A009"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Keluasan cukup umur",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A010"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Keluasan dijual atau digabungkan",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A011"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Pelarasan kerja ukur, pembetulan terbiar, dan lain lain",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A012"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Jumlah Pengurangan",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A013"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Jumlah Luas dimiliki pada tahun banci",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            columnCodes: ["A014"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
        ],
      ],
    },
    "0404": {
      BASE_FONT_SIZE: 11,
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
      ],
      SUB_ROWS: [
        {
          text: "Telah diterangkan",
          rowCodes: ["18"],
          includedForDistrictStats: true,
        },
        {
          text: "Belum diterangkan",
          rowCodes: ["19"],
          includedForDistrictStats: true,
        },
        {
          text: "Tanah Kosong",
          rowCodes: ["20"],
          includedForDistrictStats: true,
        },
        {
          text: "Jumlah Baki",
          rowCodes: ["21"],
          includedForDistrictStats: true,
        },
        {
          text: "Jumlah Luas Estet",
          rowCodes: ["22"],
          includedForDistrictStats: true,
        },
      ],
      COLUMNS: [
        [
          {
            rowSpan: 2,
            text: "Tanaman\nKawasan\nMuda",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            rowSpan: 2,
            text: "Luas Hektar Dilapor Pada Tahun Sebelum Tahun Banci",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["A001"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            colSpan: 6,
            text: "pertambahan dalam luas hektar sepanjang tahun",
            alignment: "center",
            bold: true,
          },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          { text: "" },
          {
            rowSpan: 2,
            text: "Jumlah Pertambahan",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["A008"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            rowSpan: 2,
            text: "Jumlah Keseluruhan Luas Hektar",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["A008a"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
        ],
        [
          {
            text: "Tanaman\nKawasan\nMuda",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "Luas Hektar Dilapor Pada Tahun Sebelum Tahun Banci",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["A001"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Keluasan cukup umur",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["A002"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Keluasan penanaman baru",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["A03"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Keluasan penanaman semula",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["A004"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Keluasan ditebang tetapi belum ditanam dengan tanaman lain",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["A005"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Keluasan dibeli atau digabung",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["A006"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Pelarasan kerja ukur, pembetulan, terbiar dan lain-lain",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["A007"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Jumlah Pertambahan",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["A008"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
          {
            text: "Jumlah Keseluruhan Luas Hektar",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            columnCodes: ["A008a"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesWithSubRowCodesValue,
          },
        ],
      ],
    },
    1901: {
      BASE_FONT_SIZE: 10,
      GROUPED_HEADERS_CONFIG: [
        "stateCode",
        "stateDistrict",
        //
        // "estateInformation",
      ],
      GROUPED_FOOTERS_CONFIG: [
        "stateStats",
        "districtStats",
        //
        "allStats",
      ],
      COLUMNS: [
        [
          {
            text: "EstId",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            pivotColumn: true,
            resolveValue: renderEstateId,
          },
          {
            text: "< 40.47",
            alias: "< 40.47",
            alignment: "center",
            bold: true,
            columnWidth: 47,
            hideSubLabels: true,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
            resolveValue: context => {
              let sum = 0;
              const foundValues = indexedValues.where({
                estateInformationId: context.estateInformation._id,
                code: "A01411",
                // code: columnCode + context.rowCode,
              });
              for (const foundValue of foundValues) {
                const value = parseFloat(foundValue?.value || 0);
                if (value <= 40.47) {
                  sum += value;
                  break;
                }
              }
              // console.log("resolveValue", columnCodes, sum);
              return {
                text: formatNumber(sum, context.spec.statsPrecision || 0),
                value: sum,
              };
            },
          },
          {
            text: "40.47 - 100",
            alias: "40.47 - 100",
            alignment: "center",
            bold: true,
            columnWidth: 57,
            hideSubLabels: true,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: context => {
              let sum = 0;
              const foundValues = indexedValues.where({
                estateInformationId: context.estateInformation._id,
                code: "A01411",
                // code: columnCode + context.rowCode,
              });
              for (const foundValue of foundValues) {
                const value = parseFloat(foundValue?.value || 0);
                if (value >= 40.47 && value <= 100) {
                  sum += value;
                  break;
                }
              }
              // console.log("resolveValue", columnCodes, sum);
              return {
                text: formatNumber(sum, context.spec.statsPrecision || 0),
                value: sum,
              };
            },
          },
          {
            text: "101-200",
            alias: "101-200",
            alignment: "center",
            bold: true,
            columnWidth: 47,
            hideSubLabels: true,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: context => {
              let sum = 0;
              const foundValues = indexedValues.where({
                estateInformationId: context.estateInformation._id,
                code: "A01411",
                // code: columnCode + context.rowCode,
              });
              for (const foundValue of foundValues) {
                const value = parseFloat(foundValue?.value || 0);
                if (value >= 101 && value <= 200) {
                  sum += value;
                  break;
                }
              }
              // console.log("resolveValue", columnCodes, sum);
              return {
                text: formatNumber(sum, context.spec.statsPrecision || 0),
                value: sum,
              };
            },
          },
          {
            text: "201-300",
            alias: "201-300",
            alignment: "center",
            bold: true,
            columnWidth: 47,
            hideSubLabels: true,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: context => {
              let sum = 0;
              const foundValues = indexedValues.where({
                estateInformationId: context.estateInformation._id,
                code: "A01411",
                // code: columnCode + context.rowCode,
              });
              for (const foundValue of foundValues) {
                const value = parseFloat(foundValue?.value || 0);
                if (value >= 201 && value <= 300) {
                  sum += value;
                  break;
                }
              }
              // console.log("resolveValue", columnCodes, sum);
              return {
                text: formatNumber(sum, context.spec.statsPrecision || 0),
                value: sum,
              };
            },
          },
          {
            text: "301-400",
            alias: "301-400",
            alignment: "center",
            bold: true,
            columnWidth: 47,
            hideSubLabels: true,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: context => {
              let sum = 0;
              const foundValues = indexedValues.where({
                estateInformationId: context.estateInformation._id,
                code: "A01411",
                // code: columnCode + context.rowCode,
              });
              for (const foundValue of foundValues) {
                const value = parseFloat(foundValue?.value || 0);
                if (value >= 301 && value <= 400) {
                  sum += value;
                  break;
                }
              }
              // console.log("resolveValue", columnCodes, sum);
              return {
                text: formatNumber(sum, context.spec.statsPrecision || 0),
                value: sum,
              };
            },
          },
          {
            text: "401-500",
            alias: "401-500",
            alignment: "center",
            bold: true,
            columnWidth: 47,
            hideSubLabels: true,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesValue,
            resolveValue: context => {
              let sum = 0;
              const foundValues = indexedValues.where({
                estateInformationId: context.estateInformation._id,
                code: "A01411",
                // code: columnCode + context.rowCode,
              });
              for (const foundValue of foundValues) {
                const value = parseFloat(foundValue?.value || 0);
                if (value >= 401 && value <= 500) {
                  sum += value;
                  break;
                }
              }
              // console.log("resolveValue", columnCodes, sum);
              return {
                text: formatNumber(sum, context.spec.statsPrecision || 0),
                value: sum,
              };
            },
          },
          {
            text: "501-600",
            alias: "501-600",
            alignment: "center",
            bold: true,
            columnWidth: 47,
            hideSubLabels: true,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: context => {
              let sum = 0;
              const foundValues = indexedValues.where({
                estateInformationId: context.estateInformation._id,
                code: "A01411",
                // code: columnCode + context.rowCode,
              });
              for (const foundValue of foundValues) {
                const value = parseFloat(foundValue?.value || 0);
                if (value >= 501 && value <= 600) {
                  sum += value;
                  break;
                }
              }
              // console.log("resolveValue", columnCodes, sum);
              return {
                text: formatNumber(sum, context.spec.statsPrecision || 0),
                value: sum,
              };
            },
          },
          {
            text: "601-700",
            alias: "601-700",
            alignment: "center",
            bold: true,
            columnWidth: 47,
            hideSubLabels: true,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: context => {
              let sum = 0;
              const foundValues = indexedValues.where({
                estateInformationId: context.estateInformation._id,
                code: "A01411",
                // code: columnCode + context.rowCode,
              });
              for (const foundValue of foundValues) {
                const value = parseFloat(foundValue?.value || 0);
                if (value >= 601 && value <= 700) {
                  sum += value;
                  break;
                }
              }
              // console.log("resolveValue", columnCodes, sum);
              return {
                text: formatNumber(sum, context.spec.statsPrecision || 0),
                value: sum,
              };
            },
          },
          {
            text: "701-800",
            alias: "701-800",
            alignment: "center",
            bold: true,
            columnWidth: 47,
            hideSubLabels: true,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: context => {
              let sum = 0;
              const foundValues = indexedValues.where({
                estateInformationId: context.estateInformation._id,
                code: "A01411",
                // code: columnCode + context.rowCode,
              });
              for (const foundValue of foundValues) {
                const value = parseFloat(foundValue?.value || 0);
                if (value >= 701 && value <= 800) {
                  sum += value;
                  break;
                }
              }
              // console.log("resolveValue", columnCodes, sum);
              return {
                text: formatNumber(sum, context.spec.statsPrecision || 0),
                value: sum,
              };
            },
          },
          {
            text: "801-900",
            alias: "801-900",
            alignment: "center",
            bold: true,
            columnWidth: 47,
            hideSubLabels: true,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: context => {
              let sum = 0;
              const foundValues = indexedValues.where({
                estateInformationId: context.estateInformation._id,
                code: "A01411",
                // code: columnCode + context.rowCode,
              });
              for (const foundValue of foundValues) {
                const value = parseFloat(foundValue?.value || 0);
                if (value >= 801 && value <= 900) {
                  sum += value;
                  break;
                }
              }
              // console.log("resolveValue", columnCodes, sum);
              return {
                text: formatNumber(sum, context.spec.statsPrecision || 0),
                value: sum,
              };
            },
          },
          {
            text: "901-1000",
            alias: "901-1000",
            alignment: "center",
            bold: true,
            columnWidth: 47,
            hideSubLabels: true,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: context => {
              let sum = 0;
              const foundValues = indexedValues.where({
                estateInformationId: context.estateInformation._id,
                code: "A01411",
                // code: columnCode + context.rowCode,
              });
              for (const foundValue of foundValues) {
                const value = parseFloat(foundValue?.value || 0);
                if (value >= 901 && value <= 1000) {
                  sum += value;
                  break;
                }
              }
              // console.log("resolveValue", columnCodes, sum);
              return {
                text: formatNumber(sum, context.spec.statsPrecision || 0),
                value: sum,
              };
            },
          },
          {
            text: ">1001",
            alias: ">1001",
            alignment: "center",
            bold: true,
            columnWidth: 47,
            hideSubLabels: true,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: context => {
              let sum = 0;
              const foundValues = indexedValues.where({
                estateInformationId: context.estateInformation._id,
                code: "A01411",
                // code: columnCode + context.rowCode,
              });
              for (const foundValue of foundValues) {
                const value = parseFloat(foundValue?.value || 0);
                if (value >= 1001) {
                  sum += value;
                  break;
                }
              }
              // console.log("resolveValue", columnCodes, sum);
              return {
                text: formatNumber(sum, context.spec.statsPrecision || 0),
                value: sum,
              };
            },
          },
          {
            text: "JUMLAH",
            alignment: "center",
            bold: true,
            columnWidth: 47,
            hideSubLabels: true,
            columnCodes: ["A01411"],
            statsPrecision: 2,
            resolveValue: context => {
              let value =
                (context.rowValues?.["< 40.47"] || 0) +
                (context.rowValues?.["40.47 - 100"] || 0) +
                (context.rowValues?.["101-200"] || 0) +
                (context.rowValues?.["201-300"] || 0) +
                (context.rowValues?.["301-400"] || 0) +
                (context.rowValues?.["401-500"] || 0) +
                (context.rowValues?.["501-600"] || 0) +
                (context.rowValues?.["601-700"] || 0) +
                (context.rowValues?.["701-800"] || 0) +
                (context.rowValues?.["801-900"] || 0) +
                (context.rowValues?.["901-1000"] || 0) +
                (context.rowValues?.[">1001"] || 0);
              if (isNaN(value) || !lodash.isFinite(value)) {
                value = 0;
              }
              return {
                text: formatNumber(value, context.spec.statsPrecision || 0),
                value,
              };
            },
          },
        ],
      ],
    },
  };

  // ########################################################################
  // -------------------------------------------------------------------------------------------

  const {
    TITLE = "",
    PAGE_ORIENTATION = "landscape",
    BASE_FONT_SIZE = 11,
    GROUPED_HEADERS_CONFIG = [
      "stateCode",
      "stateDistrict",
      //
      // "estateInformation",
    ],
    GROUPED_FOOTERS_CONFIG = [
      "stateStats",
      "districtStats",
      //
      "allStats",
    ],
    SUB_ROWS = [],
    COLUMNS = [
      [
        {
          text: "EstId",
          alignment: "center",
          bold: true,
          columnWidth: 80,
          pivotColumn: true,
          resolveValue: renderEstateId,
        },
      ],
    ],
  } = REPORT_SPECS[params.code] || {};
  const COLUMN_SPECS = COLUMNS[COLUMNS.length - 1];

  let query = {};
  if (params.year) {
    query.censusYear = params.year;
  }
  await context
    .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
    .createIndex({
      censusYear: 1,
      code: 1,
    });
  const allValues = await context
    .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
    .find({
      ...query,
      $or: COLUMN_SPECS.filter(spec => !spec.pivotColumn).reduce(
        (filters, item) => {
          const columnCodes = item.columnCodes || [];
          for (const code of columnCodes) {
            filters.push({
              code: {
                $regex: "^" + code,
                $options: "im",
              },
            });
          }
          return filters;
        },
        [],
      ),
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  console.log("allValues", allValues.length);
  indexedValues = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["estateInformationId", "code"],
    },
  });
  indexedValues.add(allValues);

  // ########################################################################
  // -------------------------------------------------------------------------------------------
  let countEstateInformations = 0;
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
    footer: (currentPage, pageCount) => [
      {
        text: "Tarik Cetak " + dayjs().format("DD/MM/YYYY"),
        alignment: "left",
        // lineHeight: 1,
        // marginTop: 4,
        marginBottom: 0,
        marginLeft: 20,
        fontSize: BASE_FONT_SIZE,
      },
      {
        text: "Page " + currentPage.toString() + " of " + pageCount,
        alignment: "left",
        // lineHeight: 1,
        // marginTop: 4,
        marginBottom: 8,
        marginLeft: 20,
        fontSize: BASE_FONT_SIZE,
      },
    ],
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        fontSize:
          PAGE_ORIENTATION === "landscape"
            ? BASE_FONT_SIZE + 3
            : BASE_FONT_SIZE + 1,
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
                text:
                  TITLE ||
                  `Status Report${params.code ? " " + params.code + " -" : ""} ${
                    params.title
                  }`,
                // alignment: "center",
                bold: true,
              },
              {
                text: `Tahun Banci ${params.year}`,
                alignment: "right",
                bold: true,
                fontSize: BASE_FONT_SIZE + 3,
              },
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

              COLUMNS.forEach((columns, columnsIndex) => {
                // if (columnsIndex === COLUMNS.length - 1) {
                table.push([
                  ...columns.map(column => {
                    return {
                      ...column,
                      text: [
                        column.text,
                        !column.hideSubLabels ? "\n" : "",
                        !column.hideSubLabels &&
                        !column.hideAlias &&
                        column.alias
                          ? {
                              text: `[${column.alias}]\n`,
                              bold: false,
                              fontSize: BASE_FONT_SIZE - 2,
                            }
                          : "",
                        !column.hideSubLabels && column.columnCodes
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

              let allStats = {};
              COLUMN_SPECS.forEach((spec, specIndex) => {
                if (spec.pivotColumn) return;
                allStats[specIndex] = 0;
              });
              for (const stateCode of allEstateCensusStateCodes) {
                const stateDistricts = indexedEstateCensusStateDistricts.where({
                  stateCode: stateCode.stateCode,
                  // stateCodeId: stateCode._id,
                });
                // console.log(
                //   stateCode.stateCode,
                //   stateCode.stateName,
                //   stateDistricts.length,
                // );

                if (
                  stateDistricts.length > 0 &&
                  GROUPED_HEADERS_CONFIG.includes("stateCode")
                ) {
                  table.push([
                    ...COLUMN_SPECS.map((spec, specIndex) =>
                      spec.pivotColumn
                        ? {
                            text: `Kod / Nama Negeri: ${stateCode.stateCode} / ${stateCode.stateName}`,
                            bold: true,
                            colSpan: specIndex === 0 ? COLUMN_SPECS.length : 0,
                          }
                        : "",
                    ),
                  ]);
                }

                let stateStats = {};
                COLUMN_SPECS.forEach((spec, specIndex) => {
                  if (spec.pivotColumn) return;
                  stateStats[specIndex] = 0;
                });
                for (const stateDistrict of stateDistricts) {
                  let estateInformations = indexedEstateInformations.where({
                    // stateCode: stateCode.stateCode,
                    // districtCode: stateDistrict.districtCode,
                    stateCode: String(parseInt(stateCode.stateCode)),
                    districtCode: String(parseInt(stateDistrict.districtCode)),
                  });
                  estateInformations = estateInformations.filter(info => {
                    // --> find one value, check if exists
                    const foundValue = indexedValues.find({
                      estateInformationId: info._id,
                    });
                    return !!foundValue;

                    // --> filter by EstateCensusYearLists
                    // const foundYear = indexedEstateCensusYearLists.find({
                    //   estateId: info.estateId,
                    // });
                    // return !!foundYear;
                  });
                  // console.log(estateInformations.map(est => est.estateId));

                  // if (stateDistrict.districtName === "TAWAU") {
                  //   console.log(
                  //     stateCode.stateCode,
                  //     stateCode.stateName,
                  //     //
                  //     stateDistrict.districtCode,
                  //     stateDistrict.districtName,
                  //     estateInformations.length,
                  //     // estateInformations[0],
                  //   );
                  // }

                  if (!estateInformations.length) {
                    continue;
                  }
                  // console.log(
                  //   stateDistrict.districtCode,
                  //   stateDistrict.districtName,
                  //   estateInformations.length,
                  // );

                  let districtStats = {};
                  COLUMN_SPECS.forEach((spec, specIndex) => {
                    if (spec.pivotColumn) return;
                    districtStats[specIndex] = 0;
                  });
                  if (
                    estateInformations.length > 0 &&
                    GROUPED_HEADERS_CONFIG.includes("stateDistrict")
                  ) {
                    table.push([
                      ...COLUMN_SPECS.map((spec, specIndex) =>
                        spec.pivotColumn
                          ? {
                              text: `Kod / Nama Daerah: ${stateDistrict.districtCode} / ${stateDistrict.districtName}`,
                              bold: true,
                              colSpan:
                                specIndex === 0 ? COLUMN_SPECS.length : 0,
                            }
                          : "",
                      ),
                    ]);
                  }

                  for (const estateInformation of estateInformations) {
                    const foundNonEmptyValue = COLUMN_SPECS.find(spec => {
                      const columnCodes = spec.columnCodes || [];

                      if (!SUB_ROWS || SUB_ROWS.length === 0) {
                        let foundValue = null;
                        for (const columnCode of columnCodes) {
                          foundValue = indexedValues.find({
                            estateInformationId: estateInformation._id,
                            code: columnCode,
                          });
                          if (foundValue && foundValue.value !== 0) {
                            break;
                          }
                        }
                        // console.log(estateInformation.estateId, foundValue);
                        return foundValue && foundValue.value !== 0;
                      } else {
                        let foundValue = null;

                        for (const columnCode of columnCodes) {
                          for (const subRow of SUB_ROWS) {
                            const rowCodes = subRow.rowCodes || [];

                            for (const rowCode of rowCodes) {
                              foundValue = indexedValues.find({
                                estateInformationId: estateInformation._id,
                                // code: columnCode,
                                code: columnCode + rowCode,
                              });

                              // if (
                              //   stateDistrict.districtName.toUpperCase() ===
                              //   "TAWAU"
                              // ) {
                              //   console.log(
                              //     stateDistrict.districtName,
                              //     columnCode,
                              //     subRow,
                              //     columnCode + rowCode,
                              //     foundValue,
                              //   );
                              // }

                              if (foundValue && foundValue.value !== 0) {
                                return true;
                              }
                            }

                            // console.log(estateInformation.estateId, foundValue);
                            if (foundValue && foundValue.value !== 0) {
                              return true;
                            }
                          }
                        }

                        return foundValue && foundValue.value !== 0;
                      }
                    });
                    // console.log(
                    //   "foundNonEmptyValue",
                    //   stateDistrict.districtCode,
                    //   stateDistrict.districtName,
                    //   estateInformation.estateId,
                    //   !!foundNonEmptyValue,
                    // );
                    if (!foundNonEmptyValue) continue;

                    countEstateInformations += 1;

                    if (GROUPED_HEADERS_CONFIG.includes("estateInformation")) {
                      table.push([
                        ...COLUMN_SPECS.map((spec, specIndex) =>
                          spec.pivotColumn
                            ? {
                                text:
                                  "EST ID: " +
                                  ("0000" + estateInformation.estateId).slice(
                                    -5,
                                  ),
                                bold: true,
                                colSpan:
                                  specIndex === 0 ? COLUMN_SPECS.length : 0,
                                fontSize: BASE_FONT_SIZE - 1,
                              }
                            : "",
                        ),
                      ]);
                    }

                    if (!SUB_ROWS || SUB_ROWS.length === 0) {
                      let rowValues = {};
                      table.push([
                        ...COLUMN_SPECS.map((spec, specIndex) => {
                          const result =
                            (spec.resolveValue &&
                              spec.resolveValue({
                                spec,
                                estateInformation,
                                rowValues,
                              })) ||
                            {};

                          rowValues[spec.alias || specIndex] = lodash.round(
                            parseFloat((result && result.value) || 0),
                            spec.statsPrecision || 0,
                          );

                          districtStats[specIndex] += lodash.round(
                            parseFloat((result && result.value) || 0),
                            spec.statsPrecision || 0,
                          );

                          return spec.justEmptyColumn
                            ? " "
                            : {
                                text: formatNumber(0, spec.statsPrecision || 0),
                                // bold: true,
                                alignment: spec.pivotColumn ? "left" : "right",
                                ...result,
                              };
                        }),
                      ]);
                    } else {
                      for (const subRow of SUB_ROWS) {
                        let rowValues = {};
                        // console.log(
                        //   "subRow",
                        //   estateInformation.estateId,
                        //   subRow.rowCodes,
                        // );
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
                              parseFloat((result && result.value) || 0),
                              spec.statsPrecision || 0,
                            );

                            if (subRow.includedForDistrictStats) {
                              districtStats[specIndex] += lodash.round(
                                parseFloat((result && result.value) || 0),
                                spec.statsPrecision || 0,
                              );
                            }

                            // if (
                            //   stateDistrict.districtName.toUpperCase() ===
                            //   "TAWAU"
                            // ) {
                            //   console.log(
                            //     spec.text,
                            //     spec.justEmptyColumn,
                            //     subRow,
                            //     result && result.value,
                            //     districtStats,
                            //     specIndex,
                            //   );
                            // }

                            return spec.justEmptyColumn
                              ? " "
                              : {
                                  text: formatNumber(
                                    0,
                                    spec.statsPrecision || 0,
                                  ),
                                  // bold: true,
                                  alignment: spec.pivotColumn
                                    ? "left"
                                    : "right",
                                  ...result,
                                };
                          }),
                        ]);
                      }
                    }
                  }

                  if (estateInformations.length > 0) {
                    const districtWithValue = Object.keys(districtStats).find(
                      key => !!districtStats[key],
                    );
                    // if (stateDistrict.districtName.toUpperCase() === "TAWAU") {
                    //   console.log(
                    //     "districtWithValue",
                    //     stateDistrict.districtCode,
                    //     stateDistrict.districtName,
                    //     districtWithValue,
                    //     districtStats,
                    //   );
                    // }

                    // console.log(
                    //   "districtWithValue",
                    //   stateDistrict.districtCode,
                    //   stateDistrict.districtName,
                    //   districtWithValue,
                    // );
                    if (
                      districtWithValue ||
                      GROUPED_FOOTERS_CONFIG.includes(
                        "districtStatsIsAlwaysBeRendered",
                      )
                    ) {
                      if (GROUPED_FOOTERS_CONFIG.includes("districtStats")) {
                        table.push([
                          ...COLUMN_SPECS.map((spec, specIndex) => {
                            if (spec.pivotColumn) {
                              return {
                                text: `Jumlah Daerah`,
                                // bold: true,
                              };
                            }

                            stateStats[specIndex] += lodash.round(
                              districtStats[specIndex] || 0,
                              spec.statsPrecision || 0,
                            );

                            const valLength =
                              "" +
                              formatNumber(
                                lodash.round(
                                  districtStats[specIndex] || 0,
                                  spec.statsPrecision || 0,
                                ),
                                spec.statsPrecision || 0,
                              );

                            return spec.justEmptyColumn
                              ? " "
                              : {
                                  text: formatNumber(
                                    lodash.round(
                                      districtStats[specIndex] || 0,
                                      spec.statsPrecision || 0,
                                    ),
                                    spec.statsPrecision || 0,
                                  ),
                                  // bold: true,
                                  alignment: "right",
                                  fontSize:
                                    valLength.length > 10 ? 9 : BASE_FONT_SIZE,
                                };
                          }),
                        ]);
                      }
                    } else if (
                      GROUPED_HEADERS_CONFIG.includes("stateDistrict")
                    ) {
                      table.pop();
                    }
                  }
                }

                if (stateDistricts.length > 0) {
                  const stateWithValue = Object.keys(stateStats).find(
                    key => !!stateStats[key],
                  );
                  // console.log(
                  //   "stateWithValue",
                  //   stateCode.stateCode,
                  //   stateCode.stateName,
                  //   stateWithValue,
                  // );
                  if (stateWithValue) {
                    if (GROUPED_FOOTERS_CONFIG.includes("stateStats")) {
                      table.push([
                        ...COLUMN_SPECS.map((spec, specIndex) => {
                          if (spec.pivotColumn) {
                            return {
                              text: `Jumlah Negeri`,
                              // bold: true,
                            };
                          }

                          allStats[specIndex] += lodash.round(
                            stateStats[specIndex] || 0,
                            spec.statsPrecision || 0,
                          );
                          // if (stateCode.stateName === "PAHANG") {
                          //   console.log(
                          //     "Jumlah Negeri",
                          //     stateCode.stateName,
                          //     specIndex,
                          //     spec,
                          //     allStats[specIndex],
                          //   );
                          // }

                          let value = stateStats[specIndex] || 0;
                          if (spec.resolveStateStatsValue) {
                            value = spec.resolveStateStatsValue({
                              stateCode,
                              stateStats,
                              allStats,
                              specIndex,
                              spec,
                            });
                            stateStats[specIndex] = value;
                          }

                          const valLength =
                            "" +
                            formatNumber(
                              lodash.round(value, spec.statsPrecision || 0),
                              spec.statsPrecision || 0,
                            );

                          return spec.justEmptyColumn
                            ? " "
                            : {
                                text: formatNumber(
                                  lodash.round(value, spec.statsPrecision || 0),
                                  spec.statsPrecision || 0,
                                ),
                                // bold: true,
                                alignment: "right",
                                fontSize:
                                  valLength.length > 10 ? 9 : BASE_FONT_SIZE,
                              };
                        }),
                      ]);
                    }
                  } else if (GROUPED_HEADERS_CONFIG.includes("stateCode")) {
                    table.pop();
                  }
                }
              }

              if (
                table.length === COLUMNS.length &&
                GROUPED_FOOTERS_CONFIG.includes("defaultFootersForEmptyTable")
              ) {
                table.push([
                  ...COLUMN_SPECS.map((spec, specIndex) => {
                    if (spec.pivotColumn) {
                      return {
                        text: `Kod / Nama Negeri:`,
                        bold: true,
                        colSpan: COLUMN_SPECS.length,
                      };
                    }

                    return " ";
                  }),
                ]);
                table.push([
                  ...COLUMN_SPECS.map((spec, specIndex) => {
                    if (spec.pivotColumn) {
                      return {
                        text: `Kod / Nama Daerah:`,
                        bold: true,
                        colSpan: COLUMN_SPECS.length,
                      };
                    }

                    return " ";
                  }),
                ]);
                table.push([
                  ...COLUMN_SPECS.map((spec, specIndex) => {
                    if (spec.pivotColumn) {
                      return {
                        text: ` `,
                        bold: true,
                      };
                    }

                    return " ";
                  }),
                ]);
                table.push([
                  ...COLUMN_SPECS.map((spec, specIndex) => {
                    if (spec.pivotColumn) {
                      return {
                        text: `Daerah`,
                        bold: true,
                      };
                    }

                    return " ";
                  }),
                ]);
                table.push([
                  ...COLUMN_SPECS.map((spec, specIndex) => {
                    if (spec.pivotColumn) {
                      return {
                        text: `Negeri`,
                        bold: true,
                      };
                    }

                    return " ";
                  }),
                ]);
                table.push([
                  ...COLUMN_SPECS.map((spec, specIndex) => {
                    if (spec.pivotColumn) {
                      return {
                        text: `Negera`,
                        bold: true,
                      };
                    }

                    return " ";
                  }),
                ]);
                // console.log(table.length, "vs", COLUMNS.length + 1);
              } else if (
                allEstateCensusStateCodes.length > 0 &&
                GROUPED_FOOTERS_CONFIG.includes("allStats")
              ) {
                table.push([
                  ...COLUMN_SPECS.map((spec, specIndex) => {
                    if (spec.pivotColumn) {
                      return {
                        text: `Jumlah Negara`,
                        bold: true,
                      };
                    }

                    let value = allStats[specIndex] || 0;
                    if (spec.resolveAllStatsValue) {
                      value = spec.resolveAllStatsValue({
                        allStats,
                        specIndex,
                        spec,
                      });
                      allStats[specIndex] = value;
                    }

                    return spec.justEmptyColumn
                      ? " "
                      : {
                          text: formatNumber(
                            lodash.round(value, spec.statsPrecision || 0),
                            spec.statsPrecision || 0,
                          ),
                          // bold: true,
                          alignment: "right",
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
      {
        marginTop: 10,
        text: "Bilangan Estet: " + countEstateInformations,
      },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Estate Census Report - ${TITLE}.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

module.exports = {
  generateEstateCensusReport,
};
