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

const { formatNumber } = require("../../libs/numbers");

const { generateEstateCensusReport } = require("./report");
const { generateMalaysianReport } = require("./malaysian-report");

const resolvers = {
  Query: {
    allEstateCensusReports: async (self, params, context) => {
      return [];
    },
    allEstateCensusStateDistricts: async (self, params, context) => {
      return await context
        .collection("EstateCensusStateDistricts")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
    },
    allEstateCensusStateCodes: async (self, params, context) => {
      return await context
        .collection("EstateCensusStateCodes")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
    },
  },

  Mutation: {
    generateEstateCensusReportLuasKawasanKoko: async (
      self,
      params,
      context,
    ) => {
      // console.log("generateDomesticTradeExportImportReport", params);
      assertValidSession(context.activeSession);

      // ###########################################################################################
      // -------------------------------------------------------------------------------------------
      const allEstateCensusStateCodes = await context
        .collection("EstateCensusStateCodes")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      const indexedEstateCensusStateCodes = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["stateName"],
        },
      });
      indexedEstateCensusStateCodes.add(allEstateCensusStateCodes);
      // console.log(
      //   "allEstateCensusStateCodes",
      //   allEstateCensusStateCodes.length,
      // );

      const allEstateInformations = await context
        .collection("EstateInformations")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      const indexedEstateInformations = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateState", "stateCode", "districtCode"],
        },
      });
      indexedEstateInformations.add(
        allEstateInformations.map(info => ({
          ...info,
          stateCode: String(parseInt(info.stateCode)),
          districtCode: String(parseInt(info.districtCode)),
        })),
      );
      // console.log("allEstateInformations", allEstateInformations.length);

      let query = {};
      if (params.year) {
        query.censusYear = params.year;
      }
      await context.collection("DomesticTradeDatas").createIndex({
        censusYear: 1,
        code: 1,
      });
      const allValues = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .find({
          ...query,
          code: "A008a22",
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allValues", allValues.length);
      // console.log({ allValues, query });
      const indexedValues = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateInformationId"],
        },
      });
      indexedValues.add(allValues);

      // ###########################################################################################
      // ###########################################################################################

      const BASE_FONT_SIZE = 9;
      const docDefinition = {
        pageMargins: [20, 30, 20, 20],
        pageSize: "A4",
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
            text: `Jumlah Luas Kawasan Koko di Estet Mengikuti Negeri ${params.year}: Malaysia`,
            // alignment: "center",
            bold: true,
            fontSize: BASE_FONT_SIZE + 3,
          },
          {
            text: `Total Planted Hecterage Of Cocoa Estates by States ${params.year}: Malaysia`,
            // alignment: "center",
            // bold: true,
            italics: true,
            fontSize: BASE_FONT_SIZE + 3,
          },
          {
            marginTop: 20,
            layout: {
              ...defaultTableLayout,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 3,
              paddingRight: () => 3,
            },
            table: {
              widths: [170, 170, 170],
              body: [
                [
                  {
                    alignment: "center",
                    stack: [
                      {
                        text: "Negeri",
                        bold: true,
                      },
                      {
                        text: "States",
                        italics: true,
                      },
                    ],
                  },
                  {
                    alignment: "center",
                    stack: [
                      {
                        text: "Bilangan Estet",
                        bold: true,
                      },
                      {
                        text: "Number of Estates",
                        italics: true,
                      },
                    ],
                  },
                  {
                    alignment: "center",
                    stack: [
                      {
                        text: "Keluasa Estet",
                        bold: true,
                      },
                      {
                        text: "Hectareage of Estates",
                        italics: true,
                      },
                    ],
                  },
                ],
                ...(() => {
                  let table = [];

                  let countInformations = 0,
                    totalValues = 0;
                  for (const state of allEstateCensusStateCodes) {
                    const informations = indexedEstateInformations.where({
                      estateState: state.stateName,
                    });
                    if (!informations.length) continue;

                    let stateValues = 0;
                    for (const information of informations) {
                      const values = indexedValues.where({
                        estateInformationId: information._id,
                      });
                      for (const value of values) {
                        stateValues += parseFloat(value.value);
                      }
                    }

                    table.push([
                      {
                        alignment: "center",
                        text: state.stateName,
                      },
                      {
                        alignment: "center",
                        text: informations.length,
                      },
                      {
                        alignment: "center",
                        text: stateValues,
                      },
                    ]);

                    countInformations += informations.length;
                    totalValues += stateValues;
                  }

                  table.push([
                    {
                      alignment: "center",
                      stack: [
                        {
                          text: "Jumlah",
                          bold: true,
                        },
                        {
                          text: "Total",
                          italics: true,
                        },
                      ],
                    },
                    {
                      alignment: "center",
                      bold: true,
                      text: countInformations,
                      marginTop: 4,
                    },
                    {
                      alignment: "center",
                      bold: true,
                      text: totalValues,
                      marginTop: 4,
                    },
                  ]);

                  return table;
                })(),
              ],
            },
          },
          // {
          //   marginTop: 40,
          //   text: [
          //     `${params.toYear} ${params.fromMonth} ${params.toMonth}`,
          //     params.title,
          //   ].join("\n"),
          // },
          // {
          //   marginTop: -12,
          //   text: `Date: ${dayjs().locale("ms-my").format("DD MMMM YYYY")}`,
          //   alignment: "right",
          // },
        ],
      };
      return await createPdf({
        docDefinition,
        filename: `Estate Census Report - Luas Kawasan Koko.pdf`,
        prefix: "",
        basePath: "/lkm",
      });
    },

    generateEstateCensusReportTarafSahJenisHakMilik: async (
      self,
      params,
      context,
    ) => {
      // console.log("generateDomesticTradeExportImportReport", params);
      assertValidSession(context.activeSession);

      // ###########################################################################################
      // -------------------------------------------------------------------------------------------
      const allEstateCensusStateCodes = await context
        .collection("EstateCensusStateCodes")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allEstateCensusStateCodes", allEstateCensusStateCodes[0]);
      const indexedEstateCensusStateCodes = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["stateName"],
        },
      });
      indexedEstateCensusStateCodes.add(allEstateCensusStateCodes);
      // console.log(
      //   "allEstateCensusStateCodes",
      //   allEstateCensusStateCodes.length,
      // );

      const allEstateCensusStateDistricts = await context
        .collection("EstateCensusStateDistricts")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log(
      //   "allEstateCensusStateDistricts",
      //   allEstateCensusStateDistricts[0],
      // );
      const indexedEstateCensusStateDistricts = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["stateCode", "stateCodeId"],
        },
      });
      indexedEstateCensusStateDistricts.add(allEstateCensusStateDistricts);
      // console.log(
      //   "allEstateCensusStateDistricts",
      //   allEstateCensusStateDistricts.length,
      // );

      const allEstateInformations = await context
        .collection("EstateInformations")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allEstateInformations", allEstateInformations[0]);
      const indexedEstateInformations = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateState", "stateCode", "districtCode"],
        },
      });
      indexedEstateInformations.add(
        allEstateInformations.map(info => ({
          ...info,
          stateCode: String(parseInt(info.stateCode)),
          districtCode: String(parseInt(info.districtCode)),
        })),
      );
      // console.log("allEstateInformations", allEstateInformations.length);

      let query = {};
      if (params.year) {
        query.censusYear = params.year;
      }
      await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .createIndex({
          censusYear: 1,
          code: 1,
        });
      const allValues = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .find({
          ...query,
          code: { $in: ["Q00310", "Q00318", "Q00337"] },
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allValues", allValues[0], allValues.length);
      // console.log({ allValues, query });
      const indexedValues = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateInformationId", "code"],
        },
      });
      indexedValues.add(allValues);

      await context.collection("EstateCensusYearLists").createIndex({
        year: 1,
        estateId: 1,
      });
      const allEstateCensusYearLists = await context
        .collection("EstateCensusYearLists")
        .find({
          year: parseInt(params.year),
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log(
      //   "allEstateCensusYearLists",
      //   // allEstateCensusYearLists[0],
      //   allEstateCensusYearLists.length,
      // );
      const indexedEstateCensusYearLists = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateId", "year"],
        },
      });
      indexedEstateCensusYearLists.add(allEstateCensusYearLists);

      // ###########################################################################################
      // ###########################################################################################

      let countEstateInformations = 0;

      const BASE_FONT_SIZE = 9;
      const docDefinition = {
        pageMargins: [20, 30, 20, 40],
        pageSize: "A4",
        pageOrientation: "portrait",
        // header:
        //   metadata.letter.useLetterHead === "Ya"
        //     ? renderHeader(
        //         companyInformation,
        //         // , [1]
        //       )
        //     : null,
        footer: (currentPage, pageCount) => [
          {
            text: "Tarik Cetak " + dayjs().format("DD/MM/YYYY"),
            alignment: "left",
            // lineHeight: 1,
            // marginTop: 4,
            marginBottom: 0,
            marginLeft: 20,
            fontSize: BASE_FONT_SIZE,
          },
          {
            text: "Page " + currentPage.toString() + " of " + pageCount,
            alignment: "left",
            // lineHeight: 1,
            // marginTop: 4,
            marginBottom: 8,
            marginLeft: 20,
            fontSize: BASE_FONT_SIZE,
          },
        ],
        defaultStyle: {
          fontSize: BASE_FONT_SIZE,
          // lineHeight: 1,
        },
        content: [
          {
            text: `Status Report 0101 - Taraf Sah / Jenis Hak Milik`,
            // alignment: "center",
            bold: true,
            fontSize: BASE_FONT_SIZE + 3,
          },
          {
            text: `Tahun Banci ${params.year}`,
            alignment: "right",
            bold: true,
            fontSize: BASE_FONT_SIZE + 3,
            marginTop: -14,
          },
          {
            marginTop: 10,
            layout: {
              ...defaultTableLayout,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 3,
              paddingRight: () => 3,
            },
            table: {
              widths: [65, 80, 80, 80, 50, 50, 50, 45],
              body: [
                [
                  {
                    text: "EstId",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                  {
                    text: "Malaysia",
                    bold: true,
                    alignment: "center",
                    colSpan: 2,
                  },
                  "",
                  {
                    text: "Bukan Malaysia",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Jumlah",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                  {
                    text: "Status Data",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                  {
                    text: "Status Estet",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                  {
                    text: "Jenis Hak Milik",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                ],
                [
                  "",
                  {
                    text: "% Pemastautin Pemegang Malaysia (Q00310)",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "% Lain (Q00310)",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "% Pemegang Bukan Pemastautin Malaysia (Q00310)",
                    bold: true,
                    alignment: "center",
                  },
                  "",
                  "",
                  "",
                  "",
                ],
                ...(() => {
                  let table = [];

                  let allStats = {
                    Q00310: 0,
                    Q00318: 0,
                    Q00337: 0,
                    total: 0,
                  };
                  for (const stateCode of allEstateCensusStateCodes) {
                    const stateDistricts =
                      indexedEstateCensusStateDistricts.where({
                        stateCode: stateCode.stateCode,
                        // stateCodeId: stateCode._id,
                      });
                    // console.log(
                    //   stateCode.stateCode,
                    //   stateCode.stateName,
                    //   stateDistricts.length,
                    // );

                    if (stateDistricts.length > 0) {
                      table.push([
                        {
                          text: `Kod / Nama Negeri: ${stateCode.stateCode} / ${stateCode.stateName}`,
                          // bold: true,
                          colSpan: 8,
                        },
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                      ]);
                    }

                    let stateStats = {
                      Q00310: 0,
                      Q00318: 0,
                      Q00337: 0,
                      total: 0,
                    };
                    for (const stateDistrict of stateDistricts) {
                      let estateInformations = indexedEstateInformations.where({
                        // stateCode: stateCode.stateCode,
                        // districtCode: stateDistrict.districtCode,
                        stateCode: String(parseInt(stateCode.stateCode)),
                        districtCode: String(
                          parseInt(stateDistrict.districtCode),
                        ),
                      });
                      // console.log("estateInformations", estateInformations[0]);
                      estateInformations = estateInformations.filter(info => {
                        // --> find one value, check if exists
                        const foundValue = indexedValues.find({
                          estateInformationId: info._id,
                        });
                        return !!foundValue;

                        // --> filter by EstateCensusYearLists
                        // const foundYear = indexedEstateCensusYearLists.find({
                        //   estateId: info.estateId,
                        // });
                        // return !!foundYear;
                      });

                      // console.log(
                      //   stateDistrict.districtCode,
                      //   stateDistrict.districtName,
                      //   estateInformations.length,
                      // );

                      let districtStats = {
                        Q00310: 0,
                        Q00318: 0,
                        Q00337: 0,
                      };
                      if (estateInformations.length > 0) {
                        table.push([
                          {
                            text: `Kod / Nama Daerah: ${stateDistrict.districtCode} / ${stateDistrict.districtName}`,
                            bold: true,
                            colSpan: 8,
                          },
                          "",
                          "",
                          "",
                          "",
                          "",
                          "",
                          "",
                        ]);
                      }

                      for (const info of estateInformations) {
                        const Q00310 = indexedValues.find({
                          estateInformationId: info._id,
                          code: "Q00310",
                        });
                        const Q00318 = indexedValues.find({
                          estateInformationId: info._id,
                          code: "Q00318",
                        });
                        const Q00337 = indexedValues.find({
                          estateInformationId: info._id,
                          code: "Q00337",
                        });
                        if (!Q00310 && !Q00318 && !Q00337) {
                          continue;
                        }

                        countEstateInformations += 1;

                        let total =
                          lodash.round((Q00310 && Q00310.value) || 0, 2) +
                          lodash.round((Q00318 && Q00318.value) || 0, 2) +
                          lodash.round((Q00337 && Q00337.value) || 0, 2);

                        districtStats.Q00310 += lodash.round(
                          (Q00310 && Q00310.value) || 0,
                          2,
                        );
                        districtStats.Q00318 += lodash.round(
                          (Q00318 && Q00318.value) || 0,
                          2,
                        );
                        districtStats.Q00337 += lodash.round(
                          (Q00337 && Q00337.value) || 0,
                          2,
                        );

                        table.push([
                          {
                            text: ("0000" + info.estateId).slice(-5),
                            // bold: true,
                          },
                          {
                            text: lodash
                              .round((Q00310 && Q00310.value) || 0, 2)
                              .toFixed(2),
                            // bold: true,
                            alignment: "right",
                          },
                          {
                            text: lodash
                              .round((Q00318 && Q00318.value) || 0, 2)
                              .toFixed(2),
                            // bold: true,
                            alignment: "right",
                          },
                          {
                            text: lodash
                              .round((Q00337 && Q00337.value) || 0, 2)
                              .toFixed(2),
                            // bold: true,
                            alignment: "right",
                          },
                          {
                            text: lodash.round(total || 0, 2).toFixed(2),
                            // bold: true,
                            alignment: "right",
                          },
                          {
                            text: "Sah",
                            // bold: true,
                            alignment: "center",
                          },
                          {
                            text:
                              info.estateType === "01"
                                ? "Aktif"
                                : "Tidak Aktif",
                            // bold: true,
                            alignment: "center",
                          },
                          {
                            text: "Malaysia",
                            // bold: true,
                            alignment: "center",
                          },
                        ]);
                      }

                      if (estateInformations.length > 0) {
                        stateStats.Q00310 += districtStats.Q00310;
                        stateStats.Q00318 += districtStats.Q00318;
                        stateStats.Q00337 += districtStats.Q00337;

                        let total =
                          lodash.round(districtStats.Q00310 || 0, 2) +
                          lodash.round(districtStats.Q00318 || 0, 2) +
                          lodash.round(districtStats.Q00337 || 0, 2);

                        const districtWithValue = Object.keys(
                          districtStats,
                        ).find(key => !!districtStats[key]);

                        if (total > 0) {
                          table.push([
                            {
                              text: "Jumlah Daerah",
                              bold: true,
                            },
                            {
                              text: lodash
                                .round(districtStats.Q00310 || 0, 2)
                                .toFixed(2),
                              bold: true,
                              alignment: "right",
                            },
                            {
                              text: lodash
                                .round(districtStats.Q00318 || 0, 2)
                                .toFixed(2),
                              bold: true,
                              alignment: "right",
                            },
                            {
                              text: lodash
                                .round(districtStats.Q00337 || 0, 2)
                                .toFixed(2),
                              bold: true,
                              alignment: "right",
                            },
                            {
                              text: lodash.round(total || 0, 2).toFixed(2),
                              bold: true,
                              alignment: "right",
                            },
                            "",
                            "",
                            "",
                          ]);
                        } else {
                          table.pop();
                        }
                      }
                    }

                    if (stateDistricts.length > 0) {
                      allStats.Q00310 += stateStats.Q00310;
                      allStats.Q00318 += stateStats.Q00318;
                      allStats.Q00337 += stateStats.Q00337;

                      let total =
                        lodash.round(stateStats.Q00310 || 0, 2) +
                        lodash.round(stateStats.Q00318 || 0, 2) +
                        lodash.round(stateStats.Q00337 || 0, 2);

                      const stateWithValue = Object.keys(stateStats).find(
                        key => !!stateStats[key],
                      );

                      if (total > 0) {
                        table.push([
                          {
                            text: "Jumlah Negeri",
                            bold: true,
                          },
                          {
                            text: lodash
                              .round(stateStats.Q00310 || 0, 2)
                              .toFixed(2),
                            bold: true,
                            alignment: "right",
                          },
                          {
                            text: lodash
                              .round(stateStats.Q00318 || 0, 2)
                              .toFixed(2),
                            bold: true,
                            alignment: "right",
                          },
                          {
                            text: lodash
                              .round(stateStats.Q00337 || 0, 2)
                              .toFixed(2),
                            bold: true,
                            alignment: "right",
                          },
                          {
                            text: lodash.round(total || 0, 2).toFixed(2),
                            bold: true,
                            alignment: "right",
                          },
                          "",
                          "",
                          "",
                        ]);
                      } else {
                        table.pop();
                      }
                    }
                  }

                  // let total =
                  //   lodash.round(allStats.Q00310 || 0, 2) +
                  //   lodash.round(allStats.Q00318 || 0, 2) +
                  //   lodash.round(allStats.Q00337 || 0, 2);
                  // table.push([
                  //   {
                  //     text: "Jumlah Negara",
                  //     bold: true,
                  //   },
                  //   {
                  //     text: lodash.round(allStats.Q00310 || 0, 2).toFixed(2),
                  //     bold: true,
                  //     alignment: "right",
                  //   },
                  //   {
                  //     text: lodash.round(allStats.Q00318 || 0, 2).toFixed(2),
                  //     bold: true,
                  //     alignment: "right",
                  //   },
                  //   {
                  //     text: lodash.round(allStats.Q00337 || 0, 2).toFixed(2),
                  //     bold: true,
                  //     alignment: "right",
                  //   },
                  //   {
                  //     text: lodash.round(total || 0, 2).toFixed(2),
                  //     bold: true,
                  //     alignment: "right",
                  //   },
                  //   "",
                  //   "",
                  //   "",
                  // ]);

                  return table;
                })(),
              ],
            },
          },
          {
            marginTop: 10,
            text: "Bilangan Estet: " + countEstateInformations,
          },
          {
            marginTop: 4,
            text: "Bilangan Status Sah: " + countEstateInformations,
          },
          {
            marginTop: 4,
            text: "Bilangan Status Tidak Sah: " + 0,
          },
          // {
          //   marginTop: 40,
          //   text: [
          //     `${params.toYear} ${params.fromMonth} ${params.toMonth}`,
          //     params.title,
          //   ].join("\n"),
          // },
          // {
          //   marginTop: -12,
          //   text: `Date: ${dayjs().locale("ms-my").format("DD MMMM YYYY")}`,
          //   alignment: "right",
          // },
        ],
      };
      return await createPdf({
        docDefinition,
        filename: `Estate Census Report - Taraf Sah dan Jenis Hak Milik.pdf`,
        prefix: "",
        basePath: "/lkm",
      });
    },
    generateEstateCensusReportProfileUmur: async (self, params, context) => {
      // console.log("generateDomesticTradeExportImportReport", params);
      assertValidSession(context.activeSession);

      // ###########################################################################################
      // -------------------------------------------------------------------------------------------
      const allEstateCensusStateCodes = await context
        .collection("EstateCensusStateCodes")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allEstateCensusStateCodes", allEstateCensusStateCodes[0]);
      const indexedEstateCensusStateCodes = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["stateName"],
        },
      });
      indexedEstateCensusStateCodes.add(allEstateCensusStateCodes);
      // console.log(
      //   "allEstateCensusStateCodes",
      //   allEstateCensusStateCodes.length,
      // );

      const allEstateCensusStateDistricts = await context
        .collection("EstateCensusStateDistricts")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log(
      //   "allEstateCensusStateDistricts",
      //   allEstateCensusStateDistricts[0],
      // );
      const indexedEstateCensusStateDistricts = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["stateCode", "stateCodeId"],
        },
      });
      indexedEstateCensusStateDistricts.add(allEstateCensusStateDistricts);
      // console.log(
      //   "allEstateCensusStateDistricts",
      //   allEstateCensusStateDistricts.length,
      // );

      const allEstateInformations = await context
        .collection("EstateInformations")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allEstateInformations", allEstateInformations[0]);
      const indexedEstateInformations = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateState", "stateCode", "districtCode"],
        },
      });
      indexedEstateInformations.add(
        allEstateInformations.map(info => ({
          ...info,
          stateCode: String(parseInt(info.stateCode)),
          districtCode: String(parseInt(info.districtCode)),
        })),
      );
      // console.log("allEstateInformations", allEstateInformations.length);

      const CODED_COLUMNS = [
        "C01801",
        "C01901",
        "C02001",
        "C02101",
        "C02201",
        "C02301",
        "C02401",
        "C02501",
        "C02601",
      ];

      let query = {};
      if (params.year) {
        query.censusYear = params.year;
      }
      await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .createIndex({
          censusYear: 1,
          code: 1,
        });
      const allValues = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .find({
          ...query,
          code: {
            $in: [
              ...CODED_COLUMNS.map(code =>
                typeof code === "object" ? code.text : code,
              ),
            ],
          },
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allValues", allValues[0], allValues.length);
      // console.log({ allValues, query });
      const indexedValues = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateInformationId", "code"],
        },
      });
      indexedValues.add(allValues);

      await context.collection("EstateCensusYearLists").createIndex({
        year: 1,
        estateId: 1,
      });
      const allEstateCensusYearLists = await context
        .collection("EstateCensusYearLists")
        .find({
          year: parseInt(params.year),
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log(
      //   "allEstateCensusYearLists",
      //   // allEstateCensusYearLists[0],
      //   allEstateCensusYearLists.length,
      // );
      const indexedEstateCensusYearLists = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateId", "year"],
        },
      });
      indexedEstateCensusYearLists.add(allEstateCensusYearLists);

      // ###########################################################################################
      // ###########################################################################################

      let countEstateInformations = 0;

      const BASE_FONT_SIZE = 9;
      const docDefinition = {
        pageMargins: [20, 30, 20, 40],
        pageSize: "A4",
        pageOrientation: "portrait",
        // header:
        //   metadata.letter.useLetterHead === "Ya"
        //     ? renderHeader(
        //         companyInformation,
        //         // , [1]
        //       )
        //     : null,
        footer: (currentPage, pageCount) => [
          {
            text: "Tarik Cetak " + dayjs().format("DD/MM/YYYY"),
            alignment: "left",
            // lineHeight: 1,
            // marginTop: 4,
            marginBottom: 0,
            marginLeft: 20,
            fontSize: BASE_FONT_SIZE,
          },
          {
            text: "Page " + currentPage.toString() + " of " + pageCount,
            alignment: "left",
            // lineHeight: 1,
            // marginTop: 4,
            marginBottom: 8,
            marginLeft: 20,
            fontSize: BASE_FONT_SIZE,
          },
        ],
        defaultStyle: {
          fontSize: BASE_FONT_SIZE,
          // lineHeight: 1,
        },
        content: [
          {
            text: `Status Report 0201 - Profile Umur`,
            // alignment: "center",
            bold: true,
            fontSize: BASE_FONT_SIZE + 3,
          },
          {
            text: `Tahun Banci ${params.year}`,
            alignment: "right",
            bold: true,
            fontSize: BASE_FONT_SIZE + 3,
            marginTop: -14,
          },
          {
            marginTop: 10,
            layout: {
              ...defaultTableLayout,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 3,
              paddingRight: () => 3,
            },
            table: {
              widths: [65, ...CODED_COLUMNS.map(code => 47)],
              body: [
                [
                  {
                    text: "EstId",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                  {
                    text: "Kumpulan Umur",
                    bold: true,
                    alignment: "center",
                    colSpan: 8,
                  },
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  {
                    text: "Jumlah Keluasan Cukup Umur\nC02601",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                ],
                [
                  "",
                  {
                    text: "1.5 - 2.0\nC01801",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "3.0 - 5.0\nC01901",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "6.0 - 10.0\nC02001",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "11.0 - 15.0\nC02101",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "16.0 - 20.0\nC02201",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "21.0 - 25.0\nC02301",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "26.0 - 30.0\nC02401",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "30.0 > \nC02501",
                    bold: true,
                    alignment: "center",
                  },
                  "",
                ],
                ...(() => {
                  let table = [];

                  let allStats = {};
                  for (const code of CODED_COLUMNS) {
                    allStats[code] = 0;
                  }

                  for (const stateCode of allEstateCensusStateCodes) {
                    const stateDistricts =
                      indexedEstateCensusStateDistricts.where({
                        stateCode: stateCode.stateCode,
                        // stateCodeId: stateCode._id,
                      });
                    // console.log(
                    //   stateCode.stateCode,
                    //   stateCode.stateName,
                    //   stateDistricts.length,
                    // );

                    if (stateDistricts.length > 0) {
                      table.push([
                        {
                          text: `Kod / Nama Negeri: ${stateCode.stateCode} / ${stateCode.stateName}`,
                          // bold: true,
                          colSpan: CODED_COLUMNS.length + 1,
                        },
                        ...CODED_COLUMNS.map(code => code),
                      ]);
                    }

                    let stateStats = {};
                    for (const code of CODED_COLUMNS) {
                      stateStats[code] = 0;
                    }
                    for (const stateDistrict of stateDistricts) {
                      let estateInformations = indexedEstateInformations.where({
                        // stateCode: stateCode.stateCode,
                        // districtCode: stateDistrict.districtCode,
                        stateCode: String(parseInt(stateCode.stateCode)),
                        districtCode: String(
                          parseInt(stateDistrict.districtCode),
                        ),
                      });
                      estateInformations = estateInformations.filter(info => {
                        // --> find one value, check if exists
                        const foundValue = indexedValues.find({
                          estateInformationId: info._id,
                        });
                        return !!foundValue;

                        // --> filter by EstateCensusYearLists
                        // const foundYear = indexedEstateCensusYearLists.find({
                        //   estateId: info.estateId,
                        // });
                        // return !!foundYear;
                      });
                      // console.log(
                      //   stateDistrict.districtCode,
                      //   stateDistrict.districtName,
                      //   estateInformations.length,
                      // );

                      let districtStats = {};
                      for (const code of CODED_COLUMNS) {
                        districtStats[code] = 0;
                      }
                      if (estateInformations.length > 0) {
                        table.push([
                          {
                            text: `Kod / Nama Daerah: ${stateDistrict.districtCode} / ${stateDistrict.districtName}`,
                            bold: true,
                            colSpan: CODED_COLUMNS.length + 1,
                          },
                          ...CODED_COLUMNS.map(code => code),
                        ]);
                      }

                      for (const info of estateInformations) {
                        const foundNonEmptyValue = CODED_COLUMNS.find(code => {
                          const foundValue = indexedValues.find({
                            estateInformationId: info._id,
                            code: code,
                          });

                          return foundValue && foundValue.value !== 0;
                        });
                        if (!foundNonEmptyValue) continue;

                        countEstateInformations += 1;

                        table.push([
                          {
                            text: ("0000" + info.estateId).slice(-5),
                            // bold: true,
                          },
                          ...CODED_COLUMNS.map(code => {
                            const foundValue = indexedValues.find({
                              estateInformationId: info._id,
                              code: code,
                            });

                            districtStats[code] += lodash.round(
                              (foundValue && foundValue.value) || 0,
                              2,
                            );

                            return {
                              text: lodash
                                .round((foundValue && foundValue.value) || 0, 2)
                                .toFixed(2),
                              // bold: true,
                              alignment: "right",
                            };
                          }),
                        ]);
                      }

                      if (estateInformations.length > 0) {
                        const districtWithValue = Object.keys(
                          districtStats,
                        ).find(key => !!districtStats[key]);
                        if (districtWithValue) {
                          table.push([
                            {
                              text: "Jumlah Daerah",
                              bold: true,
                            },
                            ...CODED_COLUMNS.map(code => {
                              stateStats[code] += lodash.round(
                                districtStats[code] || 0,
                                2,
                              );

                              return {
                                text: lodash
                                  .round(districtStats[code] || 0, 2)
                                  .toFixed(2),
                                bold: true,
                                alignment: "right",
                              };
                            }),
                          ]);
                        } else {
                          table.pop();
                        }
                      }
                    }

                    if (stateDistricts.length > 0) {
                      const stateWithValue = Object.keys(stateStats).find(
                        key => !!stateStats[key],
                      );
                      if (stateWithValue) {
                        table.push([
                          {
                            text: "Jumlah Negeri",
                            bold: true,
                          },
                          ...CODED_COLUMNS.map(code => {
                            allStats[code] += lodash.round(
                              stateStats[code] || 0,
                              2,
                            );
                            return {
                              text: lodash
                                .round(stateStats[code] || 0, 2)
                                .toFixed(2),
                              bold: true,
                              alignment: "right",
                            };
                          }),
                        ]);
                      } else {
                        table.pop();
                      }
                    }
                  }

                  table.push([
                    {
                      text: "Jumlah Negera",
                      bold: true,
                    },
                    ...CODED_COLUMNS.map(code => {
                      return {
                        text: lodash.round(allStats[code] || 0, 2).toFixed(2),
                        bold: true,
                        alignment: "right",
                      };
                    }),
                  ]);

                  return table;
                })(),
              ],
            },
          },
          {
            marginTop: 10,
            text: "Bilangan Estet: " + countEstateInformations,
          },
          // {
          //   marginTop: 4,
          //   text: "Bilangan Status Sah: " + countEstateInformations,
          // },
          // {
          //   marginTop: 4,
          //   text: "Bilangan Status Tidak Sah: " + 0,
          // },

          // {
          //   marginTop: 40,
          //   text: [
          //     `${params.toYear} ${params.fromMonth} ${params.toMonth}`,
          //     params.title,
          //   ].join("\n"),
          // },
          // {
          //   marginTop: -12,
          //   text: `Date: ${dayjs().locale("ms-my").format("DD MMMM YYYY")}`,
          //   alignment: "right",
          // },
        ],
      };
      return await createPdf({
        docDefinition,
        filename: `Estate Census Report - Profile Umur.pdf`,
        prefix: "",
        basePath: "/lkm",
      });
    },
    generateEstateCensusReportKeluasanPengeluaranHasil: async (
      self,
      params,
      context,
    ) => {
      // console.log("generateDomesticTradeExportImportReport", params);
      assertValidSession(context.activeSession);

      // ###########################################################################################
      // -------------------------------------------------------------------------------------------
      const allEstateCensusStateCodes = await context
        .collection("EstateCensusStateCodes")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allEstateCensusStateCodes", allEstateCensusStateCodes[0]);
      const indexedEstateCensusStateCodes = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["stateName"],
        },
      });
      indexedEstateCensusStateCodes.add(allEstateCensusStateCodes);
      // console.log(
      //   "allEstateCensusStateCodes",
      //   allEstateCensusStateCodes.length,
      // );

      const allEstateCensusStateDistricts = await context
        .collection("EstateCensusStateDistricts")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log(
      //   "allEstateCensusStateDistricts",
      //   allEstateCensusStateDistricts[0],
      // );
      const indexedEstateCensusStateDistricts = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["stateCode", "stateCodeId"],
        },
      });
      indexedEstateCensusStateDistricts.add(allEstateCensusStateDistricts);
      // console.log(
      //   "allEstateCensusStateDistricts",
      //   allEstateCensusStateDistricts.length,
      // );

      const allEstateInformations = await context
        .collection("EstateInformations")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allEstateInformations", allEstateInformations[0]);
      const indexedEstateInformations = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateState", "stateCode", "districtCode"],
        },
      });
      indexedEstateInformations.add(
        allEstateInformations.map(info => ({
          ...info,
          stateCode: String(parseInt(info.stateCode)),
          districtCode: String(parseInt(info.districtCode)),
        })),
      );
      // console.log("allEstateInformations", allEstateInformations.length);

      const CODED_COLUMNS = [
        "D03101",
        "D03201",
        "D03301",
        "D03401",
        "D03501",
        {
          text: "D03401/D03201",
          resolveValue: context => {
            const foundValueA = indexedValues.find({
              estateInformationId: context.info._id,
              code: "D03401",
            });
            const foundValueB = indexedValues.find({
              estateInformationId: context.info._id,
              code: "D03201",
            });

            return {
              value:
                foundValueA &&
                foundValueA.value !== 0 &&
                foundValueB &&
                foundValueB.value !== 0
                  ? lodash.round(foundValueA.value / foundValueB.value, 2)
                  : 0,
            };
          },
        },
      ];

      let query = {};
      if (params.year) {
        query.censusYear = params.year;
      }
      await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .createIndex({
          censusYear: 1,
          code: 1,
        });
      const allValues = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .find({
          ...query,
          code: {
            $in: [
              ...CODED_COLUMNS.map(code =>
                typeof code === "object" ? code.text : code,
              ),
            ],
          },
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allValues", allValues[0], allValues.length);
      // console.log({ allValues, query });
      const indexedValues = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateInformationId", "code"],
        },
      });
      indexedValues.add(allValues);

      await context.collection("EstateCensusYearLists").createIndex({
        year: 1,
        estateId: 1,
      });
      const allEstateCensusYearLists = await context
        .collection("EstateCensusYearLists")
        .find({
          year: parseInt(params.year),
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log(
      //   "allEstateCensusYearLists",
      //   // allEstateCensusYearLists[0],
      //   allEstateCensusYearLists.length,
      // );
      const indexedEstateCensusYearLists = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateId", "year"],
        },
      });
      indexedEstateCensusYearLists.add(allEstateCensusYearLists);

      // ###########################################################################################
      // ###########################################################################################

      let countEstateInformations = 0;

      const BASE_FONT_SIZE = 9;
      const docDefinition = {
        pageMargins: [20, 30, 20, 40],
        pageSize: "A4",
        pageOrientation: "portrait",
        // header:
        //   metadata.letter.useLetterHead === "Ya"
        //     ? renderHeader(
        //         companyInformation,
        //         // , [1]
        //       )
        //     : null,
        footer: (currentPage, pageCount) => [
          {
            text: "Tarik Cetak " + dayjs().format("DD/MM/YYYY"),
            alignment: "left",
            // lineHeight: 1,
            // marginTop: 4,
            marginBottom: 0,
            marginLeft: 20,
            fontSize: BASE_FONT_SIZE,
          },
          {
            text: "Page " + currentPage.toString() + " of " + pageCount,
            alignment: "left",
            // lineHeight: 1,
            // marginTop: 4,
            marginBottom: 8,
            marginLeft: 20,
            fontSize: BASE_FONT_SIZE,
          },
        ],
        defaultStyle: {
          fontSize: BASE_FONT_SIZE,
          // lineHeight: 1,
        },
        content: [
          {
            text: `Status Report 0301 - Keluasan, Pengeluaran, & Hasil`,
            // alignment: "center",
            bold: true,
            fontSize: BASE_FONT_SIZE + 3,
          },
          {
            text: `Tahun Banci ${params.year}`,
            alignment: "right",
            bold: true,
            fontSize: BASE_FONT_SIZE + 3,
            marginTop: -14,
          },
          {
            marginTop: 10,
            layout: {
              ...defaultTableLayout,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 3,
              paddingRight: () => 3,
            },
            table: {
              widths: [65, ...CODED_COLUMNS.map(code => 73)],
              body: [
                [
                  {
                    text: "EstId",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Jumlah Keluasan Cukup Umur\nD03101",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Purata Keluasan Yang Dipetik\nD03201",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Pengeluaran Biji Koko Basah (Estet Sendiri)\nKg\nD03301",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Pengeluaran Biji Koko Kering (Estet Sendiri)\nKg\nD03401",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Hasil Biji Koko Kering Sehektar\nKg\nD03501",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "D03401/D03201",
                    bold: true,
                    alignment: "center",
                  },
                ],
                ...(() => {
                  let table = [];

                  let allStats = {};
                  for (const code of CODED_COLUMNS) {
                    allStats[
                      (typeof code === "object" && code.text) || code
                    ] = 0;
                  }
                  for (const stateCode of allEstateCensusStateCodes) {
                    const stateDistricts =
                      indexedEstateCensusStateDistricts.where({
                        stateCode: stateCode.stateCode,
                        // stateCodeId: stateCode._id,
                      });
                    // console.log(
                    //   stateCode.stateCode,
                    //   stateCode.stateName,
                    //   stateDistricts.length,
                    // );

                    if (stateDistricts.length > 0) {
                      table.push([
                        {
                          text: `Kod / Nama Negeri: ${stateCode.stateCode} / ${stateCode.stateName}`,
                          // bold: true,
                          colSpan: CODED_COLUMNS.length + 1,
                        },
                        ...CODED_COLUMNS.map(code => code),
                      ]);
                    }

                    let stateStats = {};
                    for (const code of CODED_COLUMNS) {
                      stateStats[
                        (typeof code === "object" && code.text) || code
                      ] = 0;
                    }
                    for (const stateDistrict of stateDistricts) {
                      let estateInformations = indexedEstateInformations.where({
                        // stateCode: stateCode.stateCode,
                        // districtCode: stateDistrict.districtCode,
                        stateCode: String(parseInt(stateCode.stateCode)),
                        districtCode: String(
                          parseInt(stateDistrict.districtCode),
                        ),
                      });
                      estateInformations = estateInformations.filter(info => {
                        // --> find one value, check if exists
                        const foundValue = indexedValues.find({
                          // estateInformationId: info._id,
                          estateId: info.estateId,
                        });
                        return !!foundValue;

                        // --> filter by EstateCensusYearLists
                        // const foundYear = indexedEstateCensusYearLists.find({
                        //   estateId: info.estateId,
                        // });
                        // return !!foundYear;
                      });
                      // console.log(
                      //   stateDistrict.districtCode,
                      //   stateDistrict.districtName,
                      //   estateInformations.length,
                      // );

                      let districtStats = {};
                      for (const code of CODED_COLUMNS) {
                        districtStats[
                          (typeof code === "object" && code.text) || code
                        ] = 0;
                      }
                      if (estateInformations.length > 0) {
                        table.push([
                          {
                            text: `Kod / Nama Daerah: ${stateDistrict.districtCode} / ${stateDistrict.districtName}`,
                            bold: true,
                            colSpan: CODED_COLUMNS.length + 1,
                          },
                          ...CODED_COLUMNS.map(code => code),
                        ]);
                      }

                      for (const info of estateInformations) {
                        const foundNonEmptyValue = CODED_COLUMNS.find(code => {
                          const foundValue = indexedValues.find({
                            estateInformationId: info._id,
                            code: code,
                          });

                          return foundValue && foundValue.value !== 0;
                        });
                        if (!foundNonEmptyValue) continue;

                        countEstateInformations += 1;

                        table.push([
                          {
                            text: ("0000" + info.estateId).slice(-5),
                            // bold: true,
                          },
                          ...CODED_COLUMNS.map(code => {
                            const foundValue =
                              (typeof code === "object" &&
                                code.resolveValue &&
                                code.resolveValue({ info })) ||
                              indexedValues.find({
                                estateInformationId: info._id,
                                code: code,
                              });

                            districtStats[
                              (typeof code === "object" && code.text) || code
                            ] += lodash.round(
                              (foundValue && foundValue.value) || 0,
                              2,
                            );

                            return {
                              text: formatNumber(
                                lodash
                                  .round(
                                    (foundValue && foundValue.value) || 0,
                                    2,
                                  )
                                  .toFixed(2),
                                2,
                                ".",
                              ),
                              // bold: true,
                              alignment: "right",
                            };
                          }),
                        ]);
                      }

                      if (estateInformations.length > 0) {
                        const districtWithValue = Object.keys(
                          districtStats,
                        ).find(key => !!districtStats[key]);
                        if (districtWithValue) {
                          table.push([
                            {
                              text: "Jumlah Daerah",
                              bold: true,
                            },
                            ...CODED_COLUMNS.map(code => {
                              stateStats[
                                (typeof code === "object" && code.text) || code
                              ] += lodash.round(
                                districtStats[
                                  (typeof code === "object" && code.text) ||
                                    code
                                ] || 0,
                                2,
                              );

                              return {
                                text: formatNumber(
                                  lodash
                                    .round(
                                      districtStats[
                                        (typeof code === "object" &&
                                          code.text) ||
                                          code
                                      ] || 0,
                                      2,
                                    )
                                    .toFixed(2),
                                  2,
                                  ".",
                                ),
                                bold: true,
                                alignment: "right",
                              };
                            }),
                          ]);
                        } else {
                          table.pop();
                        }
                      }
                    }

                    if (stateDistricts.length > 0) {
                      const stateWithValue = Object.keys(stateStats).find(
                        key => !!stateStats[key],
                      );
                      if (stateWithValue) {
                        table.push([
                          {
                            text: "Jumlah Negeri",
                            bold: true,
                          },
                          ...CODED_COLUMNS.map(code => {
                            if (code.text && code.text === "D03401/D03201") {
                              const valueD03401 = stateStats["D03401"];
                              const valueD03201 = stateStats["D03201"];

                              let value = lodash
                                .round(valueD03401 / valueD03201, 2)
                                .toFixed(2);

                              return {
                                text: value,
                                bold: true,
                                alignment: "right",
                              };
                            } else {
                              allStats[
                                (typeof code === "object" && code.text) || code
                              ] += lodash.round(
                                stateStats[
                                  (typeof code === "object" && code.text) ||
                                    code
                                ] || 0,
                                2,
                              );

                              return {
                                text: lodash
                                  .round(
                                    stateStats[
                                      (typeof code === "object" && code.text) ||
                                        code
                                    ] || 0,
                                    2,
                                  )
                                  .toFixed(2),
                                bold: true,
                                alignment: "right",
                              };
                            }
                          }),
                        ]);
                      } else {
                        table.pop();
                      }
                    }
                  }

                  table.push([
                    {
                      text: "Jumlah Negara",
                      bold: true,
                    },
                    ...CODED_COLUMNS.map(code => {
                      return {
                        text: lodash
                          .round(
                            allStats[
                              (typeof code === "object" && code.text) || code
                            ] || 0,
                            2,
                          )
                          .toFixed(2),
                        bold: true,
                        alignment: "right",
                      };
                    }),
                  ]);

                  return table;
                })(),
              ],
            },
          },
          {
            marginTop: 10,
            text: "Bilangan Estet: " + countEstateInformations,
          },
          // {
          //   marginTop: 4,
          //   text: "Bilangan Status Sah: " + countEstateInformations,
          // },
          // {
          //   marginTop: 4,
          //   text: "Bilangan Status Tidak Sah: " + 0,
          // },

          // {
          //   marginTop: 40,
          //   text: [
          //     `${params.toYear} ${params.fromMonth} ${params.toMonth}`,
          //     params.title,
          //   ].join("\n"),
          // },
          // {
          //   marginTop: -12,
          //   text: `Date: ${dayjs().locale("ms-my").format("DD MMMM YYYY")}`,
          //   alignment: "right",
          // },
        ],
      };
      return await createPdf({
        docDefinition,
        filename: `Estate Census Report - Keluasan, Pengeluaran, dan Hasil.pdf`,
        prefix: "",
        basePath: "/lkm",
      });
    },

    generateEstateCensusReportPertambahanKeluasan01: async (
      self,
      params,
      context,
    ) => {
      // console.log("generateDomesticTradeExportImportReport", params);
      assertValidSession(context.activeSession);

      // ###########################################################################################
      // -------------------------------------------------------------------------------------------
      const allEstateCensusStateCodes = await context
        .collection("EstateCensusStateCodes")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allEstateCensusStateCodes", allEstateCensusStateCodes[0]);
      const indexedEstateCensusStateCodes = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["stateName"],
        },
      });
      indexedEstateCensusStateCodes.add(allEstateCensusStateCodes);
      // console.log(
      //   "allEstateCensusStateCodes",
      //   allEstateCensusStateCodes.length,
      // );

      const allEstateCensusStateDistricts = await context
        .collection("EstateCensusStateDistricts")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .sort({
          districtCode: -1,
        })
        .toArray();
      // console.log(
      //   "allEstateCensusStateDistricts",
      //   allEstateCensusStateDistricts[0],
      // );
      const indexedEstateCensusStateDistricts = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["stateCode", "stateCodeId"],
        },
      });
      indexedEstateCensusStateDistricts.add(allEstateCensusStateDistricts);
      // console.log(
      //   "allEstateCensusStateDistricts",
      //   allEstateCensusStateDistricts.length,
      // );

      const allEstateInformations = await context
        .collection("EstateInformations")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allEstateInformations", allEstateInformations[0]);
      const indexedEstateInformations = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateState", "stateCode", "districtCode"],
        },
      });
      indexedEstateInformations.add(
        allEstateInformations.map(info => ({
          ...info,
          stateCode: String(parseInt(info.stateCode)),
          districtCode: String(parseInt(info.districtCode)),
        })),
      );
      // console.log("allEstateInformations", allEstateInformations.length);

      const CODED_ROWS = [
        { text: "Tunggal", code: "01" },
        { text: "Selingan Kelapa", code: "02" },
        { text: "Selingan Kelapa Sawit", code: "03" },
        { text: "Selingan Lain - lain", code: "04" },
        { text: "Jumlah", code: "05" },
      ];
      const CODED_COLUMNS = [
        {
          text: "A001",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              // estateInformationId: context.info._id,
              estateId: context.info.estateId,
              code: "A001" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A002",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              // estateInformationId: context.info._id,
              estateId: context.info.estateId,
              code: "A002" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A003",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              // estateInformationId: context.info._id,
              estateId: context.info.estateId,
              code: "A003" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A004",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              // estateInformationId: context.info._id,
              estateId: context.info.estateId,
              code: "A004" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A005",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              // estateInformationId: context.info._id,
              estateId: context.info.estateId,
              code: "A005" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A006",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              // estateInformationId: context.info._id,
              estateId: context.info.estateId,
              code: "A006" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A007",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              // estateInformationId: context.info._id,
              estateId: context.info.estateId,
              code: "A007" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A008",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              // estateInformationId: context.info._id,
              estateId: context.info.estateId,
              code: "A008" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A008a",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              // estateInformationId: context.info._id,
              estateId: context.info.estateId,
              code: "A008a" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
      ];

      let query = {};
      if (params.year) {
        query.censusYear = params.year;
      }
      await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .createIndex({
          censusYear: 1,
          code: 1,
        });
      const allValues = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .find({
          ...query,
          // code: {
          //   $in: [
          //     ...CODED_COLUMNS.map(code =>
          //       typeof code === "object" ? code.text : code,
          //     ),
          //   ],
          // },
          $or: CODED_COLUMNS.map(item => {
            const code = typeof item === "object" ? item.text : item;
            return {
              code: {
                $regex: "^" + code,
                $options: "im",
              },
            };
          }),
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allValues", allValues.length);
      const indexedValues = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateInformationId", "code", "estateId"],
        },
      });
      indexedValues.add(allValues);

      await context.collection("EstateCensusYearLists").createIndex({
        year: 1,
        estateId: 1,
      });
      const allEstateCensusYearLists = await context
        .collection("EstateCensusYearLists")
        .find({
          year: parseInt(params.year),
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log(
      //   "allEstateCensusYearLists",
      //   // allEstateCensusYearLists[0],
      //   allEstateCensusYearLists.length,
      // );
      const indexedEstateCensusYearLists = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateId", "year"],
        },
      });
      indexedEstateCensusYearLists.add(allEstateCensusYearLists);

      // ###########################################################################################
      // ###########################################################################################

      let countEstateInformations = 0;

      const BASE_FONT_SIZE = 9;
      const docDefinition = {
        pageMargins: [20, 30, 20, 45],
        pageSize: "A4",
        // pageOrientation: "portrait",
        pageOrientation: "landscape",
        // header:
        //   metadata.letter.useLetterHead === "Ya"
        //     ? renderHeader(
        //         companyInformation,
        //         // , [1]
        //       )
        //     : null,
        footer: (currentPage, pageCount) => [
          {
            text: "Tarik Cetak " + dayjs().format("DD/MM/YYYY"),
            alignment: "left",
            // lineHeight: 1,
            // marginTop: 4,
            marginBottom: 0,
            marginLeft: 20,
            fontSize: BASE_FONT_SIZE,
          },
          {
            text: "Page " + currentPage.toString() + " of " + pageCount,
            alignment: "left",
            // lineHeight: 1,
            // marginTop: 4,
            marginBottom: 8,
            marginLeft: 20,
            fontSize: BASE_FONT_SIZE,
          },
        ],
        defaultStyle: {
          fontSize: BASE_FONT_SIZE,
          // lineHeight: 1,
        },
        content: [
          {
            text: `Status Report 0401 - Pertambahan Keluasan 01`,
            // alignment: "center",
            bold: true,
            fontSize: BASE_FONT_SIZE + 3,
          },
          {
            text: `Tahun Banci ${params.year}`,
            alignment: "right",
            bold: true,
            fontSize: BASE_FONT_SIZE + 3,
            marginTop: -14,
          },
          {
            marginTop: 10,
            layout: {
              ...defaultTableLayout,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 3,
              paddingRight: () => 3,
            },
            table: {
              widths: [50, 15, ...CODED_COLUMNS.map(code => 73)],
              body: [
                [
                  {
                    text: "Tanaman Cukup Umur",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                    colSpan: 2,
                  },
                  "",
                  {
                    text: "Luas Hektar Dilapor Pada Tahun Sebelum Tahun Banci\nA001",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                  {
                    text: "Pertambahan dalam luas hektar sepanjang tahun",
                    bold: true,
                    alignment: "center",
                    colSpan: 6,
                  },
                  "",
                  "",
                  "",
                  "",
                  "",
                  {
                    text: "Jumlah Pertambahan\nA008",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                  {
                    text: "Jumlah Keseluruhan Luas Hektar\nA008a",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                ],
                [
                  "",
                  "",
                  "",
                  {
                    text: "Keluasan cukup umur\nA002",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Keluasan penanaman umur\nA003",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Keluasan penanaman semula\nA004",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Keluasan ditebang tetapi belum ditanam dengan tanaman lain\nA005",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Keluasan dibeli atau digabung\nA006",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Pelarasan kerja ukur, pembetulan, terbiar dan lain-lain\nA007",
                    bold: true,
                    alignment: "center",
                  },
                  "",
                  "",
                ],
                ...(() => {
                  let table = [];

                  let allStats = {};
                  for (const code of CODED_COLUMNS) {
                    allStats[
                      (typeof code === "object" && code.text) || code
                    ] = 0;
                  }
                  for (const stateCode of allEstateCensusStateCodes) {
                    const stateDistricts =
                      indexedEstateCensusStateDistricts.where({
                        stateCode: stateCode.stateCode,
                        // stateCodeId: stateCode._id,
                      });
                    // console.log(
                    //   stateCode.stateCode,
                    //   stateCode.stateName,
                    //   stateDistricts.length,
                    // );

                    if (stateDistricts.length > 0) {
                      table.push([
                        {
                          text: `Kod / Nama Negeri: ${stateCode.stateCode} / ${stateCode.stateName}`,
                          // bold: true,
                          colSpan: CODED_COLUMNS.length + 2,
                        },
                        "",
                        ...CODED_COLUMNS.map(code => code),
                      ]);
                    }

                    let stateStats = {};
                    for (const code of CODED_COLUMNS) {
                      stateStats[
                        (typeof code === "object" && code.text) || code
                      ] = 0;
                    }
                    for (const stateDistrict of stateDistricts) {
                      let estateInformations = indexedEstateInformations.where({
                        // stateCode: stateCode.stateCode,
                        // districtCode: stateDistrict.districtCode,
                        stateCode: String(parseInt(stateCode.stateCode)),
                        districtCode: String(
                          parseInt(stateDistrict.districtCode),
                        ),
                      });
                      estateInformations = estateInformations.filter(info => {
                        // --> find one value, check if exists
                        const foundValue = indexedValues.find({
                          // estateInformationId: info._id,
                          estateId: info.estateId,
                        });
                        return !!foundValue;

                        // --> filter by EstateCensusYearLists
                        // const foundYear = indexedEstateCensusYearLists.find({
                        //   estateId: info.estateId,
                        // });
                        // return !!foundYear;
                      });

                      let districtStats = {};
                      for (const code of CODED_COLUMNS) {
                        districtStats[
                          (typeof code === "object" && code.text) || code
                        ] = 0;
                      }
                      if (estateInformations.length > 0) {
                        table.push([
                          {
                            text: `Kod / Nama Daerah: ${stateDistrict.districtCode} / ${stateDistrict.districtName}`,
                            bold: true,
                            colSpan: CODED_COLUMNS.length + 2,
                          },
                          "",
                          ...CODED_COLUMNS.map(code => code),
                        ]);
                      }

                      for (const info of estateInformations) {
                        const foundNonEmptyValue = CODED_COLUMNS.find(code => {
                          const foundValue = indexedValues.find({
                            estateInformationId: info._id,
                            // code: code,
                          });

                          return foundValue && foundValue.value !== 0;
                        });
                        if (!foundNonEmptyValue) continue;

                        countEstateInformations += 1;

                        table.push([
                          {
                            text:
                              "EST ID: " + ("0000" + info.estateId).slice(-5),
                            bold: true,
                            colSpan: CODED_COLUMNS.length + 2,
                            fontSize: BASE_FONT_SIZE - 1,
                          },
                          "",
                          ...CODED_COLUMNS.map(code => {
                            return "";
                          }),
                        ]);
                        for (const row of CODED_ROWS) {
                          table.push([
                            {
                              text: row.text,
                              // bold: true,
                              fontSize: BASE_FONT_SIZE - 1,
                              border: [true, false, true, false],
                            },
                            {
                              text: row.code,
                              // bold: true,
                              fontSize: BASE_FONT_SIZE - 1,
                              alignment: "center",
                              border: [true, false, true, false],
                            },
                            ...CODED_COLUMNS.map(code => {
                              const foundValue =
                                (typeof code === "object" &&
                                  code.resolveValue &&
                                  code.resolveValue({
                                    info,
                                    rowCode: row.code,
                                  })) ||
                                indexedValues.find({
                                  estateInformationId: info._id,
                                  code: code,
                                });

                              if (
                                row.text.toUpperCase().indexOf("JUMLAH") >= 0
                              ) {
                                // do nothing
                                districtStats[
                                  (typeof code === "object" && code.text) ||
                                    code
                                ] += lodash.round(
                                  (foundValue && foundValue.value) || 0,
                                  2,
                                );
                              } else {
                              }

                              return {
                                text: lodash
                                  .round(
                                    (foundValue && foundValue.value) || 0,
                                    2,
                                  )
                                  .toFixed(2),
                                // bold: true,
                                alignment: "right",
                                fontSize: BASE_FONT_SIZE - 1,
                                border:
                                  row.text.indexOf("Jumlah") >= 0
                                    ? [true, true, true, true]
                                    : [true, false, true, false],
                              };
                            }),
                          ]);
                        }
                      }

                      if (estateInformations.length > 0) {
                        const districtWithValue = Object.keys(
                          districtStats,
                        ).find(key => !!districtStats[key]);
                        if (districtWithValue) {
                          table.push([
                            {
                              text: "Jumlah Daerah",
                              bold: true,
                              colSpan: 2,
                            },
                            "",
                            ...CODED_COLUMNS.map(code => {
                              stateStats[
                                (typeof code === "object" && code.text) || code
                              ] += lodash.round(
                                districtStats[
                                  (typeof code === "object" && code.text) ||
                                    code
                                ] || 0,
                                2,
                              );

                              return {
                                text: lodash
                                  .round(
                                    districtStats[
                                      (typeof code === "object" && code.text) ||
                                        code
                                    ] || 0,
                                    2,
                                  )
                                  .toFixed(2),
                                bold: true,
                                alignment: "right",
                              };
                            }),
                          ]);
                        } else {
                          table.pop();
                        }
                      }
                    }

                    if (stateDistricts.length > 0) {
                      const stateWithValue = Object.keys(stateStats).find(
                        key => !!stateStats[key],
                      );
                      if (stateWithValue) {
                        table.push([
                          {
                            text: "Jumlah Negeri",
                            bold: true,
                            colSpan: 2,
                          },
                          "",
                          ...CODED_COLUMNS.map(code => {
                            allStats[
                              (typeof code === "object" && code.text) || code
                            ] += lodash.round(
                              stateStats[
                                (typeof code === "object" && code.text) || code
                              ] || 0,
                              2,
                            );

                            return {
                              text: lodash
                                .round(
                                  stateStats[
                                    (typeof code === "object" && code.text) ||
                                      code
                                  ] || 0,
                                  2,
                                )
                                .toFixed(2),
                              bold: true,
                              alignment: "right",
                            };
                          }),
                        ]);
                      } else {
                        table.pop();
                      }
                    }
                  }

                  table.push([
                    {
                      text: "Jumlah Negera",
                      bold: true,
                      colSpan: 2,
                    },
                    "",
                    ...CODED_COLUMNS.map(code => {
                      return {
                        text: lodash
                          .round(
                            allStats[
                              (typeof code === "object" && code.text) || code
                            ] || 0,
                            2,
                          )
                          .toFixed(2),
                        bold: true,
                        alignment: "right",
                      };
                    }),
                  ]);

                  return table;
                })(),
              ],
            },
          },
          {
            marginTop: 10,
            text: "Bilangan Estet: " + countEstateInformations,
          },
          // {
          //   marginTop: 4,
          //   text: "Bilangan Status Sah: " + countEstateInformations,
          // },
          // {
          //   marginTop: 4,
          //   text: "Bilangan Status Tidak Sah: " + 0,
          // },

          // {
          //   marginTop: 40,
          //   text: [
          //     `${params.toYear} ${params.fromMonth} ${params.toMonth}`,
          //     params.title,
          //   ].join("\n"),
          // },
          // {
          //   marginTop: -12,
          //   text: `Date: ${dayjs().locale("ms-my").format("DD MMMM YYYY")}`,
          //   alignment: "right",
          // },
        ],
      };
      return await createPdf({
        docDefinition,
        filename: `Estate Census Report - Pertambahan Keluasan 01.pdf`,
        prefix: "",
        basePath: "/lkm",
      });
    },
    generateEstateCensusReportPertambahanKeluasan02: async (
      self,
      params,
      context,
    ) => {
      // console.log("generateDomesticTradeExportImportReport", params);
      assertValidSession(context.activeSession);

      // ###########################################################################################
      // -------------------------------------------------------------------------------------------
      const allEstateCensusStateCodes = await context
        .collection("EstateCensusStateCodes")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allEstateCensusStateCodes", allEstateCensusStateCodes[0]);
      const indexedEstateCensusStateCodes = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["stateName"],
        },
      });
      indexedEstateCensusStateCodes.add(allEstateCensusStateCodes);
      // console.log(
      //   "allEstateCensusStateCodes",
      //   allEstateCensusStateCodes.length,
      // );

      const allEstateCensusStateDistricts = await context
        .collection("EstateCensusStateDistricts")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log(
      //   "allEstateCensusStateDistricts",
      //   allEstateCensusStateDistricts[0],
      // );
      const indexedEstateCensusStateDistricts = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["stateCode", "stateCodeId"],
        },
      });
      indexedEstateCensusStateDistricts.add(allEstateCensusStateDistricts);
      // console.log(
      //   "allEstateCensusStateDistricts",
      //   allEstateCensusStateDistricts.length,
      // );

      const allEstateInformations = await context
        .collection("EstateInformations")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allEstateInformations", allEstateInformations[0]);
      const indexedEstateInformations = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateState", "stateCode", "districtCode"],
        },
      });
      indexedEstateInformations.add(
        allEstateInformations.map(info => ({
          ...info,
          stateCode: String(parseInt(info.stateCode)),
          districtCode: String(parseInt(info.districtCode)),
        })),
      );
      // console.log("allEstateInformations", allEstateInformations.length);

      const CODED_ROWS = [
        { text: "Tunggal", code: "06" },
        { text: "Selingan Kelapa", code: "07" },
        { text: "Selingan Kelapa Sawit", code: "08" },
        { text: "Selingan Lain - lain", code: "09" },
        { text: "Jumlah", code: "10" },
        { text: "Jumlah Luas Koko", code: "11" },
      ];
      const CODED_COLUMNS = [
        {
          text: "A001",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A001" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A002",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A002" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A003",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A003" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A004",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A004" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A005",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A005" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A006",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A006" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A007",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A007" + context.rowCode,
            });
            // console.log(context.rowCode, "A007" + context.rowCode, foundValue);
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A008",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A008" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A008a",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A008a" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
      ];

      let query = {};
      if (params.year) {
        query.censusYear = params.year;
      }
      await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .createIndex({
          censusYear: 1,
          code: 1,
        });
      const allValues = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .find({
          ...query,
          // code: {
          //   $in: [
          //     ...CODED_COLUMNS.map(code =>
          //       typeof code === "object" ? code.text : code,
          //     ),
          //   ],
          // },
          $or: CODED_COLUMNS.map(item => {
            const code = typeof item === "object" ? item.text : item;
            return {
              code: {
                $regex: "^" + code,
                $options: "im",
              },
            };
          }),
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allValues", allValues.length);
      const indexedValues = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateInformationId", "code"],
        },
      });
      indexedValues.add(allValues);

      await context.collection("EstateCensusYearLists").createIndex({
        year: 1,
        estateId: 1,
      });
      const allEstateCensusYearLists = await context
        .collection("EstateCensusYearLists")
        .find({
          year: parseInt(params.year),
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log(
      //   "allEstateCensusYearLists",
      //   // allEstateCensusYearLists[0],
      //   allEstateCensusYearLists.length,
      // );
      const indexedEstateCensusYearLists = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateId", "year"],
        },
      });
      indexedEstateCensusYearLists.add(allEstateCensusYearLists);

      // ###########################################################################################
      // ###########################################################################################

      let countEstateInformations = 0;

      const BASE_FONT_SIZE = 9;
      const docDefinition = {
        pageMargins: [20, 30, 20, 45],
        pageSize: "A4",
        // pageOrientation: "portrait",
        pageOrientation: "landscape",
        // header:
        //   metadata.letter.useLetterHead === "Ya"
        //     ? renderHeader(
        //         companyInformation,
        //         // , [1]
        //       )
        //     : null,
        footer: (currentPage, pageCount) => [
          {
            text: "Tarik Cetak " + dayjs().format("DD/MM/YYYY"),
            alignment: "left",
            // lineHeight: 1,
            // marginTop: 4,
            marginBottom: 0,
            marginLeft: 20,
            fontSize: BASE_FONT_SIZE,
          },
          {
            text: "Page " + currentPage.toString() + " of " + pageCount,
            alignment: "left",
            // lineHeight: 1,
            // marginTop: 4,
            marginBottom: 8,
            marginLeft: 20,
            fontSize: BASE_FONT_SIZE,
          },
        ],
        defaultStyle: {
          fontSize: BASE_FONT_SIZE,
          // lineHeight: 1,
        },
        content: [
          {
            text: `Status Report 0402 - Pertambahan Keluasan 02`,
            // alignment: "center",
            bold: true,
            fontSize: BASE_FONT_SIZE + 3,
          },
          {
            text: `Tahun Banci ${params.year}`,
            alignment: "right",
            bold: true,
            fontSize: BASE_FONT_SIZE + 3,
            marginTop: -14,
          },
          {
            marginTop: 10,
            layout: {
              ...defaultTableLayout,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 3,
              paddingRight: () => 3,
            },
            table: {
              widths: [50, 15, ...CODED_COLUMNS.map(code => 73)],
              body: [
                [
                  {
                    text: "Tanaman Cukup Umur",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                    colSpan: 2,
                  },
                  "",
                  {
                    text: "Luas Hektar Dilapor Pada Tahun Sebelum Tahun Banci\nA001",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                  {
                    text: "Pertambahan dalam luas hektar sepanjang tahun",
                    bold: true,
                    alignment: "center",
                    colSpan: 6,
                  },
                  "",
                  "",
                  "",
                  "",
                  "",
                  {
                    text: "Jumlah Pertambahan\nA008",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                  {
                    text: "Jumlah Keseluruhan Luas Hektar\nA008a",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                ],
                [
                  "",
                  "",
                  "",
                  {
                    text: "Keluasan cukup umur\nA002",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Keluasan penanaman umur\nA003",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Keluasan penanaman semula\nA004",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Keluasan ditebang tetapi belum ditanam dengan tanaman lain\nA005",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Keluasan dibeli atau digabung\nA006",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Pelarasan kerja ukur, pembetulan, terbiar dan lain-lain\nA007",
                    bold: true,
                    alignment: "center",
                  },
                  "",
                  "",
                ],
                ...(() => {
                  let table = [];

                  let allStats = {};
                  for (const code of CODED_COLUMNS) {
                    allStats[
                      (typeof code === "object" && code.text) || code
                    ] = 0;
                  }
                  for (const stateCode of allEstateCensusStateCodes) {
                    const stateDistricts =
                      indexedEstateCensusStateDistricts.where({
                        stateCode: stateCode.stateCode,
                        // stateCodeId: stateCode._id,
                      });
                    // console.log(
                    //   stateCode.stateCode,
                    //   stateCode.stateName,
                    //   stateDistricts.length,
                    // );

                    if (stateDistricts.length > 0) {
                      table.push([
                        {
                          text: `Kod / Nama Negeri: ${stateCode.stateCode} / ${stateCode.stateName}`,
                          // bold: true,
                          colSpan: CODED_COLUMNS.length + 2,
                        },
                        "",
                        ...CODED_COLUMNS.map(code => code),
                      ]);
                    }

                    let stateStats = {};
                    for (const code of CODED_COLUMNS) {
                      stateStats[
                        (typeof code === "object" && code.text) || code
                      ] = 0;
                    }
                    for (const stateDistrict of stateDistricts) {
                      let estateInformations = indexedEstateInformations.where({
                        // stateCode: stateCode.stateCode,
                        // districtCode: stateDistrict.districtCode,
                        stateCode: String(parseInt(stateCode.stateCode)),
                        districtCode: String(
                          parseInt(stateDistrict.districtCode),
                        ),
                      });
                      estateInformations = estateInformations.filter(info => {
                        // --> find one value, check if exists
                        const foundValue = indexedValues.find({
                          estateInformationId: info._id,
                        });
                        return !!foundValue;

                        // --> filter by EstateCensusYearLists
                        // const foundYear = indexedEstateCensusYearLists.find({
                        //   estateId: info.estateId,
                        // });
                        // return !!foundYear;
                      });

                      let districtStats = {};
                      for (const code of CODED_COLUMNS) {
                        districtStats[
                          (typeof code === "object" && code.text) || code
                        ] = 0;
                      }
                      if (estateInformations.length > 0) {
                        // console.log(
                        //   stateDistrict.districtName,
                        //   estateInformations.length,
                        // );
                        table.push([
                          {
                            text: `Kod / Nama Daerah: ${stateDistrict.districtCode} / ${stateDistrict.districtName}`,
                            bold: true,
                            colSpan: CODED_COLUMNS.length + 2,
                          },
                          "",
                          ...CODED_COLUMNS.map(code => code),
                        ]);
                      }

                      for (const info of estateInformations) {
                        const foundNonEmptyValue = CODED_COLUMNS.find(code => {
                          const foundValue = indexedValues.find({
                            estateInformationId: info._id,
                            // code: code,
                          });

                          return foundValue && foundValue.value !== 0;
                        });
                        if (!foundNonEmptyValue) continue;

                        // console.log(
                        //   info.estateId,
                        //   info._id,
                        //   info.stateCode,
                        //   info.districtCode,
                        //   "vs",
                        //   stateCode.stateCode,
                        //   stateDistrict.districtCode,
                        // );

                        countEstateInformations += 1;

                        table.push([
                          {
                            text:
                              "EST ID: " + ("0000" + info.estateId).slice(-5),
                            bold: true,
                            colSpan: CODED_COLUMNS.length + 2,
                            fontSize: BASE_FONT_SIZE - 1,
                          },
                          "",
                          ...CODED_COLUMNS.map(code => {
                            return "";
                          }),
                        ]);
                        for (const row of CODED_ROWS) {
                          table.push([
                            {
                              text: row.text,
                              // bold: true,
                              fontSize: BASE_FONT_SIZE - 1,
                              border: [true, false, true, false],
                            },
                            {
                              text: row.code,
                              // bold: true,
                              fontSize: BASE_FONT_SIZE - 1,
                              alignment: "center",
                              border: [true, false, true, false],
                            },
                            ...CODED_COLUMNS.map(code => {
                              const foundValue =
                                (typeof code === "object" &&
                                  code.resolveValue &&
                                  code.resolveValue({
                                    info,
                                    rowCode: row.code,
                                  })) ||
                                indexedValues.find({
                                  estateInformationId: info._id,
                                  code: code,
                                });

                              if (
                                row.text
                                  .toUpperCase()
                                  .indexOf("JUMLAH LUAS KOKO") >= 0
                              ) {
                                // do nothing
                                districtStats[
                                  (typeof code === "object" && code.text) ||
                                    code
                                ] += lodash.round(
                                  (foundValue && foundValue.value) || 0,
                                  2,
                                );
                              } else {
                              }

                              return {
                                text: lodash
                                  .round(
                                    (foundValue && foundValue.value) || 0,
                                    2,
                                  )
                                  .toFixed(2),
                                // bold: true,
                                alignment: "right",
                                fontSize: BASE_FONT_SIZE - 1,
                                border:
                                  row.text.toUpperCase().indexOf("JUMLAH") >= 0
                                    ? [true, true, true, true]
                                    : [true, false, true, false],
                              };
                            }),
                          ]);
                        }
                      }

                      if (estateInformations.length > 0) {
                        const districtWithValue = Object.keys(
                          districtStats,
                        ).find(key => !!districtStats[key]);
                        if (districtWithValue) {
                          table.push([
                            {
                              text: "Jumlah Daerah",
                              bold: true,
                              colSpan: 2,
                            },
                            "",
                            ...CODED_COLUMNS.map(code => {
                              stateStats[
                                (typeof code === "object" && code.text) || code
                              ] += lodash.round(
                                districtStats[
                                  (typeof code === "object" && code.text) ||
                                    code
                                ] || 0,
                                2,
                              );

                              return {
                                text: lodash
                                  .round(
                                    districtStats[
                                      (typeof code === "object" && code.text) ||
                                        code
                                    ] || 0,
                                    2,
                                  )
                                  .toFixed(2),
                                bold: true,
                                alignment: "right",
                              };
                            }),
                          ]);
                        } else {
                          table.pop();
                        }
                      }
                    }

                    if (stateDistricts.length > 0) {
                      const stateWithValue = Object.keys(stateStats).find(
                        key => !!stateStats[key],
                      );
                      if (stateWithValue) {
                        table.push([
                          {
                            text: "Jumlah Negeri",
                            bold: true,
                            colSpan: 2,
                          },
                          "",
                          ...CODED_COLUMNS.map(code => {
                            allStats[
                              (typeof code === "object" && code.text) || code
                            ] += lodash.round(
                              stateStats[
                                (typeof code === "object" && code.text) || code
                              ] || 0,
                              2,
                            );

                            return {
                              text: lodash
                                .round(
                                  stateStats[
                                    (typeof code === "object" && code.text) ||
                                      code
                                  ] || 0,
                                  2,
                                )
                                .toFixed(2),
                              bold: true,
                              alignment: "right",
                            };
                          }),
                        ]);
                        // console.log(
                        //   stateCode.stateCode,
                        //   stateCode.stateName,
                        //   stateStats,
                        // );
                      } else {
                        table.pop();
                      }
                    }
                  }

                  table.push([
                    {
                      text: "Jumlah Negera",
                      bold: true,
                      colSpan: 2,
                    },
                    "",
                    ...CODED_COLUMNS.map(code => {
                      return {
                        text: lodash
                          .round(
                            allStats[
                              (typeof code === "object" && code.text) || code
                            ] || 0,
                            2,
                          )
                          .toFixed(2),
                        bold: true,
                        alignment: "right",
                      };
                    }),
                  ]);

                  return table;
                })(),
              ],
            },
          },
          {
            marginTop: 10,
            text: "Bilangan Estet: " + countEstateInformations,
          },
          // {
          //   marginTop: 4,
          //   text: "Bilangan Status Sah: " + countEstateInformations,
          // },
          // {
          //   marginTop: 4,
          //   text: "Bilangan Status Tidak Sah: " + 0,
          // },

          // {
          //   marginTop: 40,
          //   text: [
          //     `${params.toYear} ${params.fromMonth} ${params.toMonth}`,
          //     params.title,
          //   ].join("\n"),
          // },
          // {
          //   marginTop: -12,
          //   text: `Date: ${dayjs().locale("ms-my").format("DD MMMM YYYY")}`,
          //   alignment: "right",
          // },
        ],
      };
      return await createPdf({
        docDefinition,
        filename: `Estate Census Report - Pertambahan Keluasan 02.pdf`,
        prefix: "",
        basePath: "/lkm",
      });
    },
    generateEstateCensusReportPertambahanKeluasan03: async (
      self,
      params,
      context,
    ) => {
      // console.log("generateDomesticTradeExportImportReport", params);
      assertValidSession(context.activeSession);

      // ###########################################################################################
      // -------------------------------------------------------------------------------------------
      const allEstateCensusStateCodes = await context
        .collection("EstateCensusStateCodes")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allEstateCensusStateCodes", allEstateCensusStateCodes[0]);
      const indexedEstateCensusStateCodes = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["stateName"],
        },
      });
      indexedEstateCensusStateCodes.add(allEstateCensusStateCodes);
      // console.log(
      //   "allEstateCensusStateCodes",
      //   allEstateCensusStateCodes.length,
      // );

      const allEstateCensusStateDistricts = await context
        .collection("EstateCensusStateDistricts")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log(
      //   "allEstateCensusStateDistricts",
      //   allEstateCensusStateDistricts[0],
      // );
      const indexedEstateCensusStateDistricts = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["stateCode", "stateCodeId"],
        },
      });
      indexedEstateCensusStateDistricts.add(allEstateCensusStateDistricts);
      // console.log(
      //   "allEstateCensusStateDistricts",
      //   allEstateCensusStateDistricts.length,
      // );

      const allEstateInformations = await context
        .collection("EstateInformations")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allEstateInformations", allEstateInformations[0]);
      const indexedEstateInformations = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateState", "stateCode", "districtCode"],
        },
      });
      indexedEstateInformations.add(
        allEstateInformations.map(info => ({
          ...info,
          stateCode: String(parseInt(info.stateCode)),
          districtCode: String(parseInt(info.districtCode)),
        })),
      );
      // console.log("allEstateInformations", allEstateInformations.length);

      const CODED_ROWS = [
        { text: "Getah", code: "12" },
        { text: "Kelapa Sawit", code: "13" },
        { text: "Teh", code: "14" },
        { text: "Kelapa", code: "15" },
        { text: "Lain-lain", code: "15" },
        { text: "Jumlah", code: "17" },
      ];

      const CODED_COLUMNS = [
        {
          text: "A001",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A001" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A002",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A002" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A003",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A003" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A004",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A004" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A005",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A005" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A006",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A006" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A007",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A007" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A008",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A008" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
        {
          text: "A008a",
          resolveValue: context => {
            const foundValue = indexedValues.find({
              estateInformationId: context.info._id,
              code: "A008a" + context.rowCode,
            });
            return {
              ...foundValue,
            };
          },
        },
      ];

      let query = {};
      if (params.year) {
        query.censusYear = params.year;
      }
      await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .createIndex({
          censusYear: 1,
          code: 1,
        });
      const allValues = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .find({
          ...query,
          // code: {
          //   $in: [
          //     ...CODED_COLUMNS.map(code =>
          //       typeof code === "object" ? code.text : code,
          //     ),
          //   ],
          // },
          $or: CODED_COLUMNS.map(item => {
            const code = typeof item === "object" ? item.text : item;
            return {
              code: {
                $regex: "^" + code,
                $options: "im",
              },
            };
          }),
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allValues", allValues.length);
      const indexedValues = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateInformationId", "code", "estateId"],
        },
      });
      indexedValues.add(allValues);

      await context.collection("EstateCensusYearLists").createIndex({
        year: 1,
        estateId: 1,
      });
      const allEstateCensusYearLists = await context
        .collection("EstateCensusYearLists")
        .find({
          year: parseInt(params.year),
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log(
      //   "allEstateCensusYearLists",
      //   // allEstateCensusYearLists[0],
      //   allEstateCensusYearLists.length,
      // );
      const indexedEstateCensusYearLists = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateId", "year"],
        },
      });
      indexedEstateCensusYearLists.add(allEstateCensusYearLists);

      // ###########################################################################################
      // ###########################################################################################

      let countEstateInformations = 0;

      const BASE_FONT_SIZE = 9;
      const docDefinition = {
        pageMargins: [20, 30, 20, 45],
        pageSize: "A4",
        // pageOrientation: "portrait",
        pageOrientation: "landscape",
        // header:
        //   metadata.letter.useLetterHead === "Ya"
        //     ? renderHeader(
        //         companyInformation,
        //         // , [1]
        //       )
        //     : null,
        footer: (currentPage, pageCount) => [
          {
            text: "Tarik Cetak " + dayjs().format("DD/MM/YYYY"),
            alignment: "left",
            // lineHeight: 1,
            // marginTop: 4,
            marginBottom: 0,
            marginLeft: 20,
            fontSize: BASE_FONT_SIZE,
          },
          {
            text: "Page " + currentPage.toString() + " of " + pageCount,
            alignment: "left",
            // lineHeight: 1,
            // marginTop: 4,
            marginBottom: 8,
            marginLeft: 20,
            fontSize: BASE_FONT_SIZE,
          },
        ],
        defaultStyle: {
          fontSize: BASE_FONT_SIZE,
          // lineHeight: 1,
        },
        content: [
          {
            text: `Status Report 0403 - Pertambahan Keluasan 03`,
            // alignment: "center",
            bold: true,
            fontSize: BASE_FONT_SIZE + 3,
          },
          {
            text: `Tahun Banci ${params.year}`,
            alignment: "right",
            bold: true,
            fontSize: BASE_FONT_SIZE + 3,
            marginTop: -14,
          },
          {
            marginTop: 10,
            layout: {
              ...defaultTableLayout,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 3,
              paddingRight: () => 3,
            },
            table: {
              widths: [50, 15, ...CODED_COLUMNS.map(code => 73)],
              body: [
                [
                  {
                    text: "Tanaman Cukup Umur",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                    colSpan: 2,
                  },
                  "",
                  {
                    text: "Luas Hektar Dilapor Pada Tahun Sebelum Tahun Banci\nA001",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                  {
                    text: "Pertambahan dalam luas hektar sepanjang tahun",
                    bold: true,
                    alignment: "center",
                    colSpan: 6,
                  },
                  "",
                  "",
                  "",
                  "",
                  "",
                  {
                    text: "Jumlah Pertambahan\nA008",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                  {
                    text: "Jumlah Keseluruhan Luas Hektar\nA008a",
                    bold: true,
                    alignment: "center",
                    rowSpan: 2,
                  },
                ],
                [
                  "",
                  "",
                  "",
                  {
                    text: "Keluasan cukup umur\nA002",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Keluasan penanaman umur\nA003",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Keluasan penanaman semula\nA004",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Keluasan ditebang tetapi belum ditanam dengan tanaman lain\nA005",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Keluasan dibeli atau digabung\nA006",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "Pelarasan kerja ukur, pembetulan, terbiar dan lain-lain\nA007",
                    bold: true,
                    alignment: "center",
                  },
                  "",
                  "",
                ],
                ...(() => {
                  let table = [];

                  let allStats = {};
                  for (const code of CODED_COLUMNS) {
                    allStats[
                      (typeof code === "object" && code.text) || code
                    ] = 0;
                  }
                  for (const stateCode of allEstateCensusStateCodes) {
                    const stateDistricts =
                      indexedEstateCensusStateDistricts.where({
                        stateCode: stateCode.stateCode,
                        // stateCodeId: stateCode._id,
                      });
                    // console.log(
                    //   stateCode.stateCode,
                    //   stateCode.stateName,
                    //   stateDistricts.length,
                    // );

                    if (stateDistricts.length > 0) {
                      table.push([
                        {
                          text: `Kod / Nama Negeri: ${stateCode.stateCode} / ${stateCode.stateName}`,
                          // bold: true,
                          colSpan: CODED_COLUMNS.length + 2,
                        },
                        "",
                        ...CODED_COLUMNS.map(code => code),
                      ]);
                    }

                    let stateStats = {};
                    for (const code of CODED_COLUMNS) {
                      stateStats[
                        (typeof code === "object" && code.text) || code
                      ] = 0;
                    }
                    for (const stateDistrict of stateDistricts) {
                      let estateInformations = indexedEstateInformations.where({
                        // stateCode: stateCode.stateCode,
                        // districtCode: stateDistrict.districtCode,
                        stateCode: String(parseInt(stateCode.stateCode)),
                        districtCode: String(
                          parseInt(stateDistrict.districtCode),
                        ),
                      });
                      estateInformations = estateInformations.filter(info => {
                        // --> find one value, check if exists
                        const foundValue = indexedValues.find({
                          estateInformationId: info._id,
                        });
                        return !!foundValue;

                        // --> filter by EstateCensusYearLists
                        // const foundYear = indexedEstateCensusYearLists.find({
                        //   estateId: info.estateId,
                        // });
                        // return !!foundYear;
                      });

                      // Filter All Estate Info that has values
                      estateInformations = estateInformations.map(est => {
                        let sum = 0;
                        for (const code of CODED_COLUMNS) {
                          for (const subCode of CODED_ROWS) {
                            const foundValue = indexedValues.find({
                              estateId: est.estateId,
                              code: code.text + subCode.code,
                            });
                            if (foundValue) {
                              sum += foundValue.value;
                            }
                          }
                        }

                        return {
                          ...est,
                          sum,
                        };
                      });
                      estateInformations = estateInformations.filter(
                        est => est.sum > 0,
                      );

                      let districtStats = {};
                      for (const code of CODED_COLUMNS) {
                        districtStats[
                          (typeof code === "object" && code.text) || code
                        ] = 0;
                      }
                      if (estateInformations.length > 0) {
                        table.push([
                          {
                            text: `Kod / Nama Daerah: ${stateDistrict.districtCode} / ${stateDistrict.districtName}`,
                            bold: true,
                            colSpan: CODED_COLUMNS.length + 2,
                          },
                          "",
                          ...CODED_COLUMNS.map(code => code),
                        ]);
                      }

                      for (const info of estateInformations) {
                        const foundNonEmptyValue = CODED_COLUMNS.find(code => {
                          const foundValue = indexedValues.find({
                            // estateInformationId: info._id,
                            estateId: info.estateId,
                            // code: code,
                          });

                          return foundValue && foundValue.value !== 0;
                        });
                        if (!foundNonEmptyValue) continue;

                        countEstateInformations += 1;

                        table.push([
                          {
                            text:
                              "EST ID: " + ("0000" + info.estateId).slice(-5),
                            bold: true,
                            colSpan: CODED_COLUMNS.length + 2,
                            fontSize: BASE_FONT_SIZE - 1,
                          },
                          "",
                          ...CODED_COLUMNS.map(code => {
                            return "";
                          }),
                        ]);
                        for (const row of CODED_ROWS) {
                          table.push([
                            {
                              text: row.text,
                              // bold: true,
                              fontSize: BASE_FONT_SIZE - 1,
                              border: [true, false, true, false],
                            },
                            {
                              text: row.code,
                              // bold: true,
                              fontSize: BASE_FONT_SIZE - 1,
                              alignment: "center",
                              border: [true, false, true, false],
                            },
                            ...CODED_COLUMNS.map(code => {
                              const foundValue =
                                (typeof code === "object" &&
                                  code.resolveValue &&
                                  code.resolveValue({
                                    info,
                                    rowCode: row.code,
                                  })) ||
                                indexedValues.find({
                                  estateInformationId: info._id,
                                  code: code,
                                });

                              if (
                                row.text.toUpperCase().indexOf("JUMLAH") >= 0
                              ) {
                                // do nothing
                                districtStats[
                                  (typeof code === "object" && code.text) ||
                                    code
                                ] += lodash.round(
                                  (foundValue && foundValue.value) || 0,
                                  2,
                                );
                              } else {
                              }

                              return {
                                text: lodash
                                  .round(
                                    (foundValue && foundValue.value) || 0,
                                    2,
                                  )
                                  .toFixed(2),
                                // bold: true,
                                alignment: "right",
                                fontSize: BASE_FONT_SIZE - 1,
                                border:
                                  row.text.toUpperCase().indexOf("JUMLAH") >= 0
                                    ? [true, true, true, true]
                                    : [true, false, true, false],
                              };
                            }),
                          ]);
                        }
                      }

                      if (estateInformations.length > 0) {
                        const districtWithValue = Object.keys(
                          districtStats,
                        ).find(key => !!districtStats[key]);
                        if (districtWithValue) {
                          table.push([
                            {
                              text: "Jumlah Daerah",
                              bold: true,
                              colSpan: 2,
                            },
                            "",
                            ...CODED_COLUMNS.map(code => {
                              stateStats[
                                (typeof code === "object" && code.text) || code
                              ] += lodash.round(
                                districtStats[
                                  (typeof code === "object" && code.text) ||
                                    code
                                ] || 0,
                                2,
                              );

                              return {
                                text: lodash
                                  .round(
                                    districtStats[
                                      (typeof code === "object" && code.text) ||
                                        code
                                    ] || 0,
                                    2,
                                  )
                                  .toFixed(2),
                                bold: true,
                                alignment: "right",
                              };
                            }),
                          ]);
                        } else {
                          table.pop();
                        }
                      }
                    }

                    if (stateDistricts.length > 0) {
                      const stateWithValue = Object.keys(stateStats).find(
                        key => !!stateStats[key],
                      );
                      if (stateWithValue) {
                        table.push([
                          {
                            text: "Jumlah Negeri",
                            bold: true,
                            colSpan: 2,
                          },
                          "",
                          ...CODED_COLUMNS.map(code => {
                            allStats[
                              (typeof code === "object" && code.text) || code
                            ] += lodash.round(
                              stateStats[
                                (typeof code === "object" && code.text) || code
                              ] || 0,
                              2,
                            );

                            return {
                              text: lodash
                                .round(
                                  stateStats[
                                    (typeof code === "object" && code.text) ||
                                      code
                                  ] || 0,
                                  2,
                                )
                                .toFixed(2),
                              bold: true,
                              alignment: "right",
                            };
                          }),
                        ]);
                      } else {
                        table.pop();
                      }
                    }
                  }

                  table.push([
                    {
                      text: "Jumlah Negara",
                      bold: true,
                      colSpan: 2,
                    },
                    "",
                    ...CODED_COLUMNS.map(code => {
                      return {
                        text: lodash
                          .round(
                            allStats[
                              (typeof code === "object" && code.text) || code
                            ] || 0,
                            2,
                          )
                          .toFixed(2),
                        bold: true,
                        alignment: "right",
                      };
                    }),
                  ]);

                  return table;
                })(),
              ],
            },
          },
          {
            marginTop: 10,
            text: "Bilangan Estet: " + countEstateInformations,
          },
          // {
          //   marginTop: 4,
          //   text: "Bilangan Status Sah: " + countEstateInformations,
          // },
          // {
          //   marginTop: 4,
          //   text: "Bilangan Status Tidak Sah: " + 0,
          // },

          // {
          //   marginTop: 40,
          //   text: [
          //     `${params.toYear} ${params.fromMonth} ${params.toMonth}`,
          //     params.title,
          //   ].join("\n"),
          // },
          // {
          //   marginTop: -12,
          //   text: `Date: ${dayjs().locale("ms-my").format("DD MMMM YYYY")}`,
          //   alignment: "right",
          // },
        ],
      };
      return await createPdf({
        docDefinition,
        filename: `Estate Census Report - Pertambahan Keluasan 03.pdf`,
        prefix: "",
        basePath: "/lkm",
      });
    },
    generateListOfEstateWithTotalHectarage: async (self, params, context) => {
      // console.log("generateDomesticTradeExportImportReport", params);
      assertValidSession(context.activeSession);

      // ###########################################################################################
      // -------------------------------------------------------------------------------------------
      const allEstateCensusStateCodes = await context
        .collection("EstateCensusStateCodes")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log("allEstateCensusStateCodes", allEstateCensusStateCodes[0]);
      const indexedEstateCensusStateCodes = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["stateName"],
        },
      });
      indexedEstateCensusStateCodes.add(allEstateCensusStateCodes);
      // console.log(
      //   "allEstateCensusStateCodes",
      //   allEstateCensusStateCodes.length,
      // );

      const allEstateCensusStateDistricts = await context
        .collection("EstateCensusStateDistricts")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log(
      //   "allEstateCensusStateDistricts",
      //   allEstateCensusStateDistricts[0],
      // );
      const indexedEstateCensusStateDistricts = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["stateCode", "stateCodeId"],
        },
      });
      indexedEstateCensusStateDistricts.add(allEstateCensusStateDistricts);
      // console.log(
      //   "allEstateCensusStateDistricts",
      //   allEstateCensusStateDistricts.length,
      // );

      let allEstateInformations = await context
        .collection("EstateInformations")
        .find({
          _deletedAt: {
            $exists: false,
          },
        })
        .sort({
          estateId: 1,
        })
        .toArray();

      allEstateInformations = allEstateInformations.map(est => {
        return {
          ...est,
          estateIdOrderNumber: parseInt(est.estateId),
        };
      });
      // console.log("allEstateInformations", allEstateInformations[0]);
      const indexedEstateInformations = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateState", "stateCode", "districtCode"],
        },
      });

      let allEstateMaklumatBorang = await context
        .collection("EstateCensusMaklumatBorang")
        .find({
          _deletedAt: {
            $exists: false,
          },
          censusYear: params.year,
        })
        .sort({
          estateId: 1,
        })
        .toArray();
      const indexedMaklumatBorang = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateId"],
        },
      });
      indexedMaklumatBorang.add(allEstateMaklumatBorang);
      allEstateInformations = allEstateInformations

        .map(info => {
          let estateType = parseInt(info.estateType);
          const maklumatBorang = indexedMaklumatBorang.find({
            estateId: info.estateId,
          });

          // if (isNaN(estateType)) {
          //   console.log(info.estateType);
          // }
          const estateStatus = maklumatBorang?.estateStatus || "";

          if (estateStatus === "Aktif") {
            estateType = 1;
          } else if (estateStatus === "Pelarasan") {
            estateType = 2;
          } else if (estateStatus === "Penebangan") {
            estateType = 3;
          } else if (estateStatus === "Penguaran Keluaasaan") {
            estateType = 4;
          } else if (estateStatus === "Terbiar") {
            estateType = 5;
          }
          // let estateStatus = "";
          // if (estateType === 1) {
          //   estateStatus = "Aktif";
          // } else if (estateType === 2) {
          //   estateStatus = "Pelarasan";
          // } else if (estateType === 3) {
          //   estateStatus = "Penebangan";
          // } else if (estateType === 4) {
          //   estateStatus = "Penguaran Keluaasaan";
          // } else if (estateType === 5) {
          //   estateStatus = "Terbiar";
          // }
          return {
            ...info,
            estateType,
            estateStatus,
            stateCode: String(parseInt(info.stateCode)),
            districtCode: String(parseInt(info.districtCode)),
          };
        })
        .filter(info => !!info.estateStatus);
      indexedEstateInformations.add(allEstateInformations);
      // console.log("allEstateInformations", allEstateInformations.length);

      const CODED_COLUMNS = [
        {
          text: "A01405",
          bold: true,
          alignment: "center",
        },
        {
          text: "A01410",
          bold: true,
          alignment: "center",
        },
        {
          text: "A01411",
          bold: true,
          alignment: "center",
        },
        {
          text: "A01422",
          bold: true,
          alignment: "center",
        },
      ];

      let query = {};
      if (params.year) {
        query.censusYear = params.year;
      }
      await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .createIndex({
          censusYear: 1,
          code: 1,
        });
      const allValues = await context
        .collection("EstateCensusHakMilikPertubuhanAndSeksyenValues")
        .find({
          ...query,
          // code: {
          //   $in: [
          //     ...CODED_COLUMNS.map(code =>
          //       typeof code === "object" ? code.text : code,
          //     ),
          //   ],
          // },
          $or: CODED_COLUMNS.map(item => {
            const code = typeof item === "object" ? item.text : item;
            return {
              code: {
                $regex: "^" + code,
                $options: "im",
              },
            };
          }),
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      console.log("allValues", allValues.length);
      const indexedValues = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateInformationId", "code"],
        },
      });
      indexedValues.add(allValues);

      await context.collection("EstateCensusYearLists").createIndex({
        year: 1,
        estateId: 1,
      });
      const allEstateCensusYearLists = await context
        .collection("EstateCensusYearLists")
        .find({
          year: parseInt(params.year),
          _deletedAt: {
            $exists: false,
          },
        })
        .toArray();
      // console.log(
      //   "allEstateCensusYearLists",
      //   // allEstateCensusYearLists[0],
      //   allEstateCensusYearLists.length,
      // );
      const indexedEstateCensusYearLists = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: ["estateId", "year"],
        },
      });
      indexedEstateCensusYearLists.add(allEstateCensusYearLists);

      // ###########################################################################################
      // ###########################################################################################

      let countEstateInformations = 0;

      const BASE_FONT_SIZE = 11;
      const docDefinition = {
        pageMargins: [20, 30, 20, 45],
        pageSize: "A4",
        // pageOrientation: "portrait",
        pageOrientation: "landscape",
        // header:
        //   metadata.letter.useLetterHead === "Ya"
        //     ? renderHeader(
        //         companyInformation,
        //         // , [1]
        //       )
        //     : null,
        footer: (currentPage, pageCount) => [
          {
            text: "Tarik Cetak " + dayjs().format("DD/MM/YYYY"),
            alignment: "left",
            // lineHeight: 1,
            // marginTop: 4,
            marginBottom: 0,
            marginLeft: 20,
            fontSize: BASE_FONT_SIZE,
          },
          {
            text: "Page " + currentPage.toString() + " of " + pageCount,
            alignment: "left",
            // lineHeight: 1,
            // marginTop: 4,
            marginBottom: 8,
            marginLeft: 20,
            fontSize: BASE_FONT_SIZE,
          },
        ],
        defaultStyle: {
          fontSize: BASE_FONT_SIZE,
          // lineHeight: 1,
        },
        content: [
          {
            text: `Listing - List Of Estates With Total Hectarage`,
            // alignment: "center",
            bold: true,
            fontSize: BASE_FONT_SIZE + 3,
          },
          {
            text: `Tahun Banci ${params.year}`,
            alignment: "right",
            bold: true,
            fontSize: BASE_FONT_SIZE + 3,
            marginTop: -14,
          },
          {
            marginTop: 10,
            layout: {
              ...defaultTableLayout,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 3,
              paddingRight: () => 3,
            },
            table: {
              widths: [15, 100, 280, 100, ...CODED_COLUMNS.map(code => 63)],
              body: [
                [
                  {
                    text: "No",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "EstId",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "EstName",
                    bold: true,
                    alignment: "center",
                  },
                  {
                    text: "EstStat",
                    bold: true,
                    alignment: "center",
                  },
                  ...CODED_COLUMNS,
                ],
                ...(() => {
                  let table = [];

                  let groupedEstateInformations = lodash.groupBy(
                    allEstateInformations,
                    "estateStatus",
                  );
                  let groupedData = lodash.orderBy(
                    Object.entries(groupedEstateInformations).map(
                      ([estateStatus, estateInformations]) => {
                        return {
                          estateStatus,
                          estateType:
                            estateInformations &&
                            estateInformations[0] &&
                            estateInformations[0].estateType,
                          estateInformations,
                        };
                      },
                    ),
                    ["estateType"],
                    ["asc"],
                  );
                  // console.log({ groupedData });

                  let allStats = {};
                  CODED_COLUMNS.forEach(column => {
                    allStats[column.text] = 0;
                  });

                  let index = 0;
                  for (const data of groupedData) {
                    const { estateStatus, estateType, estateInformations } =
                      data;

                    let estateStats = {};
                    CODED_COLUMNS.forEach(column => {
                      estateStats[column.text] = 0;
                    });
                    let countNonEmptyValues = 0;
                    const sortedEstateInformation = lodash.orderBy(
                      estateInformations,
                      ["estateIdOrderNumber", "asc"],
                      ["asc"],
                    );
                    for (const info of sortedEstateInformation) {
                      const foundNonEmptyValue = CODED_COLUMNS.find(column => {
                        const foundValue = indexedValues.find({
                          estateInformationId: info._id,
                          code: column.text,
                        });

                        return foundValue && foundValue.value !== 0;
                      });
                      if (!foundNonEmptyValue) continue;

                      countNonEmptyValues += 1;
                      table.push([
                        {
                          text: ++index,
                          alignment: "center",
                        },
                        {
                          text: `${("00" + info.recordType).slice(-2)}/${(
                            "00" + info.stateCode
                          ).slice(-2)}/${("00" + info.districtCode).slice(
                            -2,
                          )}/${("0000" + info.estateId).slice(-5)}`,
                          // alignment: "center",
                        },
                        {
                          text: info.estateName,
                          // alignment: "center",
                        },
                        {
                          text: estateStatus,
                          alignment: "center",
                        },
                        ...CODED_COLUMNS.map(column => {
                          const foundValues = indexedValues.where({
                            estateInformationId: info._id,
                            code: column.text,
                          });
                          // console.log(
                          //   "foundNonEmptyValue",
                          //   info.estateId,
                          //   info.estateName,
                          //   column.text,
                          //   foundValues.length,
                          // );

                          let sum = 0;
                          for (const foundValue of foundValues) {
                            sum += (foundValue && foundValue.value) || 0;
                          }

                          estateStats[column.text] += sum;

                          return {
                            text: sum
                              ? formatNumber(sum, 2)
                              : parseFloat(0.0).toFixed(2),
                            alignment: "center",
                          };
                        }),
                      ]);
                    }

                    if (countNonEmptyValues > 0) {
                      table.push([
                        {
                          text: `Bill Estet Mengikuti Status: ${countNonEmptyValues}\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tJumlah Status: ${estateStatus}`,
                          alignment: "left",
                          bold: true,
                          colSpan: 4,
                        },
                        "",
                        "",
                        "",
                        ...CODED_COLUMNS.map(column => {
                          let sum = estateStats[column.text] || 0;
                          allStats[column.text] += sum;

                          return {
                            text: sum
                              ? formatNumber(sum, 2)
                              : parseFloat(0.0).toFixed(2),
                            alignment: "center",
                            bold: true,
                          };
                        }),
                      ]);
                    }
                  }

                  table.push([
                    {
                      preserveLeadingSpaces: true,
                      text: `\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\t\tJumlah Keseluruhan`,
                      alignment: "left",
                      bold: true,
                      colSpan: 4,
                    },
                    "",
                    "",
                    "",
                    ...CODED_COLUMNS.map(column => {
                      let sum = allStats[column.text] || 0;

                      return {
                        text: sum
                          ? formatNumber(sum, 2)
                          : parseFloat(0.0).toFixed(2),
                        alignment: "center",
                        bold: true,
                      };
                    }),
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
        filename: `Estate Census Report - List of Estate With Total Hectarage.pdf`,
        prefix: "",
        basePath: "/lkm",
      });
    },

    generateEstateCensusReport,
    generateMalaysianReport,
    generateSemenanjungReport: async (self, params, context) => {
      return generateMalaysianReport(
        self,
        { ...params, segment: "Semenanjung" },
        context,
      );
    },
    generateSabahReport: async (self, params, context) => {
      return generateMalaysianReport(
        self,
        { ...params, segment: "Sabah" },
        context,
      );
    },
    generateSarawakReport: async (self, params, context) => {
      return generateMalaysianReport(
        self,
        { ...params, segment: "Sarawak" },
        context,
      );
    },
  },
};

exports.resolvers = resolvers;
