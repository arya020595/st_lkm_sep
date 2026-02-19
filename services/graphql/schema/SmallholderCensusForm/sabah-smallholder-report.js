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

const generateSabahSmallholderReport = async (self, params, context) => {
  assertValidSession(context.activeSession);
  // console.log("generateSabahSmallholderReport", params);

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

    allEstateCensusStateDistricts = await context
      .collection("EstateCensusStateDistricts")
      .find({
        stateCode: {
          $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
        },
        _deletedAt: {
          $exists: false,
        },
      })
      .sort({
        districtCode: 1,
      })
      .toArray();
    allEstateCensusStateDistricts = lodash.orderBy(
      allEstateCensusStateDistricts,
      ["stateCode", "districtCode"],
      ["asc", "asc"],
    );
    // console.log({ allEstateCensusStateDistricts });
    for (const stateCode of allEstateCensusStateCodes) {
      const stateDistricts = allEstateCensusStateDistricts.filter(
        i => i.stateCode === stateCode.stateCode,
      );
      stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
      stateCode.stateDistricts = stateDistricts;
    }
    // console.log(allEstateCensusStateCodes[0]);
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
    const DISTRICT_LIST = [
      "RANAU",
      "TENOM",
      "KENINGAU",
      "TUARAN",
      "KOTA BELUD",
      "PENSIANGAN",
      "SIPITANG",
      "KOTA MARUDU",
      "TAWAU",
      "PENAMPANG",
      "KINABATANGAN",
      "KALABAKAN",
      "SEMPORNA",
      "BELURAN",
      "SEPANGGAR",
      "SILAM",
      "BEAUFORT",
      "KUDAT",
      "LIBARAN",
      "KOTA KINABALU",
      "SILA PILIH PARLIMEN",
      "KIMANIS",
      "PUTATAN",
    ];
    allEstateCensusStateDistricts = allEstateCensusStateDistricts
      .map(item => {
        const districtNameIndex = DISTRICT_LIST.findIndex(
          name => name === item.districtName.toUpperCase(),
        );
        return {
          ...item,
          districtNameIndex,
        };
      })
      .filter(item => item.districtNameIndex >= 0);
    lodash.orderBy(
      allEstateCensusStateDistricts,
      ["districtNameIndex"],
      ["asc"],
    );
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
    const DISTRICT_LIST = [
      "LUBOK ANTU",
      "HULU RAJANG",
      "BETONG",
      "SERIAN",
      "PUNCAK BORNEO",
      "BINTULU",
      "SARIKEI",
      "SRI AMAN",
      "BATANG LUPAR",
      "JULAU",
      "BATANG SADONG",
      "SARATOK",
      "KOTA SAMARAHAN",
      "NULL",
      "STAMPIN",
      "SELANGAU",
      "MAS GADING",
      "PETRA JAYA",
      "SANTUBONG",
      "KAPIT",
      "SIBUTI",
      "BARAM",
    ];
    allEstateCensusStateDistricts = allEstateCensusStateDistricts
      .map(item => {
        const districtNameIndex = DISTRICT_LIST.findIndex(
          name => name === item.districtName.toUpperCase(),
        );
        return {
          ...item,
          districtNameIndex,
        };
      })
      .filter(item => item.districtNameIndex >= 0);
    lodash.orderBy(
      allEstateCensusStateDistricts,
      ["districtNameIndex"],
      ["asc"],
    );
  }
  // console.log({
  //   segment: params.segment,
  //   allEstateCensusStateCodes: allEstateCensusStateCodes.map(i => i.stateName),
  //   allEstateCensusStateDistricts: allEstateCensusStateDistricts.map(
  //     i => i.districtName,
  //   ),
  // });

  // ########################################################################
  // ------------------------------------------------------------------------
  // const allSmallholderDistricts = await context
  //   .collection("SmallholderDistricts")
  //   .find()
  //   .toArray();
  // let indexedSmallholderDistricts = new FlexSearch({
  //   tokenize: "strict",
  //   doc: {
  //     id: "_id",
  //     field: ["guid"],
  //   },
  // });
  // indexedSmallholderDistricts.add(allSmallholderDistricts);

  await context.collection("SmallholderCensusQuestionnaireData").createIndex({
    year: 1,
    "smallholder.stateName": 1,
  });
  const allSmallholderCensusQuestionnaireData = await context
    .collection("SmallholderCensusQuestionnaireData")
    .find(
      ["Jadual 2b", "Jadual 8"].includes(params.code)
        ? {
            // --> no year for Jadual 2b
            // year: String(params.year),
            //
            // "smallholder.stateName": String(params.segment).toUpperCase(),
            "smallholder.stateName": {
              $in: allEstateCensusStateCodes.map(i =>
                String(i.stateName).toUpperCase(),
              ),
            },
          }
        : {
            year: String(params.year),
            // "smallholder.stateName": String(params.segment).toUpperCase(),
            "smallholder.stateName": {
              $in: allEstateCensusStateCodes.map(i =>
                String(i.stateName).toUpperCase(),
              ),
            },
          },
    )
    .toArray();
  console.log(
    "allSmallholderCensusQuestionnaireData",
    allSmallholderCensusQuestionnaireData.length,
    // { sample: allSmallholderCensusQuestionnaireData[0] },
    params,
  );

  let allValues = [];
  for (const item of allSmallholderCensusQuestionnaireData) {
    for (const key in item.data) {
      let value = parseFloat(item.data[key] || "0");
      if (isNaN(value)) {
        value = 0;
        continue;
      }
      let questions = lodash.groupBy(item.questions || [], "_id");
      const question = questions[key]?.[0] || {};

      // const foundDistrict = indexedSmallholderDistricts.find({
      //   guid: item.smallholder.districtGuid,
      // });
      // console.log(
      //   item.smallholder.stateName,
      //   item.smallholder.perlimentName,
      //   foundDistrict && foundDistrict.name,
      // );

      allValues.push({
        _id: uuidV4(),
        questionId: key,
        year: parseInt(item.year),
        value,
        code: question?.code || "",
        stateName: String(item.smallholder.stateName).toUpperCase(),
        stateCode: item.smallholder.stateCode,
        districtName: String(
          // (foundDistrict && foundDistrict.name) ||
          item.smallholder.districtName || item.smallholder.perlimentName || "",
        ).toUpperCase(),
        districtCode: item.smallholder.districtCode,
        localRegionId: item.localRegionId,
        smallholderId: item.smallholderId,
      });
    }
  }
  // console.log(
  //   "allValues",
  //   allValues.length,
  //   allValues.find(
  //     v =>
  //       ["B0401", "B0501", "I0101", "B0402", "B0502"].includes(v.code) &&
  //       v.value > 0,
  //   ),
  // );
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

  const customRowTableRenderer = ({ row, table, COLUMN_SPECS, allStats }) => {
    const stateDistricts = row.stateDistricts || [];
    if (!stateDistricts || !stateDistricts.length) {
      return;
    }

    const stateCode = row;
    table.push([
      ...COLUMN_SPECS.map((spec, specIndex) => {
        return {
          text: specIndex === 0 ? stateCode.stateName : "",
          bold: true,
          alignment:
            specIndex === 0
              ? "left"
              : spec.valueAlignment || (spec.pivotColumn ? "left" : "right"),
        };
      }),
    ]);

    let districtStats = {};
    for (const stateDistrict of stateDistricts) {
      // console.log({ stateDistrict });

      let rowValues = {};
      table.push([
        ...COLUMN_SPECS.map((spec, specIndex) => {
          let result =
            (spec.resolveValue &&
              spec.resolveValue({
                row: {
                  ...row,
                  districtName: stateDistrict.districtName,
                },
                spec,
                rowValues,
              })) ||
            {};
          result.text = formatNumber(String(result.text));
          // console.log(stateDistrict.districtName, spec, result);

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

          if (!districtStats[specIndex]) {
            districtStats[specIndex] = {
              rowResults: [],
              total: 0,
            };
          }
          districtStats[specIndex].rowResults.push(result);
          districtStats[specIndex].total += lodash.round(
            (result && result.value) || 0,
            spec.statsPrecision || 0,
          );

          return {
            ...result,
            alignment:
              specIndex === 0
                ? "left"
                : spec.valueAlignment || (spec.pivotColumn ? "left" : "right"),
            fontSize: (spec.fontSize || BASE_FONT_SIZE) - 1,
            text:
              specIndex === 0
                ? stateDistrict.districtName
                : result.text || result.value || "",
          };
        }),
      ]);
    }

    table.push([
      ...COLUMN_SPECS.map((spec, specIndex) => {
        if (spec.resolveTotalValue) {
          districtStats[specIndex].total = spec.resolveTotalValue(
            districtStats[specIndex],
          );
        }

        return {
          text:
            specIndex === 0
              ? "Jumlah"
              : formatNumber(
                  lodash.round(
                    (districtStats[specIndex] &&
                      districtStats[specIndex].total) ||
                      0,
                    spec.statsPrecision || 0,
                  ),
                  spec.statsPrecision || 0,
                ),
          bold: true,
          alignment:
            specIndex === 0
              ? "left"
              : spec.valueAlignment || (spec.pivotColumn ? "left" : "right"),
          fillColor: "#fafafa",
        };
      }),
    ]);
  };

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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
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
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
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
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
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
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
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
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                // if (foundValues.length > 0) {
                //   console.log(
                //     params.segment,
                //     columnCode,
                //     context.row.districtName,
                //     foundValues.length,
                //   );
                // }
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
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
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
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
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
            columnCodes: ["B0401", "B0501"],
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
      TITLE: `Jadual 2b: Keluasan Tanaman Cukup Umur dan Muda Pekebun Kecil Koko di ${
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            rowSpan: 3,
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
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
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
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
            text: "Cukup Umur > 3 Tahun",
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
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                foundValues = foundValues.filter(
                  item =>
                    params.year - 3 >= item.year && item.year < params.year,
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                foundValues = foundValues.filter(
                  item =>
                    params.year - 3 >= item.year && item.year < params.year,
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
            columnCodes: ["B0402", "B0502"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                foundValues = foundValues.filter(
                  item => item.year < params.year - 3,
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
                    ? {
                        code: columnCode,
                        districtName: context.row.districtName,
                      }
                    : {
                        code: columnCode,
                        stateName: context.row.stateName,
                      },
                );
                foundValues = foundValues.filter(
                  item => item.year < params.year - 3,
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
    "Jadual 5": {
      TITLE: `Jadual 5: Bilangan Tenaga Kerja Di Sektor Pekebun Kecil Koko di ${
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            marginTop: 12,
            rowSpan: 3,
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            valueAlignment: "center",
          },
          {
            text: "Bilangan Buruh Keluarga",
            marginTop: 6,
            rowSpan: 3,
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 55,
            hideColumnCodes: true,
            columnCodes: ["D0101"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Buruh Tempatan",
            colSpan: 6,
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 55,
            hideColumnCodes: true,
            columnCodes: ["D0201a", "D0201b"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Buruh Asing",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 55,
            hideColumnCodes: true,
            columnCodes: ["D0202a", "D0202b"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Filipina",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 55,
            hideColumnCodes: true,
            columnCodes: ["D0203a", "D0203b"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Bangladesh",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["D0204a", "D0204b"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Lain-lain",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 55,
            hideColumnCodes: true,
            columnCodes: ["D0205a", "D0205b"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Jumlah",
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
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
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
            text: "Bilangan Buruh Kelarga",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 55,
            hideColumnCodes: true,
            columnCodes: ["D0101"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Buruh Tempatan",
            rowSpan: 2,
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 55,
            hideColumnCodes: true,
            columnCodes: ["D0201a", "D0201b"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Buruh Asing",
            colSpan: 4,
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 55,
            hideColumnCodes: true,
            columnCodes: ["D0202a", "D0202b"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Filipina",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 55,
            hideColumnCodes: true,
            columnCodes: ["D0203a", "D0203b"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Bangladesh",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["D0204a", "D0204b"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Lain-lain",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 55,
            hideColumnCodes: true,
            columnCodes: ["D0205a", "D0205b"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Jumlah",
            rowSpan: 2,
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
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
            text: "Bilangan Buruh Kelarga",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 55,
            hideColumnCodes: true,
            columnCodes: ["D0101"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
            text: "Buruh Tempatan",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 55,
            hideColumnCodes: true,
            columnCodes: ["D0201a", "D0201b"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
            text: "Indonesia",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 55,
            hideColumnCodes: true,
            columnCodes: ["D0202a", "D0202b"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
            text: "Filipina",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 55,
            hideColumnCodes: true,
            columnCodes: ["D0203a", "D0203b"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
            text: "Bangladesh",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 65,
            hideColumnCodes: true,
            columnCodes: ["D0204a", "D0204b"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
            text: "Lain-lain",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 55,
            hideColumnCodes: true,
            columnCodes: ["D0205a", "D0205b"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
            text: "Jumlah",
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
              let value =
                context.rowValues["2"] +
                context.rowValues["3"] +
                context.rowValues["4"] +
                context.rowValues["5"] +
                context.rowValues["6"];
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
    "Jadual 7": {
      TITLE: `Jadual 7: Bilangan Pekebun Kecil Koko Mengikut Jantina di ${
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            marginTop: 6,
            rowSpan: 2,
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            valueAlignment: "center",
          },
          {
            text: "Bilangan Pekebun Mengikuti Jantina",
            colSpan: 3,
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 120,
            hideColumnCodes: true,
            columnCodes: ["A0101"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Perempuan",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 120,
            hideColumnCodes: true,
            columnCodes: ["A0102"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Jumlah",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 150,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
            text: "Lelaki",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 120,
            hideColumnCodes: true,
            columnCodes: ["A0101"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
            text: "Perempuan",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 120,
            hideColumnCodes: true,
            columnCodes: ["A0102"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
            text: "Jumlah",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 150,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              let value = context.rowValues["1"] + context.rowValues["2"];
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
    "Jadual 9": {
      TITLE: `Jadual 9: Bilangan Pekebun Kecil Koko Mengikut Bangsa di ${
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
      BASE_FONT_SIZE: 9,
      PAGE_ORIENTATION: "landscape",
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            marginTop: 6,
            rowSpan: 2,
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            valueAlignment: "center",
          },
          ...[
            { text: "Melayu", columnCodes: ["A0301"] },
            { text: "Cina", columnCodes: ["A0302"] },
            { text: "India", columnCodes: ["A0303"] },
            { text: "Iban", columnCodes: ["A0304"] },
            { text: "Bidayuh", columnCodes: ["A0304"] },
            { text: "Melantau", columnCodes: ["A0305"] },
            { text: "Orang Ulu", columnCodes: ["A0306"] },
            { text: "Kadazan", columnCodes: ["A0307"] },
            { text: "Dusun", columnCodes: ["A0308"] },
            { text: "Kadazan Dusun", columnCodes: ["A0309"] },
            { text: "Brunei", columnCodes: ["A0311"] },
            { text: "Bajau", columnCodes: ["A0312"] },
            { text: "Bisaya", columnCodes: ["A0313"] },
            { text: "Murut", columnCodes: ["A0314"] },
            { text: "Suduk", columnCodes: ["A0315"] },
            { text: "Lain-Lain", columnCodes: ["A0316"] },
          ].map((col, colIndex) => {
            return {
              text: colIndex === 0 ? "Bilangan Pekebun Mengikut Bangsa" : "",
              colSpan: colIndex === 0 ? 16 : 0,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              fontSize: 7,
              columnWidth: 33,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              valueAlignment: "center",
            };
          }),
          {
            text: "Jumlah",
            marginTop: 6,
            rowSpan: 2,
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 30,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
          ...[
            { text: "Melayu", columnCodes: ["A0301"] },
            { text: "Cina", columnCodes: ["A0302"] },
            { text: "India", columnCodes: ["A0303"] },
            { text: "Iban", columnCodes: ["A0304"] },
            { text: "Bidayuh", columnCodes: ["A0304"] },
            { text: "Melantau", columnCodes: ["A0305"] },
            { text: "Orang Ulu", columnCodes: ["A0306"] },
            { text: "Kadazan", columnCodes: ["A0307"] },
            { text: "Dusun", columnCodes: ["A0308"] },
            { text: "Kadazan Dusun", columnCodes: ["A0309"] },
            { text: "Brunei", columnCodes: ["A0311"] },
            { text: "Bajau", columnCodes: ["A0312"] },
            { text: "Bisaya", columnCodes: ["A0313"] },
            { text: "Murut", columnCodes: ["A0314"] },
            { text: "Suduk", columnCodes: ["A0315"] },
            { text: "Lain-Lain", columnCodes: ["A0316"] },
          ].map(col => {
            return {
              text: col.text,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              fontSize: 7,
              columnWidth: 33,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              resolveValue: context => {
                const columnCodes = context.spec.columnCodes || [];
                let sum = 0;
                let allSmallholderIds = {};
                for (const columnCode of columnCodes) {
                  let foundValues = indexedValues.where(
                    params.segment === "Sabah" ||
                      params.segment === "Sarawak" ||
                      params.segment === "Semenanjung"
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
            };
          }),
          {
            text: "Jumlah",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 30,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              const COLUMNS = [
                { text: "Melayu", columnCodes: ["A0301"] },
                { text: "Cina", columnCodes: ["A0302"] },
                { text: "India", columnCodes: ["A0303"] },
                { text: "Iban", columnCodes: ["A0304"] },
                { text: "Bidayuh", columnCodes: ["A0304"] },
                { text: "Melantau", columnCodes: ["A0305"] },
                { text: "Orang Ulu", columnCodes: ["A0306"] },
                { text: "Kadazan", columnCodes: ["A0307"] },
                { text: "Dusun", columnCodes: ["A0308"] },
                { text: "Kadazan Dusun", columnCodes: ["A0309"] },
                { text: "Brunei", columnCodes: ["A0311"] },
                { text: "Bajau", columnCodes: ["A0312"] },
                { text: "Bisaya", columnCodes: ["A0313"] },
                { text: "Murut", columnCodes: ["A0314"] },
                { text: "Suduk", columnCodes: ["A0315"] },
                { text: "Lain-Lain", columnCodes: ["A0316"] },
              ];
              let value = 0;
              COLUMNS.forEach((col, colIndex) => {
                value += context.rowValues[`${colIndex + 1}`] || 0;
              });
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
      TITLE: `Jadual 10: Tahap Pendidikan Pekebun Kecil Koko di ${
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
      // BASE_FONT_SIZE: 9,
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            rowSpan: 2,
            marginTop: 6,
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            valueAlignment: "center",
          },
          ...[
            { text: "Tidak Bersekolah", columnCodes: ["A0401"] },
            { text: "Sekolah Dewasa", columnCodes: ["A0402"] },
            { text: "Sekolah Rendah", columnCodes: ["A0403"] },
            { text: "Sekolah Menengah", columnCodes: ["A0404"] },
            { text: "Kolej/Universiti", columnCodes: ["A0405"] },
            { text: "Lain-lain", columnCodes: ["A0406"] },
          ].map((col, colIndex) => {
            return {
              text:
                colIndex === 0
                  ? "Bilangan Pekebun Mengikut Tahap Pendidikan"
                  : "",
              colSpan: colIndex === 0 ? 6 : 0,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 7,
              columnWidth: 59,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              valueAlignment: "center",
            };
          }),
          {
            text: "Jumlah",
            rowSpan: 2,
            marginTop: 6,
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 50,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
          ...[
            { text: "Tidak Bersekolah", columnCodes: ["A0401"] },
            { text: "Sekolah Dewasa", columnCodes: ["A0402"] },
            { text: "Sekolah Rendah", columnCodes: ["A0403"] },
            { text: "Sekolah Menengah", columnCodes: ["A0404"] },
            { text: "Kolej/Universiti", columnCodes: ["A0405"] },
            { text: "Lain-lain", columnCodes: ["A0406"] },
          ].map(col => {
            return {
              text: col.text,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 7,
              columnWidth: 59,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              resolveValue: context => {
                const columnCodes = context.spec.columnCodes || [];
                let sum = 0;
                let allSmallholderIds = {};
                for (const columnCode of columnCodes) {
                  let foundValues = indexedValues.where(
                    params.segment === "Sabah" ||
                      params.segment === "Sarawak" ||
                      params.segment === "Semenanjung"
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
            };
          }),
          {
            text: "Jumlah",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 50,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              const COLUMNS = [
                { text: "Tidak Bersekolah", columnCodes: ["A0401"] },
                { text: "Sekolah Dewasa", columnCodes: ["A0402"] },
                { text: "Sekolah Rendah", columnCodes: ["A0403"] },
                { text: "Sekolah Menengah", columnCodes: ["A0404"] },
                { text: "Kolej/Universiti", columnCodes: ["A0405"] },
                { text: "Lain-lain", columnCodes: ["A0406"] },
              ];
              let value = 0;
              COLUMNS.forEach((col, colIndex) => {
                value += context.rowValues[`${colIndex + 1}`] || 0;
              });
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
    "Jadual 11": {
      TITLE: `Jadual 11: Pekerjaan Utama Pekebun Kecil Koko di ${
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
      // BASE_FONT_SIZE: 9,
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            rowSpan: 2,
            marginTop: 6,
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            valueAlignment: "center",
          },
          ...[
            { text: "Pertanian Koko", columnCodes: ["A0501"] },
            { text: "Pertanian Lain", columnCodes: ["A0501a"] },
            { text: "Bukan Pertanian", columnCodes: ["A0509a"] },
          ].map((col, colIndex) => {
            return {
              text:
                colIndex === 0
                  ? "Bilangan Pekebun Mengikut Sumber Pendapatan Utama"
                  : "",
              colSpan: colIndex === 0 ? 3 : 0,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 7,
              columnWidth: 105,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              resolveValue: context => {
                const columnCodes = context.spec.columnCodes || [];
                let sum = 0;
                let allSmallholderIds = {};
                for (const columnCode of columnCodes) {
                  let foundValues = indexedValues.where(
                    params.segment === "Sabah" ||
                      params.segment === "Sarawak" ||
                      params.segment === "Semenanjung"
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
            };
          }),
          {
            text: "Jumlah",
            rowSpan: 2,
            marginTop: 6,
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 110,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
          ...[
            { text: "Pertanian Koko", columnCodes: ["A0501"] },
            { text: "Pertanian Lain", columnCodes: ["A0501a"] },
            { text: "Bukan Pertanian", columnCodes: ["A0509a"] },
          ].map(col => {
            return {
              text: col.text,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 7,
              columnWidth: 105,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              resolveValue: context => {
                const columnCodes = context.spec.columnCodes || [];
                let sum = 0;
                let allSmallholderIds = {};
                for (const columnCode of columnCodes) {
                  let foundValues = indexedValues.where(
                    params.segment === "Sabah" ||
                      params.segment === "Sarawak" ||
                      params.segment === "Semenanjung"
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
            };
          }),
          {
            text: "Jumlah",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 110,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              const COLUMNS = [
                { text: "Pertanian Koko", columnCodes: ["A0501"] },
                { text: "Pertanian Lain", columnCodes: ["A0501a"] },
                { text: "Bukan Pertanian", columnCodes: ["A0509a"] },
              ];
              let value = 0;
              COLUMNS.forEach((col, colIndex) => {
                value += context.rowValues[`${colIndex + 1}`] || 0;
              });
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
    "Jadual 12": {
      TITLE: `Jadual 12: Bilangan Pekebun Kecil Koko Mengikut Status Pemilikan di ${
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
      // BASE_FONT_SIZE: 9,
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            rowSpan: 2,
            marginTop: 6,
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
          ...[
            { text: "Pemilik Kebun", columnCodes: ["A0601"] },
            {
              text: "Bukan Pemilik Kebun",
              columnCodes: ["A0603", "A0604", "A0602"],
            },
          ].map((col, colIndex) => {
            return {
              text:
                colIndex === 0
                  ? "Bilangan Pekebun Kecil Koko Mengikut Status Pemilikan"
                  : "",
              colSpan: colIndex === 0 ? 2 : 0,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 7,
              columnWidth: 115,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              resolveValue: context => {
                const columnCodes = context.spec.columnCodes || [];
                let sum = 0;
                let allSmallholderIds = {};
                for (const columnCode of columnCodes) {
                  let foundValues = indexedValues.where(
                    params.segment === "Sabah" ||
                      params.segment === "Sarawak" ||
                      params.segment === "Semenanjung"
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
            };
          }),
          {
            text: "Jumlah",
            rowSpan: 2,
            marginTop: 6,
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 110,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              const COLUMNS = [
                { text: "Pemilik Kebun", columnCodes: ["A0601"] },
                {
                  text: "Bukan Pemilik Kebun",
                  columnCodes: ["A0603", "A0604", "A0602"],
                },
              ];
              let value = 0;
              COLUMNS.forEach((col, colIndex) => {
                value += context.rowValues[`${colIndex + 1}`] || 0;
              });
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
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
          ...[
            { text: "Pemilik Kebun", columnCodes: ["A0601"] },
            {
              text: "Bukan Pemilik Kebun",
              columnCodes: ["A0603", "A0604", "A0602"],
            },
          ].map(col => {
            return {
              text: col.text,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 7,
              columnWidth: 155,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              resolveValue: context => {
                const columnCodes = context.spec.columnCodes || [];
                let sum = 0;
                let allSmallholderIds = {};
                for (const columnCode of columnCodes) {
                  let foundValues = indexedValues.where(
                    params.segment === "Sabah" ||
                      params.segment === "Sarawak" ||
                      params.segment === "Semenanjung"
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
            };
          }),
          {
            text: "Jumlah",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 110,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              const COLUMNS = [
                { text: "Pemilik Kebun", columnCodes: ["A0601"] },
                {
                  text: "Bukan Pemilik Kebun",
                  columnCodes: ["A0603", "A0604", "A0602"],
                },
              ];
              let value = 0;
              COLUMNS.forEach((col, colIndex) => {
                value += context.rowValues[`${colIndex + 1}`] || 0;
              });
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
    "Jadual 4a": {
      TITLE: `Jadual 4a: Bilangan Pekebun Kecil Mengikut Saiz Keluasan di ${
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
      BASE_FONT_SIZE: 9,
      PAGE_ORIENTATION: "landscape",
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            rowSpan: 2,
            marginTop: 6,
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
          ...[
            { text: " < 0.5", columnCodes: ["B0401", "B0501"] },
            { text: "0.5 - 0.99", columnCodes: ["B0401", "B0501"] },
            { text: "1.0 - 1.99", columnCodes: ["B0401", "B0501"] },
            { text: "2.0 - 2.99", columnCodes: ["B0401", "B0501"] },
            { text: "3.0 - 3.99", columnCodes: ["B0401", "B0501"] },
            { text: "4.0 - 4.99", columnCodes: ["B0401", "B0501"] },
            { text: "5.0 - 5.99", columnCodes: ["B0401", "B0501"] },
            { text: "6.0 - 9.99", columnCodes: ["B0401", "B0501"] },
            { text: " > 10.0", columnCodes: ["B0401", "B0501"] },
          ].map((col, colIndex) => {
            return {
              text: colIndex === 0 ? "Saiz Keluasan (ha)" : "",
              colSpan: colIndex === 0 ? 9 : 0,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 7,
              columnWidth: 58,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              valueAlignment: "center",
            };
          }),
          {
            text: "Jumlah (Bil)",
            rowSpan: 2,
            marginTop: 6,
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
          ...[
            { text: " < 0.5", columnCodes: ["B0401", "B0501"] },
            { text: "0.5 - 0.99", columnCodes: ["B0401", "B0501"] },
            { text: "1.0 - 1.99", columnCodes: ["B0401", "B0501"] },
            { text: "2.0 - 2.99", columnCodes: ["B0401", "B0501"] },
            { text: "3.0 - 3.99", columnCodes: ["B0401", "B0501"] },
            { text: "4.0 - 4.99", columnCodes: ["B0401", "B0501"] },
            { text: "5.0 - 5.99", columnCodes: ["B0401", "B0501"] },
            { text: "6.0 - 9.99", columnCodes: ["B0401", "B0501"] },
            { text: " > 10.0", columnCodes: ["B0401", "B0501"] },
          ].map(col => {
            return {
              text: col.text,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 7,
              columnWidth: 58,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              resolveValue: context => {
                let split = col.text.split(" ");
                let minAge = split[0] ? parseFloat(split[0]) : 0;
                let maxAge = split[2] ? parseFloat(split[2]) : 0;
                if (split[1] === ">") {
                  minAge = split[2] ? parseFloat(split[2]) : 0;
                  maxAge = split[0] ? parseFloat(split[0]) : 0;
                }
                // console.log({ split, minAge, maxAge });

                const columnCodes = context.spec.columnCodes || [];
                let sum = 0;
                let allSmallholderIds = {};
                for (const columnCode of columnCodes) {
                  let foundValues = indexedValues.where(
                    params.segment === "Sabah" ||
                      params.segment === "Sarawak" ||
                      params.segment === "Semenanjung"
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
                if (value < 0) {
                  value = 0;
                }
                if (minAge && value < minAge + 0.005) {
                  value = 0;
                }
                if (maxAge && value > maxAge - 0.005) {
                  value = 0;
                }

                return {
                  value,
                  text: value,
                };
              },
              valueAlignment: "center",
            };
          }),
          {
            text: "Jumlah (Bil)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              const COLUMNS = [
                { text: " < 0.5", columnCodes: ["B0401", "B0501"] },
                { text: "0.5 - 0.99", columnCodes: ["B0401", "B0501"] },
                { text: "1.0 - 1.99", columnCodes: ["B0401", "B0501"] },
                { text: "2.0 - 2.99", columnCodes: ["B0401", "B0501"] },
                { text: "3.0 - 3.99", columnCodes: ["B0401", "B0501"] },
                { text: "4.0 - 4.99", columnCodes: ["B0401", "B0501"] },
                { text: "5.0 - 5.99", columnCodes: ["B0401", "B0501"] },
                { text: "6.0 - 9.99", columnCodes: ["B0401", "B0501"] },
                { text: " > 10.0", columnCodes: ["B0401", "B0501"] },
              ];
              let value = 0;
              COLUMNS.forEach((col, colIndex) => {
                value += context.rowValues[`${colIndex + 1}`] || 0;
              });
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
    "Jadual 4b": {
      TITLE: `Jadual 4b: Bilangan Pekebun Kecil Mengikut Kumpulan Saiz Keluasan di ${
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
      BASE_FONT_SIZE: 9,
      PAGE_ORIENTATION: "landscape",
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            rowSpan: 2,
            marginTop: 6,
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
          ...[
            { text: " < 0.5", columnCodes: ["B0402", "B0502"] },
            { text: "0.5 - 0.99", columnCodes: ["B0402", "B0502"] },
            { text: "1.0 - 1.99", columnCodes: ["B0402", "B0502"] },
            { text: "2.0 - 2.99", columnCodes: ["B0402", "B0502"] },
            { text: "3.0 - 3.99", columnCodes: ["B0402", "B0502"] },
            { text: "4.0 - 4.99", columnCodes: ["B0402", "B0502"] },
            { text: "5.0 - 5.99", columnCodes: ["B0402", "B0502"] },
            { text: "6.0 - 9.99", columnCodes: ["B0402", "B0502"] },
            { text: " > 10.0", columnCodes: ["B0402", "B0502"] },
          ].map((col, colIndex) => {
            return {
              text: colIndex === 0 ? "Saiz Keluasan (ha)" : "",
              colSpan: colIndex === 0 ? 9 : 0,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 7,
              columnWidth: 58,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              valueAlignment: "center",
            };
          }),
          {
            text: "Jumlah (Bil)",
            rowSpan: 2,
            marginTop: 6,
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
          ...[
            { text: " < 0.5", columnCodes: ["B0402", "B0502"] },
            { text: "0.5 - 0.99", columnCodes: ["B0402", "B0502"] },
            { text: "1.0 - 1.99", columnCodes: ["B0402", "B0502"] },
            { text: "2.0 - 2.99", columnCodes: ["B0402", "B0502"] },
            { text: "3.0 - 3.99", columnCodes: ["B0402", "B0502"] },
            { text: "4.0 - 4.99", columnCodes: ["B0402", "B0502"] },
            { text: "5.0 - 5.99", columnCodes: ["B0402", "B0502"] },
            { text: "6.0 - 9.99", columnCodes: ["B0402", "B0502"] },
            { text: " > 10.0", columnCodes: ["B0402", "B0502"] },
          ].map(col => {
            return {
              text: col.text,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 7,
              columnWidth: 58,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              resolveValue: context => {
                let split = col.text.split(" ");
                let minAge = split[0] ? parseFloat(split[0]) : 0;
                let maxAge = split[2] ? parseFloat(split[2]) : 0;
                if (split[1] === ">") {
                  minAge = split[2] ? parseFloat(split[2]) : 0;
                  maxAge = split[0] ? parseFloat(split[0]) : 0;
                }
                // console.log({ split, minAge, maxAge });

                const columnCodes = context.spec.columnCodes || [];
                let sum = 0;
                let allSmallholderIds = {};
                for (const columnCode of columnCodes) {
                  let foundValues = indexedValues.where(
                    params.segment === "Sabah" ||
                      params.segment === "Sarawak" ||
                      params.segment === "Semenanjung"
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
                if (value < 0) {
                  value = 0;
                }
                if (minAge && value < minAge + 0.005) {
                  value = 0;
                }
                if (maxAge && value > maxAge - 0.005) {
                  value = 0;
                }

                return {
                  value,
                  text: value,
                };
              },
              valueAlignment: "center",
            };
          }),
          {
            text: "Jumlah (Bil)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              const COLUMNS = [
                { text: " < 0.5", columnCodes: ["B0402", "B0502"] },
                { text: "0.5 - 0.99", columnCodes: ["B0402", "B0502"] },
                { text: "1.0 - 1.99", columnCodes: ["B0402", "B0502"] },
                { text: "2.0 - 2.99", columnCodes: ["B0402", "B0502"] },
                { text: "3.0 - 3.99", columnCodes: ["B0402", "B0502"] },
                { text: "4.0 - 4.99", columnCodes: ["B0402", "B0502"] },
                { text: "5.0 - 5.99", columnCodes: ["B0402", "B0502"] },
                { text: "6.0 - 9.99", columnCodes: ["B0402", "B0502"] },
                { text: " > 10.0", columnCodes: ["B0402", "B0502"] },
              ];
              let value = 0;
              COLUMNS.forEach((col, colIndex) => {
                value += context.rowValues[`${colIndex + 1}`] || 0;
              });
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
    "Jadual 8": {
      TITLE: `Jadual 8: Bilangan Pekebun Kecil Mengikut Umur di ${
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
      BASE_FONT_SIZE: 9,
      PAGE_ORIENTATION: "landscape",
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            rowSpan: 2,
            marginTop: 6,
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            valueAlignment: "center",
          },
          ...[
            { text: " < 30", columnCodes: ["A0201"] },
            { text: "30 - 35", columnCodes: ["A0201"] },
            { text: "36 - 40", columnCodes: ["A0201"] },
            { text: "41 - 45", columnCodes: ["A0201"] },
            { text: "46 - 50", columnCodes: ["A0201"] },
            { text: "51 - 55", columnCodes: ["A0201"] },
            { text: "56 - 60", columnCodes: ["A0201"] },
            { text: " > 60", columnCodes: ["A0201"] },
          ].map((col, colIndex) => {
            return {
              text:
                colIndex === 0 ? "Bilangan Pekebun Mengikut Umur (Tahun)" : "",
              colSpan: colIndex === 0 ? 8 : 0,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 7,
              columnWidth: 68,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              valueAlignment: "center",
            };
          }),
          {
            text: "Jumlah (Bil)",
            rowSpan: 2,
            marginTop: 6,
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            valueAlignment: "center",
          },
        ],
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
          ...[
            { text: " < 30", columnCodes: ["A0201"] },
            { text: "30 - 35", columnCodes: ["A0201"] },
            { text: "36 - 40", columnCodes: ["A0201"] },
            { text: "41 - 45", columnCodes: ["A0201"] },
            { text: "46 - 50", columnCodes: ["A0201"] },
            { text: "51 - 55", columnCodes: ["A0201"] },
            { text: "56 - 60", columnCodes: ["A0201"] },
            { text: " > 60", columnCodes: ["A0201"] },
          ].map(col => {
            return {
              text: col.text,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 7,
              columnWidth: 68,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              resolveValue: context => {
                let split = col.text.split(" ");
                let minAge = split[0] ? parseInt(split[0]) : 0;
                let maxAge = split[2] ? parseInt(split[2]) : 0;
                if (split[1] === ">") {
                  minAge = split[2] ? parseInt(split[2]) : 0;
                  maxAge = split[0] ? parseInt(split[0]) : 0;
                }
                // console.log({ split, minAge, maxAge });

                const columnCodes = context.spec.columnCodes || [];
                let sum = 0;
                let allSmallholderIds = {};
                for (const columnCode of columnCodes) {
                  let foundValues = indexedValues.where(
                    params.segment === "Sabah" ||
                      params.segment === "Sarawak" ||
                      params.segment === "Semenanjung"
                      ? {
                          code: columnCode,
                          districtName: context.row.districtName,
                        }
                      : {
                          code: columnCode,
                          stateName: context.row.stateName,
                        },
                  );
                  foundValues = foundValues.filter(item => {
                    let value = parseInt(item.value);
                    if (!value || isNaN(value)) return false;

                    const age = parseInt(params.year) - value;
                    if (age < 0) return false;
                    if (minAge && age < minAge + 0.5) return false;
                    if (maxAge && age > maxAge - 0.5) return false;
                    return true;
                  });
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
            };
          }),
          {
            text: "Jumlah (Bil)",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 75,
            hideColumnCodes: true,
            columnCodes: [],
            statsPrecision: 0,
            resolveValue: context => {
              // console.log({ context });
              const COLUMNS = [
                { text: " < 30", columnCodes: ["A0201"] },
                { text: "30 - 35", columnCodes: ["A0201"] },
                { text: "36 - 40", columnCodes: ["A0201"] },
                { text: "41 - 45", columnCodes: ["A0201"] },
                { text: "46 - 50", columnCodes: ["A0201"] },
                { text: "51 - 55", columnCodes: ["A0201"] },
                { text: "56 - 60", columnCodes: ["A0201"] },
                { text: " > 60", columnCodes: ["A0201"] },
              ];
              let value = 0;
              COLUMNS.forEach((col, colIndex) => {
                value += context.rowValues[`${colIndex + 1}`] || 0;
              });
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
    "Jadual 3a": {
      TITLE: `Jadual 3a: Keluasan Tanaman Koko Mengikut Jenis Tanaman Tunggal dan Selingan di ${
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            rowSpan: 3,
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            valueAlignment: "center",
          },
          {
            text: "Maklumat Tanaman Koko",
            colSpan: 4,
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
            rowSpan: 3,
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
            rowSpan: 3,
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
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
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
            text: "Tanaman Tunggal",
            colSpan: 2,
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
            text: "Tanaman Selingan",
            colSpan: 2,
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
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
    "Jadual 3b": {
      TITLE: `Jadual 3b: Keluasan Tanaman Koko Mengikut Jenis Tanaman Tunggal dan Selingan di ${
        !params.segment
          ? "Malaysia"
          : params.segment === "Semenanjung"
          ? "Semenanjung Malaysia"
          : params.segment === "Sabah"
          ? "Sabah"
          : params.segment === "Sarawak"
          ? "Sarawak"
          : ""
      } (Dirian)`,
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            rowSpan: 3,
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            valueAlignment: "center",
          },
          {
            text: "Maklumat Tanaman Koko",
            colSpan: 4,
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0402"],
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
            columnCodes: ["B0402"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Tanaman Selingan",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0502"],
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
            columnCodes: ["B0502"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Jumlah Pekebun\n(Bil)",
            rowSpan: 3,
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
            rowSpan: 3,
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
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
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
            text: "Tanaman Tunggal",
            colSpan: 2,
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0402"],
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
            columnCodes: ["B0402"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          {
            text: "Tanaman Selingan",
            colSpan: 2,
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            columnWidth: 70,
            hideColumnCodes: true,
            columnCodes: ["B0502"],
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
            columnCodes: ["B0502"],
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
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
            columnCodes: ["B0402"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
            columnCodes: ["B0402"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
            columnCodes: ["B0502"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
            columnCodes: ["B0502"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
    "Jadual 13": {
      TITLE: `Jadual 13: Bilangan Pekebun Yang Menghadapi Masalah Pasaran di ${
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
      // BASE_FONT_SIZE: 9,
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            rowSpan: 2,
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
            text: "Bilangan pekebun yang terlibat dalam pasaran koko",
            rowSpan: 2,
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            // fontSize: 7,
            columnWidth: 130,
            hideColumnCodes: true,
            columnCodes: ["G0101", "G0102"],
            statsPrecision: 0,
            valueAlignment: "center",
          },
          ...[
            { text: "Menghadapi masalah", columnCodes: ["G0101"] },
            {
              text: "Tidak menghadapi masalah",
              columnCodes: ["G0102"],
            },
          ].map((col, colIndex) => {
            return {
              text:
                colIndex === 0
                  ? "Bilangan pekebun yang menghadapi masalah dalam memasarkan koko"
                  : col.text,
              colSpan: colIndex === 0 ? 2 : 0,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 7,
              columnWidth: 130,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              valueAlignment: "center",
            };
          }),
        ],
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
            text: "Bilangan pekebun yang terlibat dalam pasaran koko",
            alias: "",
            hideSubLabels: true,
            alignment: "center",
            bold: true,
            // fontSize: 7,
            columnWidth: 130,
            hideColumnCodes: true,
            columnCodes: ["G0101", "G0102"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
          ...[
            { text: "Menghadapi masalah", columnCodes: ["G0101"] },
            {
              text: "Tidak menghadapi masalah",
              columnCodes: ["G0102"],
            },
          ].map(col => {
            return {
              text: col.text,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 7,
              columnWidth: 140,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              resolveValue: context => {
                const columnCodes = context.spec.columnCodes || [];
                let sum = 0;
                let allSmallholderIds = {};
                for (const columnCode of columnCodes) {
                  let foundValues = indexedValues.where(
                    params.segment === "Sabah" ||
                      params.segment === "Sarawak" ||
                      params.segment === "Semenanjung"
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
            };
          }),
        ],
      ],
    },
    "Jadual 14": {
      TITLE: `Jadual 14: Bilangan Pekebun Yang Dihadapi Pekebun Dalam Memasarkan Koko di ${
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
      // BASE_FONT_SIZE: 9,
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            rowSpan: 2,
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
          ...[
            { text: "Tiada pembeli berhampiran", columnCodes: ["G0201"] },
            {
              text: "Dikenakan potongan harga",
              columnCodes: ["G0202"],
            },
            {
              text: "Pembeli hanya terima koko kering",
              columnCodes: ["G0203"],
            },
            {
              text: "Pelesen tidak mahu membeli",
              columnCodes: ["G0204"],
            },
            {
              text: "Lain-lain masalah",
              columnCodes: ["G0205"],
            },
          ].map((col, colIndex) => {
            return {
              text:
                colIndex === 0
                  ? "Bilangan pekebun yang menghadapi masalah dalam memasarkan koko"
                  : col.text,
              colSpan: colIndex === 0 ? 5 : 0,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 7,
              columnWidth: 82,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              valueAlignment: "center",
            };
          }),
        ],
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
          ...[
            { text: "Tiada pembeli berhampiran", columnCodes: ["G0201"] },
            {
              text: "Dikenakan potongan harga",
              columnCodes: ["G0202"],
            },
            {
              text: "Pembeli hanya terima koko kering",
              columnCodes: ["G0203"],
            },
            {
              text: "Pelesen tidak mahu membeli",
              columnCodes: ["G0204"],
            },
            {
              text: "Lain-lain masalah",
              columnCodes: ["G0205"],
            },
          ].map(col => {
            return {
              text: col.text,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 7,
              columnWidth: 82,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              resolveValue: context => {
                const columnCodes = context.spec.columnCodes || [];
                let sum = 0;
                let allSmallholderIds = {};
                for (const columnCode of columnCodes) {
                  let foundValues = indexedValues.where(
                    params.segment === "Sabah" ||
                      params.segment === "Sarawak" ||
                      params.segment === "Semenanjung"
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
            };
          }),
        ],
      ],
    },
    "Jadual 15": {
      TITLE: `Jadual 15: Masalah yang Dihadapi Dalam Tanaman Koko di ${
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
      // BASE_FONT_SIZE: 9,
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            rowSpan: 2,
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
          ...[
            { text: "Kekurangan buruh", columnCodes: ["H0101"] },
            { text: "Ancaman perosak", columnCodes: ["H0102"] },
            { text: "Ancaman penyakit", columnCodes: ["H0103"] },
            { text: "Harga koko tidak menentu", columnCodes: ["H0104"] },
            { text: "Tiada pembeli", columnCodes: ["H0105"] },
            { text: "Cuaca yang tidak menentu", columnCodes: ["H0106"] },
            { text: "Harga input yang tinggi", columnCodes: ["H0107"] },
            { text: "Lain-lain masalah", columnCodes: ["H0108"] },
          ].map((col, colIndex) => {
            return {
              text:
                colIndex === 0
                  ? "Bilangan pekebun yang menghadapi masalah tanaman koko"
                  : col.text,
              colSpan: colIndex === 0 ? 8 : 0,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              fontSize: 10,
              columnWidth: 50,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              valueAlignment: "center",
            };
          }),
        ],
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
          ...[
            { text: "Kekurangan buruh", columnCodes: ["H0101"] },
            { text: "Ancaman perosak", columnCodes: ["H0102"] },
            { text: "Ancaman penyakit", columnCodes: ["H0103"] },
            { text: "Harga koko tidak menentu", columnCodes: ["H0104"] },
            { text: "Tiada pembeli", columnCodes: ["H0105"] },
            { text: "Cuaca yang tidak menentu", columnCodes: ["H0106"] },
            { text: "Harga input yang tinggi", columnCodes: ["H0107"] },
            { text: "Lain-lain masalah", columnCodes: ["H0108"] },
          ].map(col => {
            return {
              text: col.text,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              fontSize: 10,
              columnWidth: 50,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              resolveValue: context => {
                const columnCodes = context.spec.columnCodes || [];
                let sum = 0;
                let allSmallholderIds = {};
                for (const columnCode of columnCodes) {
                  let foundValues = indexedValues.where(
                    params.segment === "Sabah" ||
                      params.segment === "Sarawak" ||
                      params.segment === "Semenanjung"
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
            };
          }),
        ],
      ],
    },
    "Jadual 16": {
      TITLE: `Jadual 16: Faktor-faktor Tanaman Koko Terbiar di ${
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
      // BASE_FONT_SIZE: 9,
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            rowSpan: 2,
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
            text: "Terbiar",
            colSpan: 2,
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
          ...[
            { text: "Tiada tenaga kerja", columnCodes: ["I0301"] },
            {
              text: "Tidak berupaya disebabkan faktor umur",
              columnCodes: ["I0302"],
            },
            {
              text: "Hendak menggantikan dengan tanaman lain",
              columnCodes: ["I0303"],
            },
            {
              text: "Lain-lain",
              columnCodes: ["I0304"],
            },
          ].map((col, colIndex) => {
            return {
              text:
                colIndex === 0 ? "Sebab utama tanaman koko terbiar" : col.text,
              colSpan: colIndex === 0 ? 4 : 0,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 10,
              columnWidth: 60,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              valueAlignment: "center",
            };
          }),
        ],
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
            columnCodes: ["I0101"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
          ...[
            { text: "Tiada tenaga kerja", columnCodes: ["I0301"] },
            {
              text: "Tidak berupaya disebabkan faktor umur",
              columnCodes: ["I0302"],
            },
            {
              text: "Hendak menggantikan dengan tanaman lain",
              columnCodes: ["I0303"],
            },
            {
              text: "Lain-lain",
              columnCodes: ["I0304"],
            },
          ].map(col => {
            return {
              text: col.text,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 10,
              columnWidth: 60,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              resolveValue: context => {
                const columnCodes = context.spec.columnCodes || [];
                let sum = 0;
                let allSmallholderIds = {};
                for (const columnCode of columnCodes) {
                  let foundValues = indexedValues.where(
                    params.segment === "Sabah" ||
                      params.segment === "Sarawak" ||
                      params.segment === "Semenanjung"
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
            };
          }),
        ],
      ],
    },
    "Jadual 17": {
      TITLE: `Jadual 17: Pemulihan Tanaman Koko Terbiar di ${
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
      // BASE_FONT_SIZE: 9,
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

          allEstateCensusStateDistricts = await context
            .collection("EstateCensusStateDistricts")
            .find({
              stateCode: {
                $in: allEstateCensusStateCodes.map(i => String(i.stateCode)),
              },
              _deletedAt: {
                $exists: false,
              },
            })
            .sort({
              districtCode: 1,
            })
            .toArray();
          allEstateCensusStateDistricts = lodash.orderBy(
            allEstateCensusStateDistricts,
            ["stateCode", "districtCode"],
            ["asc", "asc"],
          );
          // console.log({ allEstateCensusStateDistricts });
          for (const stateCode of allEstateCensusStateCodes) {
            const stateDistricts = allEstateCensusStateDistricts.filter(
              i => i.stateCode === stateCode.stateCode,
            );
            stateDistricts.sort((a, b) => a.districtCode - b.districtCode);
            stateCode.stateDistricts = stateDistricts;
          }

          // return allEstateCensusStateDistricts;
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
      CUSTOM_ROW_TABLE_RENDERER:
        params.segment === "Semenanjung" ? customRowTableRenderer : null,
      COLUMNS: [
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            rowSpan: 2,
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
            text: "Terbiar",
            colSpan: 2,
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
          ...[
            { text: "Tiada tenaga kerja", columnCodes: ["I0401"] },
            {
              text: "Tidak berupaya disebabkan faktor umur",
              columnCodes: ["I0402"],
            },
          ].map((col, colIndex) => {
            return {
              text:
                colIndex === 0 ? "Sebab utama tanaman koko terbiar" : col.text,
              colSpan: colIndex === 0 ? 2 : 0,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 10,
              columnWidth: 105,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              valueAlignment: "center",
            };
          }),
        ],
        [
          {
            text:
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
                ? "District"
                : "Negeri",
            alias: "",
            alignment: "center",
            bold: true,
            columnWidth: 100,
            hideColumnCodes: true,
            pivotColumn: true,
            resolveValue: context =>
              params.segment === "Sabah" ||
              params.segment === "Sarawak" ||
              params.segment === "Semenanjung"
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
            columnCodes: ["I0101"],
            statsPrecision: 0,
            resolveValue: context => {
              const columnCodes = context.spec.columnCodes || [];
              let sum = 0;
              let allSmallholderIds = {};
              for (const columnCode of columnCodes) {
                let foundValues = indexedValues.where(
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
                  params.segment === "Sabah" ||
                    params.segment === "Sarawak" ||
                    params.segment === "Semenanjung"
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
          ...[
            { text: "Tiada tenaga kerja", columnCodes: ["I0401"] },
            {
              text: "Tidak berupaya disebabkan faktor umur",
              columnCodes: ["I0402"],
            },
          ].map(col => {
            return {
              text: col.text,
              alias: "",
              hideSubLabels: true,
              alignment: "center",
              bold: true,
              // fontSize: 10,
              columnWidth: 105,
              hideColumnCodes: true,
              columnCodes: col.columnCodes,
              statsPrecision: 0,
              resolveValue: context => {
                const columnCodes = context.spec.columnCodes || [];
                let sum = 0;
                let allSmallholderIds = {};
                for (const columnCode of columnCodes) {
                  let foundValues = indexedValues.where(
                    params.segment === "Sabah" ||
                      params.segment === "Sarawak" ||
                      params.segment === "Semenanjung"
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
            };
          }),
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
    CUSTOM_ROW_TABLE_RENDERER,
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
                // console.log({ row });
                if (CUSTOM_ROW_TABLE_RENDERER) {
                  const renderFn = CUSTOM_ROW_TABLE_RENDERER;
                  renderFn({
                    row,
                    table,
                    COLUMN_SPECS,
                    allStats,
                  });
                } else if (!SUB_ROWS || SUB_ROWS.length === 0) {
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
  generateSabahSmallholderReport,
};
