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

const generateDomesticTradeExportImportReport = async (
  self,
  params,
  context
) => {
  // console.log("generateDomesticTradeExportImportReport", params);
  assertValidSession(context.activeSession);

  const ITEM_PRODUCTS_LABEL = {
    "COCOA SHELLS": "COCOA SHELL, HUSKS, RAW, OR ROASTED",
    "COCOA PASTE DEFATTED": "COCOA PASTE WHOLLY OR PARTLY DEFATTED",
    "COCOA POWDER NOT SWEETENED": "COCOA POWDER",
    "COCOA POWDER SWEETENED": "COCOA POWDER",
  };

  const PRODUCT_ORDERS = [
    "COCOA BEANS",
    "COCOA SHELL, HUSKS, RAW, OR ROASTED",
    "COCOA BUTTER",
    "COCOA PASTE NOT DEFATTED",
    "COCOA PASTE WHOLLY OR PARTLY DEFATTED",
    "COCOA POWDER",
    "CHOCOLATE",
  ];

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  let allLocalSITCProducts = await context
    .collection("LocalSITCProducts")
    .find({
      _deletedAt: {
        $exists: false,
      },
      // useForReport: true,
    })
    .toArray();
  allLocalSITCProducts = allLocalSITCProducts.map((item) => {
    const productName = (item.newProduct || item.product).toUpperCase();
    const product =
      ITEM_PRODUCTS_LABEL[productName.toUpperCase()] ||
      productName.toUpperCase();
    const order = PRODUCT_ORDERS.findIndex((p) => p === product);
    return {
      ...item,
      product,
      order,
    };
  });
  allLocalSITCProducts = lodash.orderBy(
    allLocalSITCProducts,
    ["order"],
    ["asc"]
  );
  // console.log("allLocalSITCProducts", allLocalSITCProducts.length);
  const indexedLocalSITCProducts = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["product"],
    },
  });
  indexedLocalSITCProducts.add(allLocalSITCProducts);

  let MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthFilterBeginIndex = !params.fromMonth
    ? 1
    : MONTHS.findIndex((month) => month === params.fromMonth) + 1;
  const monthFilterEndIndex = !params.toMonth
    ? 12
    : MONTHS.findIndex((month) => month === params.toMonth) + 1;
  if (monthFilterBeginIndex > monthFilterEndIndex) {
    MONTHS = [];
  } else {
    MONTHS = MONTHS.filter((month, index) => {
      return monthFilterBeginIndex <= index && index <= monthFilterEndIndex;
    });
  }
  // console.log({
  //   monthFilterBeginIndex,
  //   monthFilterEndIndex,
  //   params,
  // });

  let query = {
    $or: [],
  };
  query.year = {
    $gte: params.fromYear,
    $lte: params.toYear,
  };
  query.type = params.type;
  if (query.$or.length === 0) {
    delete query.$or;
  }
  await context.collection("DomesticTradeDatas").createIndex({
    year: 1,
  });
  let allDomesticTradeDatas = await context
    .collection("DomesticTradeDatas")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();

  allDomesticTradeDatas = allDomesticTradeDatas
    .filter((item) => {
      if (item.year === params.fromYear && item.month < monthFilterBeginIndex) {
        return false;
      } else if (
        item.year === params.toYear &&
        item.month > monthFilterEndIndex
      ) {
        return false;
      }
      return true;
    })
    .map((item) => {
      const product = indexedLocalSITCProducts.find({
        _id: item.localSITCProductId,
      });
      if (product) {
        return {
          ...item,
          // productName: product.product,
          productName:
            ITEM_PRODUCTS_LABEL[product.product.toUpperCase()] ||
            product.product.toUpperCase(),
        };
      }
      return item;
    });
  // console.log(
  //   "allDomesticTradeDatas",
  //   allDomesticTradeDatas.length,
  //   // allDomesticTradeDatas[0],
  // );
  // const allDomesticTradeDatasByProduct = lodash.groupBy(
  //   allDomesticTradeDatas,
  //   "localSITCProductId",
  // );
  // console.log(
  //   JSON.stringify({ params, query }, null, 4),
  //   allDomesticTradeDatas.length,
  //   Object.keys(allDomesticTradeDatasByProduct),
  // );
  const indexedDomesticTradeDatas = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["localSITCProductId", "type", "productName", "year"],
    },
  });
  indexedDomesticTradeDatas.add(allDomesticTradeDatas);
  // console.log("allDomesticTradeDatas", allDomesticTradeDatas);

  let allLocalSITCProductsWithPagination = [
    Object.keys(lodash.groupBy(allLocalSITCProducts, "product")),
  ];
  // console.log({ allLocalSITCProductsWithPagination });
  // allLocalSITCProductsWithPagination = [["COCOA BEANS"]];

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 8.5;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    // pageSize: {
    //   // F4
    //   width: 595.4,
    //   height: 945.5,
    // },
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
        // text: `${
        //   params.title ? `${params.title}: ` : ""
        // } MALAYSIA: EXPORT OF COCOA BEANS AND COCOA PRODUCTS`,
        text: `MALAYSIA: ${params.type.toUpperCase()} OF COCOA BEANS AND COCOA PRODUCTS`,
        alignment: "center",
        bold: true,
        fontSize: BASE_FONT_SIZE + 3,
      },
      ...allLocalSITCProductsWithPagination.map(
        (allLocalSITCProducts, index) => {
          let diffYear = Math.max(
            0,
            parseInt(params.toYear) - parseInt(params.fromYear)
          );

          return {
            // pageBreak: index === 0 ? "" : "before",
            marginTop: 20,
            marginBottom: 10,
            unbreakable: diffYear > 15 ? false : true,
            layout: {
              ...defaultTableLayout,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 1,
              paddingRight: () => 1,
            },
            table: {
              widths: [
                25,
                ...allLocalSITCProducts.reduce((all, item) => {
                  // all.push(37);
                  // all.push(45);
                  // all.push(29);
                  all.push(32);
                  all.push(32);
                  all.push(32);
                  return all;
                }, []),
                35,
              ],
              body: [
                [
                  {
                    marginTop: 20,
                    text: "Year",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                  ...allLocalSITCProducts.reduce((all, productName) => {
                    all.push({
                      text: productName.toUpperCase(),
                      // text:
                      //   ITEM_PRODUCTS_LABEL[productName.toUpperCase()] ||
                      //   productName.toUpperCase(),
                      bold: true,
                      alignment: "center",
                      colSpan: 3,
                    });
                    all.push({
                      text: "",
                      bold: true,
                      alignment: "center",
                    });
                    all.push({
                      text: "",
                      bold: true,
                      alignment: "center",
                    });
                    return all;
                  }, []),
                  {
                    marginTop: 20,
                    text: "TOTAL",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                ],
                [
                  "",
                  ...allLocalSITCProducts.reduce((all, productName) => {
                    all.push({
                      text: "Quantity\n(Tonne)",
                      bold: true,
                      alignment: "center",
                    });
                    all.push({
                      text: "VALUE\n(RM '000)",
                      bold: true,
                      alignment: "center",
                    });
                    all.push({
                      text: "FOB\n(RM/tonne)",
                      bold: true,
                      alignment: "center",
                    });
                    return all;
                  }, []),
                  "",
                ],
                ...(() => {
                  let table = [];

                  let diffYear = Math.max(
                    0,
                    parseInt(params.toYear) - parseInt(params.fromYear)
                  );
                  if (diffYear >= 0) {
                    diffYear += 1;
                  }
                  [...new Array(diffYear)].forEach((_, yearIndex) => {
                    const currentYear = parseInt(params.fromYear) + yearIndex;

                    let total = 0;
                    table.push([
                      {
                        text: currentYear,
                        alignment: "center",
                        fontSize: 6,
                      },
                      ...allLocalSITCProducts.reduce((all, productName) => {
                        let tradeDatas = indexedDomesticTradeDatas.where({
                          productName,
                          year: currentYear,
                          // localSITCProductId: item._id,
                          // type: params.type,
                        });
                        // console.log("tradeDatas", tradeDatas.length);
                        let stats = {
                          quantity: 0,
                          value: 0,
                          fob: 0,
                        };
                        for (const tradeData of tradeDatas) {
                          // if (
                          //   currentYear === dayjs().get("year") &&
                          //   !MONTHS.includes(tradeData.monthName)
                          // ) {
                          //   // console.log(currentYear, tradeData.monthName, MONTHS);
                          //   continue;
                          // }

                          // if (!MONTHS.includes(tradeData.monthName)) {
                          //   if (
                          //     tradeData.productName === "CHOCOLATE" &&
                          //     tradeData.year === 1993
                          //   ) {
                          //     //Do Nothing
                          //   } else {
                          //     // continue;
                          //   }
                          // }

                          // stats.quantity = tradeData.quantity;
                          // stats.value = tradeData.value;
                          // stats.fob =
                          //   tradeData.quantity > 0 && tradeData.value > 0
                          //     ? lodash.round(
                          //         (1000 * tradeData.quantity) / tradeData.value,
                          //       )
                          //     : 0;

                          stats.quantity = stats.quantity + tradeData.quantity;
                          stats.value = stats.value + tradeData.value;
                        }

                        let tmpQuantity = 0;
                        if (stats.quantity > 0) {
                          tmpQuantity = stats.quantity;
                          // console.log({ before: stats.quantity });
                          stats.quantity = Math.round(stats.quantity / 1000);
                          // console.log({ after: stats.quantity });
                        }

                        let tmpVal = 0;
                        if (stats.value > 0) {
                          tmpVal = stats.value * 1000;
                          stats.value = stats.value / 1000; //Math.round(stats.value / 1000);
                        }

                        if (stats.value > 0 && stats.quantity > 0) {
                          // stats.fob = tmpVal / stats.quantity;
                          stats.fob = tmpVal / tmpQuantity;
                        }

                        total += stats.value;
                        // const total = roundUpIfGreaterThanSixty(total);

                        all.push({
                          text: formatNumber(stats.quantity, 0),
                          alignment: "right",
                          fontSize: 6,
                        });
                        all.push({
                          text: formatNumber(stats.value, 0),
                          alignment: "right",
                          fontSize: 6,
                        });
                        all.push({
                          text: formatNumber(stats.fob, 0),
                          alignment: "right",
                          fontSize: 6,
                        });

                        return all;
                      }, []),
                      {
                        text: formatNumber(total), //formatNumber(lodash.round(total / 10, 0) * 10, 0),
                        alignment: "right",
                        fontSize: 6,
                      },
                    ]);
                  });

                  return table;
                })(),
              ],
            },
          };
        }
      ),
      {
        marginTop: 40,
        text: [
          `${params.toYear}: ${params.fromMonth} - ${params.toMonth}`,
          // params.title,
        ].join("\n"),
      },
      params.title
        ? {
            text: params.title,
          }
        : null,
      params.description2
        ? {
            text: params.description2,
          }
        : null,
      params.description3
        ? {
            text: params.description3,
          }
        : null,
      // {
      //   marginTop: -12,
      //   text: `Date: ${dayjs().locale("ms-my").format("DD MMMM YYYY")}`,
      //   alignment: "right",
      // },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Domestic Trade Export Import Report.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};
const generateDomesticTradeExportDestinationSourceReport = async (
  self,
  params,
  context
) => {
  console.log("generateDomesticTradeExportDestinationSourceReport", params);
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

  const getOtherCountry = allCountries.find((c) => c.name === "OTHERS");

  allCountries = allCountries.filter((c) => c.name !== "OTHERS");
  allCountries = [...allCountries, getOtherCountry];

  let allLocalSITCProducts = await context
    .collection("LocalSITCProducts")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  allLocalSITCProducts = allLocalSITCProducts.map((item) => {
    return {
      ...item,
      product: item.newProduct || item.product,
    };
  });
  // console.log("allLocalSITCProducts", allLocalSITCProducts.length);
  const indexedLocalSITCProducts = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["product"],
    },
  });
  indexedLocalSITCProducts.add(allLocalSITCProducts);
  const selectedProducts = allLocalSITCProducts.filter(
    (item) => item.product === params.product
  );

  let MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  // const PASTOTHERMONTHS = [
  //   "January",
  //   "February",
  //   "March",
  //   "April",
  //   "May",
  //   "June",
  //   "July",
  //   "August",
  //   "September",
  //   "October",
  //   "November",
  //   "December",
  // ];
  const monthFilterBeginIndex = !params.fromMonth
    ? 1
    : MONTHS.findIndex((month) => month === params.fromMonth) + 1;
  const monthFilterEndIndex = !params.toMonth
    ? 12
    : MONTHS.findIndex((month) => month === params.toMonth) + 1;
  if (monthFilterBeginIndex > monthFilterEndIndex) {
    MONTHS = [];
  } else {
    MONTHS = MONTHS.filter((month, index) => {
      return monthFilterBeginIndex <= index && index <= monthFilterEndIndex;
    });
  }

  let diffYear = 6;
  const YEARS = [...new Array(diffYear)].map((_, yearIndex) => {
    const currentYear = parseInt(params.year) - 5 + yearIndex;
    return currentYear;
  });

  let query = {
    $or: [],
  };
  query.year = {
    $in: YEARS,
  };
  query.type = params.type;
  query.localSITCProductId = {
    $in: selectedProducts.map((item) => item._id),
  };
  if (query.$or.length === 0) {
    delete query.$or;
  }
  await context.collection("DomesticTradeDatas").createIndex({
    year: 1,
  });
  let allDomesticTradeDatas = await context
    .collection("DomesticTradeDatas")
    .find({
      ...query,
      _deletedAt: { $exists: false },
    })
    .toArray();
  // console.log(
  //   JSON.stringify({ params, query }, null, 4),
  //   allDomesticTradeDatas.length,
  // );
  allDomesticTradeDatas = allDomesticTradeDatas.filter((item) => {
    if (item.year === params.year && item.month < monthFilterBeginIndex) {
      return false;
    } else if (item.year === params.year && item.month > monthFilterEndIndex) {
      return false;
    }
    return true;
  });
  const indexedDomesticTradeDatas = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["countryId", "year", "monthName"],
    },
  });
  indexedDomesticTradeDatas.add(allDomesticTradeDatas);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 9;
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
        // text: `${
        //   params.title ? `${params.title.toUpperCase()}: ` : ""
        // } MALAYSIA: ${params.type.toUpperCase()} DESTINATIONS OF ${params.product.toUpperCase()}`,
        text:
          params.type === "Import"
            ? `MALAYSIA: SOURCES OF IMPORT OF ${params.product.toUpperCase()}`
            : `MALAYSIA: EXPORT DESTINATIONS OF ${params.product.toUpperCase()}`,
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
          dontBreakRows: true,
          widths: [
            80,
            ...YEARS.reduce((all, year) => {
              all.push(53);
              all.push(53);
              return all;
            }, []),
          ],
          body: [
            [
              {
                text: "Country",
                bold: true,
                alignment: "center",
                rowSpan: 2,
              },
              ...YEARS.reduce((all, year) => {
                all.push({
                  text: year,
                  bold: true,
                  alignment: "center",
                  colSpan: 2,
                });
                all.push("");
                return all;
              }, []),
            ],
            [
              "",
              ...YEARS.reduce((all, year) => {
                all.push({
                  text: "QUANTITY\n(KG)",
                  bold: true,
                  alignment: "center",
                });
                all.push({
                  text: "VALUE\n(RM)",
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
                const tradeDatas = indexedDomesticTradeDatas.where({
                  countryId: country._id,
                });
                if (tradeDatas.length === 0) continue;

                table.push([
                  {
                    text: country.name,
                    // alignment: "center",
                  },
                  ...YEARS.reduce((all, year) => {
                    let tradeDatas = indexedDomesticTradeDatas.where({
                      countryId: country._id,
                      year,
                    });
                    let stats = {
                      quantity: 0,
                      value: 0,
                    };

                    if (
                      params.year === year &&
                      params.fromMonth === params.toMonth
                    ) {
                      tradeDatas = indexedDomesticTradeDatas.where({
                        countryId: country._id,
                        year,
                        monthName: params.toMonth,
                      });
                    }
                    for (const tradeData of tradeDatas) {
                      stats.quantity += tradeData.quantity;
                      stats.value += tradeData.value;
                      // if (params.year === year) {
                      //   if (
                      //     year === dayjs().get("year") &&
                      //     !MONTHS.includes(tradeData.monthName)
                      //   ) {
                      //     continue;
                      //   }
                      //   stats.quantity += tradeData.quantity;
                      //   stats.value += tradeData.value;
                      // } else {
                      //   stats.quantity += tradeData.quantity;
                      //   stats.value += tradeData.value;
                      // }
                    }

                    if (!total[year]) {
                      total[year] = {
                        quantity: 0,
                        value: 0,
                      };
                    }
                    total[year].quantity += stats.quantity;
                    total[year].value += stats.value;
                    const qtyLength = formatNumber(stats.quantity, 2, ".");
                    const valLength = formatNumber(stats.value, 0);
                    all.push({
                      text: formatNumber(stats.quantity, 2, "."),
                      quantity: stats.quantity,
                      alignment: "right",
                      fontSize: 7.5,
                    });
                    all.push({
                      text: formatNumber(stats.value, 0),
                      value: stats.value,
                      alignment: "right",
                      fontSize: 7.5,
                    });
                    return all;
                  }, []),
                ]);
              }

              // console.log(table[0]);
              table = lodash.orderBy(
                table,
                [`${table[0].length - 2}.quantity`],
                ["desc"]
              );

              // Move "OTHERS" to the end
              const othersIndex = table.findIndex(
                (row) => row[0]?.text?.toUpperCase() === "OTHERS"
              );
              if (othersIndex !== -1) {
                const [othersRow] = table.splice(othersIndex, 1);
                table.push(othersRow);
              }

              table.push([
                {
                  text: "TOTAL",
                  // alignment: "center",
                  bold: true,
                },
                ...YEARS.reduce((all, year) => {
                  let totalQty =
                    total[year].quantity > 0 ? total[year].quantity : 0;
                  all.push({
                    text: formatNumber(total[year] && totalQty, 2, "."),
                    alignment: "right",
                    bold: true,
                    fontSize: 7.5,
                  });
                  all.push({
                    text: formatNumber(total[year] && total[year].value, 0),
                    alignment: "right",
                    bold: true,
                    fontSize: 7.5,
                  });
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
        text: [
          `${params.year}: ${params.fromMonth} - ${params.toMonth}`,
          // params.title,
        ].join("\n"),
      },
      params.title
        ? {
            text: params.title,
          }
        : null,
      params.description2
        ? {
            text: params.description2,
          }
        : null,
      params.description3
        ? {
            text: params.description3,
          }
        : null,
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Domestic Trade Export Destination Source Report.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateDomesticTradeContributionOfExportByRegionReport = async (
  self,
  params,
  context
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
  const allCountriesByRegionId = lodash.groupBy(
    allCountries,
    "countryRegionId"
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
  allCountryRegions = allCountryRegions.map((item) => {
    return {
      ...item,
      countries: allCountriesByRegionId[item._id] || [],
    };
  });

  let allLocalSITCProducts = await context
    .collection("LocalSITCProducts")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  allLocalSITCProducts = allLocalSITCProducts.map((item) => {
    return {
      ...item,
      product: item.newProduct || item.product,
    };
  });
  // console.log("allLocalSITCProducts", allLocalSITCProducts.length);
  const indexedLocalSITCProducts = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["product"],
    },
  });
  indexedLocalSITCProducts.add(allLocalSITCProducts);
  const selectedProducts = allLocalSITCProducts.filter(
    (item) => item.product === params.product
  );

  const YEARS = [params.year1, params.year2];
  // console.log({ YEARS });

  let query = {
    $or: [],
  };
  query.year = {
    $in: YEARS,
  };
  query.type = "Export";
  query.localSITCProductId = {
    $in: selectedProducts.map((item) => item._id),
  };
  if (query.$or.length === 0) {
    delete query.$or;
  }
  await context.collection("DomesticTradeDatas").createIndex({
    year: 1,
  });
  const allDomesticTradeDatas = await context
    .collection("DomesticTradeDatas")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log(
  //   JSON.stringify({ params, query }, null, 4),
  //   allDomesticTradeDatas.length,
  // );
  const indexedDomesticTradeDatas = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["countryId", "year"],
    },
  });
  indexedDomesticTradeDatas.add(allDomesticTradeDatas);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 10;
  const docDefinition = {
    pageMargins: [20, 30, 20, 20],
    pageSize: "A4",
    pageOrientation: "landscape",
    defaultStyle: {
      fontSize: BASE_FONT_SIZE,
      // lineHeight: 1,
    },
    content: [
      {
        text: `CONTRIBUTION OF EXPORT COCOA PRODUCTS BY REGION\nFor Year ${params.year1} & ${params.year2}`,
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
            120,
            ...YEARS.reduce((all, year) => {
              all.push(100);
              all.push(100);
              return all;
            }, []),
            100,
            100,
          ],
          body: [
            [
              {
                text: "Country",
                bold: true,
                alignment: "center",
                rowSpan: 3,
              },
              ...YEARS.reduce((all, year, index) => {
                all.push({
                  text: params.product.toUpperCase(),
                  bold: true,
                  alignment: "center",
                  colSpan: index === 0 ? 6 : 0,
                });
                all.push("");
                return all;
              }, []),
              "",
              "",
            ],
            [
              "",
              ...YEARS.reduce((all, year) => {
                all.push({
                  text: year,
                  bold: true,
                  alignment: "center",
                  colSpan: 2,
                });
                all.push("");
                return all;
              }, []),
              {
                text: "% of increase/decrease in Qty",
                bold: true,
                alignment: "center",
                rowSpan: 2,
              },
              {
                text: "% of increase/decrease in value",
                bold: true,
                alignment: "center",
                rowSpan: 2,
              },
            ],
            [
              "",
              ...YEARS.reduce((all, year) => {
                all.push({
                  text: "QUANTITY\n(Kg)",
                  bold: true,
                  alignment: "center",
                });
                all.push({
                  text: "VALUE\n(RM)",
                  bold: true,
                  alignment: "center",
                });
                return all;
              }, []),
              "",
              "",
            ],
            ...(() => {
              let table = [];

              let total = {};
              for (const countryRegion of allCountryRegions) {
                table.push([
                  {
                    text: countryRegion.description,
                    bold: true,
                    // alignment: "center",
                    border: [true, false, true, false],
                  },
                  ...YEARS.reduce((all, year) => {
                    all.push({
                      text: "",
                      alignment: "right",
                      border: [true, false, true, false],
                    });
                    all.push({
                      text: "",
                      alignment: "right",
                      border: [true, false, true, false],
                    });
                    return all;
                  }, []),
                  {
                    text: "",
                    alignment: "right",
                    border: [true, false, true, false],
                  },
                  {
                    text: "",
                    alignment: "right",
                    border: [true, false, true, false],
                  },
                ]);

                let subtotal = {};
                for (const country of countryRegion.countries) {
                  const tradeDatas = indexedDomesticTradeDatas.where({
                    countryId: country._id,
                  });
                  if (tradeDatas.length === 0) continue;

                  table.push([
                    {
                      text: country.name,
                      marginLeft: 10,
                      // alignment: "center",
                      border: [true, false, true, false],
                    },
                    ...YEARS.reduce((all, year) => {
                      const tradeDatas = indexedDomesticTradeDatas.where({
                        countryId: country._id,
                        year,
                      });
                      let stats = {
                        quantity: 0,
                        value: 0,
                      };
                      for (const tradeData of tradeDatas) {
                        stats.quantity += tradeData.quantity;
                        stats.value += tradeData.value;
                      }

                      if (!subtotal[year]) {
                        subtotal[year] = {
                          quantity: 0,
                          value: 0,
                        };
                      }
                      subtotal[year].quantity += stats.quantity;
                      subtotal[year].value += stats.value;

                      if (!total[year]) {
                        total[year] = {
                          quantity: 0,
                          value: 0,
                        };
                      }
                      total[year].quantity += stats.quantity;
                      total[year].value += stats.value;

                      all.push({
                        text: formatNumber(stats.quantity),
                        alignment: "right",
                        border: [true, false, true, false],
                      });
                      all.push({
                        text: formatNumber(stats.value),
                        alignment: "right",
                        border: [true, false, true, false],
                      });
                      return all;
                    }, []),
                    ...(() => {
                      let table = [];

                      let percentageQuantity =
                        (subtotal[YEARS[1]].quantity || 0) -
                        (subtotal[YEARS[0]].quantity || 0);
                      percentageQuantity =
                        !subtotal[YEARS[1]].quantity ||
                        !subtotal[YEARS[0]].quantity
                          ? 0
                          : percentageQuantity !== 0 &&
                            subtotal[YEARS[0]].quantity > 0
                          ? formatNumber(
                              (percentageQuantity * 100.0) /
                                subtotal[YEARS[0]].quantity
                            )
                          : 0;

                      let percentageValue =
                        (subtotal[YEARS[1]].value || 0) -
                        (subtotal[YEARS[0]].value || 0);
                      percentageValue =
                        !subtotal[YEARS[1]].value || !subtotal[YEARS[0]].value
                          ? 0
                          : percentageValue !== 0 &&
                            subtotal[YEARS[0]].value > 0
                          ? formatNumber(
                              (percentageValue * 100.0) /
                                subtotal[YEARS[0]].value
                            )
                          : 0;

                      // if (!subtotal["percentage"]) {
                      //   subtotal["percentage"] = {
                      //     quantity: 0,
                      //     value: 0,
                      //   };
                      // }
                      // subtotal["percentage"].quantity =
                      //   parseFloat(percentageQuantity);
                      // subtotal["percentage"].value =
                      //   parseFloat(percentageValue);

                      // if (!total["percentage"]) {
                      //   total["percentage"] = {
                      //     quantity: 0,
                      //     value: 0,
                      //   };
                      // }
                      // total["percentage"].quantity =
                      //   parseFloat(percentageQuantity);
                      // total["percentage"].value = parseFloat(percentageValue);

                      table.push({
                        text: percentageQuantity || "-",
                        alignment: "right",
                        border: [true, false, true, false],
                      });
                      table.push({
                        text: percentageValue || "-",
                        alignment: "right",
                        border: [true, false, true, false],
                      });

                      return table;
                    })(),
                  ]);
                }

                let percentageQuantity =
                  ((subtotal[YEARS[1]] && subtotal[YEARS[1]].quantity) || 0) -
                  ((subtotal[YEARS[0]] && subtotal[YEARS[0]].quantity) || 0);
                percentageQuantity =
                  !subtotal[YEARS[1]] ||
                  !subtotal[YEARS[1]].quantity ||
                  !subtotal[YEARS[0]] ||
                  !subtotal[YEARS[0]].quantity
                    ? 0
                    : percentageQuantity !== 0 &&
                      subtotal[YEARS[0]].quantity > 0
                    ? formatNumber(
                        (percentageQuantity * 100.0) /
                          subtotal[YEARS[0]].quantity
                      )
                    : 0;

                let percentageValue =
                  ((subtotal[YEARS[1]] && subtotal[YEARS[1]].value) || 0) -
                  ((subtotal[YEARS[0]] && subtotal[YEARS[0]].value) || 0);
                percentageValue =
                  !subtotal[YEARS[1]] ||
                  !subtotal[YEARS[1]].value ||
                  !subtotal[YEARS[0]] ||
                  !subtotal[YEARS[0]].value
                    ? 0
                    : percentageValue !== 0 && subtotal[YEARS[0]].value > 0
                    ? formatNumber(
                        (percentageValue * 100.0) / subtotal[YEARS[0]].value
                      )
                    : 0;
                // console.log({ subtotal, percentageQuantity, percentageValue });

                table.push([
                  {
                    text: "Sub Total",
                    alignment: "right",
                    bold: true,
                    border: [true, false, true, true],
                  },
                  ...YEARS.reduce((all, year) => {
                    all.push({
                      // text: formatNumber(
                      //   subtotal[year] && subtotal[year].quantity,
                      // ),
                      text: " ",
                      alignment: "right",
                      border: [true, false, true, true],
                      bold: true,
                    });
                    all.push({
                      text: formatNumber(
                        subtotal[year] && subtotal[year].value
                      ),
                      alignment: "right",
                      border: [true, false, true, true],
                      bold: true,
                    });
                    return all;
                  }, []),
                  {
                    text: percentageQuantity,
                    alignment: "right",
                    border: [true, false, true, true],
                    bold: true,
                  },
                  {
                    text: percentageValue,
                    alignment: "right",
                    border: [true, false, true, true],
                    bold: true,
                  },
                ]);
              }

              let percentageQuantity =
                ((total[YEARS[1]] && total[YEARS[1]].quantity) || 0) -
                ((total[YEARS[0]] && total[YEARS[0]].quantity) || 0);
              percentageQuantity =
                !total[YEARS[1]] ||
                !total[YEARS[1]].quantity ||
                !total[YEARS[0]] ||
                !total[YEARS[0]].quantity
                  ? 0
                  : percentageQuantity !== 0 && total[YEARS[0]].quantity > 0
                  ? formatNumber(
                      (percentageQuantity * 100.0) / total[YEARS[0]].quantity
                    )
                  : 0;

              let percentageValue =
                ((total[YEARS[1]] && total[YEARS[1]].value) || 0) -
                ((total[YEARS[0]] && total[YEARS[0]].value) || 0);
              percentageValue =
                !total[YEARS[1]] ||
                !total[YEARS[1]].value ||
                !total[YEARS[0]] ||
                !total[YEARS[0]].value
                  ? 0
                  : percentageValue !== 0 && total[YEARS[0]].value > 0
                  ? formatNumber(
                      (percentageValue * 100.0) / total[YEARS[0]].value
                    )
                  : 0;
              // console.log({ subtotal, percentageQuantity, percentageValue });

              table.push([
                {
                  text: "Total",
                  alignment: "right",
                  bold: true,
                },
                ...YEARS.reduce((all, year) => {
                  all.push({
                    // text: formatNumber(total[year] && total[year].quantity),
                    text: " ",
                    alignment: "right",
                    bold: true,
                  });
                  all.push({
                    text: formatNumber(total[year] && total[year].value),
                    alignment: "right",
                    bold: true,
                  });
                  return all;
                }, []),
                {
                  text: percentageQuantity,
                  alignment: "right",
                  bold: true,
                },
                {
                  text: percentageValue,
                  alignment: "right",
                  bold: true,
                },
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
    filename: `Domestic Trade Contribution Of Export By Region Report.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateDomesticTradeCocoaBeansExportReport = async (
  self,
  params,
  context
) => {
  // console.log("generateDomesticTradeExportImportReport", params);
  assertValidSession(context.activeSession);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  await context.collection("Countries").createIndex({
    name: 1,
  });
  let selectedCountry = await context.collection("Countries").findOne({
    name: params.country,
    _deletedAt: {
      $exists: false,
    },
  });

  let allLocalSITCProducts = await context
    .collection("LocalSITCProducts")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  allLocalSITCProducts = allLocalSITCProducts.map((item) => {
    return {
      ...item,
      product: item.newProduct || item.product,
    };
  });
  // console.log("allLocalSITCProducts", allLocalSITCProducts.length);
  const indexedLocalSITCProducts = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["product"],
    },
  });
  indexedLocalSITCProducts.add(allLocalSITCProducts);

  let YEARS = [params.year, params.year + 1];

  let query = {
    $or: [],
  };
  query.year = {
    $in: YEARS,
  };
  query.type = "Export";
  query.countryId = selectedCountry._id;
  if (query.$or.length === 0) {
    delete query.$or;
  }
  await context.collection("DomesticTradeDatas").createIndex({
    year: 1,
  });
  const allDomesticTradeDatas = await context
    .collection("DomesticTradeDatas")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log(
  //   JSON.stringify({ params, query }, null, 4),
  //   allDomesticTradeDatas.length,
  // );
  const indexedDomesticTradeDatas = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["localSITCProductId", "year"],
    },
  });
  indexedDomesticTradeDatas.add(allDomesticTradeDatas);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 11;
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
        text: `Export of Cocoa Beans and Cocoa Products To Selected Country/Region (RM)\nCountry: ${params.country}`,
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
          widths: [140, 120, 120, 120],
          body: [
            [
              {
                text: "Country",
                bold: true,
                alignment: "center",
              },
              ...YEARS.map((year) => {
                return {
                  text: year,
                  bold: true,
                  alignment: "center",
                };
              }),
              {
                text: "Percentage Change (%)",
                bold: true,
                alignment: "center",
              },
            ],
            ...(() => {
              let table = [];

              let stats = {};
              for (const product of allLocalSITCProducts) {
                for (const year of YEARS) {
                  const tradeDatas = indexedDomesticTradeDatas.where({
                    localSITCProductId: product._id,
                    year,
                  });
                  // if (tradeDatas.length === 0) continue;
                  if (!stats[product.product]) {
                    stats[product.product] = {};
                  }
                  if (!stats[product.product][year]) {
                    // stats[product.product][year] = {};
                    stats[product.product][year] = {
                      quantity: 0,
                      value: 0,
                    };
                  }
                  // if (year === 2019 && product.product === "Cocoa Beans") {
                  //   console.log("Cocoa Beans", tradeDatas);
                  //   // console.log(
                  //   //   tradeData.monthName,
                  //   //   tradeData.quantity,
                  //   //   // "=",
                  //   //   // stats[product.product][year].quantity,
                  //   //   tradeData.value,
                  //   //   // "=",
                  //   //   // stats[product.product][year].value,
                  //   // );
                  // }
                  for (const tradeData of tradeDatas) {
                    stats[product.product][year].quantity += tradeData.quantity;
                    stats[product.product][year].value += tradeData.value;
                    // if (year === 2019 && product.product === "Cocoa Beans") {
                    //   console.log(
                    //     tradeData.monthName,
                    //     tradeData.quantity,
                    //     "=",
                    //     stats[product.product][year].quantity,
                    //     tradeData.value,
                    //     "=",
                    //     stats[product.product][year].value,
                    //   );
                    // }
                  }
                }
              }

              let total = {};
              for (const product in stats) {
                if (!(product || "").trim()) continue;

                let productValues = [];

                table.push([
                  {
                    text: product,
                    // alignment: "center",
                  },
                  ...YEARS.map((year, index) => {
                    productValues[index] = 0;

                    if (stats[product] && stats[product][year]) {
                      if (!total[year]) {
                        total[year] = 0;
                      }
                      total[year] += stats[product][year].value;

                      productValues[index] = stats[product][year].value;
                    }

                    return {
                      text: formatNumber(
                        stats[product] && stats[product][year].value
                      ),
                      alignment: "right",
                    };
                  }),
                  (() => {
                    let percentChange =
                      ((productValues[1] - productValues[0]) * 100.0) /
                      productValues[0];
                    if (percentChange < 0) {
                      percentChange = percentChange * -1;
                      percentChange = Math.floor(percentChange);
                    }
                    return {
                      text:
                        formatNumber(
                          // ((productValues[1] - productValues[0]) * 100.0) /
                          //   productValues[0],
                          percentChange
                        ) + "%",
                      alignment: "right",
                    };
                  })(),
                ]);
              }
              // console.log({ total });

              let productValues = [];
              table.push([
                {
                  text: "Total",
                  alignment: "right",
                  bold: true,
                },
                ...YEARS.map((year, index) => {
                  productValues[index] = total[year] || 0;
                  return {
                    text: formatNumber(total[year]),
                    alignment: "right",
                    bold: true,
                  };
                }),
                (() => {
                  // console.log({
                  //   one: productValues[1],
                  //   two: productValues[0],
                  //   diff: productValues[1] - productValues[0],
                  //   formatted:
                  //     ((productValues[1] - productValues[0]) * 100.0) /
                  //     productValues[0],
                  // });
                  let finalTotal =
                    ((productValues[1] - productValues[0]) * 100.0) /
                    productValues[0];
                  if (finalTotal < 0) {
                    finalTotal = finalTotal * -1;
                    finalTotal = Math.floor(finalTotal);
                  }
                  return {
                    text:
                      formatNumber(
                        finalTotal
                        // ((productValues[1] - productValues[0]) * 100.0) /
                        //   productValues[0],
                      ) + "%",
                    alignment: "right",
                  };
                })(),
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
    filename: `Domestic Trade Cocoa Beans Export Report.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

const generateDomesticTradeExportImportSelectedCountryReport = async (
  self,
  params,
  context
) => {
  // console.log("generateDomesticTradeExportImportReport", params);
  assertValidSession(context.activeSession);

  // ###########################################################################################
  // -------------------------------------------------------------------------------------------
  let selectedCountry = await context.collection("Countries").findOne({
    name: params.country,
    _deletedAt: {
      $exists: false,
    },
  });

  let allLocalSITCProducts = await context
    .collection("LocalSITCProducts")
    .find({
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  allLocalSITCProducts = allLocalSITCProducts.map((item) => {
    return {
      ...item,
      product: item.newProduct || item.product,
    };
  });
  // console.log("allLocalSITCProducts", allLocalSITCProducts.length);
  const indexedLocalSITCProducts = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["product"],
    },
  });
  indexedLocalSITCProducts.add(allLocalSITCProducts);

  let MONTHS = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const monthFilterBeginIndex = !params.fromMonth
    ? 1
    : MONTHS.findIndex((month) => month === params.fromMonth);
  const monthFilterEndIndex = !params.toMonth
    ? 12
    : MONTHS.findIndex((month) => month === params.toMonth);
  if (monthFilterBeginIndex > monthFilterEndIndex) {
    MONTHS = [];
  } else {
    MONTHS = MONTHS.filter((month, index) => {
      return monthFilterBeginIndex <= index && index <= monthFilterEndIndex;
    });
  }

  let diffYear = 5;
  const YEARS = [...new Array(diffYear)].map((_, yearIndex) => {
    const currentYear = parseInt(params.year) - 4 + yearIndex;
    return currentYear;
  });
  // console.log({ params, MONTHS, YEARS, monthFilterBeginIndex, monthFilterBeginIndex});

  const lastYear = YEARS[YEARS.length - 1];
  let query = {
    $or: [],
  };
  query.year = {
    $in: YEARS,
  };
  query.type = params.type;
  query.countryId = selectedCountry._id;
  if (query.$or.length === 0) {
    delete query.$or;
  }
  await context.collection("DomesticTradeDatas").createIndex({
    year: 1,
  });
  let allDomesticTradeDatas = await context
    .collection("DomesticTradeDatas")
    .find({
      ...query,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  // console.log(
  //   JSON.stringify({ params, query }, null, 4),
  //   allDomesticTradeDatas.length,
  // );
  allDomesticTradeDatas = allDomesticTradeDatas.filter((item) => {
    if (item.year === params.fromYear && item.month < monthFilterBeginIndex) {
      return false;
    } else if (
      item.year === params.toYear &&
      item.month > monthFilterEndIndex
    ) {
      return false;
    }
    return true;
  });
  const indexedDomesticTradeDatas = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["countryId", "year", "month", "monthName"],
    },
  });
  indexedDomesticTradeDatas.add(allDomesticTradeDatas);

  // ###########################################################################################
  // ###########################################################################################

  const BASE_FONT_SIZE = 9;
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
        text: `MALAYSIA: ${params.type.toUpperCase()} OF COCOA BEANS AND COCOA PRODUCT TO ${
          params.country
        }`,
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
                text: "Product",
                bold: true,
                alignment: "center",
                rowSpan: 2,
              },
              ...YEARS.reduce((all, year) => {
                all.push({
                  text: year,
                  bold: true,
                  alignment: "center",
                  colSpan: 2,
                });
                all.push("");
                return all;
              }, []),
            ],
            [
              "",
              ...YEARS.reduce((all, year) => {
                all.push({
                  text: "QUANTITY\n(Kg)",
                  bold: true,
                  alignment: "center",
                });
                all.push({
                  text: "VALUE\n(RM)",
                  bold: true,
                  alignment: "center",
                });
                return all;
              }, []),
            ],
            ...(() => {
              let table = [];

              let stats = {};
              for (const product of allLocalSITCProducts) {
                for (const year of YEARS) {
                  let tradeDatas = indexedDomesticTradeDatas.where({
                    localSITCProductId: product._id,
                    year,
                  });
                  if (year === lastYear) {
                    const tmpTradeDatas = indexedDomesticTradeDatas.where({
                      localSITCProductId: product._id,
                      year,
                    });
                    tradeDatas = [];
                    for (const month of MONTHS) {
                      const tmpTradeData = tmpTradeDatas.filter(
                        (tmp) => tmp.monthName === month
                      );
                      tradeDatas.push(...tmpTradeData);
                    }
                  }
                  // if (tradeDatas.length === 0) continue;
                  if (!stats[product.product]) {
                    stats[product.product] = {};
                  }
                  if (!stats[product.product][year]) {
                    // stats[product.product][year] = {};
                    stats[product.product][year] = {
                      quantity: 0,
                      value: 0,
                    };
                  }

                  for (const tradeData of tradeDatas) {
                    stats[product.product][year].quantity += tradeData.quantity;
                    stats[product.product][year].value += tradeData.value;
                  }
                }
              }

              let total = {};
              for (const product in stats) {
                if (!(product || "").trim()) continue;

                table.push([
                  {
                    text: product,
                    // alignment: "center",
                  },
                  ...YEARS.reduce((all, year) => {
                    if (!total[year]) {
                      total[year] = {
                        quantity: 0,
                        value: 0,
                      };
                    }
                    total[year].quantity +=
                      (stats[product] &&
                        stats[product][year] &&
                        stats[product][year].quantity) ||
                      0;
                    total[year].value +=
                      (stats[product] &&
                        stats[product][year] &&
                        stats[product][year].value) ||
                      0;
                    all.push({
                      text: formatNumber(
                        stats[product] &&
                          stats[product][year] &&
                          stats[product][year].quantity,
                        2
                      ),
                      alignment: "right",
                    });
                    all.push({
                      text: formatNumber(
                        stats[product] &&
                          stats[product][year] &&
                          stats[product][year].value,
                        2
                      ),
                      alignment: "right",
                    });
                    return all;
                  }, []),
                ]);
              }

              table.push([
                {
                  text: "TOTAL",
                  // alignment: "center",
                  bold: true,
                },
                ...YEARS.reduce((all, year) => {
                  all.push({
                    // text: formatNumber(total[year] && total[year].quantity),
                    text: " ",
                    alignment: "right",
                    bold: true,
                  });
                  all.push({
                    text: formatNumber(total[year] && total[year].value),
                    alignment: "right",
                    bold: true,
                  });
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
        text: [
          params.description,
          `${params.year}: ${params.fromMonth} - ${params.toMonth}`,
          // params.title,
        ]
          .filter((text) => !!text)
          .join("\n"),
      },
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Domestic Trade Export Import Selected Country Report.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

module.exports = {
  generateDomesticTradeExportImportReport,
  generateDomesticTradeExportDestinationSourceReport,
  generateDomesticTradeContributionOfExportByRegionReport,
  generateDomesticTradeCocoaBeansExportReport,
  generateDomesticTradeExportImportSelectedCountryReport,
};

const roundUpIfGreaterThanSixty = (value) => {
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
