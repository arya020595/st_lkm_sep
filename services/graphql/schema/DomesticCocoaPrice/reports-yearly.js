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
const cluster = require("cluster");
const os = require("os");
const numCPUs = os.cpus().length;
const {
  Worker,
  isMainThread,
  parentPort,
  workerData,
} = require("worker_threads");

// Cache untuk menyimpan status progres
const reportsProgressCache = new Map();

// Fungsi untuk mendapatkan status progres laporan
const getReportProgress = async (self, { reportId }, context) => {
  assertValidSession(context.activeSession);

  if (!reportsProgressCache.has(reportId)) {
    return { status: "not_found", progress: 0, reportUrl: null };
  }

  const reportData = reportsProgressCache.get(reportId);
  return {
    status: reportData.status,
    progress: reportData.progress,
    reportUrl: reportData.reportUrl,
  };
};

// Fungsi untuk menghapus reportData dari cache setelah beberapa waktu
const cleanupReportData = (reportId) => {
  setTimeout(() => {
    if (reportsProgressCache.has(reportId)) {
      reportsProgressCache.delete(reportId);
    }
  }, 30 * 60 * 1000); // Hapus dari cache setelah 30 menit
};

const generateYearlySummaryReportForDomesticCocoaPrices = async (
  self,
  params,
  context
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
  allCentres = allCentres.map((cent) => {
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
                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((monthIndex) => {
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
                            0
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
                        0
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
  context
) => {
  assertValidSession(context.activeSession);
  // console.log("...generateYearlyAverageReportForDomesticCocoaPrices");

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
          }
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
  let toYear = parseInt(params.toYearIds[0]);
  let fromYear = parseInt(params.fromYearIds[0]);
  if (toYear < fromYear) {
    let tmpYear = toYear;
    toYear = fromYear;
    fromYear = tmpYear;
  }
  query.$or.push({
    date: {
      $gte: dayjs().set("year", fromYear).startOf("year").format("YYYY-MM-DD"),
      $lte: dayjs().set("year", toYear).endOf("year").format("YYYY-MM-DD"),
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
        ).toUpperCase()} FROM ${fromYear} TO ${toYear}`,
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

              let diffYear = Math.max(0, toYear - fromYear);
              // console.log({ params, diffYear });
              if (diffYear >= 0) {
                diffYear += 1;
              }
              [...new Array(diffYear)].map((_, yearIndex) => {
                const currentYear = parseInt(fromYear) + yearIndex;
                // console.log({ diffYear, currentYear });

                let globalStats = {
                  wetPrice: {
                    max: {
                      total: 0,
                      count: 0,
                      average: 0,
                    },
                    min: {
                      total: 0,
                      count: 0,
                      average: 0,
                    },
                    average: {
                      total: 0,
                      count: 0,
                      average: 0,
                    },
                  },
                  smc1: {
                    max: {
                      total: 0,
                      count: 0,
                      average: 0,
                    },
                    min: {
                      total: 0,
                      count: 0,
                      average: 0,
                    },
                    average: {
                      total: 0,
                      count: 0,
                      average: 0,
                    },
                  },
                  smc2: {
                    max: {
                      total: 0,
                      count: 0,
                      average: 0,
                    },
                    min: {
                      total: 0,
                      count: 0,
                      average: 0,
                    },
                    average: {
                      total: 0,
                      count: 0,
                      average: 0,
                    },
                  },
                  smc3: {
                    max: {
                      total: 0,
                      count: 0,
                      average: 0,
                    },
                    min: {
                      total: 0,
                      count: 0,
                      average: 0,
                    },
                    average: {
                      total: 0,
                      count: 0,
                      average: 0,
                    },
                  },
                };

                [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((monthIndex) => {
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
                    .set("year", currentYear)
                    .endOf("month");
                  let currentDate = dayjs()
                    .set("month", monthIndex)
                    .set("year", currentYear)
                    .startOf("month");

                  do {
                    let pricesPerDates = indexedDomesticCocoaPrices.where({
                      centreId: allCentres[0]._id,
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
                    // console.log({ prices });

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
                  // console.log(
                  //   "...monthlyStats",
                  //   endDateOfMonth.format("YYYY-MM-DD"),
                  //   monthlyStats
                  // );

                  for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                    monthlyStats[key].average =
                      monthlyStats[key].total > 0 && monthlyStats[key].count > 0
                        ? lodash.round(
                            monthlyStats[key].total / monthlyStats[key].count,
                            0
                          )
                        : 0;

                    if (!monthlyStats[key].count) continue;

                    if (
                      !globalStats[key].max.max ||
                      globalStats[key].max.max < monthlyStats[key].max
                    ) {
                      globalStats[key].max.max = monthlyStats[key].max;
                    }
                    if (
                      !globalStats[key].min.min ||
                      globalStats[key].min.min > monthlyStats[key].min
                    ) {
                      globalStats[key].min.min = monthlyStats[key].min;
                    }

                    globalStats[key].max.total += monthlyStats[key].max;
                    globalStats[key].max.count += 1;
                    globalStats[key].min.total += monthlyStats[key].min;
                    globalStats[key].min.count += 1;
                    globalStats[key].average.total += monthlyStats[key].average;
                    globalStats[key].average.count += 1;
                  }

                  // table.push([
                  //   {
                  //     text: endDateOfMonth.format("MMMM"),
                  //     // bold: true,
                  //     // alignment: "center",
                  //     marginLeft: 10,
                  //   },
                  //   //
                  //   {
                  //     text: monthlyStats["wetPrice"].max
                  //       ? formatNumber(monthlyStats["wetPrice"].max)
                  //       : "-",
                  //     // borders: [true, false, true, false],
                  //     alignment: "center",
                  //   },
                  //   {
                  //     text: monthlyStats["wetPrice"].min
                  //       ? formatNumber(monthlyStats["wetPrice"].min)
                  //       : "-",
                  //     // borders: [true, false, true, false],
                  //     alignment: "center",
                  //   },
                  //   {
                  //     text: monthlyStats["wetPrice"].average
                  //       ? formatNumber(monthlyStats["wetPrice"].average)
                  //       : "-",
                  //     // borders: [true, false, true, false],
                  //     alignment: "center",
                  //   },
                  //   //
                  //   {
                  //     text: monthlyStats["smc1"].max
                  //       ? formatNumber(monthlyStats["smc1"].max)
                  //       : "-",
                  //     // borders: [true, false, true, false],
                  //     alignment: "center",
                  //   },
                  //   {
                  //     text: monthlyStats["smc1"].min
                  //       ? formatNumber(monthlyStats["smc1"].min)
                  //       : "-",
                  //     // borders: [true, false, true, false],
                  //     alignment: "center",
                  //   },
                  //   {
                  //     text: monthlyStats["smc1"].average
                  //       ? formatNumber(monthlyStats["smc1"].average)
                  //       : "-",
                  //     // borders: [true, false, true, false],
                  //     alignment: "center",
                  //   },
                  //   //
                  //   {
                  //     text: monthlyStats["smc2"].max
                  //       ? formatNumber(monthlyStats["smc2"].max)
                  //       : "-",
                  //     // borders: [true, false, true, false],
                  //     alignment: "center",
                  //   },
                  //   {
                  //     text: monthlyStats["smc2"].min
                  //       ? formatNumber(monthlyStats["smc2"].min)
                  //       : "-",
                  //     // borders: [true, false, true, false],
                  //     alignment: "center",
                  //   },
                  //   {
                  //     text: monthlyStats["smc2"].average
                  //       ? formatNumber(monthlyStats["smc2"].average)
                  //       : "-",
                  //     // borders: [true, false, true, false],
                  //     alignment: "center",
                  //   },
                  //   //
                  //   {
                  //     text: monthlyStats["smc3"].max
                  //       ? formatNumber(monthlyStats["smc3"].max)
                  //       : "-",
                  //     // borders: [true, false, true, false],
                  //     alignment: "center",
                  //   },
                  //   {
                  //     text: monthlyStats["smc3"].min
                  //       ? formatNumber(monthlyStats["smc3"].min)
                  //       : "-",
                  //     // borders: [true, false, true, false],
                  //     alignment: "center",
                  //   },
                  //   {
                  //     text: monthlyStats["smc3"].average
                  //       ? formatNumber(monthlyStats["smc3"].average)
                  //       : "-",
                  //     // borders: [true, false, true, false],
                  //     alignment: "center",
                  //   },
                  // ]);
                });
                // console.log(globalStats);

                for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                  for (const subkey of ["max", "min", "average"]) {
                    globalStats[key][subkey].average =
                      globalStats[key][subkey].total > 0 &&
                      globalStats[key][subkey].count > 0
                        ? lodash.round(
                            globalStats[key][subkey].total /
                              globalStats[key][subkey].count,
                            0
                          )
                        : 0;
                  }
                }

                table.push([
                  {
                    text: currentYear,
                    // bold: true,
                    // alignment: "center",
                    marginLeft: 10,
                  },
                  //
                  {
                    text: globalStats["wetPrice"].max.max
                      ? formatNumber(globalStats["wetPrice"].max.max)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: globalStats["wetPrice"].min.min
                      ? formatNumber(globalStats["wetPrice"].min.min)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: globalStats["wetPrice"].average.average
                      ? formatNumber(globalStats["wetPrice"].average.average)
                      : "-",
                    alignment: "center",
                  },
                  //
                  {
                    text: globalStats["smc1"].max.max
                      ? formatNumber(globalStats["smc1"].max.max)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: globalStats["smc1"].min.min
                      ? formatNumber(globalStats["smc1"].min.min)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: globalStats["smc1"].average.average
                      ? formatNumber(globalStats["smc1"].average.average)
                      : "-",
                    alignment: "center",
                  },
                  //
                  {
                    text: globalStats["smc2"].max.max
                      ? formatNumber(globalStats["smc2"].max.max)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: globalStats["smc2"].min.min
                      ? formatNumber(globalStats["smc2"].min.min)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: globalStats["smc2"].average.average
                      ? formatNumber(globalStats["smc2"].average.average)
                      : "-",
                    alignment: "center",
                  },
                  //
                  {
                    text: globalStats["smc3"].max.max
                      ? formatNumber(globalStats["smc3"].max.max)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: globalStats["smc3"].min.min
                      ? formatNumber(globalStats["smc3"].min.min)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: globalStats["smc3"].average.average
                      ? formatNumber(globalStats["smc3"].average.average)
                      : "-",
                    alignment: "center",
                  },
                ]);
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
    filename: `Yearly Report - Average.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

// Fungsi worker untuk worker_threads
if (!isMainThread) {
  const { chunk, fromYear, statCode, allCentres, allPriceData } = workerData;

  const processYearWorker = (yearIndex) => {
    const currentYear = fromYear + yearIndex;

    // Filter data harga untuk tahun saat ini
    const yearPrices = allPriceData.filter(
      (price) =>
        price.year === currentYear ||
        parseInt(dayjs(price.date).format("YYYY")) === currentYear
    );

    // Kelompokkan data berdasarkan centreId dan date
    const pricesByDate = {};
    yearPrices.forEach((price) => {
      const key = `${price.centreId}_${price.date}`;
      if (!pricesByDate[key]) {
        pricesByDate[key] = [];
      }
      pricesByDate[key].push(price);
    });

    // Struktur data untuk menyimpan rata-rata bulanan per pusat
    const centreMonthlyAvgs = {};
    allCentres.forEach((centre) => {
      centreMonthlyAvgs[centre._id] = {
        averageList: [],
        total: 0,
        count: 0,
      };
    });

    // Proses per bulan untuk setiap pusat
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const monthlyTotals = {};
      const monthlyCounts = {};

      allCentres.forEach((centre) => {
        monthlyTotals[centre._id] = 0;
        monthlyCounts[centre._id] = 0;
      });

      const startDate = dayjs()
        .set("year", currentYear)
        .set("month", monthIndex)
        .startOf("month");
      const endDate = startDate.endOf("month");

      // Loop melalui setiap hari dalam bulan
      let currentDate = startDate;
      while (!currentDate.isAfter(endDate)) {
        const dateStr = currentDate.format("YYYY-MM-DD");

        // Proses setiap pusat
        allCentres.forEach((centre) => {
          const key = `${centre._id}_${dateStr}`;
          const pricesForDay = pricesByDate[key] || [];

          if (pricesForDay.length > 0) {
            // Hitung rata-rata harian
            let sumDaily = 0;
            let countDaily = 0;

            pricesForDay.forEach((price) => {
              if (price[statCode] > 0) {
                sumDaily += price[statCode];
                countDaily++;
              }
            });

            if (countDaily > 0) {
              const dailyAvg = Math.round(sumDaily / countDaily);
              monthlyTotals[centre._id] += dailyAvg;
              monthlyCounts[centre._id] += 1;
            }
          }
        });

        currentDate = currentDate.add(1, "day");
      }

      // Hitung rata-rata bulanan untuk setiap pusat
      allCentres.forEach((centre) => {
        if (monthlyCounts[centre._id] > 0) {
          const monthlyAvg = Math.round(
            monthlyTotals[centre._id] / monthlyCounts[centre._id]
          );
          centreMonthlyAvgs[centre._id].averageList.push(monthlyAvg);
        }
      });
    }

    // Hitung rata-rata tahunan per pusat
    const yearlyAvgs = {};
    let yearlyTotal = 0;
    let yearlyCount = 0;

    allCentres.forEach((centre) => {
      const avgs = centreMonthlyAvgs[centre._id].averageList;
      if (avgs.length > 0) {
        const total = avgs.reduce((sum, val) => sum + val, 0);
        yearlyAvgs[centre._id] = Math.round(total / avgs.length);

        yearlyTotal += yearlyAvgs[centre._id];
        yearlyCount++;
      }
    });

    // Hitung rata-rata keseluruhan
    const overallAverage =
      yearlyCount > 0 ? Math.round(yearlyTotal / yearlyCount) : 0;

    // Format hasil untuk baris tabel
    return {
      year: currentYear,
      centreValues: allCentres.map((centre) => ({
        centreId: centre._id,
        value: yearlyAvgs[centre._id] || 0,
      })),
      average: overallAverage,
    };
  };

  // Proses semua tahun dalam chunk
  const results = chunk.map((yearIndex) => processYearWorker(yearIndex));

  // Kirim hasilnya kembali ke thread utama
  parentPort.postMessage(results);
}

const generateYearlyCocoaPriceReportForDomesticCocoaPrices = async (
  self,
  params,
  context
) => {
  assertValidSession(context.activeSession);

  // Buat ID laporan unik untuk tracking
  const reportId = uuidV4();

  // Simpan status awal di cache
  reportsProgressCache.set(reportId, {
    status: "processing",
    progress: 0,
    reportUrl: null,
    params,
  });

  // Jalankan proses pembuatan laporan secara asinkron
  process.nextTick(async () => {
    try {
      console.log("Step 1");
      reportsProgressCache.get(reportId).progress = 5;
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

      console.log("Step 2");
      reportsProgressCache.get(reportId).progress = 15;
      await context.collection("DomesticCocoaPrices").createIndex({
        date: 1,
      });
      console.log("Step 3");
      reportsProgressCache.get(reportId).progress = 25;
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

      console.log("Step 4");
      reportsProgressCache.get(reportId).progress = 35;
      allDomesticCocoaPrices = allDomesticCocoaPrices.map((price) => {
        return {
          ...price,
          year: parseInt(dayjs(price.date).format("YYYY")),
        };
      });

      console.log("Step 5");
      reportsProgressCache.get(reportId).progress = 45;
      const indexedDomesticCocoaPrices = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["centreId", "date", "year"],
        },
      });
      indexedDomesticCocoaPrices.add(allDomesticCocoaPrices);

      const GRADE_CODES = {
        "Wet Cocoa Beans": "wetPrice",
        "SMC 1": "smc1",
        "SMC 2": "smc2",
        "SMC 3": "smc3",
      };

      console.log("Step 6");
      reportsProgressCache.get(reportId).progress = 50;

      // Optimasi: Buat index untuk mempercepat pencarian
      const pricesByYear = {};
      const pricesByCentre = {};

      // Kelompokkan data sekali saja untuk menghindari iterasi berulang
      allDomesticCocoaPrices.forEach((price) => {
        const year = price.year;
        const centreId = price.centreId;
        const gradeCode = GRADE_CODES[params.gradeIds[0]];

        if (price[gradeCode] > 0) {
          if (!pricesByYear[year]) {
            pricesByYear[year] = {};
          }
          if (!pricesByYear[year][centreId]) {
            pricesByYear[year][centreId] = 0;
          }
          pricesByYear[year][centreId]++;

          if (!pricesByCentre[centreId]) {
            pricesByCentre[centreId] = 0;
          }
          pricesByCentre[centreId]++;
        }
      });

      // Filter centres dengan data yang lebih efisien
      allCentres = allCentres.filter((centre) => {
        return pricesByCentre[centre._id] > 0;
      });
      console.log("Step 7");
      reportsProgressCache.get(reportId).progress = 60;

      // Update progress ke 80%
      reportsProgressCache.get(reportId).progress = 80;

      // Sisa kode untuk membuat PDF
      const BASE_FONT_SIZE = 11;
      const docDefinition = {
        pageMargins: [20, 30, 20, 20],
        pageSize: "A4",
        pageOrientation: "landscape",
        defaultStyle: {
          fontSize: BASE_FONT_SIZE,
        },
        content: [
          {
            text: `Yearly Cocoa Price for `,
            alignment: "center",
            bold: true,
            fontSize: BASE_FONT_SIZE + 3,
          },
          {
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
                  },
                ],
                [
                  {
                    text: "To Year",
                    bold: true,
                  },
                  {
                    text: `: ${params.toYearIds[0]}`,
                  },
                ],
                [
                  {
                    text: "Grade",
                    bold: true,
                  },
                  {
                    text: `: ${params.gradeIds[0]}`,
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
              widths: [30, ...allCentres.map((centre) => 42), 44],
              body: [
                [
                  {
                    text: "Year",
                    italics: true,
                    bold: true,
                    marginTop: 7,
                    marginLeft: 4,
                  },
                  ...allCentres.map((centre) => {
                    return {
                      text: centre.description,
                      bold: true,
                      alignment: "center",
                    };
                  }),
                  {
                    text: "Average",
                    bold: true,
                    alignment: "center",
                    marginTop: 7,
                  },
                ],
                ...(await (async () => {
                  console.log("Step 8");
                  const statCode = GRADE_CODES[params.gradeIds[0]];
                  let table = [];

                  // Menghitung jumlah tahun yang perlu diproses
                  let diffYear = Math.max(
                    0,
                    parseInt(params.toYearIds[0]) -
                      parseInt(params.fromYearIds[0])
                  );
                  if (diffYear >= 0) {
                    diffYear += 1;
                  }

                  // Fungsi untuk mengolah data satu tahun
                  const processYear = (yearIndex) => {
                    const currentYear =
                      parseInt(params.fromYearIds[0]) + yearIndex;

                    // Pra-perhitungan: mengelompokkan data berdasarkan centreId dan date
                    // untuk mengurangi overhead pencarian berulang
                    const pricesByDate = {};

                    allDomesticCocoaPrices.forEach((price) => {
                      if (
                        parseInt(dayjs(price.date).format("YYYY")) ===
                        currentYear
                      ) {
                        const key = `${price.centreId}_${price.date}`;
                        if (!pricesByDate[key]) {
                          pricesByDate[key] = [];
                        }
                        pricesByDate[key].push(price);
                      }
                    });

                    // Struktur data untuk menyimpan rata-rata bulanan per pusat
                    const centreMonthlyAvgs = {};
                    allCentres.forEach((centre) => {
                      centreMonthlyAvgs[centre._id] = {
                        averageList: [],
                        total: 0,
                        count: 0,
                      };
                    });

                    // Proses per bulan untuk setiap pusat
                    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
                      const monthlyTotals = {};
                      const monthlyCounts = {};

                      allCentres.forEach((centre) => {
                        monthlyTotals[centre._id] = 0;
                        monthlyCounts[centre._id] = 0;
                      });

                      const startDate = dayjs()
                        .set("year", currentYear)
                        .set("month", monthIndex)
                        .startOf("month");
                      const endDate = startDate.endOf("month");

                      // Loop melalui setiap hari dalam bulan
                      let currentDate = startDate;
                      while (!currentDate.isAfter(endDate)) {
                        const dateStr = currentDate.format("YYYY-MM-DD");

                        // Proses setiap pusat
                        allCentres.forEach((centre) => {
                          const key = `${centre._id}_${dateStr}`;
                          const pricesForDay = pricesByDate[key] || [];

                          if (pricesForDay.length > 0) {
                            // Hitung rata-rata harian
                            let sumDaily = 0;
                            let countDaily = 0;

                            pricesForDay.forEach((price) => {
                              if (price[statCode] > 0) {
                                sumDaily += price[statCode];
                                countDaily++;
                              }
                            });

                            if (countDaily > 0) {
                              const dailyAvg = Math.round(
                                sumDaily / countDaily
                              );
                              monthlyTotals[centre._id] += dailyAvg;
                              monthlyCounts[centre._id] += 1;
                            }
                          }
                        });

                        currentDate = currentDate.add(1, "day");
                      }

                      // Hitung rata-rata bulanan untuk setiap pusat
                      allCentres.forEach((centre) => {
                        if (monthlyCounts[centre._id] > 0) {
                          const monthlyAvg = Math.round(
                            monthlyTotals[centre._id] /
                              monthlyCounts[centre._id]
                          );
                          centreMonthlyAvgs[centre._id].averageList.push(
                            monthlyAvg
                          );
                        }
                      });
                    }

                    // Hitung rata-rata tahunan per pusat
                    const yearlyAvgs = {};
                    let yearlyTotal = 0;
                    let yearlyCount = 0;

                    allCentres.forEach((centre) => {
                      const avgs = centreMonthlyAvgs[centre._id].averageList;
                      if (avgs.length > 0) {
                        const total = avgs.reduce((sum, val) => sum + val, 0);
                        yearlyAvgs[centre._id] = Math.round(
                          total / avgs.length
                        );

                        yearlyTotal += yearlyAvgs[centre._id];
                        yearlyCount++;
                      }
                    });

                    // Hitung rata-rata keseluruhan
                    const overallAverage =
                      yearlyCount > 0
                        ? Math.round(yearlyTotal / yearlyCount)
                        : 0;

                    // Siapkan baris tabel
                    const tableRow = [
                      {
                        text: currentYear.toString(),
                        marginLeft: 4,
                      },
                    ];

                    allCentres.forEach((centre) => {
                      if (yearlyAvgs[centre._id]) {
                        tableRow.push({
                          text: formatNumber(yearlyAvgs[centre._id]),
                          alignment: "center",
                        });
                      } else {
                        tableRow.push({
                          text: "-",
                          alignment: "center",
                        });
                      }
                    });

                    tableRow.push({
                      text: overallAverage ? formatNumber(overallAverage) : "-",
                      alignment: "center",
                    });

                    return tableRow;
                  };

                  // Penggunaan paralelisme dengan worker_threads jika jumlah tahun cukup banyak
                  if (diffYear > 3 && numCPUs > 1 && isMainThread) {
                    try {
                      console.log(
                        `Memproses ${diffYear} tahun secara paralel dengan ${Math.min(
                          numCPUs,
                          diffYear
                        )} worker`
                      );

                      // Bagi tahun menjadi chunk-chunk berdasarkan jumlah CPU
                      const workerCount = Math.min(numCPUs, diffYear);
                      const chunkSize = Math.ceil(diffYear / workerCount);
                      const chunks = [];

                      for (let i = 0; i < diffYear; i += chunkSize) {
                        const chunk = [];
                        for (
                          let j = 0;
                          j < chunkSize && i + j < diffYear;
                          j++
                        ) {
                          chunk.push(i + j);
                        }
                        chunks.push(chunk);
                      }

                      // Proses chunk menggunakan worker_threads
                      const promises = chunks.map((chunk, index) => {
                        return new Promise((resolve, reject) => {
                          console.log(
                            `Starting worker ${index} for years ${chunk
                              .map(
                                (idx) => parseInt(params.fromYearIds[0]) + idx
                              )
                              .join(", ")}`
                          );

                          const worker = new Worker(__filename, {
                            workerData: {
                              chunk,
                              fromYear: parseInt(params.fromYearIds[0]),
                              statCode,
                              allCentres: allCentres.map((c) => ({
                                _id: c._id,
                                description: c.description,
                              })),
                              allPriceData: allDomesticCocoaPrices,
                            },
                          });

                          worker.on("message", resolve);
                          worker.on("error", (err) => {
                            console.error(`Worker error:`, err);
                            reject(err);
                          });
                          worker.on("exit", (code) => {
                            if (code !== 0) {
                              reject(
                                new Error(`Worker exited with code ${code}`)
                              );
                            }
                          });
                        });
                      });

                      // Gabungkan hasil dari semua worker
                      const results = await Promise.all(promises);
                      const allResults = [].concat(...results);

                      // Urutkan hasil berdasarkan tahun
                      allResults.sort((a, b) => a.year - b.year);

                      // Format hasil untuk tabel
                      allResults.forEach((result) => {
                        const tableRow = [
                          {
                            text: result.year.toString(),
                            marginLeft: 4,
                          },
                        ];

                        allCentres.forEach((centre) => {
                          const centreValue = result.centreValues.find(
                            (cv) => cv.centreId === centre._id
                          );
                          const value =
                            centreValue && centreValue.value
                              ? centreValue.value
                              : 0;

                          tableRow.push({
                            text: value ? formatNumber(value) : "-",
                            alignment: "center",
                          });
                        });

                        tableRow.push({
                          text: result.average
                            ? formatNumber(result.average)
                            : "-",
                          alignment: "center",
                        });

                        table.push(tableRow);
                      });

                      console.log("Paralelisme selesai");
                    } catch (error) {
                      console.error("Error dalam pemrosesan paralel:", error);

                      // Fallback ke metode sekuensial jika terjadi error
                      console.log("Kembali ke metode sekuensial");
                      for (
                        let yearIndex = 0;
                        yearIndex < diffYear;
                        yearIndex++
                      ) {
                        table.push(processYear(yearIndex));
                      }
                    }
                  } else {
                    // Untuk jumlah tahun yang sedikit, proses secara sekuensial
                    for (let yearIndex = 0; yearIndex < diffYear; yearIndex++) {
                      table.push(processYear(yearIndex));
                    }
                  }

                  console.log("Step 9");
                  return table;
                })()),
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

      // Update progress ke 90%
      reportsProgressCache.get(reportId).progress = 90;

      // Buat PDF dan dapatkan URL
      const pdfUrl = await createPdf({
        docDefinition,
        filename: `Yearly Report - Cocoa Price.pdf`,
        prefix: "",
        basePath: "/lkm",
      });

      // Simpan URL hasil laporan di cache
      reportsProgressCache.get(reportId).reportUrl = pdfUrl;
      reportsProgressCache.get(reportId).status = "completed";
      reportsProgressCache.get(reportId).progress = 100;

      // Atur pembersihan cache setelah beberapa waktu
      cleanupReportData(reportId);
    } catch (error) {
      console.error("Error generating report:", error);

      // Update status error di cache
      if (reportsProgressCache.has(reportId)) {
        reportsProgressCache.get(reportId).status = "error";
        reportsProgressCache.get(reportId).error = error.message;
      }

      // Atur pembersihan cache setelah beberapa waktu
      cleanupReportData(reportId);
    }
  });

  // Segera kembalikan ID laporan untuk polling
  return reportId;
};

const generateYearlyAverageCentreReportForDomesticCocoaPrices = async (
  self,
  params,
  context
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
          }
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
          widths: [80, ...allCentres.map((centre) => 44), 44],
          body: [
            [
              {
                text: "Year",
                italics: true,
                bold: true,
                marginTop: 7,
                marginLeft: 4,
              },
              ...allCentres.map((centre) => {
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
                parseInt(params.toYearIds[0]) - parseInt(params.fromYearIds[0])
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

                  allCentres.forEach((centre) => {
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
                            0
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
                  ...allCentres.map((centre) => {
                    let average = 0;
                    if (
                      globalTotal[centre._id] > 0 &&
                      globalCount[centre._id] > 0
                    ) {
                      average = lodash.round(
                        globalTotal[centre._id] / globalCount[centre._id],
                        0
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
                        0
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
                    ...allCentres.map((centre) => {
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

const generateYearlyAverageCentreReportForDomesticCocoaPricesWithGrade = async (
  self,
  params,
  context
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
          }
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
  let toYear = parseInt(params.toYearIds[0]);
  let fromYear = parseInt(params.fromYearIds[0]);
  if (toYear < fromYear) {
    let tmpYear = toYear;
    toYear = fromYear;
    fromYear = tmpYear;
  }
  query.$or.push({
    date: {
      $gte: dayjs().set("year", fromYear).startOf("year").format("YYYY-MM-DD"),
      $lte: dayjs().set("year", toYear).endOf("year").format("YYYY-MM-DD"),
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
        } FROM ${fromYear} TO ${toYear}\nGRADE ${params.gradeIds[0].toUpperCase()}`,
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
          widths: [80, ...allCentres.map((centre) => 44), 44],
          body: [
            [
              {
                text: "Year",
                italics: true,
                bold: true,
                marginTop: 7,
                marginLeft: 4,
              },
              ...allCentres.map((centre) => {
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

              let diffYear = Math.max(0, toYear - fromYear);
              if (diffYear >= 0) {
                diffYear += 1;
              }
              [...new Array(diffYear)].map((_, yearIndex) => {
                const currentYear = parseInt(fromYear) + yearIndex;
                // console.log({ diffYear, currentYear });

                let averageByCentres = {};
                for (const center of allCentres) {
                  let globalStats = {
                    wetPrice: {
                      max: {
                        total: 0,
                        count: 0,
                        average: 0,
                      },
                      min: {
                        total: 0,
                        count: 0,
                        average: 0,
                      },
                      average: {
                        total: 0,
                        count: 0,
                        average: 0,
                      },
                    },
                    smc1: {
                      max: {
                        total: 0,
                        count: 0,
                        average: 0,
                      },
                      min: {
                        total: 0,
                        count: 0,
                        average: 0,
                      },
                      average: {
                        total: 0,
                        count: 0,
                        average: 0,
                      },
                    },
                    smc2: {
                      max: {
                        total: 0,
                        count: 0,
                        average: 0,
                      },
                      min: {
                        total: 0,
                        count: 0,
                        average: 0,
                      },
                      average: {
                        total: 0,
                        count: 0,
                        average: 0,
                      },
                    },
                    smc3: {
                      max: {
                        total: 0,
                        count: 0,
                        average: 0,
                      },
                      min: {
                        total: 0,
                        count: 0,
                        average: 0,
                      },
                      average: {
                        total: 0,
                        count: 0,
                        average: 0,
                      },
                    },
                  };

                  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((monthIndex) => {
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
                      .set("year", currentYear)
                      .endOf("month");
                    let currentDate = dayjs()
                      .set("month", monthIndex)
                      .set("year", currentYear)
                      .startOf("month");

                    do {
                      let pricesPerDates = indexedDomesticCocoaPrices.where({
                        centreId: center._id,
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

                        for (const key of [
                          "wetPrice",
                          "smc1",
                          "smc2",
                          "smc3",
                        ]) {
                          if (!price[key]) continue;
                          prices[groupKey][key] += price[key];

                          if (!prices[groupKey]["count" + key]) {
                            prices[groupKey]["count" + key] = 0;
                          }
                          prices[groupKey]["count" + key] += 1;
                        }
                      }
                      // console.log({ prices });

                      for (const groupKey in prices) {
                        for (const key of [
                          "wetPrice",
                          "smc1",
                          "smc2",
                          "smc3",
                        ]) {
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
                        for (const key of [
                          "wetPrice",
                          "smc1",
                          "smc2",
                          "smc3",
                        ]) {
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
                            ? lodash.round(
                                stats[key].total / stats[key].count,
                                0
                              )
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
                    // console.log(
                    //   "...monthlyStats",
                    //   endDateOfMonth.format("YYYY-MM-DD"),
                    //   monthlyStats
                    // );

                    for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                      monthlyStats[key].average =
                        monthlyStats[key].total > 0 &&
                        monthlyStats[key].count > 0
                          ? lodash.round(
                              monthlyStats[key].total / monthlyStats[key].count,
                              0
                            )
                          : 0;

                      if (!monthlyStats[key].count) continue;

                      if (
                        !globalStats[key].max.max ||
                        globalStats[key].max.max < monthlyStats[key].max
                      ) {
                        globalStats[key].max.max = monthlyStats[key].max;
                      }
                      if (
                        !globalStats[key].min.min ||
                        globalStats[key].min.min > monthlyStats[key].min
                      ) {
                        globalStats[key].min.min = monthlyStats[key].min;
                      }

                      globalStats[key].max.total += monthlyStats[key].max;
                      globalStats[key].max.count += 1;
                      globalStats[key].min.total += monthlyStats[key].min;
                      globalStats[key].min.count += 1;
                      globalStats[key].average.total +=
                        monthlyStats[key].average;
                      globalStats[key].average.count += 1;
                    }

                    // table.push([
                    //   {
                    //     text: endDateOfMonth.format("MMMM"),
                    //     // bold: true,
                    //     // alignment: "center",
                    //     marginLeft: 10,
                    //   },
                    //   //
                    //   {
                    //     text: monthlyStats["wetPrice"].max
                    //       ? formatNumber(monthlyStats["wetPrice"].max)
                    //       : "-",
                    //     // borders: [true, false, true, false],
                    //     alignment: "center",
                    //   },
                    //   {
                    //     text: monthlyStats["wetPrice"].min
                    //       ? formatNumber(monthlyStats["wetPrice"].min)
                    //       : "-",
                    //     // borders: [true, false, true, false],
                    //     alignment: "center",
                    //   },
                    //   {
                    //     text: monthlyStats["wetPrice"].average
                    //       ? formatNumber(monthlyStats["wetPrice"].average)
                    //       : "-",
                    //     // borders: [true, false, true, false],
                    //     alignment: "center",
                    //   },
                    //   //
                    //   {
                    //     text: monthlyStats["smc1"].max
                    //       ? formatNumber(monthlyStats["smc1"].max)
                    //       : "-",
                    //     // borders: [true, false, true, false],
                    //     alignment: "center",
                    //   },
                    //   {
                    //     text: monthlyStats["smc1"].min
                    //       ? formatNumber(monthlyStats["smc1"].min)
                    //       : "-",
                    //     // borders: [true, false, true, false],
                    //     alignment: "center",
                    //   },
                    //   {
                    //     text: monthlyStats["smc1"].average
                    //       ? formatNumber(monthlyStats["smc1"].average)
                    //       : "-",
                    //     // borders: [true, false, true, false],
                    //     alignment: "center",
                    //   },
                    //   //
                    //   {
                    //     text: monthlyStats["smc2"].max
                    //       ? formatNumber(monthlyStats["smc2"].max)
                    //       : "-",
                    //     // borders: [true, false, true, false],
                    //     alignment: "center",
                    //   },
                    //   {
                    //     text: monthlyStats["smc2"].min
                    //       ? formatNumber(monthlyStats["smc2"].min)
                    //       : "-",
                    //     // borders: [true, false, true, false],
                    //     alignment: "center",
                    //   },
                    //   {
                    //     text: monthlyStats["smc2"].average
                    //       ? formatNumber(monthlyStats["smc2"].average)
                    //       : "-",
                    //     // borders: [true, false, true, false],
                    //     alignment: "center",
                    //   },
                    //   //
                    //   {
                    //     text: monthlyStats["smc3"].max
                    //       ? formatNumber(monthlyStats["smc3"].max)
                    //       : "-",
                    //     // borders: [true, false, true, false],
                    //     alignment: "center",
                    //   },
                    //   {
                    //     text: monthlyStats["smc3"].min
                    //       ? formatNumber(monthlyStats["smc3"].min)
                    //       : "-",
                    //     // borders: [true, false, true, false],
                    //     alignment: "center",
                    //   },
                    //   {
                    //     text: monthlyStats["smc3"].average
                    //       ? formatNumber(monthlyStats["smc3"].average)
                    //       : "-",
                    //     // borders: [true, false, true, false],
                    //     alignment: "center",
                    //   },
                    // ]);
                  });
                  // console.log(globalStats);

                  for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                    for (const subkey of ["max", "min", "average"]) {
                      globalStats[key][subkey].average =
                        globalStats[key][subkey].total > 0 &&
                        globalStats[key][subkey].count > 0
                          ? lodash.round(
                              globalStats[key][subkey].total /
                                globalStats[key][subkey].count,
                              0
                            )
                          : 0;
                    }
                  }

                  averageByCentres[center._id] = globalStats;
                }
                // console.log({ params });

                const selectedGrade = GRADE_CODES[params.gradeIds[0]];

                let total = 0,
                  count = 0;
                table.push([
                  {
                    text: currentYear,
                    // bold: true,
                    // alignment: "center",
                    marginLeft: 4,
                    // fillColor: "#f0f0f0",
                  },
                  //
                  ...allCentres.map((centre) => {
                    const globalStats = averageByCentres[centre._id] || {};
                    const average = globalStats[selectedGrade].average.average;

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
                        0
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
                    ...allCentres.map((centre) => {
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
  generateYearlyAverageCentreReportForDomesticCocoaPricesWithGrade,
  getReportProgress,
};
