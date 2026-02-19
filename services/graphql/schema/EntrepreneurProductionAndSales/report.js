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

const generateProductionAndSalesRepoprt = async (self, params, context) => {
  assertValidSession(context.activeSession);
  // console.log("generateProductionAndSalesRepoprt", { params });

  const foundRegion = await context.collection("Regions").findOne({
    _id: params.stateIds[0],
  });
  await context.collection("States").createIndex({
    regionId: 1,
  });
  const foundStates = await context
    .collection("States")
    .find({
      regionId: foundRegion._id,
    })
    .toArray();
  // const foundState = await context.collection("States").findOne({
  //   _id: params.stateIds[0],
  // });

  const fromYear = parseInt(params.fromDateIds[0].split("-")[0]);
  const fromMonth = parseInt(params.fromDateIds[0].split("-")[1]);
  const toYear = parseInt(params.toDateIds[0].split("-")[0]);
  const toMonth = parseInt(params.toDateIds[0].split("-")[1]);
  // console.log({
  //   fromYear,
  //   fromMonth,
  // });
  const fromDate = dayjs()
    .set("year", fromYear)
    .set("month", fromMonth - 1)
    .startOf("month")
    .format("YYYY-MM-DD");
  const toDate = dayjs()
    .set("year", toYear)
    .set("month", toMonth - 1)
    .endOf("month")
    .format("YYYY-MM-DD");
  // console.log({ foundStates, fromDate, toDate });

  // let stateName = foundState.description.trim().toUpperCase().split("OF ");
  // stateName = stateName[stateName.length - 1];
  // await context.collection("Entrepreneurs").createIndex({
  //   state: 1,
  // });
  // const foundEntrepreneurs = await context
  //   .collection("Entrepreneurs")
  //   .find({
  //     state: stateName,
  //   })
  //   .toArray();

  await context.collection("Entrepreneurs").createIndex({
    stateId: 1,
  });
  const foundEntrepreneurs = await context
    .collection("Entrepreneurs")
    .find({
      stateId: {
        $in: foundStates.map(s => s._id),
      },
    })
    .toArray();

  // console.log("foundEntrepreneurs", stateName, foundEntrepreneurs.length);
  const indexedEntrepreneurs = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["level"],
    },
  });
  indexedEntrepreneurs.add(foundEntrepreneurs);

  await context.collection("EntrepreneurProductionAndSaleses").createIndex({
    year: 1,
    stateId: 1,
    entrepreneurId: 1,
  });
  let foundProductionAndSales = await context
    .collection("EntrepreneurProductionAndSaleses")
    .find({
      year: {
        $gte: fromYear,
        $lte: toYear,
      },
      // stateId: foundState._id,
      stateId: {
        $in: foundStates.map(s => s._id),
      },
      entrepreneurId: {
        $in: foundEntrepreneurs.map(e => e._id),
      },
    })
    .toArray();
  const fromDateIndex = fromYear * 12 + fromMonth;
  const toDateIndex = toYear * 12 + toMonth;
  let diffDateIndex = toDateIndex - fromDateIndex;
  foundProductionAndSales = foundProductionAndSales
    .map(item => {
      const dateIndex = item.year * 12 + item.month;
      // console.log(item.year, item.month, dateIndex);
      return {
        ...item,
        dateIndex,
      };
    })
    .filter(
      item => fromDateIndex <= item.dateIndex && item.dateIndex <= toDateIndex,
    );
  // console.log("foundProductionAndSales", foundProductionAndSales.length);
  const indexedProductionAndSales = new FlexSearch({
    tokenize: "strict",
    doc: {
      id: "_id",
      field: ["entrepreneurId"],
    },
  });
  indexedProductionAndSales.add(foundProductionAndSales);

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
        text: `MAKLUMAT HASIL USAHAWAN COKLAT ${
          foundRegion.description || ""
        }, ${
          params.titleSuffix ||
          dayjs()
            .set("year", fromYear)
            .set("month", fromMonth - 1)
            .locale("en")
            .format("MMMM")
        } ${params.titleSuffix ? "" : fromYear}`.toUpperCase(),
        bold: true,
        fontSize: BASE_FONT_SIZE + 2,
        alignment: "center",
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
          widths: [100, 90, 80, 80, 80, 80],
          body: [
            [
              {
                marginTop: 7,
                text: "Kategori Usahawan",
                bold: true,
                alignment: "center",
                rowSpan: 2,
              },
              {
                marginTop: 7,
                text: "Bilangan",
                bold: true,
                alignment: "center",
                rowSpan: 2,
              },
              {
                text: "Pengeluaran (Kg)",
                bold: true,
                alignment: "center",
                colSpan: 2,
              },
              "",
              {
                text: "Hasil Jualan (RM)",
                bold: true,
                alignment: "center",
                colSpan: 2,
              },
              "",
            ],
            [
              "",
              "",
              {
                text: "Jumlah",
                bold: true,
                alignment: "center",
              },
              {
                text: "Purata / Bulan",
                bold: true,
                alignment: "center",
              },
              {
                text: "Jumlah",
                bold: true,
                alignment: "center",
              },
              {
                text: "Purata / Bulan",
                bold: true,
                alignment: "center",
              },
            ],
            ...(() => {
              let table = [];

              const CATEGORIES = [
                {
                  level: 4,
                  sublabel: "(801 <)",
                },
                {
                  level: 3,
                  sublabel: "(301-800)",
                },
                {
                  level: 2,
                  sublabel: "(101-300)",
                },
                {
                  level: 1,
                  sublabel: "(< 100)",
                },
              ];

              let stats = {
                countEntrepreneurs: 0,
                totalProduction: 0,
                totalAverageProduction: 0,
                totalSales: 0,
                totalAverageSales: 0,
              };
              for (const category of CATEGORIES) {
                const currentEntrepreneurs = indexedEntrepreneurs.where({
                  level: category.level,
                });

                // console.log(
                //   "currentEntrepreneurs",
                //   currentEntrepreneurs.map(ent => ent._id),
                // );

                let totalProduction = 0,
                  totalSales = 0;
                for (const entrepreneur of currentEntrepreneurs) {
                  const items = indexedProductionAndSales.where({
                    entrepreneurId: entrepreneur._id,
                  });
                  for (const item of items) {
                    totalProduction += item.totalProduction;
                    totalSales += item.totalSales;
                  }
                }

                //##### ORIGINAL ######
                // let averageProduction =
                //   totalProduction !== 0 && diffDateIndex !== 0
                //     ? lodash.round(totalProduction / diffDateIndex, 2)
                //     : 0;
                //#####################
                let averageProduction =
                  totalProduction !== 0 ? totalProduction / 1 : 0;
                if (params.titleSuffix) {
                  if (params.titleSuffix.includes("Quarter")) {
                    averageProduction =
                      totalProduction !== 0
                        ? lodash.round(totalProduction / 3, 0)
                        : 0;
                  }

                  if (params.titleSuffix.includes("YEAR")) {
                    averageProduction =
                      totalProduction !== 0
                        ? lodash.round(totalProduction / 12, 0)
                        : 0;
                  }
                }

                //##### ORIGINAL #####//
                // let averageSales =
                //   totalSales !== 0 && diffDateIndex !== 0
                //     ? lodash.round(totalSales / diffDateIndex, 2)
                //     : 0;
                //#################
                let averageSales = totalSales !== 0 ? totalSales / 1 : 0;

                if (params.titleSuffix) {
                  if (params.titleSuffix.includes("Quarter")) {
                    averageSales =
                      totalSales !== 0 ? lodash.round(totalSales / 3, 0) : 0;
                  }

                  if (params.titleSuffix.includes("YEAR")) {
                    averageSales =
                      totalSales !== 0 ? lodash.round(totalSales / 12, 0) : 0;
                  }
                }

                stats.countEntrepreneurs += currentEntrepreneurs.length;
                stats.totalProduction += totalProduction;
                stats.totalSales += totalSales;
                stats.totalAverageProduction += averageProduction;
                stats.totalAverageSales += averageSales;
                // console.log({ averageSales, averageProduction });

                // if (!totalProduction && !totalSales) continue;

                table.push([
                  {
                    text: `Tahap ${category.level}\n${category.sublabel}`,
                    alignment: "center",
                  },
                  {
                    marginTop: 7,
                    text: currentEntrepreneurs.length || "-",
                    alignment: "center",
                  },
                  {
                    marginTop: 7,
                    text: totalProduction || "-",
                    alignment: "center",
                  },
                  {
                    marginTop: 7,
                    text: averageProduction || "-",
                    alignment: "center",
                  },
                  {
                    marginTop: 7,
                    text: totalSales || "-",
                    alignment: "center",
                  },
                  {
                    marginTop: 7,
                    text: averageSales || "-",
                    alignment: "center",
                  },
                ]);
              }

              // console.log({ stats });
              table.push([
                {
                  text: "Jumlah",
                  alignment: "center",
                },
                {
                  text: stats.countEntrepreneurs || "-",
                  alignment: "center",
                },
                {
                  text: stats.totalProduction || "-",
                  alignment: "center",
                },
                {
                  text: stats.totalAverageProduction || "-",
                  alignment: "center",
                },
                {
                  text: stats.totalSales || "-",
                  alignment: "center",
                },
                {
                  text: stats.totalAverageSales || "-",
                  alignment: "center",
                },
              ]);

              return table;
            })(),
          ],
        },
      },
      params.description
        ? {
            marginTop: 16,
            text: params.description,
          }
        : "",
    ],
  };
  return await createPdf({
    docDefinition,
    filename: `Production And Sales Report.pdf`,
    prefix: "",
    basePath: "/lkm",
  });
};

module.exports = {
  generateProductionAndSalesRepoprt,
};
