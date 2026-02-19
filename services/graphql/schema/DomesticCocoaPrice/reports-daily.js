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
const lodash = require("lodash");
const FlexSearch = require("flexsearch");

const axios = require("axios");
const fs = require("fs");
const base64Img = require("base64-img");
const { formatNumber } = require("../../libs/numbers");

const generateDailySummaryReportForDomesticCocoaPrices = async (
  self,
  params,
  context,
) => {
  assertValidSession(context.activeSession);
  // console.log({ params });

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  const REGION_PRIORITIES = {
    // Sabah
    "e2276b79-539f-4d04-8acc-28615fd64d81": 1,
    // Semenanjung Malaysia
    "d1d12588-17da-4bd6-ab5f-f84cd325b14a": 2,
    // Sarawak
    "525e55e1-5f44-4897-83dc-1dfe7db30d26": 3,
  };
  let allCentres = await context
    .collection("Centres")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  console.log("allCentres", allCentres);
  allCentres = allCentres.map(centre => {
    const priority = REGION_PRIORITIES[centre.regionId] || 100;
    return {
      ...centre,
      priority,
    };
  });
  allCentres = lodash.orderBy(allCentres, ["priority"], ["asc"]);
  const indexedCentres = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["code"],
    },
  });
  indexedCentres.add(allCentres);

  await context.collection("DomesticCocoaPrices").createIndex({
    date: 1,
  });
  await context.collection("DomesticCocoaPrices").createIndex({
    date: 1,
  });
  const allDomesticCocoaPrices = await context
    .collection("DomesticCocoaPrices")
    .find({
      date: params.date,
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
          widths: [210, 400, 200],
          body: [
            [
              {
                text: [
                  { text: "Maklumat Harga Harian Koko pada Hari:", bold: true },
                  { text: "\nDaily Cocoa Price on", italics: true },
                ],
              },
              {
                text: dayjs(params.date)
                  .locale("ms-my")
                  .format("dddd, DD MMMM YYYY"),
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
                if (prices.length === 0) continue;
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
              // table.push([
              //   {
              //     text: "Average",
              //     bold: true,
              //     // alignment: "center",
              //   },
              //   //
              //   {
              //     text: " ",
              //     // borders: [true, false, true, false],
              //     alignment: "center",
              //     colSpan: 2,
              //   },
              //   {
              //     text: " ",
              //     // borders: [true, false, true, false],
              //     alignment: "center",
              //   },
              //   {
              //     text: globalStats["wetPrice"].average || "-",
              //     // borders: [true, false, true, false],
              //     alignment: "center",
              //     bold: true,
              //   },
              //   //
              //   {
              //     text: " ",
              //     // borders: [true, false, true, false],
              //     alignment: "center",
              //     colSpan: 2,
              //   },
              //   {
              //     text: " ",
              //     // borders: [true, false, true, false],
              //     alignment: "center",
              //   },
              //   {
              //     text: globalStats["smc1"].average || "-",
              //     // borders: [true, false, true, false],
              //     alignment: "center",
              //     bold: true,
              //   },
              //   //
              //   {
              //     text: " ",
              //     // borders: [true, false, true, false],
              //     alignment: "center",
              //     colSpan: 2,
              //   },
              //   {
              //     text: " ",
              //     // borders: [true, false, true, false],
              //     alignment: "center",
              //   },
              //   {
              //     text: globalStats["smc2"].average || "-",
              //     // borders: [true, false, true, false],
              //     alignment: "center",
              //     bold: true,
              //   },
              //   //
              //   {
              //     text: " ",
              //     // borders: [true, false, true, false],
              //     alignment: "center",
              //     colSpan: 2,
              //   },
              //   {
              //     text: " ",
              //     // borders: [true, false, true, false],
              //     alignment: "center",
              //   },
              //   {
              //     text: globalStats["smc3"].average || "-",
              //     // borders: [true, false, true, false],
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
        unbreakable: true,
        marginTop: 20,
        layout: {
          ...noBorderTableLayout,
          paddingTop: () => 0,
          paddingBottom: () => 0,
          paddingLeft: () => 3,
          paddingRight: () => 3,
        },
        table: {
          widths: [290, 200, 290],
          body: [
            [
              {
                bold: true,
                text: params.signersName?.[1] ? "Disediakan Oleh" : "",
                alignment: "center",
              },
              " ",
              {
                bold: true,
                text: params.signersName?.[0] ? "Disemak Oleh" : "",
                alignment: "center",
              },
            ],
            [
              {
                bold: true,
                italics: true,
                text: params.signersName?.[1] ? "Prepared By" : "",
                alignment: "center",
              },
              " ",
              {
                bold: true,
                italics: true,
                text: params.signersName?.[0] ? "Checked By" : "",
                alignment: "center",
              },
            ],
            [
              {
                marginTop: 40,
                bold: true,
                text: params.signersName?.[1]
                  ? "___________________________"
                  : "",
                alignment: "center",
              },
              " ",
              {
                marginTop: 40,
                bold: true,
                text: params.signersName?.[0]
                  ? "___________________________"
                  : "",
                alignment: "center",
              },
            ],
            [
              {
                bold: true,
                text: params.signersName?.[1] || "",
                alignment: "center",
              },
              " ",
              {
                bold: true,
                text: params.signersName?.[0] || "",
                alignment: "center",
              },
            ],
          ],
        },
      },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Daily Report - Summary.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateDailyAverageReportForDomesticCocoaPrices = async (
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
        text: `DAILY AVERAGE PRICES FOR ${(
          allCentres[0]?.description || ""
        ).toUpperCase()} IN ${dayjs()
          .set("month", params.monthIds[0])
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
                text: "Day",
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

              const endDateOfMonth = dayjs()
                .set("month", params.monthIds[0])
                .set("year", params.yearIds[0])
                .endOf("month");
              let currentDate = dayjs()
                .set("month", params.monthIds[0])
                .set("year", params.yearIds[0])
                .startOf("month");
              do {
                const prices = indexedDomesticCocoaPrices.where({
                  date: currentDate.format("YYYY-MM-DD"),
                });
                if (prices.length === 0) {
                  currentDate = currentDate.add(1, "day");
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
                // console.log(currentDate.format("YYYY-MM-DD"), prices.length, {
                //   stats,
                // });

                table.push([
                  {
                    text: currentDate.format("DD dddd"),
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
        marginTop: 100,
        text: "Source: Prices/Domestic/Daily Report/Average",
      },
      {
        marginTop: -12,
        text: `Date: ${dayjs().locale("ms-my").format("DD MMMM YYYY")}`,
        alignment: "right",
      },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Daily Report - Average.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateDailyCocoaPriceReportForDomesticCocoaPrices = async (
  self,
  params,
  context,
) => {
  assertValidSession(context.activeSession);
  // console.log("generateDailyCocoaPriceReportForDomesticCocoaPrices");

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

  let query = {};
  for (const year of params.yearIds) {
    query.date = {
      $gte: dayjs().set("year", year).startOf("year").format("YYYY-MM-DD"),
      $lte: dayjs().set("year", year).endOf("year").format("YYYY-MM-DD"),
    };
  }

  await context.collection("DomesticCocoaPrices").createIndex({
    date: 1,
  });
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

  const GRADE_CODES = {
    "Wet Cocoa Beans": "wetPrice",
    "SMC 1": "smc1",
    "SMC 2": "smc2",
    "SMC 3": "smc3",
  };

  const statCode = GRADE_CODES[params.gradeIds[0]];
  allCentres = allCentres.filter(centre => {
    let prices = indexedDomesticCocoaPrices.where({
      centreId: centre._id,
    });
    prices = prices.filter(price => price[statCode] > 0);
    // if (centre.description === "Kuching") {
    //   console.log({ centre, prices });
    // }
    return prices.length > 0;
  });

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
        text: `DAILY COCOA PRICES FOR ${dayjs()
          .set("month", params.monthIds[0])
          .set("year", params.yearIds[0])
          .format("MMMM, YYYY")
          .toUpperCase()}\nGRADE ${params.gradeIds
          .map(gradeId => gradeId.toUpperCase())
          .join(", ")} (${
          params.gradeIds[0] && params.gradeIds[0].startsWith("SMC")
            ? "RM/Metric Tonne"
            : "Cents/Kg"
        })`,
        alignment: "center",
        bold: true,
        fontSize: BASE_FONT_SIZE + 3,
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
                text: "Day",
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

              let globalStats = {};

              const endDateOfMonth = dayjs()
                .set("month", params.monthIds[0])
                .set("year", params.yearIds[0])
                .endOf("month");
              let currentDate = dayjs()
                .set("month", params.monthIds[0])
                .set("year", params.yearIds[0])
                .startOf("month");
              do {
                const prices = indexedDomesticCocoaPrices.where({
                  date: currentDate.format("YYYY-MM-DD"),
                });
                if (prices.length === 0) {
                  currentDate = currentDate.add(1, "day");
                  continue;
                }

                let total = 0,
                  count = 0;
                table.push([
                  {
                    text: currentDate.format("DD dddd"),
                    // bold: true,
                    // alignment: "center",
                    marginLeft: 4,
                  },
                  //
                  ...allCentres.map(centre => {
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
                    // let highestPrice = [];
                    // if (prices.length > 0) {
                    //   highestPrice.push(
                    //     lodash.maxBy(prices, function (o) {
                    //       return o[statCode];
                    //     }),
                    //   );
                    // }

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

                    stats[statCode].average =
                      stats[statCode].total > 0 && stats[statCode].count > 0
                        ? lodash.round(
                            stats[statCode].total / stats[statCode].count,
                            0,
                          )
                        : 0;
                    // globalStats[centre._id].total += stats[statCode].average;
                    // globalStats[centre._id].count += 1;

                    // if (centre.description === "Tawau") {
                    //   console.log(
                    //     globalStats[centre._id].count,
                    //     currentDate.format("DD dddd"),
                    //     stats[statCode],
                    //   );
                    // }
                    // console.log(currentDate.format("YYYY-MM-DD"), prices.length, {
                    //   stats,
                    // });

                    if (stats[statCode].average) {
                      globalStats[centre._id].total += stats[statCode].average;
                      globalStats[centre._id].count += 1;

                      total += stats[statCode].average;
                      count += 1;
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
                        return formatNumber(average);
                      }
                      return "-";
                    })(),
                    // borders: [true, false, true, false],
                    alignment: "center",
                  },
                ]);

                currentDate = currentDate.add(1, "day");
              } while (!currentDate.isAfter(endDateOfMonth));

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

                  return {
                    text: globalStats[centre._id].average
                      ? formatNumber(globalStats[centre._id].average)
                      : "-",
                    // borders: [true, false, true, false],
                    alignment: "center",
                    bold: true,
                  };
                }),
                //
                {
                  text: (() => {
                    if (total > 0 && count > 0) {
                      const average = lodash.round(total / count, 0);
                      return formatNumber(average);
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
    filename: `Daily Report - Cocoa Price.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateDailyBuyerReportForDomesticCocoaPrices = async (
  self,
  params,
  context,
) => {
  // console.log("generateDailyBuyerReportForDomesticCocoaPrices", params);
  assertValidSession(context.activeSession);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  const allCentres = await context
    .collection("Centres")
    .find(
      params.centreIds[0] !== "Select All" && params.centreIds?.length > 0
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
  const indexedCentres = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["code"],
    },
  });
  indexedCentres.add(allCentres);
  // console.log("allCentres", params.centreIds, allCentres.length);

  await context.collection("Buyers").createIndex({
    centreId: 1,
  });
  const allBuyers = await context
    .collection("Buyers")
    .find(
      params.buyerIds?.length > 0 && !params.buyerIds.includes("Select All")
        ? {
            _id: {
              $in: params.buyerIds,
            },
            _deletedAt: {
              $exists: false,
            },
          }
        : params.centreIds[0] !== "Select All" && params.centreIds?.length > 0
        ? {
            // centreId: {
            //   $in: params.centreIds,
            // },
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
  // const indexedBuyers = new FlexSearch({
  //   tokenize: "strict",
  //   doc: {
  //     id: "_id",
  //     field: ["code"],
  //   },
  // });
  // indexedBuyers.add(allBuyers);
  // console.log(
  //   "allBuyers",
  //   allBuyers.length,
  //   allBuyers.map(item => item.name),
  // );

  let query = {
    // $or: [],
    date: {
      $gte: params.startDate,
      $lte: params.endDate,
    },
  };
  // for (const year of params.yearIds) {
  //   if (params.monthIds.length === 0) {
  //     query.$or.push({
  //       date: {
  //         $gte: dayjs().set("year", year).startOf("year").format("YYYY-MM-DD"),
  //         $lte: dayjs().set("year", year).endOf("year").format("YYYY-MM-DD"),
  //       },
  //     });
  //   } else {
  //     for (const month of params.monthIds) {
  //       query.$or.push({
  //         date: {
  //           $gte: dayjs()
  //             .set("year", year)
  //             .set("month", month)
  //             .startOf("month")
  //             .format("YYYY-MM-DD"),
  //           $lte: dayjs()
  //             .set("year", year)
  //             .set("month", month)
  //             .endOf("month")
  //             .format("YYYY-MM-DD"),
  //         },
  //       });
  //     }
  //   }
  // }
  if (params.centreIds[0] !== "Select All" && params.centreIds?.length > 0) {
    query.centreId = {
      $in: params.centreIds,
    };
  }
  // if (query.$or.length === 0) {
  //   delete query.$or;
  // }
  // console.log(JSON.stringify({ params, query }, null, 4));

  await context.collection("DomesticCocoaPrices").createIndex({
    date: 1,
  });
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
  // console.log(
  //   "allDomesticCocoaPrices",
  //   allDomesticCocoaPrices.length,
  //   // allDomesticCocoaPrices[0],
  // );
  const indexedDomesticCocoaPrices = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["centreId", "buyerId", "date"],
    },
  });
  indexedDomesticCocoaPrices.add(allDomesticCocoaPrices);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 11;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    // pageOrientation: "landscape",
    pageOrientation: "portrait",
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
        text: `EXTRACT BUYER'S DAILY COCOA PRICE (BY MONTH) ${dayjs(
          params.startDate,
        )
          .format("MMMM YYYY")
          .toUpperCase()}`,
        // alignment: "center",
        bold: true,
        fontSize: BASE_FONT_SIZE + 3,
      },
      {
        text: dayjs().format("DD/MM/YYYY"),
        alignment: "right",
        bold: true,
        fontSize: BASE_FONT_SIZE,
        marginTop: -16,
      },
      // {
      //   text: [
      //     `${allCentres[0]?.code} `,
      //     {
      //       preserveLeadingSpaces: true,
      //       text: `      ${allCentres[0]?.description}`,
      //       bold: true,
      //     },
      //   ],
      //   // alignment: "center",
      //   bold: true,
      //   fontSize: BASE_FONT_SIZE,
      //   marginTop: 10,
      // },
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
          widths: [85, 55, 45, 130, 40, 50, 50, 50],
          body: [
            [
              {
                marginTop: 7,
                text: "Tarikh",
                italics: true,
                bold: true,
                marginLeft: 4,
              },
              {
                marginTop: 7,
                text: "Centre",
                bold: true,
                // alignment: "center",
              },
              {
                text: "Kod Pembeli",
                bold: true,
                // alignment: "center",
              },
              {
                marginTop: 7,
                text: "Nama Pembeli",
                bold: true,
                // alignment: "center",
              },
              {
                marginTop: 7,
                text: "Basah",
                bold: true,
                alignment: "center",
              },
              {
                marginTop: 7,
                text: "SMC 1",
                bold: true,
                alignment: "center",
              },
              {
                marginTop: 7,
                text: "SMC 2",
                bold: true,
                alignment: "center",
              },
              {
                marginTop: 7,
                text: "SMC 3",
                bold: true,
                alignment: "center",
              },
            ],
            ...(() => {
              let table = [];

              const startDateOfMonth = dayjs(params.startDate);
              // .set("month", params.monthIds[0])
              // .set("year", params.yearIds[0])
              // .startOf("month");
              let currentDate = dayjs(params.endDate);
              // .set("month", params.monthIds[0])
              // .set("year", params.yearIds[0])
              // .endOf("month");
              do {
                const prices = indexedDomesticCocoaPrices.where({
                  date: currentDate.format("YYYY-MM-DD"),
                });
                if (prices.length === 0) {
                  // console.log(currentDate.format("YYYY-MM-DD"), prices.length, prices[0]);
                  currentDate = currentDate.subtract(1, "day");
                  continue;
                }
                // else {
                //   console.log(
                //     currentDate.format("YYYY-MM-DD"),
                //     prices.length,
                //     prices[0],
                //   );
                // }

                for (const buyer of allBuyers) {
                  const prices = indexedDomesticCocoaPrices.where({
                    date: currentDate.format("YYYY-MM-DD"),
                    buyerId: buyer._id,
                  });
                  if (prices.length === 0) {
                    continue;
                  }
                  // console.log(buyer._id, buyer.code, buyer.name, prices[0]);

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
                  }
                  // console.log(currentDate.format("YYYY-MM-DD"), prices.length, {
                  //   stats,
                  // });

                  const currentCentre = indexedCentres.find({
                    _id: (prices[0] && prices[0].centreId) || buyer.centreId,
                  });
                  // console.log(currentCentre, params.centreIds);
                  if (
                    !currentCentre ||
                    (params.centreIds[0] !== "Select All" &&
                      !params.centreIds.includes(currentCentre._id))
                  ) {
                    continue;
                  }

                  table.push([
                    {
                      text: currentDate.format("DD dddd"),
                      // bold: true,
                      // alignment: "center",
                      marginLeft: 4,
                    },
                    {
                      text: (currentCentre && currentCentre.description) || " ",
                      // bold: true,
                      // alignment: "center",
                      marginLeft: 4,
                    },
                    {
                      text: buyer.code || " ",
                      // bold: true,
                      // alignment: "center",
                      marginLeft: 4,
                    },
                    {
                      text: buyer.name || " ",
                      // bold: true,
                      // alignment: "center",
                      marginLeft: 4,
                    },
                    //
                    {
                      text: stats["wetPrice"].average
                        ? formatNumber(stats["wetPrice"].average)
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
                    {
                      text: stats["smc2"].average
                        ? formatNumber(stats["smc2"].average)
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

                currentDate = currentDate.subtract(1, "day");
              } while (!currentDate.isBefore(startDateOfMonth));

              return table;
            })(),
          ],
        },
      },
      {
        marginTop: 100,
        text: "Source: Prices/Domestic/Daily Report/Average",
      },
      {
        marginTop: -12,
        text: `Date: ${dayjs().locale("ms-my").format("DD MMMM YYYY")}`,
        alignment: "right",
      },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Daily Report - Daily Extract Buyer's Price.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateMonthlyBuyerReportForDomesticCocoaPrices = async (
  self,
  params,
  context,
) => {
  // console.log("generateDailyBuyerReportForDomesticCocoaPrices", params);
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
  // console.log("allCentres", allCentres)

  await context.collection("Buyers").createIndex({
    centreId: 1,
  });
  const allBuyers = await context
    .collection("Buyers")
    .find(
      params.buyerIds?.length > 0 && !params.buyerIds.includes("Select All")
        ? {
            _id: {
              $in: params.buyerIds,
            },
            _deletedAt: {
              $exists: false,
            },
          }
        : params.centreIds?.length > 0
        ? {
            // centreId: {
            //   $in: params.centreIds,
            // },
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
  // const indexedBuyers = new FlexSearch({
  //   tokenize: "strict",
  //   doc: {
  //     id: "_id",
  //     field: ["code"],
  //   },
  // });
  // indexedBuyers.add(allBuyers);
  // console.log(
  //   "allBuyers",
  //   allBuyers.length,
  //   allBuyers.map(item => item.name),
  // );

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
  // console.log(
  //   "allDomesticCocoaPrices",
  //   allDomesticCocoaPrices.length,
  //   // allDomesticCocoaPrices[0],
  // );
  const indexedDomesticCocoaPrices = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["centreId", "buyerId", "date"],
    },
  });
  indexedDomesticCocoaPrices.add(allDomesticCocoaPrices);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 11;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    // pageOrientation: "landscape",
    pageOrientation: "portrait",
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
        text: `EXTRACT BUYER'S DAILY COCOA PRICE (BY MONTH)`,
        // alignment: "center",
        bold: true,
        fontSize: BASE_FONT_SIZE + 3,
      },
      {
        text: dayjs().format("DD/MM/YYYY"),
        alignment: "right",
        bold: true,
        fontSize: BASE_FONT_SIZE,
        marginTop: -16,
      },
      {
        text: [
          `${allCentres[0]?.code} `,
          {
            preserveLeadingSpaces: true,
            text: `      ${allCentres[0]?.description}`,
            bold: true,
          },
        ],
        // alignment: "center",
        bold: true,
        fontSize: BASE_FONT_SIZE,
        marginTop: 10,
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
          widths: [90, 70, 150, 50, 50, 50, 50],
          body: [
            [
              {
                text: "Tarikh",
                italics: true,
                bold: true,
                marginLeft: 4,
              },
              {
                text: "Kod Pembeli",
                bold: true,
                // alignment: "center",
              },
              {
                text: "Nama Pembeli",
                bold: true,
                // alignment: "center",
              },
              {
                text: "Basah",
                bold: true,
                alignment: "center",
              },
              {
                text: "SMC 1",
                bold: true,
                alignment: "center",
              },
              {
                text: "SMC 2",
                bold: true,
                alignment: "center",
              },
              {
                text: "SMC 3",
                bold: true,
                alignment: "center",
              },
            ],
            ...(() => {
              let table = [];

              const startDateOfMonth = dayjs()
                .set("month", params.monthIds[0])
                .set("year", params.yearIds[0])
                .startOf("month");
              let currentDate = dayjs()
                .set("month", params.monthIds[0])
                .set("year", params.yearIds[0])
                .endOf("month");
              do {
                const prices = indexedDomesticCocoaPrices.where({
                  date: currentDate.format("YYYY-MM-DD"),
                });
                if (prices.length === 0) {
                  // console.log(currentDate.format("YYYY-MM-DD"), prices.length, prices[0]);
                  currentDate = currentDate.subtract(1, "day");
                  continue;
                }
                // else {
                //   console.log(
                //     currentDate.format("YYYY-MM-DD"),
                //     prices.length,
                //     prices[0],
                //   );
                // }

                for (const buyer of allBuyers) {
                  const prices = indexedDomesticCocoaPrices.where({
                    date: currentDate.format("YYYY-MM-DD"),
                    buyerId: buyer._id,
                  });
                  // console.log(buyer._id, buyer.code, buyer.name, prices.length);
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
                  }
                  // console.log(currentDate.format("YYYY-MM-DD"), prices.length, {
                  //   stats,
                  // });

                  table.push([
                    {
                      text: currentDate.format("DD dddd"),
                      // bold: true,
                      // alignment: "center",
                      marginLeft: 4,
                    },
                    {
                      text: buyer.code || " ",
                      // bold: true,
                      // alignment: "center",
                      marginLeft: 4,
                    },
                    {
                      text: buyer.name || " ",
                      // bold: true,
                      // alignment: "center",
                      marginLeft: 4,
                    },
                    //
                    {
                      text: stats["wetPrice"].average
                        ? formatNumber(stats["wetPrice"].average)
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
                    {
                      text: stats["smc2"].average
                        ? formatNumber(stats["smc2"].average)
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

                currentDate = currentDate.subtract(1, "day");
              } while (!currentDate.isBefore(startDateOfMonth));

              return table;
            })(),
          ],
        },
      },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Daily Report - Monthly Extract Buyer's Price.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

module.exports = {
  generateDailySummaryReportForDomesticCocoaPrices,
  generateDailyAverageReportForDomesticCocoaPrices,
  generateDailyCocoaPriceReportForDomesticCocoaPrices,
  generateDailyBuyerReportForDomesticCocoaPrices,
  generateMonthlyBuyerReportForDomesticCocoaPrices,
};
