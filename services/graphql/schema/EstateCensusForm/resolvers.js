const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");

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
const { assertValidSession } = require("../../authentication");

const resolvers = {
  Query: {
    allEstateCensusForms: async (self, params, context) => {
      return await context
        .collection("EstateCensusForms")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .toArray();
    },
    estateCensusForm: async (self, params, context) => {
      return await context
        .collection("EstateCensusForms")
        .findOne({ _id: params._id });
    },
    allEstateCensusFormFillings: async (self, params, context) => {
      await context.collection("EstateCensusFormFillings").createIndex({
        formId: 1,
      });
      return await context
        .collection("EstateCensusFormFillings")
        .find({ formId: params.formId, ...NOT_DELETED_DOCUMENT_QUERY })
        .toArray();
    },
    estateCensusFormFilling: async (self, params, context) => {
      return await context
        .collection("EstateCensusFormFillings")
        .findOne({ _id: params._id });
    },
  },

  Mutation: {
    createEstateCensusForm: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const newEstateCensusForm = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateCensusForms",
        affectedDocumentId: newEstateCensusForm._id,
        dataBeforeChanges: newEstateCensusForm,
        dataAfterChanges: newEstateCensusForm,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("EstateCensusForms")
        .insertOne(newEstateCensusForm);
      return "success";
    },
    updateEstateCensusForm: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const found = await context.collection("EstateCensusForms").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateCensusForms",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...params,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("EstateCensusForms").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            ...params,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    deleteEstateCensusForm: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("EstateCensusForms").findOne({
        _id: params._id,
      });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EstateCensusForms",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          _deletedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "DELETE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("EstateCensusForms").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },

    copyEstateCensusForm: async (self, params, context) => {
      const foundEstateCensusForm = await context
        .collection("EstateCensusForms")
        .findOne({
          _id: params.sourceFormId,
        });

      const newEstateCensusForm = {
        ...foundEstateCensusForm,
        ...params,
        _id: uuidv4(),
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };
      await context
        .collection("EstateCensusForms")
        .insertOne(newEstateCensusForm);

      return "success";
    },

    generateEstateCensusFormPDF: async (self, params, context) => {
      const foundForm = await context.collection("EstateCensusForms").findOne({
        _id: params._id,
      });

      let logoUrl = base64Img.base64Sync(__dirname + "/lkm-logo.png");

      // ############################################################################
      // ############################################################################
      const BASE_FONT_SIZE = 11;
      const docDefinition = {
        pageMargins: [25, 30, 25, 20],
        pageSize: "A4",
        pageOrientation: "portrait",
        defaultStyle: {
          fontSize: BASE_FONT_SIZE,
          // lineHeight: 1,
        },
        content: [
          // ############################################################################
          {
            image: logoUrl,
            width: 150,
            maxHeight: 150,
            marginTop: 30,
            alignment: "center",
            // absolutePosition: { x: 480, y: -20 },
            // pageBreak: 0 < index ? "before" : "",
          },
          {
            marginTop: 10,
            text: `LEMBAGA KOKO MALAYSIA\n(MALAYSIAN COCOA BOARD)`,
            alignment: "center",
            bold: true,
            fontSize: BASE_FONT_SIZE + 1,
          },
          {
            marginTop: 100,
            text: `SOAL SELIDIK\nBANCI TAHUNAN ESTET KOKO`,
            alignment: "center",
            bold: true,
            fontSize: BASE_FONT_SIZE + 4,
          },
          {
            marginTop: 20,
            text: `Questionnaire\nAnnual Census of Cocoa Estate\n${
              foundForm.name || ""
            }`,
            alignment: "center",
            bold: true,
            fontSize: BASE_FONT_SIZE + 4,
          },
          {
            marginTop: 200,
            marginLeft: 350,
            text: `No. Rujukan/Reference No:`,
            bold: true,
            fontSize: BASE_FONT_SIZE,
          },
          {
            marginLeft: 350,
            marginTop: 4,
            layout: {
              ...defaultTableLayout,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 3,
              paddingRight: () => 3,
            },
            table: {
              widths: [200],
              body: [[" "]],
            },
          },
          {
            marginLeft: 350,
            marginTop: 4,
            text: `Estet/Estate:`,
            bold: true,
            fontSize: BASE_FONT_SIZE,
          },
          {
            marginLeft: 350,
            marginTop: 4,
            layout: {
              ...defaultTableLayout,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 3,
              paddingRight: () => 3,
            },
            table: {
              widths: [200],
              body: [[" "]],
            },
          },
          {
            marginLeft: 350,
            marginTop: 4,
            text: `Taraf/Status:`,
            bold: true,
            fontSize: BASE_FONT_SIZE,
          },
          {
            marginLeft: 350,
            marginTop: 4,
            layout: {
              ...defaultTableLayout,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 3,
              paddingRight: () => 3,
            },
            table: {
              widths: [200],
              body: [[" "]],
            },
          },
          {
            marginTop: -20,
            marginLeft: 20,
            text: `Sulit/Confidential`,
            alignment: "left",
            bold: true,
            fontSize: BASE_FONT_SIZE,
          },
          // ############################################################################
          {
            text: "",
            pageBreak: "before",
          },
          {
            marginTop: 20,
            text: `LEMBAGA KOKO MALAYSIA`,
            alignment: "center",
            bold: true,
            fontSize: BASE_FONT_SIZE,
          },
          {
            marginTop: 4,
            text: `(MALAYSIAN COCOA BOARD)`,
            alignment: "center",
            italics: true,
            fontSize: BASE_FONT_SIZE,
          },
          {
            marginTop: 20,
            text: `BANCI TAHUNAN ESTET-ESTET KOKO`,
            alignment: "center",
            bold: true,
            fontSize: BASE_FONT_SIZE,
          },
          {
            marginTop: 4,
            text: `ANNUAL CENSUS OF COCOA ESTATE`,
            alignment: "center",
            italics: true,
            fontSize: BASE_FONT_SIZE,
          },
          {
            marginTop: 20,
            text: `BAGI KEGUNAAN PEJABAT SAHAJA`,
            alignment: "center",
            bold: true,
            fontSize: BASE_FONT_SIZE,
          },
          {
            marginTop: 4,
            text: `FOR OFFICE USE ONLY`,
            alignment: "center",
            italics: true,
            fontSize: BASE_FONT_SIZE,
            marginBottom: 20,
          },
          // #############
          // #######
          [
            {
              label: "Jenis Rekod",
              sublabel: "Type of Record",
            },
            {
              label: "Negeri",
              sublabel: "State",
            },
            {
              label: "Daerah",
              sublabel: "District",
            },
            {
              label: "No. Siri",
              sublabel: "Serial No",
            },
            {
              label: "Jenis Estet",
              sublabel: "Type of Estate",
            },
          ].map(item => {
            return {
              marginTop: 4,
              text: [
                {
                  text: item.label + ":\n",
                  bold: true,
                },
                {
                  text: item.sublabel + ":",
                  italics: true,
                },
              ],
              fontSize: BASE_FONT_SIZE,
            };
          }),
          // #############
          // #######
          {
            marginTop: 20,
            text: [
              {
                text: "Nama dan Alamat Estet ",
                bold: true,
              },
              {
                text: "Name and Address of Estate :",
                italics: true,
              },
            ],
            fontSize: BASE_FONT_SIZE,
          },
          {
            marginTop: 4,
            layout: {
              ...defaultTableLayout,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 3,
              paddingRight: () => 3,
            },
            table: {
              widths: [200, 300],
              body: [
                ...[
                  {
                    label: "Nama",
                    sublabel: "Name",
                  },
                  {
                    label: "Alamat",
                    sublabel: "Address",
                  },
                  {
                    label: "Estet",
                    sublabel: "Estate",
                  },
                  {
                    label: "No. Telefon",
                    sublabel: "Telephone No.",
                  },
                  {
                    label: "No. Faks",
                    sublabel: "Fax No.",
                  },
                ].map(item => {
                  return [
                    {
                      text: [
                        {
                          text: item.label + ":\n",
                          bold: true,
                        },
                        {
                          text: item.sublabel + ":",
                          italics: true,
                        },
                      ],
                      fontSize: BASE_FONT_SIZE,
                    },
                    {
                      text: " ",
                    },
                  ];
                }),
              ],
            },
          },
          // #############
          // #######
          {
            marginTop: 20,
            text: [
              {
                text: "Nama dan Alamat Ibu Pejabat / Wakil ",
                bold: true,
              },
              {
                text: "Name and Address of Head Office and Agent :",
                italics: true,
              },
            ],
            fontSize: BASE_FONT_SIZE,
          },
          {
            marginTop: 4,
            layout: {
              ...defaultTableLayout,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 3,
              paddingRight: () => 3,
            },
            table: {
              widths: [200, 300],
              body: [
                ...[
                  {
                    label: "Ibu Pejabat/Wakil",
                    sublabel: "Head Office/Agent",
                  },
                  {
                    label: "Alamat",
                    sublabel: "Address",
                  },
                  {
                    label: "Poskod",
                    sublabel: "Postal Code",
                  },
                  {
                    label: "No. Telefon",
                    sublabel: "Telephone No.",
                  },
                  {
                    label: "No. Faks",
                    sublabel: "Fax No.",
                  },
                ].map(item => {
                  return [
                    {
                      text: [
                        {
                          text: item.label + ":\n",
                          bold: true,
                        },
                        {
                          text: item.sublabel + ":",
                          italics: true,
                        },
                      ],
                      fontSize: BASE_FONT_SIZE,
                    },
                    {
                      text: " ",
                    },
                  ];
                }),
              ],
            },
          },
          // #############
          // #######
          {
            marginTop: 20,
            text: [
              {
                text: "Nama dan Alamat Pos ",
                bold: true,
              },
              {
                text: "Name and Postal Address :",
                italics: true,
              },
            ],
            fontSize: BASE_FONT_SIZE,
          },
          {
            marginTop: 4,
            layout: {
              ...defaultTableLayout,
              paddingTop: () => 4,
              paddingBottom: () => 4,
              paddingLeft: () => 3,
              paddingRight: () => 3,
            },
            table: {
              widths: [200, 300],
              body: [
                ...[
                  {
                    label: "Nama",
                    sublabel: "Name",
                  },
                  {
                    label: "Alamat",
                    sublabel: "Address",
                  },
                  {
                    label: "Poskod",
                    sublabel: "Postal Code",
                  },
                  {
                    label: "No. Telefon",
                    sublabel: "Telephone No.",
                  },
                  {
                    label: "No. Faks",
                    sublabel: "Fax No.",
                  },
                ].map(item => {
                  return [
                    {
                      text: [
                        {
                          text: item.label + ":\n",
                          bold: true,
                        },
                        {
                          text: item.sublabel + ":",
                          italics: true,
                        },
                      ],
                      fontSize: BASE_FONT_SIZE,
                    },
                    {
                      text: " ",
                    },
                  ];
                }),
              ],
            },
          },
          // ############################################################################
          {
            // text: "QUESTIONAIER",
            text: " ",
            alignment: "center",
            fontSize: BASE_FONT_SIZE + 2,
            pageBreak: "before",
          },
          ...(() => {
            let table = [];

            const specs = foundForm?.specs || [];
            let specIndex = 0;
            for (const spec of specs) {
              specIndex += 1;

              // console.log({ spec });
              if (spec.type === "Free Text") {
                table.push({
                  marginTop: 18,
                  text: [
                    {
                      text: spec.label + "\n",
                      bold: true,
                    },
                    {
                      text: spec.sublabel,
                      italics: true,
                    },
                  ],
                  fontSize: BASE_FONT_SIZE,
                });
              } else if (spec.type === "Checkbox") {
                table.push({
                  marginTop: 18,
                  text: [
                    {
                      text: spec.label + ":\n",
                      bold: true,
                    },
                    {
                      text: spec.sublabel + ":",
                      italics: true,
                    },
                  ],
                  fontSize: BASE_FONT_SIZE,
                });
                table.push({
                  marginTop: 4,
                  marginLeft: 7,
                  layout: {
                    ...defaultTableLayout,
                    paddingTop: () => 4,
                    paddingBottom: () => 4,
                    paddingLeft: () => 4,
                    paddingRight: () => 4,
                  },
                  table: {
                    widths: [20, 400],
                    body: [
                      ...(spec.options || [])
                        .map(option => {
                          return {
                            label: option.label,
                            sublabel: option.sublabel,
                          };
                        })
                        .map(item => {
                          return [
                            {
                              text: " ",
                            },
                            {
                              text: [
                                {
                                  text: item.label + ":\n",
                                  bold: true,
                                },
                                {
                                  text: item.sublabel,
                                  italics: true,
                                },
                              ],
                              fontSize: BASE_FONT_SIZE,
                              border: [false, false, false, false],
                            },
                          ];
                        }),
                    ],
                  },
                });
              } else if (spec.type === "Short Question") {
                table.push({
                  marginTop: 18,
                  text: [
                    {
                      text: spec.label + ":\n",
                      bold: true,
                    },
                    {
                      text: spec.sublabel + ":",
                      italics: true,
                    },
                  ],
                  fontSize: BASE_FONT_SIZE,
                });
                table.push({
                  marginTop: 4,
                  marginLeft: 7,
                  layout: {
                    ...defaultTableLayout,
                    paddingTop: () => 4,
                    paddingBottom: () => 4,
                    paddingLeft: () => 0,
                    paddingRight: () => 0,
                  },
                  table: {
                    widths: [
                      // 150 + 10,
                      350,
                    ],
                    body: [
                      ...[
                        {
                          label: spec.label,
                          sublabel: spec.sublabel,
                        },
                      ].map(item => {
                        return [
                          // {
                          //   text: [
                          //     {
                          //       text: item.label + ":\n",
                          //       bold: true,
                          //     },
                          //     {
                          //       text: item.sublabel + ":",
                          //       italics: true,
                          //     },
                          //   ],
                          //   fontSize: BASE_FONT_SIZE,
                          //   border: [false, false, false, false],
                          // },
                          {
                            text: " ",
                          },
                        ];
                      }),
                    ],
                  },
                });
              } else if (spec.type === "Fixed Table") {
                table.push({
                  marginTop: 18,
                  text: [
                    {
                      text: spec.label + ":\n",
                      bold: true,
                    },
                    {
                      text: spec.sublabel + ":",
                      italics: true,
                    },
                  ],
                  fontSize: BASE_FONT_SIZE,
                });
                let columns = spec.columns || [];
                table.push({
                  marginTop: 4,
                  marginLeft: 7,
                  layout: {
                    ...defaultTableLayout,
                    paddingTop: () => 4,
                    paddingBottom: () => 4,
                    paddingLeft: () => 3,
                    paddingRight: () => 3,
                  },
                  table: {
                    widths: [
                      20,
                      ...columns.map(
                        column => Math.min(500 / columns.length),
                        200,
                      ),
                    ],
                    body: [
                      [
                        {
                          text: "#",
                          alignment: "center",
                        },
                        ...columns.map(column => {
                          return {
                            text: [
                              {
                                text: column.label + "\n",
                                bold: true,
                              },
                              {
                                text: column.sublabel,
                                italics: true,
                              },
                            ],
                            alignment: "center",
                            fontSize: BASE_FONT_SIZE,
                          };
                        }),
                      ],
                      ...[...new Array(spec.rowCount || 1)].map(
                        (row, index) => {
                          return [
                            {
                              text: index + 1,
                              alignment: "center",
                            },
                            ...columns.map(column => {
                              return {
                                text: " ",
                              };
                            }),
                          ];
                        },
                      ),
                    ],
                  },
                });
              } else if (spec.type === "Question Table") {
                table.push({
                  marginTop: 18,
                  text: [
                    {
                      text: spec.label + ":\n",
                      bold: true,
                    },
                    {
                      text: spec.sublabel + ":",
                      italics: true,
                    },
                  ],
                  fontSize: BASE_FONT_SIZE,
                });
                let columns = spec.columns || [];
                let rows = spec.rows || [];
                table.push({
                  marginTop: 4,
                  marginLeft: 7,
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
                      ...columns.map(
                        column => Math.min(407 / columns.length),
                        200,
                      ),
                    ],
                    body: [
                      [
                        {
                          text: "#",
                          alignment: "center",
                        },
                        ...columns.map(column => {
                          return {
                            text: [
                              {
                                text: column.label + "\n",
                                bold: true,
                              },
                              {
                                text: column.sublabel,
                                italics: true,
                              },
                            ],
                            alignment: "center",
                            fontSize: BASE_FONT_SIZE,
                          };
                        }),
                      ],
                      ...rows.map((row, index) => {
                        return [
                          {
                            text: [
                              {
                                text: row.label + "\n",
                                bold: true,
                              },
                              {
                                text: row.sublabel,
                                italics: true,
                              },
                            ],
                            alignment: "center",
                          },
                          ...columns.map(column => {
                            return {
                              text: " ",
                            };
                          }),
                        ];
                      }),
                    ],
                  },
                });
              }
            }

            return table;
          })(),
        ],
      };
      return await createPdf({
        docDefinition,
        filename: `Questionaier Form.pdf`,
        prefix: "",
        basePath: "/lkm",
      });
    },

    createEstateCensusFormFilling: async (self, params, context) => {
      const newEstateCensusFormFilling = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };
      await context
        .collection("EstateCensusFormFillings")
        .insertOne(newEstateCensusFormFilling);

      return newEstateCensusFormFilling;
    },
    updateEstateCensusFormFilling: async (self, params, context) => {
      // console.log({ params });
      await context.collection("EstateCensusFormFillings").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            ...params,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    deleteEstateCensusFormFilling: async (self, params, context) => {
      await context.collection("EstateCensusFormFillings").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            _deletedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
  },
};
exports.resolvers = resolvers;
