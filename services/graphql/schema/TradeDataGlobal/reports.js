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

const generateGlobalTradeDataCocoaProductByCountryReport = async (
  self,
  params,
  context,
) => {
  // console.log("generateDomesticTradeExportImportReport", params);
  assertValidSession(context.activeSession);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  let allCountries = await context
    .collection("Countries")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();

  const allGlobalSITCProducts = await context
    .collection("GlobalSITCProducts")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log("allGlobalSITCProducts", allGlobalSITCProducts.length);
  const indexedGlobalSITCProducts = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["product"],
    },
  });
  indexedGlobalSITCProducts.add(allGlobalSITCProducts);
  const selectedProducts = allGlobalSITCProducts.filter(
    item => item.product === params.product,
  );
  // console.log({ params, selectedProducts });

  let diffYear = Math.max(
    0,
    parseInt(String(params.toYear)?.split("/")[0]) -
      parseInt(String(params.fromYear)?.split("/")[0]),
  );
  if (diffYear >= 0) {
    diffYear += 1;
  }
  if (diffYear > 5) {
    diffYear = 5;
  }
  let YEARS = [...new Array(diffYear)].map((_, yearIndex) => {
    let currentYear = parseInt(params.fromYear) + yearIndex;
    currentYear += "/" + String(currentYear + 1).slice(-2);
    return currentYear;
  });
  // console.log({ YEARS });

  let query = {
    $or: [],
  };
  query.year = {
    $in: YEARS,
  };
  query.type = params.type;
  query.globalSITCProductId = {
    $in: selectedProducts.map(item => item._id),
  };
  if (query.$or.length === 0) {
    delete query.$or;
  }
  await context.collection("GlobalTradeDatas").createIndex({
    year: 1,
  });
  const allGlobalTradeDatas = await context
    .collection("GlobalTradeDatas")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  let groupedGlobalTradeDatas = lodash.groupBy(
    allGlobalTradeDatas,
    "countryId",
  );
  for (const countryId in groupedGlobalTradeDatas) {
    groupedGlobalTradeDatas[countryId] = {
      countryId,
      count: groupedGlobalTradeDatas[countryId].length,
    };
  }
  groupedGlobalTradeDatas = Object.values(groupedGlobalTradeDatas);
  groupedGlobalTradeDatas = lodash.orderBy(
    groupedGlobalTradeDatas,
    ["count"],
    ["desc"],
  );
  groupedGlobalTradeDatas = groupedGlobalTradeDatas.slice(0, 10);
  const topTenCountryIds = groupedGlobalTradeDatas.map(item => item.countryId);
  allCountries = allCountries.filter(country =>
    topTenCountryIds.includes(country._id),
  );
  // console.log({ groupedGlobalTradeDatas });

  // console.log(
  //   JSON.stringify({ params, query }, null, 4),
  //   allGlobalTradeDatas.length,
  // );
  const indexedGlobalTradeDatas = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["countryId", "year"],
    },
  });
  indexedGlobalTradeDatas.add(allGlobalTradeDatas);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 10;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    pageOrientation: "portrait",
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: `${params.type} Of ${params.product} By Country (tonne)`,
        alignment: "center",
        bold: true,
        fontSize: BASE_FONT_SIZE + 3,
      },
      {
        // pageBreak: index === 0 ? "" : "before",
        marginTop: 20,
        layout: {
          ...defaultTableLayout,
          paddingTop: () => 4,
          paddingBottom: () => 4,
          paddingLeft: () => 3,
          paddingRight: () => 3,
        },
        table: {
          widths: [
            100,
            ...YEARS.reduce((all, year) => {
              all.push(63);
              all.push(63);
              return all;
            }, []),
          ],
          body: [
            [
              {
                text: "Country",
                bold: true,
                alignment: "center",
              },
              ...YEARS.reduce((all, year) => {
                all.push({
                  text: year,
                  bold: true,
                  alignment: "center",
                });
                return all;
              }, []),
            ],
            ...(() => {
              let table = [];

              let total = {};
              for (const country of allCountries) {
                const tradeDatas = indexedGlobalTradeDatas.where({
                  countryId: country._id,
                });
                if (tradeDatas.length === 0) continue;

                table.push([
                  {
                    text: country.name,
                    // alignment: "center",
                  },
                  ...YEARS.reduce((all, year) => {
                    const tradeDatas = indexedGlobalTradeDatas.where({
                      countryId: country._id,
                      year,
                    });
                    let stats = {
                      quantity: 0,
                      value: 0,
                    };
                    for (const tradeData of tradeDatas) {
                      stats.quantity = tradeData.quantity;
                      // stats.value = tradeData.value;
                    }

                    if (!total[year]) {
                      total[year] = {
                        quantity: 0,
                        value: 0,
                      };
                    }
                    total[year].quantity += stats.quantity;
                    // total[year].value += stats.value;
                    all.push({
                      text: formatNumber(stats.quantity),
                      alignment: "right",
                    });
                    // all.push({
                    //   text: formatNumber(stats.value),
                    //   alignment: "right",
                    // });
                    return all;
                  }, []),
                ]);
              }

              table.push([
                {
                  text: "World Total",
                  // alignment: "center",
                  bold: true,
                },
                ...YEARS.reduce((all, year) => {
                  all.push({
                    text: formatNumber(total[year] && total[year].quantity),
                    alignment: "right",
                    bold: true,
                  });
                  // all.push({
                  //   text: formatNumber(total[year] && total[year].value),
                  //   alignment: "right",
                  //   bold: true,
                  // });
                  return all;
                }, []),
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
    filename: `Global Trade Data Cocoa Product By Country Report.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateGlobalTradeDataCocoaProductByRegionReport = async (
  self,
  params,
  context,
) => {
  // console.log("generateDomesticTradeExportImportReport", params);
  assertValidSession(context.activeSession);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  const allCountries = await context
    .collection("Countries")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  const allCountriesByRegionId = lodash.groupBy(
    allCountries,
    "countryRegionId",
  );

  let allCountryRegions = await context
    .collection("CountryRegions")
    .find({
      _id: {
        $in: Object.keys(allCountriesByRegionId),
      },
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log({ allCountryRegions });
  allCountryRegions = allCountryRegions.map(item => {
    return {
      ...item,
      countries: allCountriesByRegionId[item._id] || [],
    };
  });

  const allGlobalSITCProducts = await context
    .collection("GlobalSITCProducts")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log("allGlobalSITCProducts", allGlobalSITCProducts.length);
  const indexedGlobalSITCProducts = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["product"],
    },
  });
  indexedGlobalSITCProducts.add(allGlobalSITCProducts);
  const selectedProducts = allGlobalSITCProducts.filter(
    item => item.product === params.product,
  );
  // console.log({ params, selectedProducts });

  let diffYear = Math.max(
    0,
    parseInt(String(params.toYear)?.split("/")[0]) -
      parseInt(String(params.fromYear)?.split("/")[0]),
  );
  if (diffYear >= 0) {
    diffYear += 1;
  }
  if (diffYear > 5) {
    diffYear = 5;
  }
  let YEARS = [...new Array(diffYear)].map((_, yearIndex) => {
    let currentYear = parseInt(params.fromYear) + yearIndex;
    currentYear += "/" + String(currentYear + 1).slice(-2);
    return currentYear;
  });
  // console.log({ YEARS });

  let query = {
    $or: [],
  };
  query.year = {
    $in: YEARS,
  };
  query.type = params.type;
  query.globalSITCProductId = {
    $in: selectedProducts.map(item => item._id),
  };
  if (query.$or.length === 0) {
    delete query.$or;
  }
  await context.collection("GlobalTradeDatas").createIndex({
    year: 1,
  });
  const allGlobalTradeDatas = await context
    .collection("GlobalTradeDatas")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log(
  //   JSON.stringify({ params, query }, null, 4),
  //   allGlobalTradeDatas.length,
  // );
  const indexedGlobalTradeDatas = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["countryId", "year"],
    },
  });
  indexedGlobalTradeDatas.add(allGlobalTradeDatas);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 10;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    pageOrientation: "portrait",
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: `${params.type} Of ${params.product} By Region and Country (${params.fromYear} to ${params.toYear})`,
        alignment: "center",
        bold: true,
        fontSize: BASE_FONT_SIZE + 3,
      },
      {
        // pageBreak: index === 0 ? "" : "before",
        marginTop: 20,
        layout: {
          ...defaultTableLayout,
          paddingTop: () => 4,
          paddingBottom: () => 4,
          paddingLeft: () => 3,
          paddingRight: () => 3,
        },
        table: {
          widths: [
            70,
            120,
            ...YEARS.reduce((all, year) => {
              all.push(63);
              all.push(63);
              return all;
            }, []),
          ],
          body: [
            [
              {
                text: "",
                bold: true,
                alignment: "center",
                border: [false, false, false, false],
              },
              {
                text: "",
                bold: true,
                alignment: "center",
                border: [false, false, false, false],
              },
              ...YEARS.reduce((all, year) => {
                all.push({
                  text: year,
                  bold: true,
                  alignment: "center",
                });
                return all;
              }, []),
            ],
            ...(() => {
              let table = [];

              let total = {};
              for (const countryRegion of allCountryRegions) {
                let firstIndex = table.length;

                let regionStats = {};
                for (const country of countryRegion.countries) {
                  const tradeDatas = indexedGlobalTradeDatas.where({
                    countryId: country._id,
                  });
                  if (tradeDatas.length === 0) continue;

                  table.push([
                    {
                      text: countryRegion.description,
                      bold: true,
                      // alignment: "center",
                      rowSpan: 0,
                    },
                    {
                      text: country.name,
                      // alignment: "center",
                    },
                    ...YEARS.reduce((all, year) => {
                      const tradeDatas = indexedGlobalTradeDatas.where({
                        countryId: country._id,
                        year,
                      });
                      let stats = {
                        quantity: 0,
                        value: 0,
                      };
                      for (const tradeData of tradeDatas) {
                        stats.quantity = tradeData.quantity;
                        // stats.value = tradeData.value;
                      }

                      if (!total[year]) {
                        total[year] = {
                          quantity: 0,
                          value: 0,
                        };
                      }
                      if (!regionStats[year]) {
                        regionStats[year] = {
                          quantity: 0,
                          value: 0,
                        };
                      }
                      total[year].quantity += stats.quantity;
                      // total[year].value += stats.value;
                      regionStats[year].quantity += stats.quantity;
                      all.push({
                        text: formatNumber(stats.quantity),
                        alignment: "right",
                      });
                      // all.push({
                      //   text: formatNumber(stats.value),
                      //   alignment: "right",
                      // });
                      return all;
                    }, []),
                  ]);
                }

                if (Object.keys(regionStats).length === 0) {
                  continue;
                }
                table.push([
                  {
                    text: countryRegion.description,
                    bold: true,
                    // alignment: "center",
                    rowSpan: 0,
                  },
                  {
                    text: "Region Total",
                    // alignment: "center",
                    bold: true,
                  },
                  ...YEARS.reduce((all, year) => {
                    all.push({
                      text: formatNumber(
                        regionStats[year] && regionStats[year].quantity,
                      ),
                      alignment: "right",
                    });
                    return all;
                  }, []),
                ]);
                if (table.length > firstIndex) {
                  table[firstIndex][0].rowSpan = table.length - firstIndex;
                }
              }

              table.push([
                {
                  text: "World Total",
                  // alignment: "center",
                  bold: true,
                  colSpan: 2,
                },
                "",
                ...YEARS.reduce((all, year) => {
                  all.push({
                    text: formatNumber(total[year] && total[year].quantity),
                    alignment: "right",
                    bold: true,
                  });
                  // all.push({
                  //   text: formatNumber(total[year] && total[year].value),
                  //   alignment: "right",
                  //   bold: true,
                  // });
                  return all;
                }, []),
              ]);

              return table;
            })(),
          ],
        },
      },
      {
        marginTop: 40,
        marginRight: 20,
        text: dayjs().locale("en").format("MM/DD/YYYY"),
        alignment: "right",
      },
      params.description
        ? {
            marginTop: -15,
            text: params.description,
          }
        : null,
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Global Trade Data Cocoa Product By Region Report.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateGlobalTradeDataCocoaProductByRegionPercentageReport = async (
  self,
  params,
  context,
) => {
  // console.log("generateDomesticTradeExportImportReport", params);
  assertValidSession(context.activeSession);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  const allCountries = await context
    .collection("Countries")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  const allCountriesByRegionId = lodash.groupBy(
    allCountries,
    "countryRegionId",
  );

  let allCountryRegions = await context
    .collection("CountryRegions")
    .find({
      _id: {
        $in: Object.keys(allCountriesByRegionId),
      },
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log({ allCountryRegions });
  allCountryRegions = allCountryRegions.map(item => {
    return {
      ...item,
      countries: allCountriesByRegionId[item._id] || [],
    };
  });

  const allGlobalSITCProducts = await context
    .collection("GlobalSITCProducts")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log("allGlobalSITCProducts", allGlobalSITCProducts.length);
  const indexedGlobalSITCProducts = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["product"],
    },
  });
  indexedGlobalSITCProducts.add(allGlobalSITCProducts);
  const selectedProducts = allGlobalSITCProducts.filter(
    item => item.product === params.product,
  );
  // console.log({ params, selectedProducts });

  let diffYear = Math.max(
    0,
    parseInt(String(params.toYear)?.split("/")[0]) -
      parseInt(String(params.fromYear)?.split("/")[0]),
  );
  if (diffYear >= 0) {
    diffYear += 1;
  }
  if (diffYear > 2) {
    diffYear = 2;
  }
  let YEARS = [...new Array(diffYear)].map((_, yearIndex) => {
    let currentYear = parseInt(params.fromYear) + yearIndex;
    currentYear += "/" + String(currentYear + 1).slice(-2);
    return currentYear;
  });
  // console.log({ YEARS });

  let query = {
    $or: [],
  };
  query.year = {
    $in: YEARS,
  };
  query.type = params.type;
  query.globalSITCProductId = {
    $in: selectedProducts.map(item => item._id),
  };
  if (query.$or.length === 0) {
    delete query.$or;
  }
  await context.collection("GlobalTradeDatas").createIndex({
    year: 1,
  });
  const allGlobalTradeDatas = await context
    .collection("GlobalTradeDatas")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log(
  //   JSON.stringify({ params, query }, null, 4),
  //   allGlobalTradeDatas.length,
  // );
  const indexedGlobalTradeDatas = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["countryId", "year"],
    },
  });
  indexedGlobalTradeDatas.add(allGlobalTradeDatas);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 9.5;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    pageOrientation: "portrait",
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: `${params.type} Of ${params.product} By Region and Country (${params.fromYear} to ${params.toYear})`,
        alignment: "center",
        bold: true,
        fontSize: BASE_FONT_SIZE + 3,
      },
      {
        // pageBreak: index === 0 ? "" : "before",
        marginTop: 20,
        layout: {
          ...defaultTableLayout,
          paddingTop: () => 4,
          paddingBottom: () => 4,
          paddingLeft: () => 3,
          paddingRight: () => 3,
        },
        table: {
          widths: [
            70,
            120,
            ...YEARS.reduce((all, year) => {
              all.push(70);
              all.push(40);
              return all;
            }, []),
            70,
          ],
          body: [
            [
              {
                text: "",
                bold: true,
                alignment: "center",
                rowSpan: 2,
                border: [false, false, false, false],
              },
              {
                text: "",
                bold: true,
                alignment: "center",
                rowSpan: 2,
                border: [false, false, false, false],
              },
              ...YEARS.reduce((all, year) => {
                all.push({
                  text: year,
                  bold: true,
                  alignment: "center",
                  colSpan: 2,
                });
                all.push({
                  text: year,
                  bold: true,
                  alignment: "center",
                });
                return all;
              }, []),
              // {
              //   text: "Total",
              //   bold: true,
              //   alignment: "center",
              // },
            ],
            [
              {
                text: "",
                bold: true,
                alignment: "center",
                border: [false, false, false, false],
              },
              {
                text: "",
                bold: true,
                alignment: "center",
                border: [false, false, false, false],
              },
              ...YEARS.reduce((all, year) => {
                all.push({
                  text: "Quantity",
                  bold: true,
                  alignment: "center",
                });
                all.push({
                  text: "%",
                  bold: true,
                  alignment: "center",
                });
                return all;
              }, []),
              // {
              //   text: "Quantity",
              //   bold: true,
              //   alignment: "center",
              // },
            ],
            ...(() => {
              let table = [];

              let total = {
                yearsQuantityInTotal: 0,
              };
              for (const countryRegion of allCountryRegions) {
                let firstIndex = table.length;

                let regionStats = {
                  yearsQuantityInTotal: 0,
                };
                for (const country of countryRegion.countries) {
                  const tradeDatas = indexedGlobalTradeDatas.where({
                    countryId: country._id,
                  });
                  if (tradeDatas.length === 0) continue;

                  let yearsQuantityInTotal = 0;
                  table.push([
                    {
                      text: countryRegion.description,
                      bold: true,
                      // alignment: "center",
                      rowSpan: 0,
                    },
                    {
                      text: country.name,
                      // alignment: "center",
                    },
                    ...YEARS.reduce((all, year) => {
                      const tradeDatas = indexedGlobalTradeDatas.where({
                        countryId: country._id,
                        year,
                      });
                      let stats = {
                        quantity: 0,
                        percentage: 0,
                      };
                      for (const tradeData of tradeDatas) {
                        stats.quantity = tradeData.quantity;
                        stats.percentage = tradeData.percentage;
                      }

                      if (!total[year]) {
                        total[year] = {
                          quantity: 0,
                          percentage: 0,
                          yearsQuantityInTotal: 0,
                        };
                      }
                      if (!regionStats[year]) {
                        regionStats[year] = {
                          quantity: 0,
                          value: 0,
                        };
                      }
                      total[year].quantity += stats.quantity;
                      total[year].percentage += stats.percentage;
                      regionStats[year].quantity += stats.quantity;
                      regionStats[year].percentage += stats.percentage;

                      yearsQuantityInTotal += stats.quantity;
                      total.yearsQuantityInTotal += stats.quantity;
                      regionStats.yearsQuantityInTotal += stats.quantity;

                      all.push({
                        text: formatNumber(stats.quantity, 0),
                        alignment: "right",
                        quantity: stats.quantity,
                      });
                      all.push({
                        text: formatNumber(stats.percentage),
                        alignment: "right",
                      });
                      return all;
                    }, []),
                    // {
                    //   text: formatNumber(yearsQuantityInTotal, 0),
                    //   alignment: "right",
                    // },
                  ]);
                }

                if (!regionStats.yearsQuantityInTotal) continue;

                table.push([
                  {
                    text: countryRegion.description,
                    bold: true,
                    // alignment: "center",
                    rowSpan: 0,
                  },
                  {
                    text: "Region Total",
                    // alignment: "center",
                    bold: true,
                  },
                  ...YEARS.reduce((all, year, index) => {
                    const currentYearQuantity =
                      (regionStats[year] && regionStats[year].quantity) || 0;
                    for (let i = firstIndex; i < table.length; i++) {
                      const quantity = table[i][2 + index * 2].quantity;
                      const percentage =
                        (quantity * 100.0) / currentYearQuantity;
                      table[i][2 + index * 2 + 1].text =
                        formatNumber(percentage);
                    }
                    all.push({
                      text: formatNumber(currentYearQuantity, 0),
                      alignment: "right",
                      bold: true,
                    });
                    all.push({
                      text: formatNumber(currentYearQuantity > 0 ? 100 : 0),
                      alignment: "right",
                      bold: true,
                    });
                    return all;
                  }, []),
                  // {
                  //   text: formatNumber(regionStats.yearsQuantityInTotal, 0),
                  //   alignment: "right",
                  //   bold: true,
                  // },
                ]);
                if (table.length > firstIndex) {
                  table[firstIndex][0].rowSpan = table.length - firstIndex;
                }
              }

              table.push([
                {
                  text: "World Total",
                  // alignment: "center",
                  bold: true,
                  colSpan: 2,
                },
                "",
                ...YEARS.reduce((all, year) => {
                  all.push({
                    text: formatNumber(total[year] && total[year].quantity, 0),
                    alignment: "right",
                    bold: true,
                  });
                  all.push({
                    text: formatNumber(total[year] && total[year].percentage),
                    alignment: "right",
                    bold: true,
                  });
                  return all;
                }, []),
                // {
                //   text: formatNumber(total.yearsQuantityInTotal, 0),
                //   alignment: "right",
                //   bold: true,
                // },
              ]);

              return table;
            })(),
          ],
        },
      },
      {
        marginTop: 40,
        marginRight: 20,
        text: dayjs().locale("en").format("MM/DD/YYYY"),
        alignment: "right",
      },
      params.description
        ? {
            marginTop: -15,
            text: params.description,
          }
        : null,
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Global Trade Data Cocoa Product By Region Percentage Report.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

module.exports = {
  generateGlobalTradeDataCocoaProductByCountryReport,
  generateGlobalTradeDataCocoaProductByRegionReport,
  generateGlobalTradeDataCocoaProductByRegionPercentageReport,
};
