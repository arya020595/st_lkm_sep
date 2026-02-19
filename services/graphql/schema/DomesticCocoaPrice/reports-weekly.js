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
const { formatNumber } = require("../../libs/numbers");

const generateWeeklySummaryReportForDomesticCocoaPrices = async (
  self,
  params,
  context,
) => {
  // console.log("generateWeeklySummaryReportForDomesticCocoaPrices", params);
  assertValidSession(context.activeSession);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  const allCentres = await context
    .collection("Centres")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  const indexedCentres = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["code"],
    },
  });
  indexedCentres.add(allCentres);

  let query = {
    $or: [],
  };
  for (const year of params.yearIds) {
    if (params.monthIds.length === 0) {
      query.$or.push({
        date: {
          $gte: dayjs().set("year", year).startOf("year").format("YYYY-MM-DD"),
          $lte: dayjs().set("year", year).endOf("year").format("YYYY-MM-DD"),
        },
      });
    } else {
      if (params.weekIds.length === 0) {
        for (const month of params.monthIds) {
          query.$or.push({
            date: {
              $gte: dayjs()
                .set("year", year)
                .set("month", month)
                .startOf("month")
                .format("YYYY-MM-DD"),
              $lte: dayjs()
                .set("year", year)
                .set("month", month)
                .endOf("month")
                .format("YYYY-MM-DD"),
            },
          });
        }
      } else {
        for (const month of params.monthIds) {
          const weekIndex = parseInt(params.weekIds[0]) - 1;
          query.$or.push({
            date: {
              $gte: dayjs()
                .set("year", year)
                .set("month", month)
                .startOf("month")
                .add(weekIndex, "week")
                .startOf("week")
                .format("YYYY-MM-DD"),
              $lte: dayjs()
                .set("year", year)
                .set("month", month)
                .startOf("month")
                .add(weekIndex, "week")
                .endOf("week")
                .format("YYYY-MM-DD"),
            },
          });
        }
      }
    }
  }
  if (query.$or.length === 0) {
    delete query.$or;
  }
  // console.log(JSON.stringify({ params, query }, null, 4));
  await context.collection("DomesticCocoaPrices").createIndex({
    date: 1,
  });
  const allDomesticCocoaPrices = await context
    .collection("DomesticCocoaPrices")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  const indexedDomesticCocoaPrices = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["centreId"],
    },
  });
  indexedDomesticCocoaPrices.add(allDomesticCocoaPrices);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 11;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    pageOrientation: "landscape",
    // header:
    //   metadata.letter.useLetterHead === "Ya"
    //     ? renderHeader(
    //         companyInformation,
    //         // , [1]
    //       )
    //     : null,
    // footer: renderFooter(),
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: "LEMBAGA KOKO MALAYSIA",
        alignment: "center",
        bold: true,
        fontSize: BASE_FONT_SIZE + 3,
      },
      {
        text: "KOTA KINABALU",
        alignment: "center",
        bold: true,
        fontSize: BASE_FONT_SIZE + 3,
      },
      {
        marginTop: 20,
        layout: {
          ...noBorderTableLayout,
        },
        table: {
          widths: [200, 400, 200],
          body: [
            [
              {
                text: [
                  { text: "Maklumat Harga Mingguan Koko Pada:", bold: true },
                  { text: "\nWeekly Cocoa Price on", italics: true },
                ],
              },
              {
                text: `Week ${params.weekIds[0]}, ${dayjs()
                  .set("month", params.monthIds[0])
                  .set("year", params.yearIds[0])
                  .format("MMMM YYYY")}`,
                bold: true,
                // decoration: "underline",
              },
              {
                text: "OLEH LEMBAGA KOKO MALAYSIA\nAs quoted by Malaysian Cocoa Board",
                bold: true,
                italics: true,
              },
            ],
          ],
        },
      },
      {
        marginTop: 20,
        layout: {
          ...defaultTableLayout,
          paddingTop: () => 3,
          paddingBottom: () => 3,
          paddingLeft: () => 3,
          paddingRight: () => 3,
        },
        table: {
          widths: [110, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
          body: [
            [
              {
                text: ["Pusat", { text: "\nCentre", italics: true }],
                bold: true,
                rowSpan: 3,
                marginTop: 14,
                marginLeft: 2,
              },
              {
                text: [
                  "Biji Koko Basah (Sen/Kg)",
                  { text: "\nWet Cocoa Beans (Cents/Kg)", italics: true },
                ],
                bold: true,
                alignment: "center",
                colSpan: 3,
              },
              "",
              "",
              {
                text: [
                  "Biji Koko Kering (RM/Tan Metrik)",
                  {
                    text: "\nDry Cocoa Beans (RM/Metric Tonne)",
                    italics: true,
                  },
                ],
                bold: true,
                alignment: "center",
                colSpan: 3 * 3,
              },
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
            ],
            [
              "",
              {
                text: ["Tinggi", { text: "\nHigh", italics: true }],
                bold: true,
                alignment: "center",
                rowSpan: 2,
                marginTop: 8,
              },
              {
                text: ["Rendah", { text: "\nLow", italics: true }],
                bold: true,
                alignment: "center",
                rowSpan: 2,
                marginTop: 8,
              },
              {
                text: ["Purata", { text: "\nAverage", italics: true }],
                bold: true,
                alignment: "center",
                rowSpan: 2,
                marginTop: 8,
              },
              {
                text: ["SMC 1"],
                bold: true,
                alignment: "center",
                colSpan: 3,
              },
              "",
              "",
              {
                text: ["SMC 2"],
                bold: true,
                alignment: "center",
                colSpan: 3,
              },
              "",
              "",
              {
                text: ["SMC 3"],
                bold: true,
                alignment: "center",
                colSpan: 3,
              },
              "",
              "",
            ],
            [
              "",
              "",
              "",
              "",
              {
                text: ["Tinggi", { text: "\nHigh", italics: true }],
                bold: true,
                alignment: "center",
              },
              {
                text: ["Rendah", { text: "\nLow", italics: true }],
                bold: true,
                alignment: "center",
              },
              {
                text: ["Purata", { text: "\nAverage", italics: true }],
                bold: true,
                alignment: "center",
              },
              {
                text: ["Tinggi", { text: "\nHigh", italics: true }],
                bold: true,
                alignment: "center",
              },
              {
                text: ["Rendah", { text: "\nLow", italics: true }],
                bold: true,
                alignment: "center",
              },
              {
                text: ["Purata", { text: "\nAverage", italics: true }],
                bold: true,
                alignment: "center",
              },
              {
                text: ["Tinggi", { text: "\nHigh", italics: true }],
                bold: true,
                alignment: "center",
              },
              {
                text: ["Rendah", { text: "\nLow", italics: true }],
                bold: true,
                alignment: "center",
              },
              {
                text: ["Purata", { text: "\nAverage", italics: true }],
                bold: true,
                alignment: "center",
              },
            ],
            ...(() => {
              let table = [];

              const globalStats = {
                wetPrice: {
                  max: "",
                  min: "",
                  average: 0,
                  total: 0,
                  count: 0,
                },
                smc1: {
                  max: "",
                  min: "",
                  average: 0,
                  total: 0,
                  count: 0,
                },
                smc2: {
                  max: "",
                  min: "",
                  average: 0,
                  total: 0,
                  count: 0,
                },
                smc3: {
                  max: "",
                  min: "",
                  average: 0,
                  total: 0,
                  count: 0,
                },
              };

              for (const centre of allCentres) {
                let pricesPerDates = indexedDomesticCocoaPrices.where({
                  centreId: centre._id,
                });
                if (pricesPerDates.length === 0) continue;

                // --------------------------------------------------------------
                // Average Prices Per Month -------------------------------------
                let prices = {};
                for (const price of pricesPerDates) {
                  const groupKey = price.date;
                  if (!groupKey) continue;
                  if (!prices[groupKey]) {
                    prices[groupKey] = {
                      ...price,
                    };
                    for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                      prices[groupKey][key] = 0;
                    }
                  }

                  for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                    if (!price[key]) continue;
                    prices[groupKey][key] += price[key];

                    if (!prices[groupKey]["count" + key]) {
                      prices[groupKey]["count" + key] = 0;
                    }
                    prices[groupKey]["count" + key] += 1;
                  }
                }

                for (const groupKey in prices) {
                  for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                    const count = prices[groupKey]["count" + key];
                    const sum = prices[groupKey][key];
                    prices[groupKey][key] =
                      sum !== 0 && count !== 0 ? Math.round(sum / count) : 0;
                  }
                }
                // console.log({ prices });
                prices = Object.values(prices);
                // --------------------------------------------------------------

                // const prices = indexedDomesticCocoaPrices.where({
                //   centreId: centre._id,
                // });
                // if (prices.length === 0) continue;
                const stats = {
                  wetPrice: {
                    max: "",
                    min: "",
                    average: 0,
                    total: 0,
                    count: 0,
                  },
                  smc1: {
                    max: "",
                    min: "",
                    average: 0,
                    total: 0,
                    count: 0,
                  },
                  smc2: {
                    max: "",
                    min: "",
                    average: 0,
                    total: 0,
                    count: 0,
                  },
                  smc3: {
                    max: "",
                    min: "",
                    average: 0,
                    total: 0,
                    count: 0,
                  },
                };
                for (const price of prices) {
                  for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                    const value = price[key] || 0;
                    if (!value) continue;
                    if (stats[key].max === "" || stats[key].max < value) {
                      stats[key].max = value;
                    }
                    if (stats[key].min === "" || stats[key].min > value) {
                      stats[key].min = value;
                    }
                    stats[key].total += value;
                    stats[key].count += 1;
                  }
                }

                for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                  if (key !== "wetPrice") {
                    const mod = (stats[key].total / stats[key].count) % 1;
                    if (!isNaN(mod)) {
                      stats[key].average =
                        stats[key].total > 0 && stats[key].count > 0
                          ? lodash.round(
                              mod > 0
                                ? stats[key].total / stats[key].count - 0.59
                                : stats[key].total / stats[key].count,
                              0,
                            )
                          : 0;
                    } else {
                      stats[key].average = 0;
                    }
                  } else {
                    stats[key].average =
                      stats[key].total > 0 && stats[key].count > 0
                        ? lodash.round(stats[key].total / stats[key].count, 0)
                        : 0;
                  }

                  if (stats[key].average) {
                    globalStats[key].total += stats[key].average;
                    globalStats[key].count += 1;
                  }
                }
                // console.log(centre.description, prices.length, { stats });

                table.push([
                  {
                    text: centre.description.toUpperCase(),
                    bold: true,
                    // alignment: "center",
                  },
                  //
                  {
                    text: stats["wetPrice"].max
                      ? formatNumber(stats["wetPrice"].max)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: stats["wetPrice"].min
                      ? formatNumber(stats["wetPrice"].min)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: stats["wetPrice"].average
                      ? formatNumber(stats["wetPrice"].average)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  //
                  {
                    text: stats["smc1"].max
                      ? formatNumber(stats["smc1"].max)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: stats["smc1"].min
                      ? formatNumber(stats["smc1"].min)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: stats["smc1"].average
                      ? formatNumber(stats["smc1"].average)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  //
                  {
                    text: stats["smc2"].max
                      ? formatNumber(stats["smc2"].max)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: stats["smc2"].min
                      ? formatNumber(stats["smc2"].min)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: stats["smc2"].average
                      ? formatNumber(stats["smc2"].average)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  //
                  {
                    text: stats["smc3"].max
                      ? formatNumber(stats["smc3"].max)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: stats["smc3"].min
                      ? formatNumber(stats["smc3"].min)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: stats["smc3"].average
                      ? formatNumber(stats["smc3"].average)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                ]);
              }

              for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                globalStats[key].average =
                  globalStats[key].total > 0 && globalStats[key].count > 0
                    ? lodash.round(
                        globalStats[key].total / globalStats[key].count,
                        0,
                      )
                    : 0;
              }
              table.push([
                {
                  text: "Average",
                  bold: true,
                  // alignment: "center",
                },
                //
                {
                  text: " ",
                  // borders: [true, false, true, false],
                  alignment: "center",
                  colSpan: 2,
                },
                {
                  text: " ",
                  // borders: [true, false, true, false],
                  alignment: "center",
                },
                {
                  text: globalStats["wetPrice"].average
                    ? formatNumber(globalStats["wetPrice"].average)
                    : "-",
                  // borders: [true, false, true, false],
                  alignment: "center",
                  bold: true,
                },
                //
                {
                  text: " ",
                  // borders: [true, false, true, false],
                  alignment: "center",
                  colSpan: 2,
                },
                {
                  text: " ",
                  // borders: [true, false, true, false],
                  alignment: "center",
                },
                {
                  text: globalStats["smc1"].average
                    ? formatNumber(globalStats["smc1"].average)
                    : "-",
                  // borders: [true, false, true, false],
                  alignment: "center",
                  bold: true,
                },
                //
                {
                  text: " ",
                  // borders: [true, false, true, false],
                  alignment: "center",
                  colSpan: 2,
                },
                {
                  text: " ",
                  // borders: [true, false, true, false],
                  alignment: "center",
                },
                {
                  text: globalStats["smc2"].average
                    ? formatNumber(globalStats["smc2"].average)
                    : "-",
                  // borders: [true, false, true, false],
                  alignment: "center",
                  bold: true,
                },
                //
                {
                  text: " ",
                  // borders: [true, false, true, false],
                  alignment: "center",
                  colSpan: 2,
                },
                {
                  text: " ",
                  // borders: [true, false, true, false],
                  alignment: "center",
                },
                {
                  text: globalStats["smc3"].average
                    ? formatNumber(globalStats["smc3"].average)
                    : "-",
                  // borders: [true, false, true, false],
                  alignment: "center",
                  bold: true,
                },
              ]);

              return table;
            })(),
          ],
        },
      },
      {
        marginTop: 12,
        text: dayjs().locale("en").format("MM/DD/YYYY"),
        alignment: "right",
      },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Weekly Report - Summary.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateWeeklyAverageReportForDomesticCocoaPrices = async (
  self,
  params,
  context,
) => {
  assertValidSession(context.activeSession);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  const allCentres = await context
    .collection("Centres")
    .find(
      params.centreIds?.length > 0
        ? {
            _id: {
              $in: params.centreIds,
            },
            _deletedAt: {
              $exists: false,
            },
          }
        : {
            _deletedAt: {
              $exists: false,
            },
          },
    )
    .toArray();
  // const indexedCentres = new FlexSearch({
  //   tokenize: "strict",
  //   doc: {
  //     id: "_id",
  //     field: ["code"],
  //   },
  // });
  // indexedCentres.add(allCentres);

  let query = {
    $or: [],
  };
  for (const year of params.yearIds) {
    if (params.monthIds.length === 0) {
      query.$or.push({
        date: {
          $gte: dayjs().set("year", year).startOf("year").format("YYYY-MM-DD"),
          $lte: dayjs().set("year", year).endOf("year").format("YYYY-MM-DD"),
        },
      });
    } else {
      for (const month of params.monthIds) {
        query.$or.push({
          date: {
            $gte: dayjs()
              .set("year", year)
              .set("month", month)
              .startOf("month")
              .format("YYYY-MM-DD"),
            $lte: dayjs()
              .set("year", year)
              .set("month", month)
              .endOf("month")
              .format("YYYY-MM-DD"),
          },
        });
      }
    }
  }
  if (params.centreIds?.length > 0) {
    query.centreId = {
      $in: params.centreIds,
    };
  }
  if (query.$or.length === 0) {
    delete query.$or;
  }
  // console.log(JSON.stringify({ params, query }, null, 4));
  await context.collection("DomesticCocoaPrices").createIndex({
    date: 1,
  });
  const allDomesticCocoaPrices = await context
    .collection("DomesticCocoaPrices")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  const indexedDomesticCocoaPrices = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["centreId", "date"],
    },
  });
  indexedDomesticCocoaPrices.add(allDomesticCocoaPrices);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 11;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    pageOrientation: "landscape",
    // header:
    //   metadata.letter.useLetterHead === "Ya"
    //     ? renderHeader(
    //         companyInformation,
    //         // , [1]
    //       )
    //     : null,
    // footer: renderFooter(),
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: `WEEKLY AVERAGE PRICES`,
        // text: `WEEKLY AVERAGE PRICES FOR ${(
        //   allCentres[0]?.description || ""
        // ).toUpperCase()} IN ${dayjs()
        //   .set("month", params.monthIds[0])
        //   .set("year", params.yearIds[0])
        //   .format("MMMM YYYY")
        //   .toUpperCase()}`,
        // alignment: "center",
        bold: true,
        fontSize: BASE_FONT_SIZE + 3,
      },
      {
        marginTop: 20,
        layout: {
          ...noBorderTableLayout,
        },
        table: {
          widths: [60, 200],
          body: [
            [
              {
                text: "Year",
                bold: true,
              },
              {
                text: `: ${params.yearIds[0]}`,
                // bold: true,
              },
            ],
            [
              {
                text: "Month",
                bold: true,
              },
              {
                text: `: ${dayjs()
                  .set("month", params.monthIds[0])
                  .locale("en")
                  .format("MMMM")}`,
                // bold: true,
              },
            ],
            [
              {
                text: "Centre",
                bold: true,
              },
              {
                text: `: ${allCentres[0]?.description}`,
                // bold: true,
              },
            ],
          ],
        },
      },
      {
        marginTop: 20,
        layout: {
          ...defaultTableLayout,
          paddingTop: () => 3,
          paddingBottom: () => 3,
          paddingLeft: () => 3,
          paddingRight: () => 3,
        },
        table: {
          widths: [110, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50],
          body: [
            [
              {
                text: "Weekly",
                italics: true,
                bold: true,
                rowSpan: 3,
                marginTop: 14,
                marginLeft: 10,
              },
              {
                text: [
                  "Biji Koko Basah (Sen/Kg)",
                  { text: "\nWet Cocoa Beans (Cents/Kg)", italics: true },
                ],
                bold: true,
                alignment: "center",
                colSpan: 3,
              },
              "",
              "",
              {
                text: [
                  "Biji Koko Kering (RM/Tan Metrik)",
                  {
                    text: "\nDry Cocoa Beans (RM/Metric Tonne)",
                    italics: true,
                  },
                ],
                bold: true,
                alignment: "center",
                colSpan: 3 * 3,
              },
              "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
            ],
            [
              "",
              {
                text: ["Tinggi", { text: "\nHigh", italics: true }],
                bold: true,
                alignment: "center",
                rowSpan: 2,
                marginTop: 8,
              },
              {
                text: ["Rendah", { text: "\nLow", italics: true }],
                bold: true,
                alignment: "center",
                rowSpan: 2,
                marginTop: 8,
              },
              {
                text: ["Purata", { text: "\nAverage", italics: true }],
                bold: true,
                alignment: "center",
                rowSpan: 2,
                marginTop: 8,
              },
              {
                text: ["SMC 1"],
                bold: true,
                alignment: "center",
                colSpan: 3,
              },
              "",
              "",
              {
                text: ["SMC 2"],
                bold: true,
                alignment: "center",
                colSpan: 3,
              },
              "",
              "",
              {
                text: ["SMC 3"],
                bold: true,
                alignment: "center",
                colSpan: 3,
              },
              "",
              "",
            ],
            [
              "",
              "",
              "",
              "",
              {
                text: ["Tinggi", { text: "\nHigh", italics: true }],
                bold: true,
                alignment: "center",
              },
              {
                text: ["Rendah", { text: "\nLow", italics: true }],
                bold: true,
                alignment: "center",
              },
              {
                text: ["Purata", { text: "\nAverage", italics: true }],
                bold: true,
                alignment: "center",
              },
              {
                text: ["Tinggi", { text: "\nHigh", italics: true }],
                bold: true,
                alignment: "center",
              },
              {
                text: ["Rendah", { text: "\nLow", italics: true }],
                bold: true,
                alignment: "center",
              },
              {
                text: ["Purata", { text: "\nAverage", italics: true }],
                bold: true,
                alignment: "center",
              },
              {
                text: ["Tinggi", { text: "\nHigh", italics: true }],
                bold: true,
                alignment: "center",
              },
              {
                text: ["Rendah", { text: "\nLow", italics: true }],
                bold: true,
                alignment: "center",
              },
              {
                text: ["Purata", { text: "\nAverage", italics: true }],
                bold: true,
                alignment: "center",
              },
            ],
            ...(() => {
              let table = [];

              let averageStats = {
                wetPrice: {
                  max: "",
                  min: "",
                  average: 0,
                  total: 0,
                  count: 0,
                  countDayOfWeek: 0,
                },
                smc1: {
                  max: "",
                  min: "",
                  average: 0,
                  total: 0,
                  count: 0,
                  countDayOfWeek: 0,
                },
                smc2: {
                  max: "",
                  min: "",
                  average: 0,
                  total: 0,
                  count: 0,
                  countDayOfWeek: 0,
                },
                smc3: {
                  max: "",
                  min: "",
                  average: 0,
                  total: 0,
                  count: 0,
                  countDayOfWeek: 0,
                },
              };

              let globalStats = {
                wetPrice: {
                  max: "",
                  min: "",
                  average: 0,
                  total: 0,
                  count: 0,
                  countDayOfWeek: 0,
                },
                smc1: {
                  max: "",
                  min: "",
                  average: 0,
                  total: 0,
                  count: 0,
                  countDayOfWeek: 0,
                },
                smc2: {
                  max: "",
                  min: "",
                  average: 0,
                  total: 0,
                  count: 0,
                  countDayOfWeek: 0,
                },
                smc3: {
                  max: "",
                  min: "",
                  average: 0,
                  total: 0,
                  count: 0,
                  countDayOfWeek: 0,
                },
              };

              const endDateOfMonth = dayjs()
                .set("month", params.monthIds[0])
                .set("year", params.yearIds[0])
                .endOf("month");
              let currentDate = dayjs()
                .set("month", params.monthIds[0])
                .set("year", params.yearIds[0])
                .startOf("month");
              let startingWeekOffset = currentDate.week();
              let startingWeekIndex = startingWeekOffset;
              // let startingWeekDate = currentDate.startOf("week");
              // console.log(
              //   currentDate.format("DD/MM/YYYY"),
              //   startingWeekDate.format("DD/MM/YYYY"),
              //   startingWeekIndex,
              // );

              do {
                let pricesPerDates = indexedDomesticCocoaPrices.where({
                  // centreId: allCentres[0]._id,
                  date: currentDate.format("YYYY-MM-DD"),
                });
                // if (pricesPerDates.length === 0) continue;

                // --------------------------------------------------------------
                // Average Prices Per Month -------------------------------------
                let prices = {};
                for (const price of pricesPerDates) {
                  // const groupKey = price.date.split("-")?.[1] || "";
                  const groupKey = price.date;
                  // console.log("date", price.date, groupKey);
                  if (!groupKey) continue;
                  if (!prices[groupKey]) {
                    prices[groupKey] = {
                      ...price,
                    };
                    for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                      prices[groupKey][key] = 0;
                    }
                  }

                  for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                    if (!price[key]) continue;
                    prices[groupKey][key] += price[key];

                    if (!prices[groupKey]["count" + key]) {
                      prices[groupKey]["count" + key] = 0;
                    }
                    prices[groupKey]["count" + key] += 1;
                  }
                }

                for (const groupKey in prices) {
                  for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                    const count = prices[groupKey]["count" + key];
                    const sum = prices[groupKey][key];
                    prices[groupKey][key] =
                      sum !== 0 && count !== 0 ? Math.round(sum / count) : 0;
                  }
                }
                // console.log({ prices });
                prices = Object.values(prices);
                // --------------------------------------------------------------

                // const prices = indexedDomesticCocoaPrices.where({
                //   date: currentDate.format("YYYY-MM-DD"),
                // });
                // if (prices.length === 0) {
                //   currentDate = currentDate.add(1, "day");
                //   continue;
                // }

                if (currentDate.week() !== startingWeekIndex) {
                  startingWeekIndex = currentDate.week();
                  // if (startingWeekIndex < startingWeekOffset) {
                  //   startingWeekIndex = 52 + startingWeekIndex;
                  // }

                  // console.log(
                  //   currentDate.format("DD/MM/YYYY"),
                  //   currentDate.week(),
                  //   startingWeekIndex,
                  //   startingWeekOffset,
                  // );

                  for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                    if (key !== "wetPrice") {
                      const mod =
                        (globalStats[key].total / globalStats[key].count) % 1;

                      if (!isNaN(mod)) {
                        globalStats[key].average =
                          globalStats[key].total > 0 &&
                          globalStats[key].count > 0
                            ? lodash.round(
                                mod > 0
                                  ? globalStats[key].total /
                                      globalStats[key].count -
                                      0.59
                                  : globalStats[key].total /
                                      globalStats[key].count,
                                0,
                              )
                            : 0;
                      } else {
                        globalStats[key].average = 0;
                      }
                    } else {
                      globalStats[key].average =
                        globalStats[key].total > 0 && globalStats[key].count > 0
                          ? lodash.round(
                              globalStats[key].total / globalStats[key].count,
                              0,
                            )
                          : 0;
                    }
                  }

                  table.push([
                    {
                      text: `Week ${
                        startingWeekIndex < startingWeekOffset
                          ? startingWeekIndex + 52 - startingWeekOffset
                          : startingWeekIndex - startingWeekOffset
                      }`,
                      bold: true,
                      // alignment: "center",
                      marginLeft: 10,
                      fillColor: "#f0f0f0",
                    },
                    //
                    {
                      text: globalStats["wetPrice"].max
                        ? formatNumber(globalStats["wetPrice"].max)
                        : "-",
                      bold: true,
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    {
                      text: globalStats["wetPrice"].min
                        ? formatNumber(globalStats["wetPrice"].min)
                        : "-",
                      bold: true,
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    {
                      text: globalStats["wetPrice"].average
                        ? formatNumber(globalStats["wetPrice"].average)
                        : "-",
                      bold: true,
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    //
                    {
                      text: globalStats["smc1"].max
                        ? formatNumber(globalStats["smc1"].max)
                        : "-",
                      bold: true,
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    {
                      text: globalStats["smc1"].min
                        ? formatNumber(globalStats["smc1"].min)
                        : "-",
                      bold: true,
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    {
                      text: globalStats["smc1"].average
                        ? formatNumber(globalStats["smc1"].average)
                        : "-",
                      bold: true,
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    //
                    {
                      text: globalStats["smc2"].max
                        ? formatNumber(globalStats["smc2"].max)
                        : "-",
                      bold: true,
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    {
                      text: globalStats["smc2"].min
                        ? formatNumber(globalStats["smc2"].min)
                        : "-",
                      bold: true,
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    {
                      text: globalStats["smc2"].average
                        ? formatNumber(globalStats["smc2"].average)
                        : "-",
                      bold: true,
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    //
                    {
                      text: globalStats["smc3"].max
                        ? formatNumber(globalStats["smc3"].max)
                        : "-",
                      bold: true,
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    {
                      text: globalStats["smc3"].min
                        ? formatNumber(globalStats["smc3"].min)
                        : "-",
                      bold: true,
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    {
                      text: globalStats["smc3"].average
                        ? formatNumber(globalStats["smc3"].average)
                        : "-",
                      bold: true,
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                  ]);

                  globalStats = {
                    wetPrice: {
                      max: "",
                      min: "",
                      average: 0,
                      total: 0,
                      count: 0,
                      countDayOfWeek: 0,
                    },
                    smc1: {
                      max: "",
                      min: "",
                      average: 0,
                      total: 0,
                      count: 0,
                      countDayOfWeek: 0,
                    },
                    smc2: {
                      max: "",
                      min: "",
                      average: 0,
                      total: 0,
                      count: 0,
                      countDayOfWeek: 0,
                    },
                    smc3: {
                      max: "",
                      min: "",
                      average: 0,
                      total: 0,
                      count: 0,
                      countDayOfWeek: 0,
                    },
                  };
                }

                const stats = {
                  wetPrice: {
                    max: "",
                    min: "",
                    average: 0,
                    total: 0,
                    count: 0,
                  },
                  smc1: {
                    max: "",
                    min: "",
                    average: 0,
                    total: 0,
                    count: 0,
                  },
                  smc2: {
                    max: "",
                    min: "",
                    average: 0,
                    total: 0,
                    count: 0,
                  },
                  smc3: {
                    max: "",
                    min: "",
                    average: 0,
                    total: 0,
                    count: 0,
                  },
                };
                for (const price of prices) {
                  for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                    const value = price[key] || 0;
                    if (!value) continue;
                    if (stats[key].max === "" || stats[key].max < value) {
                      stats[key].max = value;
                    }
                    if (stats[key].min === "" || stats[key].min > value) {
                      stats[key].min = value;
                    }
                    stats[key].total += value;
                    stats[key].count += 1;
                  }
                }

                for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                  stats[key].average =
                    stats[key].total > 0 && stats[key].count > 0
                      ? lodash.round(stats[key].total / stats[key].count, 0)
                      : 0;

                  if (
                    globalStats[key].max === "" ||
                    globalStats[key].max < stats[key].max
                  ) {
                    globalStats[key].max = stats[key].max;
                  }
                  if (
                    globalStats[key].min === "" ||
                    globalStats[key].min > stats[key].min
                  ) {
                    if (stats[key].min > 0) {
                      globalStats[key].min = stats[key].min;
                    }
                  }
                  if (stats[key].average) {
                    globalStats[key].total += stats[key].average;
                    globalStats[key].count += 1;
                  }
                  globalStats[key].countDayOfWeek += 1;

                  if (
                    averageStats[key].max === "" ||
                    averageStats[key].max < stats[key].max
                  ) {
                    averageStats[key].max = stats[key].max;
                  }
                  if (
                    averageStats[key].min === "" ||
                    averageStats[key].min > stats[key].min
                  ) {
                    if (stats[key].min > 0) {
                      averageStats[key].min = stats[key].min;
                    }
                  }
                  if (stats[key].average) {
                    averageStats[key].total += stats[key].average;
                    averageStats[key].count += 1;
                  }
                  averageStats[key].countDayOfWeek += 1;
                }
                // console.log(currentDate.format("YYYY-MM-DD"), prices.length, {
                //   stats,
                // });

                table.push([
                  {
                    text: currentDate.format("DD/MM/YYYY"),
                    // bold: true,
                    // alignment: "center",
                    marginLeft: 10,
                  },
                  //
                  {
                    text: stats["wetPrice"].max
                      ? formatNumber(stats["wetPrice"].max)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: stats["wetPrice"].min
                      ? formatNumber(stats["wetPrice"].min)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: stats["wetPrice"].average
                      ? formatNumber(stats["wetPrice"].average)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  //
                  {
                    text: stats["smc1"].max
                      ? formatNumber(stats["smc1"].max)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: stats["smc1"].min
                      ? formatNumber(stats["smc1"].min)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: stats["smc1"].average
                      ? formatNumber(stats["smc1"].average)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  //
                  {
                    text: stats["smc2"].max
                      ? formatNumber(stats["smc2"].max)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: stats["smc2"].min
                      ? formatNumber(stats["smc2"].min)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: stats["smc2"].average
                      ? formatNumber(stats["smc2"].average)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  //
                  {
                    text: stats["smc3"].max
                      ? formatNumber(stats["smc3"].max)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: stats["smc3"].min
                      ? formatNumber(stats["smc3"].min)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: stats["smc3"].average
                      ? formatNumber(stats["smc3"].average)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                ]);

                currentDate = currentDate.add(1, "day");
              } while (!currentDate.isAfter(endDateOfMonth));

              if (globalStats["wetPrice"].countDayOfWeek > 0) {
                startingWeekIndex = currentDate.week();
                if (startingWeekIndex < startingWeekOffset) {
                  startingWeekIndex = 52 + startingWeekIndex + 1;
                } else {
                  startingWeekIndex += 1;
                }
                // console.log(
                //   currentDate.format("DD/MM/YYYY"),
                //   startingWeekIndex,
                //   startingWeekOffset,
                // );

                for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                  globalStats[key].average =
                    globalStats[key].total > 0 && globalStats[key].count > 0
                      ? lodash.round(
                          globalStats[key].total / globalStats[key].count,
                          0,
                        )
                      : 0;
                }

                table.push([
                  {
                    text: `Week ${startingWeekIndex - startingWeekOffset}`,
                    bold: true,
                    // alignment: "center",
                    marginLeft: 10,
                    fillColor: "#f0f0f0",
                  },
                  //
                  {
                    text: globalStats["wetPrice"].max
                      ? formatNumber(globalStats["wetPrice"].max)
                      : "-",
                    bold: true,
                    alignment: "center",
                    fillColor: "#f0f0f0",
                  },
                  {
                    text: globalStats["wetPrice"].min
                      ? formatNumber(globalStats["wetPrice"].min)
                      : "-",
                    bold: true,
                    alignment: "center",
                    fillColor: "#f0f0f0",
                  },
                  {
                    text: globalStats["wetPrice"].average
                      ? formatNumber(globalStats["wetPrice"].average)
                      : "-",
                    bold: true,
                    alignment: "center",
                    fillColor: "#f0f0f0",
                  },
                  //
                  {
                    text: globalStats["smc1"].max
                      ? formatNumber(globalStats["smc1"].max)
                      : "-",
                    bold: true,
                    alignment: "center",
                    fillColor: "#f0f0f0",
                  },
                  {
                    text: globalStats["smc1"].min
                      ? formatNumber(globalStats["smc1"].min)
                      : "-",
                    bold: true,
                    alignment: "center",
                    fillColor: "#f0f0f0",
                  },
                  {
                    text: globalStats["smc1"].average
                      ? formatNumber(globalStats["smc1"].average)
                      : "-",
                    bold: true,
                    alignment: "center",
                    fillColor: "#f0f0f0",
                  },
                  //
                  {
                    text: globalStats["smc2"].max
                      ? formatNumber(globalStats["smc2"].max)
                      : "-",
                    bold: true,
                    alignment: "center",
                    fillColor: "#f0f0f0",
                  },
                  {
                    text: globalStats["smc2"].min
                      ? formatNumber(globalStats["smc2"].min)
                      : "-",
                    bold: true,
                    alignment: "center",
                    fillColor: "#f0f0f0",
                  },
                  {
                    text: globalStats["smc2"].average
                      ? formatNumber(globalStats["smc2"].average)
                      : "-",
                    bold: true,
                    alignment: "center",
                    fillColor: "#f0f0f0",
                  },
                  //
                  {
                    text: globalStats["smc3"].max
                      ? formatNumber(globalStats["smc3"].max)
                      : "-",
                    bold: true,
                    alignment: "center",
                    fillColor: "#f0f0f0",
                  },
                  {
                    text: globalStats["smc3"].min
                      ? formatNumber(globalStats["smc3"].min)
                      : "-",
                    bold: true,
                    alignment: "center",
                    fillColor: "#f0f0f0",
                  },
                  {
                    text: globalStats["smc3"].average
                      ? formatNumber(globalStats["smc3"].average)
                      : "-",
                    bold: true,
                    alignment: "center",
                    fillColor: "#f0f0f0",
                  },
                ]);

                globalStats = {
                  wetPrice: {
                    max: "",
                    min: "",
                    average: 0,
                    total: 0,
                    count: 0,
                    countDayOfWeek: 0,
                  },
                  smc1: {
                    max: "",
                    min: "",
                    average: 0,
                    total: 0,
                    count: 0,
                    countDayOfWeek: 0,
                  },
                  smc2: {
                    max: "",
                    min: "",
                    average: 0,
                    total: 0,
                    count: 0,
                    countDayOfWeek: 0,
                  },
                  smc3: {
                    max: "",
                    min: "",
                    average: 0,
                    total: 0,
                    count: 0,
                    countDayOfWeek: 0,
                  },
                };
              }

              for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                averageStats[key].average =
                  averageStats[key].total > 0 && averageStats[key].count > 0
                    ? lodash.round(
                        averageStats[key].total / averageStats[key].count,
                        0,
                      )
                    : 0;
              }
              table.push([
                {
                  text: `Average`,
                  bold: true,
                  // alignment: "center",
                  marginLeft: 10,
                  fillColor: "#f0f0f0",
                },
                //
                {
                  text: averageStats["wetPrice"].max
                    ? formatNumber(averageStats["wetPrice"].max)
                    : "-",
                  bold: true,
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                {
                  text: averageStats["wetPrice"].min
                    ? formatNumber(averageStats["wetPrice"].min)
                    : "-",
                  bold: true,
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                {
                  text: averageStats["wetPrice"].average
                    ? formatNumber(averageStats["wetPrice"].average)
                    : "-",
                  bold: true,
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                //
                {
                  text: averageStats["smc1"].max
                    ? formatNumber(averageStats["smc1"].max)
                    : "-",
                  bold: true,
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                {
                  text: averageStats["smc1"].min
                    ? formatNumber(averageStats["smc1"].min)
                    : "-",
                  bold: true,
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                {
                  text: averageStats["smc1"].average
                    ? formatNumber(averageStats["smc1"].average)
                    : "-",
                  bold: true,
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                //
                {
                  text: averageStats["smc2"].max
                    ? formatNumber(averageStats["smc2"].max)
                    : "-",
                  bold: true,
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                {
                  text: averageStats["smc2"].min
                    ? formatNumber(averageStats["smc2"].min)
                    : "-",
                  bold: true,
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                {
                  text: averageStats["smc2"].average
                    ? formatNumber(averageStats["smc2"].average)
                    : "-",
                  bold: true,
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                //
                {
                  text: averageStats["smc3"].max
                    ? formatNumber(averageStats["smc3"].max)
                    : "-",
                  bold: true,
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                {
                  text: averageStats["smc3"].min
                    ? formatNumber(averageStats["smc3"].min)
                    : "-",
                  bold: true,
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                {
                  text: averageStats["smc3"].average
                    ? formatNumber(averageStats["smc3"].average)
                    : "-",
                  bold: true,
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
              ]);

              return table;
            })(),
          ],
        },
      },
      {
        marginTop: 12,
        text: dayjs().locale("en").format("MM/DD/YYYY"),
        alignment: "right",
      },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Weekly Report - Average.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateWeeklyCocoaPriceReportForDomesticCocoaPrices = async (
  self,
  params,
  context,
) => {
  assertValidSession(context.activeSession);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  let allCentres = await context
    .collection("Centres")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // const indexedCentres = new FlexSearch({
  //   tokenize: "strict",
  //   doc: {
  //     id: "_id",
  //     field: ["code"],
  //   },
  // });
  // indexedCentres.add(allCentres);

  let query = {
    $or: [],
  };
  for (const year of params.yearIds) {
    if (params.monthIds.length === 0) {
      query.$or.push({
        date: {
          $gte: dayjs().set("year", year).startOf("year").format("YYYY-MM-DD"),
          $lte: dayjs().set("year", year).endOf("year").format("YYYY-MM-DD"),
        },
      });
    } else {
      for (const month of params.monthIds) {
        query.$or.push({
          date: {
            $gte: dayjs()
              .set("year", year)
              .set("month", month)
              .startOf("month")
              .format("YYYY-MM-DD"),
            $lte: dayjs()
              .set("year", year)
              .set("month", month)
              .endOf("month")
              .format("YYYY-MM-DD"),
          },
        });
      }
    }
  }
  if (query.$or.length === 0) {
    delete query.$or;
  }
  // console.log(JSON.stringify({ params, query }, null, 4));
  await context.collection("DomesticCocoaPrices").createIndex({
    date: 1,
  });
  const allDomesticCocoaPrices = await context
    .collection("DomesticCocoaPrices")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  const indexedDomesticCocoaPrices = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["centreId", "date"],
    },
  });
  indexedDomesticCocoaPrices.add(allDomesticCocoaPrices);

  allCentres = allCentres.filter(centre => {
    const prices = indexedDomesticCocoaPrices.where({
      centreId: centre._id,
    });
    return prices.length > 0;
  });

  // ###########################################################################################
  // ###########################################################################################

  const GRADE_CODES = {
    "Wet Cocoa Beans": "wetPrice",
    "SMC 1": "smc1",
    "SMC 2": "smc2",
    "SMC 3": "smc3",
  };

  const BASE_FONT_SIZE = 11;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    pageOrientation: "landscape",
    // header:
    //   metadata.letter.useLetterHead === "Ya"
    //     ? renderHeader(
    //         companyInformation,
    //         // , [1]
    //       )
    //     : null,
    // footer: renderFooter(),
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: `WEEKLY COCOA PRICES`,
        // text: `WEEKLY COCOA PRICES FOR ${(
        //   allCentres[0]?.description || ""
        // ).toUpperCase()} IN ${dayjs()
        //   .set("month", params.monthIds[0])
        //   .set("year", params.yearIds[0])
        //   .format("MMMM YYYY")
        //   .toUpperCase()}`,
        // alignment: "center",
        bold: true,
        fontSize: BASE_FONT_SIZE + 3,
      },
      {
        marginTop: 20,
        layout: {
          ...noBorderTableLayout,
        },
        table: {
          widths: [60, 200],
          body: [
            [
              {
                text: "Year",
                bold: true,
              },
              {
                text: `: ${params.yearIds[0]}`,
                // bold: true,
              },
            ],
            [
              {
                text: "Month",
                bold: true,
              },
              {
                text: `: ${dayjs()
                  .set("month", params.monthIds[0])
                  .locale("en")
                  .format("MMMM")}`,
                // bold: true,
              },
            ],
            [
              {
                text: "Grade",
                bold: true,
              },
              {
                text: `: ${params.gradeIds[0]} (${
                  params.gradeIds[0] === "Wet Cocoa Beans"
                    ? "Cent/Kg"
                    : "RM/Metric Tonne"
                })`,
                // bold: true,
              },
            ],
          ],
        },
      },
      {
        marginTop: 20,
        layout: {
          ...defaultTableLayout,
          paddingTop: () => 3,
          paddingBottom: () => 3,
          paddingLeft: () => 3,
          paddingRight: () => 3,
        },
        table: {
          widths: [80, ...allCentres.map(centre => 44), 44],
          body: [
            [
              {
                text: "Weekly",
                italics: true,
                bold: true,
                // marginTop: 7,
                marginLeft: 4,
              },
              ...allCentres.map(centre => {
                return {
                  text: centre.description,
                  bold: true,
                  alignment: "center",
                  // marginTop: 14,
                };
              }),
              {
                text: "Average",
                bold: true,
                alignment: "center",
                // marginTop: 7,
              },
            ],
            ...(() => {
              let table = [];

              let averageTotal = {},
                averageCount = {};
              let globalTotal = {},
                globalCount = {};

              const endDateOfMonth = dayjs()
                .set("month", params.monthIds[0])
                .set("year", params.yearIds[0])
                .endOf("month");
              let currentDate = dayjs()
                .set("month", params.monthIds[0])
                .set("year", params.yearIds[0])
                .startOf("month");
              let startingWeekOffset = currentDate.week();
              let startingWeekIndex = startingWeekOffset;

              // let startingWeekDate = currentDate.startOf("week");
              // console.log(
              //   currentDate.format("DD/MM/YYYY"),
              //   startingWeekDate.format("DD/MM/YYYY"),
              //   startingWeekIndex,
              // );
              const statCode = GRADE_CODES[params.gradeIds[0]];
              do {
                // const prices = indexedDomesticCocoaPrices.where({
                //   date: currentDate.format("YYYY-MM-DD"),
                // });

                if (currentDate.week() !== startingWeekIndex) {
                  startingWeekIndex = currentDate.week();
                  // if (startingWeekIndex < startingWeekOffset) {
                  //   startingWeekIndex = 52 + startingWeekIndex + 1;
                  // }

                  table.push([
                    {
                      text: `Week ${
                        startingWeekIndex < startingWeekOffset
                          ? startingWeekIndex + 52 - startingWeekOffset
                          : startingWeekIndex - startingWeekOffset
                      }`,
                      bold: true,
                      // alignment: "center",
                      marginLeft: 4,
                      fillColor: "#f0f0f0",
                    },
                    //
                    ...allCentres.map(centre => {
                      let average = 0;
                      if (
                        globalTotal[centre._id] > 0 &&
                        globalCount[centre._id] > 0
                      ) {
                        average = lodash.round(
                          globalTotal[centre._id] / globalCount[centre._id],
                          0,
                        );
                      }

                      return {
                        text: average ? formatNumber(average) : "-",
                        bold: true,
                        alignment: "center",
                        // marginTop: 14,
                        fillColor: "#f0f0f0",
                      };
                    }),
                    {
                      text: (() => {
                        let average = 0;
                        if (
                          globalTotal["AVERAGE"] > 0 &&
                          globalCount["AVERAGE"] > 0
                        ) {
                          average = lodash.round(
                            globalTotal["AVERAGE"] / globalCount["AVERAGE"],
                            0,
                          );
                        }
                        return average ? formatNumber(average) : "-";
                      })(),
                      bold: true,
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                  ]);

                  globalTotal = {};
                  globalCount = {};
                }

                let total = 0,
                  count = 0;
                table.push([
                  {
                    text: currentDate.format("DD/MM/YYYY"),
                    // bold: true,
                    // alignment: "center",
                    marginLeft: 4,
                  },
                  //
                  ...allCentres.map(centre => {
                    // const prices = indexedDomesticCocoaPrices.where({
                    //   date: currentDate.format("YYYY-MM-DD"),
                    //   centreId: centre._id,
                    // });

                    let pricesPerDates = indexedDomesticCocoaPrices.where({
                      date: currentDate.format("YYYY-MM-DD"),
                      centreId: centre._id,
                    });
                    // if (pricesPerDates.length === 0) continue;

                    // --------------------------------------------------------------
                    // Average Prices Per Month -------------------------------------
                    let prices = {};
                    for (const price of pricesPerDates) {
                      // const groupKey = price.date.split("-")?.[1] || "";
                      const groupKey = price.date;
                      // console.log("date", price.date, groupKey);
                      if (!groupKey) continue;
                      if (!prices[groupKey]) {
                        prices[groupKey] = {
                          ...price,
                        };
                        for (const key of [
                          "wetPrice",
                          "smc1",
                          "smc2",
                          "smc3",
                        ]) {
                          prices[groupKey][key] = 0;
                        }
                      }

                      for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                        if (!price[key]) continue;
                        prices[groupKey][key] += price[key];

                        if (!prices[groupKey]["count" + key]) {
                          prices[groupKey]["count" + key] = 0;
                        }
                        prices[groupKey]["count" + key] += 1;
                      }
                    }

                    for (const groupKey in prices) {
                      for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                        const count = prices[groupKey]["count" + key];
                        const sum = prices[groupKey][key];
                        prices[groupKey][key] =
                          sum !== 0 && count !== 0
                            ? Math.round(sum / count)
                            : 0;
                      }
                    }
                    // console.log({ prices });
                    prices = Object.values(prices);
                    // --------------------------------------------------------------

                    const stats = {
                      [statCode]: {
                        max: "",
                        min: "",
                        average: 0,
                        total: 0,
                        count: 0,
                      },
                    };
                    for (const price of prices) {
                      const value = price[statCode] || 0;
                      stats[statCode].total += value;
                      stats[statCode].count += 1;
                    }

                    if (statCode !== "wetPrice") {
                      stats[statCode].average =
                        stats[statCode].total > 0 && stats[statCode].count > 0
                          ? lodash.round(
                              stats[statCode].total / stats[statCode].count,
                              0,
                            )
                          : 0;
                    } else {
                      stats[statCode].average =
                        stats[statCode].total > 0 && stats[statCode].count > 0
                          ? lodash.round(
                              stats[statCode].total / stats[statCode].count,
                              0,
                            )
                          : 0;
                    }

                    // console.log(currentDate.format("YYYY-MM-DD"), prices.length, {
                    //   stats,
                    // });

                    if (stats[statCode].average) {
                      total += stats[statCode].average;
                      count += 1;

                      if (!globalTotal[centre._id]) {
                        globalTotal[centre._id] = 0;
                      }
                      globalTotal[centre._id] += stats[statCode].average;
                      if (!globalCount[centre._id]) {
                        globalCount[centre._id] = 0;
                      }
                      globalCount[centre._id] += 1;

                      if (!averageTotal[centre._id]) {
                        averageTotal[centre._id] = 0;
                      }
                      averageTotal[centre._id] += stats[statCode].average;
                      if (!averageCount[centre._id]) {
                        averageCount[centre._id] = 0;
                      }
                      averageCount[centre._id] += 1;
                    }
                    return {
                      text: stats[statCode].average
                        ? formatNumber(stats[statCode].average)
                        : "-",
                      // borders: [true, false, true, false],
                      alignment: "center",
                    };
                  }),
                  //
                  {
                    text: (() => {
                      if (total > 0 && count > 0) {
                        const average = lodash.round(total / count, 0);

                        if (!globalTotal["AVERAGE"]) {
                          globalTotal["AVERAGE"] = 0;
                        }
                        globalTotal["AVERAGE"] += average;
                        if (!globalCount["AVERAGE"]) {
                          globalCount["AVERAGE"] = 0;
                        }
                        globalCount["AVERAGE"] += 1;

                        if (!averageTotal["AVERAGE"]) {
                          averageTotal["AVERAGE"] = 0;
                        }
                        averageTotal["AVERAGE"] += average;
                        if (!averageCount["AVERAGE"]) {
                          averageCount["AVERAGE"] = 0;
                        }
                        averageCount["AVERAGE"] += 1;

                        return average ? formatNumber(average) : "-";
                      }

                      return "-";
                    })(),
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                ]);

                currentDate = currentDate.add(1, "day");
              } while (!currentDate.isAfter(endDateOfMonth));

              // console.log({
              //   globalCount,
              //   globalTotal,
              // });
              if (Object.keys(globalCount).length > 0) {
                startingWeekIndex = currentDate.week();
                if (startingWeekIndex < startingWeekOffset) {
                  startingWeekIndex = 52 + startingWeekIndex + 1;
                } else {
                  startingWeekIndex += 1;
                }

                table.push([
                  {
                    text: `Week ${startingWeekIndex - startingWeekOffset}`,
                    bold: true,
                    // alignment: "center",
                    marginLeft: 4,
                    fillColor: "#f0f0f0",
                  },
                  //
                  ...allCentres.map(centre => {
                    let average = 0;
                    if (
                      globalTotal[centre._id] > 0 &&
                      globalCount[centre._id] > 0
                    ) {
                      average = lodash.round(
                        globalTotal[centre._id] / globalCount[centre._id],
                        0,
                      );
                    }

                    return {
                      text: average ? formatNumber(average) : "-",
                      bold: true,
                      alignment: "center",
                      // marginTop: 14,
                      fillColor: "#f0f0f0",
                    };
                  }),
                  {
                    text: (() => {
                      let average = 0;
                      if (
                        globalTotal["AVERAGE"] > 0 &&
                        globalCount["AVERAGE"] > 0
                      ) {
                        average = lodash.round(
                          globalTotal["AVERAGE"] / globalCount["AVERAGE"],
                          0,
                        );
                      }
                      return average ? formatNumber(average) : "-";
                    })(),
                    bold: true,
                    alignment: "center",
                    fillColor: "#f0f0f0",
                  },
                ]);

                globalTotal = {};
                globalCount = {};
              }

              table.push([
                {
                  text: `Average`,
                  bold: true,
                  // alignment: "center",
                  marginLeft: 4,
                  fillColor: "#f0f0f0",
                },
                //
                ...allCentres.map(centre => {
                  let average = 0;
                  if (
                    averageTotal[centre._id] > 0 &&
                    averageCount[centre._id] > 0
                  ) {
                    average = lodash.round(
                      averageTotal[centre._id] / averageCount[centre._id],
                      0,
                    );
                  }

                  return {
                    text: average ? formatNumber(average) : "-",
                    bold: true,
                    alignment: "center",
                    // marginTop: 14,
                    fillColor: "#f0f0f0",
                  };
                }),
                {
                  text: (() => {
                    let average = 0;
                    if (
                      averageTotal["AVERAGE"] > 0 &&
                      averageCount["AVERAGE"] > 0
                    ) {
                      average = lodash.round(
                        averageTotal["AVERAGE"] / averageCount["AVERAGE"],
                        0,
                      );
                    }
                    return average ? formatNumber(average) : "-";
                  })(),
                  bold: true,
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
              ]);

              return table;
            })(),
          ],
        },
      },
      {
        marginTop: 12,
        text: dayjs().locale("en").format("MM/DD/YYYY"),
        alignment: "right",
      },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Weekly Report - Cocoa Price.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

module.exports = {
  generateWeeklySummaryReportForDomesticCocoaPrices,
  generateWeeklyAverageReportForDomesticCocoaPrices,
  generateWeeklyCocoaPriceReportForDomesticCocoaPrices,
};
