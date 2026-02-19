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

const { formatCurrency, formatNumber } = require("../../libs/numbers");

const generateDailyReportForGlobalICCOPrices = async (
  self,
  params,
  context,
) => {
  assertValidSession(context.activeSession);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
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

  await context.collection("GlobalPriceFutureMarketReuters").createIndex({
    date: 1,
  });
  const allGlobalReutersPrices = await context
    .collection("GlobalPriceFutureMarketReuters")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  const indexedGlobalReutersPrices = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["date"],
    },
  });
  indexedGlobalReutersPrices.add(allGlobalReutersPrices);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 11;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    // pageOrientation: "landscape",
    pageOrientation: "portrait",
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: `Daily International Cocoa Price`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 4,
      },
      {
        text: `For ${dayjs()
          .set("month", params.monthIds[0])
          .set("year", params.yearIds[0])
          .format("MMMM, YYYY")}`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 2,
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
          widths: [120, 100, 100, 100, 100],
          body: [
            [
              {
                text: "Date",
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
              {
                text: "ICCO",
                alignment: "center",
                bold: true,
                colSpan: 2,
              },
              "",
              {
                text: "Exchange Rate\nUSD",
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
              {
                text: "RM/Tonne\n(USD)",
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
            ],
            [
              "",
              {
                text: "Pound",
                alignment: "center",
                bold: true,
              },
              {
                text: "USD",
                alignment: "center",
                bold: true,
              },
              "",
              "",
            ],
            ...(() => {
              let table = [];

              const endDate = dayjs()
                .set("month", params.monthIds[0])
                .set("year", params.yearIds[0])
                .endOf("month");
              let currentDate = dayjs()
                .set("month", params.monthIds[0])
                .set("year", params.yearIds[0])
                .startOf("month");

              let stats = {
                iccoPrice: [],
                iccoUSD: [],
                iccoEX: [],
                rmTonne: [],
              };

              let totalData = 0;
              do {
                const foundDuplicate = indexedGlobalReutersPrices.where({
                  date: currentDate.format("YYYY-MM-DD"),
                });
                const price = indexedGlobalReutersPrices.find({
                  date: currentDate.format("YYYY-MM-DD"),
                });
                if (foundDuplicate.length > 1) {
                  throw new Error(
                    `Multiple data at ${currentDate.format("YYYY-MM-DD")}`,
                  );
                }
                let indexedPrices = {
                  SDR: {
                    price: lodash.round(
                      (price && price.iccoPoundsterling) || 0,
                      0,
                    ),
                  },
                  USD: {
                    price:
                      price && price.iccoUSD
                        ? lodash
                            .round((price && price.iccoUSD) || 0, 2)
                            .toFixed(2)
                        : 0,
                  },
                };
                let averageExchangesRate = lodash.round(
                  (price && price.iccoEx) || 0,
                  4,
                );
                let rmTonne =
                  averageExchangesRate &&
                  indexedPrices["USD"] &&
                  indexedPrices["USD"].price
                    ? lodash
                        .round(
                          averageExchangesRate * indexedPrices["USD"].price,
                          2,
                        )
                        .toFixed(2)
                    : 0;

                if (price) {
                  const USDPrice = indexedPrices["USD"].price;
                  indexedPrices["USD"].price =
                    roundUpIfGreaterThanSixty(USDPrice);

                  const tmpRmTonne = roundUpIfGreaterThanSixty(rmTonne);
                  rmTonne = tmpRmTonne;

                  if (averageExchangesRate > 0) {
                    totalData += 1;
                  }

                  stats.iccoPrice.push(indexedPrices["SDR"].price);
                  stats.iccoUSD.push(indexedPrices["USD"].price);
                  stats.iccoEX.push(averageExchangesRate);
                  stats.rmTonne.push(rmTonne);
                }

                // const prices = indexedGlobalReutersPrices.where({
                //   date: currentDate.format("YYYY-MM-DD"),
                // });
                // // if (prices.length === 0) {
                // //   currentDate = currentDate.add(1, "day");
                // //   continue;
                // // }
                // // console.log(currentDate.format("YYYY-MM-DD"), prices.length);
                // let indexedPrices = {};
                // let exchangeRates = [];
                // for (const price of prices) {
                //   if (price.price) {
                //     indexedPrices[price.currency] = price;
                //   }
                //   if (price.exchangeRate) {
                //     exchangeRates.push(price.exchangeRate);
                //   }
                // }
                // let sumExchangesRate = exchangeRates.reduce(
                //   (sum, value) => sum + value,
                //   0,
                // );
                // let countExchangesRate = exchangeRates.length;
                // let averageExchangesRate =
                //   sumExchangesRate > 0 && countExchangesRate > 0
                //     ? lodash.round(sumExchangesRate / countExchangesRate, 4)
                //     : 0;

                table.push([
                  {
                    marginLeft: 10,
                    text: currentDate.format("DD  dddd"),
                  },
                  {
                    text:
                      (indexedPrices["SDR"] &&
                        indexedPrices["SDR"].price &&
                        formatCurrency(indexedPrices["SDR"].price, 0)) ||
                      "-",
                    alignment: "center",
                  },
                  {
                    text:
                      (indexedPrices["USD"] &&
                        indexedPrices["USD"].price &&
                        formatCurrency(indexedPrices["USD"].price, 0)) ||
                      "-",
                    alignment: "center",
                  },
                  {
                    text: averageExchangesRate
                      ? formatCurrency(averageExchangesRate, 4)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: rmTonne ? formatCurrency(rmTonne, 0) : "-",
                    alignment: "center",
                  },
                ]);

                currentDate = currentDate.add(1, "day");
              } while (!currentDate.isAfter(endDate));

              for (const key in stats) {
                let sum = stats[key].reduce(
                  (sum, value) => sum + parseFloat(value),
                  0,
                );

                let count = stats[key].length;
                if (key === "iccoEX") {
                  sum = lodash.round(sum, 4);
                }

                let average =
                  sum > 0 && count > 0
                    ? lodash.round(sum / count, key === "iccoEX" ? 4 : 0)
                    : 0;
                // console.log(
                //   monthIndex,
                //   endDate.format("MMMM"),
                //   key,
                //   stats[key],
                //   average,
                // );
                stats[key] = average;
              }

              table.push([
                {
                  marginLeft: 10,
                  text: "Average",
                  fillColor: "#f0f0f0",
                },
                {
                  text: stats.iccoPrice
                    ? formatCurrency(stats.iccoPrice, 0)
                    : "-",
                  fillColor: "#f0f0f0",
                  alignment: "center",
                },
                {
                  text: stats.iccoUSD ? formatCurrency(stats.iccoUSD, 0) : "-",
                  fillColor: "#f0f0f0",
                  alignment: "center",
                },
                {
                  text: stats.iccoEX ? formatCurrency(stats.iccoEX, 4) : "-",
                  fillColor: "#f0f0f0",
                  alignment: "center",
                },
                {
                  text: stats.rmTonne ? formatCurrency(stats.rmTonne, 0) : "-",
                  fillColor: "#f0f0f0",
                  alignment: "center",
                },
              ]);

              return table;
            })(),
          ],
        },
      },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `ICCO Report - Daily.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateMonthlyReportForGlobalICCOPrices = async (
  self,
  params,
  context,
) => {
  assertValidSession(context.activeSession);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
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

  await context.collection("GlobalPriceFutureMarketReuters").createIndex({
    date: 1,
  });
  const allGlobalReutersPrices = await context
    .collection("GlobalPriceFutureMarketReuters")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log("allGlobalReutersPrices", allGlobalReutersPrices.length);
  const indexedGlobalReutersPrices = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["date"],
    },
  });
  indexedGlobalReutersPrices.add(allGlobalReutersPrices);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 11;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    // pageOrientation: "landscape",
    pageOrientation: "portrait",
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: `Monthly International Cocoa Price`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 4,
      },
      {
        text: `For ${dayjs().set("year", params.yearIds[0]).format("YYYY")}`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 2,
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
          widths: [120, 100, 100, 100, 100],
          body: [
            [
              {
                text: "Month",
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
              {
                text: "ICCO",
                alignment: "center",
                bold: true,
                colSpan: 2,
              },
              "",
              {
                text: "ICCO Exchange\n(USD)",
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
              {
                text: "RM Tonne\n(USD)",
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
            ],
            [
              "",
              {
                text: "Pound",
                alignment: "center",
                bold: true,
              },
              {
                text: "USD",
                alignment: "center",
                bold: true,
              },
              "",
              "",
            ],
            ...(() => {
              let table = [];
              let averageStats = {
                iccoPrice: [],
                iccoUSD: [],
                iccoEX: [],
                rmTonne: [],
              };

              const monthIndexes = [...new Array(12)];

              monthIndexes.forEach((_, monthIndex) => {
                // let stats = {
                //   SDR: [],
                //   USD: [],
                //   exchangeRates: [],
                // };

                const endDate = dayjs()
                  .set("year", params.yearIds[0])
                  .set("month", monthIndex)
                  .endOf("month");
                let currentDate = dayjs()
                  .set("year", params.yearIds[0])
                  .set("month", monthIndex)
                  .startOf("month");

                let stats = {
                  iccoPrice: [],
                  iccoUSD: [],
                  iccoEX: [],
                  rmTonne: [],
                };

                do {
                  const price = indexedGlobalReutersPrices.find({
                    date: currentDate.format("YYYY-MM-DD"),
                  });
                  const checkDuplicate = indexedGlobalReutersPrices.where({
                    date: currentDate.format("YYYY-MM-DD"),
                  });
                  if (checkDuplicate.length > 1) {
                    throw new Error(
                      `Duplicate Data At ${currentDate.format(
                        "YYYY-MM-DD",
                      )}, total duplicate ${checkDuplicate.length}`,
                    );
                  }
                  // console.log("date", currentDate.format("YYYY-MM-DD"), price);
                  let indexedPrices = {
                    SDR: {
                      price: lodash.round(
                        (price && price.iccoPoundsterling) || 0,
                        0,
                      ),
                    },
                    USD: {
                      price:
                        price && price.iccoUSD
                          ? lodash.round((price && price.iccoUSD) || 0, 2)
                          : 0,
                    },
                  };
                  let averageExchangesRate = lodash.round(
                    (price && price.iccoEx) || 0,
                    4,
                  );
                  let rmTonne =
                    averageExchangesRate &&
                    indexedPrices["USD"] &&
                    indexedPrices["USD"].price
                      ? lodash.round(
                          averageExchangesRate * indexedPrices["USD"].price,
                          2,
                        )
                      : 0;

                  if (price) {
                    if (indexedPrices["SDR"].price > 0) {
                      stats.iccoPrice.push(indexedPrices["SDR"].price);
                    }

                    if (indexedPrices["USD"].price > 0) {
                      // console.log(price.iccoUSD, currentDate.format("YYYY-MM-DD"))
                      stats.iccoUSD.push(indexedPrices["USD"].price);
                    }

                    stats.iccoEX.push(averageExchangesRate);
                    if (rmTonne > 0) {
                      stats.rmTonne.push(rmTonne);
                    }
                  }

                  // const prices = indexedGlobalReutersPrices.where({
                  //   date: currentDate.format("YYYY-MM-DD"),
                  // });
                  // // if (prices.length === 0) {
                  // //   currentDate = currentDate.add(1, "day");
                  // //   continue;
                  // // }
                  // // console.log(currentDate.format("YYYY-MM-DD"), prices.length);

                  // for (const price of prices) {
                  //   if (price.price) {
                  //     stats[price.currency].push(price.price);
                  //   }
                  //   if (price.exchangeRate) {
                  //     stats.exchangeRates.push(price.exchangeRate);
                  //   }
                  // }

                  currentDate = currentDate.add(1, "day");
                } while (!currentDate.isAfter(endDate));

                // for (const key in stats) {
                //   let sum = stats[key].reduce((sum, value) => sum + parseFloat(value), 0);
                //   let count = stats[key].length;
                //   let average =
                //     sum > 0 && count > 0 ? lodash.round(sum / count, 4) : 0;
                //   // console.log(
                //   //   monthIndex,
                //   //   endDate.format("MMMM"),
                //   //   key,
                //   //   stats[key],
                //   //   average,
                //   // );
                //   stats[key] = average;

                //   if (averageStats[key] && average) {
                //     averageStats[key].push(average);
                //   }
                // }

                // if (
                //   // !stats["exchangeRates"] &&
                //   stats["SDR"] > 0 &&
                //   stats["USD"] > 0
                // ) {
                //   stats["exchangeRates"] = lodash.round(
                //     stats["USD"] / stats["SDR"],
                //     4,
                //   );
                //   if (averageStats["exchangeRates"] && stats.exchangeRates) {
                //     averageStats["exchangeRates"].push(stats.exchangeRates);
                //   }
                // }
                for (const key in stats) {
                  let sum = stats[key].reduce(
                    (sum, value) => sum + parseFloat(value),
                    0,
                  );
                  let count = stats[key].length;

                  if (key === "iccoEX") {
                    sum = lodash.round(sum, 4);
                  }

                  let average =
                    sum > 0 && count > 0
                      ? lodash.round(sum / count, key === "iccoEX" ? 4 : 2)
                      : 0;
                  // console.log(
                  //   monthIndex,
                  //   endDate.format("MMMM"),
                  //   key,
                  //   stats[key],
                  //   average,
                  // );
                  stats[key] = average;
                  averageStats[key].push(average);
                }

                table.push([
                  {
                    marginLeft: 10,
                    text: endDate.format("MMMM"),
                  },
                  {
                    text: stats.iccoPrice
                      ? formatCurrency(stats.iccoPrice, 0)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: stats.iccoUSD
                      ? formatCurrency(stats.iccoUSD, 2)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: stats.iccoEX ? formatCurrency(stats.iccoEX, 4) : "-",
                    alignment: "center",
                  },
                  {
                    text: stats.rmTonne
                      ? formatCurrency(stats.rmTonne, 0)
                      : "-",
                    alignment: "center",
                  },
                ]);
              });

              // for (const key in averageStats) {
              //   let sum = averageStats[key].reduce(
              //     (sum, value) => sum + value,
              //     0,
              //   );
              //   let count = averageStats[key].length;
              //   let average =
              //     sum > 0 && count > 0 ? lodash.round(sum / count, 4) : 0;
              //   // console.log(
              //   //   monthIndex,
              //   //   endDate.format("MMMM"),
              //   //   key,
              //   //   averageStats[key],
              //   //   average,
              //   // );
              //   averageStats[key] = average;
              // }

              for (const key in averageStats) {
                let sum = averageStats[key].reduce(
                  (sum, value) => sum + value,
                  0,
                );
                let count = averageStats[key].length;
                let average =
                  sum > 0 && count > 0
                    ? lodash.round(sum / count, key === "iccoEX" ? 4 : 2)
                    : 0;
                // console.log(
                //   monthIndex,
                //   endDate.format("MMMM"),
                //   key,
                //   averageStats[key],
                //   average,
                // );
                averageStats[key] = average;
              }

              table.push([
                {
                  marginLeft: 10,
                  text: "Average",
                  bold: true,
                },
                {
                  text: averageStats.iccoPrice
                    ? formatCurrency(averageStats.iccoPrice, 0)
                    : "-",
                  alignment: "center",
                  bold: true,
                },
                {
                  text: averageStats.iccoUSD
                    ? formatCurrency(averageStats.iccoUSD, 2)
                    : "-",
                  alignment: "center",
                  bold: true,
                },
                {
                  text: averageStats.iccoEX
                    ? formatCurrency(averageStats.iccoEX, 4)
                    : "-",
                  alignment: "center",
                  bold: true,
                },
                {
                  text: averageStats.rmTonne
                    ? formatCurrency(averageStats.rmTonne, 0)
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
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `ICCO Report - Monthly.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateYearlyReportForGlobalICCOPrices = async (
  self,
  params,
  context,
) => {
  assertValidSession(context.activeSession);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
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

  await context.collection("GlobalReutersPrices").createIndex({
    date: 1,
  });
  const allGlobalReutersPrices = await context
    .collection("GlobalReutersPrices")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log("allGlobalReutersPrices", allGlobalReutersPrices.length);
  const indexedGlobalReutersPrices = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["date"],
    },
  });
  indexedGlobalReutersPrices.add(allGlobalReutersPrices);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 11;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    // pageOrientation: "landscape",
    pageOrientation: "portrait",
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: `Yearly International Cocoa Price`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 4,
      },
      {
        text: `From ${dayjs()
          .set("year", params.fromYearIds[0])
          .format("YYYY")} To  ${dayjs()
          .set("year", params.toYearIds[0])
          .format("YYYY")}`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 2,
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
          widths: [120, 100, 100, 100, 100],
          body: [
            [
              {
                text: "Year",
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
              {
                text: "ICCO",
                alignment: "center",
                bold: true,
                colSpan: 2,
              },
              "",
              {
                text: "ICCO Exchange\n(USD)",
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
              {
                text: "RM Tonne\n(USD)",
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
            ],
            [
              "",
              {
                text: "Pound",
                alignment: "center",
                bold: true,
              },
              {
                text: "USD",
                alignment: "center",
                bold: true,
              },
              "",
              "",
            ],
            ...(() => {
              let table = [];

              let diffYear = Math.max(
                0,
                parseInt(params.toYearIds[0]) - parseInt(params.fromYearIds[0]),
              );
              if (diffYear >= 0) {
                diffYear += 1;
              }
              [...new Array(diffYear)].forEach((_, yearIndex) => {
                // let stats = {
                //   SDR: [],
                //   USD: [],
                //   exchangeRates: [],
                // };

                const currentYear = parseInt(params.fromYearIds[0]) + yearIndex;
                const endDate = dayjs().set("year", currentYear).endOf("year");
                let currentDate = dayjs()
                  .set("year", currentYear)
                  .startOf("year");

                let stats = {
                  iccoPrice: [],
                  iccoUSD: [],
                  iccoEX: [],
                  rmTonne: [],
                };

                const monthIndexes = [...new Array(12)];
                monthIndexes.forEach((_, monthIndex) => {
                  // let stats = {
                  //   SDR: [],
                  //   USD: [],
                  //   exchangeRates: [],
                  // };

                  const endDate = dayjs()
                    .set("year", currentYear)
                    .set("month", monthIndex)
                    .endOf("month");
                  let currentDate = dayjs()
                    .set("year", currentYear)
                    .set("month", monthIndex)
                    .startOf("month");

                  let monthlyStats = {
                    iccoPrice: [],
                    iccoUSD: [],
                    iccoEX: [],
                    rmTonne: [],
                  };

                  do {
                    const price = indexedGlobalReutersPrices.find({
                      date: currentDate.format("YYYY-MM-DD"),
                    });
                    const checkDuplicate = indexedGlobalReutersPrices.where({
                      date: currentDate.format("YYYY-MM-DD"),
                    });
                    if (checkDuplicate.length > 1) {
                      throw new Error(
                        `Duplicate Data At ${currentDate.format(
                          "YYYY-MM-DD",
                        )}, total duplicate ${checkDuplicate.length}`,
                      );
                    }
                    // console.log("date", currentDate.format("YYYY-MM-DD"), price);
                    let indexedPrices = {
                      SDR: {
                        price: lodash.round((price && price.iccoPound) || 0, 0),
                      },
                      USD: {
                        price:
                          price && price.iccoUSD
                            ? lodash
                                .round((price && price.iccoUSD) || 0, 2)
                                .toFixed(2)
                            : 0,
                      },
                    };
                    let averageExchangesRate = lodash.round(
                      (price && price.iccoEX) || 0,
                      4,
                    );
                    let rmTonne =
                      averageExchangesRate &&
                      indexedPrices["USD"] &&
                      indexedPrices["USD"].price
                        ? lodash
                            .round(
                              averageExchangesRate * indexedPrices["USD"].price,
                              2,
                            )
                            .toFixed(2)
                        : 0;

                    if (price) {
                      monthlyStats.iccoPrice.push(indexedPrices["SDR"].price);
                      monthlyStats.iccoUSD.push(indexedPrices["USD"].price);
                      monthlyStats.iccoEX.push(averageExchangesRate);
                      monthlyStats.rmTonne.push(rmTonne);
                    }

                    // const prices = indexedGlobalReutersPrices.where({
                    //   date: currentDate.format("YYYY-MM-DD"),
                    // });
                    // // if (prices.length === 0) {
                    // //   currentDate = currentDate.add(1, "day");
                    // //   continue;
                    // // }
                    // // console.log(currentDate.format("YYYY-MM-DD"), prices.length);

                    // for (const price of prices) {
                    //   if (price.price) {
                    //     monthlyStats[price.currency].push(price.price);
                    //   }
                    //   if (price.exchangeRate) {
                    //     monthlyStats.exchangeRates.push(price.exchangeRate);
                    //   }
                    // }

                    currentDate = currentDate.add(1, "day");
                  } while (!currentDate.isAfter(endDate));

                  for (const key in monthlyStats) {
                    let sum = monthlyStats[key].reduce(
                      (sum, value) => sum + parseFloat(value),
                      0,
                    );
                    let count = monthlyStats[key].length;

                    if (key === "iccoEX") {
                      sum = lodash.round(sum, 4);
                    }
                    let average =
                      sum > 0 && count > 0
                        ? lodash.round(sum / count, key === "iccoEX" ? 4 : 2)
                        : 0;
                    // console.log(
                    //   monthIndex,
                    //   endDate.format("MMMM"),
                    //   key,
                    //   monthlyStats[key],
                    //   average,
                    // );
                    monthlyStats[key] = average;
                    stats[key].push(average);
                  }
                });

                // do {
                //   const price = indexedGlobalReutersPrices.find({
                //     date: currentDate.format("YYYY-MM-DD"),
                //   });
                //   let indexedPrices = {
                //     SDR: {
                //       price: lodash.round((price && price.iccoPound) || 0, 0),
                //     },
                //     USD: {
                //       price:
                //         price && price.iccoUSD
                //           ? lodash
                //               .round((price && price.iccoUSD) || 0, 2)
                //               .toFixed(2)
                //           : 0,
                //     },
                //   };
                //   let averageExchangesRate = lodash.round(
                //     (price && price.iccoEX) || 0,
                //     4,
                //   );
                //   let rmTonne =
                //     averageExchangesRate &&
                //     indexedPrices["USD"] &&
                //     indexedPrices["USD"].price
                //       ? lodash
                //           .round(
                //             averageExchangesRate * indexedPrices["USD"].price,
                //             2,
                //           )
                //           .toFixed(2)
                //       : 0;

                //   if (price) {
                //     stats.iccoPrice.push(indexedPrices["SDR"].price);
                //     stats.iccoUSD.push(indexedPrices["USD"].price);
                //     stats.iccoEX.push(averageExchangesRate);
                //     stats.rmTonne.push(rmTonne);
                //   }

                //   currentDate = currentDate.add(1, "day");
                // } while (!currentDate.isAfter(endDate));

                // console.log({ stats });
                for (const key in stats) {
                  let sum = stats[key].reduce(
                    (sum, value) => sum + parseFloat(value),
                    0,
                  );
                  let count = stats[key].filter(s => s > 0).length;
                  let average =
                    sum > 0 && count > 0
                      ? lodash.round(
                          sum / count,
                          key === "iccoEX" ? 4 : key === "iccoUSD" ? 2 : 0,
                        )
                      : 0;
                  // console.log(
                  //   currentYear,
                  //   key,
                  //   stats[key],
                  //   average,
                  //   "round " +
                  //     (key === "iccoEX" ? 4 : key === "iccoUSD" ? 2 : 0),
                  // );
                  stats[key] = average;
                }

                table.push([
                  {
                    marginLeft: 10,
                    text: endDate.format("YYYY"),
                  },
                  {
                    text: stats.iccoPrice
                      ? formatCurrency(stats.iccoPrice, 0)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: stats.iccoUSD
                      ? formatCurrency(stats.iccoUSD, 2)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: stats.iccoEX ? formatCurrency(stats.iccoEX, 4) : "-",
                    alignment: "center",
                  },
                  {
                    text: stats.rmTonne
                      ? formatCurrency(stats.rmTonne, 0)
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
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `ICCO Report - Yearly.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

// #############################################################
// -------------------------------------------------------------

const generateCocoaBeanPriceOfInternationalSignificanceReport = async (
  self,
  params,
  context,
) => {
  assertValidSession(context.activeSession);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  let query = {
    // $or: [],
  };
  // query.$or.push({
  //   date: {
  //     $gte: dayjs()
  //       .set("year", params.fromYearIds[0])
  //       .startOf("year")
  //       .format("YYYY-MM-DD"),
  //     $lte: dayjs()
  //       .set("year", params.toYearIds[0])
  //       .endOf("year")
  //       .format("YYYY-MM-DD"),
  //   },
  // });
  // if (query.$or.length === 0) {
  //   delete query.$or;
  // }
  query.year = {
    $gte: parseInt(params.fromYearIds[0]),
    $lte: parseInt(params.toYearIds[0]),
  };
  // console.log(JSON.stringify({ params, query }, null, 4));

  await context.collection("InternationalSignificancePrices").createIndex({
    date: 1,
  });
  const allInternationalSignificancePrices = await context
    .collection("InternationalSignificancePrices")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log(
  //   "allInternationalSignificancePrices",
  //   JSON.stringify(query, null, 4),
  //   allInternationalSignificancePrices.length,
  //   allInternationalSignificancePrices[0],
  // );
  const indexedInternationalSignificancePrices = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["year", "month"],
      // field: ["date"],
    },
  });
  indexedInternationalSignificancePrices.add(
    allInternationalSignificancePrices,
  );

  // ###########################################################################################
  // ###########################################################################################

  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const BASE_FONT_SIZE = 11;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    pageOrientation: "landscape",
    // pageOrientation: "portrait",
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: `Cocoa Bean Price Of International Significance Report`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 4,
      },
      {
        text: `From ${dayjs()
          .set("year", params.fromYearIds[0])
          .format("YYYY")} To  ${dayjs()
          .set("year", params.toYearIds[0])
          .format("YYYY")}`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 2,
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
          widths: [80, ...MONTHS.map(month => 47), 47],
          body: [
            [
              {
                text: "Year",
                alignment: "center",
                bold: true,
              },
              ...MONTHS.map(month => {
                return {
                  text: month,
                  alignment: "center",
                  bold: true,
                };
              }),
              {
                text: "Average",
                alignment: "center",
                bold: true,
              },
            ],
            [
              {
                text: "London Future",
                alignment: "center",
                bold: true,
                colSpan: 2 + MONTHS.length,
              },
              ...MONTHS.map(month => {
                return {
                  text: month,
                  alignment: "center",
                  bold: true,
                };
              }),
              {
                text: "Average",
                alignment: "center",
                bold: true,
              },
            ],
            ...(() => {
              let table = [];

              let diffYear = Math.max(
                0,
                parseInt(params.toYearIds[0]) - parseInt(params.fromYearIds[0]),
              );
              if (diffYear >= 0) {
                diffYear += 1;
              }
              [...new Array(diffYear)].forEach((_, yearIndex) => {
                let sumWholeYear = 0,
                  countWholeYear = 0;

                const currentYear = parseInt(params.fromYearIds[0]) + yearIndex;
                table.push([
                  {
                    text: currentYear,
                    alignment: "center",
                  },
                  ...MONTHS.map((month, monthIndex) => {
                    const endDate = dayjs()
                      .set("year", currentYear)
                      .set("month", monthIndex)
                      .endOf("month");
                    let currentDate = dayjs()
                      .set("year", currentYear)
                      .set("month", monthIndex)
                      .startOf("month");

                    let sumWholeMonth = 0,
                      countWholeMonth = 0;
                    // do {
                    const prices = indexedInternationalSignificancePrices.where(
                      {
                        year: parseInt(currentDate.get("year")),
                        month: parseInt(currentDate.get("month") + 1),
                        // date: currentDate.format("YYYY-MM-DD"),
                      },
                    );
                    // if (prices.length === 0) {
                    //   currentDate = currentDate.add(1, "day");
                    //   continue;
                    // }
                    // console.log(
                    //   monthIndex,
                    //   currentDate.format("YYYY-MM-DD"),
                    //   prices.length,
                    // );

                    for (const price of prices) {
                      if (isNaN(price.londonFuture)) continue;
                      sumWholeMonth += price.londonFuture;
                      countWholeMonth += 1;
                    }

                    //   currentDate = currentDate.add(1, "day");
                    // } while (!currentDate.isAfter(endDate));

                    let averageWholeMonth =
                      sumWholeMonth > 0 && countWholeMonth > 0
                        ? lodash.round(sumWholeMonth / countWholeMonth, 0)
                        : 0;
                    if (averageWholeMonth) {
                      sumWholeYear += averageWholeMonth;
                      countWholeYear += 1;
                    }

                    return {
                      text: averageWholeMonth || "-",
                      alignment: "center",
                    };
                  }),
                  {
                    text: (() => {
                      let averageWholeYear =
                        sumWholeYear > 0 && countWholeYear > 0
                          ? lodash.round(sumWholeYear / countWholeYear, 0)
                          : 0;

                      return averageWholeYear || "-";
                    })(),
                    alignment: "center",
                  },
                ]);
              });

              return table;
            })(),
            // #################################################################
            // #################################################################
            [
              {
                text: "New York Future",
                alignment: "center",
                bold: true,
                colSpan: 2 + MONTHS.length,
              },
              ...MONTHS.map(month => {
                return {
                  text: month,
                  alignment: "center",
                  bold: true,
                };
              }),
              {
                text: "Average",
                alignment: "center",
                bold: true,
              },
            ],
            ...(() => {
              let table = [];

              let diffYear = Math.max(
                0,
                parseInt(params.toYearIds[0]) - parseInt(params.fromYearIds[0]),
              );
              if (diffYear >= 0) {
                diffYear += 1;
              }
              [...new Array(diffYear)].forEach((_, yearIndex) => {
                let sumWholeYear = 0,
                  countWholeYear = 0;

                const currentYear = parseInt(params.fromYearIds[0]) + yearIndex;
                table.push([
                  {
                    text: currentYear,
                    alignment: "center",
                  },
                  ...MONTHS.map((month, monthIndex) => {
                    const endDate = dayjs()
                      .set("year", currentYear)
                      .set("month", monthIndex)
                      .endOf("month");
                    let currentDate = dayjs()
                      .set("year", currentYear)
                      .set("month", monthIndex)
                      .startOf("month");

                    let sumWholeMonth = 0,
                      countWholeMonth = 0;
                    // do {
                    const prices = indexedInternationalSignificancePrices.where(
                      {
                        year: parseInt(currentDate.get("year")),
                        month: parseInt(currentDate.get("month") + 1),
                        // date: currentDate.format("YYYY-MM-DD"),
                      },
                    );
                    // if (prices.length === 0) {
                    //   currentDate = currentDate.add(1, "day");
                    //   continue;
                    // }
                    // console.log(currentDate.format("YYYY-MM-DD"), prices.length);

                    for (const price of prices) {
                      if (isNaN(price.newYorkFuture)) continue;
                      sumWholeMonth += price.newYorkFuture;
                      countWholeMonth += 1;
                    }

                    //   currentDate = currentDate.add(1, "day");
                    // } while (!currentDate.isAfter(endDate));

                    let averageWholeMonth =
                      sumWholeMonth > 0 && countWholeMonth > 0
                        ? lodash.round(sumWholeMonth / countWholeMonth, 0)
                        : 0;
                    if (averageWholeMonth) {
                      sumWholeYear += averageWholeMonth;
                      countWholeYear += 1;
                    }

                    return {
                      text: averageWholeMonth || "-",
                      alignment: "center",
                    };
                  }),
                  {
                    text: (() => {
                      let averageWholeYear =
                        sumWholeYear > 0 && countWholeYear > 0
                          ? lodash.round(sumWholeYear / countWholeYear, 0)
                          : 0;

                      return averageWholeYear || "-";
                    })(),
                    alignment: "center",
                  },
                ]);
              });

              return table;
            })(),
          ],
        },
      },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Cocoa Bean Price Of International Significance Report.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateCocoaBeanMonthlyAverageAndHighLowReport = async (
  self,
  params,
  context,
) => {
  assertValidSession(context.activeSession);
  // console.log("generateCocoaBeanMonthlyAverageAndHighLowReport...");

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  let query = {
    // $or: [],
  };
  // for (const year of params.yearIds) {
  //   query.$or.push({
  //     date: {
  //       $gte: dayjs().set("year", year).startOf("year").format("YYYY-MM-DD"),
  //       $lte: dayjs().set("year", year).endOf("year").format("YYYY-MM-DD"),
  //     },
  //   });
  // }
  // if (query.$or.length === 0) {
  //   delete query.$or;
  // }
  query.year = {
    $in: params.yearIds.map(year => parseInt(year)),
  };
  // console.log(JSON.stringify({ params, query }, null, 4));

  await context.collection("MonthlyAverageHighLowICCO").createIndex({
    date: 1,
  });
  const allMonthlyAverageHighLowICCO = await context
    .collection("MonthlyAverageHighLowICCO")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log(
  //   "allMonthlyAverageHighLowICCO",
  //   allMonthlyAverageHighLowICCO.length,
  // );
  const indexedMonthlyAverageHighLowICCO = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["year", "month"],
      // field: ["date"],
    },
  });
  indexedMonthlyAverageHighLowICCO.add(allMonthlyAverageHighLowICCO);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 11;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    // pageOrientation: "landscape",
    pageOrientation: "portrait",
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: `Monthly Averages and High/Low of ICCO Daily Prices of Cocoa Beans`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 4,
      },
      {
        text: `For ${dayjs().set("year", params.yearIds[0]).format("YYYY")}`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 4,
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
          widths: [85, 70, 70, 70, 70, 70, 70],
          body: [
            [
              {
                text: "Month",
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
              {
                text: "DAILY PRICES (SDRs per tonne)",
                alignment: "center",
                bold: true,
                colSpan: 3,
              },
              "",
              "",
              {
                text: "DAILY PRICES (US dollars per tonne)",
                alignment: "center",
                bold: true,
                colSpan: 3,
              },
              "",
              "",
            ],
            [
              "",
              {
                text: "Average",
                alignment: "center",
                bold: true,
              },
              {
                text: "Highest",
                alignment: "center",
                bold: true,
              },
              {
                text: "Lowest",
                alignment: "center",
                bold: true,
              },
              {
                text: "Average",
                alignment: "center",
                bold: true,
              },
              {
                text: "Highest",
                alignment: "center",
                bold: true,
              },
              {
                text: "Lowest",
                alignment: "center",
                bold: true,
              },
            ],
            ...(() => {
              let table = [];

              let stats = {
                averageSDR: [],
                highestSDR: [],
                lowestSDR: [],
                averageUSD: [],
                highestUSD: [],
                lowestUSD: [],
              };

              const monthIndexes = [...new Array(12)];
              monthIndexes.forEach((_, monthIndex) => {
                // let stats = {
                //   SDR: [],
                //   USD: [],
                // };

                const endDate = dayjs()
                  .set("year", params.yearIds[0])
                  .set("month", monthIndex)
                  .endOf("month");
                let currentDate = dayjs()
                  .set("year", params.yearIds[0])
                  .set("month", monthIndex)
                  .startOf("month");

                // do {
                //   const prices = indexedMonthlyAverageHighLowICCO.where({
                //     date: currentDate.format("YYYY-MM-DD"),
                //   });
                //   // if (prices.length === 0) {
                //   //   currentDate = currentDate.add(1, "day");
                //   //   continue;
                //   // }
                //   // console.log(currentDate.format("YYYY-MM-DD"), prices.length);

                //   for (const price of prices) {
                //     if (price.price) {
                //       stats[price.currency].push(price.price);
                //     }
                //   }

                //   currentDate = currentDate.add(1, "day");
                // } while (!currentDate.isAfter(endDate));

                // for (const key in stats) {
                //   let { sum, highest, lowest } = stats[key].reduce(
                //     ({ sum, highest, lowest }, value) => {
                //       return {
                //         highest: value > highest ? value : highest,
                //         lowest: lowest === 0 || value < lowest ? value : lowest,
                //         sum: sum + value,
                //       };
                //     },
                //     {
                //       highest: 0,
                //       lowest: 0,
                //       sum: 0,
                //     },
                //   );
                //   let count = stats[key].length;
                //   let average =
                //     sum > 0 && count > 0 ? lodash.round(sum / count, 2) : 0;

                //   stats[key].average = average;
                //   stats[key].lowest = lowest;
                //   stats[key].highest = highest;
                // }

                // table.push([
                //   {
                //     marginLeft: 10,
                //     text: endDate.format("MMMM"),
                //   },
                //   {
                //     text: stats["SDR"].average || "-",
                //     alignment: "center",
                //   },
                //   {
                //     text: stats["SDR"].highest || "-",
                //     alignment: "center",
                //   },
                //   {
                //     text: stats["SDR"].lowest || "-",
                //     alignment: "center",
                //   },
                //   {
                //     text: stats["USD"].average || "-",
                //     alignment: "center",
                //   },
                //   {
                //     text: stats["USD"].highest || "-",
                //     alignment: "center",
                //   },
                //   {
                //     text: stats["USD"].lowest || "-",
                //     alignment: "center",
                //   },
                // ]);

                const price = indexedMonthlyAverageHighLowICCO.find({
                  // date: currentDate.format("YYYY-MM-DD"),
                  month: monthIndex + 1,
                });

                if (price) {
                  for (const key in stats) {
                    if (price && price[key]) {
                      stats[key].push(price[key]);
                    } else {
                      stats[key].push(0);
                    }
                  }
                }

                table.push([
                  {
                    marginLeft: 10,
                    text: endDate.format("MMMM"),
                  },
                  {
                    text: (price && price.averageSDR) || "-",
                    alignment: "center",
                  },
                  {
                    text: (price && price.highestSDR) || "-",
                    alignment: "center",
                  },
                  {
                    text: (price && price.lowestSDR) || "-",
                    alignment: "center",
                  },
                  {
                    text: (price && price.averageUSD) || "-",
                    alignment: "center",
                  },
                  {
                    text: (price && price.highestUSD) || "-",
                    alignment: "center",
                  },
                  {
                    text: (price && price.lowestUSD) || "-",
                    alignment: "center",
                  },
                ]);
              });

              for (const key in stats) {
                if (stats[key].length > 0) {
                  let sum = stats[key].reduce(
                    (sum, value) => sum + parseFloat(value),
                    0,
                  );
                  let count = stats[key].length;
                  stats[key] =
                    sum > 0 && count > 0 ? Math.round(sum / count, 0) : 0;
                } else {
                  stats[key] = "";
                }
              }
              table.push([
                {
                  marginLeft: 10,
                  text: "Average",
                  bold: true,
                  fillColor: "#f0f0f0",
                },
                {
                  text: (stats && stats.averageSDR) || "-",
                  bold: true,
                  fillColor: "#f0f0f0",
                  alignment: "center",
                },
                {
                  text: (stats && stats.highestSDR) || "-",
                  bold: true,
                  fillColor: "#f0f0f0",
                  alignment: "center",
                },
                {
                  text: (stats && stats.lowestSDR) || "-",
                  bold: true,
                  fillColor: "#f0f0f0",
                  alignment: "center",
                },
                {
                  text: (stats && stats.averageUSD) || "-",
                  bold: true,
                  fillColor: "#f0f0f0",
                  alignment: "center",
                },
                {
                  text: (stats && stats.highestUSD) || "-",
                  bold: true,
                  fillColor: "#f0f0f0",
                  alignment: "center",
                },
                {
                  text: (stats && stats.lowestUSD) || "-",
                  bold: true,
                  fillColor: "#f0f0f0",
                  alignment: "center",
                },
              ]);

              return table;
            })(),
          ],
        },
      },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Cocoa Bean Monthly Average And High Low Report.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateCocoaBeanMonthlyandAnnualAverageReport = async (
  self,
  params,
  context,
) => {
  assertValidSession(context.activeSession);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  let query = {
    // $or: [],
  };
  // query.$or.push({
  //   date: {
  //     $gte: dayjs()
  //       .set("year", params.fromYearIds[0])
  //       .startOf("year")
  //       .format("YYYY-MM-DD"),
  //     $lte: dayjs()
  //       .set("year", params.toYearIds[0])
  //       .endOf("year")
  //       .format("YYYY-MM-DD"),
  //   },
  // });
  // if (query.$or.length === 0) {
  //   delete query.$or;
  // }
  query.year = {
    $gte: parseInt(params.fromYearIds[0]),
    $lte: parseInt(params.toYearIds[0]),
  };
  // console.log(JSON.stringify({ params, query }, null, 4));

  await context.collection("MonthlyAnnualAverageICCOPrices").createIndex({
    date: 1,
  });
  const allMonthlyAnnualAverageICCOPrices = await context
    .collection("MonthlyAnnualAverageICCOPrices")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  console.log(
    "allMonthlyAnnualAverageICCOPrices",
    allMonthlyAnnualAverageICCOPrices.length,
  );
  const indexedMonthlyAnnualAverageICCOPrices = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["year", "month"],
      // field: ["date"],
    },
  });
  indexedMonthlyAnnualAverageICCOPrices.add(allMonthlyAnnualAverageICCOPrices);

  // ###########################################################################################
  // ###########################################################################################

  const MONTHS = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const BASE_FONT_SIZE = 11;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    pageOrientation: "landscape",
    // pageOrientation: "portrait",
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: `Cocoa Beans Monthly And Annual Average Report`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 4,
      },
      {
        text: `From ${dayjs()
          .set("year", params.fromYearIds[0])
          .format("YYYY")} To  ${dayjs()
          .set("year", params.toYearIds[0])
          .format("YYYY")}`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 2,
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
          widths: [80, ...MONTHS.map(month => 47), 47],
          body: [
            [
              {
                text: "Year",
                alignment: "center",
                bold: true,
              },
              ...MONTHS.map(month => {
                return {
                  text: month,
                  alignment: "center",
                  bold: true,
                };
              }),
              {
                text: "Average",
                alignment: "center",
                bold: true,
              },
            ],
            [
              {
                text: "US cent",
                alignment: "center",
                bold: true,
                colSpan: 2 + MONTHS.length,
              },
              ...MONTHS.map(month => {
                return {
                  text: month,
                  alignment: "center",
                  bold: true,
                };
              }),
              {
                text: "Average",
                alignment: "center",
                bold: true,
              },
            ],
            ...(() => {
              let table = [];

              let diffYear = Math.max(
                0,
                parseInt(params.toYearIds[0]) - parseInt(params.fromYearIds[0]),
              );
              if (diffYear >= 0) {
                diffYear += 1;
              }
              [...new Array(diffYear)].forEach((_, yearIndex) => {
                let sumWholeYear = 0,
                  countWholeYear = 0;

                const currentYear = parseInt(params.fromYearIds[0]) + yearIndex;
                table.push([
                  {
                    text: currentYear,
                    alignment: "center",
                  },
                  ...MONTHS.map((month, monthIndex) => {
                    const endDate = dayjs()
                      .set("year", currentYear)
                      .set("month", monthIndex)
                      .endOf("year");
                    let currentDate = dayjs()
                      .set("year", currentYear)
                      .set("month", monthIndex)
                      .startOf("year");

                    // let sumWholeMonth = 0,
                    //   countWholeMonth = 0;
                    // do {
                    //   const prices =
                    //     indexedMonthlyAnnualAverageICCOPrices.where({
                    //       date: currentDate.format("YYYY-MM-DD"),
                    //     });
                    //   // if (prices.length === 0) {
                    //   //   currentDate = currentDate.add(1, "day");
                    //   //   continue;
                    //   // }
                    //   // console.log(currentDate.format("YYYY-MM-DD"), prices.length);

                    //   for (const price of prices) {
                    //     if (isNaN(price.price) || price.currency !== "USD") {
                    //       continue;
                    //     }
                    //     sumWholeMonth += price.price;
                    //     countWholeMonth += 1;
                    //   }

                    //   currentDate = currentDate.add(1, "day");
                    // } while (!currentDate.isAfter(endDate));

                    // let averageWholeMonth =
                    //   sumWholeMonth > 0 && countWholeMonth > 0
                    //     ? lodash.round(sumWholeMonth / countWholeMonth, 0)
                    //     : 0;

                    const price = indexedMonthlyAnnualAverageICCOPrices.find({
                      month: monthIndex,
                    });
                    let averageWholeMonth = (price && price.usdCent) || 0;
                    if (averageWholeMonth) {
                      sumWholeYear += averageWholeMonth;
                      countWholeYear += 1;
                    }

                    return {
                      text: averageWholeMonth || "-",
                      alignment: "center",
                    };
                  }),
                  {
                    text: (() => {
                      let averageWholeYear =
                        sumWholeYear > 0 && countWholeYear > 0
                          ? lodash.round(sumWholeYear / countWholeYear, 0)
                          : 0;

                      return averageWholeYear || "-";
                    })(),
                    alignment: "center",
                  },
                ]);
              });

              return table;
            })(),
            // #################################################################
            // #################################################################
            [
              {
                text: "SDR tonne",
                alignment: "center",
                bold: true,
                colSpan: 2 + MONTHS.length,
              },
              ...MONTHS.map(month => {
                return {
                  text: month,
                  alignment: "center",
                  bold: true,
                };
              }),
              {
                text: "Average",
                alignment: "center",
                bold: true,
              },
            ],
            ...(() => {
              let table = [];

              let diffYear = Math.max(
                0,
                parseInt(params.toYearIds[0]) - parseInt(params.fromYearIds[0]),
              );
              if (diffYear >= 0) {
                diffYear += 1;
              }
              [...new Array(diffYear)].forEach((_, yearIndex) => {
                let sumWholeYear = 0,
                  countWholeYear = 0;

                const currentYear = parseInt(params.fromYearIds[0]) + yearIndex;
                table.push([
                  {
                    text: currentYear,
                    alignment: "center",
                  },
                  ...MONTHS.map((month, monthIndex) => {
                    const endDate = dayjs()
                      .set("year", currentYear)
                      .set("month", monthIndex)
                      .endOf("year");
                    let currentDate = dayjs()
                      .set("year", currentYear)
                      .set("month", monthIndex)
                      .startOf("year");

                    // let sumWholeMonth = 0,
                    //   countWholeMonth = 0;
                    // do {
                    //   const prices =
                    //     indexedMonthlyAnnualAverageICCOPrices.where({
                    //       date: currentDate.format("YYYY-MM-DD"),
                    //     });
                    //   // if (prices.length === 0) {
                    //   //   currentDate = currentDate.add(1, "day");
                    //   //   continue;
                    //   // }
                    //   // console.log(currentDate.format("YYYY-MM-DD"), prices.length);

                    //   for (const price of prices) {
                    //     if (isNaN(price.price) || price.currency !== "SDR") {
                    //       continue;
                    //     }
                    //     sumWholeMonth += price.price;
                    //     countWholeMonth += 1;
                    //   }

                    //   currentDate = currentDate.add(1, "day");
                    // } while (!currentDate.isAfter(endDate));

                    // let averageWholeMonth =
                    //   sumWholeMonth > 0 && countWholeMonth > 0
                    //     ? lodash.round(sumWholeMonth / countWholeMonth, 0)
                    //     : 0;

                    const price = indexedMonthlyAnnualAverageICCOPrices.find({
                      month: monthIndex,
                    });
                    let averageWholeMonth = (price && price.sdrTonne) || 0;
                    if (averageWholeMonth) {
                      sumWholeYear += averageWholeMonth;
                      countWholeYear += 1;
                    }

                    return {
                      text: averageWholeMonth || "-",
                      alignment: "center",
                    };
                  }),
                  {
                    text: (() => {
                      let averageWholeYear =
                        sumWholeYear > 0 && countWholeYear > 0
                          ? lodash.round(sumWholeYear / countWholeYear, 0)
                          : 0;

                      return averageWholeYear || "-";
                    })(),
                    alignment: "center",
                  },
                ]);
              });

              return table;
            })(),
          ],
        },
      },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Cocoa Bean Monthly And Annual Average Report.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateICCODailyPriceOfCocoaBeansReport = async (
  self,
  params,
  context,
) => {
  assertValidSession(context.activeSession);
  // console.log("generateICCODailyPriceOfCocoaBeansReport...");

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  let query = {
    $or: [],
  };
  query.$or.push({
    date: {
      $gte: dayjs()
        .set("year", params.yearIds[0])
        .startOf("year")
        .format("YYYY-MM-DD"),
      $lte: dayjs()
        .set("year", params.yearIds[0])
        .endOf("year")
        .format("YYYY-MM-DD"),
    },
  });
  if (query.$or.length === 0) {
    delete query.$or;
  }
  if (params.currencies) {
    query.currency = params.currencies[0];
  }
  // console.log(JSON.stringify({ params, query }, null, 4));

  await context.collection("GlobalICCOPrices").createIndex({
    date: 1,
  });
  let allGlobalICCOPrices = await context
    .collection("GlobalICCOPrices")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .sort({
      date: 1,
    })
    .toArray();
  // allGlobalICCOPrices = allGlobalICCOPrices.map(price => {
  //   return {
  //     ...price,
  //     yearMonthString: dayjs(price.date).format("YYYY-MM"),
  //   };
  // });
  // console.log(
  //   "allGlobalICCOPrices",
  //   allGlobalICCOPrices[0],
  //   allGlobalICCOPrices.length,
  // );
  const indexedGlobalICCOPrices = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["date"],
    },
  });
  indexedGlobalICCOPrices.add(allGlobalICCOPrices);

  // ###########################################################################################
  // ###########################################################################################

  const MONTHS = dayjs.months("end");

  const BASE_FONT_SIZE = 10.5;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    pageOrientation: "landscape",
    // pageOrientation: "portrait",
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: `ICCO Daily Prices Of Cocoa Beans For ${params.yearIds[0]} - ${params.currencies[0]}`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 4,
      },
      {
        marginTop: 20,
        layout: {
          ...defaultTableLayout,
          paddingTop: () => 1,
          paddingBottom: () => 1,
          paddingLeft: () => 3,
          paddingRight: () => 3,
        },
        table: {
          widths: [50, ...MONTHS.map(month => 55)],
          body: [
            [
              {
                text: "Date",
                alignment: "center",
                bold: true,
              },
              ...MONTHS.map(month => {
                return {
                  text: lodash.upperFirst(lodash.toLower(month)),
                  alignment: "center",
                  bold: true,
                };
              }),
            ],
            ...(() => {
              let table = [];

              const dates = [...new Array(31)];
              dates.forEach((_, dateIndex) => {
                let date = dateIndex + 1;
                table.push([
                  {
                    text: date,
                    alignment: "center",
                  },
                  ...MONTHS.map((month, monthIndex) => {
                    const dateToFind = `${params.yearIds[0]}-${(
                      "00" +
                      (monthIndex + 1)
                    ).slice(-2)}-${("00" + date).slice(-2)}`;
                    const foundGlobalICCOPrice = indexedGlobalICCOPrices.find({
                      date: dateToFind,
                    });
                    // console.log("dateToFind", dateToFind, !!foundGlobalICCOPrice);
                    return {
                      text:
                        (foundGlobalICCOPrice &&
                          foundGlobalICCOPrice.price &&
                          lodash.round(foundGlobalICCOPrice.price)) ||
                        "-",
                      alignment: "center",
                    };
                  }),
                ]);
              });

              return table;
            })(),
            // #################################################################
            // #################################################################
          ],
        },
      },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `ICCO Daily Price Of Cocoa Beans Report.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

// #############################################################
// -------------------------------------------------------------

const generateDailyInternationalCocoaPriceReport = async (
  self,
  params,
  context,
) => {
  assertValidSession(context.activeSession);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
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

  // await context.collection("GlobalCocoaPriceFutures").createIndex({
  //   date: 1,
  // });
  // const allGlobalCocoaPriceFutures = await context
  //   .collection("GlobalCocoaPriceFutures")
  //   .find({
  //     ...query,
  //     _deletedAt: {
  //       $exists: false,
  //     },
  //   })
  //   .toArray();
  await context.collection("GlobalPriceFutureMarketReuters").createIndex({
    date: 1,
  });
  const allGlobalCocoaPriceFutures = await context
    .collection("GlobalPriceFutureMarketReuters")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  const indexedGlobalCocoaPriceFutures = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["date"],
    },
  });
  indexedGlobalCocoaPriceFutures.add(allGlobalCocoaPriceFutures);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 11;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    // pageOrientation: "landscape",
    pageOrientation: "portrait",
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: `Daily International Cocoa Price - ${params.category}`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 4,
      },
      {
        text: `For ${dayjs()
          .set("month", params.monthIds[0])
          .set("year", params.yearIds[0])
          .format("MMMM, YYYY")}`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 2,
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
          widths: [120, 75, 75, 75, 80, 85],
          body: [
            [
              {
                marginTop: 8,
                text: "Date",
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
              {
                text: `${params.category} Cocoa Terminal ${
                  params.category === "London" ? "(Pound/tonne)" : "(USD/tonne)"
                }`,
                alignment: "center",
                bold: true,
                colSpan: 3,
              },
              "",
              "",
              {
                marginTop: 2,
                text: "Exchange Rate\n(RM)",
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
              {
                marginTop: 2,
                text: `${lodash.capitalize(
                  params.category.toLowerCase(),
                )} Terminal\n(RM/tonne)`,
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
            ],
            [
              "",
              {
                text: "High",
                alignment: "center",
                bold: true,
              },
              {
                text: "Low",
                alignment: "center",
                bold: true,
              },
              {
                text: "Close",
                alignment: "center",
                bold: true,
              },
              "",
              "",
            ],
            ...(() => {
              let table = [];

              const endDate = dayjs()
                .set("month", params.monthIds[0])
                .set("year", params.yearIds[0])
                .endOf("month");
              let currentDate = dayjs()
                .set("month", params.monthIds[0])
                .set("year", params.yearIds[0])
                .startOf("month");

              let stats = {
                highest: [],
                lowest: [],
                closed: [],
                exchangeRates: [],
                londonTerminal: [],
              };

              do {
                const prices = indexedGlobalCocoaPriceFutures.where({
                  date: currentDate.format("YYYY-MM-DD"),
                });
                // if (prices.length === 0) {
                //   currentDate = currentDate.add(1, "day");
                //   continue;
                // }

                // console.log(currentDate.format("YYYY-MM-DD"), prices.length);
                let indexedPrices = {
                  highest: [],
                  lowest: [],
                  closed: [],
                  exchangeRates: [],
                };
                for (const price of prices) {
                  if (params.category === "London") {
                    indexedPrices.highest.push(price.londonHigh);
                    indexedPrices.lowest.push(price.londonLow);
                    indexedPrices.closed.push(
                      price.londonAvg ||
                        // price.londonFuture ||
                        // price.londonClosed ||
                        0,
                    );
                    indexedPrices.exchangeRates.push(price.londonEx);
                  } else if (params.category === "New York") {
                    indexedPrices.highest.push(price.nyHigh);
                    indexedPrices.lowest.push(price.nyLow);
                    indexedPrices.closed.push(
                      price.nyAvg ||
                        // price.newYorkFuture ||
                        // price.nyClosed ||
                        0,
                    );
                    indexedPrices.exchangeRates.push(price.nyEx);
                  } else if (params.category === "Ghana") {
                    indexedPrices.highest.push(price.sgHigh);
                    indexedPrices.lowest.push(price.sgLow);
                    indexedPrices.closed.push(
                      price.sgAvg ||
                        // price.sgFuture ||
                        // price.sgClosed ||
                        0,
                    );
                    // indexedPrices.exchangeRates.push(price.sgEx);
                    indexedPrices.exchangeRates.push(price.londonEx);
                  }
                }
                for (const key in indexedPrices) {
                  if (key === "highest") {
                    indexedPrices[key] = indexedPrices[key].reduce(
                      (highest, value) => (highest < value ? value : highest),
                      indexedPrices[key][0] || 0,
                    );
                  } else if (key === "lowest") {
                    indexedPrices[key] = indexedPrices[key].reduce(
                      (lowest, value) => (lowest > value ? value : lowest),
                      indexedPrices[key][0] || 0,
                    );
                  } else {
                    let sum = indexedPrices[key].reduce(
                      (sum, value) => sum + value,
                      0,
                    );
                    let count = indexedPrices[key].length;
                    let average =
                      sum > 0 && count > 0 ? lodash.round(sum / count, 4) : 0;
                    indexedPrices[key] = average;
                  }
                }
                // console.log(currentDate.format("DD  dddd"), indexedPrices);

                table.push([
                  {
                    marginLeft: 10,
                    text: currentDate.format("DD  dddd"),
                  },
                  {
                    text: indexedPrices.highest
                      ? formatNumber(indexedPrices.highest, 0)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: indexedPrices.lowest
                      ? formatNumber(indexedPrices.lowest, 0)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: indexedPrices.closed
                      ? formatNumber(indexedPrices.closed, 0)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: indexedPrices.exchangeRates
                      ? formatNumber(
                          lodash.round(indexedPrices.exchangeRates, 4),
                          4,
                        )
                      : "-",
                    alignment: "center",
                  },
                  {
                    text:
                      formatNumber(
                        lodash.round(
                          indexedPrices.closed * indexedPrices.exchangeRates,
                          0,
                        ),
                        0,
                      ) || "-",
                    alignment: "center",
                  },
                ]);

                stats.highest.push(indexedPrices.highest);
                stats.lowest.push(indexedPrices.lowest);
                stats.closed.push(indexedPrices.closed);
                stats.exchangeRates.push(indexedPrices.exchangeRates);
                stats.londonTerminal.push(
                  lodash.round(
                    indexedPrices.closed * indexedPrices.exchangeRates,
                    0,
                  ),
                );

                currentDate = currentDate.add(1, "day");
              } while (!currentDate.isAfter(endDate));

              for (const key in stats) {
                const count = stats[key].filter(s => s > 0).length;
                const sum = (stats[key] || []).reduce(
                  (sum, value) => sum + value,
                  0,
                );
                stats[key] =
                  count !== 0 && sum !== 0 ? lodash.round(sum / count, 4) : 0;
              }

              stats.londonTerminal = roundUpIfGreaterThanSixty(
                stats.londonTerminal,
              );

              table.push([
                {
                  text: "Average",
                  alignment: "center",
                  bold: true,
                },
                {
                  text: stats.highest ? formatNumber(stats.highest, 0) : "-",
                  alignment: "center",
                  bold: true,
                },
                {
                  text: stats.lowest ? formatNumber(stats.lowest, 0) : "-",
                  alignment: "center",
                  bold: true,
                },
                {
                  text: stats.closed ? formatNumber(stats.closed, 0) : "-",
                  alignment: "center",
                  bold: true,
                },
                {
                  text: stats.exchangeRates
                    ? formatNumber(stats.exchangeRates, 4)
                    : "-",
                  alignment: "center",
                  bold: true,
                },
                {
                  text: stats.londonTerminal
                    ? formatNumber(stats.londonTerminal, 0)
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
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Daily International Cocoa Price Report.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateMonthlyInternationalCocoaPriceReport = async (
  self,
  params,
  context,
) => {
  assertValidSession(context.activeSession);
  // console.log("generateMonthlyInternationalCocoaPriceReport...", params);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
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

  // await context.collection("GlobalCocoaPriceFutures").createIndex({
  //   date: 1,
  // });
  // let allGlobalCocoaPriceFutures = await context
  //   .collection("GlobalCocoaPriceFutures")
  //   .find({
  //     ...query,
  //     _deletedAt: {
  //       $exists: false,
  //     },
  //   })
  //   .toArray();
  await context.collection("GlobalPriceFutureMarketReuters").createIndex({
    date: 1,
  });
  let allGlobalCocoaPriceFutures = await context
    .collection("GlobalPriceFutureMarketReuters")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  allGlobalCocoaPriceFutures = allGlobalCocoaPriceFutures.map(price => {
    return {
      ...price,
      monthIndex: dayjs(price.date).get("month"),
      yearIndex: dayjs(price.date).get("year"),
    };
  });
  const indexedGlobalCocoaPriceFutures = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["date", "monthIndex", "yearIndex"],
    },
  });
  indexedGlobalCocoaPriceFutures.add(allGlobalCocoaPriceFutures);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 11;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    // pageOrientation: "landscape",
    pageOrientation: "portrait",
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: `Monthly International Cocoa Price - ${
          params.category === "Ghana" ? "Spot Ghana" : params.category
        }`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 4,
      },
      {
        text: `For Year ${dayjs()
          .set("year", params.yearIds[0])
          .format("YYYY")}`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 2,
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
          widths: [120, 75, 75, 75, 80, 85],
          body: [
            [
              {
                marginTop: 8,
                text: "Month",
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
              {
                text: `${
                  params.category === "Ghana" ? "Spot Ghana" : params.category
                } Cocoa Terminal ${
                  params.category === "London" ? "(Pound/tonne)" : "(USD/tonne)"
                }`,
                alignment: "center",
                bold: true,
                colSpan: 3,
              },
              "",
              "",
              {
                marginTop: 2,
                text: "Exchange Rate\n(RM)",
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
              {
                marginTop: 2,
                text:
                  params.category === "Ghana"
                    ? `Spot Ghana Terminal\n(RM/tonne)`
                    : `${lodash.capitalize(
                        params.category.toLowerCase(),
                      )} Terminal\n(RM/tonne)`,
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
            ],
            [
              "",
              {
                text: "High",
                alignment: "center",
                bold: true,
              },
              {
                text: "Low",
                alignment: "center",
                bold: true,
              },
              {
                text: "Close",
                alignment: "center",
                bold: true,
              },
              "",
              "",
            ],
            ...(() => {
              let table = [];

              const endDate = dayjs()
                .set("year", params.yearIds[0])
                .set("month", 11)
                .startOf("month");
              let currentDate = dayjs()
                .set("year", params.yearIds[0])
                .set("month", 0)
                .startOf("year");

              let stats = {
                highest: [],
                lowest: [],
                closed: [],
                exchangeRates: [],
                londonTerminal: [],
              };

              let totalTerminal = 0;

              do {
                let pricesPerDates = indexedGlobalCocoaPriceFutures.where({
                  monthIndex: currentDate.get("month"),
                  yearIndex: currentDate.get("year"),
                  // date: dayjs(currentDate).format("YYYY-MM-DD"),
                });

                // // if (pricesPerDates.length > 1) {

                // //   throw new Error(
                // //     `Duplicate value at year ${currentDate.get(
                // //       "year",
                // //     )} and month ${currentDate.get("month") + 1}`,
                // //   );
                // // }

                if (pricesPerDates.length === 0) {
                  // Do Nothin
                } else {
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
                        "londonHigh",
                        "londonLow",
                        "londonAvg",
                        "londonEx",
                        "nyHigh",
                        "nyLow",
                        "nyAvg",
                        "nyEx",
                        "sgHigh",
                        "sgLow",
                        "sgAvg",
                        "sgEx",
                      ]) {
                        prices[groupKey][key] = 0;
                      }
                    }
                    for (const key of [
                      "londonHigh",
                      "londonLow",
                      "londonAvg",
                      "londonEx",
                      "nyHigh",
                      "nyLow",
                      "nyAvg",
                      "nyEx",
                      "sgHigh",
                      "sgLow",
                      "sgAvg",
                      "sgEx",
                    ]) {
                      if (!price[key]) continue;
                      prices[groupKey][key] += price[key];
                      if (!prices[groupKey]["count" + key]) {
                        prices[groupKey]["count" + key] = 0;
                      }
                      prices[groupKey]["count" + key] += 1;
                    }
                  }
                  for (const groupKey in prices) {
                    for (const key of [
                      "londonHigh",
                      "londonLow",
                      "londonAvg",
                      "londonEx",
                      "nyHigh",
                      "nyLow",
                      "nyAvg",
                      "nyEx",
                      "sgHigh",
                      "sgLow",
                      "sgAvg",
                      "sgEx",
                    ]) {
                      const count = prices[groupKey]["count" + key];
                      const sum = prices[groupKey][key];
                      prices[groupKey][key] =
                        sum !== 0 && count !== 0 ? sum / count : 0;
                    }
                  }
                  // console.log({ prices });
                  prices = Object.values(prices);
                  // --------------------------------------------------------------
                  // const prices = indexedGlobalCocoaPriceFutures.where({
                  //   monthIndex: currentDate.get("month"),
                  //   yearIndex: currentDate.get("year"),
                  // });
                  // if (currentDate.get("month") === 7) {
                  //   console.log(
                  //     currentDate.get("year"),
                  //     currentDate.get("month"),
                  //     // prices.map(price => price.date),
                  //     prices.map(
                  //       price => `${price.date} => ${price.countlondonHigh}`,
                  //     ),
                  //     prices.length,
                  //   );
                  // }
                  // if (prices.length === 0) {
                  //   currentDate = currentDate.add(1, "month").startOf("month");
                  //   continue;
                  // }
                  // console.log(currentDate.format("YYYY-MM-DD"), prices.length);
                  let indexedPrices = {
                    highest: [],
                    lowest: [],
                    closed: [],
                    exchangeRates: [],
                    terminal: [],
                  };
                  for (const price of prices) {
                    // if (price.date === "2021-08-30") {
                    //   console.log({ price });
                    // }
                    // if (price.date === "2021-08-31") {
                    //   console.log({ price });
                    // }
                    if (params.category === "London") {
                      // if (!price.countlondonHigh) continue;
                      // if (currentDate.get("month") === 7) {
                      //   console.log(
                      //     `${price.date} => ${price.countlondonHigh}`,
                      //     price.londonHigh,
                      //     price.londonLow,
                      //     price.londonAvg,
                      //     price.londonEx,
                      //   );
                      // }
                      if (price.londonHigh > 0) {
                        indexedPrices.highest.push(price.londonHigh);
                      }
                      // indexedPrices.lowest.push(price.londonLow);
                      if (price.londonLow > 0) {
                        indexedPrices.lowest.push(price.londonLow);
                      }
                      if (price.londonAvg > 0) {
                        indexedPrices.closed.push(
                          price.londonAvg ||
                            // price.londonFuture ||
                            // price.londonClosed ||
                            0,
                        );
                      }
                      if (price.londonEx > 0) {
                        indexedPrices.exchangeRates.push(price.londonEx);
                        if (price.londonAvg * price.londonEx > 0) {
                          indexedPrices.terminal.push(
                            lodash.round(price.londonAvg * price.londonEx, 0),
                          );
                        }
                      }
                    } else if (params.category === "New York") {
                      // if (!price.countnyHigh) continue;
                      if (price.nyHigh > 0) {
                        indexedPrices.highest.push(price.nyHigh);
                      }
                      // indexedPrices.lowest.push(price.nyLow);
                      if (price.nyLow > 0) {
                        indexedPrices.lowest.push(price.nyLow);
                      }
                      if (price.nyAvg > 0) {
                        indexedPrices.closed.push(
                          price.nyAvg ||
                            // price.newYorkFuture ||
                            // price.nyClosed ||
                            0,
                        );
                      }
                      if (price.nyEx > 0) {
                        indexedPrices.exchangeRates.push(price.nyEx);
                        if (price.nyAvg * price.nyEx > 0) {
                          indexedPrices.terminal.push(
                            lodash.round(price.nyAvg * price.nyEx, 0),
                          );
                        }
                      }
                    } else if (params.category === "Ghana") {
                      // if (!price.countsgHigh) continue;
                      if (price.sgHigh > 0) {
                        indexedPrices.highest.push(price.sgHigh);
                      }
                      // indexedPrices.lowest.push(price.sgLow);
                      if (price.sgLow > 0) {
                        indexedPrices.lowest.push(price.sgLow);
                      }
                      if (price.sgAvg > 0) {
                        indexedPrices.closed.push(
                          price.sgAvg ||
                            // price.sgFuture ||
                            // price.sgClosed ||
                            0,
                        );
                      }
                      // if (price.sgEx > 0) {
                      //   indexedPrices.exchangeRates.push(price.sgEx);
                      //   if (price.sgAvg * price.sgEx > 0) {
                      //     indexedPrices.terminal.push(
                      //       lodash.round(price.sgAvg * price.sgEx, 0),
                      //     );
                      //   }
                      // }
                      if (price.londonEx > 0) {
                        indexedPrices.exchangeRates.push(price.londonEx);
                        if (price.sgAvg * price.londonEx > 0) {
                          indexedPrices.terminal.push(
                            lodash.round(price.sgAvg * price.londonEx, 0),
                          );
                        }
                      }
                    }
                  }
                  // if (currentDate.get("month") === 7) {
                  //   console.log("indexedPrices.terminal", indexedPrices.terminal);
                  // }
                  // console.log(indexedPrices);
                  for (const key in indexedPrices) {
                    if (key === "highest") {
                      indexedPrices[key] = indexedPrices[key].reduce(
                        (highest, value) => (highest < value ? value : highest),
                        indexedPrices[key][0] || 0,
                      );
                    } else if (key === "lowest") {
                      indexedPrices[key] = indexedPrices[key].reduce(
                        (lowest, value) => (lowest > value ? value : lowest),
                        indexedPrices[key][0] || 0,
                      );
                    } else {
                      let sum = indexedPrices[key].reduce(
                        (sum, value) => sum + value,
                        0,
                      );
                      let count = indexedPrices[key].length;
                      let average =
                        sum > 0 && count > 0 ? lodash.round(sum / count, 4) : 0;
                      indexedPrices[key] = average;
                      // if (currentDate.get("month") === 7 && key === "terminal") {
                      //   console.log(
                      //     "indexedPrices.terminal",
                      //     indexedPrices.terminal,
                      //   );
                      //   console.log({
                      //     sum,
                      //     count,
                      //     average,
                      //   });
                      // }
                    }
                  }
                  totalTerminal += Math.round(indexedPrices.terminal, 4);
                  table.push([
                    {
                      // marginLeft: 10,
                      text: currentDate.format("MMMM"),
                      alignment: "center",
                    },
                    {
                      text: indexedPrices.highest
                        ? formatNumber(indexedPrices.highest, 0)
                        : "-",
                      alignment: "center",
                    },
                    {
                      text: indexedPrices.lowest
                        ? formatNumber(indexedPrices.lowest, 0)
                        : "-",
                      alignment: "center",
                    },
                    {
                      text: indexedPrices.closed
                        ? formatNumber(indexedPrices.closed, 0)
                        : "-",
                      alignment: "center",
                    },
                    {
                      text: indexedPrices.exchangeRates
                        ? formatNumber(
                            lodash.round(indexedPrices.exchangeRates, 4),
                            4,
                          )
                        : "-",
                      alignment: "center",
                    },
                    {
                      text:
                        formatNumber(
                          lodash.round(
                            roundUpIfGreaterThanSixty(indexedPrices.terminal),
                            0,
                          ),
                          0,
                        ) || "-",
                      alignment: "center",
                    },
                  ]);
                  stats.highest.push(indexedPrices.highest);
                  stats.lowest.push(indexedPrices.lowest);
                  stats.closed.push(indexedPrices.closed);
                  stats.exchangeRates.push(indexedPrices.exchangeRates);
                  stats.londonTerminal.push(
                    0,
                    // lodash.round(
                    //   indexedPrices.closed * indexedPrices.exchangeRates,
                    //   0,
                    // ),
                  );
                }

                currentDate = currentDate.add(1, "month").startOf("month");
              } while (!currentDate.isAfter(endDate));
              for (const key in stats) {
                const count = stats[key].length;
                const sum = (stats[key] || []).reduce(
                  (sum, value) => sum + value,
                  0,
                );
                stats[key] = count !== 0 && sum !== 0 ? sum / count : 0;
                // stats[key] =
                //   count !== 0 && sum !== 0 ? lodash.round(sum / count, 4) : 0;
              }

              let averageTotalTerminal =
                "" + lodash.round(totalTerminal / 12, 2);

              averageTotalTerminal = parseInt(
                averageTotalTerminal.split(".")[0],
              );

              stats.closed = "" + stats.closed;
              stats.closed = parseInt(stats.closed.split(".")[0]);

              let truncatedExchangeRates =
                Math.floor(stats.exchangeRates * Math.pow(10, 4)) /
                Math.pow(10, 4);

              truncatedExchangeRates = lodash.round(truncatedExchangeRates, 4);

              table.push([
                {
                  text: "Average",
                  alignment: "center",
                  bold: true,
                },
                {
                  text: stats.highest ? formatNumber(stats.highest, 0) : "-",
                  alignment: "center",
                  bold: true,
                },
                {
                  text: stats.lowest
                    ? formatNumber(Math.floor(stats.lowest), 0)
                    : "-",
                  alignment: "center",
                  bold: true,
                },
                {
                  text: stats.closed ? formatNumber(stats.closed, 0) : "-",
                  alignment: "center",
                  bold: true,
                },
                {
                  text: stats.exchangeRates
                    ? truncatedExchangeRates //formatNumber(stats.exchangeRates, 4)
                    : "-",
                  alignment: "center",
                  bold: true,
                },
                {
                  text: averageTotalTerminal
                    ? formatNumber(averageTotalTerminal)
                    : "-",
                  alignment: "center",
                  bold: true,
                  // text: stats.londonTerminal
                  //   ? formatNumber(stats.londonTerminal, 2)
                  //   : "-",
                  // alignment: "center",
                  // bold: true,
                },
              ]);

              return table;
            })(),
          ],
        },
      },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Monthly International Cocoa Price Report.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateYearlyInternationalCocoaPriceReport = async (
  self,
  params,
  context,
) => {
  assertValidSession(context.activeSession);
  // console.log("generateYearlyInternationalCocoaPriceReport...", params);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
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

  // await context.collection("GlobalCocoaPriceFutures").createIndex({
  //   date: 1,
  // });
  // let allGlobalCocoaPriceFutures = await context
  //   .collection("GlobalCocoaPriceFutures")
  //   .find({
  //     ...query,
  //     _deletedAt: {
  //       $exists: false,
  //     },
  //   })
  //   .toArray();
  await context.collection("GlobalPriceFutureMarketReuters").createIndex({
    date: 1,
  });
  let allGlobalCocoaPriceFutures = await context
    .collection("GlobalPriceFutureMarketReuters")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  allGlobalCocoaPriceFutures = allGlobalCocoaPriceFutures.map(price => {
    return {
      ...price,
      // monthIndex: dayjs(price.date).get("month"),
      yearIndex: dayjs(price.date).get("year"),
    };
  });
  const indexedGlobalCocoaPriceFutures = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["date", "monthIndex", "yearIndex"],
    },
  });
  indexedGlobalCocoaPriceFutures.add(allGlobalCocoaPriceFutures);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 11;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    // pageOrientation: "landscape",
    pageOrientation: "portrait",
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: `Yearly International Cocoa Price - ${
          params.category === "Ghana" ? "Spot Ghana" : params.category
        }`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 4,
      },
      {
        text: `For Year ${dayjs()
          .set("year", params.fromYearIds[0])
          .format("YYYY")} to ${dayjs()
          .set("year", params.toYearIds[0])
          .format("YYYY")}`,
        bold: true,
        alignment: "center",
        fontSize: BASE_FONT_SIZE + 2,
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
          widths: [120, 75, 75, 75, 80, 85],
          body: [
            [
              {
                marginTop: 8,
                text: "Year",
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
              {
                text: `${
                  params.category === "Ghana" ? "Spot Ghana" : params.category
                } Cocoa Terminal ${
                  params.category === "London" ? "(Pound/tonne)" : "(USD/tonne)"
                }`,
                alignment: "center",
                bold: true,
                colSpan: 3,
              },
              "",
              "",
              {
                marginTop: 2,
                text: "Exchange Rate\n(RM)",
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
              {
                marginTop: 2,
                text:
                  params.category === "Ghana"
                    ? `Spot Ghana Terminal\n(RM/tonne)`
                    : `${lodash.capitalize(
                        params.category.toLowerCase(),
                      )} Terminal\n(RM/tonne)`,
                alignment: "center",
                bold: true,
                rowSpan: 2,
              },
            ],
            [
              "",
              {
                text: "High",
                alignment: "center",
                bold: true,
              },
              {
                text: "Low",
                alignment: "center",
                bold: true,
              },
              {
                text: "Close",
                alignment: "center",
                bold: true,
              },
              "",
              "",
            ],
            ...(() => {
              let table = [];

              const endDate = dayjs()
                .set(
                  "year",
                  parseInt(params.fromYearIds[0]) <
                    parseInt(params.toYearIds[0])
                    ? params.toYearIds[0]
                    : params.fromYearIds[0],
                )
                .startOf("year");
              let currentDate = dayjs()
                .set(
                  "year",
                  parseInt(params.fromYearIds[0]) <
                    parseInt(params.toYearIds[0])
                    ? params.fromYearIds[0]
                    : params.toYearIds[0],
                )
                .startOf("year");

              do {
                const prices = indexedGlobalCocoaPriceFutures.where({
                  yearIndex: currentDate.get("year"),
                });
                // console.log(currentDate.get("year"), prices.length);

                // if (prices.length === 0) {
                //   currentDate = currentDate.add(1, "year").startOf("year");
                //   continue;
                // }
                // console.log(currentDate.format("YYYY-MM-DD"), prices.length);
                let indexedPrices = {
                  highest: [],
                  lowest: [],
                  closed: [],
                  exchangeRates: [],
                  exchangeRatesPerMonthPerYear: [],

                  closedPerMonthPerYear: [],
                };
                let total = [];
                let totalEx = 0;

                for (const price of prices) {
                  if (params.category === "London") {
                    indexedPrices.highest.push(price.londonHigh);
                    if (price.londonLow > 0) {
                      indexedPrices.lowest.push(price.londonLow);
                    }
                    // indexedPrices.lowest.push(price.londonLow);
                    // indexedPrices.closed.push(
                    //   price.londonAvg ||
                    //     // price.londonFuture ||
                    //     // price.londonClosed ||
                    //     0,
                    // );
                    if (price.londonAvg > 0) {
                      indexedPrices.closed.push(
                        price.londonAvg ||
                          // price.londonFuture ||
                          // price.londonClosed ||
                          0,
                      );
                      indexedPrices.closedPerMonthPerYear.push({
                        date: price.date,
                        avg: price.londonAvg,
                      });
                    }
                    // indexedPrices.exchangeRates.push(price.londonEx);
                    if (price.londonEx > 0) {
                      indexedPrices.exchangeRates.push(price.londonEx);
                      indexedPrices.exchangeRatesPerMonthPerYear.push({
                        date: price.date,
                        exc: price.londonEx,
                        terminal: price.londonEx * price.londonAvg,
                      });

                      total.push(price.londonEx);
                      totalEx += price.londonEx;
                    }
                  } else if (params.category === "New York") {
                    indexedPrices.highest.push(price.nyHigh);

                    // indexedPrices.lowest.push(price.nyLow);
                    if (price.nyLow > 0) {
                      indexedPrices.lowest.push(price.nyLow);
                    }

                    if (price.nyAvg > 0) {
                      indexedPrices.closed.push(
                        price.nyAvg ||
                          // price.newYorkFuture ||
                          // price.nyClosed ||
                          0,
                      );
                      indexedPrices.closedPerMonthPerYear.push({
                        date: price.date,
                        avg: price.nyAvg,
                      });
                    }

                    if (price.nyEx > 0) {
                      indexedPrices.exchangeRates.push(price.nyEx);

                      indexedPrices.exchangeRatesPerMonthPerYear.push({
                        date: price.date,
                        exc: price.nyEx,
                        terminal: price.nyEx * price.nyAvg,
                      });
                    }
                  } else if (params.category === "Ghana") {
                    indexedPrices.highest.push(price.sgHigh);
                    // indexedPrices.lowest.push(price.sgLow);
                    if (price.sgLow > 0) {
                      indexedPrices.lowest.push(price.sgLow);
                    }

                    if (price.sgAvg > 0) {
                      indexedPrices.closed.push(
                        price.sgAvg ||
                          // price.sgFuture ||
                          // price.sgClosed ||
                          0,
                      );
                      indexedPrices.closedPerMonthPerYear.push({
                        date: price.date,
                        avg: price.sgAvg,
                      });
                    }

                    if (price.londonEx > 0) {
                      indexedPrices.exchangeRates.push(price.londonEx);
                      indexedPrices.exchangeRatesPerMonthPerYear.push({
                        date: price.date,
                        exc: price.londonEx,
                        terminal: price.londonEx * price.sgAvg,
                      });
                    }
                  }
                }

                const currentYear = currentDate.get("year");

                let tmpAvg = [];
                let tmpTerminal = [];
                let tmpClosed = [];
                //Get prices in 12 month in one year
                for (let i = 1; i <= 12; i++) {
                  const pricePerMonth =
                    indexedPrices.exchangeRatesPerMonthPerYear.filter(p => {
                      const y = dayjs(p.date).get("year");
                      const m = dayjs(p.date).get("month") + 1;
                      if (y === currentYear && m === i) {
                        return p;
                      }
                    });

                  const sum = pricePerMonth
                    .map(pr => pr.exc)
                    .reduce((acc, curr) => acc + curr, 0);
                  const count = pricePerMonth.length;
                  tmpAvg.push(sum / count);

                  //=== Terminal ===//
                  const terminalData = pricePerMonth
                    .filter(d => d.terminal > 0)
                    .map(dt => lodash.round(dt.terminal, 0));

                  const totalTerminal = terminalData.reduce(
                    (acc, curr) => acc + curr,
                    0,
                  );

                  const totalDataTerminal = terminalData.length;
                  const averageTerminal = Math.round(
                    totalTerminal / totalDataTerminal,
                    4,
                  );

                  tmpTerminal.push(averageTerminal);

                  const closedPerMonth =
                    indexedPrices.closedPerMonthPerYear.filter(p => {
                      const y = dayjs(p.date).get("year");
                      const m = dayjs(p.date).get("month") + 1;
                      if (y === currentYear && m === i) {
                        return p;
                      }
                    });

                  const sumClosed = closedPerMonth
                    .map(pr => pr.avg)
                    .reduce((acc, curr) => acc + curr, 0);
                  const countClosed = closedPerMonth.length;

                  // tmpClosed.push(lodash.round(sumClosed / countClosed, 4));
                  tmpClosed.push(sumClosed / countClosed);
                }

                indexedPrices.exchangeRates = tmpAvg;
                indexedPrices.closed = tmpClosed;

                const terminalValueTotal = tmpTerminal.reduce(
                  (acc, curr) => acc + curr,
                  0,
                );
                const terminalValueCount = tmpTerminal.length;

                // const terminal = lodash.round(
                //   terminalValueTotal / terminalValueCount,
                //   2,
                // );

                let terminal = "" + terminalValueTotal / terminalValueCount;
                terminal = parseInt(terminal.split(".")[0]);
                for (const key in indexedPrices) {
                  if (key === "highest") {
                    indexedPrices[key] = indexedPrices[key].reduce(
                      (highest, value) => (highest < value ? value : highest),
                      indexedPrices[key][0] || 0,
                    );
                  } else if (key === "lowest") {
                    indexedPrices[key] = indexedPrices[key].reduce(
                      (lowest, value) => (lowest > value ? value : lowest),
                      indexedPrices[key][0] || 0,
                    );
                  } else {
                    if (key === "exchangeRates") {
                      let sum = indexedPrices[key].reduce(
                        (sum, value) => sum + value,
                        0,
                      );

                      let count = indexedPrices[key].length;
                      let average = sum > 0 && count > 0 ? sum / count : 0;
                      indexedPrices[key] = average;
                    } else {
                      let sum = indexedPrices[key].reduce(
                        (sum, value) => sum + value,
                        0,
                      );

                      let count = indexedPrices[key].length;
                      let average =
                        sum > 0 && count > 0 ? lodash.round(sum / count, 4) : 0;
                      indexedPrices[key] = average;
                    }
                  }
                }
                // console.log(currentDate.format("DD  dddd"), indexedPrices);

                indexedPrices.closed = "" + indexedPrices.closed;
                indexedPrices.closed = parseInt(
                  indexedPrices.closed.split(".")[0],
                );

                let truncatedExchangeRates =
                  Math.floor(indexedPrices.exchangeRates * Math.pow(10, 4)) /
                  Math.pow(10, 4);

                truncatedExchangeRates = String(truncatedExchangeRates);

                if (truncatedExchangeRates.length < 6) {
                  truncatedExchangeRates = truncatedExchangeRates + "0";
                }

                table.push([
                  {
                    // marginLeft: 10,
                    text: currentDate.format("YYYY"),
                    alignment: "center",
                  },
                  {
                    text: indexedPrices.highest
                      ? formatNumber(indexedPrices.highest, 0)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: indexedPrices.lowest
                      ? formatNumber(indexedPrices.lowest, 0)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: indexedPrices.closed
                      ? formatNumber(indexedPrices.closed, 0)
                      : "-",
                    alignment: "center",
                  },
                  {
                    text: indexedPrices.exchangeRates
                      ? truncatedExchangeRates
                      : // formatNumber(
                        //     lodash.round(indexedPrices.exchangeRates, 4),
                        //     4,
                        //   )
                        "-",
                    alignment: "center",
                  },
                  {
                    text: formatNumber(lodash.round(terminal, 4), 0) || "-",
                    alignment: "center",
                  },
                ]);

                currentDate = currentDate.add(1, "year").startOf("year");
              } while (!currentDate.isAfter(endDate));

              return table;
            })(),
          ],
        },
      },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Yearly International Cocoa Price Report.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

module.exports = {
  generateDailyReportForGlobalICCOPrices,
  generateMonthlyReportForGlobalICCOPrices,
  generateYearlyReportForGlobalICCOPrices,

  generateCocoaBeanPriceOfInternationalSignificanceReport,
  generateCocoaBeanMonthlyAverageAndHighLowReport,
  generateCocoaBeanMonthlyandAnnualAverageReport,
  generateICCODailyPriceOfCocoaBeansReport,

  generateDailyInternationalCocoaPriceReport,
  generateMonthlyInternationalCocoaPriceReport,
  generateYearlyInternationalCocoaPriceReport,
};

const roundUpIfGreaterThanSixty = value => {
  // Separate the whole number and decimal part
  const integerValue = Math.floor(value);
  const decimalValue = value - integerValue;

  // Check if the decimal part is greater than 0.60
  if (decimalValue >= 0.6) {
    // If yes, round up the whole number
    return Math.ceil(value);
  } else {
    // If no, keep the original whole number
    return integerValue;
  }
};
