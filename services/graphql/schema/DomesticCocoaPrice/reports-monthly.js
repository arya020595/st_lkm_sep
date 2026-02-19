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

const generateMonthlySummaryReportForDomesticCocoaPrices = async (
  self,
  params,
  context,
) => {
  // console.log("generateMonthlySummaryReportForDomesticCocoaPrices", params);
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
                  { text: "Maklumat Harga Bulanan Koko Pada:", bold: true },
                  { text: "\nMonthly Cocoa Price on", italics: true },
                ],
              },
              {
                text: `${dayjs()
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

                // prices = pricesPerDates;
                // console.log(
                //   centre.description,
                //   pricesPerDates.length,
                //   pricesPerDates[0],
                //   prices.length,
                //   prices[0],
                // );

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
    filename: `Monthly Report - Summary.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateMonthlyAverageReportForDomesticCocoaPrices = async (
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
    query.$or.push({
      date: {
        $gte: dayjs().set("year", year).startOf("year").format("YYYY-MM-DD"),
        $lte: dayjs().set("year", year).endOf("year").format("YYYY-MM-DD"),
      },
    });
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
        // text: `MONTHLY AVERAGE PRICES`,
        text: `MONTHLY AVERAGE PRICES FOR ${(
          allCentres[0]?.description || ""
        ).toUpperCase()} IN ${dayjs()
          .set("year", params.yearIds[0])
          .format("YYYY")
          .toUpperCase()}`,
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
                text: "Monthly",
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
                  globalStats[key].max.total += monthlyStats[key].max;
                  globalStats[key].max.count += 1;
                  globalStats[key].min.total += monthlyStats[key].min;
                  globalStats[key].min.count += 1;
                  globalStats[key].average.total += monthlyStats[key].average;
                  globalStats[key].average.count += 1;
                }
                table.push([
                  {
                    text: endDateOfMonth.format("MMMM"),
                    // bold: true,
                    // alignment: "center",
                    marginLeft: 10,
                  },
                  //
                  {
                    text: monthlyStats["wetPrice"].max
                      ? formatNumber(monthlyStats["wetPrice"].max)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: monthlyStats["wetPrice"].min
                      ? formatNumber(monthlyStats["wetPrice"].min)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: monthlyStats["wetPrice"].average
                      ? formatNumber(monthlyStats["wetPrice"].average)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  //
                  {
                    text: monthlyStats["smc1"].max
                      ? formatNumber(monthlyStats["smc1"].max)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: monthlyStats["smc1"].min
                      ? formatNumber(monthlyStats["smc1"].min)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: monthlyStats["smc1"].average
                      ? formatNumber(monthlyStats["smc1"].average)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  //
                  {
                    text: monthlyStats["smc2"].max
                      ? formatNumber(monthlyStats["smc2"].max)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: monthlyStats["smc2"].min
                      ? formatNumber(monthlyStats["smc2"].min)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: monthlyStats["smc2"].average
                      ? formatNumber(monthlyStats["smc2"].average)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  //
                  {
                    text: monthlyStats["smc3"].max
                      ? formatNumber(monthlyStats["smc3"].max)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: monthlyStats["smc3"].min
                      ? formatNumber(monthlyStats["smc3"].min)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                  {
                    text: monthlyStats["smc3"].average
                      ? formatNumber(monthlyStats["smc3"].average)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                ]);
              });

              for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                for (const subkey of ["max", "min", "average"]) {
                  globalStats[key][subkey].average =
                    globalStats[key][subkey].total > 0 &&
                    globalStats[key][subkey].count > 0
                      ? lodash.round(
                          globalStats[key][subkey].total /
                            globalStats[key][subkey].count,
                          0,
                        )
                      : 0;
                }
              }
              table.push([
                {
                  text: "Average",
                  bold: true,
                  // alignment: "center",
                  marginLeft: 10,
                },
                //
                {
                  text: globalStats["wetPrice"].max.average
                    ? formatNumber(globalStats["wetPrice"].max.average)
                    : "-",
                  // borders: [true, false, true, false],
                  bold: true,
                  alignment: "center",
                },
                {
                  text: globalStats["wetPrice"].min.average
                    ? formatNumber(globalStats["wetPrice"].min.average)
                    : "-",
                  // borders: [true, false, true, false],
                  bold: true,
                  alignment: "center",
                },
                {
                  text: globalStats["wetPrice"].average.average
                    ? formatNumber(globalStats["wetPrice"].average.average)
                    : "-",
                  // borders: [true, false, true, false],
                  bold: true,
                  alignment: "center",
                },
                //
                {
                  text: globalStats["smc1"].max.average
                    ? formatNumber(globalStats["smc1"].max.average)
                    : "-",
                  // borders: [true, false, true, false],
                  bold: true,
                  alignment: "center",
                },
                {
                  text: globalStats["smc1"].min.average
                    ? formatNumber(globalStats["smc1"].min.average)
                    : "-",
                  // borders: [true, false, true, false],
                  bold: true,
                  alignment: "center",
                },
                {
                  text: globalStats["smc1"].average.average
                    ? formatNumber(globalStats["smc1"].average.average)
                    : "-",
                  // borders: [true, false, true, false],
                  bold: true,
                  alignment: "center",
                },
                //
                {
                  text: globalStats["smc2"].max.average
                    ? formatNumber(globalStats["smc2"].max.average)
                    : "-",
                  // borders: [true, false, true, false],
                  bold: true,
                  alignment: "center",
                },
                {
                  text: globalStats["smc2"].min.average
                    ? formatNumber(globalStats["smc2"].min.average)
                    : "-",
                  // borders: [true, false, true, false],
                  bold: true,
                  alignment: "center",
                },
                {
                  text: globalStats["smc2"].average.average
                    ? formatNumber(globalStats["smc2"].average.average)
                    : "-",
                  // borders: [true, false, true, false],
                  bold: true,
                  alignment: "center",
                },
                //
                {
                  text: globalStats["smc3"].max.average
                    ? formatNumber(globalStats["smc3"].max.average)
                    : "-",
                  // borders: [true, false, true, false],
                  bold: true,
                  alignment: "center",
                },
                {
                  text: globalStats["smc3"].min.average
                    ? formatNumber(globalStats["smc3"].min.average)
                    : "-",
                  // borders: [true, false, true, false],
                  bold: true,
                  alignment: "center",
                },
                {
                  text: globalStats["smc3"].average.average
                    ? formatNumber(globalStats["smc3"].average.average)
                    : "-",
                  // borders: [true, false, true, false],
                  bold: true,
                  alignment: "center",
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
    filename: `Monthly Report - Average.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateMonthlyCocoaPriceReportForDomesticCocoaPrices = async (
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
      transferFromTemporaryId: {
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
  allCentres = allCentres.filter(centre => {
    const prices = indexedDomesticCocoaPrices.where({
      centreId: centre._id,
    });
    if (prices.length > 0) {
      if (GRADE_CODES[params.gradeIds[0]] === "smc1") {
        const len = prices.filter(p => p.smc1 > 0);
        if (len.length > 0) {
          return centre;
        }
      } else if (GRADE_CODES[params.gradeIds[0]] === "smc2") {
        const len = prices.filter(p => p.smc2 > 0);
        if (len.length > 0) {
          return centre;
        }
      } else if (GRADE_CODES[params.gradeIds[0]] === "smc3") {
        const len = prices.filter(p => p.smc3 > 0);
        if (len.length > 0) {
          return centre;
        }
      } else {
        const len = prices.filter(p => p.wetPrice > 0);
        if (len.length > 0) {
          return centre;
        }
      }
    }
    // return prices.length > 0;
  });

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
        // text: `MONTHLY COCOA PRICES`,
        // text: `MONTHLY COCOA PRICES FOR ${(
        //   params.gradeIds[0] || ""
        // ).toUpperCase()} IN ${dayjs()
        //   .set("year", params.yearIds[0])
        //   .format("MMMM YYYY")
        //   .toUpperCase()}`,
        text: `Monthly Cocoa Prices For ${dayjs()
          .set("year", params.yearIds[0])
          .format("YYYY")
          .toUpperCase()}`,
        alignment: "center",
        bold: true,
        fontSize: BASE_FONT_SIZE + 3,
      },
      {
        text: `Gred - ${(params.gradeIds[0] || "").toUpperCase()}`,
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
                text: "Grade",
                bold: true,
              },
              {
                text: `: ${params.gradeIds[0]} (${
                  params.gradeIds[0].startsWith("SMC") ? "RM/Tonne" : "Cents/Kg"
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
                text: "Monthly",
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

              let globalStats = {};

              //#### Update 2024-12-12 ####
              let totalAveragePerCentre = {};
              let totalAverageGlobal = [];
              //########
              [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(monthIndex => {
                let globalTotal = {},
                  globalCount = {};

                const endDateOfMonth = dayjs()
                  .set("month", monthIndex)
                  .set("year", params.yearIds[0])
                  .endOf("month");
                let currentDate = dayjs()
                  .set("month", monthIndex)
                  .set("year", params.yearIds[0])
                  .startOf("month");

                const statCode = GRADE_CODES[params.gradeIds[0]];
                do {
                  // const prices = indexedDomesticCocoaPrices.where({
                  //   date: currentDate.format("YYYY-MM-DD"),
                  // });

                  allCentres.forEach(centre => {
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
                      if (value > 0) {
                        stats[statCode].total += value;
                        stats[statCode].count += 1;
                      }
                    }

                    if (!globalStats[centre._id]) {
                      globalStats[centre._id] = {
                        average: 0,
                        total: 0,
                        count: 0,
                      };
                    }
                    globalStats[centre._id].total += stats[statCode].total;
                    globalStats[centre._id].count += stats[statCode].count;

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

                    if (stats[statCode].total) {
                      if (!globalTotal[centre._id]) {
                        globalTotal[centre._id] = 0;
                      }
                      globalTotal[centre._id] += stats[statCode].total;
                      if (!globalCount[centre._id]) {
                        globalCount[centre._id] = 0;
                      }
                      globalCount[centre._id] += 1;
                    }

                    // if (centre.description === "Tawau" && monthIndex === 0) {
                    //   console.log(currentDate.format("YYYY-MM-DD"), stats);
                    // }
                  });

                  currentDate = currentDate.add(1, "day");
                } while (!currentDate.isAfter(endDateOfMonth));

                let total = 0,
                  count = 0;
                table.push([
                  {
                    text: endDateOfMonth.format("MMMM"),
                    bold: true,
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

                      //#### Update 2024-12-12 ####
                      if (!totalAveragePerCentre[centre._id]) {
                        totalAveragePerCentre[centre._id] = {
                          averageList: [],
                        };
                      }
                      totalAveragePerCentre[centre._id].averageList.push(
                        average,
                      );

                      totalAverageGlobal.push(average);
                      //##########################
                      total += average;
                      count += 1;
                    }
                    // if (centre.description === "Tawau") {
                    //   console.log(
                    //     centre.description,
                    //     globalTotal[centre._id],
                    //     globalCount[centre._id],
                    //     average,
                    //   );
                    // }

                    return {
                      text: average ? formatNumber(average) : "-",
                      bold: true,
                      alignment: "center",
                      // marginTop: 14,
                      // fillColor: "#f0f0f0",
                    };
                  }),
                  {
                    text: (() => {
                      if (total > 0 && count > 0) {
                        const average = lodash.round(total / count, 0);
                        return formatNumber(average);
                      }
                      return "-";
                    })(),
                    bold: true,
                    alignment: "center",
                    // fillColor: "#f0f0f0",
                  },
                ]);
              });

              let total = 0,
                count = 0;
              table.push([
                {
                  text: "Average",
                  bold: true,
                  // alignment: "center",
                  marginLeft: 4,
                },
                //
                ...allCentres.map(centre => {
                  globalStats[centre._id].average =
                    globalStats[centre._id].total > 0 &&
                    globalStats[centre._id].count > 0
                      ? lodash.round(
                          globalStats[centre._id].total /
                            globalStats[centre._id].count,
                          0,
                        )
                      : 0;
                  if (globalStats[centre._id].average) {
                    total += globalStats[centre._id].average;
                    count += 1;
                  }

                  //#### Update 2024-12-12 ####
                  const totalAvg = totalAveragePerCentre[
                    centre._id
                  ].averageList.reduce((acc, curr) => acc + curr, 0);
                  const avgLength =
                    totalAveragePerCentre[centre._id].averageList.length;

                  let avg = 0;
                  if (totalAvg > 0 && avgLength > 0) {
                    avg = totalAvg / avgLength;
                  }
                  //##########################
                  return {
                    // text: globalStats[centre._id].average
                    //   ? formatNumber(globalStats[centre._id].average)
                    //   : "-",

                    text: avg ? formatNumber(avg) : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                    bold: true,
                  };
                }),
                //
                {
                  text: (() => {
                    if (total > 0 && count > 0) {
                      // const average = lodash.round(total / count, 0);
                      // return formatNumber(average)
                      //#### Update 2024-12-12 ####
                      const totalAvg = totalAverageGlobal.reduce(
                        (acc, curr) => acc + curr,
                        0,
                      );
                      const avgLength = totalAverageGlobal.length;

                      return formatNumber(totalAvg / avgLength);
                      //##########################
                    }
                    return "-";
                  })(),
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
    filename: `Monthly Report - Cocoa Price.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

module.exports = {
  generateMonthlySummaryReportForDomesticCocoaPrices,
  generateMonthlyAverageReportForDomesticCocoaPrices,
  generateMonthlyCocoaPriceReportForDomesticCocoaPrices,
};
