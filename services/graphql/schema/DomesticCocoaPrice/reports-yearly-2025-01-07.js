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

const generateYearlySummaryReportForDomesticCocoaPrices = async (
  self,
  params,
  context,
) => {
  // console.log("generateYearlySummaryReportForDomesticCocoaPrices", params);
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
    .sort({
      seq: 1,
    })
    .toArray();
  allCentres = allCentres.map(cent => {
    return {
      ...cent,
      seq: parseInt(cent.seq),
    };
  });

  allCentres = lodash.sortBy(allCentres, [
    function (o) {
      return o.seq;
    },
  ]);

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
    query.$or.push({
      date: {
        $gte: dayjs().set("year", year).startOf("year").format("YYYY-MM-DD"),
        $lte: dayjs().set("year", year).endOf("year").format("YYYY-MM-DD"),
      },
    });
  }
  if (query.$or.length === 0) {
    delete query.$or;
  }
  // query.centreId = {
  //   $in: ["85463571-cf3e-4c64-a21a-eba6b674aacf"],
  // };
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
  // console.log(
  //   JSON.stringify({ params, query }, null, 4),
  //   allDomesticCocoaPrices.length,
  // );

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
                  { text: "Maklumat Harga Tahunan Koko Pada:", bold: true },
                  { text: "\nYearly Cocoa Price on", italics: true },
                ],
              },
              {
                text: `${dayjs()
                  .set("year", params.yearIds[0])
                  .format("YYYY")}`,
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

                let annualStats = {};
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(monthIndex => {
                  let monthlyStats = {
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
                    .set("month", monthIndex)
                    .set("year", params.yearIds[0])
                    .endOf("month");
                  let currentDate = dayjs()
                    .set("month", monthIndex)
                    .set("year", params.yearIds[0])
                    .startOf("month");

                  do {
                    let pricesPerDates = indexedDomesticCocoaPrices.where({
                      centreId: centre._id,
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

                    // const prices = indexedDomesticCocoaPrices.where({
                    //   date: currentDate.format("YYYY-MM-DD"),
                    // });
                    // if (prices.length === 0) {
                    //   currentDate = currentDate.add(1, "day");
                    //   continue;
                    // }

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
                        monthlyStats[key].max === "" ||
                        monthlyStats[key].max < stats[key].max
                      ) {
                        monthlyStats[key].max = stats[key].max;
                      }
                      if (
                        monthlyStats[key].min === "" ||
                        monthlyStats[key].min > stats[key].min
                      ) {
                        if (stats[key].min > 0) {
                          monthlyStats[key].min = stats[key].min;
                        }
                      }
                      if (stats[key].average) {
                        monthlyStats[key].total += stats[key].average;
                        monthlyStats[key].count += 1;
                      }
                      monthlyStats[key].countDayOfWeek += 1;
                    }
                    // console.log(currentDate.format("YYYY-MM-DD"), prices.length, {
                    //   stats,
                    // });

                    currentDate = currentDate.add(1, "day");
                  } while (!currentDate.isAfter(endDateOfMonth));

                  for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                    monthlyStats[key].average =
                      monthlyStats[key].total > 0 && monthlyStats[key].count > 0
                        ? lodash.round(
                            monthlyStats[key].total / monthlyStats[key].count,
                            0,
                          )
                        : 0;

                    if (!monthlyStats[key].count) continue;
                  }

                  annualStats[monthIndex] = monthlyStats;
                });

                const stats = {
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
                for (const monthIndex in annualStats) {
                  for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                    const value = annualStats[monthIndex][key].average;
                    // console.log(monthIndex, key, value);
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

                // if (centre.description.toUpperCase() === "TAWAU") {
                //   console.log(JSON.stringify(stats, null, 4));
                // }

                for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                  stats[key].average =
                    stats[key].total > 0 && stats[key].count > 0
                      ? lodash.round(stats[key].total / stats[key].count, 0)
                      : 0;

                  if (stats[key].average) {
                    globalStats[key].total += stats[key].average;
                    globalStats[key].count += 1;
                  }
                }
                console.log(centre.description, { stats });

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
                    alignment: "center",
                  },
                  {
                    text: stats["wetPrice"].min
                      ? formatNumber(stats["wetPrice"].min)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: stats["wetPrice"].average
                      ? formatNumber(stats["wetPrice"].average)
                      : "-",
                    alignment: "center",
                  },
                  //
                  {
                    text: stats["smc1"].max
                      ? formatNumber(stats["smc1"].max)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: stats["smc1"].min
                      ? formatNumber(stats["smc1"].min)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: stats["smc1"].average
                      ? formatNumber(stats["smc1"].average)
                      : "-",
                    alignment: "center",
                  },
                  //
                  {
                    text: stats["smc2"].max
                      ? formatNumber(stats["smc2"].max)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: stats["smc2"].min
                      ? formatNumber(stats["smc2"].min)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: stats["smc2"].average
                      ? formatNumber(stats["smc2"].average)
                      : "-",
                    alignment: "center",
                  },
                  //
                  {
                    text: stats["smc3"].max
                      ? formatNumber(stats["smc3"].max)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: stats["smc3"].min
                      ? formatNumber(stats["smc3"].min)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: stats["smc3"].average
                      ? formatNumber(stats["smc3"].average)
                      : "-",
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
                  alignment: "center",
                  colSpan: 2,
                },
                {
                  text: " ",
                  alignment: "center",
                },
                {
                  text: globalStats["wetPrice"].average
                    ? formatNumber(globalStats["wetPrice"].average)
                    : "-",
                  alignment: "center",
                  bold: true,
                },
                //
                {
                  text: " ",
                  alignment: "center",
                  colSpan: 2,
                },
                {
                  text: " ",
                  alignment: "center",
                },
                {
                  text: globalStats["smc1"].average
                    ? formatNumber(globalStats["smc1"].average)
                    : "-",
                  alignment: "center",
                  bold: true,
                },
                //
                {
                  text: " ",
                  alignment: "center",
                  colSpan: 2,
                },
                {
                  text: " ",
                  alignment: "center",
                },
                {
                  text: globalStats["smc2"].average
                    ? formatNumber(globalStats["smc2"].average)
                    : "-",
                  alignment: "center",
                  bold: true,
                },
                //
                {
                  text: " ",
                  alignment: "center",
                  colSpan: 2,
                },
                {
                  text: " ",
                  alignment: "center",
                },
                {
                  text: globalStats["smc3"].average
                    ? formatNumber(globalStats["smc3"].average)
                    : "-",
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
    filename: `Yearly Report - Summary.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateYearlyAverageReportForDomesticCocoaPrices = async (
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
  query.$or.push({
    date: {
      $gte: dayjs()
        .set("year", params.fromYearIds[0])
        .startOf("year")
        .format("YYYY-MM-DD"),
      $lte: dayjs()
        .set("year", params.toYearIds[0])
        .endOf("year")
        .format("YYYY-MM-DD"),
    },
  });
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
        // text: `YEARLY AVERAGE PRICES`,
        text: `YEARLY AVERAGE PRICES FOR ${(
          allCentres[0]?.description || ""
        ).toUpperCase()} FROM ${params.fromYearIds[0]} TO ${
          params.toYearIds[0]
        }`,
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
          widths: [60, 200],
          body: [
            [
              {
                text: "From Year",
                bold: true,
              },
              {
                text: `: ${params.fromYearIds[0]}`,
                // bold: true,
              },
            ],
            [
              {
                text: "To Year",
                bold: true,
              },
              {
                text: `: ${params.toYearIds[0]}`,
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
                text: "Month",
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

              let globalStats = {
                wetPrice: {
                  max: [],
                  min: [],
                  average: [],
                },
                smc1: {
                  max: [],
                  min: [],
                  average: [],
                },
                smc2: {
                  max: [],
                  min: [],
                  average: [],
                },
                smc3: {
                  max: [],
                  min: [],
                  average: [],
                },
              };

              let diffYear = Math.max(
                0,
                parseInt(params.toYearIds[0]) - parseInt(params.fromYearIds[0]),
              );
              if (diffYear >= 0) {
                diffYear += 1;
              }
              [...new Array(diffYear)].map((_, yearIndex) => {
                let yearlyStats = {
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

                const currentYear = parseInt(params.fromYearIds[0]) + yearIndex;
                const endDateOfMonth = dayjs()
                  .set("year", currentYear)
                  .endOf("year");
                let currentDate = dayjs()
                  .set("year", currentYear)
                  .startOf("year");

                do {
                  const prices = indexedDomesticCocoaPrices.where({
                    date: currentDate.format("YYYY-MM-DD"),
                  });
                  // if (prices.length === 0) {
                  //   currentDate = currentDate.add(1, "day");
                  //   continue;
                  // }

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
                      yearlyStats[key].max === "" ||
                      yearlyStats[key].max < stats[key].max
                    ) {
                      yearlyStats[key].max = stats[key].max;
                    }
                    if (
                      yearlyStats[key].min === "" ||
                      yearlyStats[key].min > stats[key].min
                    ) {
                      if (stats[key].min > 0) {
                        yearlyStats[key].min = stats[key].min;
                      }
                    }
                    if (stats[key].average) {
                      yearlyStats[key].total += stats[key].average;
                      yearlyStats[key].count += 1;
                    }
                  }
                  // console.log(currentDate.format("YYYY-MM-DD"), prices.length, {
                  //   stats,
                  // });

                  currentDate = currentDate.add(1, "day");
                } while (!currentDate.isAfter(endDateOfMonth));

                for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                  yearlyStats[key].average =
                    yearlyStats[key].total > 0 && yearlyStats[key].count > 0
                      ? lodash.round(
                          yearlyStats[key].total / yearlyStats[key].count,
                          0,
                        )
                      : 0;

                  if (yearlyStats[key].average) {
                    globalStats[key].average.push(yearlyStats[key].average);
                  }
                }
                table.push([
                  {
                    text: endDateOfMonth.format("YYYY"),
                    // bold: true,
                    // alignment: "center",
                    marginLeft: 10,
                  },
                  //
                  {
                    text: yearlyStats["wetPrice"].max
                      ? formatNumber(yearlyStats["wetPrice"].max)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: yearlyStats["wetPrice"].min
                      ? formatNumber(yearlyStats["wetPrice"].min)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: yearlyStats["wetPrice"].average
                      ? formatNumber(yearlyStats["wetPrice"].average)
                      : "-",
                    alignment: "center",
                  },
                  //
                  {
                    text: yearlyStats["smc1"].max
                      ? formatNumber(yearlyStats["smc1"].max)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: yearlyStats["smc1"].min
                      ? formatNumber(yearlyStats["smc1"].min)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: yearlyStats["smc1"].average
                      ? formatNumber(yearlyStats["smc1"].average)
                      : "-",
                    alignment: "center",
                  },
                  //
                  {
                    text: yearlyStats["smc2"].max
                      ? formatNumber(yearlyStats["smc2"].max)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: yearlyStats["smc2"].min
                      ? formatNumber(yearlyStats["smc2"].min)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: yearlyStats["smc2"].average
                      ? formatNumber(yearlyStats["smc2"].average)
                      : "-",
                    alignment: "center",
                  },
                  //
                  {
                    text: yearlyStats["smc3"].max
                      ? formatNumber(yearlyStats["smc3"].max)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: yearlyStats["smc3"].min
                      ? formatNumber(yearlyStats["smc3"].min)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: yearlyStats["smc3"].average
                      ? formatNumber(yearlyStats["smc3"].average)
                      : "-",
                    alignment: "center",
                  },
                ]);
              });

              // for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
              //   if (globalStats[key].average.length > 0) {
              //     let sum = globalStats[key].average.reduce(
              //       (sum, value) => sum + value,
              //       0,
              //     );
              //     let count = globalStats[key].average.length;
              //     globalStats[key].average =
              //       sum > 0 && count > 0 ? Math.round(sum / count, 0) : 0;
              //   } else {
              //     globalStats[key].average = "";
              //   }
              // }
              // table.push([
              //   {
              //     text: "Average",
              //     bold: true,
              //     // alignment: "center",
              //     marginLeft: 10,
              //   },
              //   //
              //   {
              //     text: "",
              //     fillColor: "#f0f0f0",
              //     alignment: "center",
              //     bold: true,
              //   },
              //   {
              //     text: "",
              //     fillColor: "#f0f0f0",
              //     alignment: "center",
              //     bold: true,
              //   },
              //   {
              //     text: globalStats["wetPrice"].average || "-",
              //     alignment: "center",
              //     bold: true,
              //   },
              //   //
              //   {
              //     text: "",
              //     fillColor: "#f0f0f0",
              //     alignment: "center",
              //     bold: true,
              //   },
              //   {
              //     text: "",
              //     fillColor: "#f0f0f0",
              //     alignment: "center",
              //     bold: true,
              //   },
              //   {
              //     text: globalStats["smc1"].average || "-",
              //     alignment: "center",
              //     bold: true,
              //   },
              //   //
              //   {
              //     text: "",
              //     fillColor: "#f0f0f0",
              //     alignment: "center",
              //     bold: true,
              //   },
              //   {
              //     text: "",
              //     fillColor: "#f0f0f0",
              //     alignment: "center",
              //     bold: true,
              //   },
              //   {
              //     text: globalStats["smc2"].average || "-",
              //     alignment: "center",
              //     bold: true,
              //   },
              //   //
              //   {
              //     text: "",
              //     fillColor: "#f0f0f0",
              //     alignment: "center",
              //     bold: true,
              //   },
              //   {
              //     text: "",
              //     fillColor: "#f0f0f0",
              //     alignment: "center",
              //     bold: true,
              //   },
              //   {
              //     text: globalStats["smc3"].average || "-",
              //     alignment: "center",
              //     bold: true,
              //   },
              // ]);

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
    filename: `Yearly Report - Average.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateYearlyCocoaPriceReportForDomesticCocoaPrices = async (
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
  query.$or.push({
    date: {
      $gte: dayjs()
        .set("year", params.fromYearIds[0])
        .startOf("year")
        .format("YYYY-MM-DD"),
      $lte: dayjs()
        .set("year", params.toYearIds[0])
        .endOf("year")
        .format("YYYY-MM-DD"),
    },
  });
  if (query.$or.length === 0) {
    delete query.$or;
  }
  // console.log(JSON.stringify({ params, query }, null, 4));
  await context.collection("DomesticCocoaPrices").createIndex({
    date: 1,
  });
  let allDomesticCocoaPrices = await context
    .collection("DomesticCocoaPrices")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
      transferFromTemporaryId: {
        $exists: false,
      },
    })
    .toArray();
  allDomesticCocoaPrices = allDomesticCocoaPrices.map(price => {
    return {
      ...price,
      year: parseInt(dayjs(price.date).format("YYYY")),
    };
  });
  // console.log("allDomesticCocoaPrices", allDomesticCocoaPrices.length);
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
        // text: `YEARLY COCOA PRICES`,
        text: `Yearly Cocoa Price for `,
        alignment: "center",
        bold: true,
        fontSize: BASE_FONT_SIZE + 3,
      },
      {
        // text: `YEARLY COCOA PRICES`,
        text: `Gred -  ${(params.gradeIds[0] || "").toUpperCase()}`,
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
          widths: [60, 200],
          body: [
            [
              {
                text: "From Year",
                bold: true,
              },
              {
                text: `: ${params.fromYearIds[0]}`,
                // bold: true,
              },
            ],
            [
              {
                text: "To Year",
                bold: true,
              },
              {
                text: `: ${params.toYearIds[0]}`,
                // bold: true,
              },
            ],
            [
              {
                text: "Grade",
                bold: true,
              },
              {
                text: `: ${params.gradeIds[0]}`,
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
          widths: [30, ...allCentres.map(centre => 42), 44],
          body: [
            [
              {
                text: "Year",
                italics: true,
                bold: true,
                marginTop: 7,
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
                marginTop: 7,
              },
            ],
            ...(() => {
              let table = [];
              let quarterlyStats = {};

              let diffYear = Math.max(
                0,
                parseInt(params.toYearIds[0]) - parseInt(params.fromYearIds[0]),
              );
              if (diffYear >= 0) {
                diffYear += 1;
              }
              [...new Array(diffYear)].map((_, yearIndex) => {
                let globalTotal = {},
                  globalCount = {};

                const currentYear = parseInt(params.fromYearIds[0]) + yearIndex;
                const endDateOfMonth = dayjs()
                  .set("year", currentYear)
                  .endOf("year");
                let currentDate = dayjs()
                  .set("year", currentYear)
                  .startOf("year");

                const statCode = GRADE_CODES[params.gradeIds[0]];
                // const prices = indexedDomesticCocoaPrices.where({
                //   date: currentDate.format("YYYY-MM-DD"),
                // });

                allCentres.forEach(centre => {
                  const prices = indexedDomesticCocoaPrices.where({
                    // date: currentDate.format("YYYY-MM-DD"),
                    year: currentYear,
                    centreId: centre._id,
                  });

                  const stats = {
                    [statCode]: {
                      max: "",
                      min: "",
                      average: 0,
                      total: 0,
                      count: 0,
                    },
                  };

                  let totalPerCentre = {
                    [centre._id]: {
                      jan: [],
                      feb: [],
                      mar: [],
                      apr: [],
                      may: [],
                      jun: [],
                      jul: [],
                      aug: [],
                      sep: [],
                      oct: [],
                      nov: [],
                      dec: [],
                    },
                  };
                  let checkCurrentDate = "";
                  for (const price of prices) {
                    let value = price[statCode] || 0;
                    if (value > 0) {
                      // stats[statCode].total += value;
                      // stats[statCode].count += 1;

                      let foundDuplicate = indexedDomesticCocoaPrices.where({
                        date: price.date,
                        centreId: centre._id,
                      });

                      if (foundDuplicate.length > 1) {
                        foundDuplicate = foundDuplicate.filter(
                          p => p[statCode] > 0,
                        );
                        value =
                          foundDuplicate
                            .map(p => p[statCode])
                            .reduce((acc, curr) => acc + curr, 0) /
                          foundDuplicate.length;
                      }

                      if (checkCurrentDate === price.date) continue;

                      console.log("date", price.date, "value", value);

                      const month = dayjs(price.date).get("month");
                      if (month === 0) {
                        totalPerCentre[centre._id].jan.push(value);
                      } else if (month === 1) {
                        totalPerCentre[centre._id].feb.push(value);
                      } else if (month === 2) {
                        totalPerCentre[centre._id].mar.push(value);
                      } else if (month === 3) {
                        totalPerCentre[centre._id].apr.push(value);
                      } else if (month === 4) {
                        totalPerCentre[centre._id].may.push(value);
                      } else if (month === 5) {
                        totalPerCentre[centre._id].jun.push(value);
                      } else if (month === 6) {
                        totalPerCentre[centre._id].jul.push(value);
                      } else if (month === 7) {
                        totalPerCentre[centre._id].aug.push(value);
                      } else if (month === 8) {
                        totalPerCentre[centre._id].sep.push(value);
                      } else if (month === 9) {
                        totalPerCentre[centre._id].oct.push(value);
                      } else if (month === 10) {
                        totalPerCentre[centre._id].nov.push(value);
                      } else if (month === 11) {
                        totalPerCentre[centre._id].dec.push(value);
                      }

                      checkCurrentDate = price.date;
                    }
                  }

                  const janAvg =
                    totalPerCentre[centre._id].jan.length > 0
                      ? lodash.round(
                          totalPerCentre[centre._id].jan.reduce(
                            (a, b) => a + b,
                            0,
                          ) / totalPerCentre[centre._id].jan.length,
                        )
                      : 0;
                  const febAvg =
                    totalPerCentre[centre._id].feb.length > 0
                      ? lodash.round(
                          totalPerCentre[centre._id].feb.reduce(
                            (a, b) => a + b,
                            0,
                          ) / totalPerCentre[centre._id].feb.length,
                        )
                      : 0;

                  const marAvg =
                    totalPerCentre[centre._id].mar.length > 0
                      ? lodash.round(
                          totalPerCentre[centre._id].mar.reduce(
                            (a, b) => a + b,
                            0,
                          ) / totalPerCentre[centre._id].mar.length,
                        )
                      : 0;

                  const aprAvg =
                    totalPerCentre[centre._id].apr.length > 0
                      ? lodash.round(
                          totalPerCentre[centre._id].apr.reduce(
                            (a, b) => a + b,
                            0,
                          ) / totalPerCentre[centre._id].apr.length,
                        )
                      : 0;

                  const mayAvg =
                    totalPerCentre[centre._id].may.length > 0
                      ? lodash.round(
                          totalPerCentre[centre._id].may.reduce(
                            (a, b) => a + b,
                            0,
                          ) / totalPerCentre[centre._id].may.length,
                        )
                      : 0;

                  const junAvg =
                    totalPerCentre[centre._id].jun.length > 0
                      ? lodash.round(
                          totalPerCentre[centre._id].jun.reduce(
                            (a, b) => a + b,
                            0,
                          ) / totalPerCentre[centre._id].jun.length,
                        )
                      : 0;

                  const julAvg =
                    totalPerCentre[centre._id].jul.length > 0
                      ? lodash.round(
                          totalPerCentre[centre._id].jul.reduce(
                            (a, b) => a + b,
                            0,
                          ) / totalPerCentre[centre._id].jul.length,
                        )
                      : 0;

                  const augAvg =
                    totalPerCentre[centre._id].aug.length > 0
                      ? lodash.round(
                          totalPerCentre[centre._id].aug.reduce(
                            (a, b) => a + b,
                            0,
                          ) / totalPerCentre[centre._id].aug.length,
                        )
                      : 0;

                  const sepAvg =
                    totalPerCentre[centre._id].sep.length > 0
                      ? lodash.round(
                          totalPerCentre[centre._id].sep.reduce(
                            (a, b) => a + b,
                            0,
                          ) / totalPerCentre[centre._id].sep.length,
                        )
                      : 0;

                  const octAvg =
                    totalPerCentre[centre._id].oct.length > 0
                      ? lodash.round(
                          totalPerCentre[centre._id].oct.reduce(
                            (a, b) => a + b,
                            0,
                          ) / totalPerCentre[centre._id].oct.length,
                        )
                      : 0;

                  const novAvg =
                    totalPerCentre[centre._id].nov.length > 0
                      ? lodash.round(
                          totalPerCentre[centre._id].nov.reduce(
                            (a, b) => a + b,
                            0,
                          ) / totalPerCentre[centre._id].nov.length,
                        )
                      : 0;

                  const decAvg =
                    totalPerCentre[centre._id].dec.length > 0
                      ? lodash.round(
                          totalPerCentre[centre._id].dec.reduce(
                            (a, b) => a + b,
                            0,
                          ) / totalPerCentre[centre._id].dec.length,
                        )
                      : 0;

                  stats[statCode].average =
                    (janAvg +
                      febAvg +
                      marAvg +
                      aprAvg +
                      mayAvg +
                      junAvg +
                      julAvg +
                      augAvg +
                      sepAvg +
                      octAvg +
                      novAvg +
                      decAvg) /
                    12;

                  // console.log({
                  //   janAvg,
                  //   febAvg,
                  //   marAvg,
                  //   aprAvg,
                  //   mayAvg,
                  //   junAvg,
                  //   julAvg,
                  //   augAvg,
                  //   sepAvg,
                  //   octAvg,
                  //   novAvg,
                  //   decAvg,
                  // });
                  // stats[statCode].average =
                  //   stats[statCode].total > 0 && stats[statCode].count > 0
                  //     ? lodash.round(
                  //         stats[statCode].total / stats[statCode].count,
                  //         0,
                  //       )
                  //     : 0;
                  // console.log(currentDate.format("YYYY-MM-DD"), prices.length, {
                  //   stats,
                  // });

                  if (stats[statCode].average) {
                    if (!globalTotal[centre._id]) {
                      globalTotal[centre._id] = 0;
                    }
                    globalTotal[centre._id] += stats[statCode].average;
                    if (!globalCount[centre._id]) {
                      globalCount[centre._id] = 0;
                    }
                    globalCount[centre._id] += 1;
                  }
                });

                // currentDate = currentDate.add(1, "day");
                // console.log(
                //   "date",
                //   currentDate.format("YYYY-MM-DD"),
                //   currentYear,
                // );

                //################## ORIGINAL ###########
                // do {
                //   // const prices = indexedDomesticCocoaPrices.where({
                //   //   date: currentDate.format("YYYY-MM-DD"),
                //   // });

                //   allCentres.forEach(centre => {
                //     const prices = indexedDomesticCocoaPrices.where({
                //       date: currentDate.format("YYYY-MM-DD"),
                //       centreId: centre._id,
                //     });

                //     const stats = {
                //       [statCode]: {
                //         max: "",
                //         min: "",
                //         average: 0,
                //         total: 0,
                //         count: 0,
                //       },
                //     };
                //     for (const price of prices) {
                //       const value = price[statCode] || 0;
                //       stats[statCode].total += value;
                //       stats[statCode].count += 1;
                //     }

                //     stats[statCode].average =
                //       stats[statCode].total > 0 && stats[statCode].count > 0
                //         ? lodash.round(
                //             stats[statCode].total / stats[statCode].count,
                //             0,
                //           )
                //         : 0;
                //     // console.log(currentDate.format("YYYY-MM-DD"), prices.length, {
                //     //   stats,
                //     // });

                //     if (stats[statCode].average) {
                //       if (!globalTotal[centre._id]) {
                //         globalTotal[centre._id] = 0;
                //       }
                //       globalTotal[centre._id] += stats[statCode].average;
                //       if (!globalCount[centre._id]) {
                //         globalCount[centre._id] = 0;
                //       }
                //       globalCount[centre._id] += 1;
                //     }
                //   });

                //   currentDate = currentDate.add(1, "day");
                //   // console.log(
                //   //   "date",
                //   //   currentDate.format("YYYY-MM-DD"),
                //   //   currentYear,
                //   // );
                // } while (!currentDate.isAfter(endDateOfMonth));
                //#######################################

                let total = 0,
                  count = 0;
                table.push([
                  {
                    text: endDateOfMonth.format("YYYY"),
                    // bold: true,
                    // alignment: "center",
                    marginLeft: 4,
                    // fillColor: "#f0f0f0",
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

                    total += average;
                    count += 1;

                    if (!quarterlyStats[centre._id]) {
                      quarterlyStats[centre._id] = [];
                    }
                    quarterlyStats[centre._id].push(average);

                    return {
                      text: average ? formatNumber(average) : "-",
                      // bold: true,
                      alignment: "center",
                      // marginTop: 14,
                      // fillColor: "#f0f0f0",
                    };
                  }),
                  {
                    text: (() => {
                      if (total > 0 && count > 0) {
                        if (!quarterlyStats["Average"]) {
                          quarterlyStats["Average"] = [];
                        }
                        quarterlyStats["Average"].push(
                          lodash.round(total / count, 0),
                        );
                        const average = lodash.round(total / count, 0);
                        return formatNumber(average);
                      }
                      return "-";
                    })(),
                    // bold: true,
                    alignment: "center",
                    // fillColor: "#f0f0f0",
                  },
                ]);

                if (yearIndex % 3 === 2) {
                  for (const key in quarterlyStats) {
                    if (quarterlyStats[key].length > 0) {
                      let sum = quarterlyStats[key].reduce(
                        (sum, value) => sum + value,
                        0,
                      );
                      let count = quarterlyStats[key].length;
                      quarterlyStats[key] =
                        sum > 0 && count > 0 ? Math.round(sum / count, 0) : 0;
                    } else {
                      quarterlyStats[key] = "";
                    }
                  }

                  // table.push([
                  //   {
                  //     text: `Average (Q${(yearIndex + 1) / 3})`,
                  //     bold: true,
                  //     // alignment: "center",
                  //     marginLeft: 4,
                  //     fillColor: "#f0f0f0",
                  //   },
                  //   //
                  //   ...allCentres.map(centre => {
                  //     return {
                  //       text: quarterlyStats[centre._id]
                  //         ? formatNumber(quarterlyStats[centre._id])
                  //         : "-",
                  //       bold: true,
                  //       alignment: "center",
                  //       // marginTop: 14,
                  //       fillColor: "#f0f0f0",
                  //     };
                  //   }),
                  //   {
                  //     text: quarterlyStats["Average"]
                  //       ? formatNumber(quarterlyStats["Average"])
                  //       : "-",
                  //     bold: true,
                  //     alignment: "center",
                  //     fillColor: "#f0f0f0",
                  //   },
                  // ]);

                  quarterlyStats = {};
                }
              });

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
    filename: `Yearly Report - Cocoa Price.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateYearlyAverageCentreReportForDomesticCocoaPrices = async (
  self,
  params,
  context,
) => {
  assertValidSession(context.activeSession);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  let allCentres = await context
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
  // console.log({ params, allCentres });
  // const indexedCentres = new FlexSearch({
  //   tokenize: "strict",
  //   doc: {
  //     id: "_id",
  //     field: ["code"],
  //   },
  // });
  // indexedCentres.add(allCentres);
  // console.log({ allCentres });

  let query = {
    $or: [],
  };
  query.$or.push({
    date: {
      $gte: dayjs()
        .set("year", params.fromYearIds[0])
        .startOf("year")
        .format("YYYY-MM-DD"),
      $lte: dayjs()
        .set("year", params.toYearIds[0])
        .endOf("year")
        .format("YYYY-MM-DD"),
    },
  });
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
  // console.log("allDomesticCocoaPrices", allDomesticCocoaPrices.length);
  const indexedDomesticCocoaPrices = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["centreId", "date"],
    },
  });
  indexedDomesticCocoaPrices.add(allDomesticCocoaPrices);

  // allCentres = allCentres.filter(centre => {
  //   const prices = indexedDomesticCocoaPrices.where({
  //     centreId: centre._id,
  //   });
  //   return prices.length > 0;
  // });

  // ###########################################################################################
  // ###########################################################################################

  const GRADE_CODES = {
    "Wet Cocoa Beans": "wetPrice",
    "SMC 1": "smc1",
    "SMC 2": "smc2",
    "SMC 3": "smc3",
  };

  // console.log({ params });
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
        text: `YEARLY AVERAGE PRICE ${
          allCentres.length > 1
            ? "(CENTRE)"
            : ((allCentres[0] && allCentres[0].description) || "").toUpperCase()
        } FROM ${params.fromYearIds[0]} TO ${
          params.toYearIds[0]
        }\nGRADE ${params.gradeIds[0].toUpperCase()}`,
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
          widths: [60, 200],
          body: [
            // [
            //   {
            //     text: "From Year",
            //     bold: true,
            //   },
            //   {
            //     text: `: ${params.fromYearIds[0]}`,
            //     // bold: true,
            //   },
            // ],
            // [
            //   {
            //     text: "To Year",
            //     bold: true,
            //   },
            //   {
            //     text: `: ${params.toYearIds[0]}`,
            //     // bold: true,
            //   },
            // ],
            [
              {
                text: "Grade",
                bold: true,
              },
              {
                text: `: ${params.gradeIds[0]}`,
                // bold: true,
              },
            ],
          ],
        },
      },
      {
        marginLeft: Math.max(0, 400 - allCentres.length * 50),
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
                text: "Year",
                italics: true,
                bold: true,
                marginTop: 7,
                marginLeft: 4,
              },
              ...allCentres.map(centre => {
                // console.log({ centre })
                return {
                  text: centre.description,
                  bold: true,
                  alignment: "center",
                  // marginTop: 14,
                };
              }),
              // {
              //   text: "Average",
              //   bold: true,
              //   alignment: "center",
              //   marginTop: 7,
              // },
            ],
            ...(() => {
              let table = [];
              let quarterlyStats = {};

              let diffYear = Math.max(
                0,
                parseInt(params.toYearIds[0]) - parseInt(params.fromYearIds[0]),
              );
              if (diffYear >= 0) {
                diffYear += 1;
              }
              [...new Array(diffYear)].map((_, yearIndex) => {
                let globalTotal = {},
                  globalCount = {};

                const currentYear = parseInt(params.fromYearIds[0]) + yearIndex;
                // console.log({ currentYear, diffYear, params });
                const endDateOfMonth = dayjs()
                  .set("year", currentYear)
                  .endOf("year");
                let currentDate = dayjs()
                  .set("year", currentYear)
                  .startOf("year");

                const statCode = GRADE_CODES[params.gradeIds[0]];
                do {
                  // const prices = indexedDomesticCocoaPrices.where({
                  //   date: currentDate.format("YYYY-MM-DD"),
                  // });

                  allCentres.forEach(centre => {
                    const prices = indexedDomesticCocoaPrices.where({
                      date: currentDate.format("YYYY-MM-DD"),
                      centreId: centre._id,
                    });

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

                    stats[statCode].average =
                      stats[statCode].total > 0 && stats[statCode].count > 0
                        ? lodash.round(
                            stats[statCode].total / stats[statCode].count,
                            0,
                          )
                        : 0;
                    // console.log(currentDate.format("YYYY-MM-DD"), prices.length, {
                    //   stats,
                    // });

                    if (stats[statCode].average) {
                      if (!globalTotal[centre._id]) {
                        globalTotal[centre._id] = 0;
                      }
                      globalTotal[centre._id] += stats[statCode].average;
                      if (!globalCount[centre._id]) {
                        globalCount[centre._id] = 0;
                      }
                      globalCount[centre._id] += 1;
                    }
                  });

                  currentDate = currentDate.add(1, "day");
                  // console.log(
                  //   "date",
                  //   currentDate.format("YYYY-MM-DD"),
                  //   currentYear,
                  // );
                } while (!currentDate.isAfter(endDateOfMonth));

                let total = 0,
                  count = 0;
                table.push([
                  {
                    text: endDateOfMonth.format("YYYY"),
                    // bold: true,
                    // alignment: "center",
                    marginLeft: 4,
                    // fillColor: "#f0f0f0",
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

                    total += average;
                    count += 1;

                    if (!quarterlyStats[centre._id]) {
                      quarterlyStats[centre._id] = [];
                    }
                    quarterlyStats[centre._id].push(average);

                    return {
                      text: average ? formatNumber(average) : "-",
                      // bold: true,
                      alignment: "center",
                      // marginTop: 14,
                      // fillColor: "#f0f0f0",
                    };
                  }),
                  // {
                  //   text: (() => {
                  //     if (total > 0 && count > 0) {
                  //       if (!quarterlyStats["Average"]) {
                  //         quarterlyStats["Average"] = [];
                  //       }
                  //       quarterlyStats["Average"].push(
                  //         lodash.round(total / count, 2),
                  //       );
                  //       return lodash.round(total / count, 2);
                  //     }
                  //     return "-";
                  //   })(),
                  //   // bold: true,
                  //   alignment: "center",
                  //   // fillColor: "#f0f0f0",
                  // },
                ]);

                if (yearIndex % 3 === 2) {
                  for (const key in quarterlyStats) {
                    if (quarterlyStats[key].length > 0) {
                      let sum = quarterlyStats[key].reduce(
                        (sum, value) => sum + value,
                        0,
                      );
                      let count = quarterlyStats[key].length;
                      quarterlyStats[key] =
                        sum > 0 && count > 0 ? Math.round(sum / count, 0) : 0;
                    } else {
                      quarterlyStats[key] = "";
                    }
                  }

                  table.push([
                    {
                      text: `Average (Q${(yearIndex + 1) / 3})`,
                      bold: true,
                      // alignment: "center",
                      marginLeft: 4,
                      fillColor: "#f0f0f0",
                    },
                    //
                    ...allCentres.map(centre => {
                      return {
                        text: quarterlyStats[centre._id]
                          ? formatNumber(quarterlyStats[centre._id])
                          : "-",
                        bold: true,
                        alignment: "center",
                        // marginTop: 14,
                        fillColor: "#f0f0f0",
                      };
                    }),
                    // {
                    //   text: quarterlyStats["Average"] || "-",
                    //   bold: true,
                    //   alignment: "center",
                    //   fillColor: "#f0f0f0",
                    // },
                  ]);

                  quarterlyStats = {};
                }
              });

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
    filename: `Yearly Report - Average (Centre) Price.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

module.exports = {
  generateYearlySummaryReportForDomesticCocoaPrices,
  generateYearlyAverageReportForDomesticCocoaPrices,
  generateYearlyCocoaPriceReportForDomesticCocoaPrices,
  generateYearlyAverageCentreReportForDomesticCocoaPrices,
};
