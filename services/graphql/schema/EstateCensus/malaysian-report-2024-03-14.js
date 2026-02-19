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

const generateMalaysianReport = async (self, params, context) => {
  assertValidSession(context.activeSession);
  // console.log("generateMalaysianReport", params);

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
    // console.log(
    //   "allEstateCensusStateCodes",
    //   allEstateCensusStateCodes.length,
    //   allEstateCensusStateCodes[0],
    //   allEstateCensusStateCodes.map(i => [i.stateCode, i.stateName]),
    // );
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
    // let allEstateCensusStateCodes = allEstateCensusStateDistricts.filter(d => {
    //   const districtCode = parseInt(d.districtCode);
    //   return districtCode <= 23;
    // });
    // console.log(
    //   // "allEstateCensusStateCodes",
    //   // allEstateCensusStateCodes.length,
    //   // allEstateCensusStateCodes[0],
    //   // allEstateCensusStateCodes.map(i => [i.stateCode, i.stateName]),
    //   "allEstateCensusStateDistricts",
    //   allEstateCensusStateDistricts.length,
    //   allEstateCensusStateDistricts.map(i => [i.districtCode, i.districtName]),
    // );
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
    // let allEstateCensusStateCodes = allEstateCensusStateDistricts.filter(d => {
    //   const districtCode = parseInt(d.districtCode);
    //   return districtCode <= 40;
    // });
    // console.log(
    //   // "allEstateCensusStateCodes",
    //   // allEstateCensusStateCodes.length,
    //   // allEstateCensusStateCodes[0],
    //   // allEstateCensusStateCodes.map(i => [i.stateCode, i.stateName]),
    //   "allEstateCensusStateDistricts",
    //   allEstateCensusStateDistricts.length,
    //   allEstateCensusStateDistricts.map(i => [i.districtCode, i.districtName]),
    // );
  }

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

  // const allEstateCensusStateDistricts = await context
  //   .collection("EstateCensusStateDistricts")
  //   .find({
  //     _deletedAt: {
  //       $exists: false,
  //     },
  //   })
  //   .toArray();
  // // console.log(
  // //   "allEstateCensusStateDistricts",
  // //   allEstateCensusStateDistricts[0],
  // // );
  // const indexedEstateCensusStateDistricts = new FlexSearch({
  //   tokenize: "strict",
  //   doc: {
  //     id: "_id",
  //     field: ["stateCode", "stateCodeId"],
  //   },
  // });
  // indexedEstateCensusStateDistricts.add(allEstateCensusStateDistricts);
  // // console.log(
  // //   "allEstateCensusStateDistricts",
  // //   allEstateCensusStateDistricts.length,
  // // );

  // ########################################################################
  // ------------------------------------------------------------------------
  let allEstateInformations = await context
    .collection("EstateInformations")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log("allEstateInformations", allEstateInformations.length);
  let indexedEstateInformations = new FlexSearch({
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
  // console.log(
  //   "allEstateInformations",
  //   allEstateInformations[0],
  //   allEstateInformations.length,
  // );
  //
  let allEstateCensusYearLists = [];
  let indexedEstateCensusYearLists = null;
  //
  let indexedValues = null;
  let indexedCocoaMonitors = null;

  const sumAllColumnCodesValue = context => {
    const columnCodes = context.spec.columnCodes || [];
    let sum = 0;

    if (context.row.estateIds) {
      let estateIds = context.row.estateIds || [];
      for (const estateId of estateIds) {
        for (const columnCode of columnCodes) {
          const foundValue = indexedValues.find({
            estateId,
            code: columnCode,
            // code: columnCode + context.rowCode,
          });

          if (
            typeof context.criteria?.$gte !== undefined &&
            foundValue?.value < context.criteria?.$gte
          ) {
            continue;
          }
          if (
            typeof context.criteria?.$lte !== undefined &&
            foundValue?.value > context.criteria?.$lte
          ) {
            continue;
          }

          sum += foundValue?.value || 0;
        }
      }
      // console.log("resolveValue", columnCodes, sum);
    } else {
      let estateInformations = context.row.estateInformations || [
        context.row.estateInformation,
      ];
      for (const estateInformation of estateInformations) {
        if (!estateInformation) continue;

        for (const columnCode of columnCodes) {
          const foundValue = indexedValues.find({
            estateInformationId: estateInformation._id,
            code: columnCode,
            // code: columnCode + context.rowCode,
          });

          if (
            typeof context.criteria?.$gte !== undefined &&
            foundValue?.value < context.criteria?.$gte
          ) {
            continue;
          }
          if (
            typeof context.criteria?.$lte !== undefined &&
            foundValue?.value > context.criteria?.$lte
          ) {
            continue;
          }

          sum += foundValue?.value || 0;
        }
      }
    }
    return {
      text: formatNumber(sum, context.spec.statsPrecision || 0),
      value: sum,
    };
  };

  const sumAllColumnCodesStringValue = context => {
    if (context.row.resolveValue?.[context.spec.key]) {
      const resolveValue = context.row.resolveValue[context.spec.key];
      return resolveValue(context);
    }
    let columnCodes = (context.row.columnCodes[context.spec.key] || "").trim();
    columnCodes = columnCodes
      .split("+")
      .join(" +")
      .split("-")
      .join(" -")
      .split(" ");
    columnCodes = columnCodes.map(code => {
      code = code.split("+").join("").split("-").join("");
      return {
        code,
        prefix: code.startsWith("-") ? "-" : "+",
      };
    });
    // console.log({ columnCodes });

    let sum = 0;
    for (const item of columnCodes) {
      let foundValue = null;
      let foundMultiple = indexedValues.where({
        code: item.code,
      });
      if (foundMultiple.length > 1) {
        foundValue = {
          value: 0,
        };
        foundValue.value = foundMultiple
          .map(m => m.value)
          .reduce((acc, curr) => acc + curr, 0);
      } else {
        foundValue = indexedValues.find({
          code: item.code,
        });
      }

      sum += foundValue?.value || 0;
    }

    return {
      text: formatNumber(sum, context.spec.statsPrecision || 0),
      value: sum,
    };
  };

  const REPORT_SPECS = {
    "Jadual 1": {
      TITLE: `Jadual 1: Perangkaan Utama Koko, ${params.year - 1}: ${
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
      SUBTITLE: `Table 1: Principal Statistics of Cocoa, ${params.year - 1}: ${
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
      QUERIES: {
        CocoaMonitors: {
          censusYear: {
            $in: [
              params.year - 5 + 1,
              params.year - 4 + 1,
              params.year - 3 + 1,
              params.year - 2 + 1,
              params.year - 1 + 1,
            ],
          },
        },
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          censusYear: {
            $in: [
              params.year - 5 + 1,
              params.year - 4 + 1,
              params.year - 3 + 1,
              params.year - 2 + 1,
              params.year - 1 + 1,
            ],
          },
        },
        EstateCensusYearLists: {
          year: {
            $in: [
              params.year - 5 + 1,
              params.year - 4 + 1,
              params.year - 3 + 1,
              params.year - 2 + 1,
              params.year - 1 + 1,
            ],
          },
        },
      },
      // BASE_FONT_SIZE: 10,
      PAGE_ORIENTATION: "portrait",
      GROUPED_FOOTERS_CONFIG: [
        //
        // "allStats",
      ],
      RESOLVE_ROWS: async () => {
        let YEARS = [
          params.year - 5,
          params.year - 4,
          params.year - 3,
          params.year - 2,
          params.year - 1,
        ];

        await context.collection("EstateCensusMaklumatBorang").createIndex({
          censusYear: 1,
        });
        const allEstateCensusMaklumatBorang = await context
          .collection("EstateCensusMaklumatBorang")
          .find({
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        indexedEstateCensusMaklumatBorang = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "censusYear", "estateStatus"],
          },
        });
        indexedEstateCensusMaklumatBorang.add(allEstateCensusMaklumatBorang);

        let rows = [];

        for (const year of YEARS) {
          let luasHektarDitanam = 0;
          let filteredEstateInformations = [];

          for (const info of allEstateInformations) {
            // Aktif Saja
            // if (
            //   process.env.NODE_ENV === "production" &&
            //   info.estateType !== 1 &&
            //   info.estateType !== "1"
            // )
            //   continue;

            // const foundYear = indexedEstateCensusYearLists.find({
            //   estateId: info.estateId,
            //   year: year,
            // });
            // if (!foundYear) continue;

            const maklumatBorang = indexedEstateCensusMaklumatBorang.where({
              estateId: info.estateId,
              censusYear: year + 1,
            });

            if (
              process.env.NODE_ENV === "production" &&
              maklumatBorang.length > 0
            )
              continue;

            const foundValue = indexedValues.find({
              estateInformationId: info._id,
              // code: columnCode,
              censusYear: year + 1,
            });
            // console.log({ info }, !!foundValue);
            if (!foundValue) continue;

            luasHektarDitanam += foundValue.value;
            // console.log({ foundValue, year: year + 1 });

            filteredEstateInformations.push(info);
          }
          rows.push({
            year,
            estateInformations: filteredEstateInformations,
            luasHektarDitanam: lodash.round(luasHektarDitanam, 0),
          });
        }

        return rows;
      },
      COLUMNS: [
        [
          {
            text: "Tahun",
            alias: "Year",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.year,
              value: context.row.year,
            }),
            valueAlignment: "center",
          },
          {
            text: "Bilangan Estet",
            alias: "Number of Estates",
            alignment: "center",
            bold: true,
            columnWidth: 60,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => ({
              text: context.row.estateInformations.length || 0,
              value: context.row.estateInformations.length || 0,
            }),
            valueAlignment: "center",
          },
          {
            text: "Luas Hektar Yang Ditanam",
            alias: "Planted Hectareage\nHektar\nHectareage",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["A01411"],
            statsPrecision: 0,
            // resolveValue: sumAllColumnCodesValue,
            resolveValue: context => {
              return {
                text: context.row.luasHektarDitanam,
                value: context.row.luasHektarDitanam,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Kebun Kecil",
            alias:
              "Smallholdings\nLuas Hektar Ditanam\nPlanted Hectarage\nHektar\nHectareage",
            alignment: "center",
            bold: true,
            columnWidth: 90,
            hideColumnCodes: true,
            columnCodes: !params.segment
              ? ["X00001", "X00002", "X00003"] // "Malaysia"
              : params.segment === "Semenanjung"
              ? ["X00002"] // "Semenanjung Malaysia"
              : params.segment === "Sabah"
              ? ["X00001"] // "Sabah"
              : params.segment === "Sarawak"
              ? ["X00003"] // "Sarawak"
              : [],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              // console.log(columnCodes)
              // console.log(indexedCocoaMonitors)
              for (const columnCode of columnCodes) {
                let foundCocoaMonitor = indexedCocoaMonitors.where({
                  code: columnCode,
                  censusYear: context.row.year + 1,
                });

                // sum += (foundCocoaMonitor && foundCocoaMonitor.value) || 0;

                if (foundCocoaMonitor.length > 0) {
                  sum = sum += lodash.round(
                    foundCocoaMonitor
                      .map(fc => fc.value)
                      .reduce((acc, curr) => acc + curr, 0),
                    0,
                  );
                }
              }
              let valueCocoaMonitor = Math.round(sum);
              // console.log({
              //   valueCocoaMonitor,
              // });

              let value = valueCocoaMonitor;
              return {
                valueCocoaMonitor,
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah Luas Hektar Ditanam",
            alias: "Total Planted Hectarage\nHektar\nHectareage",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            hideColumnCodes: true,
            columnCodes: !params.segment
              ? ["X00001", "X00002", "X00003"] // "Malaysia"
              : params.segment === "Semenanjung"
              ? ["X00002"] // "Semenanjung Malaysia"
              : params.segment === "Sabah"
              ? ["X00001"] // "Sabah"
              : params.segment === "Sarawak"
              ? ["X00003"] // "Sarawak"
              : [],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueA01411 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["A01411"],
                },
              });

              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              for (const columnCode of columnCodes) {
                // let foundCocoaMonitor = indexedCocoaMonitors.find({
                //   code: columnCode,
                //   censusYear: context.row.year,
                // });
                // sum += (foundCocoaMonitor && foundCocoaMonitor.value) || 0;

                let foundCocoaMonitor = indexedCocoaMonitors.where({
                  code: columnCode,
                  censusYear: context.row.year + 1,
                });

                if (foundCocoaMonitor.length > 0) {
                  sum = sum += lodash.round(
                    foundCocoaMonitor
                      .map(fc => fc.value)
                      .reduce((acc, curr) => acc + curr, 0),
                    0,
                  );
                }
              }
              let valueCocoaMonitor = Math.round(sum);
              // console.log({
              //   valueA01411,
              //   valueCocoaMonitor,
              // });
              // let value = Math.round(valueA01411) + valueCocoaMonitor;
              let value = context.row.luasHektarDitanam + valueCocoaMonitor;
              return {
                valueA01411,
                valueCocoaMonitor,
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Pengeluaran Biji Koko Kering",
            alias: "Production of Dry Cocoa Beans\nTan\nTonne",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            hideColumnCodes: true,
            columnCodes: ["D03401"],
            statsPrecision: 0,
            resolveValue: context => {
              let ctx = {
                ...context,
              };
              ctx["row"].year = ctx["row"].year + 1;

              let value = 0;
              for (const ct of ctx.row.estateInformations) {
                const tmpVal = indexedValues.find({
                  estateId: ct.estateId,
                  censusYear: ctx["row"].year,
                  code: "D03401",
                });
                if (!tmpVal) continue;
                value += tmpVal.value;
              }

              value = value ? Math.round(value / 1000.0) : 0;
              // let { value } = sumAllColumnCodesValue(context);
              // value = value ? Math.round(value / 1000.0) : 0;
              // return { value, text: value };
              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Hasil Sehektar Dipetik",
            alias: "Yield of Harvested Area Per Hectare\nKilogram",
            alignment: "center",
            bold: true,
            columnWidth: 80,
            hideColumnCodes: true,
            columnCodes: ["D03201", "D03401"],
            statsPrecision: 0,
            resolveValue: context => {
              // let { value: valueD03201 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["D03201"],
              //   },
              // });
              // let { value: valueD03401 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["D03401"],
              //   },
              // });
              // console.log({
              //   valueD03201,
              //   valueD03401,
              // });
              // let value =
              //   valueD03201 !== 0 && valueD03401 !== 0
              //     ? Math.round(valueD03201 / (valueD03401 / 1000.0))
              //     : 0;

              // let value = lodash.round(valueD03401 / valueD03201, 0);

              let valueD03401 = 0;
              let valueD03201 = 0;
              for (const ct of context.row.estateInformations) {
                const tmpVal = indexedValues.find({
                  estateId: ct.estateId,
                  censusYear: context.row.year,
                  code: "D03401",
                });

                if (!tmpVal) continue;
                valueD03401 += tmpVal.value;
              }

              for (const ct of context.row.estateInformations) {
                const tmpVal = indexedValues.find({
                  estateId: ct.estateId,
                  censusYear: context.row.year,
                  code: "D03201",
                });
                if (!tmpVal) continue;
                valueD03201 += tmpVal.value;
              }

              let value = 0;
              if (valueD03401) {
                value = lodash.round(valueD03401 / valueD03201, 0);
              }

              return {
                valueD03201,
                valueD03401,
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 6": {
      TITLE: `Jadual 6: Keluasan Tanaman Di Estet Koko Mengikuti Taraf Sah Seperti Pada 31 Disember ${
        params.year - 1
      }: ${
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
      SUBTITLE: `Table 6: Utilisation of Estate Hectareage by Legal Status as at December, ${
        params.year - 1
      }: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      BASE_FONT_SIZE: 10,
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      RESOLVE_ROWS: async () => {
        await context.collection("EstateCensusTarafSah").createIndex({
          censusYear: 1,
        });
        const allEstateCensusTarafSah = await context
          .collection("EstateCensusTarafSah")
          .find({
            censusYear: params.year,
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        // console.log("allEstateCensusTarafSah", allEstateCensusTarafSah.length);
        indexedEstateCensusTarafSah = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "legalStatus"],
          },
        });
        indexedEstateCensusTarafSah.add(allEstateCensusTarafSah);

        const allRefComStatuses = await context
          .collection("RefComStatuses")
          .find({
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        let TARAF_SAH_LEGAL_STATUS = allRefComStatuses.map(i => i.comStatus);
        // console.log({ TARAF_SAH_LEGAL_STATUS });
        TARAF_SAH_LEGAL_STATUS = TARAF_SAH_LEGAL_STATUS.map(legalStatus => {
          const foundTarafSah = indexedEstateCensusTarafSah.where({
            legalStatus,
          });

          // const estateIds = [...new Set(foundTarafSah.map(i => i.estateId))];
          const estateIds = [...foundTarafSah.map(i => i.estateId)];
          return {
            legalStatus,
            estateIds,
          };
        });

        TARAF_SAH_LEGAL_STATUS = TARAF_SAH_LEGAL_STATUS.filter(
          tf => tf.estateIds.length > 0,
        );

        return TARAF_SAH_LEGAL_STATUS;
      },
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text: "Taraf Sah",
            alias: "Legal Status",
            alignment: "center",
            bold: true,
            columnWidth: 95,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.legalStatus,
              value: context.row.legalStatus,
            }),
          },
          {
            rowSpan: 3,
            text: "Bilangan Estet",
            alias: "Number of Estates",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => ({
              text: context.row.estateIds.length || 0,
              value: context.row.estateIds.length || 0,
            }),
          },
          {
            rowSpan: 3,
            text: "Jumlah Keluasan Estet",
            alias: "Total Hectarage Of",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01422"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 3,
            text: "Keluasan ditanam koko",
            alias: "Hecterage Planted with",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01411"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Cukup Umur",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01405"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01410"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 5,
            text: "Keluasan Tanama Lain",
            alias: "Hecterage Planted with other crops",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01417"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Getah",
            alias: "Rubber",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01412"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kelapa Sawit",
            alias: "Oil Palm",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01413"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kelapa",
            alias: "Coconut",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01415"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Lain-lain",
            alias: "Others",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01414", "A01416"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 4,
            text: "Baki Luas Hektar",
            alias: "Remaining Hecterage",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01421"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Telah Diterangkan Atau Sedang",
            alias: "Cleared or Being Cleared",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01418"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Belum Diterangkan",
            alias: "Cleared or Being Cleared",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01419"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Tanah Kosong Bangunan Jalan dll",
            alias: "Waste land, building, roads, etc",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01420"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
        [
          {
            text: "Taraf Sah",
            alias: "Legal Status",
            alignment: "center",
            bold: true,
            columnWidth: 95,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.legalStatus,
              value: context.row.legalStatus,
            }),
          },
          {
            text: "Bilangan Estet",
            alias: "Number of Estates",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => ({
              text: context.row.countEstates,
              value: context.row.countEstates,
            }),
          },
          {
            text: "Jumlah Keluasan Estet",
            alias: "Total Hectarage Of",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01422"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01411"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Cukup Umur",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01405"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01410"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01417"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Getah",
            alias: "Rubber",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01412"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Kelapa Sawit",
            alias: "Oil Palm",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01413"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Kelapa",
            alias: "Coconut",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01415"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Lain-lain",
            alias: "Others",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01414", "A01416"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01421"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 2,
            text: "Keluasan yang boleh",
            alias: "Area capable of cultivation",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01418"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Belum Diterangkan",
            alias: "Cleared or Being Cleared",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01419"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Tanah Kosong Bangunan Jalan dll",
            alias: "Waste land, building, roads, etc",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01420"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
        [
          {
            text: "Taraf Sah",
            alias: "Legal Status",
            alignment: "center",
            bold: true,
            columnWidth: 95,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.legalStatus,
              value: context.row.legalStatus,
            }),
          },
          {
            text: "Bilangan Estet",
            alias: "Number of Estates",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            // resolveValue: context => ({
            //   text: context.row.estateIds.length || 0,
            //   value: context.row.estateIds.length || 0,
            // }),
            resolveValue: context => {
              const estateIds = lodash.uniq(context.row.estateIds);
              return {
                text: estateIds.length || 0,
                value: estateIds.length || 0,
              };
            },
          },
          {
            text: "Jumlah Keluasan Estet",
            alias: "Total Hectarage Of",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01422"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            // resolveValue: context => {
            //   console.log(context);
            //   return {
            //     text: 0,
            //     value: 0,
            //   };
            // },
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01411"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Cukup Umur",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01405"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01410"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01417"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Getah",
            alias: "Rubber",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01412"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kelapa Sawit",
            alias: "Oil Palm",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01413"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Kelapa",
            alias: "Coconut",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01415"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Lain-lain",
            alias: "Others",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01414", "A01416"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01421"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Telah Diterangkan Atau Sedang",
            alias: "Cleared or Being Cleared",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01418"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Belum Diterangkan",
            alias: "Cleared or Being Cleared",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01419"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Tanah Kosong Bangunan Jalan dll",
            alias: "Waste land, building, roads, etc",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["A01420"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
      ],
    },
    "Jadual 2": {
      TITLE: `Jadual 2: Jumlah Luas Kawasan Koko Di Estet Mengikuti Negeri ${
        params.year - 1
      }: ${
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
      SUBTITLE: `Table 2: Total Planted Hectareage Of Cocoa Estates by States ${
        params.year - 1
      }: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      // BASE_FONT_SIZE: 10,
      PAGE_ORIENTATION: "portrait",
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      RESOLVE_ROWS: async () => {
        await context.collection("EstateCensusMaklumatBorang").createIndex({
          censusYear: 1,
        });
        const allEstateCensusMaklumatBorang = await context
          .collection("EstateCensusMaklumatBorang")
          .find({
            censusYear: params.year,
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        indexedEstateCensusMaklumatBorang = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "censusYear"],
          },
        });
        indexedEstateCensusMaklumatBorang.add(allEstateCensusMaklumatBorang);

        if (params.segment === "Sabah" || params.segment === "Sarawak") {
          let allDistricts = [];
          for (const state of allEstateCensusStateDistricts) {
            let allEstateInformations = indexedEstateInformations.where({
              stateCode: String(parseInt(state.stateCode)),
              districtCode: String(parseInt(state.districtCode)),
            });

            let filteredEstateInformations = [];
            for (const info of allEstateInformations) {
              // Aktif Saja
              if (
                process.env.NODE_ENV === "production" &&
                info.estateType !== 1 &&
                info.estateType !== "1"
              )
                continue;

              const foundYear = indexedEstateCensusYearLists.find({
                estateId: info.estateId,
              });
              if (!foundYear) continue;

              const foundValue = indexedValues.find({
                estateInformationId: info._id,
                // code: columnCode,
              });
              // console.log({ info }, !!foundValue);
              if (!foundValue) continue;

              filteredEstateInformations.push(info);
            }

            if (!filteredEstateInformations.length) continue;

            allDistricts.push({
              ...state,
              estateInformations: filteredEstateInformations,
            });
            // console.log(
            //   "filteredEstateInformations",
            //   state.stateCode,
            //   state.stateName,
            //   filteredEstateInformations.length,
            // );
          }

          return allDistricts.map(i => {
            return {
              ...i,
              stateName: i.districtName || i.stateName || "",
            };
          });
        }

        let allStates = [];
        for (const state of allEstateCensusStateCodes) {
          let allEstateInformations = indexedEstateInformations.where({
            stateCode: String(parseInt(state.stateCode)),
          });

          let filteredEstateInformations = [];
          for (const info of allEstateInformations) {
            // Aktif Saja
            const maklumatBorang = indexedEstateCensusMaklumatBorang.where({
              estateId: info.estateId,
              censusYear: params.year,
            });

            // if (
            //   process.env.NODE_ENV === "production" &&
            //   info.estateType !== 1 &&
            //   info.estateType !== "1"
            // )
            //   continue;

            if (maklumatBorang.length === 0) continue;
            // const foundYear = indexedEstateCensusYearLists.find({
            //   estateId: info.estateId,
            // });
            // if (!foundYear) continue;

            const foundValue = indexedValues.find({
              estateInformationId: info._id,
              // code: columnCode,
            });
            // console.log({ info }, !!foundValue);
            if (!foundValue) continue;

            filteredEstateInformations.push(info);
          }

          if (!filteredEstateInformations.length) continue;

          allStates.push({
            ...state,
            estateInformations: filteredEstateInformations,
          });
          // console.log(
          //   "filteredEstateInformations",
          //   state.stateCode,
          //   state.stateName,
          //   filteredEstateInformations.length,
          // );
        }

        allStates = allStates.map(state => {
          const estateIds = (state.estateInformations || []).map(
            i => i.estateId,
          );
          let countEstateCensusMaklumatBorang = 0;
          for (const estateId of estateIds) {
            const foundEstateCensusMaklumatBorang =
              indexedEstateCensusMaklumatBorang.where({
                estateId,
              });
            countEstateCensusMaklumatBorang +=
              foundEstateCensusMaklumatBorang.length;
          }

          return { ...state, countEstateCensusMaklumatBorang };
        });

        // console.log({ allStates });
        return allStates;
      },
      COLUMNS: [
        [
          {
            text: "Taraf Sah",
            alias: "Legal Status",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.stateName,
              value: context.row.stateName,
            }),
            valueAlignment: "center",
          },
          {
            text: "Bilangan Estet",
            alias: "Number of Estates",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => ({
              text: context.row.countEstateCensusMaklumatBorang || 0,
              value: context.row.countEstateCensusMaklumatBorang || 0,
            }),
            valueAlignment: "center",
          },
          {
            text: "Keluasan Estet",
            alias: "Hectarage of Estates",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            hideColumnCodes: true,
            columnCodes: ["A01411"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 8": {
      TITLE: `Jadual 8: Luasan Kawasan Koko Di Estet Mengikut Cara Tanaman Dan Negeri, ${
        params.year - 1
      }: ${
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
      SUBTITLE: `Table 8: Planted Hectareage Of Cocoa Estates by Type of Planting and States, ${
        params.year - 1
      }: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      BASE_FONT_SIZE: 10,
      // PAGE_ORIENTATION: "portrait",
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      RESOLVE_ROWS: async () => {
        await context.collection("EstateCensusMaklumatBorang").createIndex({
          censusYear: 1,
        });
        const allEstateCensusMaklumatBorang = await context
          .collection("EstateCensusMaklumatBorang")
          .find({
            censusYear: params.year,
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        indexedEstateCensusMaklumatBorang = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "censusYear"],
          },
        });
        indexedEstateCensusMaklumatBorang.add(allEstateCensusMaklumatBorang);

        if (params.segment === "Sabah" || params.segment === "Sarawak") {
          let allDistricts = [];
          for (const state of allEstateCensusStateDistricts) {
            let allEstateInformations = indexedEstateInformations.where({
              stateCode: String(parseInt(state.stateCode)),
              districtCode: String(parseInt(state.districtCode)),
            });

            let filteredEstateInformations = [];
            for (const info of allEstateInformations) {
              // Aktif Saja
              if (
                process.env.NODE_ENV === "production" &&
                info.estateType !== 1 &&
                info.estateType !== "1"
              )
                continue;

              const foundYear = indexedEstateCensusYearLists.find({
                estateId: info.estateId,
              });
              if (!foundYear) continue;

              const foundValue = indexedValues.find({
                estateInformationId: info._id,
                // code: columnCode,
              });
              // console.log({ info }, !!foundValue);
              if (!foundValue) continue;

              filteredEstateInformations.push(info);
            }

            if (!filteredEstateInformations.length) continue;

            allDistricts.push({
              ...state,
              estateInformations: filteredEstateInformations,
            });
            // console.log(
            //   "filteredEstateInformations",
            //   state.stateCode,
            //   state.stateName,
            //   filteredEstateInformations.length,
            // );
          }

          return allDistricts.map(i => {
            return {
              ...i,
              stateName: i.districtName || i.stateName || "",
            };
          });
        }

        let allStates = [];
        for (const state of allEstateCensusStateCodes) {
          let allEstateInformations = indexedEstateInformations.where({
            stateCode: String(parseInt(state.stateCode)),
          });

          let filteredEstateInformations = [];
          for (const info of allEstateInformations) {
            // Aktif Saja
            // if (
            //   process.env.NODE_ENV === "production" &&
            //   info.estateType !== 1 &&
            //   info.estateType !== "1"
            // )
            //   continue;

            // const foundYear = indexedEstateCensusYearLists.find({
            //   estateId: info.estateId,
            // });
            // if (!foundYear) continue;

            const maklumatBorang = indexedEstateCensusMaklumatBorang.where({
              estateId: info.estateId,
              censusYear: params.year,
            });

            // if (maklumatBorang.length > 0) continue;
            // if (
            //   process.env.NODE_ENV === "production" &&
            //   info.estateType !== 1 &&
            //   info.estateType !== "1"
            // )
            //   continue;

            if (
              process.env.NODE_ENV === "production" &&
              maklumatBorang.length > 0
            )
              continue;

            const foundValue = indexedValues.find({
              estateInformationId: info._id,
              // code: columnCode,
            });
            // console.log({ info }, !!foundValue);
            if (!foundValue) continue;

            filteredEstateInformations.push(info);
          }

          if (!filteredEstateInformations.length) continue;

          allStates.push({
            ...state,
            estateInformations: filteredEstateInformations,
          });
          // console.log(
          //   "filteredEstateInformations",
          //   state.stateCode,
          //   state.stateName,
          //   filteredEstateInformations.length,
          // );
        }

        allStates = allStates.map(state => {
          let estateIds = (state.estateInformations || []).map(i => i.estateId);
          estateIds = estateIds.filter(estateId => {
            const foundEstateCensusMaklumatBorang =
              indexedEstateCensusMaklumatBorang.where({
                estateId,
              });

            return foundEstateCensusMaklumatBorang.length > 0;
          });

          return { ...state, estateIds };
        });

        // console.log({ allStates });
        return allStates;
      },
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "District"
                : "State",
            alignment: "center",
            bold: true,
            columnWidth: 110,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.stateName,
              value: context.row.stateName,
            }),
            valueAlignment: "center",
          },
          {
            colSpan: 3,
            text: "Tanaman Tunggal (Hektar)",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01401"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01406"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01406", "A01406"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 6,
            text: "Dengan Kelapa",
            alias: "With Coconut",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01402"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Dengan Kelapa Sawit",
            alias: "With Oil Palm",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01403"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Dengan Lain-lain",
            alias: "Others",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01404"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Dengan Kelapa",
            alias: "With Coconut",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01407"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Dengan Kelapa Sawit",
            alias: "With Oil Palm",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01408"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Dengan Lain-lain",
            alias: "Others",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01409"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 3,
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: [
              "A01402",
              "A01403",
              "A01404",
              "A01407",
              "A01408",
              "A01409",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 3,
            text: "Cukup Umur",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01401", "A01402", "A01403", "A01404"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01406", "A01407", "A01408", "A01409"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01411"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "District"
                : "State",
            alignment: "center",
            bold: true,
            columnWidth: 110,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.stateName,
              value: context.row.stateName,
            }),
            valueAlignment: "center",
          },
          {
            rowSpan: 2,
            text: "Cukup Umur",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01401"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01406"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01406", "A01406"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 3,
            text: "Cukup Umur",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01402"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Dengan Kelapa Sawit",
            alias: "With Oil Palm",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01403"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Dengan Lain-lain",
            alias: "Others",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01404"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            colSpan: 3,
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01407"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Dengan Kelapa Sawit",
            alias: "With Oil Palm",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01408"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Dengan Lain-lain",
            alias: "Others",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01409"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: [
              "A01402",
              "A01403",
              "A01404",
              "A01407",
              "A01408",
              "A01409",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Cukup Umur",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01401", "A01402", "A01403", "A01404"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01406", "A01407", "A01408", "A01409"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            rowSpan: 2,
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01411"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "District"
                : "State",
            alignment: "center",
            bold: true,
            columnWidth: 110,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.stateName,
              value: context.row.stateName,
            }),
            valueAlignment: "center",
          },
          {
            text: "Cukup Umur",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01401"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01406"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01401", "A01406"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Dengan Kelapa",
            alias: "With Coconut",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01402"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Dengan Kelapa Sawit",
            alias: "With Oil Palm",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01403"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Dengan Lain-lain",
            alias: "Others",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01404"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Dengan Kelapa",
            alias: "With Coconut",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01407"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Dengan Kelapa Sawit",
            alias: "With Oil Palm",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01408"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Dengan Lain-lain",
            alias: "Others",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01409"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: [
              "A01402",
              "A01403",
              "A01404",
              "A01407",
              "A01408",
              "A01409",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Cukup Umur",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01401", "A01402", "A01403", "A01404"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01406", "A01407", "A01408", "A01409"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 45,
            hideColumnCodes: true,
            columnCodes: ["A01411"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
          },
        ],
      ],
    },
    "Jadual 7": {
      TITLE: `Jadual 7: Bilangan Estet Dan Luas Hektar Ditanam Di Estet Koko Mengikut Kumpulan Saiz Luas Hektar Properti Pada 31 Disember ${
        params.year - 1
      }: ${
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
      SUBTITLE: `Table 7: Number of Cocoa Estates And Planted Hectareage of Cocoa Estates by Planted Hectareage Size Group As At 31 December ${
        params.year - 1
      }: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      // BASE_FONT_SIZE: 10,
      PAGE_ORIENTATION: "portrait",
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      RESOLVE_ROWS: async () => {
        const foundValues = indexedValues.where({
          code: "A01411",
        });
        const estateIds = [...new Set(foundValues.map(v => v.estateId))];

        let filteredEstateIds = [];
        for (const estateId of estateIds) {
          const CODES = ["A01411"];
          let values = [];
          for (const code of CODES) {
            const foundValue = indexedValues.find({
              estateId,
              code,
            });
            if (!foundValue) {
              continue;
            }
            values.push(foundValue);
          }

          if (!values.length) continue;

          filteredEstateIds.push({
            estateId,
            values,
          });
        }
        // console.log(
        //   "filteredEstateIds",
        //   filteredEstateIds.length,
        //   // filteredEstateIds.map(i => i.),
        // );
        // throw {};

        let SIZES = [
          {
            label: "< 40.47",
            min: 0,
            max: 40.47,
          },
          {
            label: "40.47 - 100",
            min: 40.47,
            max: 100,
          },
          {
            label: "101 - 200",
            min: 101,
            max: 200,
          },
          {
            label: "201 - 300",
            min: 201,
            max: 300,
          },
        ];
        SIZES = SIZES.map(size => {
          let estateIds = filteredEstateIds
            .filter(info =>
              info.values.find(
                value =>
                  size.min - 0.5 <= value.value &&
                  value.value <= size.max + 0.5,
              ),
            )
            .map(i => i.estateId);

          return {
            ...size,
            estateIds,
          };
        });
        // throw {};

        return SIZES;
      },
      COLUMNS: [
        [
          {
            text: "Kumpulan Saiz Luas Hektar Yang Ditanam",
            alias: "Planted Hectareage Size Group",
            alignment: "center",
            bold: true,
            columnWidth: 160,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.label,
              value: context.row.label,
            }),
            valueAlignment: "center",
          },
          {
            text: "Bilangan Estet",
            alias: "Number of Estates",
            alignment: "center",
            bold: true,
            columnWidth: 90,
            hideColumnCodes: true,
            columnCodes: ["A01411"],
            statsPrecision: 0,
            resolveValue: context => ({
              text: context.row.estateIds.length || 0,
              value: context.row.estateIds.length || 0,
            }),
            // resolveValue: context => ({
            //   text: context.row.estateInformations.length || 0,
            //   value: context.row.estateInformations.length || 0,
            // }),
            valueAlignment: "center",
          },
          {
            text: "Cukup Umur",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 90,
            hideColumnCodes: true,
            columnCodes: ["A01405"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 90,
            hideColumnCodes: true,
            columnCodes: ["A01410"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 90,
            hideColumnCodes: true,
            columnCodes: ["A01405", "A01410"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 13": {
      TITLE: `Jadual 13: Tanaman Baru, Tanaman Semula dan Tanaman Dipulihkan Dalam Tahun ${
        params.year - 1
      } Mengikut Kumpulan Saiz Keluasan Tanaman: ${
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
      SUBTITLE: `Table 13: Newlyplanted, Replanted, and Rehabilitated Cocoa Area During ${
        params.year - 1
      } by Planted Hectarage Size Group: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
          // code: {
          //   $in: ["A01411", "A00311", "A00411", "B01505"],
          // },
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      // BASE_FONT_SIZE: 10,
      PAGE_ORIENTATION: "portrait",
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      RESOLVE_ROWS: async () => {
        await context.collection("EstateCensusMaklumatBorang").createIndex({
          censusYear: 1,
        });
        const allEstateCensusMaklumatBorang = await context
          .collection("EstateCensusMaklumatBorang")
          .find({
            censusYear: params.year,
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        // console.log(
        //   "allEstateCensusMaklumatBorang",
        //   allEstateCensusMaklumatBorang.length,
        // );
        const estateIds = [
          ...new Set(allEstateCensusMaklumatBorang.map(v => v.estateId)),
        ];

        const listValues = await context
          .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
          .find({
            censusYear: params.year,
            _deletedAt: {
              $exists: false,
            },
            code: {
              $in: ["A01411", "A00311", "A00411", "B01505"],
            },
          })
          .toArray();

        let indexedEstateCensusValues = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "censusYear", "code"],
          },
        });
        indexedEstateCensusValues.add(listValues);

        // console.log("estateIds", estateIds.length);

        // const foundValues = indexedValues.where({
        //   code: "A01411",
        // });
        // const estateIds = [...new Set(foundValues.map(v => v.estateId))];

        let filteredEstateIds = [];
        for (const estateId of estateIds) {
          const CODES = ["A01411"];
          let values = [];
          for (const code of CODES) {
            // console.log(indexedValues)
            // const foundValue = indexedValues.find({
            //   estateId,
            //   code,
            // });
            // console.log({ foundValue });
            // if (!foundValue) {
            //   continue;
            // }

            const foundValue = indexedEstateCensusValues.find({
              estateId,
              code,
            });

            if (!foundValue) {
              continue;
            }

            values.push(foundValue);
          }

          if (!values.length) continue;

          filteredEstateIds.push({
            estateId,
            values,
          });
        }
        // console.log(filteredEstateIds)
        // console.log(
        //   "filteredEstateIds",
        //   filteredEstateIds.length,
        //   // filteredEstateIds.map(i => i.),
        // );
        // throw {};

        let SIZES = [
          {
            label: "< 40.47",
            min: 0,
            max: 40.47,
          },
          {
            label: "40.47 - 100",
            min: 40.47,
            max: 100,
          },
          {
            label: "101 - 200",
            min: 101,
            max: 200,
          },
          {
            label: "201 - 300",
            min: 201,
            max: 300,
          },
        ];
        SIZES = SIZES.map(size => {
          let estateIds = filteredEstateIds
            .filter(info =>
              info.values.find(
                value =>
                  size.min - 0.5 <= value.value &&
                  value.value <= size.max + 0.5,
              ),
            )
            .map(i => i.estateId);

          return {
            ...size,
            estateIds,
          };
        });
        // throw {};

        return SIZES;
      },
      COLUMNS: [
        [
          {
            text: "Kumpulan Saiz Luas Hektar Yang Ditanam",
            alias: "Planted Hectareage Size Group",
            alignment: "center",
            bold: true,
            columnWidth: 160,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.label,
              value: context.row.label,
            }),
            valueAlignment: "center",
          },
          {
            text: "Bilangan Estet",
            alias: "Number of Estates",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => ({
              text: context.row.estateIds.length || 0,
              value: context.row.estateIds.length || 0,
            }),
            valueAlignment: "center",
          },
          {
            text: "Keluasan Tanaman Baru",
            alias: "Newlyplanted Hectareage",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["A00311"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Keluasan Tanaman Semula",
            alias: "Replanted Hectareage",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["A00411"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Keluasan Tanaman Dippulihkan",
            alias: "Rehabilitation Hectareage",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B01505"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 9": {
      TITLE: `Jadual 9: Pengeluaran Biji Koko Kering di Estet Koko Mengikut Negeri ${
        params.year - 1
      }: ${
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
      SUBTITLE: `Table 9: Production of Dry Cocoa Beans Of Cocoa Estates by State, ${
        params.year - 1
      }: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      // BASE_FONT_SIZE: 10,
      // PAGE_ORIENTATION: "portrait",
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      RESOLVE_ROWS: async () => {
        await context.collection("EstateCensusMaklumatBorang").createIndex({
          censusYear: 1,
        });
        const allEstateCensusMaklumatBorang = await context
          .collection("EstateCensusMaklumatBorang")
          .find({
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        indexedEstateCensusMaklumatBorang = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "censusYear", "estateStatus"],
          },
        });
        indexedEstateCensusMaklumatBorang.add(allEstateCensusMaklumatBorang);

        if (params.segment === "Sabah" || params.segment === "Sarawak") {
          let allDistricts = [];
          for (const state of allEstateCensusStateDistricts) {
            let allEstateInformations = indexedEstateInformations.where({
              stateCode: String(parseInt(state.stateCode)),
              districtCode: String(parseInt(state.districtCode)),
            });

            let filteredEstateInformations = [];
            for (const info of allEstateInformations) {
              // Aktif Saja
              if (
                process.env.NODE_ENV === "production" &&
                info.estateType !== 1 &&
                info.estateType !== "1"
              )
                continue;

              const foundYear = indexedEstateCensusYearLists.find({
                estateId: info.estateId,
              });
              if (!foundYear) continue;

              const foundValue = indexedValues.find({
                estateInformationId: info._id,
                // code: columnCode,
              });
              // console.log({ info }, !!foundValue);
              if (!foundValue) continue;

              filteredEstateInformations.push(info);
            }

            if (!filteredEstateInformations.length) continue;

            allDistricts.push({
              ...state,
              estateInformations: filteredEstateInformations,
            });
            // console.log(
            //   "filteredEstateInformations",
            //   state.stateCode,
            //   state.stateName,
            //   filteredEstateInformations.length,
            // );
          }

          return allDistricts.map(i => {
            return {
              ...i,
              stateName: i.districtName || i.stateName || "",
            };
          });
        }

        let allStates = [];
        for (const state of allEstateCensusStateCodes) {
          let allEstateInformations = indexedEstateInformations.where({
            stateCode: String(parseInt(state.stateCode)),
          });

          let filteredEstateInformations = [];
          for (const info of allEstateInformations) {
            // Aktif Saja
            const maklumatBorang = indexedEstateCensusMaklumatBorang.where({
              estateId: info.estateId,
              censusYear: params.year,
            });

            // if (maklumatBorang.length > 0) continue;
            // if (
            //   process.env.NODE_ENV === "production" &&
            //   info.estateType !== 1 &&
            //   info.estateType !== "1"
            // )
            //   continue;

            if (
              process.env.NODE_ENV === "production" &&
              maklumatBorang.length > 0
            )
              continue;

            // const foundYear = indexedEstateCensusYearLists.find({
            //   estateId: info.estateId,
            // });
            // if (!foundYear) continue;

            const foundValue = indexedValues.find({
              estateInformationId: info._id,
              // code: columnCode,
            });
            // console.log({ info }, !!foundValue);
            if (!foundValue) continue;

            filteredEstateInformations.push(info);
          }

          if (!filteredEstateInformations.length) continue;

          allStates.push({
            ...state,
            estateInformations: filteredEstateInformations,
          });
          // console.log(
          //   "filteredEstateInformations",
          //   state.stateCode,
          //   state.stateName,
          //   filteredEstateInformations.length,
          // );
        }

        allStates = allStates.map(state => {
          const estateIds = (state.estateInformations || []).map(
            i => i.estateId,
          );

          let filteredEstateIds = [];
          for (const estateId of estateIds) {
            const CODES = ["A01411"];
            let values = [];
            for (const code of CODES) {
              const foundValue = indexedValues.find({
                estateId,
                code,
              });
              if (!foundValue) {
                continue;
              }
              values.push(foundValue);
            }

            if (!values.length) continue;

            filteredEstateIds.push({
              estateId,
              values,
            });
          }

          return {
            ...state,
            // estateIds: filteredEstateIds,
            countEstateIds: filteredEstateIds.length,
          };
        });

        return allStates;
      },
      COLUMNS: [
        [
          {
            rowSpan: 2,
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "District"
                : "State",
            alignment: "center",
            bold: true,
            columnWidth: 110,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.stateName,
              value: context.row.stateName,
            }),
            valueAlignment: "center",
          },
          {
            colSpan: 6,
            text: "Estet",
            alias: "Estates",
            alignment: "center",
            bold: true,
            columnWidth: 107,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => ({
              text: context.row.countEstateIds || 0,
              value: context.row.countEstateIds || 0,
            }),
            valueAlignment: "center",
          },
          {
            text: "Luas Hektar Yang Ditanam",
            alias: "Planted Hectareage\nHektar\nHectare",
            alignment: "center",
            bold: true,
            columnWidth: 107,
            hideColumnCodes: true,
            columnCodes: ["A01411"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Jumlah Keluasan Dipetik",
            alias: "Total Harvested Area\nHektar\nHectare",
            alignment: "center",
            bold: true,
            columnWidth: 107,
            hideColumnCodes: true,
            columnCodes: ["D03201"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Luas Hektar yang Mengeluarkan Hasil",
            alias: "Hectareage in Production\nHektar\nHectare",
            alignment: "center",
            bold: true,
            columnWidth: 107,
            hideColumnCodes: true,
            columnCodes: ["A01405"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Pengeluaran Biji Koko Kering",
            alias: "Production of Dry Cocoa Beans\nTan\nTonne",
            alignment: "center",
            bold: true,
            columnWidth: 107,
            hideColumnCodes: true,
            columnCodes: ["D03401"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value } = sumAllColumnCodesValue(context);
              value = value ? Math.round(value / 1000.0) : 0;
              return { value, text: value };
            },
            valueAlignment: "center",
          },
          {
            text: "Hasil Sehektar",
            alias: "Yield Per Hectare\nKilogram",
            alignment: "center",
            bold: true,
            columnWidth: 107,
            hideColumnCodes: true,
            columnCodes: ["D03201"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueD03201 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["D03201"],
                },
              });
              let { value: valueD03401 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["D03401"],
                },
              });
              // console.log({
              //   valueD03201,
              //   valueD03401,
              // });
              let value =
                valueD03201 !== 0 && valueD03401 !== 0
                  ? Math.round(valueD03201 / (valueD03401 / 1000.0))
                  : 0;
              return {
                valueD03201,
                valueD03401,
                value,
                text: value,
              };
            },
            resolveTotalValue: context => {
              let sumD03201 = 0,
                sumD03401 = 0;
              for (const result of context.rowResults) {
                console.log({ result });
                sumD03201 += result.valueD03201;
                sumD03401 += result.valueD03401;
              }
              let value =
                sumD03201 !== 0 && sumD03401 !== 0
                  ? Math.round(sumD03201 / (sumD03401 / 1000.0))
                  : 0;
              return value;
            },
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "District"
                : "State",
            alignment: "center",
            bold: true,
            columnWidth: 110,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.stateName,
              value: context.row.stateName,
            }),
            valueAlignment: "center",
          },
          {
            text: "Bilangan Estet",
            alias: "Number of Estates",
            alignment: "center",
            bold: true,
            columnWidth: 107,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => ({
              text: context.row.estateInformations.length || 0,
              value: context.row.estateInformations.length || 0,
            }),
            valueAlignment: "center",
          },
          {
            text: "Luas Hektar Yang Ditanam",
            alias: "Planted Hectareage\nHektar\nHectare",
            alignment: "center",
            bold: true,
            columnWidth: 107,
            hideColumnCodes: true,
            columnCodes: ["A01411"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Jumlah Keluasan Dipetik",
            alias: "Total Harvested Area\nHektar\nHectare",
            alignment: "center",
            bold: true,
            columnWidth: 107,
            hideColumnCodes: true,
            columnCodes: ["D03201"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Luas Hektar yang Mengeluarkan Hasil",
            alias: "Hectareage in Production\nHektar\nHectare",
            alignment: "center",
            bold: true,
            columnWidth: 107,
            hideColumnCodes: true,
            columnCodes: ["A01405"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Pengeluaran Biji Koko Kering",
            alias: "Production of Dry Cocoa Beans\nTan\nTonne",
            alignment: "center",
            bold: true,
            columnWidth: 107,
            hideColumnCodes: true,
            columnCodes: ["D03401"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value } = sumAllColumnCodesValue(context);
              value = value ? Math.round(value / 1000.0) : 0;
              return { value, text: value };
            },
            valueAlignment: "center",
          },
          {
            text: "Hasil Sehektar",
            alias: "Yield Per Hectare\nKilogram",
            alignment: "center",
            bold: true,
            columnWidth: 107,
            hideColumnCodes: true,
            columnCodes: ["D03201"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueD03201 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["D03201"],
                },
              });
              let { value: valueD03401 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["D03401"],
                },
              });
              // console.log({
              //   valueD03201,
              //   valueD03401,
              // });
              // let value =
              //   valueD03201 !== 0 && valueD03401 !== 0
              //     ? Math.round(valueD03201 / (valueD03401 / 1000.0))
              //     : 0;
              let value = 0;
              if (valueD03201 !== 0) {
                value = Math.round(valueD03401 / valueD03201);
              }
              return {
                valueD03201,
                valueD03401,
                value,
                text: value,
              };
            },
            resolveTotalValue: context => {
              let sumD03201 = 0,
                sumD03401 = 0;
              for (const result of context.rowResults) {
                // console.log({ result });
                sumD03201 += result.valueD03201;
                sumD03401 += result.valueD03401;
              }

              // let value =
              //   sumD03201 !== 0 && sumD03401 !== 0
              //     ? Math.round(sumD03201 / (sumD03401 / 1000.0))
              //     : 0;
              let value = 0;
              if (sumD03201 !== 0) {
                value = Math.round(sumD03401 / sumD03201);
              }
              return value;
            },
            valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 12": {
      TITLE: `Jadual 12: Pengeluaran Biji Koko Kering dan Hasil Sehektar Di Estet Koko, ${
        params.year - 5
      }-${params.year - 1}: ${
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
      SUBTITLE: `Table 12: Production of Dry Cocoa Beans and Yield Per Hecatare Of Cocoa Estates,  ${
        params.year - 5
      }-${params.year - 1}: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          censusYear: {
            $in: [
              params.year - 5 + 1,
              params.year - 4 + 1,
              params.year - 3 + 1,
              params.year - 2 + 1,
              params.year - 1 + 1,
            ],
          },
        },
        EstateCensusYearLists: {
          year: {
            $in: [
              params.year - 5 + 1,
              params.year - 4 + 1,
              params.year - 3 + 1,
              params.year - 2 + 1,
              params.year - 1 + 1,
            ],
          },
        },
      },
      // BASE_FONT_SIZE: 10,
      PAGE_ORIENTATION: "portrait",
      GROUPED_FOOTERS_CONFIG: [
        //
        // "allStats",
      ],
      RESOLVE_ROWS: async () => {
        await context.collection("EstateCensusMaklumatBorang").createIndex({
          censusYear: 1,
        });
        const allEstateCensusMaklumatBorang = await context
          .collection("EstateCensusMaklumatBorang")
          .find({
            _deletedAt: {
              $exists: false,
            },
            estateStatus: {
              $in: ["Aktif", "Terbiar", "Tiada"],
            },
          })
          .toArray();
        indexedEstateCensusMaklumatBorang = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "censusYear"],
          },
        });
        indexedEstateCensusMaklumatBorang.add(allEstateCensusMaklumatBorang);

        let YEARS = [
          params.year - 5,
          params.year - 4,
          params.year - 3,
          params.year - 2,
          params.year - 1,
        ];

        let rows = [];
        for (const year of YEARS) {
          const foundEstateCensusMaklumatBorang =
            indexedEstateCensusMaklumatBorang.where({
              censusYear: year + 1,
            });

          const estateIds = [
            ...new Set(foundEstateCensusMaklumatBorang.map(i => i.estateId)),
          ];

          const values = await context
            .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
            .find({
              censusYear: year + 1,
              _deletedAt: {
                $exists: false,
              },
            })
            .toArray();

          const valueD03201 = lodash.round(
            values
              .filter(vl => vl.code === "D03201")
              .map(v => v.value)
              .reduce((acc, curr) => acc + curr),
            0,
          );

          const sumD03401 = values
            .filter(vl => vl.code === "D03401")
            .map(v => v.value)
            .reduce((acc, curr) => acc + curr);

          const sumD03201 = values
            .filter(vl => vl.code === "D03201")
            .map(v => v.value)
            .reduce((acc, curr) => acc + curr);

          const valueD03401 = lodash.round(
            values
              .filter(vl => vl.code === "D03401")
              .map(v => v.value)
              .reduce((acc, curr) => acc + curr) / 1000,
            0,
          );

          rows.push({
            year,
            estateIds,
            valueD03201,
            valueD03401,
            sumD03401,
            sumD03201,
          });
        }

        return rows;
      },
      COLUMNS: [
        [
          {
            text: "Tahun",
            alias: "Year",
            alignment: "center",
            bold: true,
            columnWidth: 110,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.year,
              value: context.row.year,
            }),
            valueAlignment: "center",
          },
          {
            text: "Bilangan Estet",
            alias: "Number of Estates",
            alignment: "center",
            bold: true,
            columnWidth: 101,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => ({
              text: context.row.estateIds.length || 0,
              value: context.row.estateIds.length || 0,
            }),
            valueAlignment: "center",
          },
          {
            text: "Luas Hektar Yang Ditanam",
            alias: "Planted Hectareage\nHektar\nHectare",
            alignment: "center",
            bold: true,
            columnWidth: 101,
            hideColumnCodes: true,
            columnCodes: ["D03201"],
            statsPrecision: 0,
            // resolveValue: sumAllColumnCodesValue,
            resolveValue: context => {
              return {
                text: context.row.valueD03201,
                value: context.row.valueD03201,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Pengeluaran Biji Koko Kering",
            alias: "Production of Dry Cocoa Beans\nTan\nTonne",
            alignment: "center",
            bold: true,
            columnWidth: 101,
            hideColumnCodes: true,
            columnCodes: ["D03401"],
            statsPrecision: 0,
            // resolveValue: context => {
            //   let { value } = sumAllColumnCodesValue(context);
            //   value = value ? Math.round(value / 1000.0) : 0;
            //   return { value, text: value };
            // },
            resolveValue: context => {
              return {
                text: context.row.valueD03401,
                value: context.row.valueD03401,
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Hasil Sehektar Dipetik",
            alias: "Yield of Harvested Area Per Hectare\nKilogram",
            alignment: "center",
            bold: true,
            columnWidth: 101,
            hideColumnCodes: true,
            columnCodes: ["D03201"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueD03201 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["D03201"],
                },
              });
              let { value: valueD03401 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["D03401"],
                },
              });
              // console.log({
              //   valueD03201,
              //   valueD03401,
              // });
              // let value =
              //   valueD03201 !== 0 && valueD03401 !== 0
              //     ? Math.round(valueD03201 / (valueD03401 / 1000.0))
              //     : 0;

              let value = 0;
              if (context.row.valueD03201 !== 0) {
                value = lodash.round(
                  context.row.sumD03401 / context.row.sumD03201,
                  0,
                );
              }
              return {
                valueD03201,
                valueD03401,
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 11": {
      TITLE: `Jadual 11: Pengeluaran Biji Koko Kering Di Estet Koko Mengikut Taraf Sah Dan Hak Milik, ${
        params.year - 1
      }: ${
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
      SUBTITLE: `Table 11: Production of Dry Cocoa Beans on Cocoa Estates by Legal Status and Ownership, ${
        params.year - 1
      }: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      PAGE_ORIENTATION: "portrait",
      // BASE_FONT_SIZE: 10,
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      RESOLVE_ROWS: async () => {
        await context.collection("EstateCensusMaklumatBorang").createIndex({
          censusYear: 1,
        });
        const allEstateCensusMaklumatBorang = await context
          .collection("EstateCensusMaklumatBorang")
          .find({
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        indexedEstateCensusMaklumatBorang = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "censusYear", "estateStatus"],
          },
        });
        indexedEstateCensusMaklumatBorang.add(allEstateCensusMaklumatBorang);

        await context.collection("EstateCensusTarafSah").createIndex({
          censusYear: 1,
        });
        const allEstateCensusTarafSah = await context
          .collection("EstateCensusTarafSah")
          .find({
            censusYear: params.year,
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        // console.log("allEstateCensusTarafSah", allEstateCensusTarafSah.length);
        indexedEstateCensusTarafSah = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "legalStatus"],
          },
        });
        indexedEstateCensusTarafSah.add(allEstateCensusTarafSah);

        const allRefComStatuses = await context
          .collection("RefComStatuses")
          .find({
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        let TARAF_SAH_LEGAL_STATUS = allRefComStatuses.map(i => i.comStatus);
        // console.log({ TARAF_SAH_LEGAL_STATUS });
        TARAF_SAH_LEGAL_STATUS = TARAF_SAH_LEGAL_STATUS.map(legalStatus => {
          const foundTarafSah = indexedEstateCensusTarafSah.where({
            legalStatus,
          });
          // const estateIds = [...new Set(foundTarafSah.map(i => i.estateId))];
          const estateIds = [...foundTarafSah.map(i => i.estateId)];
          return {
            legalStatus,
            estateIds,
          };
        });
        TARAF_SAH_LEGAL_STATUS = TARAF_SAH_LEGAL_STATUS.filter(
          tf => tf.estateIds.length > 0,
        );

        // console.log(TARAF_SAH_LEGAL_STATUS);
        return TARAF_SAH_LEGAL_STATUS;
      },
      COLUMNS: [
        [
          {
            rowSpan: 2,
            text: "Taraf Sah",
            alias: "Legal Status",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.legalStatus,
              value: context.row.legalStatus,
            }),
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Hak Milik",
            alias: "Ownership",
            alignment: "center",
            bold: true,
            columnWidth: 119,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "Q00337"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;
              // console.log({
              //   JenisHakMilik,
              //   valueQ00310,
              //   valueQ00318,
              //   valueQ00337,
              // });

              if (JenisHakMilik) {
                let { value: valueQ003410 } = sumAllColumnCodesValue({
                  ...context,
                  spec: {
                    ...context.spec,
                    columnCodes: ["Q003410"],
                  },
                });

                let value = valueQ003410 ? Math.round(valueQ003410 / 1000) : 0;
                return {
                  value,
                  text: value,
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            text: "Bukan Warganegara Malaysia",
            alias: "Non-Malaysian Residents",
            alignment: "center",
            bold: true,
            columnWidth: 119,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "Q00337"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              if (JenisHakMilik) {
                return {
                  value: 0,
                  text: 0,
                };
              } else {
                let { value: valueQ003410 } = sumAllColumnCodesValue({
                  ...context,
                  spec: {
                    ...context.spec,
                    columnCodes: ["Q003410"],
                  },
                });

                let value = valueQ003410 ? Math.round(valueQ003410 / 1000) : 0;
                return {
                  value,
                  text: value,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            rowSpan: 2,
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 119,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "Q00337"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ003410 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q003410"],
                },
              });

              let value = valueQ003410 ? Math.round(valueQ003410 / 1000) : 0;
              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
        ],
        [
          {
            text: "Taraf Sah",
            alias: "Legal Status",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.legalStatus,
              value: context.row.legalStatus,
            }),
            valueAlignment: "center",
          },
          {
            text: "Warganegara Malaysia",
            alias: "Malaysian Residents",
            alignment: "center",
            bold: true,
            columnWidth: 119,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "Q00337", "D03401"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;
              // console.log({
              //   JenisHakMilik,
              //   valueQ00310,
              //   valueQ00318,
              //   valueQ00337,
              // });

              if (JenisHakMilik) {
                let { value: valueD03401 } = sumAllColumnCodesValue({
                  ...context,
                  spec: {
                    ...context.spec,
                    columnCodes: ["D03401"],
                  },
                });

                let value = valueD03401 ? Math.round(valueD03401 / 1000) : 0;
                return {
                  value,
                  text: value,
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            text: "Bukan Warganegara Malaysia",
            alias: "Non-Malaysian Residents",
            alignment: "center",
            bold: true,
            columnWidth: 119,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "Q00337", "D03401"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              if (JenisHakMilik) {
                return {
                  value: 0,
                  text: 0,
                };
              } else {
                let { value: valueD03401 } = sumAllColumnCodesValue({
                  ...context,
                  spec: {
                    ...context.spec,
                    columnCodes: ["D03401"],
                  },
                });

                let value = valueD03401 ? Math.round(valueD03401 / 1000) : 0;
                return {
                  value,
                  text: value,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 119,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "Q00337", "D03401"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueD03401 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["D03401"],
                },
              });

              let value = valueD03401 ? Math.round(valueD03401 / 1000) : 0;
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
    "Jadual 10": {
      TITLE: `Jadual 10: Pengeluaran Biji Koko Kering Di Estet Koko Mengikut Negeri Dan Hak Milik, ${
        params.year - 1
      }: ${
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
      SUBTITLE: `Table 10: Production of Dry Cocoa Beans on Cocoa Estates by State and Ownership, ${
        params.year - 1
      }: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      PAGE_ORIENTATION: "portrait",
      // BASE_FONT_SIZE: 10,
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      RESOLVE_ROWS: async () => {
        await context.collection("EstateCensusMaklumatBorang").createIndex({
          censusYear: 1,
        });
        const allEstateCensusMaklumatBorang = await context
          .collection("EstateCensusMaklumatBorang")
          .find({
            censusYear: params.year,
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        indexedEstateCensusMaklumatBorang = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "censusYear"],
          },
        });
        indexedEstateCensusMaklumatBorang.add(allEstateCensusMaklumatBorang);

        if (params.segment === "Sabah" || params.segment === "Sarawak") {
          let allDistricts = [];
          for (const state of allEstateCensusStateDistricts) {
            let allEstateInformations = indexedEstateInformations.where({
              stateCode: String(parseInt(state.stateCode)),
              districtCode: String(parseInt(state.districtCode)),
            });

            let filteredEstateInformations = [];
            for (const info of allEstateInformations) {
              // Aktif Saja
              if (
                process.env.NODE_ENV === "production" &&
                info.estateType !== 1 &&
                info.estateType !== "1"
              )
                continue;

              const foundYear = indexedEstateCensusYearLists.find({
                estateId: info.estateId,
              });
              if (!foundYear) continue;

              const foundValue = indexedValues.find({
                estateInformationId: info._id,
                // code: columnCode,
              });
              // console.log({ info }, !!foundValue);
              if (!foundValue) continue;

              filteredEstateInformations.push(info);
            }

            if (!filteredEstateInformations.length) continue;

            allDistricts.push({
              ...state,
              estateInformations: filteredEstateInformations,
            });
            // console.log(
            //   "filteredEstateInformations",
            //   state.stateCode,
            //   state.stateName,
            //   filteredEstateInformations.length,
            // );
          }

          return allDistricts.map(i => {
            return {
              ...i,
              stateName: i.districtName || i.stateName || "",
            };
          });
        }

        let allStates = [];
        for (const state of allEstateCensusStateCodes) {
          let allEstateInformations = indexedEstateInformations.where({
            stateCode: String(parseInt(state.stateCode)),
          });

          let filteredEstateInformations = [];
          for (const info of allEstateInformations) {
            // Aktif Saja
            if (
              process.env.NODE_ENV === "production" &&
              info.estateType !== 1 &&
              info.estateType !== "1"
            )
              continue;

            const foundYear = indexedEstateCensusYearLists.find({
              estateId: info.estateId,
            });
            if (!foundYear) continue;

            const foundValue = indexedValues.find({
              estateInformationId: info._id,
              // code: columnCode,
            });
            // console.log({ info }, !!foundValue);
            if (!foundValue) continue;

            filteredEstateInformations.push(info);
          }

          if (!filteredEstateInformations.length) continue;

          allStates.push({
            ...state,
            estateInformations: filteredEstateInformations,
          });
          // console.log(
          //   "filteredEstateInformations",
          //   state.stateCode,
          //   state.stateName,
          //   filteredEstateInformations.length,
          // );
        }

        allStates = allStates.map(state => {
          let estateIds = (state.estateInformations || []).map(i => i.estateId);
          estateIds = estateIds.filter(estateId => {
            const foundEstateCensusMaklumatBorang =
              indexedEstateCensusMaklumatBorang.where({
                estateId,
              });

            return foundEstateCensusMaklumatBorang.length > 0;
          });

          // console.log(state.stateName, estateIds);
          return { ...state, estateIds };
        });

        // console.log({ allStates });
        return allStates;
      },
      COLUMNS: [
        [
          {
            rowSpan: 2,
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "District"
                : "State",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.stateName,
              value: context.row.stateName,
            }),
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Hak Milik",
            alias: "Ownership",
            alignment: "center",
            bold: true,
            columnWidth: 119,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "Q00337"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;
              // console.log({
              //   JenisHakMilik,
              //   valueQ00310,
              //   valueQ00318,
              //   valueQ00337,
              // });

              if (JenisHakMilik) {
                let { value: valueQ003410 } = sumAllColumnCodesValue({
                  ...context,
                  spec: {
                    ...context.spec,
                    columnCodes: ["Q003410"],
                  },
                });

                let value = valueQ003410 ? Math.round(valueQ003410 / 1000) : 0;
                return {
                  value,
                  text: value,
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            text: "Bukan Warganegara Malaysia",
            alias: "Non-Malaysian Residents",
            alignment: "center",
            bold: true,
            columnWidth: 119,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "Q00337"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              if (JenisHakMilik) {
                return {
                  value: 0,
                  text: 0,
                };
              } else {
                let { value: valueQ003410 } = sumAllColumnCodesValue({
                  ...context,
                  spec: {
                    ...context.spec,
                    columnCodes: ["Q003410"],
                  },
                });

                let value = valueQ003410 ? Math.round(valueQ003410 / 1000) : 0;
                return {
                  value,
                  text: value,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            rowSpan: 2,
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 119,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "Q00337"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ003410 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q003410"],
                },
              });

              let value = valueQ003410 ? Math.round(valueQ003410 / 1000) : 0;
              return {
                value,
                text: value,
              };
            },
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "District"
                : "State",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.stateName,
              value: context.row.stateName,
            }),
            valueAlignment: "center",
          },
          {
            text: "Warganegara Malaysia",
            alias: "Malaysian Residents",
            alignment: "center",
            bold: true,
            columnWidth: 119,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "Q00337", "D03401"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;
              // console.log({
              //   JenisHakMilik,
              //   valueQ00310,
              //   valueQ00318,
              //   valueQ00337,
              // });

              if (JenisHakMilik) {
                let { value: valueD03401 } = sumAllColumnCodesValue({
                  ...context,
                  spec: {
                    ...context.spec,
                    columnCodes: ["D03401"],
                  },
                });

                let value = valueD03401 ? Math.round(valueD03401 / 1000) : 0;
                // console.log({
                //   value,
                //   valueD03401,
                // });
                return {
                  value,
                  text: value,
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            text: "Bukan Warganegara Malaysia",
            alias: "Non-Malaysian Residents",
            alignment: "center",
            bold: true,
            columnWidth: 119,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "Q00337", "D03401"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              if (JenisHakMilik) {
                return {
                  value: 0,
                  text: 0,
                };
              } else {
                let { value: valueD03401 } = sumAllColumnCodesValue({
                  ...context,
                  spec: {
                    ...context.spec,
                    columnCodes: ["D03401"],
                  },
                });

                let value = valueD03401 ? Math.round(valueD03401 / 1000) : 0;
                return {
                  value,
                  text: value,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 119,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "Q00337", "D03401"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueD03401 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["D03401"],
                },
              });

              let value = valueD03401 ? Math.round(valueD03401 / 1000) : 0;
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
    "Jadual 3": {
      TITLE: `Jadual 3: Luas Kawasan Ditanam Di Estet Koko Mengikut Hak Milik Dan Negeri, ${
        params.year - 1
      }: ${
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
      SUBTITLE: `Table 3: Planted Hectareage of Cocoa Estates by Ownership and States, ${
        params.year - 1
      }: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      // PAGE_ORIENTATION: "portrait",
      // BASE_FONT_SIZE: 10,
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      RESOLVE_ROWS: async () => {
        await context.collection("EstateCensusMaklumatBorang").createIndex({
          censusYear: 1,
        });
        const allEstateCensusMaklumatBorang = await context
          .collection("EstateCensusMaklumatBorang")
          .find({
            censusYear: params.year,
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        indexedEstateCensusMaklumatBorang = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "censusYear"],
          },
        });
        indexedEstateCensusMaklumatBorang.add(allEstateCensusMaklumatBorang);

        if (params.segment === "Sabah" || params.segment === "Sarawak") {
          let allDistricts = [];
          for (const state of allEstateCensusStateDistricts) {
            let allEstateInformations = indexedEstateInformations.where({
              stateCode: String(parseInt(state.stateCode)),
              districtCode: String(parseInt(state.districtCode)),
            });

            let filteredEstateInformations = [];
            for (const info of allEstateInformations) {
              // Aktif Saja
              if (
                process.env.NODE_ENV === "production" &&
                info.estateType !== 1 &&
                info.estateType !== "1"
              )
                continue;

              const foundYear = indexedEstateCensusYearLists.find({
                estateId: info.estateId,
              });
              if (!foundYear) continue;

              const foundValue = indexedValues.find({
                estateInformationId: info._id,
                // code: columnCode,
              });
              // console.log({ info }, !!foundValue);
              if (!foundValue) continue;

              filteredEstateInformations.push(info);
            }

            if (!filteredEstateInformations.length) continue;

            allDistricts.push({
              ...state,
              estateInformations: filteredEstateInformations,
            });
            // console.log(
            //   "filteredEstateInformations",
            //   state.stateCode,
            //   state.stateName,
            //   filteredEstateInformations.length,
            // );
          }

          return allDistricts.map(i => {
            return {
              ...i,
              stateName: i.districtName || i.stateName || "",
            };
          });
        }

        let allStates = [];
        for (const state of allEstateCensusStateCodes) {
          let allEstateInformations = indexedEstateInformations.where({
            stateCode: String(parseInt(state.stateCode)),
          });

          let filteredEstateInformations = [];
          for (const info of allEstateInformations) {
            // Aktif Saja
            // if (
            //   process.env.NODE_ENV === "production" &&
            //   info.estateType !== 1 &&
            //   info.estateType !== "1"
            // )
            //   continue;

            // const foundYear = indexedEstateCensusYearLists.find({
            //   estateId: info.estateId,
            // });

            // if (!foundYear) continue;

            const maklumatBorang = indexedEstateCensusMaklumatBorang.where({
              estateId: info.estateId,
              censusYear: params.year,
            });

            // if (maklumatBorang.length > 0) continue;
            // if (
            //   process.env.NODE_ENV === "production" &&
            //   info.estateType !== 1 &&
            //   info.estateType !== "1"
            // )
            //   continue;

            if (
              process.env.NODE_ENV === "production" &&
              maklumatBorang.length > 0
            )
              continue;

            const foundValue = indexedValues.find({
              estateInformationId: info._id,
              // code: columnCode,
            });
            // console.log({ info }, !!foundValue);
            if (!foundValue) continue;

            filteredEstateInformations.push(info);
          }

          if (!filteredEstateInformations.length) continue;

          allStates.push({
            ...state,
            estateInformations: filteredEstateInformations,
          });
          // console.log(
          //   "filteredEstateInformations",
          //   state.stateCode,
          //   state.stateName,
          //   filteredEstateInformations.length,
          // );
        }

        allStates = allStates.map(state => {
          let estateIds = (state.estateInformations || []).map(i => i.estateId);
          estateIds = estateIds.filter(estateId => {
            const foundEstateCensusMaklumatBorang =
              indexedEstateCensusMaklumatBorang.where({
                estateId,
              });

            return foundEstateCensusMaklumatBorang.length > 0;
          });

          return { ...state, estateIds };
        });

        // console.log({ allStates });
        return allStates;
      },
      COLUMNS: [
        [
          {
            rowSpan: 2,
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "District"
                : "State",
            alignment: "center",
            bold: true,
            columnWidth: 110,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.stateName,
              value: context.row.stateName,
            }),
            valueAlignment: "center",
          },
          {
            colSpan: 3,
            text: "Warganegara Malaysia (Hektar)",
            alias: "Malaysian Residents (Hectare)",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01405", "A01410"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Cukup",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01405", "A01410"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01405", "A01410"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          //
          {
            colSpan: 3,
            text: "Bukan Warganegara Malaysia (Hektar)",
            alias: "Non Malaysian Residents (Hectare)",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01405", "A01410"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Cukup",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01405", "A01410"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01405", "A01410"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          //
          {
            colSpan: 3,
            text: "Jumlah (Hektar)",
            alias: "total (Hectare)",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01405", "A01410"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Cukup",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01405", "A01410"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01405", "A01410"],
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
            alias:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "District"
                : "State",
            alignment: "center",
            bold: true,
            columnWidth: 110,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.stateName,
              value: context.row.stateName,
            }),
            valueAlignment: "center",
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["A01405", "A01410"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Cukup",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["A01405"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["A01410"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          //
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01405", "A01410"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;
              // console.log({
              //   JenisHakMilik,
              //   valueQ00310,
              //   valueQ00318,
              //   valueQ00337,
              // });

              if (!JenisHakMilik) {
                let { value: valueA01410 } = sumAllColumnCodesValue({
                  ...context,
                  spec: {
                    ...context.spec,
                    columnCodes: ["A01410"],
                  },
                });
                // valueA01410 = valueA01410 ? Math.round(valueA01410 / 1000) : 0;

                let { value: valueA01405 } = sumAllColumnCodesValue({
                  ...context,
                  spec: {
                    ...context.spec,
                    columnCodes: ["A01405"],
                  },
                });
                // valueA01405 = valueA01405 ? Math.round(valueA01405 / 1000) : 0;

                let value = valueA01410 + valueA01405;

                return {
                  value,
                  text: formatNumber(value, context.spec.statsPrecision || 0),
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            text: "Cukup",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01405", "A01410"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;
              // console.log({
              //   JenisHakMilik,
              //   valueQ00310,
              //   valueQ00318,
              //   valueQ00337,
              // });

              if (!JenisHakMilik) {
                let { value: valueA01405 } = sumAllColumnCodesValue({
                  ...context,
                  spec: {
                    ...context.spec,
                    columnCodes: ["A01405"],
                  },
                });
                // let value = valueA01405 ? Math.round(valueA01405 / 1000) : 0;
                let value = valueA01405;

                return {
                  value,
                  text: formatNumber(value, context.spec.statsPrecision || 0),
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01405", "A01410"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;
              // console.log({
              //   JenisHakMilik,
              //   valueQ00310,
              //   valueQ00318,
              //   valueQ00337,
              // });

              if (!JenisHakMilik) {
                let { value: valueA01410 } = sumAllColumnCodesValue({
                  ...context,
                  spec: {
                    ...context.spec,
                    columnCodes: ["A01410"],
                  },
                });
                // let value = valueA01410 ? Math.round(valueA01410 / 1000) : 0;
                let value = valueA01410;

                return {
                  value,
                  text: formatNumber(value, context.spec.statsPrecision || 0),
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          //
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01405", "A01410"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueA01410 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["A01410"],
                },
              });
              // valueA01410 = valueA01410 ? Math.round(valueA01410 / 1000) : 0;

              let { value: valueA01405 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["A01405"],
                },
              });
              // valueA01405 = valueA01405 ? Math.round(valueA01405 / 1000) : 0;

              let value = valueA01410 + valueA01405;

              return {
                value,
                text: formatNumber(value, context.spec.statsPrecision || 0),
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Cukup",
            alias: "Mature",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01405", "A01410"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueA01405 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["A01405"],
                },
              });
              // let value = valueA01405 ? Math.round(valueA01405 / 1000) : 0;
              let value = valueA01405;

              return {
                value,
                text: formatNumber(value, context.spec.statsPrecision || 0),
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Muda",
            alias: "Immature",
            alignment: "center",
            bold: true,
            columnWidth: 69,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01405", "A01410"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueA01410 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["A01410"],
                },
              });
              // let value = valueA01410 ? Math.round(valueA01410 / 1000) : 0;
              let value = valueA01410;

              return {
                value,
                text: formatNumber(value, context.spec.statsPrecision || 0),
              };
            },
            valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 4": {
      TITLE: `Jadual 4: Bilangan Estet Koko Mengikuti Taraf Sah, Hakmilik, Dan Kumpulan Saiz Luas Hektar Ditanam Seperti Pada 31 Disember ${
        params.year - 1
      }: ${
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
      SUBTITLE: `Table 4: Number of Cocoa Estates by Legal Status, Ownership and Planted Hecterage Size Group, as at 31 December, ${
        params.year - 1
      }: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      // PAGE_ORIENTATION: "portrait",
      // BASE_FONT_SIZE: 10,
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      BASE_FONT_SIZE: 10,
      RESOLVE_ROWS: async () => {
        await context.collection("EstateCensusTarafSah").createIndex({
          censusYear: 1,
        });
        const allEstateCensusTarafSah = await context
          .collection("EstateCensusTarafSah")
          .find({
            // censusYear: params.year - 1,
            censusYear: params.year,
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        // console.log("allEstateCensusTarafSah", allEstateCensusTarafSah.length);
        indexedEstateCensusTarafSah = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId"],
          },
        });
        indexedEstateCensusTarafSah.add(allEstateCensusTarafSah);

        await context
          .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
          .createIndex({
            censusYear: 1,
          });
        const allEstateCensusHakMilikPertubuhanAndSeksyenValues = await context
          .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
          .find({
            // censusYear: params.year - 1,
            censusYear: params.year,
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        // console.log("allEstateCensusHakMilikPertubuhanAndSeksyenValues", allEstateCensusHakMilikPertubuhanAndSeksyenValues.length);
        indexedEstateCensusHakMilikPertubuhanAndSeksyenValues = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "code"],
          },
        });
        indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.add(
          allEstateCensusHakMilikPertubuhanAndSeksyenValues,
        );

        let filteredEstateInformations = [];
        for (const info of allEstateInformations) {
          // Aktif Saja

          //################ ORIGINAL ################
          // if (
          //   process.env.NODE_ENV === "production" &&
          //   info.estateType !== 1 &&
          //   info.estateType !== "1"
          // )
          //   continue;

          // const foundYear = indexedEstateCensusYearLists.find({
          //   estateId: info.estateId,
          // });
          // if (!foundYear) continue;

          // const foundEstateCensusTarafSah = indexedEstateCensusTarafSah.find({
          //   estateId: info.estateId,
          // });
          // if (!foundEstateCensusTarafSah) continue;
          //###########################################

          const foundEstateCensusTarafSah = indexedEstateCensusTarafSah.where({
            estateId: info.estateId,
          });
          if (
            !foundEstateCensusTarafSah ||
            foundEstateCensusTarafSah.length === 0
          )
            continue;

          for (const tarafSah of foundEstateCensusTarafSah) {
            filteredEstateInformations.push({
              ...info,
              tarafSah: tarafSah.legalStatus,
            });
          }
        }
        // console.log(
        //   "filteredEstateInformations",
        //   filteredEstateInformations.length,
        // );

        let estateInformations = [];

        let groupObject = {};
        let tarafSahLegalStatus = {
          "Syarikat Awam Berhad": { label: "Syarikat Awam Berhad" },
          "Syarikat Sendirian Berhad": { label: "Syarikat Sendirian" },
          Perkongsian: { label: "Perkongsian" },
          "Lain-lain": { label: "Lain-lain" },
          "Perbadanan Awam": { label: "Lain-lain" },
        };

        for (let legalStatus in tarafSahLegalStatus) {
          for (const group of [
            "< 40.47",
            "40.47 - 100",
            "101 - 200",
            "201 - 300",
          ]) {
            if (!groupObject[group]) {
              groupObject[group] = {
                label: group,
                wnSyarikatAwamBerhad: 0,
                wnSyarikatSendirian: 0,
                wnPerkongsian: 0,
                wnLainLain: 0,
                wnJumlah: 0,

                bukanWnSyarikatAwamBerhad: 0,
                bukanWnSyarikatSendirian: 0,
                bukanWnPerkongsian: 0,
                bukanWnLainLain: 0,
                bukanWnJumlah: 0,

                totalSyarikatAwamBerhad: 0,
                totalSyarikatSendirian: 0,
                totalPerkongsian: 0,
                totalLainLain: 0,
                totalJumlah: 0,
              };
            }

            let item = tarafSahLegalStatus[legalStatus];
            let foundEstateInformations = filteredEstateInformations.filter(
              info => info.tarafSah === legalStatus,
            );
            // console.log(
            //   "foundEstateInformations",
            //   foundEstateInformations.length,
            // );

            let limitUp = 0,
              limitBottom = 0;
            if (group === "< 40.47") {
              limitBottom = 0;
              limitUp = 40.47;
            } else if (group === "40.47 - 100") {
              limitBottom = 40.47;
              limitUp = 100;
            } else if (group === "101 - 200") {
              limitBottom = 101;
              limitUp = 200;
            } else if (group === "201 - 300") {
              limitBottom = 201;
              limitUp = 300;
            }

            for (const estInfo of foundEstateInformations) {
              //##### CHECK VALUE FIRST #####
              let censusValue =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId: "" + estInfo.estateId,
                  code: "A01411",
                });

              censusValue = censusValue.filter(
                c => limitBottom < c.value + 0.5 && c.value < limitUp + 0.5,
              );

              if (censusValue.length > 1) {
                throw new Error("Duplicate Value!!");
              }

              if (censusValue.length === 0) continue;

              let valueQ00310 = 0,
                valueQ00318 = 0,
                valueQ00337 = 0;
              for (const code of ["Q00310", "Q00318", "Q00337"]) {
                const foundValue =
                  indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.find({
                    estateId: estInfo.estateId,
                    code,
                  });

                if (!foundValue) continue;

                if (code === "Q00310") {
                  valueQ00310 += foundValue.value;
                } else if (code === "Q00318") {
                  valueQ00318 += foundValue.value;
                } else if (code === "Q00337") {
                  valueQ00337 += foundValue.value;
                }
              }

              if (valueQ00310 + valueQ00318 >= valueQ00337) {
                if (legalStatus === "Syarikat Sendirian Berhad") {
                  groupObject[group] = {
                    ...groupObject[group],
                    wnSyarikatSendirian:
                      groupObject[group].wnSyarikatSendirian + 1,
                  };
                } else if (legalStatus === "Perkongsian") {
                  groupObject[group] = {
                    ...groupObject[group],
                    wnPerkongsian: groupObject[group].wnPerkongsian + 1,
                  };
                } else if (legalStatus === "Syarikat Awam Berhad") {
                  groupObject[group] = {
                    ...groupObject[group],
                    wnSyarikatAwamBerhad:
                      groupObject[group].wnSyarikatAwamBerhad + 1,
                  };
                } else {
                  groupObject[group] = {
                    ...groupObject[group],
                    wnLainLain: groupObject[group].wnLainLain + 1,
                  };
                }
              } else {
                if (legalStatus === "Syarikat Sendirian Berhad") {
                  groupObject[group] = {
                    ...groupObject[group],
                    bukanWnSyarikatSendirian:
                      groupObject[group].bukanWnSyarikatSendirian + 1,
                  };
                } else if (legalStatus === "Perkongsian") {
                  groupObject[group] = {
                    ...groupObject[group],
                    bukanWnPerkongsian:
                      groupObject[group].bukanWnPerkongsian + 1,
                  };
                } else if (legalStatus === "Syarikat Awam Berhad") {
                  groupObject[group] = {
                    ...groupObject[group],
                    bukanWnSyarikatAwamBerhad:
                      groupObject[group].bukanWnSyarikatAwamBerhad + 1,
                  };
                } else {
                  groupObject[group] = {
                    ...groupObject[group],
                    bukanWnLainLain: groupObject[group].bukanWnLainLain + 1,
                  };
                }
              }
            }

            groupObject[group].wnJumlah =
              groupObject[group].wnSyarikatSendirian +
              groupObject[group].wnPerkongsian +
              groupObject[group].wnSyarikatAwamBerhad +
              groupObject[group].wnLainLain;

            groupObject[group].bukanWnJumlah =
              groupObject[group].bukanWnSyarikatSendirian +
              groupObject[group].bukanWnPerkongsian +
              groupObject[group].bukanWnSyarikatAwamBerhad +
              groupObject[group].bukanWnLainLain;

            groupObject[group].totalSyarikatAwamBerhad =
              groupObject[group].wnSyarikatAwamBerhad +
              groupObject[group].bukanWnSyarikatAwamBerhad;

            groupObject[group].totalSyarikatSendirian =
              groupObject[group].wnSyarikatSendirian +
              groupObject[group].bukanWnSyarikatSendirian;

            groupObject[group].totalPerkongsian =
              groupObject[group].wnPerkongsian +
              groupObject[group].bukanWnPerkongsian;

            groupObject[group].totalLainLain =
              groupObject[group].wnLainLain +
              groupObject[group].bukanWnLainLain;

            groupObject[group].totalJumlah =
              groupObject[group].wnJumlah + groupObject[group].bukanWnJumlah;

            estateInformations = [
              ...estateInformations,
              ...foundEstateInformations,
            ];
          }
        }
        // console.log(groupObject);

        //########### ORIGINAL ####################
        // for (let legalStatus in tarafSahLegalStatus) {
        //   let item = tarafSahLegalStatus[legalStatus];
        //   let foundEstateInformations = filteredEstateInformations.filter(
        //     info => info.tarafSah.legalStatus === legalStatus,
        //   );
        //   item.estateInformations = foundEstateInformations;
        //   item.countEstates = foundEstateInformations.length;

        //   estateInformations = [
        //     ...estateInformations,
        //     ...foundEstateInformations,
        //   ];
        // }
        // console.log({ tarafSahLegalStatus });
        //###########################################
        return [
          {
            label: "< 40.47",
            bold: true,
            tarafSahLegalStatus,
            estateInformations,
            groupObject,
            criteria: {
              $gte: 0,
              $lte: 40.47,
            },
          },
          {
            label: "40.47 - 100",
            bold: true,
            tarafSahLegalStatus,
            estateInformations,
            criteria: {
              $gte: 40.47,
              $lte: 100,
            },
            groupObject,
          },
          {
            label: "101 - 200",
            bold: true,
            tarafSahLegalStatus,
            estateInformations,
            criteria: {
              $gte: 101,
              $lte: 200,
            },
            groupObject,
          },
          {
            label: "201 - 300",
            bold: true,
            tarafSahLegalStatus,
            estateInformations,
            criteria: {
              $gte: 201,
              $lte: 300,
            },
            groupObject,
          },
        ];
      },
      COLUMNS: [
        [
          {
            rowSpan: 2,
            text: "Kumpulan",
            alias: "Size Group",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.label,
              value: context.row.label,
            }),
            valueAlignment: "center",
          },
          // ------------------------------
          {
            colSpan: 5,
            text: "Warganegara Malaysia",
            alias: "Malaysian Residents",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          "",
          "",
          "",
          "",
          // ------------------------------
          {
            colSpan: 5,
            text: "Bukan Warganegara Malaysia",
            alias: "Non-Malaysian Residents",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          "",
          "",
          "",
          "",
          // ------------------------------
          {
            colSpan: 5,
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          "",
          "",
          "",
          "",
        ],
        [
          {
            text: "Kumpulan",
            alias: "Size Group",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.label,
              value: context.row.label,
            }),
            valueAlignment: "center",
          },
          // ------------------------------
          {
            text: "Syarikat Awam Berhad",
            alias: "Public Limited Company",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              const foundValue = context.row.groupObject[context.row.label];

              const value =
                foundValue && foundValue.wnSyarikatAwamBerhad
                  ? foundValue.wnSyarikatAwamBerhad
                  : 0;

              return {
                value,
                text: value,
              };

              //######### ORIGNAL ########
              // let { value: valueQ00310 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00310"],
              //   },
              // });
              // let { value: valueQ00318 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00318"],
              //   },
              // });
              // let { value: valueQ00337 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00337"],
              //   },
              // });
              // const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              // if (JenisHakMilik) {
              //   let { value: valueA01411 } = sumAllColumnCodesValue({
              //     ...context,
              //     spec: {
              //       ...context.spec,
              //       columnCodes: ["A01411"],
              //     },
              //     row: {
              //       ...context.row,
              //       estateInformations:
              //         context.row?.tarafSahLegalStatus?.[context.spec.text]
              //           ?.estateInformations || [],
              //     },
              //     criteria: context.row.criteria,
              //   });
              //   let value = valueA01411 ? Math.round(valueA01411) : 0;
              //   // console.log(context.row.criteria, {
              //   //   JenisHakMilik,
              //   //   valueQ00310,
              //   //   valueQ00318,
              //   //   valueQ00337,
              //   //   value,
              //   // });

              //   return {
              //     value,
              //     text: value,
              //   };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          {
            text: "Syarikat Sendirian",
            alias: "Private Limited Company",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              const foundValue = context.row.groupObject[context.row.label];

              const value =
                foundValue && foundValue.wnSyarikatSendirian
                  ? foundValue.wnSyarikatSendirian
                  : 0;

              return {
                value,
                text: value,
              };

              //####### ORIGINAL #######
              // let { value: valueQ00310 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00310"],
              //   },
              // });
              // let { value: valueQ00318 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00318"],
              //   },
              // });
              // let { value: valueQ00337 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00337"],
              //   },
              // });
              // const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              // if (JenisHakMilik) {
              //   let { value: valueA01411 } = sumAllColumnCodesValue({
              //     ...context,
              //     spec: {
              //       ...context.spec,
              //       columnCodes: ["A01411"],
              //     },
              //     row: {
              //       ...context.row,
              //       estateInformations:
              //         context.row?.tarafSahLegalStatus?.[context.spec.text]
              //           ?.estateInformations || [],
              //     },
              //     criteria: context.row.criteria,
              //   });
              //   let value = valueA01411 ? Math.round(valueA01411) : 0;
              //   // console.log(context.row.criteria, {
              //   //   JenisHakMilik,
              //   //   valueQ00310,
              //   //   valueQ00318,
              //   //   valueQ00337,
              //   //   value,
              //   // });

              //   return {
              //     value,
              //     text: value,
              //   };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          {
            text: "Perkongsian",
            alias: "Partnership",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              const foundValue = context.row.groupObject[context.row.label];

              const value =
                foundValue && foundValue.wnPerkongsian
                  ? foundValue.wnPerkongsian
                  : 0;

              return {
                value,
                text: value,
              };

              //########## ORIGINAL #########
              // let { value: valueQ00310 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00310"],
              //   },
              // });
              // let { value: valueQ00318 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00318"],
              //   },
              // });
              // let { value: valueQ00337 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00337"],
              //   },
              // });
              // const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              // if (JenisHakMilik) {
              //   let { value: valueA01411 } = sumAllColumnCodesValue({
              //     ...context,
              //     spec: {
              //       ...context.spec,
              //       columnCodes: ["A01411"],
              //     },
              //     row: {
              //       ...context.row,
              //       estateInformations:
              //         context.row?.tarafSahLegalStatus?.[context.spec.text]
              //           ?.estateInformations || [],
              //     },
              //     criteria: context.row.criteria,
              //   });
              //   let value = valueA01411 ? Math.round(valueA01411) : 0;
              //   // console.log(context.row.criteria, {
              //   //   JenisHakMilik,
              //   //   valueQ00310,
              //   //   valueQ00318,
              //   //   valueQ00337,
              //   //   value,
              //   // });

              //   return {
              //     value,
              //     text: value,
              //   };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          {
            text: "Lain-lain",
            alias: "Others",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              const foundValue = context.row.groupObject[context.row.label];

              const value =
                foundValue && foundValue.wnLainLain ? foundValue.wnLainLain : 0;

              return {
                value,
                text: value,
              };

              // let { value: valueQ00310 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00310"],
              //   },
              // });
              // let { value: valueQ00318 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00318"],
              //   },
              // });
              // let { value: valueQ00337 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00337"],
              //   },
              // });
              // const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              // if (JenisHakMilik) {
              //   let { value: valueA01411 } = sumAllColumnCodesValue({
              //     ...context,
              //     spec: {
              //       ...context.spec,
              //       columnCodes: ["A01411"],
              //     },
              //     row: {
              //       ...context.row,
              //       estateInformations:
              //         context.row?.tarafSahLegalStatus?.[context.spec.text]
              //           ?.estateInformations || [],
              //     },
              //     criteria: context.row.criteria,
              //   });
              //   let value = valueA01411 ? Math.round(valueA01411) : 0;
              //   // console.log(context.row.criteria, {
              //   //   JenisHakMilik,
              //   //   valueQ00310,
              //   //   valueQ00318,
              //   //   valueQ00337,
              //   //   value,
              //   // });

              //   return {
              //     value,
              //     text: value,
              //   };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              const foundValue = context.row.groupObject[context.row.label];

              const value =
                foundValue && foundValue.wnJumlah ? foundValue.wnJumlah : 0;

              return {
                value,
                text: value,
              };

              //############ ORIGINAL ###############
              // let { value: valueQ00310 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00310"],
              //   },
              // });
              // let { value: valueQ00318 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00318"],
              //   },
              // });
              // let { value: valueQ00337 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00337"],
              //   },
              // });
              // const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              // if (JenisHakMilik) {
              //   let { value: valueA01411 } = sumAllColumnCodesValue({
              //     ...context,
              //     spec: {
              //       ...context.spec,
              //       columnCodes: ["A01411"],
              //     },
              //     row: {
              //       ...context.row,
              //       // Total
              //       // estateInformations:
              //       //   context.row?.tarafSahLegalStatus?.[context.spec.text]
              //       //     ?.estateInformations || [],
              //     },
              //     criteria: context.row.criteria,
              //   });
              //   let value = valueA01411 ? Math.round(valueA01411) : 0;
              //   // console.log(context.row.criteria, {
              //   //   JenisHakMilik,
              //   //   valueQ00310,
              //   //   valueQ00318,
              //   //   valueQ00337,
              //   //   value,
              //   // });

              //   return {
              //     value,
              //     text: value,
              //   };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          // ------------------------------
          {
            text: "Syarikat Awam Berhad",
            alias: "Public Limited Company",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              const foundValue = context.row.groupObject[context.row.label];

              const value =
                foundValue && foundValue.bukanWnSyarikatAwamBerhad
                  ? foundValue.bukanWnSyarikatAwamBerhad
                  : 0;

              return {
                value,
                text: value,
              };

              //######## ORIGINAL ######
              // let { value: valueQ00310 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00310"],
              //   },
              // });
              // let { value: valueQ00318 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00318"],
              //   },
              // });
              // let { value: valueQ00337 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00337"],
              //   },
              // });
              // const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              // if (!JenisHakMilik) {
              //   let { value: valueA01411 } = sumAllColumnCodesValue({
              //     ...context,
              //     spec: {
              //       ...context.spec,
              //       columnCodes: ["A01411"],
              //     },
              //     row: {
              //       ...context.row,
              //       estateInformations:
              //         context.row?.tarafSahLegalStatus?.[context.spec.text]
              //           ?.estateInformations || [],
              //     },
              //     criteria: context.row.criteria,
              //   });
              //   let value = valueA01411 ? Math.round(valueA01411) : 0;
              //   // console.log(context.row.criteria, {
              //   //   JenisHakMilik,
              //   //   valueQ00310,
              //   //   valueQ00318,
              //   //   valueQ00337,
              //   //   value,
              //   // });

              //   return {
              //     value,
              //     text: value,
              //   };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          {
            text: "Syarikat Sendirian",
            alias: "Private Limited Company",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              const foundValue = context.row.groupObject[context.row.label];

              const value =
                foundValue && foundValue.bukanWnSyarikatSendirian
                  ? foundValue.bukanWnSyarikatSendirian
                  : 0;

              return {
                value,
                text: value,
              };

              // let { value: valueQ00310 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00310"],
              //   },
              // });
              // let { value: valueQ00318 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00318"],
              //   },
              // });
              // let { value: valueQ00337 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00337"],
              //   },
              // });
              // const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              // if (!JenisHakMilik) {
              //   let { value: valueA01411 } = sumAllColumnCodesValue({
              //     ...context,
              //     spec: {
              //       ...context.spec,
              //       columnCodes: ["A01411"],
              //     },
              //     row: {
              //       ...context.row,
              //       estateInformations:
              //         context.row?.tarafSahLegalStatus?.[context.spec.text]
              //           ?.estateInformations || [],
              //     },
              //     criteria: context.row.criteria,
              //   });
              //   let value = valueA01411 ? Math.round(valueA01411) : 0;
              //   // console.log(context.row.criteria, {
              //   //   JenisHakMilik,
              //   //   valueQ00310,
              //   //   valueQ00318,
              //   //   valueQ00337,
              //   //   value,
              //   // });

              //   return {
              //     value,
              //     text: value,
              //   };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          {
            text: "Perkongsian",
            alias: "Partnership",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              const foundValue = context.row.groupObject[context.row.label];

              const value =
                foundValue && foundValue.bukanWnPerkongsian
                  ? foundValue.bukanWnPerkongsian
                  : 0;

              return {
                value,
                text: value,
              };

              // let { value: valueQ00310 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00310"],
              //   },
              // });
              // let { value: valueQ00318 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00318"],
              //   },
              // });
              // let { value: valueQ00337 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00337"],
              //   },
              // });
              // const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              // if (!JenisHakMilik) {
              //   let { value: valueA01411 } = sumAllColumnCodesValue({
              //     ...context,
              //     spec: {
              //       ...context.spec,
              //       columnCodes: ["A01411"],
              //     },
              //     row: {
              //       ...context.row,
              //       estateInformations:
              //         context.row?.tarafSahLegalStatus?.[context.spec.text]
              //           ?.estateInformations || [],
              //     },
              //     criteria: context.row.criteria,
              //   });
              //   let value = valueA01411 ? Math.round(valueA01411) : 0;
              //   // console.log(context.row.criteria, {
              //   //   JenisHakMilik,
              //   //   valueQ00310,
              //   //   valueQ00318,
              //   //   valueQ00337,
              //   //   value,
              //   // });

              //   return {
              //     value,
              //     text: value,
              //   };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          {
            text: "Lain-lain",
            alias: "Others",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              const foundValue = context.row.groupObject[context.row.label];

              const value =
                foundValue && foundValue.bukanWnLainLain
                  ? foundValue.bukanWnLainLain
                  : 0;

              return {
                value,
                text: value,
              };

              // let { value: valueQ00310 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00310"],
              //   },
              // });
              // let { value: valueQ00318 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00318"],
              //   },
              // });
              // let { value: valueQ00337 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00337"],
              //   },
              // });
              // const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              // if (!JenisHakMilik) {
              //   let { value: valueA01411 } = sumAllColumnCodesValue({
              //     ...context,
              //     spec: {
              //       ...context.spec,
              //       columnCodes: ["A01411"],
              //     },
              //     row: {
              //       ...context.row,
              //       estateInformations:
              //         context.row?.tarafSahLegalStatus?.[context.spec.text]
              //           ?.estateInformations || [],
              //     },
              //     criteria: context.row.criteria,
              //   });
              //   let value = valueA01411 ? Math.round(valueA01411) : 0;
              //   // console.log(context.row.criteria, {
              //   //   JenisHakMilik,
              //   //   valueQ00310,
              //   //   valueQ00318,
              //   //   valueQ00337,
              //   //   value,
              //   // });

              //   return {
              //     value,
              //     text: value,
              //   };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              const foundValue = context.row.groupObject[context.row.label];

              const value =
                foundValue && foundValue.bukanWnJumlah
                  ? foundValue.bukanWnJumlah
                  : 0;

              return {
                value,
                text: value,
              };

              // let { value: valueQ00310 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00310"],
              //   },
              // });
              // let { value: valueQ00318 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00318"],
              //   },
              // });
              // let { value: valueQ00337 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00337"],
              //   },
              // });
              // const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              // if (!JenisHakMilik) {
              //   let { value: valueA01411 } = sumAllColumnCodesValue({
              //     ...context,
              //     spec: {
              //       ...context.spec,
              //       columnCodes: ["A01411"],
              //     },
              //     row: {
              //       ...context.row,
              //       // Total
              //       // estateInformations:
              //       //   context.row?.tarafSahLegalStatus?.[context.spec.text]
              //       //     ?.estateInformations || [],
              //     },
              //     criteria: context.row.criteria,
              //   });
              //   let value = valueA01411 ? Math.round(valueA01411) : 0;
              //   // console.log(context.row.criteria, {
              //   //   JenisHakMilik,
              //   //   valueQ00310,
              //   //   valueQ00318,
              //   //   valueQ00337,
              //   //   value,
              //   // });

              //   return {
              //     value,
              //     text: value,
              //   };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          // ------------------------------
          {
            text: "Syarikat Awam Berhad",
            alias: "Public Limited Company",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              const foundValue = context.row.groupObject[context.row.label];

              const value =
                foundValue && foundValue.totalSyarikatAwamBerhad
                  ? foundValue.totalSyarikatAwamBerhad
                  : 0;

              return {
                value,
                text: value,
              };

              // let { value: valueQ00310 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00310"],
              //   },
              // });
              // let { value: valueQ00318 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00318"],
              //   },
              // });
              // let { value: valueQ00337 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00337"],
              //   },
              // });
              // const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              // if (!JenisHakMilik) {
              //########## ORIGINAL ###########
              // let { value: valueA01411 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["A01411"],
              //   },
              //   row: {
              //     ...context.row,
              //     estateInformations:
              //       context.row?.tarafSahLegalStatus?.[context.spec.text]
              //         ?.estateInformations || [],
              //   },
              //   criteria: context.row.criteria,
              // });
              // let value = valueA01411 ? Math.round(valueA01411) : 0;
              // // console.log(context.row.criteria, {
              // //   JenisHakMilik,
              // //   valueQ00310,
              // //   valueQ00318,
              // //   valueQ00337,
              // //   value,
              // // });

              // return {
              //   value,
              //   text: value,
              // };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          {
            text: "Syarikat Sendirian",
            alias: "Private Limited Company",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              const foundValue = context.row.groupObject[context.row.label];

              const value =
                foundValue && foundValue.totalSyarikatSendirian
                  ? foundValue.totalSyarikatSendirian
                  : 0;

              return {
                value,
                text: value,
              };

              // let { value: valueQ00310 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00310"],
              //   },
              // });
              // let { value: valueQ00318 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00318"],
              //   },
              // });
              // let { value: valueQ00337 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00337"],
              //   },
              // });
              // const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;
              // if (!JenisHakMilik) {
              //####### ORIGINAL ###########
              // let { value: valueA01411 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["A01411"],
              //   },
              //   row: {
              //     ...context.row,
              //     estateInformations:
              //       context.row?.tarafSahLegalStatus?.[context.spec.text]
              //         ?.estateInformations || [],
              //   },
              //   criteria: context.row.criteria,
              // });
              // let value = valueA01411 ? Math.round(valueA01411) : 0;
              // // console.log(context.row.criteria, {
              // //   JenisHakMilik,
              // //   valueQ00310,
              // //   valueQ00318,
              // //   valueQ00337,
              // //   value,
              // // });
              // return {
              //   value,
              //   text: value,
              // };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          {
            text: "Perkongsian",
            alias: "Partnership",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              const foundValue = context.row.groupObject[context.row.label];

              const value =
                foundValue && foundValue.totalPerkongsian
                  ? foundValue.totalPerkongsian
                  : 0;

              return {
                value,
                text: value,
              };
              // let { value: valueQ00310 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00310"],
              //   },
              // });
              // let { value: valueQ00318 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00318"],
              //   },
              // });
              // let { value: valueQ00337 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00337"],
              //   },
              // });
              // const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;
              // if (!JenisHakMilik) {
              ///############# ORIGINAL #########
              // let { value: valueA01411 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["A01411"],
              //   },
              //   row: {
              //     ...context.row,
              //     estateInformations:
              //       context.row?.tarafSahLegalStatus?.[context.spec.text]
              //         ?.estateInformations || [],
              //   },
              //   criteria: context.row.criteria,
              // });
              // let value = valueA01411 ? Math.round(valueA01411) : 0;
              // // console.log(context.row.criteria, {
              // //   JenisHakMilik,
              // //   valueQ00310,
              // //   valueQ00318,
              // //   valueQ00337,
              // //   value,
              // // });
              // return {
              //   value,
              //   text: value,
              // };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          {
            text: "Lain-lain",
            alias: "Others",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              const foundValue = context.row.groupObject[context.row.label];

              const value =
                foundValue && foundValue.totalLainLain
                  ? foundValue.totalLainLain
                  : 0;

              return {
                value,
                text: value,
              };
              // let { value: valueQ00310 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00310"],
              //   },
              // });
              // let { value: valueQ00318 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00318"],
              //   },
              // });
              // let { value: valueQ00337 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00337"],
              //   },
              // });
              // const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;
              // if (!JenisHakMilik) {
              //########## ORIGNIAL ###########
              // let { value: valueA01411 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["A01411"],
              //   },
              //   row: {
              //     ...context.row,
              //     estateInformations:
              //       context.row?.tarafSahLegalStatus?.[context.spec.text]
              //         ?.estateInformations || [],
              //   },
              //   criteria: context.row.criteria,
              // });
              // let value = valueA01411 ? Math.round(valueA01411) : 0;
              // // console.log(context.row.criteria, {
              // //   JenisHakMilik,
              // //   valueQ00310,
              // //   valueQ00318,
              // //   valueQ00337,
              // //   value,
              // // });
              // return {
              //   value,
              //   text: value,
              // };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              const foundValue = context.row.groupObject[context.row.label];

              const value =
                foundValue && foundValue.totalJumlah
                  ? foundValue.totalJumlah
                  : 0;

              return {
                value,
                text: value,
              };

              // let { value: valueQ00310 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00310"],
              //   },
              // });
              // let { value: valueQ00318 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00318"],
              //   },
              // });
              // let { value: valueQ00337 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["Q00337"],
              //   },
              // });
              // const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;
              // if (!JenisHakMilik) {
              //########### ORIGINAL ###########
              // let { value: valueA01411 } = sumAllColumnCodesValue({
              //   ...context,
              //   spec: {
              //     ...context.spec,
              //     columnCodes: ["A01411"],
              //   },
              //   row: {
              //     ...context.row,
              //     // Total
              //     // estateInformations:
              //     //   context.row?.tarafSahLegalStatus?.[context.spec.text]
              //     //     ?.estateInformations || [],
              //   },
              //   criteria: context.row.criteria,
              // });
              // let value = valueA01411 ? Math.round(valueA01411) : 0;
              // // console.log(context.row.criteria, {
              // //   JenisHakMilik,
              // //   valueQ00310,
              // //   valueQ00318,
              // //   valueQ00337,
              // //   value,
              // // });
              // return {
              //   value,
              //   text: value,
              // };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 5": {
      TITLE: `Jadual 5: Bilangan Estet Koko Mengikuti Taraf Sah, Hakmilik, Dan Negeri Seperti Pada 31 Disember ${
        params.year - 1
      }: ${
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
      SUBTITLE: `Table 5: Number of Cocoa Estates by Legal Status, Ownership and States, as at 31 December, ${
        params.year - 1
      }: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      // PAGE_ORIENTATION: "portrait",
      // BASE_FONT_SIZE: 10,
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      BASE_FONT_SIZE: 10,
      RESOLVE_ROWS: async () => {
        await context.collection("EstateCensusMaklumatBorang").createIndex({
          censusYear: 1,
        });
        const allEstateCensusMaklumatBorang = await context
          .collection("EstateCensusMaklumatBorang")
          .find({
            censusYear: params.year,
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        indexedEstateCensusMaklumatBorang = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "censusYear"],
          },
        });
        indexedEstateCensusMaklumatBorang.add(allEstateCensusMaklumatBorang);

        await context.collection("EstateCensusTarafSah").createIndex({
          censusYear: 1,
        });
        const allEstateCensusTarafSah = await context
          .collection("EstateCensusTarafSah")
          .find({
            censusYear: params.year,
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        // console.log("allEstateCensusTarafSah", allEstateCensusTarafSah.length);
        indexedEstateCensusTarafSah = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "legalStatus"],
          },
        });
        indexedEstateCensusTarafSah.add(allEstateCensusTarafSah);

        if (params.segment === "Sabah" || params.segment === "Sarawak") {
          let allDistricts = [];
          for (const state of allEstateCensusStateDistricts) {
            let allEstateInformations = indexedEstateInformations.where({
              stateCode: String(parseInt(state.stateCode)),
              districtCode: String(parseInt(state.districtCode)),
            });

            let filteredEstateInformations = [];
            for (const info of allEstateInformations) {
              // Aktif Saja
              if (
                process.env.NODE_ENV === "production" &&
                info.estateType !== 1 &&
                info.estateType !== "1"
              )
                continue;

              const foundYear = indexedEstateCensusYearLists.find({
                estateId: info.estateId,
              });
              if (!foundYear) continue;

              const foundValue = indexedValues.find({
                estateInformationId: info._id,
                // code: columnCode,
              });
              // console.log({ info }, !!foundValue);
              if (!foundValue) continue;

              filteredEstateInformations.push(info);
            }

            if (!filteredEstateInformations.length) continue;

            allDistricts.push({
              ...state,
              estateInformations: filteredEstateInformations,
            });
            // console.log(
            //   "filteredEstateInformations",
            //   state.stateCode,
            //   state.stateName,
            //   filteredEstateInformations.length,
            // );
          }

          return allDistricts.map(i => {
            return {
              ...i,
              stateName: i.districtName || i.stateName || "",
            };
          });
        }

        let allStates = [];
        for (const state of allEstateCensusStateCodes) {
          let allEstateInformations = indexedEstateInformations.where({
            stateCode: String(parseInt(state.stateCode)),
          });

          let filteredEstateInformations = [];
          for (const info of allEstateInformations) {
            // Aktif Saja
            // if (
            //   process.env.NODE_ENV === "production" &&
            //   info.estateType !== 1 &&
            //   info.estateType !== "1"
            // )
            //   continue;

            // const foundYear = indexedEstateCensusYearLists.find({
            //   estateId: info.estateId,
            // });
            // if (!foundYear) continue;

            // const foundValue = indexedValues.find({
            //   estateInformationId: info._id,
            //   // code: columnCode,
            // });
            // // console.log({ info }, !!foundValue);
            // if (!foundValue) continue;

            filteredEstateInformations.push(info);
          }

          if (!filteredEstateInformations.length) continue;

          allStates.push({
            ...state,
            estateInformations: filteredEstateInformations,
          });
          // console.log(
          //   "filteredEstateInformations",
          //   state.stateCode,
          //   state.stateName,
          //   filteredEstateInformations.length,
          // );
        }

        const allRefComStatuses = await context
          .collection("RefComStatuses")
          .find({
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        let TARAF_SAH_LEGAL_STATUS = allRefComStatuses.map(i => i.comStatus);
        // console.log({ TARAF_SAH_LEGAL_STATUS });

        allStates = allStates.map(state => {
          let estateIds = (state.estateInformations || []).map(i => i.estateId);
          estateIds = estateIds.filter(estateId => {
            const foundEstateCensusMaklumatBorang =
              indexedEstateCensusMaklumatBorang.where({
                estateId,
              });

            return foundEstateCensusMaklumatBorang.length > 0;
          });

          let allTarafSah = TARAF_SAH_LEGAL_STATUS.map(legalStatus => {
            let tarafSahIds = [];

            for (const estateId of estateIds) {
              const foundTarafSah = indexedEstateCensusTarafSah.where({
                legalStatus,
                estateId,
              });
              // if (foundTarafSah.length > 0) {
              //   console.log({ foundTarafSah });
              // }
              tarafSahIds = [...tarafSahIds, ...foundTarafSah.map(i => i._id)];
            }

            tarafSahIds = [...new Set(tarafSahIds)];

            return {
              legalStatus,
              tarafSahIds,
              countTarafSah: tarafSahIds.length,
            };
          });

          const totalCountTarafSah = allTarafSah
            .map(tf => tf.countTarafSah)
            .reduce((acc, curr) => acc + curr, 0);

          let indexedTarafSah = allTarafSah.reduce((all, item) => {
            all[item.legalStatus] = item;
            return all;
          }, {});

          // console.log(state.stateName, indexedTarafSah);
          return { ...state, estateIds, indexedTarafSah, totalCountTarafSah };
        });

        allStates = allStates.filter(tf => tf.totalCountTarafSah > 0);

        return allStates;
      },
      COLUMNS: [
        [
          {
            rowSpan: 2,
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "District"
                : "State",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.stateName,
              value: context.row.stateName,
            }),
            valueAlignment: "center",
          },
          // ------------------------------
          {
            colSpan: 5,
            text: "Warganegara Malaysia",
            alias: "Malaysian Residents",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          "",
          "",
          "",
          "",
          // ------------------------------
          {
            colSpan: 5,
            text: "Bukan Warganegara Malaysia",
            alias: "Non-Malaysian Residents",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          "",
          "",
          "",
          "",
          // ------------------------------
          {
            colSpan: 5,
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          "",
          "",
          "",
          "",
        ],
        [
          {
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "District"
                : "State",
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.stateName,
              value: context.row.stateName,
            }),
            valueAlignment: "center",
          },
          // ------------------------------
          {
            text: "Syarikat Awam Berhad",
            alias: "Public Limited Company",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              if (JenisHakMilik) {
                // let { value: valueA01411 } = sumAllColumnCodesValue({
                //   ...context,
                //   spec: {
                //     ...context.spec,
                //     columnCodes: ["A01411"],
                //   },
                //   row: {
                //     ...context.row,
                //     estateInformations:
                //       context.row?.tarafSahLegalStatus?.[context.spec.text]
                //         ?.estateInformations || [],
                //   },
                //   criteria: context.row.criteria,
                // });
                // let value = valueA01411 ? Math.round(valueA01411) : 0;
                // // console.log(context.row.criteria, {
                // //   JenisHakMilik,
                // //   valueQ00310,
                // //   valueQ00318,
                // //   valueQ00337,
                // //   value,
                // // });

                // console.log("indexedTarafSah", context.row.indexedTarafSah);
                let value =
                  context.row.indexedTarafSah?.["Syarikat Awam Berhad"]
                    ?.countTarafSah;

                return {
                  value,
                  text: value,
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            text: "Syarikat Sendirian",
            alias: "Private Limited Company",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              if (JenisHakMilik) {
                // let { value: valueA01411 } = sumAllColumnCodesValue({
                //   ...context,
                //   spec: {
                //     ...context.spec,
                //     columnCodes: ["A01411"],
                //   },
                //   row: {
                //     ...context.row,
                //     estateInformations:
                //       context.row?.tarafSahLegalStatus?.[context.spec.text]
                //         ?.estateInformations || [],
                //   },
                //   criteria: context.row.criteria,
                // });
                // let value = valueA01411 ? Math.round(valueA01411) : 0;
                // // console.log(context.row.criteria, {
                // //   JenisHakMilik,
                // //   valueQ00310,
                // //   valueQ00318,
                // //   valueQ00337,
                // //   value,
                // // });

                // console.log("indexedTarafSah", context.row.indexedTarafSah);
                let value =
                  context.row.indexedTarafSah?.["Syarikat Sendirian Berhad"]
                    ?.countTarafSah;

                return {
                  value,
                  text: value,
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            text: "Perkongsian",
            alias: "Partnership",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              if (JenisHakMilik) {
                // let { value: valueA01411 } = sumAllColumnCodesValue({
                //   ...context,
                //   spec: {
                //     ...context.spec,
                //     columnCodes: ["A01411"],
                //   },
                //   row: {
                //     ...context.row,
                //     estateInformations:
                //       context.row?.tarafSahLegalStatus?.[context.spec.text]
                //         ?.estateInformations || [],
                //   },
                //   criteria: context.row.criteria,
                // });
                // let value = valueA01411 ? Math.round(valueA01411) : 0;
                // // console.log(context.row.criteria, {
                // //   JenisHakMilik,
                // //   valueQ00310,
                // //   valueQ00318,
                // //   valueQ00337,
                // //   value,
                // // });

                // console.log("indexedTarafSah", context.row.indexedTarafSah);
                let value =
                  context.row.indexedTarafSah?.["Perkongsian"]?.countTarafSah;

                return {
                  value,
                  text: value,
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            text: "Lain-lain",
            alias: "Others",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              if (JenisHakMilik) {
                // let { value: valueA01411 } = sumAllColumnCodesValue({
                //   ...context,
                //   spec: {
                //     ...context.spec,
                //     columnCodes: ["A01411"],
                //   },
                //   row: {
                //     ...context.row,
                //     estateInformations:
                //       context.row?.tarafSahLegalStatus?.[context.spec.text]
                //         ?.estateInformations || [],
                //   },
                //   criteria: context.row.criteria,
                // });
                // let value = valueA01411 ? Math.round(valueA01411) : 0;
                // // console.log(context.row.criteria, {
                // //   JenisHakMilik,
                // //   valueQ00310,
                // //   valueQ00318,
                // //   valueQ00337,
                // //   value,
                // // });

                // console.log("indexedTarafSah", context.row.indexedTarafSah);
                let value =
                  context.row.indexedTarafSah?.["Lain-lain"]?.countTarafSah;

                value =
                  value +
                  (context.row.indexedTarafSah?.["Perbadanan Awam"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Pertubuhan Tanpa Untung"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Syarikat Kerjasama"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Hak Perseorangan"]
                    ?.countTarafSah || 0);

                return {
                  value,
                  text: value,
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              if (JenisHakMilik) {
                // let { value: valueA01411 } = sumAllColumnCodesValue({
                //   ...context,
                //   spec: {
                //     ...context.spec,
                //     columnCodes: ["A01411"],
                //   },
                //   row: {
                //     ...context.row,
                //     // Total
                //     // estateInformations:
                //     //   context.row?.tarafSahLegalStatus?.[context.spec.text]
                //     //     ?.estateInformations || [],
                //   },
                //   criteria: context.row.criteria,
                // });
                // let value = valueA01411 ? Math.round(valueA01411) : 0;
                // // console.log(context.row.criteria, {
                // //   JenisHakMilik,
                // //   valueQ00310,
                // //   valueQ00318,
                // //   valueQ00337,
                // //   value,
                // // });

                let value =
                  (context.row.indexedTarafSah?.["Syarikat Awam Berhad"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Syarikat Sendirian Berhad"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Perkongsian"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Lain-lain"]?.countTarafSah ||
                    0) +
                  (context.row.indexedTarafSah?.["Perbadanan Awam"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Pertubuhan Tanpa Untung"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Syarikat Kerjasama"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Hak Perseorangan"]
                    ?.countTarafSah || 0);

                return {
                  value,
                  text: value,
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          // ------------------------------
          {
            text: "Syarikat Awam Berhad",
            alias: "Public Limited Company",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              if (!JenisHakMilik) {
                // let { value: valueA01411 } = sumAllColumnCodesValue({
                //   ...context,
                //   spec: {
                //     ...context.spec,
                //     columnCodes: ["A01411"],
                //   },
                //   row: {
                //     ...context.row,
                //     estateInformations:
                //       context.row?.tarafSahLegalStatus?.[context.spec.text]
                //         ?.estateInformations || [],
                //   },
                //   criteria: context.row.criteria,
                // });
                // let value = valueA01411 ? Math.round(valueA01411) : 0;
                // // console.log(context.row.criteria, {
                // //   JenisHakMilik,
                // //   valueQ00310,
                // //   valueQ00318,
                // //   valueQ00337,
                // //   value,
                // // });

                // console.log("indexedTarafSah", context.row.indexedTarafSah);
                let value =
                  context.row.indexedTarafSah?.["Syarikat Awam Berhad"]
                    ?.countTarafSah;

                return {
                  value,
                  text: value,
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            text: "Syarikat Sendirian",
            alias: "Private Limited Company",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              if (!JenisHakMilik) {
                // let { value: valueA01411 } = sumAllColumnCodesValue({
                //   ...context,
                //   spec: {
                //     ...context.spec,
                //     columnCodes: ["A01411"],
                //   },
                //   row: {
                //     ...context.row,
                //     estateInformations:
                //       context.row?.tarafSahLegalStatus?.[context.spec.text]
                //         ?.estateInformations || [],
                //   },
                //   criteria: context.row.criteria,
                // });
                // let value = valueA01411 ? Math.round(valueA01411) : 0;
                // // console.log(context.row.criteria, {
                // //   JenisHakMilik,
                // //   valueQ00310,
                // //   valueQ00318,
                // //   valueQ00337,
                // //   value,
                // // });

                // console.log("indexedTarafSah", context.row.indexedTarafSah);
                let value =
                  context.row.indexedTarafSah?.["Syarikat Sendirian Berhad"]
                    ?.countTarafSah;

                return {
                  value,
                  text: value,
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            text: "Perkongsian",
            alias: "Partnership",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              if (!JenisHakMilik) {
                // let { value: valueA01411 } = sumAllColumnCodesValue({
                //   ...context,
                //   spec: {
                //     ...context.spec,
                //     columnCodes: ["A01411"],
                //   },
                //   row: {
                //     ...context.row,
                //     estateInformations:
                //       context.row?.tarafSahLegalStatus?.[context.spec.text]
                //         ?.estateInformations || [],
                //   },
                //   criteria: context.row.criteria,
                // });
                // let value = valueA01411 ? Math.round(valueA01411) : 0;
                // // console.log(context.row.criteria, {
                // //   JenisHakMilik,
                // //   valueQ00310,
                // //   valueQ00318,
                // //   valueQ00337,
                // //   value,
                // // });

                // console.log("indexedTarafSah", context.row.indexedTarafSah);
                let value =
                  context.row.indexedTarafSah?.["Perkongsian"]?.countTarafSah;

                return {
                  value,
                  text: value,
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            text: "Lain-lain",
            alias: "Others",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              if (!JenisHakMilik) {
                // let { value: valueA01411 } = sumAllColumnCodesValue({
                //   ...context,
                //   spec: {
                //     ...context.spec,
                //     columnCodes: ["A01411"],
                //   },
                //   row: {
                //     ...context.row,
                //     estateInformations:
                //       context.row?.tarafSahLegalStatus?.[context.spec.text]
                //         ?.estateInformations || [],
                //   },
                //   criteria: context.row.criteria,
                // });
                // let value = valueA01411 ? Math.round(valueA01411) : 0;
                // // console.log(context.row.criteria, {
                // //   JenisHakMilik,
                // //   valueQ00310,
                // //   valueQ00318,
                // //   valueQ00337,
                // //   value,
                // // });

                // console.log("indexedTarafSah", context.row.indexedTarafSah);
                let value =
                  context.row.indexedTarafSah?.["Lain-lain"]?.countTarafSah;

                value =
                  value +
                  (context.row.indexedTarafSah?.["Perbadanan Awam"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Pertubuhan Tanpa Untung"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Syarikat Kerjasama"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Hak Perseorangan"]
                    ?.countTarafSah || 0);

                return {
                  value,
                  text: value,
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              let { value: valueQ00310 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00310"],
                },
              });
              let { value: valueQ00318 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00318"],
                },
              });
              let { value: valueQ00337 } = sumAllColumnCodesValue({
                ...context,
                spec: {
                  ...context.spec,
                  columnCodes: ["Q00337"],
                },
              });
              const JenisHakMilik = valueQ00310 + valueQ00318 >= valueQ00337;

              if (!JenisHakMilik) {
                // let { value: valueA01411 } = sumAllColumnCodesValue({
                //   ...context,
                //   spec: {
                //     ...context.spec,
                //     columnCodes: ["A01411"],
                //   },
                //   row: {
                //     ...context.row,
                //     // Total
                //     // estateInformations:
                //     //   context.row?.tarafSahLegalStatus?.[context.spec.text]
                //     //     ?.estateInformations || [],
                //   },
                //   criteria: context.row.criteria,
                // });
                // let value = valueA01411 ? Math.round(valueA01411) : 0;
                // // console.log(context.row.criteria, {
                // //   JenisHakMilik,
                // //   valueQ00310,
                // //   valueQ00318,
                // //   valueQ00337,
                // //   value,
                // // });

                let value =
                  (context.row.indexedTarafSah?.["Syarikat Awam Berhad"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Syarikat Sendirian Berhad"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Perkongsian"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Lain-lain"]?.countTarafSah ||
                    0) +
                  (context.row.indexedTarafSah?.["Perbadanan Awam"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Pertubuhan Tanpa Untung"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Syarikat Kerjasama"]
                    ?.countTarafSah || 0) +
                  (context.row.indexedTarafSah?.["Hak Perseorangan"]
                    ?.countTarafSah || 0);
                return {
                  value,
                  text: value,
                };
              } else {
                return {
                  value: 0,
                  text: 0,
                };
              }
            },
            valueAlignment: "center",
          },
          // ------------------------------
          {
            text: "Syarikat Awam Berhad",
            alias: "Public Limited Company",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log("indexedTarafSah", context.row.indexedTarafSah);
              let value =
                context.row.indexedTarafSah?.["Syarikat Awam Berhad"]
                  ?.countTarafSah;

              return {
                value,
                text: value,
              };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          {
            text: "Syarikat SendirianX",
            alias: "Private Limited Company",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log("indexedTarafSah", context.row.indexedTarafSah);
              let value =
                context.row.indexedTarafSah?.["Syarikat Sendirian Berhad"]
                  ?.countTarafSah;

              return {
                value,
                text: value,
              };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          {
            text: "Perkongsian",
            alias: "Partnership",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log("indexedTarafSah", context.row.indexedTarafSah);
              let value =
                context.row.indexedTarafSah?.["Perkongsian"]?.countTarafSah;

              return {
                value,
                text: value,
              };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          {
            text: "Lain-lain XXXX",
            alias: "Others",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log("indexedTarafSah", context.row.indexedTarafSah);
              let value =
                context.row.indexedTarafSah?.["Lain-lain"]?.countTarafSah;

              value =
                value +
                (context.row.indexedTarafSah?.["Perbadanan Awam"]
                  ?.countTarafSah || 0) +
                (context.row.indexedTarafSah?.["Pertubuhan Tanpa Untung"]
                  ?.countTarafSah || 0) +
                (context.row.indexedTarafSah?.["Syarikat Kerjasama"]
                  ?.countTarafSah || 0) +
                (context.row.indexedTarafSah?.["Hak Perseorangan"]
                  ?.countTarafSah || 0);

              return {
                value,
                text: value,
              };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
          {
            text: "Jumlah",
            alias: "Total",
            alignment: "center",
            bold: true,
            columnWidth: 41.5,
            hideColumnCodes: true,
            columnCodes: ["Q003410", "Q00310", "Q00318", "A01411"],
            statsPrecision: 0,
            resolveValue: context => {
              let value =
                (context.row.indexedTarafSah?.["Syarikat Awam Berhad"]
                  ?.countTarafSah || 0) +
                (context.row.indexedTarafSah?.["Syarikat Sendirian Berhad"]
                  ?.countTarafSah || 0) +
                (context.row.indexedTarafSah?.["Perkongsian"]?.countTarafSah ||
                  0) +
                (context.row.indexedTarafSah?.["Lain-lain"]?.countTarafSah ||
                  0) +
                (context.row.indexedTarafSah?.["Perbadanan Awam"]
                  ?.countTarafSah || 0) +
                (context.row.indexedTarafSah?.["Pertubuhan Tanpa Untung"]
                  ?.countTarafSah || 0) +
                (context.row.indexedTarafSah?.["Syarikat Kerjasama"]
                  ?.countTarafSah || 0) +
                (context.row.indexedTarafSah?.["Hak Perseorangan"]
                  ?.countTarafSah || 0);
              return {
                value,
                text: value,
              };
              // } else {
              //   return {
              //     value: 0,
              //     text: 0,
              //   };
              // }
            },
            valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 15": {
      TITLE: `Jadual 15: Jumlah Gunatenaga Dan Daftar Gaji di Estet Koko Pada 31 Disember ${
        params.year - 1
      }: ${
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
      SUBTITLE: `Table 15: Total Employment and Payroll of Cocoa Estates as at 31 December, ${
        params.year - 1
      }: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      // PAGE_ORIENTATION: "portrait",
      // BASE_FONT_SIZE: 10,
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      BASE_FONT_SIZE: 9.5,
      RESOLVE_ROWS: async () => {
        if (params.segment === "Sabah" || params.segment === "Sarawak") {
          let allDistricts = [];
          for (const state of allEstateCensusStateDistricts) {
            let allEstateInformations = indexedEstateInformations.where({
              stateCode: String(parseInt(state.stateCode)),
              districtCode: String(parseInt(state.districtCode)),
            });

            let filteredEstateInformations = [];
            for (const info of allEstateInformations) {
              // Aktif Saja
              if (
                process.env.NODE_ENV === "production" &&
                info.estateType !== 1 &&
                info.estateType !== "1"
              )
                continue;

              const foundYear = indexedEstateCensusYearLists.find({
                estateId: info.estateId,
              });
              if (!foundYear) continue;

              const foundValue = indexedValues.find({
                estateInformationId: info._id,
                // code: columnCode,
              });
              // console.log({ info }, !!foundValue);
              if (!foundValue) continue;

              filteredEstateInformations.push(info);
            }

            if (!filteredEstateInformations.length) continue;

            allDistricts.push({
              ...state,
              estateInformations: filteredEstateInformations,
            });
            // console.log(
            //   "filteredEstateInformations",
            //   state.stateCode,
            //   state.stateName,
            //   filteredEstateInformations.length,
            // );
          }

          return allDistricts.map(i => {
            return {
              ...i,
              stateName: i.districtName || i.stateName || "",
            };
          });
        }

        let allStates = [];
        for (const state of allEstateCensusStateCodes) {
          let allEstateInformations = indexedEstateInformations.where({
            stateCode: String(parseInt(state.stateCode)),
          });

          let filteredEstateInformations = [];
          for (const info of allEstateInformations) {
            // Aktif Saja
            if (
              process.env.NODE_ENV === "production" &&
              info.estateType !== 1 &&
              info.estateType !== "1"
            )
              continue;

            const foundYear = indexedEstateCensusYearLists.find({
              estateId: info.estateId,
            });
            if (!foundYear) continue;

            const foundValue = indexedValues.find({
              estateInformationId: info._id,
              // code: columnCode,
            });
            // console.log({ info }, !!foundValue);
            if (!foundValue) continue;

            filteredEstateInformations.push(info);
          }

          if (!filteredEstateInformations.length) continue;

          allStates.push({
            ...state,
            estateInformations: filteredEstateInformations,
          });
          console.log(
            "filteredEstateInformations",
            state.stateCode,
            state.stateName,
            allEstateInformations.length,
            filteredEstateInformations.length,
          );
        }

        return allStates;
      },
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "District"
                : "State",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.stateName,
              value: context.row.stateName,
            }),
            valueAlignment: "center",
          },
          // ------------------------------
          {
            colSpan: 3,
            text: "Jumlah gunatenaga dan daftar gaji",
            alias: "Total Employment and payroll",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [
              "M09842",
              "M09843",
              "M09820",
              "M09821",
              "M09801",
              "M09802",
              "M09823",
              "M09823",
              "M09824",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Pekerja bergaji",
            alias: "Paid Employment",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: ["M09842", "M09843, M09820, M09821"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["M10042", "M10043, M10020, M10021"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            rowSpan: 3,
            text: "Bilangan Pekerja Keluarga tidak bergaji tuan punya",
            alias:
              "Number of unpaid family workers, working proprietors, and partners",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["M09801", "M09802,M09823,M09824"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          // -----------------------------
          {
            colSpan: 8,
            text: "Gunatenaga secara langsung dan daftar gaji",
            alias: "Direct employment and payroll",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: ["M09803", "M09804, M09825, M09826"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["M10003", "M10004, M10025, M10026"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Kakitangan",
            alias: "Staff",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: [
              "M09805",
              "M09806",
              "M09807",
              "M09808",
              "M09809",
              "M09827",
              "M09828",
              "M09829",
              "M09830",
              "M09831",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: [
              "M10005",
              "M10006",
              "M10007",
              "M10008",
              "M10009",
              "M10027",
              "M10028",
              "M10029",
              "M10030",
              "M10031",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Pekerja Estet",
            alias: "Estates Worker",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: [
              "M09811a",
              "M09811b",
              "M09812a",
              "M09812b",
              "M09833a",
              "M09833b",
              "M09834a",
              "M09834b",
              "M09810",
              "M09832",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: [
              "M10011a",
              "M10011b",
              "M10012a",
              "M10012b",
              "M10033a",
              "M10033b",
              "M10034a",
              "M10034b",
              "M10010",
              "M10032",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Pekerja Kilang",
            alias: "Factory Workers",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: ["M09816", "M09817", "M09838", "M09839"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          // --------------------------------------------
          {
            colSpan: 4,
            text: "Gunatenaga secara kontrak",
            alias: "Contract employment and payroll",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: [
              "M09814a",
              "M09814b",
              "M09815a",
              "M09815b",
              "M09836a",
              "M09836b",
              "M09837a",
              "M09837b",
              "M09813",
              "M09835",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Bilangan Pekerja",
            alias: "Number of Worker",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: [
              "M10014a",
              "M10014b",
              "M10015a",
              "M10015b",
              "M10036a",
              "M10036b",
              "M10037a",
              "M10037b",
              "M10013",
              "M10035",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Pekerja Kilang",
            alias: "Factory Workers",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["M09818", "M09819", "M09840", "M09841"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Bilangan Pekerja",
            alias: "Number of Worker",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: ["M10018", "M10019", "M10040", "M10041"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "District"
                : "State",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.stateName,
              value: context.row.stateName,
            }),
            valueAlignment: "center",
          },
          // ------------------------------
          {
            rowSpan: 2,
            text: "Jumlah Pekerja",
            alias: "Total Employment",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [
              "M09842",
              "M09843",
              "M09820",
              "M09821",
              "M09801",
              "M09802",
              "M09823",
              "M09823",
              "M09824",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Pekerja bergaji",
            alias: "Paid Employment",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: ["M09842", "M09843, M09820, M09821"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["M10042", "M10043, M10020, M10021"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Bilangan Pekerja Keluarga tidak bergaji tuan punya",
            alias:
              "Number of unpaid family workers, working proprietors, and partners",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["M09801", "M09802,M09823,M09824"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          // -----------------------------
          {
            colSpan: 2,
            text: "Pengurusan",
            alias: "Management",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: ["M09803", "M09804, M09825, M09826"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["M10003", "M10004, M10025, M10026"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Kakitangan",
            alias: "Staff",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: [
              "M09805",
              "M09806",
              "M09807",
              "M09808",
              "M09809",
              "M09827",
              "M09828",
              "M09829",
              "M09830",
              "M09831",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: [
              "M10005",
              "M10006",
              "M10007",
              "M10008",
              "M10009",
              "M10027",
              "M10028",
              "M10029",
              "M10030",
              "M10031",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Pekerja Estet",
            alias: "Estates Worker",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: [
              "M09811a",
              "M09811b",
              "M09812a",
              "M09812b",
              "M09833a",
              "M09833b",
              "M09834a",
              "M09834b",
              "M09810",
              "M09832",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: [
              "M10011a",
              "M10011b",
              "M10012a",
              "M10012b",
              "M10033a",
              "M10033b",
              "M10034a",
              "M10034b",
              "M10010",
              "M10032",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Pekerja Kilang",
            alias: "Factory Workers",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: ["M09816", "M09817", "M09838", "M09839"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          // --------------------------------------------
          {
            colSpan: 2,
            text: "Pekerja Estet",
            alias: "Estates Workers",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: [
              "M09814a",
              "M09814b",
              "M09815a",
              "M09815b",
              "M09836a",
              "M09836b",
              "M09837a",
              "M09837b",
              "M09813",
              "M09835",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Bilangan Pekerja",
            alias: "Number of Worker",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: [
              "M10014a",
              "M10014b",
              "M10015a",
              "M10015b",
              "M10036a",
              "M10036b",
              "M10037a",
              "M10037b",
              "M10013",
              "M10035",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Pekerja Kilang",
            alias: "Factory Workers",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["M09818", "M09819", "M09840", "M09841"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Bilangan Pekerja",
            alias: "Number of Worker",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: ["M10018", "M10019", "M10040", "M10041"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "Daerah"
                : "Negeri",
            alias:
              params.segment === "Sabah" || params.segment === "Sarawak"
                ? "District"
                : "State",
            alignment: "center",
            bold: true,
            columnWidth: 50,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.stateName,
              value: context.row.stateName,
            }),
            valueAlignment: "center",
          },
          // ------------------------------
          {
            text: "Jumlah Pekerja",
            alias: "Total Employment",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [
              "M09842",
              "M09843",
              "M09820",
              "M09821",
              "M09801",
              "M09802",
              "M09823",
              "M09823",
              "M09824",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Bilangan Pekerja",
            alias: "Number of Worker",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: ["M09842", "M09843, M09820, M09821"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["M10042", "M10043, M10020, M10021"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Bilangan Pekerja Keluarga tidak bergaji tuan punya",
            alias:
              "Number of unpaid family workers, working proprietors, and partners",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["M09801", "M09802,M09823,M09824"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          // -----------------------------
          {
            text: "Bilangan Pekerja",
            alias: "Number of Worker",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: ["M09803", "M09804, M09825, M09826"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["M10003", "M10004, M10025, M10026"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Bilangan Pekerja",
            alias: "Number of Worker",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: [
              "M09805",
              "M09806",
              "M09807",
              "M09808",
              "M09809",
              "M09827",
              "M09828",
              "M09829",
              "M09830",
              "M09831",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: [
              "M10005",
              "M10006",
              "M10007",
              "M10008",
              "M10009",
              "M10027",
              "M10028",
              "M10029",
              "M10030",
              "M10031",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Bilangan Pekerja",
            alias: "Number of Worker",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: [
              "M09811a",
              "M09811b",
              "M09812a",
              "M09812b",
              "M09833a",
              "M09833b",
              "M09834a",
              "M09834b",
              "M09810",
              "M09832",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: [
              "M10011a",
              "M10011b",
              "M10012a",
              "M10012b",
              "M10033a",
              "M10033b",
              "M10034a",
              "M10034b",
              "M10010",
              "M10032",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Bilangan Pekerja",
            alias: "Number of Worker",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: ["M09816", "M09817", "M09838", "M09839"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          // --------------------------------------------
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: [
              "M09814a",
              "M09814b",
              "M09815a",
              "M09815b",
              "M09836a",
              "M09836b",
              "M09837a",
              "M09837b",
              "M09813",
              "M09835",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Bilangan Pekerja",
            alias: "Number of Worker",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: [
              "M10014a",
              "M10014b",
              "M10015a",
              "M10015b",
              "M10036a",
              "M10036b",
              "M10037a",
              "M10037b",
              "M10013",
              "M10035",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Gaji & Upah",
            alias: "Salaries & Wages",
            alignment: "center",
            bold: true,
            columnWidth: 43,
            hideColumnCodes: true,
            columnCodes: ["M09818", "M09819", "M09840", "M09841"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Bilangan Pekerja",
            alias: "Number of Worker",
            alignment: "center",
            bold: true,
            columnWidth: 36,
            hideColumnCodes: true,
            columnCodes: ["M10018", "M10019", "M10040", "M10041"],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 17": {
      TITLE: `Jadual 17: Pengunaan Input (Racun-Serangga,Perosak,Rumpai,LalangKulat), ${
        params.year - 1
      }: ${
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
      SUBTITLE: `Table 17: Usage of Inputs (Insecticides/Pesticides/Weedicides/Herbicides/Fungicides), ${
        params.year - 1
      }: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      // PAGE_ORIENTATION: "portrait",
      // BASE_FONT_SIZE: 10,
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      BASE_FONT_SIZE: 9.5,
      RESOLVE_ROWS: async () => {
        await context.collection("EstateCensusMaklumatBorang").createIndex({
          censusYear: 1,
        });
        const allEstateCensusMaklumatBorang = await context
          .collection("EstateCensusMaklumatBorang")
          .find({
            _deletedAt: {
              $exists: false,
            },
            estateStatus: {
              $in: ["Terbiar", "Aktif", "Tiada"],
            },
          })
          .toArray();
        indexedEstateCensusMaklumatBorang = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "censusYear", "estateStatus"],
          },
        });
        indexedEstateCensusMaklumatBorang.add(allEstateCensusMaklumatBorang);

        await context
          .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
          .createIndex({
            censusYear: 1,
          });
        const allEstateCensusHakMilikPertubuhanAndSeksyenValues = await context
          .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
          .find({
            // censusYear: params.year - 1,
            censusYear: params.year,
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        // console.log(
        //   "allEstateCensusHakMilikPertubuhanAndSeksyenValues",
        //   allEstateCensusHakMilikPertubuhanAndSeksyenValues.length,
        // );
        indexedEstateCensusHakMilikPertubuhanAndSeksyenValues = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "code"],
          },
        });
        indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.add(
          allEstateCensusHakMilikPertubuhanAndSeksyenValues,
        );

        if (params.segment === "Sabah" || params.segment === "Sarawak") {
          let allDistricts = [];
          for (const state of allEstateCensusStateDistricts) {
            let allEstateInformations = indexedEstateInformations.where({
              stateCode: String(parseInt(state.stateCode)),
              districtCode: String(parseInt(state.districtCode)),
            });

            let filteredEstateInformations = [];
            for (const info of allEstateInformations) {
              // Aktif Saja
              // if (
              //   process.env.NODE_ENV === "production" &&
              //   info.estateType !== 1 &&
              //   info.estateType !== "1"
              // )
              //   continue;

              // const foundYear = indexedEstateCensusYearLists.find({
              //   estateId: info.estateId,
              // });
              // if (!foundYear) continue;

              const maklumatBorang = indexedEstateCensusMaklumatBorang.where({
                estateId: info.estateId,
                censusYear: params.year,
              });

              if (
                process.env.NODE_ENV === "production" &&
                maklumatBorang.length > 0
              )
                continue;

              const foundValue = indexedValues.find({
                estateInformationId: info._id,
                // code: columnCode,
              });
              // console.log({ info }, !!foundValue);
              if (!foundValue) continue;

              filteredEstateInformations.push(info);
            }

            if (!filteredEstateInformations.length) continue;

            allDistricts.push({
              ...state,
              estateInformations: filteredEstateInformations,
            });
            // console.log(
            //   "filteredEstateInformations",
            //   state.stateCode,
            //   state.stateName,
            //   filteredEstateInformations.length,
            // );
          }

          return allDistricts.map(i => {
            return {
              ...i,
              stateName: i.districtName || i.stateName || "",
            };
          });
        }

        let allStates = [];
        for (const state of allEstateCensusStateCodes) {
          let allEstateInformations = indexedEstateInformations.where({
            stateCode: String(parseInt(state.stateCode)),
          });

          let filteredEstateInformations = [];
          for (const info of allEstateInformations) {
            // Aktif Saja
            // if (
            //   process.env.NODE_ENV === "production" &&
            //   info.estateType !== 1 &&
            //   info.estateType !== "1"
            // )
            //   continue;

            // const foundYear = indexedEstateCensusYearLists.find({
            //   estateId: info.estateId,
            // });

            // if (!foundYear) continue;
            const maklumatBorang = indexedEstateCensusMaklumatBorang.where({
              estateId: info.estateId,
              censusYear: params.year,
            });

            if (
              process.env.NODE_ENV === "production" &&
              maklumatBorang.length > 0
            )
              continue;

            const foundValue = indexedValues.find({
              estateInformationId: info._id,
              // code: columnCode,
            });
            // console.log({ info }, !!foundValue);
            if (!foundValue) continue;

            filteredEstateInformations.push(info);
          }

          if (!filteredEstateInformations.length) continue;

          allStates.push({
            ...state,
            estateInformations: filteredEstateInformations,
          });
          // console.log(
          //   "filteredEstateInformations",
          //   state.stateCode,
          //   state.stateName,
          //   filteredEstateInformations.length,
          // );
        }

        let groupObject = {};

        for (const group of [
          "Racun Serangga dan Perosak",
          "Racun Rumpai dan Lalang",
          "Racun Kulat",
          "Lain-lain",
        ]) {
          if (!groupObject[group]) {
            groupObject[group] = {
              label: group,
              mudaHektar: 0,
              mudaLiter: 0,
              mudaKg: 0,
              mudaNilai: 0,
              cukupUmurHektar: 0,
              cukupUmurLiter: 0,
              cukupUmurKg: 0,
              cukupUmurNilai: 0,
            };
          }

          for (const state of allStates.map(st => st.estateInformations)) {
            for (const estateId of state.map(st => st.estateId)) {
              let mudaHektar =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId,
                  code:
                    group === "Racun Serangga dan Perosak"
                      ? "I06101"
                      : group === "Racun Rumpai dan Lalang"
                      ? "I06102"
                      : group === "Racun Kulat"
                      ? "I06103"
                      : group === "Lain-lain"
                      ? "I06104"
                      : "",
                });
              mudaHektar = mudaHektar
                .map(m => m.value)
                .reduce((acc, curr) => acc + curr, 0);

              groupObject[group] = {
                ...groupObject[group],
                mudaHektar: groupObject[group].mudaHektar + mudaHektar,
              };

              let mudaLiter =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId,
                  code:
                    group === "Racun Serangga dan Perosak"
                      ? "I062a01"
                      : group === "Racun Rumpai dan Lalang"
                      ? "I062a02"
                      : group === "Racun Kulat"
                      ? "I062a03"
                      : group === "Lain-lain"
                      ? "I062a04"
                      : "",
                });
              mudaLiter = mudaLiter
                .map(m => m.value)
                .reduce((acc, curr) => acc + curr, 0);
              groupObject[group] = {
                ...groupObject[group],
                mudaLiter: groupObject[group].mudaLiter + mudaLiter,
              };

              let mudaKg =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId,
                  code:
                    group === "Racun Serangga dan Perosak"
                      ? "I06201"
                      : group === "Racun Rumpai dan Lalang"
                      ? "I06202"
                      : group === "Racun Kulat"
                      ? "I06203"
                      : group === "Lain-lain"
                      ? "I06204"
                      : "",
                });
              mudaKg = mudaKg
                .map(m => m.value)
                .reduce((acc, curr) => acc + curr, 0);
              groupObject[group] = {
                ...groupObject[group],
                mudaKg: groupObject[group].mudaKg + mudaKg,
              };

              let mudaNilai =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId,
                  code:
                    group === "Racun Serangga dan Perosak"
                      ? "I06301"
                      : group === "Racun Rumpai dan Lalang"
                      ? "I06302"
                      : group === "Racun Kulat"
                      ? "I06303"
                      : group === "Lain-lain"
                      ? "I06304"
                      : "",
                });
              mudaNilai = mudaNilai
                .map(m => m.value)
                .reduce((acc, curr) => acc + curr, 0);
              groupObject[group] = {
                ...groupObject[group],
                mudaNilai: groupObject[group].mudaNilai + mudaNilai,
              };

              //--------------------
              let cukupUmurHektar =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId,
                  code:
                    group === "Racun Serangga dan Perosak"
                      ? "I06106"
                      : group === "Racun Rumpai dan Lalang"
                      ? "I06107"
                      : group === "Racun Kulat"
                      ? "I06108"
                      : group === "Lain-lain"
                      ? "I06109"
                      : "",
                });
              cukupUmurHektar = cukupUmurHektar
                .map(m => m.value)
                .reduce((acc, curr) => acc + curr, 0);

              groupObject[group] = {
                ...groupObject[group],
                cukupUmurHektar:
                  groupObject[group].cukupUmurHektar + cukupUmurHektar,
              };

              let cukupUmurLiter =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId,
                  code:
                    group === "Racun Serangga dan Perosak"
                      ? "I062a06"
                      : group === "Racun Rumpai dan Lalang"
                      ? "I062a07"
                      : group === "Racun Kulat"
                      ? "I062a08"
                      : group === "Lain-lain"
                      ? "I062a09"
                      : "",
                });
              cukupUmurLiter = cukupUmurLiter
                .map(m => m.value)
                .reduce((acc, curr) => acc + curr, 0);
              groupObject[group] = {
                ...groupObject[group],
                cukupUmurLiter:
                  groupObject[group].cukupUmurLiter + cukupUmurLiter,
              };

              let cukupUmurKg =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId,
                  code:
                    group === "Racun Serangga dan Perosak"
                      ? "I06206"
                      : group === "Racun Rumpai dan Lalang"
                      ? "I06207"
                      : group === "Racun Kulat"
                      ? "I06208"
                      : group === "Lain-lain"
                      ? "I06209"
                      : "",
                });
              cukupUmurKg = cukupUmurKg
                .map(m => m.value)
                .reduce((acc, curr) => acc + curr, 0);
              groupObject[group] = {
                ...groupObject[group],
                cukupUmurKg: groupObject[group].cukupUmurKg + cukupUmurKg,
              };

              let cukupUmurNilai =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId,
                  code:
                    group === "Racun Serangga dan Perosak"
                      ? "I06306"
                      : group === "Racun Rumpai dan Lalang"
                      ? "I06307"
                      : group === "Racun Kulat"
                      ? "I06308"
                      : group === "Lain-lain"
                      ? "I06309"
                      : "",
                });
              cukupUmurNilai = cukupUmurNilai
                .map(m => m.value)
                .reduce((acc, curr) => acc + curr, 0);
              groupObject[group] = {
                ...groupObject[group],
                cukupUmurNilai:
                  groupObject[group].cukupUmurNilai + cukupUmurNilai,
              };
            }
          }
        }

        let results = [];
        for (const key of Object.keys(groupObject)) {
          let res = groupObject[key];

          if (res.label === "Racun Serangga dan Perosak") {
            res.alias =
              "Insecticides and Pesticides (Decis/Cymbush/Unicide etc)";
          } else if (res.label === "Racun Rumpai dan Lalang") {
            res.alias =
              "Herbicides and Weedicides (Roundup/Gromoxone/Spark/Starane etc)";
          } else if (res.label === "Racun Kulat") {
            res.alias = "(Fungicides/Copranto/Bentate/)";
          } else {
            res.alias = "Others";
          }
          results.push(res);
        }

        return results;
        // return allStates;
      },
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text: "JENIS RACUN(SERANGGA/PEROSAK/RUMPAI)\n\n",
            alias:
              "Type Of Insectisides/Pesticides/weedicides/Herbicides/Fungicides",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: "",
              value: "",
            }),
            valueAlignment: "center",
          },
          // ------------------------------
          {
            colSpan: 4,
            text: "Keluasan Muda",
            alias: "Immature Area",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [
              "M09842",
              "M09843",
              "M09820",
              "M09821",
              "M09801",
              "M09802",
              "M09823",
              "M09823",
              "M09824",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Kuantiti digunakan",
            alias: "Quantity Used",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [
              "M09842",
              "M09843",
              "M09820",
              "M09821",
              "M09801",
              "M09802",
              "M09823",
              "M09823",
              "M09824",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Kg",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [
              "M09842",
              "M09843",
              "M09820",
              "M09821",
              "M09801",
              "M09802",
              "M09823",
              "M09823",
              "M09824",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Nilai",
            alias: "Value",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [
              "M09842",
              "M09843",
              "M09820",
              "M09821",
              "M09801",
              "M09802",
              "M09823",
              "M09823",
              "M09824",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          // -----------------------------

          {
            colSpan: 4,
            text: "Keluasan Cukup Umur",
            alias: "Matured Area",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [
              "M09842",
              "M09843",
              "M09820",
              "M09821",
              "M09801",
              "M09802",
              "M09823",
              "M09823",
              "M09824",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Kuantiti digunakan",
            alias: "Quantity Used",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [
              "M09842",
              "M09843",
              "M09820",
              "M09821",
              "M09801",
              "M09802",
              "M09823",
              "M09823",
              "M09824",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Kg",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [
              "M09842",
              "M09843",
              "M09820",
              "M09821",
              "M09801",
              "M09802",
              "M09823",
              "M09823",
              "M09824",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Nilai",
            alias: "Value",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [
              "M09842",
              "M09843",
              "M09820",
              "M09821",
              "M09801",
              "M09802",
              "M09823",
              "M09823",
              "M09824",
            ],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
        ],
        [
          {
            text: "JENIS RACUN(SERANGGA/PEROSAK/RUMPAI)\n\n",
            alias:
              "Type Of Insectisides/Pesticides/weedicides/Herbicides/Fungicides",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: "",
              value: "",
            }),
            valueAlignment: "center",
          },
          // ------------------------------
          {
            rowSpan: 2,
            text: "Keluasan Diracun",
            alias: "Hectarage treated",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Kuantiti digunakan",
            alias: "Quantity Used",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Kg",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            rowSpan: 2,
            text: "Nilai",
            alias: "Value",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },

          //-------------------------------
          {
            rowSpan: 2,
            text: "Keluasan Diracun",
            alias: "Hectarage treated",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Kuantiti digunakan",
            alias: "Quantity Used",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Kg",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            rowSpan: 2,
            text: "Nilai",
            alias: "Value",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
        ],
        [
          {
            text: "JENIS RACUN(SERANGGA/PEROSAK/RUMPAI)\n\n",
            alias:
              "Type Of Insectisides/Pesticides/weedicides/Herbicides/Fungicides",
            alignment: "left",
            bold: true,
            columnWidth: 150,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: `${context.row.label}\n\n${context.row.alias}`,
              value: context.row.label,
            }),
            valueAlignment: "center",
          },
          // ------------------------------
          {
            text: "Keluasan Diracun",
            alias: "Hectarage treated",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["I06101", "I06102", "I06103", "I06104"],
            statsPrecision: 0,
            resolveValue: context => {
              return {
                value: lodash.round(context.row.mudaHektar, 0),
                text: formatNumber(lodash.round(context.row.mudaHektar, 0)),
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Liter",
            alias: "Litre",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["I062a01", "I062a02", "I062a03", "I062a04"],
            statsPrecision: 0,
            resolveValue: context => {
              return {
                value: lodash.round(context.row.mudaLiter, 0),
                text: formatNumber(lodash.round(context.row.mudaLiter, 0)),
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Kg",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["I06201", "I06202", "I06203", "I06204"],
            statsPrecision: 0,
            resolveValue: context => {
              return {
                value: lodash.round(context.row.mudaKg, 0),
                text: formatNumber(lodash.round(context.row.mudaKg, 0)),
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Nilai",
            alias: "Value",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["I06301", "I06302", "I06303", "I06304"],
            statsPrecision: 0,
            resolveValue: context => {
              return {
                value: lodash.round(context.row.mudaNilai, 2),
                text: formatNumber(lodash.round(context.row.mudaNilai, 2), 2),
              };
            },
            valueAlignment: "center",
          },

          // --------------------------
          {
            text: "Keluasan Diracun",
            alias: "Hectarage treated",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["I06106", "I06107", "I06108", "I06109"],
            statsPrecision: 0,
            resolveValue: context => {
              return {
                value: lodash.round(context.row.cukupUmurHektar, 0),
                text: formatNumber(
                  lodash.round(context.row.cukupUmurHektar, 0),
                ),
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Liter",
            alias: "Litre",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["I062a06", "I062a07", "I062a08", "I062a09"],
            statsPrecision: 0,
            resolveValue: context => {
              return {
                value: lodash.round(context.row.cukupUmurLiter, 0),
                text: formatNumber(lodash.round(context.row.cukupUmurLiter, 0)),
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Kg",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["I06206", "I06207", "I06208", "I06209"],
            statsPrecision: 0,
            resolveValue: context => {
              return {
                value: lodash.round(context.row.cukupUmurKg, 0),
                text: formatNumber(lodash.round(context.row.cukupUmurKg, 0)),
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Nilai",
            alias: "Value",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["I06306", "I06307", "I06308", "I06309"],
            statsPrecision: 0,
            resolveValue: context => {
              return {
                value: lodash.round(context.row.cukupUmurNilai, 2),
                text: formatNumber(
                  lodash.round(context.row.cukupUmurNilai, 2),
                  2,
                ),
              };
            },
            valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 16": {
      TITLE: `Jadual 16: Penggunaan Input (Baja), ${params.year - 1}: ${
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
      SUBTITLE: `Table 16: Usage of Inputs (Fertilizer), ${params.year - 1}: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      // PAGE_ORIENTATION: "portrait",
      // BASE_FONT_SIZE: 10,
      GROUPED_FOOTERS_CONFIG: [
        //
        "allStats",
      ],
      BASE_FONT_SIZE: 9.5,
      RESOLVE_ROWS: async () => {
        await context.collection("EstateCensusMaklumatBorang").createIndex({
          censusYear: 1,
        });
        const allEstateCensusMaklumatBorang = await context
          .collection("EstateCensusMaklumatBorang")
          .find({
            _deletedAt: {
              $exists: false,
            },
            estateStatus: {
              $in: ["Terbiar", "Aktif", "Tiada"],
            },
          })
          .toArray();
        indexedEstateCensusMaklumatBorang = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "censusYear", "estateStatus"],
          },
        });
        indexedEstateCensusMaklumatBorang.add(allEstateCensusMaklumatBorang);

        await context
          .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
          .createIndex({
            censusYear: 1,
          });
        const allEstateCensusHakMilikPertubuhanAndSeksyenValues = await context
          .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
          .find({
            // censusYear: params.year - 1,
            censusYear: params.year,
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        // console.log(
        //   "allEstateCensusHakMilikPertubuhanAndSeksyenValues",
        //   allEstateCensusHakMilikPertubuhanAndSeksyenValues.length,
        // );
        indexedEstateCensusHakMilikPertubuhanAndSeksyenValues = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "code"],
          },
        });
        indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.add(
          allEstateCensusHakMilikPertubuhanAndSeksyenValues,
        );

        if (params.segment === "Sabah" || params.segment === "Sarawak") {
          let allDistricts = [];
          for (const state of allEstateCensusStateDistricts) {
            let allEstateInformations = indexedEstateInformations.where({
              stateCode: String(parseInt(state.stateCode)),
              districtCode: String(parseInt(state.districtCode)),
            });

            let filteredEstateInformations = [];
            for (const info of allEstateInformations) {
              // Aktif Saja
              // if (
              //   process.env.NODE_ENV === "production" &&
              //   info.estateType !== 1 &&
              //   info.estateType !== "1"
              // )
              //   continue;

              // const foundYear = indexedEstateCensusYearLists.find({
              //   estateId: info.estateId,
              // });
              // if (!foundYear) continue;

              const maklumatBorang = indexedEstateCensusMaklumatBorang.where({
                estateId: info.estateId,
                censusYear: params.year,
              });

              if (
                process.env.NODE_ENV === "production" &&
                maklumatBorang.length > 0
              )
                continue;

              const foundValue = indexedValues.find({
                estateInformationId: info._id,
                // code: columnCode,
              });
              // console.log({ info }, !!foundValue);
              if (!foundValue) continue;

              filteredEstateInformations.push(info);
            }

            if (!filteredEstateInformations.length) continue;

            allDistricts.push({
              ...state,
              estateInformations: filteredEstateInformations,
            });
            // console.log(
            //   "filteredEstateInformations",
            //   state.stateCode,
            //   state.stateName,
            //   filteredEstateInformations.length,
            // );
          }

          return allDistricts.map(i => {
            return {
              ...i,
              stateName: i.districtName || i.stateName || "",
            };
          });
        }

        let allStates = [];
        for (const state of allEstateCensusStateCodes) {
          let allEstateInformations = indexedEstateInformations.where({
            stateCode: String(parseInt(state.stateCode)),
          });

          let filteredEstateInformations = [];
          for (const info of allEstateInformations) {
            // Aktif Saja
            // if (
            //   process.env.NODE_ENV === "production" &&
            //   info.estateType !== 1 &&
            //   info.estateType !== "1"
            // )
            //   continue;

            // const foundYear = indexedEstateCensusYearLists.find({
            //   estateId: info.estateId,
            // });

            // if (!foundYear) continue;
            const maklumatBorang = indexedEstateCensusMaklumatBorang.where({
              estateId: info.estateId,
              censusYear: params.year,
            });

            if (
              process.env.NODE_ENV === "production" &&
              maklumatBorang.length > 0
            )
              continue;

            const foundValue = indexedValues.find({
              estateInformationId: info._id,
              // code: columnCode,
            });
            // console.log({ info }, !!foundValue);
            if (!foundValue) continue;

            filteredEstateInformations.push(info);
          }

          if (!filteredEstateInformations.length) continue;

          allStates.push({
            ...state,
            estateInformations: filteredEstateInformations,
          });
          // console.log(
          //   "filteredEstateInformations",
          //   state.stateCode,
          //   state.stateName,
          //   filteredEstateInformations.length,
          // );
        }

        let groupObject = {};

        for (const group of [
          "Campuran (serbuk, campuran, sebatian)",
          "Baja Tunggal (CIRP, Muriate of Potash, Urea, Nitro, Kapur, Batu Kapur dan Lain-lain)",
          "Lain-lain",
        ]) {
          if (!groupObject[group]) {
            groupObject[group] = {
              label: group,
              mudaHektar: 0,
              mudaLiter: 0,
              mudaKg: 0,
              mudaNilai: 0,
              cukupUmurHektar: 0,
              cukupUmurLiter: 0,
              cukupUmurKg: 0,
              cukupUmurNilai: 0,
            };
          }

          for (const state of allStates.map(st => st.estateInformations)) {
            for (const estateId of state.map(st => st.estateId)) {
              let mudaHektar =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId,
                  code:
                    group === "Campuran (serbuk, campuran, sebatian)"
                      ? "I05801"
                      : group ===
                        "Baja Tunggal (CIRP, Muriate of Potash, Urea, Nitro, Kapur, Batu Kapur dan Lain-lain)"
                      ? "I05802"
                      : group === "Lain-lain"
                      ? "I05802a"
                      : "",
                });
              mudaHektar = mudaHektar
                .map(m => m.value)
                .reduce((acc, curr) => acc + curr, 0);

              groupObject[group] = {
                ...groupObject[group],
                mudaHektar: groupObject[group].mudaHektar + mudaHektar,
              };

              let mudaLiter =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId,
                  code:
                    group === "Campuran (serbuk, campuran, sebatian)"
                      ? "I059a01"
                      : group ===
                        "Baja Tunggal (CIRP, Muriate of Potash, Urea, Nitro, Kapur, Batu Kapur dan Lain-lain)"
                      ? "I059a02"
                      : group === "Lain-lain"
                      ? "I059a02a"
                      : "",
                });
              mudaLiter = mudaLiter
                .map(m => m.value)
                .reduce((acc, curr) => acc + curr, 0);
              groupObject[group] = {
                ...groupObject[group],
                mudaLiter: groupObject[group].mudaLiter + mudaLiter,
              };

              let mudaKg =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId,
                  code:
                    group === "Campuran (serbuk, campuran, sebatian)"
                      ? "I05901"
                      : group ===
                        "Baja Tunggal (CIRP, Muriate of Potash, Urea, Nitro, Kapur, Batu Kapur dan Lain-lain)"
                      ? "I05902"
                      : group === "Lain-lain"
                      ? "I05902a"
                      : "",
                });
              mudaKg = mudaKg
                .map(m => m.value)
                .reduce((acc, curr) => acc + curr, 0);
              groupObject[group] = {
                ...groupObject[group],
                mudaKg: groupObject[group].mudaKg + mudaKg,
              };

              let mudaNilai =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId,
                  code:
                    group === "Campuran (serbuk, campuran, sebatian)"
                      ? "I06001"
                      : group ===
                        "Baja Tunggal (CIRP, Muriate of Potash, Urea, Nitro, Kapur, Batu Kapur dan Lain-lain)"
                      ? "I06002"
                      : group === "Lain-lain"
                      ? "I06002a"
                      : "",
                });
              mudaNilai = mudaNilai
                .map(m => m.value)
                .reduce((acc, curr) => acc + curr, 0);
              groupObject[group] = {
                ...groupObject[group],
                mudaNilai: groupObject[group].mudaNilai + mudaNilai,
              };

              //--------------------
              let cukupUmurHektar =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId,
                  code:
                    group === "Campuran (serbuk, campuran, sebatian)"
                      ? "I05804"
                      : group ===
                        "Baja Tunggal (CIRP, Muriate of Potash, Urea, Nitro, Kapur, Batu Kapur dan Lain-lain)"
                      ? "I05805"
                      : group === "Lain-lain"
                      ? "I05805a"
                      : "",
                });
              cukupUmurHektar = cukupUmurHektar
                .map(m => m.value)
                .reduce((acc, curr) => acc + curr, 0);

              groupObject[group] = {
                ...groupObject[group],
                cukupUmurHektar:
                  groupObject[group].cukupUmurHektar + cukupUmurHektar,
              };

              let cukupUmurLiter =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId,
                  code:
                    group === "Campuran (serbuk, campuran, sebatian)"
                      ? "I059a04"
                      : group ===
                        "Baja Tunggal (CIRP, Muriate of Potash, Urea, Nitro, Kapur, Batu Kapur dan Lain-lain)"
                      ? "I059a05"
                      : group === "Lain-lain"
                      ? "I059a05a"
                      : "",
                });
              cukupUmurLiter = cukupUmurLiter
                .map(m => m.value)
                .reduce((acc, curr) => acc + curr, 0);
              groupObject[group] = {
                ...groupObject[group],
                cukupUmurLiter:
                  groupObject[group].cukupUmurLiter + cukupUmurLiter,
              };

              let cukupUmurKg =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId,
                  code:
                    group === "Campuran (serbuk, campuran, sebatian)"
                      ? "I05904"
                      : group ===
                        "Baja Tunggal (CIRP, Muriate of Potash, Urea, Nitro, Kapur, Batu Kapur dan Lain-lain)"
                      ? "I05905"
                      : group === "Lain-lain"
                      ? "I05905a"
                      : "",
                });
              cukupUmurKg = cukupUmurKg
                .map(m => m.value)
                .reduce((acc, curr) => acc + curr, 0);
              groupObject[group] = {
                ...groupObject[group],
                cukupUmurKg: groupObject[group].cukupUmurKg + cukupUmurKg,
              };

              let cukupUmurNilai =
                indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                  estateId,
                  code:
                    group === "Campuran (serbuk, campuran, sebatian)"
                      ? "I06004"
                      : group ===
                        "Baja Tunggal (CIRP, Muriate of Potash, Urea, Nitro, Kapur, Batu Kapur dan Lain-lain)"
                      ? "I06005"
                      : group === "Lain-lain"
                      ? "I06005a"
                      : "",
                });
              cukupUmurNilai = cukupUmurNilai
                .map(m => m.value)
                .reduce((acc, curr) => acc + curr, 0);
              groupObject[group] = {
                ...groupObject[group],
                cukupUmurNilai:
                  groupObject[group].cukupUmurNilai + cukupUmurNilai,
              };
            }
          }
        }

        let results = [];
        for (const key of Object.keys(groupObject)) {
          let res = groupObject[key];

          if (res.label === "Campuran (serbuk, campuran, sebatian)") {
            res.alias = "Mixtures (powder, blended or granulated compounds)";
          } else if (
            res.label ===
            "Baja Tunggal (CIRP, Muriate of Potash, Urea, Nitro, Kapur, Batu Kapur dan Lain-lain)"
          ) {
            res.alias =
              "Straight Fertilizer (CIRP, Muriate of Potash, Urea, Nitro, Basic Slag)";
          } else {
            res.alias = "Others";
          }
          results.push(res);
        }

        return results;
        // return allStates;
      },
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text: "JENIS BAJA YANG\n\n",
            alias: "Type of Fertilizer Used",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: "",
              value: "",
            }),
            valueAlignment: "center",
          },
          // ------------------------------
          {
            colSpan: 4,
            text: "Keluasan Muda",
            alias: "Immature Area",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Kuantiti digunakan",
            alias: "Quantity Used",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Kg",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Nilai",
            alias: "Value",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          // -----------------------------

          {
            colSpan: 4,
            text: "Keluasan Cukup Umur",
            alias: "Matured Area",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Kuantiti digunakan",
            alias: "Quantity Used",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Kg",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Nilai",
            alias: "Value",
            alignment: "center",
            bold: true,
            columnWidth: 35,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
        ],
        [
          {
            text: "JENIS RACUN(SERANGGA/PEROSAK/RUMPAI)\n\n",
            alias:
              "Type Of Insectisides/Pesticides/weedicides/Herbicides/Fungicides",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: "",
              value: "",
            }),
            valueAlignment: "center",
          },
          // ------------------------------
          {
            rowSpan: 2,
            text: "Keluasan Dibaja",
            alias: "Hectarage Fertilized",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Kuantiti digunakan",
            alias: "Quantity Used",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Kg",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            rowSpan: 2,
            text: "Nilai",
            alias: "Value",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },

          //-------------------------------
          {
            rowSpan: 2,
            text: "Keluasan Dibaja",
            alias: "Hectarage Fertilized",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            colSpan: 2,
            text: "Kuantiti digunakan",
            alias: "Quantity Used",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            text: "Kg",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
          {
            rowSpan: 2,
            text: "Nilai",
            alias: "Value",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesValue,
            valueAlignment: "center",
          },
        ],
        [
          {
            text: "JENIS RACUN(SERANGGA/PEROSAK/RUMPAI)\n\n",
            alias:
              "Type Of Insectisides/Pesticides/weedicides/Herbicides/Fungicides",
            alignment: "left",
            bold: true,
            columnWidth: 150,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: `${context.row.label}\n\n${context.row.alias}`,
              value: context.row.label,
            }),
            valueAlignment: "center",
          },
          // ------------------------------
          {
            text: "Keluasan Dibaja",
            alias: "Hectarage Fertilized",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["I06101", "I06102", "I06103", "I06104"],
            statsPrecision: 0,
            resolveValue: context => {
              return {
                value: lodash.round(context.row.mudaHektar, 0),
                text: formatNumber(lodash.round(context.row.mudaHektar, 0)),
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Liter",
            alias: "Litre",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["I062a01", "I062a02", "I062a03", "I062a04"],
            statsPrecision: 0,
            resolveValue: context => {
              return {
                value: lodash.round(context.row.mudaLiter, 0),
                text: formatNumber(lodash.round(context.row.mudaLiter, 0)),
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Kg",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["I06201", "I06202", "I06203", "I06204"],
            statsPrecision: 0,
            resolveValue: context => {
              return {
                value: lodash.round(context.row.mudaKg, 0),
                text: formatNumber(lodash.round(context.row.mudaKg, 0)),
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Nilai",
            alias: "Value",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["I06301", "I06302", "I06303", "I06304"],
            statsPrecision: 2,
            resolveValue: context => {
              return {
                value: lodash.round(context.row.mudaNilai, 2),
                text: formatNumber(lodash.round(context.row.mudaNilai, 2), 2),
              };
            },
            valueAlignment: "center",
          },

          // --------------------------
          {
            text: "Keluasan Dibaja",
            alias: "Hectarage Fertilized",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["I06106", "I06107", "I06108", "I06109"],
            statsPrecision: 0,
            resolveValue: context => {
              return {
                value: lodash.round(context.row.cukupUmurHektar, 0),
                text: formatNumber(
                  lodash.round(context.row.cukupUmurHektar, 0),
                ),
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Liter",
            alias: "Litre",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["I062a06", "I062a07", "I062a08", "I062a09"],
            statsPrecision: 0,
            resolveValue: context => {
              return {
                value: lodash.round(context.row.cukupUmurLiter, 0),
                text: formatNumber(lodash.round(context.row.cukupUmurLiter, 0)),
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Kg",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["I06206", "I06207", "I06208", "I06209"],
            statsPrecision: 0,
            resolveValue: context => {
              return {
                value: lodash.round(context.row.cukupUmurKg, 0),
                text: formatNumber(lodash.round(context.row.cukupUmurKg, 0)),
              };
            },
            valueAlignment: "center",
          },
          {
            text: "Nilai",
            alias: "Value",
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["I06306", "I06307", "I06308", "I06309"],
            statsPrecision: 2,
            resolveValue: context => {
              return {
                value: lodash.round(context.row.cukupUmurNilai, 2),
                text: formatNumber(
                  lodash.round(context.row.cukupUmurNilai, 2),
                  2,
                ),
              };
            },
            valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 14": {
      TITLE: `Jadual 14: Jumlah Gunatenaga Dan Daftar Gaji Mengikuti Kategori Pekerja Bagi Estet Koko, ${
        params.year - 1
      }: ${
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
      SUBTITLE: `Table 14: Total Employment and Payroll by Category of Workers for Cocoa Estates, ${
        params.year - 1
      }: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      // PAGE_ORIENTATION: "portrait",
      // BASE_FONT_SIZE: 10,
      GROUPED_FOOTERS_CONFIG: [
        //
        // "allStats",
      ],
      BASE_FONT_SIZE: 10,
      RESOLVE_ROWS: async () => {
        return [
          {
            label: "1. Jumlah (2 + 5 + 12)",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan": "M09322+M09344+M09722+M09744",
              "Warga Negara Malaysia - Jumlah": "M09322+M09344",
              "Warga Negara Malaysia - Lelaki": "M09322",
              "Warga Negara Malaysia - Perempuan": "M09344",
              "Bukan Warga Negara Malaysia - Jumlah": "M09722+M09744",
              "Bukan Warga Negara Malaysia - Lelaki": "M09722",
              "Bukan Warga Negara Malaysia - Perempuan": "M09744",
              "Gaji Dan Upah Dibayar": "M10022+M10044",
            },
          },
          {
            label:
              "2. Jumlah Pemilik yang bekerja dan pekerja keluarga tidak bergaji (3+4)",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan":
                "M09301+M09302+M09323+M09324+M09701+M09702+M09723+M09724",
              "Warga Negara Malaysia - Jumlah": "M09301+M09302+M09323+M09324",
              "Warga Negara Malaysia - Lelaki": "M09301+M09302",
              "Warga Negara Malaysia - Perempuan": "M09323+M09324",
              "Bukan Warga Negara Malaysia - Jumlah":
                "M09701+M09702+M09723+M09724",
              "Bukan Warga Negara Malaysia - Lelaki": "M09701+M09702",
              "Bukan Warga Negara Malaysia - Perempuan": "M09723+M09724",
              "Gaji Dan Upah Dibayar": "",
            },
          },
          {
            label: "3. Pemilik yang bekerja dan rakaniaga aktif",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan": "M09301+M09323+M09701+M09723",
              "Warga Negara Malaysia - Jumlah": "M09301+M09323",
              "Warga Negara Malaysia - Lelaki": "M09301",
              "Warga Negara Malaysia - Perempuan": "M09323",
              "Bukan Warga Negara Malaysia - Jumlah": "M09701+M09723",
              "Bukan Warga Negara Malaysia - Lelaki": "M09701",
              "Bukan Warga Negara Malaysia - Perempuan": "M09723",
              "Gaji Dan Upah Dibayar": "",
            },
          },
          {
            label:
              "4. Pekerja keluarga tidak bergaji (semua ahli keluarga dan rekan yang tidak menerima upah tetap)",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan": "M09302+M09324+M09702+M09724",
              "Warga Negara Malaysia - Jumlah": "M09302+M09324",
              "Warga Negara Malaysia - Lelaki": "M09302",
              "Warga Negara Malaysia - Perempuan": "M09324",
              "Bukan Warga Negara Malaysia - Jumlah": "M09702+M09724",
              "Bukan Warga Negara Malaysia - Lelaki": "M09702",
              "Bukan Warga Negara Malaysia - Perempuan": "M09724",
              "Gaji Dan Upah Dibayar": "",
            },
          },
          {
            label: "5. Jumlah pekerja bergaji separuh masa",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan":
                "M09322-M09301-M09302-M09321+M09344-M09323-M09324-M09343+M09722-M09701-M09702-M09721+M09744-M09723-M09724-M09743",
              "Warga Negara Malaysia - Jumlah":
                "M09322-M09301-M09302-M09321+M09344-M09323-M09324-M09343",
              "Warga Negara Malaysia - Lelaki": "M09322-M09301-M09302-M09321",
              "Warga Negara Malaysia - Perempuan":
                "M09344-M09323-M09324-M09343",
              "Bukan Warga Negara Malaysia - Jumlah":
                "M09722-M09701-M09702-M09721+M09744-M09723-M09724-M09743",
              "Bukan Warga Negara Malaysia - Lelaki":
                "M09722-M09701-M09702-M09721",
              "Bukan Warga Negara Malaysia - Perempuan":
                "M09744-M09723-M09724-M09743",
              "Gaji Dan Upah Dibayar": "M10022+M10044-M10021-M10043",
            },
          },
          {
            label:
              "6. Mengurus dan profesional managerial dan profesional\n(i) Profesional",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan": "M09303+M09325+M09703+M09725",
              "Warga Negara Malaysia - Jumlah": "M09303+M09325",
              "Warga Negara Malaysia - Lelaki": "M09303",
              "Warga Negara Malaysia - Perempuan": "M09325",
              "Bukan Warga Negara Malaysia - Jumlah": "M09703+M09725",
              "Bukan Warga Negara Malaysia - Lelaki": "M09703",
              "Bukan Warga Negara Malaysia - Perempuan": "M09725",
              "Gaji Dan Upah Dibayar": "M10003+M10025",
            },
          },
          {
            label: "(ii) Bukan Profesional",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan": "M09304+M09326+M09704+M09726",
              "Warga Negara Malaysia - Jumlah": "M09304+M09326",
              "Warga Negara Malaysia - Lelaki": "M09304",
              "Warga Negara Malaysia - Perempuan": "M09326",
              "Bukan Warga Negara Malaysia - Jumlah": "M09704+M09726",
              "Bukan Warga Negara Malaysia - Lelaki": "M09704",
              "Bukan Warga Negara Malaysia - Perempuan": "M09726",
              "Gaji Dan Upah Dibayar": "M10004+M10026",
            },
          },
          {
            label: "7. Teknikal dan penyeliaan",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan": "M09306+M09328+M09706+M09728",
              "Warga Negara Malaysia - Jumlah": "M09306+M09328",
              "Warga Negara Malaysia - Lelaki": "M09306",
              "Warga Negara Malaysia - Perempuan": "M09328",
              "Bukan Warga Negara Malaysia - Jumlah": "M09706+M09728",
              "Bukan Warga Negara Malaysia - Lelaki": "M09706",
              "Bukan Warga Negara Malaysia - Perempuan": "M09728",
              "Gaji Dan Upah Dibayar": "M10006+M10028",
            },
          },
          {
            label: "8. Perkeranian dan jawatan yang berkenaan",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan":
                "M09305+M09307+M09327+M09329+M09705+M09707+M09727+M09729",
              "Warga Negara Malaysia - Jumlah": "M09305+M09307+M09327+M09329",
              "Warga Negara Malaysia - Lelaki": "M09305+M09307",
              "Warga Negara Malaysia - Perempuan": "M09327+M09329",
              "Bukan Warga Negara Malaysia - Jumlah":
                "M09705+M09707+M09727+M09729",
              "Bukan Warga Negara Malaysia - Lelaki": "M09705+M09707",
              "Bukan Warga Negara Malaysia - Perempuan": "M09727+M09729",
              "Gaji Dan Upah Dibayar": "M10005+M10007+M10027+M10029",
            },
          },
          {
            label: "9. Pekerja Am",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan":
                "M09308+M09309+M09330+M09331+M09708+M09709+M09730+M09731",
              "Warga Negara Malaysia - Jumlah": "M09308+M09309+M09330+M09331",
              "Warga Negara Malaysia - Lelaki": "M09308+M09309",
              "Warga Negara Malaysia - Perempuan": "M09330+M09331",
              "Bukan Warga Negara Malaysia - Jumlah":
                "M09708+M09709+M09730+M09731",
              "Bukan Warga Negara Malaysia - Lelaki": "M09708+M09709",
              "Bukan Warga Negara Malaysia - Perempuan": "M09730+M09731",
              "Gaji Dan Upah Dibayar": "M10008+M10009+M10030+M10031",
            },
          },
          {
            label: "10. Pekerja Estet\n(i) Diambil bekerja secara langsung",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan":
                "M09310+M09311a+M09312a+M09311b+M09312b+M09332+M09333a+M09334a+M09333b+M09334b+M09710+M09711a+M09712a+M09711b+M09712b+M09732+M09733a+M09734a+M09733b+M09734b",
              "Warga Negara Malaysia - Jumlah":
                "M09310+M09311a+M09312a+M09311b+M09312b+M09332+M09333a+M09334a+M09333b+M09334b+M09710+M09711a+M09712a+M09711b+M09712b+M09732+M09733a+M09734a+M09733b+M09734b",
              "Warga Negara Malaysia - Lelaki":
                "M09310+M09311a+M09312a+M09311b+M09312b",
              "Warga Negara Malaysia - Perempuan":
                "M09332+M09333a+M09334a+M09333b+M09334b",
              "Bukan Warga Negara Malaysia - Jumlah":
                "M09710+M09711a+M09712a+M09711b+M09712b+M09732+M09733a+M09734a+M09733b+M09734b",
              "Bukan Warga Negara Malaysia - Lelaki":
                "M09710+M09711a+M09712a+M09711b+M09712b",
              "Bukan Warga Negara Malaysia - Perempuan":
                "M09732+M09733a+M09734a+M09733b+M09734b",
              "Gaji Dan Upah Dibayar":
                "M10010+M10011a+M10012a+M10011b+M10012b+M10032+M10033a+M10034a+M10033b+M10034b",
            },
          },
          {
            label: "(ii) Diambil bekerja melalui kontraktor buruh",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan":
                "M09313+M09314a+M09315a+M09314b+M09315b+M09335+M09336a+M09337a+M09336b+M09337b+m09713+m09714a+M09715a+M09714b+M09715b+M09735+M09736a+M09737a+M09736b+M09737b",
              "Warga Negara Malaysia - Jumlah":
                "M09313+M09314a+M09315a+M09314b+M09315b+M09335+M09336a+M09337a+M09336b+M09337b",
              "Warga Negara Malaysia - Lelaki":
                "M09313+M09314a+M09315a+M09314b+M09315b",
              "Warga Negara Malaysia - Perempuan":
                "M09335+M09336a+M09337a+M09336b+M09337b",
              "Bukan Warga Negara Malaysia - Jumlah":
                "M09713+M09714a+M09715a+M09714b+M09715b+M09735+M09736a+M09737a+M09736b+M09737b",
              "Bukan Warga Negara Malaysia - Lelaki":
                "m09713+m09714a+M09715a+M09714b+M09715b",
              "Bukan Warga Negara Malaysia - Perempuan":
                "M09735+M09736a+M09737a+M09736b+M09737b",
              "Gaji Dan Upah Dibayar":
                "M10013+M10014a+M10015a+M10014b+M10015b+M10036a+M10036b+M10037a+M10037b+M10035",
            },
          },
          {
            label:
              "11. Pekerja kilang\n(i) Diambil bekerja secara langsung\n1. Mahir (Skilled)",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan": "M09316+M09338+M09716+M09738",
              "Warga Negara Malaysia - Jumlah": "M09316+M09338",
              "Warga Negara Malaysia - Lelaki": "M09316",
              "Warga Negara Malaysia - Perempuan": "M09338",
              "Bukan Warga Negara Malaysia - Jumlah": "M09716+M09738",
              "Bukan Warga Negara Malaysia - Lelaki": "M09716",
              "Bukan Warga Negara Malaysia - Perempuan": "M09738",
              "Gaji Dan Upah Dibayar": "M10016+M10038",
            },
          },
          {
            label: "2. Tidak Mahir (UnSkilled)",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan": "M09317+M09339+M09717+M09739",
              "Warga Negara Malaysia - Jumlah": "M09317+M09339",
              "Warga Negara Malaysia - Lelaki": "M09317",
              "Warga Negara Malaysia - Perempuan": "M09339",
              "Bukan Warga Negara Malaysia - Jumlah": "M09717+M09739",
              "Bukan Warga Negara Malaysia - Lelaki": "M09717",
              "Bukan Warga Negara Malaysia - Perempuan": "M09739",
              "Gaji Dan Upah Dibayar": "M10017+M10039",
            },
          },
          {
            label:
              "(ii) Diambil bekerja melalui kontraktor buruh\n1. Mahir (Skilled)",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan": "M09318+M09340+M09818+M09740",
              "Warga Negara Malaysia - Jumlah": "M09318+M09340",
              "Warga Negara Malaysia - Lelaki": "M09318",
              "Warga Negara Malaysia - Perempuan": "M09340",
              "Bukan Warga Negara Malaysia - Jumlah": "M09818+M09740",
              "Bukan Warga Negara Malaysia - Lelaki": "M09718",
              "Bukan Warga Negara Malaysia - Perempuan": "M09740",
              "Gaji Dan Upah Dibayar": "M10018+M10040",
            },
          },
          {
            label: "2. Tidak Mahir (UnSkilled)",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan": "M09319+M09341+M09719+M09741",
              "Warga Negara Malaysia - Jumlah": "M09319+M09341",
              "Warga Negara Malaysia - Lelaki": "M09319",
              "Warga Negara Malaysia - Perempuan": "M09341",
              "Bukan Warga Negara Malaysia - Jumlah": "M09719+M09741",
              "Bukan Warga Negara Malaysia - Lelaki": "M09719",
              "Bukan Warga Negara Malaysia - Perempuan": "M09741",
              "Gaji Dan Upah Dibayar": "M10019+M10041",
            },
          },
          {
            label: "12. Jumlah Pekerja Bergaji Sambilan/Jumlah Gaji",
            columnCodes: {
              "Jumlah Warga Negara dan Bukan": "M09321+M09343+M09721+M09723",
              "Warga Negara Malaysia - Jumlah": "M09321+M09343",
              "Warga Negara Malaysia - Lelaki": "M09321",
              "Warga Negara Malaysia - Perempuan": "M09343",
              "Bukan Warga Negara Malaysia - Jumlah": "M09721+M09723",
              "Bukan Warga Negara Malaysia - Lelaki": "M09721",
              "Bukan Warga Negara Malaysia - Perempuan": "M09743",
              "Gaji Dan Upah Dibayar": "M10021+M10043",
            },
          },
        ];
      },
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text: "Kategori Pekerja",
            alias: "Category of Wokers",
            alignment: "center",
            bold: true,
            columnWidth: 125,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.label,
              value: context.row.label,
            }),
            // valueAlignment: "center",
          },
          // ------------------------------
          {
            rowSpan: 3,
            text: "Jumlah Warganegara dan Bukan",
            alias: "Malaysian and Non Malaysian Citizens",
            key: "Jumlah Warga Negara dan Bukan",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            colSpan: 6,
            text: "Jumlah Pekerja Pada Bulan Disember atau pada tempoh gaji akhir",
            alias: "Malaysian Citizens",
            key: "Warga Negara Malaysia - Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Lelaki",
            alias: "Total",
            key: "Warga Negara Malaysia - Lelaki",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Perempuan",
            alias: "Total",
            key: "Warga Negara Malaysia - Perempuan",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            colSpan: 3,
            text: "Bukan Warga Negara Malaysia",
            alias: "Non-Malaysian Citizens",
            key: "Bukan Warga Negara Malaysia - Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Lelaki",
            alias: "Total",
            key: "Bukan Warga Negara Malaysia - Lelaki",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Perempuan",
            alias: "Total",
            key: "Bukan Warga Negara Malaysia - Perempuan",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            rowSpan: 3,
            text: "Gaji Dan Upah Dibayar",
            alias: "Salaries and Wages Paid",
            key: "Gaji Dan Upah Dibayar",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
        ],
        [
          {
            text: "Kategori Pekerja",
            alias: "Category of Wokers",
            alignment: "center",
            bold: true,
            columnWidth: 125,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.label,
              value: context.row.label,
            }),
            // valueAlignment: "center",
          },
          // ------------------------------
          {
            text: "Jumlah Warganegara dan Bukan",
            alias: "Malaysian and Non Malaysian Citizens",
            key: "Jumlah Warga Negara dan Bukan",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            colSpan: 3,
            text: "Warga Negara Malaysia",
            alias: "Malaysian Citizens",
            key: "Warga Negara Malaysia - Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Lelaki",
            alias: "Total",
            key: "Warga Negara Malaysia - Lelaki",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Perempuan",
            alias: "Total",
            key: "Warga Negara Malaysia - Perempuan",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            colSpan: 3,
            text: "Bukan Warga Negara Malaysia",
            alias: "Non-Malaysian Citizens",
            key: "Bukan Warga Negara Malaysia - Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Lelaki",
            alias: "Total",
            key: "Bukan Warga Negara Malaysia - Lelaki",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Perempuan",
            alias: "Total",
            key: "Bukan Warga Negara Malaysia - Perempuan",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Gaji Dan Upah Dibayar",
            alias: "Salaries and Wages Paid",
            key: "Gaji Dan Upah Dibayar",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
        ],
        [
          {
            text: "Kategori Pekerja",
            alias: "Category of Wokers",
            alignment: "center",
            bold: true,
            columnWidth: 125,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.label,
              value: context.row.label,
            }),
            // valueAlignment: "center",
          },
          // ------------------------------
          {
            text: "Jumlah Warganegara dan Bukan",
            alias: "Malaysian and Non Malaysian Citizens",
            key: "Jumlah Warga Negara dan Bukan",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Jumlah",
            alias: "Total",
            key: "Warga Negara Malaysia - Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Lelaki",
            alias: "Total",
            key: "Warga Negara Malaysia - Lelaki",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Perempuan",
            alias: "Total",
            key: "Warga Negara Malaysia - Perempuan",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Jumlah",
            alias: "Total",
            key: "Bukan Warga Negara Malaysia - Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Lelaki",
            alias: "Total",
            key: "Bukan Warga Negara Malaysia - Lelaki",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Perempuan",
            alias: "Total",
            key: "Bukan Warga Negara Malaysia - Perempuan",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Gaji Dan Upah Dibayar",
            alias: "Salaries and Wages Paid",
            key: "Gaji Dan Upah Dibayar",
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 18": {
      TITLE: `Jadual 18: Perbelanjaan Modal Dan Nilai Harta Tetap Di Estet Koko, ${
        params.year - 1
      }: ${
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
      SUBTITLE: `Table 18: Capital Expenditure and Value of Fixed Assets of Cocoa Estate, ${
        params.year - 1
      }: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      // PAGE_ORIENTATION: "portrait",
      // BASE_FONT_SIZE: 10,
      GROUPED_FOOTERS_CONFIG: [
        //
        // "allStats",
      ],
      BASE_FONT_SIZE: 10,
      RESOLVE_ROWS: async () => {
        return [
          {
            label: "1. Tanah",
            columnCodes: {
              "Nilai Bersih Seperti pada 1 Januari": "K06701",
              Jumlah: "K07101",
              Baru: "K06801",
              Terpakai: "K06901",
              "Binaan Sendiri": "K07001",
              "Harta Tetap Dijual Dilupus": "K07201",
              "Susut Nilai Sepanjang Tahun": "K07301",
              "Nilai Bersih Seperti Pada 31 Disember": "K07401",
            },
          },
          {
            label: "2. Bangunan dan binaan lain\n(a) Bangunan Kediaman",
            columnCodes: {
              "Nilai Bersih Seperti pada 1 Januari": "K06702",
              Jumlah: "K07102",
              Baru: "K06802",
              Terpakai: "K06902",
              "Binaan Sendiri": "K07002",
              "Harta Tetap Dijual Dilupus": "K07202",
              "Susut Nilai Sepanjang Tahun": "K07302",
              "Nilai Bersih Seperti Pada 31 Disember": "K07402",
            },
          },
          {
            label: "(b) Bukan Bangunan Kediaman (Cth: Stor, Pejabat, dll)",
            columnCodes: {
              "Nilai Bersih Seperti pada 1 Januari": "K06703",
              Jumlah: "K07103",
              Baru: "K06803",
              Terpakai: "K06903",
              "Binaan Sendiri": "K07003",
              "Harta Tetap Dijual Dilupus": "K07203",
              "Susut Nilai Sepanjang Tahun": "K07303",
              "Nilai Bersih Seperti Pada 31 Disember": "K07403",
            },
          },
          {
            label: "(c) Binaan-binaan lain (Kecuali pembangunan)",
            columnCodes: {
              "Nilai Bersih Seperti pada 1 Januari": "K06704",
              Jumlah: "K07104",
              Baru: "K06804",
              Terpakai: "K06904",
              "Binaan Sendiri": "K07004",
              "Harta Tetap Dijual Dilupus": "K07204",
              "Susut Nilai Sepanjang Tahun": "K07304",
              "Nilai Bersih Seperti Pada 31 Disember": "K07404",
            },
          },
          {
            label: "3. Pembangunan Tanah",
            columnCodes: {
              "Nilai Bersih Seperti pada 1 Januari": "K06705",
              Jumlah: "K07105",
              Baru: "",
              Terpakai: "",
              "Binaan Sendiri": "K07005",
              "Harta Tetap Dijual Dilupus": "",
              "Susut Nilai Sepanjang Tahun": "",
              "Nilai Bersih Seperti Pada 31 Disember": "K07405",
            },
          },
          {
            label: "4. Alat-alat Pengangkutan\n(a) Kereta-kereta Penumpang",
            columnCodes: {
              "Nilai Bersih Seperti pada 1 Januari": "K06706",
              Jumlah: "K07106",
              Baru: "K06806",
              Terpakai: "K06906",
              "Binaan Sendiri": "K07006",
              "Harta Tetap Dijual Dilupus": "K07206",
              "Susut Nilai Sepanjang Tahun": "K07306",
              "Nilai Bersih Seperti Pada 31 Disember": "K07406",
            },
          },
          {
            label: "(b) Lori-lori, Van, Pikap, dll",
            columnCodes: {
              "Nilai Bersih Seperti pada 1 Januari": "K06707",
              Jumlah: "K07107",
              Baru: "K06807",
              Terpakai: "K06907",
              "Binaan Sendiri": "K07007",
              "Harta Tetap Dijual Dilupus": "K07207",
              "Susut Nilai Sepanjang Tahun": "K07307",
              "Nilai Bersih Seperti Pada 31 Disember": "K07407",
            },
          },
          {
            label: "(c) Lain-lain\n(Bot, motosikal, troli)",
            columnCodes: {
              "Nilai Bersih Seperti pada 1 Januari": "K06708",
              Jumlah: "K07108",
              Baru: "K06808",
              Terpakai: "K06908",
              "Binaan Sendiri": "K07008",
              "Harta Tetap Dijual Dilupus": "K07208",
              "Susut Nilai Sepanjang Tahun": "K07308",
              "Nilai Bersih Seperti Pada 31 Disember": "K07408",
            },
          },
          {
            label: "5. Jentera Pertanian",
            columnCodes: {
              "Nilai Bersih Seperti pada 1 Januari": "K06709",
              Jumlah: "K07109",
              Baru: "K06809",
              Terpakai: "K06909",
              "Binaan Sendiri": "K07009",
              "Harta Tetap Dijual Dilupus": "K07209",
              "Susut Nilai Sepanjang Tahun": "K07309",
              "Nilai Bersih Seperti Pada 31 Disember": "K07409",
            },
          },
          {
            label: "(b) Jentera loji dan kelengkapan",
            columnCodes: {
              "Nilai Bersih Seperti pada 1 Januari": "K06710",
              Jumlah: "K07110",
              Baru: "K06810",
              Terpakai: "K06910",
              "Binaan Sendiri": "K07010",
              "Harta Tetap Dijual Dilupus": "K07210",
              "Susut Nilai Sepanjang Tahun": "K07310",
              "Nilai Bersih Seperti Pada 31 Disember": "K07410",
            },
          },
          {
            label: "(c) peralatan fermentasi",
            columnCodes: {
              "Nilai Bersih Seperti pada 1 Januari": "K06711",
              Jumlah: "K07111",
              Baru: "K06811",
              Terpakai: "K06911",
              "Binaan Sendiri": "K07011",
              "Harta Tetap Dijual Dilupus": "K07211",
              "Susut Nilai Sepanjang Tahun": "K07311",
              "Nilai Bersih Seperti Pada 31 Disember": "K07411",
            },
          },
          {
            label: "(d) peralatan pengeringan",
            columnCodes: {
              "Nilai Bersih Seperti pada 1 Januari": "K06712",
              Jumlah: "K07112",
              Baru: "K06812",
              Terpakai: "K06912",
              "Binaan Sendiri": "K07012",
              "Harta Tetap Dijual Dilupus": "K07212",
              "Susut Nilai Sepanjang Tahun": "K07312",
              "Nilai Bersih Seperti Pada 31 Disember": "K07412",
            },
          },
          {
            label: "6. Perabot dan Pemasangan",
            columnCodes: {
              "Nilai Bersih Seperti pada 1 Januari": "K06713",
              Jumlah: "K07113",
              Baru: "K06813",
              Terpakai: "K06913",
              "Binaan Sendiri": "K07013",
              "Harta Tetap Dijual Dilupus": "K07213",
              "Susut Nilai Sepanjang Tahun": "K07313",
              "Nilai Bersih Seperti Pada 31 Disember": "K07413",
            },
          },
          {
            label: "7. Lain Lain Jenis Harta Tetap",
            columnCodes: {
              "Nilai Bersih Seperti pada 1 Januari": "K06714",
              Jumlah: "K07114",
              Baru: "K06814",
              Terpakai: "K06914",
              "Binaan Sendiri": "K07014",
              "Harta Tetap Dijual Dilupus": "K07214",
              "Susut Nilai Sepanjang Tahun": "K07314",
              "Nilai Bersih Seperti Pada 31 Disember": "K07414",
            },
          },
          {
            label: "Jumlah",
            columnCodes: {
              "Nilai Bersih Seperti pada 1 Januari": "K06715",
              Jumlah: "K07115",
              Baru: "K06815",
              Terpakai: "K06915",
              "Binaan Sendiri": "K07015",
              "Harta Tetap Dijual Dilupus": "K07215",
              "Susut Nilai Sepanjang Tahun": "K07315",
              "Nilai Bersih Seperti Pada 31 Disember": "K07415",
            },
          },
        ];
      },
      COLUMNS: [
        [
          {
            rowSpan: 2,
            text: "Kategori Pekerja",
            alias: "Category of Wokers",
            alignment: "center",
            bold: true,
            columnWidth: 145,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.label,
              value: context.row.label,
            }),
            // valueAlignment: "center",
          },
          // ------------------------------
          {
            rowSpan: 2,
            text: "Nilai Bersih Seperti pada 1 Januari",
            alias: "Net Value As at 1 January",
            key: "Nilai Bersih Seperti pada 1 Januari",
            alignment: "center",
            bold: true,
            columnWidth: 73,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            colSpan: 4,
            text: "Perbelanjaan Modal Dalam Tahun",
            alias: "Capital Expenditure During Year",
            key: "Perbelanjaan Modal Dalam Tahun",
            alignment: "center",
            bold: true,
            columnWidth: 73,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Baru",
            alias: "New",
            key: "Baru",
            alignment: "center",
            bold: true,
            columnWidth: 73,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Terpakai",
            alias: "Used",
            key: "Terpakai",
            alignment: "center",
            bold: true,
            columnWidth: 73,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Binaan Sendiri",
            alias: "Own Contructi",
            key: "Binaan Sendiri",
            alignment: "center",
            bold: true,
            columnWidth: 73,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            rowSpan: 2,
            text: "Harta Tetap Dijual Dilupus",
            alias: "Fixed Assets Sold, Written Off During",
            key: "Harta Tetap Dijual Dilupus",
            alignment: "center",
            bold: true,
            columnWidth: 73,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            rowSpan: 2,
            text: "Susut Nilai Sepanjang Tahun",
            alias: "Depreciation During Year",
            key: "Susut Nilai Sepanjang Tahun",
            alignment: "center",
            bold: true,
            columnWidth: 73,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            rowSpan: 2,
            text: "Nilai Bersih Seperti Pada 31 Disember",
            alias: "Net Value As at 31 December",
            key: "Nilai Bersih Seperti Pada 31 Disember",
            alignment: "center",
            bold: true,
            columnWidth: 73,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
        ],
        [
          {
            text: "JENIS HARTA TETAP",
            alias: "Type of Fixed Assets",
            alignment: "center",
            bold: true,
            columnWidth: 145,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.label,
              value: context.row.label,
            }),
            // valueAlignment: "center",
          },
          // ------------------------------
          {
            text: "Nilai Bersih Seperti pada 1 Januari",
            alias: "Net Value As at 1 January",
            key: "Nilai Bersih Seperti pada 1 Januari",
            alignment: "center",
            bold: true,
            columnWidth: 73,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Jumlah",
            alias: "Total",
            key: "Jumlah",
            alignment: "center",
            bold: true,
            columnWidth: 73,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Baru",
            alias: "New",
            key: "Baru",
            alignment: "center",
            bold: true,
            columnWidth: 73,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Terpakai",
            alias: "Used",
            key: "Terpakai",
            alignment: "center",
            bold: true,
            columnWidth: 73,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Binaan Sendiri",
            alias: "Own Contructi",
            key: "Binaan Sendiri",
            alignment: "center",
            bold: true,
            columnWidth: 73,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Harta Tetap Dijual Dilupus",
            alias: "Fixed Assets Sold, Written Off During",
            key: "Harta Tetap Dijual Dilupus",
            alignment: "center",
            bold: true,
            columnWidth: 73,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Susut Nilai Sepanjang Tahun",
            alias: "Depreciation During Year",
            key: "Susut Nilai Sepanjang Tahun",
            alignment: "center",
            bold: true,
            columnWidth: 73,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
          {
            text: "Nilai Bersih Seperti Pada 31 Disember",
            alias: "Net Value As at 31 December",
            key: "Nilai Bersih Seperti Pada 31 Disember",
            alignment: "center",
            bold: true,
            columnWidth: 73,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
          },
        ],
      ],
    },
    "Jadual 19": {
      TITLE: `Jadual 19: Perbelanjaan Menanam, Modal Dan Menyelenggara Di Estet Koko, ${
        params.year - 1
      }: ${
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
      SUBTITLE: `Table 19: Capital Expenditure, Planting and Maintenance on Cocoa Estate, ${
        params.year - 1
      }: ${
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
      QUERIES: {
        EstateCensusHakMilikPertubuhanAndSeksyenValues: {
          // censusYear: params.year - 1,
          censusYear: params.year,
        },
        EstateCensusYearLists: {
          // year: params.year - 1,
          year: params.year,
        },
      },
      // PAGE_ORIENTATION: "portrait",
      // BASE_FONT_SIZE: 10,
      GROUPED_FOOTERS_CONFIG: [
        //
        // "allStats",
      ],
      BASE_FONT_SIZE: 12,
      NO_HEADERS: true,
      RESOLVE_ROWS: async () => {
        await context
          .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
          .createIndex({
            censusYear: 1,
          });
        const allEstateCensusHakMilikPertubuhanAndSeksyenValues = await context
          .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
          .find({
            censusYear: {
              $in: [params.year - 1, params.year],
            },
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();

        indexedEstateCensusHakMilikPertubuhanAndSeksyenValues = new FlexSearch({
          tokenize: "strict",
          doc: {
            id: "_id",
            field: ["estateId", "code", "censusYear"],
          },
        });
        indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.add(
          allEstateCensusHakMilikPertubuhanAndSeksyenValues,
        );

        return [
          {
            label: [
              {
                text: `A. JUMLAH LUAS HEKTAR KOKO MUDA SEPERTI PADA 31 DESEMBER ${
                  params.year - 1
                }`,
                bold: true,
              },
              {
                text: `\nTotal Immature Heceterage as at 31 December ${
                  params.year - 1
                }`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "A01410",
            },
          },
          {
            label: [
              {
                text: `(i) Luas hektar yang ditanam baru sepanjang tahun ${
                  params.year - 1
                }`,
                bold: true,
              },
              {
                text: `\nHecterage of newlyplanted cocoa area during year ${
                  params.year - 1
                }`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "A00311",
            },
          },
          {
            label: [
              {
                text: `(ii) Luas hektar yang ditanam semula sepanjang tahun ${
                  params.year - 1
                }`,
                bold: true,
              },
              {
                text: `\nHecterage of replanted cocoa area during year ${
                  params.year - 1
                }`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "A00411",
            },
          },
          {
            label: [
              {
                text: `(iii) Luas hektar yang dipulihkan semula sepanjang tahun ${
                  params.year - 1
                }`,
                bold: true,
              },
              {
                text: `\nHecterage of rehabilitated cocoa area during year ${
                  params.year - 1
                }`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "B01505",
            },
          },
          {
            label: [
              {
                text: `(iv) Luas hektar ditanam semula sebelum tahun ${
                  params.year - 1
                }`,
                bold: true,
              },
              {
                text: `\nNewlyplanted of cocoa area before year ${
                  params.year - 1
                }`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "A00311",
            },
          },
          {
            label: [
              {
                text: `(v) Luas hektar koko ditanam semula sebelum tahun ${
                  params.year - 1
                }`,
                bold: true,
              },
              {
                text: `\nReplanted of cocoa area before year ${
                  params.year - 1
                }`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "A00411",
            },
            resolveValue: {
              Nilai: context => {
                let values =
                  indexedEstateCensusHakMilikPertubuhanAndSeksyenValues.where({
                    code: "A00411",
                    censusYear: params.year - 1,
                  });

                values = values
                  .map(v => v.value)
                  .reduce((acc, curr) => acc + curr, 0);

                return {
                  text: values,
                  value: values,
                };
              },
            },
          },
          {
            label: [
              {
                text: `(vi) Luas hektar koko yang dipulihkan sebelum tahun ${
                  params.year - 1
                }`,
                bold: true,
              },
              {
                text: `\nRehabilitated cocoa area before year ${
                  params.year - 1
                }`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "B01505",
            },
          },
          {
            label: [
              {
                text: `B. JUMLAH PERBELANJAAN BAGI KOKO YANG DITANAM BARU`,
                bold: true,
              },
              {
                text: `\nTotal expenditure on newlyplanted cocoa`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06401+J06402+J06403",
            },
          },
          {
            label: [
              {
                text: `(i) Perbelanjaan menerangkan tanah yang hendak ditanam dengan koko tetapi belum ditanam baru pada 31 Disember ${
                  params.year - 1
                }`,
                bold: true,
              },
              {
                text: `\nCleaning expenditure intended for cocoa not yet newlyplanted by 31 December ${
                  params.year - 1
                }`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06401",
            },
          },
          {
            label: [
              {
                text: `(ii) Perbelanjaan menerangkan tanah dan menanam bagi koko yang ditanam baru sepanjang tahun ${
                  params.year - 1
                }`,
                bold: true,
              },
              {
                text: `\nClearing and plating expenditure on newlyplanted cocoa during ${
                  params.year - 1
                }`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06402",
            },
          },
          {
            label: [
              {
                text: `(iii) Kos purata sehektar bagi menerangkan tanah dan menanam kokobaru [B(ii) / A(i)]`,
                bold: true,
              },
              {
                text: `\nAverage cost per hectare for clearing and planting on newlyplanted cocoa [B(ii) / A(i)]`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06402",
            },
          },
          {
            label: [
              {
                text: `(iv) Perbelanjaan menyelenggara sepanjang tahun ${
                  params.year - 1
                } bagi semua koko muda yang ditanam baru`,
                bold: true,
              },
              {
                text: `\nMaintenance expenditure of all immature newlyplanted cocoa during ${
                  params.year - 1
                }`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06402",
            },
            resolveValue: {
              Nilai: context => {
                const valueJ06402 = indexedValues.find({
                  code: "J06402",
                });
                const valueA00311 = indexedValues.find({
                  code: "A00311",
                });
                const value =
                  !valueJ06402?.value || !valueA00311?.value
                    ? 0
                    : !valueJ06402?.value / !valueA00311?.value;

                return {
                  text: formatNumber(value, context.spec.statsPrecision || 0),
                  value,
                };
              },
            },
          },
          {
            label: [
              {
                text: `(v) Kos purata sehektar bagi semua koko muda yang ditanam baru sepanjang tahun ${
                  params.year - 1
                } [B(iv) / A(i)]`,
                bold: true,
              },
              {
                text: `\nAverage cost per hectare on all immature newlyplanted cocoa as at ${
                  params.year - 1
                } [B(iv) / A(i)]`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06403",
            },
            resolveValue: {
              Nilai: context => {
                const valueJ06403 = indexedValues.find({
                  code: "J06403",
                });
                const valueA00311 = indexedValues.find({
                  code: "A00311",
                });
                const value =
                  !valueJ06403?.value || !valueA00311?.value
                    ? 0
                    : !valueJ06403?.value / !valueA00311?.value;

                return {
                  text: formatNumber(value, context.spec.statsPrecision || 0),
                  value,
                };
              },
            },
          },
          {
            label: [
              {
                text: `C. JUMLAH PERBELANJAAN BAGI KOKO YANg DITANAM SEMULA`,
                bold: true,
              },
              {
                text: `\nTotal expenditure on replanted cocoa`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06501+J06502+J06503",
            },
          },
          {
            label: [
              {
                text: `(i) Perbelanjaan menerangkan tanah yang hendak ditanam dengan koko tetapi belum ditanam semasa 31 Disember ${
                  params.year - 1
                }`,
                bold: true,
              },
              {
                text: `\nClearing expenditure during year on hectareage not yet replanted by 31 December ${
                  params.year - 1
                }`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06501",
            },
          },
          {
            label: [
              {
                text: `(ii) Perbelanjaan menerangkan tanah dan menanam bagi koko yang ditanam semula sepanjang tahun ${
                  params.year - 1
                }`,
                bold: true,
              },
              {
                text: `\nClearing and planting expenditure on replanted cocoa during ${
                  params.year - 1
                }`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06502",
            },
          },
          {
            label: [
              {
                text: `(iii) Kos Purata [C(ii) / A(ii)] sehektar bagi menerangkan tanah dan menanam semula koko.`,
                bold: true,
              },
              {
                text: `\nAverage cost per hectare [C(ii) / A(ii)] for clearing and planting on replanted cocoa`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06502",
            },
            resolveValue: {
              Nilai: context => {
                const valueJ06502 = indexedValues.find({
                  code: "J06502",
                });
                const valueA00411 = indexedValues.find({
                  code: "A00411",
                });
                const value =
                  !valueJ06502?.value || !valueA00411?.value
                    ? 0
                    : !valueJ06502?.value / !valueA00411?.value;

                return {
                  text: formatNumber(value, context.spec.statsPrecision || 0),
                  value,
                };
              },
            },
          },
          {
            label: [
              {
                text: `(iv) Perbelanjaan menyelenggara sepanjang tahun ${
                  params.year - 1
                } bagi semua koko muda yang ditanam smeula`,
                bold: true,
              },
              {
                text: `\nMaintenance expenditure of all immature replanted cocoa during ${
                  params.year - 1
                }`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06503",
            },
          },
          {
            label: [
              {
                text: `(v) Kos purata sehektar bagi semua koko muda yang ditanam semula pada tahun ${
                  params.year - 1
                } [C(iv) / A(ii)]`,
                bold: true,
              },
              {
                text: `\nAverage maintenance cost per hectare on all immatured replanted cocoa as at ${
                  params.year - 1
                } [C(iv) / A(ii)]`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06503",
            },
            resolveValue: {
              Nilai: context => {
                const valueJ06503 = indexedValues.find({
                  code: "J06503",
                });
                const valueA00411 = indexedValues.find({
                  code: "A00411",
                });
                const value =
                  !valueJ06503?.value || !valueA00411?.value
                    ? 0
                    : !valueJ06503?.value / !valueA00411?.value;

                return {
                  text: formatNumber(value, context.spec.statsPrecision || 0),
                  value,
                };
              },
            },
          },
          {
            label: [
              {
                text: `D. JUMLAH PERBELANJAAN BAGI KOKO YANG DIPULIHKAN`,
                bold: true,
              },
              {
                text: `\nTotal expenditure on rehabilitation cocoa`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06603+J06604",
            },
          },
          {
            label: [
              {
                text: `(i) Perbelanjaan memulihkan tanah dengan tanama koko sehingga 31 Disember ${
                  params.year - 1
                }`,
                bold: true,
              },
              {
                text: `\nRehabilitation expenditure on cocoa as at 31 December ${
                  params.year - 1
                }`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06604",
            },
          },
          {
            label: [
              {
                text: `(ii) Kos purata sehektar bagi koko dipulihkan [D(i) / A(iii)]`,
                bold: true,
              },
              {
                text: `\nAverage cost per hectare on rehabilitated cocoa [D(i) / A(iii)]`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06604",
            },
            resolveValue: {
              Nilai: context => {
                const valueJ06604 = indexedValues.find({
                  code: "J06604",
                });
                const valueB01505 = indexedValues.find({
                  code: "B01505",
                });

                let value = 0;

                if (valueB01505 && valueB01505.value !== 0) {
                  if (valueJ06604 && valueJ06604.value) {
                    value = valueJ06604.value / valueB01505.value;
                  }
                }
                // const value =
                //   !valueJ06604?.value || !valueB01505?.value
                //     ? 0
                //     : !valueJ06604?.value / !valueB01505?.value;

                return {
                  text: formatNumber(value, context.spec.statsPrecision || 0),
                  value,
                };
              },
            },
          },
          {
            label: [
              {
                text: `(iii) Perbelanjaan menyelenggara sepanjang tahun 2020 bagi semua koko muda yang dipulihkan`,
                bold: true,
              },
              {
                text: `\nMaintenance expenditure of all immature rehabilitated cocoa during year ${
                  params.year - 1
                }`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06603",
            },
          },
          {
            label: [
              {
                text: `(iv) Kos purata sehektar bagi semua koko muda yang dipulihkan sepanjang tahun [D(iii) / A(iii)]`,
                bold: true,
              },
              {
                text: `\nAverage maintenance cost per hectare on all immatured rehabilitated cocoa as at ${
                  params.year - 1
                } [D(iii) / A(iii)]`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "J06603",
            },
            resolveValue: {
              Nilai: context => {
                const valueJ06603 = indexedValues.find({
                  code: "J06603",
                });
                const valueB01505 = indexedValues.find({
                  code: "B01505",
                });

                let value = 0;

                if (valueB01505 && valueB01505.value !== 0) {
                  if (valueJ06603 && valueJ06603.value) {
                    value = valueJ06603.value / valueB01505.value;
                  }
                }

                // const value =
                //   !valueJ06603?.value || !valueB01505?.value
                //     ? 0
                //     : !valueJ06603?.value / !valueB01505?.value;

                return {
                  text: formatNumber(value, context.spec.statsPrecision || 0),
                  value,
                };
              },
            },
          },
          {
            label: [
              {
                text: `E. JUMLAH PERBELANJAAN BAGI PEMBAIKAN DAN PENYELENGGARAN \t (RM '000)`,
                bold: true,
              },
              {
                text: `\nTotal expenditure on repairs and maintenance `,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "L07807",
            },
            resolveValue: {
              Nilai: context => {
                let valueL07807 = indexedValues.where({
                  code: "L07807",
                });

                valueL07807 = valueL07807
                  .map(v => v.value)
                  .reduce((acc, curr) => acc + curr, 0);

                const value = valueL07807 ? valueL07807 / 1000 : 0;

                return {
                  text: formatNumber(value, context.spec.statsPrecision || 0),
                  value,
                };
              },
            },
          },
          {
            label: [
              {
                text: `Perbelanjaan bagi pembaikan dan`,
                bold: true,
              },
              {
                text: `\nExpenditure on repairs maintenance `,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "-",
            },
          },
          {
            label: [
              {
                text: `(i)Jantera Pertanian dan jantera lain dan kelengkapan`,
                bold: true,
              },
              {
                text: `\nAgricultural and other machinery and equipment`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "valueL07801",
            },
            resolveValue: {
              Nilai: context => {
                let valueL07801 = indexedValues.where({
                  code: "L07801",
                });

                valueL07801 = valueL07801
                  .map(v => v.value)
                  .reduce((acc, curr) => acc + curr, 0);

                let valueL07802 = indexedValues.where({
                  code: "L07802",
                });

                valueL07802 = valueL07802
                  .map(v => v.value)
                  .reduce((acc, curr) => acc + curr, 0);

                let value = 0;
                if (valueL07801 + valueL07802 > 0) {
                  value = (valueL07801 + valueL07802) / 1000;
                }

                return {
                  text: formatNumber(value, context.spec.statsPrecision || 0),
                  value,
                };
              },
            },
          },
          {
            label: [
              {
                text: `(ii)Alat-alat pengangkutan`,
                bold: true,
              },
              {
                text: `\nTransport Equipment`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "L07803",
            },
            resolveValue: {
              Nilai: context => {
                let valueL07803 = indexedValues.where({
                  code: "L07803",
                });

                valueL07803 = valueL07803
                  .map(v => v.value)
                  .reduce((acc, curr) => acc + curr, 0);

                const value = valueL07803 ? valueL07803 / 1000 : 0;
                return {
                  text: formatNumber(value, context.spec.statsPrecision || 0),
                  value,
                };
              },
            },
          },
          {
            label: [
              {
                text: `(iii)Bangunan tempat kediaman (cth: rumah kakitangan dan buruh, dll)`,
                bold: true,
              },
              {
                text: `\nResedential dwellings (e.g: staff quarters, labour lines, etc)`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "L07804",
            },
            resolveValue: {
              Nilai: context => {
                let valueL07804 = indexedValues.where({
                  code: "L07804",
                });

                valueL07804 = valueL07804
                  .map(v => v.value)
                  .reduce((acc, curr) => acc + curr, 0);

                const value = valueL07804 ? valueL07804 / 1000 : 0;
                return {
                  text: formatNumber(value, context.spec.statsPrecision || 0),
                  value,
                };
              },
            },
          },
          {
            label: [
              {
                text: `(iv)Bangunan bukan tempat kediaman (Cth: kilang, pejabat, dll)`,
                bold: true,
              },
              {
                text: `\nNon-residental buildings (e.g: factories, offices, etc)`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "A01410",
            },
            resolveValue: {
              Nilai: context => {
                let valueL07805 = indexedValues.where({
                  code: "L07805",
                });

                valueL07805 = valueL07805
                  .map(v => v.value)
                  .reduce((acc, curr) => acc + curr, 0);

                const value = valueL07805 ? valueL07805 / 1000 : 0;
                return {
                  text: formatNumber(value, context.spec.statsPrecision || 0),
                  value,
                };
              },
            },
          },
          {
            label: [
              {
                text: `(v)Pembelanjaan membaiki dan menyelenggara lain`,
                bold: true,
              },
              {
                text: `\nOther repairs and maintenance expenditures`,
                italics: true,
              },
            ],
            columnCodes: {
              Nilai: "L07806",
            },
            resolveValue: {
              Nilai: context => {
                let valueL07806 = indexedValues.where({
                  code: "L07806",
                });

                valueL07806 = valueL07806
                  .map(v => v.value)
                  .reduce((acc, curr) => acc + curr, 0);

                const value = valueL07806 ? valueL07806 / 1000 : 0;
                return {
                  text: formatNumber(value, context.spec.statsPrecision || 0),
                  value,
                };
              },
            },
          },
        ];
      },
      COLUMNS: [
        [
          {
            text: "Label",
            alias: "Label",
            alignment: "center",
            bold: true,
            columnWidth: 600,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context => ({
              text: context.row.label,
              value: context.row.label,
            }),
            // valueAlignment: "center",
          },
          // ------------------------------
          {
            text: "Nilai",
            alias: "Nilai",
            key: "Nilai",
            alignment: "center",
            bold: true,
            columnWidth: 150,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 2,
            resolveValue: sumAllColumnCodesStringValue,
            // valueAlignment: "center",
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

  await context.collection("EstateCensusYearLists").createIndex({
    year: 1,
    estateId: 1,
  });
  allEstateCensusYearLists = await context
    .collection("EstateCensusYearLists")
    .find({
      // year: parseInt(params.year),
      ...(QUERIES["EstateCensusYearLists"] || {}),
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log(
  //   "allEstateCensusYearLists",
  //   QUERIES["EstateCensusYearLists"],
  //   allEstateCensusYearLists.length,
  // );
  indexedEstateCensusYearLists = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["estateId", "year"],
    },
  });
  indexedEstateCensusYearLists.add(allEstateCensusYearLists);

  await context
    .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
    .createIndex({
      censusYear: 1,
      code: 1,
    });
  let allValueQuery = {
    // ...query,
    ...(QUERIES["EstateCensusHakMilikPertubuhanAndSeksyenValues"] || {}),
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
  };
  if (!allValueQuery.$or.length) {
    delete allValueQuery.$or;
  }
  const allValues = await context
    .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
    .find(allValueQuery)
    .toArray();
  // console.log(
  //   "allValues",
  //   // QUERIES["EstateCensusHakMilikPertubuhanAndSeksyenValues"],
  //   allValueQuery,
  //   allValues.length,
  // );
  indexedValues = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["estateInformationId", "estateId", "code", "censusYear"],
    },
  });
  indexedValues.add(allValues);

  const allCocoaMonitors = await context
    .collection("CocoaMonitors")
    .find(allValueQuery)
    .toArray();
  // console.log(
  //   "allCocoaMonitors",
  //   // QUERIES["CocoaMonitors"],
  //   // allValueQuery,
  //   JSON.stringify(allValueQuery, null, 4),
  //   allCocoaMonitors.length,
  // );
  indexedCocoaMonitors = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["censusYear", "code"],
    },
  });
  indexedCocoaMonitors.add(allCocoaMonitors);

  let allRows = [];
  if (RESOLVE_ROWS) {
    allRows = await RESOLVE_ROWS();
    if (!allRows) {
      allRows = [];
    }
  }
  // console.log(
  //   "allRows",
  //   allRows.length,
  //   // allRows
  // );
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
                          "Jumlah",
                          { text: "\nTotal", italics: true, bold: false },
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
    filename: `Malaysian Report - ${TITLE.split(":").join("")}.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

module.exports = {
  generateMalaysianReport,
};
