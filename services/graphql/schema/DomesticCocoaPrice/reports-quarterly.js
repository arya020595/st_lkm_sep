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

const generateQuarterlySummaryReportForDomesticCocoaPrices = async (
  self,
  params,
  context
) => {
  // console.log("generateQuarterlySummaryReportForDomesticCocoaPrices", params);
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
    if (params.quarterIds.length === 0) {
      query.$or.push({
        date: {
          $gte: dayjs().set("year", year).startOf("year").format("YYYY-MM-DD"),
          $lte: dayjs().set("year", year).endOf("year").format("YYYY-MM-DD"),
        },
      });
    } else {
      for (const month of params.quarterIds) {
        query.$or.push({
          date: {
            $gte: dayjs()
              .set("year", year)
              .set("month", (parseInt(month) - 1) * 3 - 1)
              .startOf("month")
              .format("YYYY-MM-DD"),
            $lte: dayjs()
              .set("year", year)
              .set("month", parseInt(month) * 3 - 1)
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
  console.log(JSON.stringify({ params, query }, null, 4));
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
                  { text: "Maklumat Harga Sukuan Koko Pada:", bold: true },
                  { text: "\nQuarterly Cocoa Price on", italics: true },
                ],
              },
              {
                text: `Quarter ${params.quarterIds[0]} ${dayjs()
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
                const prices = indexedDomesticCocoaPrices.where({
                  centreId: centre._id,
                });
                if (prices.length === 0) {
                  continue;
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
    filename: `Quarterly Report - Summary.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateQuarterlyAverageReportForDomesticCocoaPrices = async (
  self,
  params,
  context
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
        // text: `QUARTERLY AVERAGE PRICES`,
        text: `QUARTERLY AVERAGE PRICES FOR ${(
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

              let allStats = {
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

              let quarterlyStats = {
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

              [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((monthIndex) => {
                let monthlyStats = {
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

                const endDateOfMonth = dayjs()
                  .set("month", monthIndex)
                  .set("year", params.yearIds[0])
                  .endOf("month");
                let currentDate = dayjs()
                  .set("month", monthIndex)
                  .set("year", params.yearIds[0])
                  .startOf("month");

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

                for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                  if (!!monthlyStats[key].max) {
                    quarterlyStats[key].max.push(monthlyStats[key].max);
                    allStats[key].max.push(monthlyStats[key].max);
                  }
                  if (!!monthlyStats[key].min) {
                    quarterlyStats[key].min.push(monthlyStats[key].min);
                    allStats[key].min.push(monthlyStats[key].min);
                  }
                  if (!!monthlyStats[key].average) {
                    quarterlyStats[key].average.push(monthlyStats[key].average);
                    allStats[key].average.push(monthlyStats[key].average);
                  }
                }

                if (monthIndex % 3 === 2) {
                  // console.log(
                  //   `Average (Q${(monthIndex + 1) / 3}) => Before`,
                  //   quarterlyStats,
                  // );

                  for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                    if (quarterlyStats[key].max.length > 0) {
                      let sum = quarterlyStats[key].max.reduce(
                        (sum, value) => sum + value,
                        0
                      );
                      let count = quarterlyStats[key].max.length;
                      quarterlyStats[key].max =
                        sum > 0 && count > 0 ? Math.round(sum / count, 0) : 0;
                    } else {
                      quarterlyStats[key].max = "";
                    }
                    if (quarterlyStats[key].min.length > 0) {
                      let sum = quarterlyStats[key].min.reduce(
                        (sum, value) => sum + value,
                        0
                      );
                      let count = quarterlyStats[key].min.length;
                      quarterlyStats[key].min =
                        sum > 0 && count > 0 ? Math.round(sum / count, 0) : 0;
                    } else {
                      quarterlyStats[key].min = "";
                    }
                    if (quarterlyStats[key].average.length > 0) {
                      let sum = quarterlyStats[key].average.reduce(
                        (sum, value) => sum + value,
                        0
                      );
                      let count = quarterlyStats[key].average.length;
                      quarterlyStats[key].average =
                        sum > 0 && count > 0 ? Math.round(sum / count, 0) : 0;
                    } else {
                      quarterlyStats[key].average = "";
                    }
                  }
                  // console.log(
                  //   `Average (Q${(monthIndex + 1) / 3}) => After`,
                  //   quarterlyStats,
                  // );

                  table.push([
                    {
                      text: `Average (Q${(monthIndex + 1) / 3})`,
                      bold: true,
                      // alignment: "center",
                      fillColor: "#f0f0f0",
                      marginLeft: 10,
                    },
                    //
                    {
                      text: quarterlyStats["wetPrice"].max
                        ? formatNumber(quarterlyStats["wetPrice"].max)
                        : "-",
                      bold: true,
                      // borders: [true, false, true, false],
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    {
                      text: quarterlyStats["wetPrice"].min
                        ? formatNumber(quarterlyStats["wetPrice"].min)
                        : "-",
                      bold: true,
                      // borders: [true, false, true, false],
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    {
                      text: quarterlyStats["wetPrice"].average
                        ? formatNumber(quarterlyStats["wetPrice"].average)
                        : "-",
                      bold: true,
                      // borders: [true, false, true, false],
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    //
                    {
                      text: quarterlyStats["smc1"].max
                        ? formatNumber(quarterlyStats["smc1"].max)
                        : "-",
                      bold: true,
                      // borders: [true, false, true, false],
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    {
                      text: quarterlyStats["smc1"].min
                        ? formatNumber(quarterlyStats["smc1"].min)
                        : "-",
                      bold: true,
                      // borders: [true, false, true, false],
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    {
                      text: quarterlyStats["smc1"].average
                        ? formatNumber(quarterlyStats["smc1"].average)
                        : "-",
                      bold: true,
                      // borders: [true, false, true, false],
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    //
                    {
                      text: quarterlyStats["smc2"].max
                        ? formatNumber(quarterlyStats["smc2"].max)
                        : "-",
                      bold: true,
                      // borders: [true, false, true, false],
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    {
                      text: quarterlyStats["smc2"].min
                        ? formatNumber(quarterlyStats["smc2"].min)
                        : "-",
                      bold: true,
                      // borders: [true, false, true, false],
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    {
                      text: quarterlyStats["smc2"].average
                        ? formatNumber(quarterlyStats["smc2"].average)
                        : "-",
                      bold: true,
                      // borders: [true, false, true, false],
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    //
                    {
                      text: quarterlyStats["smc3"].max
                        ? formatNumber(quarterlyStats["smc3"].max)
                        : "-",
                      bold: true,
                      // borders: [true, false, true, false],
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    {
                      text: quarterlyStats["smc3"].min
                        ? formatNumber(quarterlyStats["smc3"].min)
                        : "-",
                      bold: true,
                      // borders: [true, false, true, false],
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                    {
                      text: quarterlyStats["smc3"].average
                        ? formatNumber(quarterlyStats["smc3"].average)
                        : "-",
                      bold: true,
                      // borders: [true, false, true, false],
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                  ]);
                  quarterlyStats = {
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
                }
              });

              for (const key of ["wetPrice", "smc1", "smc2", "smc3"]) {
                if (allStats[key].max.length > 0) {
                  let sum = allStats[key].max.reduce(
                    (sum, value) => sum + value,
                    0
                  );
                  let count = allStats[key].max.length;
                  allStats[key].max =
                    sum > 0 && count > 0 ? Math.round(sum / count, 0) : 0;
                } else {
                  allStats[key].max = "";
                }
                if (allStats[key].min.length > 0) {
                  let sum = allStats[key].min.reduce(
                    (sum, value) => sum + value,
                    0
                  );
                  let count = allStats[key].min.length;
                  allStats[key].min =
                    sum > 0 && count > 0 ? Math.round(sum / count, 0) : 0;
                } else {
                  allStats[key].min = "";
                }
                if (allStats[key].average.length > 0) {
                  let sum = allStats[key].average.reduce(
                    (sum, value) => sum + value,
                    0
                  );
                  let count = allStats[key].average.length;
                  allStats[key].average =
                    sum > 0 && count > 0 ? Math.round(sum / count, 0) : 0;
                } else {
                  allStats[key].average = "";
                }
              }
              table.push([
                {
                  text: `Total Average`,
                  bold: true,
                  // alignment: "center",
                  fillColor: "#f0f0f0",
                  marginLeft: 10,
                },
                //
                {
                  text: " ",
                  bold: true,
                  // borders: [true, false, true, false],
                  alignment: "center",
                  fillColor: "#f0f0f0",
                  colSpan: 2,
                },
                {
                  text: " ",
                  bold: true,
                  // borders: [true, false, true, false],
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                {
                  text: allStats["wetPrice"].average
                    ? formatNumber(allStats["wetPrice"].average)
                    : "-",
                  bold: true,
                  // borders: [true, false, true, false],
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                //
                {
                  text: " ",
                  bold: true,
                  // borders: [true, false, true, false],
                  alignment: "center",
                  fillColor: "#f0f0f0",
                  colSpan: 2,
                },
                {
                  text: " ",
                  bold: true,
                  // borders: [true, false, true, false],
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                {
                  text: allStats["smc1"].average
                    ? formatNumber(allStats["smc1"].average)
                    : "-",
                  bold: true,
                  // borders: [true, false, true, false],
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                //
                {
                  text: " ",
                  bold: true,
                  // borders: [true, false, true, false],
                  alignment: "center",
                  fillColor: "#f0f0f0",
                  colSpan: 2,
                },
                {
                  text: " ",
                  bold: true,
                  // borders: [true, false, true, false],
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                {
                  text: allStats["smc2"].average
                    ? formatNumber(allStats["smc2"].average)
                    : "-",
                  bold: true,
                  // borders: [true, false, true, false],
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                //
                {
                  text: " ",
                  bold: true,
                  // borders: [true, false, true, false],
                  alignment: "center",
                  fillColor: "#f0f0f0",
                  colSpan: 2,
                },
                {
                  text: " ",
                  bold: true,
                  // borders: [true, false, true, false],
                  alignment: "center",
                  fillColor: "#f0f0f0",
                },
                {
                  text: allStats["smc3"].average
                    ? formatNumber(allStats["smc3"].average)
                    : "-",
                  bold: true,
                  // borders: [true, false, true, false],
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
    filename: `Quarterly Report - Average.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateQuarterlyCocoaPriceReportForDomesticCocoaPrices = async (
  self,
  params,
  context
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

  allCentres = allCentres.filter((centre) => {
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
        // text: `QUARTERLY COCOA PRICES`,
        text: `QUARTERLY COCOA PRICES FOR ${(
          params.gradeIds[0] || ""
        ).toUpperCase()} IN ${dayjs()
          .set("year", params.yearIds[0])
          .format("MMMM YYYY")
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
          widths: [80, ...allCentres.map((centre) => 44), 44],
          body: [
            [
              {
                text: "Quarterly",
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
              let allStats = {};
              let quarterlyStats = {};

              [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((monthIndex) => {
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
                      if (value > 0) {
                        stats[statCode].total += value;
                        stats[statCode].count += 1;
                      }
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
                } while (!currentDate.isAfter(endDateOfMonth));

                let total = 0,
                  count = 0;
                table.push([
                  {
                    text: endDateOfMonth.format("MMMM"),
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

                    if (average) {
                      if (!quarterlyStats[centre._id]) {
                        quarterlyStats[centre._id] = [];
                      }
                      quarterlyStats[centre._id].push(average);

                      if (!allStats[centre._id]) {
                        allStats[centre._id] = [];
                      }
                      allStats[centre._id].push(average);
                    }

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

                        const average = lodash.round(total / count, 0);
                        quarterlyStats["Average"].push(average);

                        if (!allStats["Average"]) {
                          allStats["Average"] = [];
                        }
                        allStats["Average"].push(average);

                        return formatNumber(average);
                      }
                      return "-";
                    })(),
                    // bold: true,
                    alignment: "center",
                    // fillColor: "#f0f0f0",
                  },
                ]);

                if (monthIndex % 3 === 2) {
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
                      text: `Average (Q${(monthIndex + 1) / 3})`,
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
                    {
                      text: quarterlyStats["Average"]
                        ? formatNumber(quarterlyStats["Average"])
                        : "-",
                      bold: true,
                      alignment: "center",
                      fillColor: "#f0f0f0",
                    },
                  ]);

                  quarterlyStats = {};
                }
              });

              for (const key in allStats) {
                if (allStats[key].length > 0) {
                  let sum = allStats[key].reduce(
                    (sum, value) => sum + value,
                    0
                  );
                  let count = allStats[key].length;
                  allStats[key] =
                    sum > 0 && count > 0 ? Math.round(sum / count, 0) : 0;
                } else {
                  allStats[key] = "";
                }
              }

              table.push([
                {
                  text: `Total Average`,
                  bold: true,
                  // alignment: "center",
                  marginLeft: 4,
                  fillColor: "#f0f0f0",
                },
                //
                ...allCentres.map((centre) => {
                  return {
                    text: allStats[centre._id]
                      ? formatNumber(allStats[centre._id])
                      : "-",
                    bold: true,
                    alignment: "center",
                    // marginTop: 14,
                    fillColor: "#f0f0f0",
                  };
                }),
                {
                  text: allStats["Average"]
                    ? formatNumber(allStats["Average"])
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
    filename: `Quarterly Report - Cocoa Price.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

module.exports = {
  generateQuarterlySummaryReportForDomesticCocoaPrices,
  generateQuarterlyAverageReportForDomesticCocoaPrices,
  generateQuarterlyCocoaPriceReportForDomesticCocoaPrices,
};
