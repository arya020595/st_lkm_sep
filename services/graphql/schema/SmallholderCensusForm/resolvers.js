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

const {
  generateMalaysianSmallholderReport,
} = require("./malaysian-smallholder-report");
const {
  generateSabahSmallholderReport,
} = require("./sabah-smallholder-report");

const resolvers = {
  Query: {
    allSmallholderCensusQuestions: async (self, params, context) => {
      let query = {
        ...params,
      };
      return await context
        .collection("SmallholderCensusQuestions")
        .find({ ...query, ...NOT_DELETED_DOCUMENT_QUERY })
        .toArray();
    },
    allSmallholderCensusQuestionnaires: async (self, params, context) => {
      let query = {
        ...params,
      };
      return await context
        .collection("SmallholderCensusQuestionnaires")
        .find({ ...query, ...NOT_DELETED_DOCUMENT_QUERY })
        .toArray();
    },
    smallholderCensusQuestionnaireByYear: async (self, params, context) => {
      let query = {
        year: params.year || "",
      };
      await context.collection("SmallholderCensusQuestionnaires").createIndex({
        year: 1,
      });
      let result = await context
        .collection("SmallholderCensusQuestionnaires")
        .findOne({ ...query, ...NOT_DELETED_DOCUMENT_QUERY });
      // console.log({
      //   query,
      //   result,
      // });
      return result;
    },
    allSmallholderCensusQuestionnaireData: async (self, params, context) => {
      let query = {
        year: params.year || "",
        ...params,
        // localRegionId: params.localRegionId || "",
        // smallholderId: params.smallholderId || "",
      };
      console.log({ params, query });
      await context
        .collection("SmallholderCensusQuestionnaireData")
        .createIndex({
          year: 1,
          localRegionId: 1,
          smallholderId: 1,
        });
      let results = await context
        .collection("SmallholderCensusQuestionnaireData")
        .find({ ...query, ...NOT_DELETED_DOCUMENT_QUERY })
        .toArray();
      console.log("results", results.length);
      return results;
    },
    smallholderCensusQuestionnaireData: async (self, params, context) => {
      if (!params._id) return null;
      let query = {
        _id: params._id,
      };
      return await context
        .collection("SmallholderCensusQuestionnaireData")
        .findOne({ ...query, ...NOT_DELETED_DOCUMENT_QUERY });
    },

    // ################################################################################

    allRefBanci: async (self, params, context) => {
      return await context
        .collection("V1RefBanci")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
    },
    allSmallholderCensusForms: async (self, params, context) => {
      let query = {
        ...params,
      };
      // if (params.banciId) {
      //   query.banciId = params.banciId;
      // }
      return await context
        .collection("SmallholderCensusForms")
        .find({ ...query, ...NOT_DELETED_DOCUMENT_QUERY })
        .toArray();
    },
    smallholderCensusForm: async (self, params, context) => {
      return await context
        .collection("SmallholderCensusForms")
        .findOne({ _id: params._id });
    },
    allSmallholderCensusFormFillings: async (self, params, context) => {
      let query = {};
      if (params.banciId) {
        query.banciId = params.banciId;
      }
      await context.collection("SmallholderCensusFormFillings").createIndex({
        formId: 1,
      });
      return await context
        .collection("SmallholderCensusFormFillings")
        .find({
          ...query,
          formId: params.formId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
    },
    smallholderCensusFormFilling: async (self, params, context) => {
      return await context
        .collection("SmallholderCensusFormFillings")
        .findOne({ _id: params._id });
    },
  },

  Mutation: {
    createSmallholderCensusQuestion: async (self, params, context) => {
      // const section = await context
      //   .collection("SmallholderRefQuestionnareSections")
      //   .findOne({
      //     _id: params.sectionId,
      //   });
      // const subSection = await context
      //   .collection("SmallholderRefQuestionnareSubSections")
      //   .findOne({
      //     _id: params.subSectionId,
      //   });
      // const questionCode = await context
      //   .collection("SmallholderRefQuestionnareQuestionCodes")
      //   .findOne({
      //     _id: params.questionCodeId,
      //   });

      const newSmallholderCensusQuestion = {
        _id: uuidv4(),
        ...params,
        // section,
        // subSection,
        // questionCode,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };
      await context
        .collection("SmallholderCensusQuestions")
        .insertOne(newSmallholderCensusQuestion);
      return "success";
    },
    updateSmallholderCensusQuestion: async (self, params, context) => {
      let updates = {
        ...params,
      };
      // if (updates.sectionId) {
      //   const section = await context
      //     .collection("SmallholderRefQuestionnareSections")
      //     .findOne({
      //       _id: updates.sectionId,
      //     });
      //   updates.section = section;
      // }
      // if (updates.subSectionId) {
      //   const subSection = await context
      //     .collection("SmallholderRefQuestionnareSubSections")
      //     .findOne({
      //       _id: updates.subSectionId,
      //     });
      //   updates.subSection = subSection;
      // }
      // if (updates.questionCodeId) {
      //   const questionCode = await context
      //     .collection("SmallholderRefQuestionnareQuestionCodes")
      //     .findOne({
      //       _id: updates.questionCodeId,
      //     });
      //   updates.questionCode = questionCode;
      // }
      await context.collection("SmallholderCensusQuestions").updateOne(
        {
          _id: updates._id,
        },
        {
          $set: {
            ...updates,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    deleteSmallholderCensusQuestion: async (self, params, context) => {
      await context.collection("SmallholderCensusQuestions").updateOne(
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

    createSmallholderCensusQuestionnaire: async (self, params, context) => {
      // const newSmallholderCensusQuestionnaire = {
      //   _id: uuidv4(),
      //   ...params,
      //   _createdAt: new Date().toISOString(),
      //   _updatedAt: new Date().toISOString(),
      // };
      // await context
      //   .collection("SmallholderCensusQuestionnaires")
      //   .insertOne(newSmallholderCensusQuestionnaire);

      // ################################
      let foundQuestions = await context
        .collection("SmallholderCensusQuestions")
        .find({
          _id: {
            $in: params.questionIds,
          },
        })
        .toArray();
      let questions = params.questionIds
        .map(id => foundQuestions.find(q => q._id === id))
        .filter(item => !!item);
      // console.log({ questions }, params.questionIds, questions);
      // ################################

      await context.collection("SmallholderCensusQuestionnaires").updateOne(
        {
          year: params.year,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        {
          $setOnInsert: {
            _id: uuidv4(),
            ...params,
            questions,
            _createdAt: new Date().toISOString(),
          },
          $set: {
            // ...params,
            _updatedAt: new Date().toISOString(),
          },
        },
        {
          upsert: true,
        },
      );
      return "success";
    },
    updateSmallholderCensusQuestionnaire: async (self, params, context) => {
      let updates = {};

      if (params.questionIds) {
        // ################################
        let foundQuestions = await context
          .collection("SmallholderCensusQuestions")
          .find({
            _id: {
              $in: params.questionIds,
            },
          })
          .toArray();
        let questions = params.questionIds
          .map(id => foundQuestions.find(q => q._id === id))
          .filter(item => !!item);
        // console.log({ questions }, params.questionIds, questions);
        // ################################
        updates = {
          ...updates,
          questions,
        };
      }

      await context.collection("SmallholderCensusQuestionnaires").updateOne(
        {
          year: params.year,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        {
          $set: {
            ...params,
            ...updates,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      // await context.collection("SmallholderCensusQuestionnaires").updateOne(
      //   {
      //     _id: params._id,
      //   },
      //   {
      //     $set: {
      //       ...params,
      //       _updatedAt: new Date().toISOString(),
      //     },
      //   },
      // );
      return "success";
    },
    deleteSmallholderCensusQuestionnaire: async (self, params, context) => {
      await context.collection("SmallholderCensusQuestionnaires").updateOne(
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

    copySmallholderCensusQuestionnaire: async (self, params, context) => {
      const foundSmallholderCensusQuestionnaire = await context
        .collection("SmallholderCensusQuestionnaires")
        .findOne({
          _id: params._id,
        });

      let updates = { ...foundSmallholderCensusQuestionnaire };
      delete updates._id;
      delete updates.year;
      // updates.year = params.targetYear;
      delete updates._updatedAt;
      delete updates._createdAt;
      // console.log({ updates });
      await context.collection("SmallholderCensusQuestionnaires").updateOne(
        {
          year: params.targetYear,
          ...NOT_DELETED_DOCUMENT_QUERY,
        },
        {
          $setOnInsert: {
            year: params.targetYear,
            // ...updates,
            _id: uuidv4(),
            _createdAt: new Date().toISOString(),
          },
          $set: {
            ...updates,
            _updatedAt: new Date().toISOString(),
          },
        },
        {
          upsert: true,
        },
      );
      return "success";
    },

    createSmallholderCensusQuestionnaireData: async (self, params, context) => {
      const localRegion = await context.collection("Regions").findOne({
        _id: params.localRegionId,
      });
      const smallholder = await context.collection("Smallholders").findOne({
        _id: params.smallholderId,
      });

      await context.collection("SmallholderCensusQuestionnaires").createIndex({
        year: 1,
      });
      const questionnaire = await context
        .collection("SmallholderCensusQuestionnaires")
        .findOne({ year: params.year, ...NOT_DELETED_DOCUMENT_QUERY });

      // ################################
      let foundQuestions = await context
        .collection("SmallholderCensusQuestions")
        .find({
          _id: {
            $in: questionnaire.questionIds,
          },
        })
        .toArray();
      let questions = questionnaire.questionIds
        .map(id => foundQuestions.find(q => q._id === id))
        .filter(item => !!item);
      // console.log({ questions }, questionnaire.questionIds, questions);
      // ################################

      const newSmallholderCensusQuestionnaireData = {
        _id: uuidv4(),
        ...params,
        localRegion,
        smallholder,
        questionnaireId: questionnaire._id,
        questionIds: questionnaire.questionIds || [],
        questions,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };
      await context
        .collection("SmallholderCensusQuestionnaireData")
        .insertOne(newSmallholderCensusQuestionnaireData);

      const foundSmallholderCensusQuestionnaireData =
        newSmallholderCensusQuestionnaireData;
      // console.log({ foundSmallholderCensusQuestionnaireData, result });

      // let questions = await context
      //   .collection("SmallholderCensusQuestions")
      //   .find({
      //     _id: {
      //       $in: Object.keys(foundSmallholderCensusQuestionnaireData.data),
      //     },
      //   })
      //   .toArray();
      // questions = questions.reduce((all, question) => {
      //   all[question._id] = question;
      //   return all;
      // }, {});
      // console.log({ questions });

      for (const questionId in foundSmallholderCensusQuestionnaireData.data) {
        const dataValue =
          foundSmallholderCensusQuestionnaireData.data[questionId];
        // const question = questions[questionId];
        // console.log({ question, questionId, dataValue });

        await context.collection("SmallholderCensusQuestionData").updateOne(
          {
            questionId,
            dataId: foundSmallholderCensusQuestionnaireData._id,
          },
          {
            $setOnInsert: {
              _id: uuidv4(),
              questionId,
              dataId: foundSmallholderCensusQuestionnaireData._id,
              _createdAt: new Date().toISOString(),
            },
            $set: {
              dataValue,
              _updatedAt: new Date().toISOString(),
            },
          },
          {
            upsert: true,
          },
        );
      }

      return newSmallholderCensusQuestionnaireData;
      // return "success";
    },
    updateSmallholderCensusQuestionnaireData: async (self, params, context) => {
      let updates = {
        ...params,
      };

      if (updates.localRegionId) {
        const localRegion = await context.collection("Regions").findOne({
          _id: updates.localRegionId,
        });
        updates.localRegion = localRegion;
      }
      if (updates.smallholderId) {
        const smallholder = await context.collection("Smallholders").findOne({
          _id: params.smallholderId,
        });
        updates.smallholder = smallholder;
      }

      let result = await context
        .collection("SmallholderCensusQuestionnaireData")
        .findOneAndUpdate(
          {
            _id: updates._id,
          },
          {
            $set: {
              ...updates,
              _updatedAt: new Date().toISOString(),
            },
          },
          {
            returnOriginal: false,
            returnNewDocument: true,
          },
        );
      const foundSmallholderCensusQuestionnaireData = result.value;
      // console.log({ foundSmallholderCensusQuestionnaireData, result });

      // let questions = await context
      //   .collection("SmallholderCensusQuestions")
      //   .find({
      //     _id: {
      //       $in: Object.keys(foundSmallholderCensusQuestionnaireData.data),
      //     },
      //   })
      //   .toArray();
      // questions = questions.reduce((all, question) => {
      //   all[question._id] = question;
      //   return all;
      // }, {});
      // console.log({ questions });

      for (const questionId in foundSmallholderCensusQuestionnaireData.data) {
        const dataValue =
          foundSmallholderCensusQuestionnaireData.data[questionId];
        // const question = questions[questionId];
        // console.log({ question, questionId, dataValue });

        await context.collection("SmallholderCensusQuestionData").updateOne(
          {
            questionId,
            dataId: foundSmallholderCensusQuestionnaireData._id,
          },
          {
            $setOnInsert: {
              _id: uuidv4(),
              questionId,
              dataId: foundSmallholderCensusQuestionnaireData._id,
              _createdAt: new Date().toISOString(),
            },
            $set: {
              dataValue,
              _updatedAt: new Date().toISOString(),
            },
          },
          {
            upsert: true,
          },
        );
      }

      return "success";
    },
    deleteSmallholderCensusQuestionnaireData: async (self, params, context) => {
      await context.collection("SmallholderCensusQuestionnaireData").updateOne(
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

    // ################################################################################

    createSmallholderCensusForm: async (self, params, context) => {
      const newSmallholderCensusForm = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };
      await context
        .collection("SmallholderCensusForms")
        .insertOne(newSmallholderCensusForm);
      return "success";
    },
    updateSmallholderCensusForm: async (self, params, context) => {
      await context.collection("SmallholderCensusForms").updateOne(
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
    deleteSmallholderCensusForm: async (self, params, context) => {
      await context.collection("SmallholderCensusForms").updateOne(
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

    copySmallholderCensusForm: async (self, params, context) => {
      const foundSmallholderCensusForm = await context
        .collection("SmallholderCensusForms")
        .findOne({
          _id: params.sourceFormId,
        });

      const newSmallholderCensusForm = {
        ...foundSmallholderCensusForm,
        ...params,
        _id: uuidv4(),
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };
      await context
        .collection("SmallholderCensusForms")
        .insertOne(newSmallholderCensusForm);

      return "success";
    },

    generateSmallholderCensusFormPDF: async (self, params, context) => {
      const foundForm = await context
        .collection("SmallholderCensusForms")
        .findOne({
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

    createSmallholderCensusFormFilling: async (self, params, context) => {
      const newSmallholderCensusFormFilling = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };
      await context
        .collection("SmallholderCensusFormFillings")
        .insertOne(newSmallholderCensusFormFilling);

      return newSmallholderCensusFormFilling;
    },
    updateSmallholderCensusFormFilling: async (self, params, context) => {
      // console.log({ params });
      let updates = {};
      if (params.smallholderId) {
        const foundSmallholder = await context
          .collection("Smallholders")
          .findOne({
            _id: params.smallholderId,
          });
        if (foundSmallholder) {
          updates.smallholder = foundSmallholder;
        }
      }
      await context.collection("SmallholderCensusFormFillings").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            ...params,
            ...updates,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    deleteSmallholderCensusFormFilling: async (self, params, context) => {
      await context.collection("SmallholderCensusFormFillings").updateOne(
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

    generateMalaysianSmallholderReport: generateSabahSmallholderReport,
    generateSemenanjungSmallholderReport: async (self, params, context) => {
      // return generateMalaysianSmallholderReport(
      //   self,
      //   { ...params, segment: "Semenanjung" },
      //   context,
      // );
      return generateSabahSmallholderReport(
        self,
        { ...params, segment: "Semenanjung" },
        context,
      );
    },
    generateSabahSmallholderReport: async (self, params, context) => {
      return generateSabahSmallholderReport(
        self,
        { ...params, segment: "Sabah" },
        context,
      );
    },
    generateSarawakSmallholderReport: async (self, params, context) => {
      return generateSabahSmallholderReport(
        self,
        { ...params, segment: "Sarawak" },
        context,
      );
    },
  },

  SmallholderCensusFormFilling: {
    smallholder: async (self, params, context) => {
      if (!self.smallholderId) return null;
      if (self.smallholder) return self.smallholder;
      return await context.collection("Smallholders").findOne({
        _id: self.smallholderId,
      });
    },
  },

  SmallholderCensusQuestionnaire: {
    questions: async (self, params, context) => {
      if (self.questions) {
        return self.questions.map(question => {
          return {
            ...question,
            // _id: uuidv4(),
          };
        });
      }

      let foundQuestions = await context
        .collection("SmallholderCensusQuestions")
        .find({
          _id: {
            $in: self.questionIds,
          },
        })
        .toArray();
      let questions = self.questionIds
        .map(id => foundQuestions.find(q => q._id === id))
        .filter(item => !!item);
      // console.log({ questions }, self.questionIds, questions);
      return questions;
    },
  },

  SmallholderCensusQuestionnaireData: {
    questions: async (self, params, context) => {
      if (self.questions) {
        return self.questions.map(question => {
          return {
            ...question,
            // _id: uuidv4(),
          };
        });
      }

      let foundQuestions = await context
        .collection("SmallholderCensusQuestions")
        .find({
          _id: {
            $in: self.questionIds,
          },
        })
        .toArray();
      let questions = self.questionIds
        .map(id => foundQuestions.find(q => q._id === id))
        .filter(item => !!item);
      // console.log({ questions }, self.questionIds, questions);
      return questions;
    },
  },
};
exports.resolvers = resolvers;
