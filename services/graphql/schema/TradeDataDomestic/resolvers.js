const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const dayjs = require("dayjs");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const mime = require("mime");
const shelljs = require("shelljs");
const { assertValidSession } = require("../../authentication");
const FlexSearch = require("flexsearch");
const lodash = require("lodash");
const {
  generateDomesticTradeExportImportReport,
  generateDomesticTradeExportDestinationSourceReport,
  generateDomesticTradeContributionOfExportByRegionReport,
  generateDomesticTradeCocoaBeansExportReport,
  generateDomesticTradeExportImportSelectedCountryReport,
} = require("./reports");

const MONTHS = [
  { monthName: "January", month: 1 },
  { monthName: "February", month: 2 },
  { monthName: "March", month: 3 },
  { monthName: "April", month: 4 },
  { monthName: "May", month: 5 },
  { monthName: "June", month: 6 },
  { monthName: "July", month: 7 },
  { monthName: "August", month: 8 },
  { monthName: "September", month: 9 },
  { monthName: "October", month: 10 },
  { monthName: "November", month: 11 },
  { monthName: "December", month: 12 },
];

const resolvers = {
  Query: {
    allTradeDataDomestics: async (self, params, context) => {
      await context.collection("DomesticTradeDatas").createIndex({ year: 1, _createdAt: -1 });

      const results = await context
        .collection("DomesticTradeDatas")
        .find({
          year: params.years
            ? {
              $in: params.years.map(year => parseInt(year)),
            }
            : parseInt(params.year || dayjs().format("YYYY")),
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          _createdAt: -1,
        })
        .toArray();
      return results
    },
    countAllTradeDataDomestic: async (self, params, context) => {
      await context.collection("DomesticTradeDatas").createIndex({ year: 1 });

      return await context
        .collection("DomesticTradeDatas")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .count();
    },
  },
  Mutation: {
    createTradeDataDomestic: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const saveFileDir = process.cwd() + "/public/cache";

      if (!fs.existsSync(saveFileDir)) {
        fs.mkdirSync(saveFileDir);
      }

      let newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context
        .collection("DomesticTradeDatas")
        .findOne({
          type: newData.type,
          year: newData.year,
          countryId: newData.countryId,
          localSITCProductId: newData.localSITCProductId,
          month: newData.month,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        // console.log(foundExisted);
        throw new Error("Duplicate Type, Country, Year, Month, and SITC");
      }

      if (newData.countryId) {
        const country = await context.collection("Countries").findOne({
          _id: newData.countryId,
        });
        newData.countryName = country.name;
      }

      if (newData.localSITCProductId) {
        const sitcProduct = await context
          .collection("LocalSITCProducts")
          .findOne({
            _id: newData.localSITCProductId,
          });
        newData.localSITCCode = sitcProduct.sitcCode;
        newData.localSITCProduct = sitcProduct.product;
      }

      if (newData.infoStatusId) {
        const infoStatus = await context.collection("InfoStatuses").findOne({
          _id: newData.infoStatusId,
        });
        newData.infoStatusName = infoStatus.description;
      }

      let urlFile = "";
      if (params.attachmentFileUrl) {
        // const mimeType = base64MimeType(params.attachmentFileUrl);

        const buf = Buffer.from(
          params.attachmentFileUrl.split("base64,")[1],
          // base64string.replace(/^data:image\/\w+;base64,/, ""),
          "base64",
        );

        fs.writeFileSync(`${saveFileDir}/${newData._id}.xlsx`, buf);

        urlFile = `${saveFileDir}/${newData._id}.xlsx`;
      }
      newData["attachmentFileUrl"] = urlFile;

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticTradeDatas",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("DomesticTradeDatas").insertOne(newData);
      return "success";
    },
    updateTradeDataDomestic: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const saveFileDir = process.cwd() + "/public/cache";

      if (!fs.existsSync(saveFileDir)) {
        fs.mkdirSync(saveFileDir);
      }

      let updateObject = {};
      if (params.countryId) {
        const country = await context.collection("Countries").findOne({
          _id: params.countryId,
        });
        updateObject.countryName = country.name;
      }

      if (params.localSITCProductId) {
        const sitcProduct = await context
          .collection("LocalSITCProducts")
          .findOne({
            _id: params.localSITCProductId,
          });
        updateObject.localSITCCode = sitcProduct.sitcCode;
        updateObject.localSITCProduct = sitcProduct.product;
      }

      if (params.infoStatusId) {
        const infoStatus = await context.collection("InfoStatuses").findOne({
          _id: params.infoStatusId,
        });
        updateObject.infoStatusName = infoStatus.description;
      }

      let urlFile = "";
      if (params.attachmentFileUrl) {
        // const mimeType = base64MimeType(params.attachmentFileUrl);

        const buf = Buffer.from(
          params.attachmentFileUrl.split("base64,")[1],
          // base64string.replace(/^data:image\/\w+;base64,/, ""),
          "base64",
        );

        fs.writeFileSync(`${saveFileDir}/${params._id}.xlsx`, buf);

        urlFile = `${saveFileDir}/${params._id}.xlsx`;
      }

      const found = await context.collection("DomesticTradeDatas").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticTradeDatas",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...params,
          ...updateObject,
          attachmentFileUrl: urlFile,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("DomesticTradeDatas").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            ...updateObject,
            ...params,
            attachmentFileUrl: urlFile,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    deleteTradeDataDomestic: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("DomesticTradeDatas").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "DomesticTradeDatas",
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

      await context.collection("DomesticTradeDatas").updateOne(
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
    importTradeDataDomestic: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      let domesticTradeDatas = await context
        .collection("DomesticTradeDatas")
        .find({
          year: params.year,
          month: params.month,
          type: params.type,
          _deletedAt: { $exists: false },
        })
        .toArray();

      domesticTradeDatas = domesticTradeDatas.map(data => {
        return {
          ...data,
          value: lodash.round(data.value, 0),
          quantity: lodash.round(data.quantity, 0),
        };
      });

      const indexedDomesticTradeDatas = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: [
            "countryId",
            "sitcCode",
            "localSITCProductId",
            "localSITCCode",
            "value",
            "quantity",
          ],
        },
      });
      indexedDomesticTradeDatas.add(domesticTradeDatas);

      // ==================================================================================
      // ================================================= GRAB THEN SAVE

      // const saveFileDir = path.join(process.cwd(), "/public/trade_data_file");

      // if (!fs.existsSync(saveFileDir)) {
      //   fs.mkdirSync(saveFileDir);
      // }

      if (!fs.existsSync(path.join(process.cwd(), "/../app/public/cache/"))) {
        fs.mkdirSync(path.join(process.cwd(), "/../app/public/cache"), {
          recursive: true,
        });
      }
      let saveFileDir = path.join(process.cwd(), "/../app/public/cache");

      // const PREFIX = "SEPv2";

      // let saveFileDir = "";
      // if (!fs.existsSync(process.cwd() + "/static/cache/")) {
      //   saveFileDir = process.cwd() + "/static/cache/";
      //   fs.mkdirSync(process.cwd() + "/static/cache/");
      // }
      // if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
      //   saveFileDir = process.cwd() + `/static/cache/${PREFIX}`;
      //   fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
      // }

      const ContentType = base64MimeType(params.excelBase64);
      const fileId = uuidv4();
      const filename = params.fileName;

      // const filename = `${params.fileName}.` + mime.getExtension(ContentType);

      const buf = Buffer.from(params.excelBase64.split("base64,")[1], "base64");
      const type = params.excelBase64.split(";")[0].split("/")[1];
      fs.writeFileSync(saveFileDir + "/" + filename, buf);

      // ==================================================================================
      // ================================================= LOAD XLSX FILE
      let workbook = new Excel.Workbook();
      await workbook.xlsx.readFile(saveFileDir + "/" + filename);

      let worksheet = workbook.getWorksheet("Template");
      if (!worksheet) {
        worksheet = workbook.getWorksheet("template");
      }

      if (!worksheet) {
        throw new Error(`Worksheet "Template/template" not found`);
      }
      let keys = [];
      let data = [];
      worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
        if (rowNumber === 1) {
          keys = row.values;
        } else {
          let newData = {
            _id: uuidv4(),
          };
          keys.forEach((key, index) => {
            if (key) {
              newData[key] = row.values[index] ? row.values[index] : "";
            }
          });
          // console.log("Row " + rowNumber + " = " + JSON.stringify(row.values));
          data.push(newData);
        }
      });

      let countries = await context
        .collection("Countries")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .toArray();

      countries = countries.map(c => {
        return {
          ...c,
          name: c.name.toUpperCase().trim(),
        };
      });

      let products = await context
        .collection("LocalSITCProducts")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .toArray();

      products = products.map(p => {
        return {
          ...p,
          asitcCode: p.asitcCode.trim(),
          sitcCode: p.sitcCode.trim(),
        };
      });
      let infoStatusCode = await context
        .collection("InfoStatuses")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .toArray();

      infoStatusCode = infoStatusCode.map(i => {
        return {
          ...i,
          code: i.code.toUpperCase().trim(),
        };
      });

      let missingData = [];
      let fixedData = [];
      let counter = 1;

      let savedData = [];
      for (const newData of data) {
        counter += 1;
        let newImporTradeData = {
          _id: uuidv4(),
          year: params.year,
          type: params.type,
          month: params.month,
          monthName: params.monthName,
          fileName: params.fileName,
          ...mapImporKeys(newData),
          missingMessages: [],
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
        };

        if (!newImporTradeData.quantity) {
          newImporTradeData.quantity = 0;
        } else {
          newImporTradeData.quantity = lodash.round(
            parseFloat(newImporTradeData.quantity),
            2,
          );
        }

        if (!newImporTradeData.value) {
          newImporTradeData.value = 0;
        } else {
          newImporTradeData.value = lodash.round(
            parseFloat(newImporTradeData.value),
            0,
          );
        }

        //##### Check Missing Data #####//
        // if (!newImporTradeData.year) {
        //   newImporTradeData.missingMessages.push("Invalid Year");
        // }

        // if (!newImporTradeData.type) {
        //   newImporTradeData.missingMessages.push("Invalid Type");
        // }

        // let isImport = false;
        // let isExport = false;

        // if (newImporTradeData.type === "Import") {
        //   isImport = true;
        // } else if (newImporTradeData.type === "Export") {
        //   isExport = true;
        // }

        // if (!isImport && !isExport) {
        //   newImporTradeData.missingMessages.push("Invalid Type");
        // }

        // if (!newImporTradeData.monthName) {
        //   newImporTradeData.missingMessages.push("Invalid Month");
        // } else if (newImporTradeData.monthName) {
        //   const foundMonth = MONTHS.find(
        //     m => m.monthName === newImporTradeData.monthName,
        //   );

        //   if (!foundMonth) {
        //     newImporTradeData.missingMessages.push("Invalid Month");
        //   }
        // }

        if (!newImporTradeData.countryName) {
          throw new Error("Contry Name not Inserted. Excel Row " + counter);
          // newImporTradeData.missingMessages.push("Invalid Country");
        } else if (newImporTradeData.countryName) {
          const foundCountry = countries.find(
            c => c.name === newImporTradeData.countryName.toUpperCase().trim(),
          );
          if (!foundCountry) {
            // newImporTradeData.missingMessages.push(
            //   `Country ${newImporTradeData.countryName} Not Found`,
            // );
            throw new Error(
              `Country ${newImporTradeData.countryName} Not Found at Master Data/Location/Country. Excel Row ` +
              counter,
            );
          }
        }
        if (!newImporTradeData.sitcCode) {
          // throw new Error("Invalid SITC Code")
          // newImporTradeData.missingMessages.push("Invalid SITC Code");
          throw new Error("SITC Code not Inserted. Excel Row " + counter);
        } else if (newImporTradeData.sitcCode) {
          newImporTradeData.sitcCode = "" + newImporTradeData.sitcCode;
          newImporTradeData.sitcCode = newImporTradeData.sitcCode
            .split(".")
            .join("");
          newImporTradeData.sitcCode = String(newImporTradeData.sitcCode);
          const foundProduct = products.find(
            p => p.asitcCode === newImporTradeData.sitcCode,
          );

          if (!foundProduct) {
            // throw new Error(`Product With SITC Code ${newImporTradeData.sitcCode} not found`)
            // newImporTradeData.missingMessages.push(
            //   `Product With SITC Code ${newImporTradeData.sitcCode} not found`,
            // );
            throw new Error(
              `Product With SITC Code ${newImporTradeData.sitcCode} not found at Master Data/Product/Local Product. Excel row ` +
              counter,
            );
          }
        }

        if (newImporTradeData.missingMessages.length === 0) {
          delete newImporTradeData.missingMessages;
          fixedData.push(newImporTradeData);
        } else {
          missingData.push(newImporTradeData);
        }
      }

      if (fixedData.length === 0) {
        throw new Error("No Fixed Data Found");
      }
      if (fixedData.length > 0) {
        //Save Fixed Data
        for (const fixed of fixedData) {
          counter += 1;
          const country = countries.find(
            c => c.name === fixed.countryName.toUpperCase().trim(),
          );
          const sitcProduct = products.find(
            p => p.asitcCode === fixed.sitcCode,
          );

          let infoStatus = null;
          if (fixed.infoStatusCode) {
            infoStatus = infoStatusCode.find(
              s => s.code === fixed.infoStatusCode.toUpperCase().trim(),
            );
          }

          const m = MONTHS.find(mt => mt.monthName === fixed.monthName);
          const data = {
            ...fixed,
            year: parseInt(fixed.year),
            tradeDataImportLogFileId: fileId,
            countryId: country._id,
            countryName: country.name,
            localSITCProductId: sitcProduct._id,
            localSITCCode: sitcProduct.sitcCode,
            localSITCProduct: sitcProduct.product,
            infoStatusId: infoStatus?._id || "",
            infoStatusName: infoStatus?.description || "",
            month: m.month,
            attachmentFileUrl: saveFileDir + "/" + filename,
          };

          const foundDuplicate = indexedDomesticTradeDatas.where({
            countryId: data.countryId,
            sitcCode: data.sitcCode,
            localSITCProductId: data.localSITCProductId,
            localSITCCode: data.localSITCCode,
            value: data.value,
            quantity: data.quantity,
          });
          if (foundDuplicate.length > 0) {
            throw new Error(`Duplicate data on Excel Row ${counter}`);
          }

          const payload = {
            _id: uuidv4(),
            affectedCollectionName: "DomesticTradeDatas",
            affectedDocumentId: data._id,
            dataBeforeChanges: data,
            dataAfterChanges: data,
            modifiedBy: context.activeSession.User,
            timeStamp: new Date().toISOString(),
            action: "CREATE",
          };
          await context.collection("ActivityLogs").insertOne(payload);
          savedData.push(data);

          // await context.collection("DomesticTradeDatas").insertOne(data);
        }
      }

      if (savedData.length > 0) {
        await context.collection("DomesticTradeDatas").insertMany(savedData);
      }

      if (missingData.length > 0) {
        for (const missing of missingData) {
          const messages = missing.missingMessages.join(", ");
          let country = null;
          if (messages.includes("Invalid Country")) {
            country = null;
          } else {
            country = countries.find(
              c => c.name === missing.countryName.toUpperCase().trim(),
            );
          }

          let year = 0;
          if (messages.includes("Invalid Year")) {
            year = 0;
          } else {
            year = parseInt(missing.year);
          }

          let sitcProduct = null;
          if (messages.includes("SITC")) {
            sitcProduct = null;
          } else {
            sitcProduct = products.find(p => p.asitcCode === missing.sitcCode);
          }

          let infoStatus = null;
          if (missing.infoStatusCode) {
            infoStatus = infoStatusCode.find(
              s => s.code === missing.infoStatusCode.toUpperCase().trim(),
            );
          }

          let month = 0;

          if (messages.includes("Month")) {
            month = 0;
          } else {
            const m = MONTHS.find(mt => mt.monthName === missing.monthName);
            month = m.month;
          }
          const data = {
            ...missing,
            type: missing.type,
            tradeDataImportLogFileId: fileId,
            countryId: country?._id || "",
            localSITCProductId: sitcProduct?._id || "",
            infoStatusId: infoStatus?._id || "",
            month,
            attachmentFileUrl: saveFileDir + "/" + filename,
            missingMessages: missing.missingMessages,
          };

          const payload = {
            _id: uuidv4(),
            affectedCollectionName: "MissingDomesticTradeData",
            affectedDocumentId: data._id,
            dataBeforeChanges: data,
            dataAfterChanges: data,
            modifiedBy: context.activeSession.User,
            timeStamp: new Date().toISOString(),
            action: "CREATE",
          };
          await context.collection("ActivityLogs").insertOne(payload);

          await context.collection("MissingDomesticTradeData").insertOne(data);
        }
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "TradeDataImportLogFile",
        affectedDocumentId: fileId,
        dataBeforeChanges: {
          _id: fileId,
          type: "DOMESTIC",
          urlFile: saveFileDir + "/" + filename,
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
        },
        dataAfterChanges: {
          _id: fileId,
          type: "DOMESTIC",
          urlFile: saveFileDir + "/" + filename,
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("TradeDataImportLogFile").insertOne({
        _id: fileId,
        type: "DOMESTIC",
        urlFile: saveFileDir + "/" + filename,
        fileName: params.fileName,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      });
      return {
        countMissingData: 0, //missingData.length,
        countFixedData: fixedData.length,
      };
    },
    exportTradeDataDomestic: async (self, params, context) => {
      await context.collection("DomesticTradeDatas").createIndex({
        year: 1,
        month: 1,
        countryId: 1,
      });

      const tradeDatas = await context
        .collection("DomesticTradeDatas")
        .find({
          year: {
            $in: params.year,
          },
          monthName: {
            $in: params.monthName,
          },
          type: {
            $in: params.type,
          },
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          _createdAt: -1,
        })

        .toArray();

      const country = await context
        .collection("Countries")
        .find({
          _id: {
            $in: tradeDatas.map(t => t.countryId),
          },
        })
        .toArray();

      const indexedCountry = country.reduce((all, c) => {
        if (!all[c._id]) {
          all[c._id] = {};
        }
        all[c._id] = c;
        return all;
      }, {});

      const localSITCProducts = await context
        .collection("LocalSITCProducts")
        .find({
          _id: {
            $in: tradeDatas.map(t => t.localSITCProductId),
          },
        })
        .toArray();

      const indexedProduct = localSITCProducts.reduce((all, prod) => {
        if (!all[prod._id]) {
          all[prod._id] = {};
        }
        all[prod._id] = prod;
        return all;
      }, {});

      const allInfoStatuses = await context
        .collection("InfoStatuses")
        .find({
          _id: {
            $in: tradeDatas.map(t => t.infoStatusId),
          },
        })
        .toArray();

      const indexedInfoStatus = allInfoStatuses.reduce((all, stat) => {
        if (!all[stat._id]) {
          all[stat._id] = {};
        }
        all[stat._id] = stat;
        return all;
      }, {});

      let tradeDataWorkbook = new Excel.Workbook();
      tradeDataWorkbook.creator = "SEP V2";
      let tradeDataSheet = tradeDataWorkbook.addWorksheet("Template");

      //################ Drawing Header  ########################
      //##########################################################
      //#########################################################

      let columnWidths = [20, 20, 20, 40, 40, 40, 40];
      let headerRow = [
        "YEAR",
        "TYPE",
        "MONTH",
        "COUNTRY NAME",
        "LOCAL SITC PRODUCT CODE",
        "QUANTITY",
        "VALUE",
      ];

      let colCounter = 0;
      columnWidths.forEach(width => {
        const column = ++colCounter;
        excelHelper.setColumnWidth({
          sheet: tradeDataSheet,
          column,
          width,
        });
      });

      colCounter = 0;
      headerRow.forEach(data => {
        excelHelper.addText({
          sheet: tradeDataSheet,
          row: 1,
          col: ++colCounter,
          value: data.toUpperCase(),
          font: { bold: true },
          alignment: {
            vertical: "middle",
            horizontal: "center",
          },
          borderStyle: excelHelper.BorderStyle.Thin,
        });
      });

      colCounter = 0;
      let rowCounter = 1;
      for (const trade of tradeDatas) {
        rowCounter += 1;
        const foundCountry = indexedCountry[trade.countryId];
        const product = indexedProduct[trade.localSITCProductId];
        const infoStatus = indexedInfoStatus[trade.infoStatusId];

        excelHelper.addText({
          sheet: tradeDataSheet,
          row: rowCounter,
          col: ++colCounter,
          value: trade.year,
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });
        excelHelper.addText({
          sheet: tradeDataSheet,
          row: rowCounter,
          col: ++colCounter,
          value: trade.type,
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        excelHelper.addText({
          sheet: tradeDataSheet,
          row: rowCounter,
          col: ++colCounter,
          value: trade.monthName,
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });
        excelHelper.addText({
          sheet: tradeDataSheet,
          row: rowCounter,
          col: ++colCounter,
          value: foundCountry ? foundCountry.name.toUpperCase() : "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        excelHelper.addText({
          sheet: tradeDataSheet,
          row: rowCounter,
          col: ++colCounter,
          value: product?.asitcCode || "",
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        excelHelper.addText({
          sheet: tradeDataSheet,
          row: rowCounter,
          col: ++colCounter,
          value: trade?.quantity || 0,
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        excelHelper.addText({
          sheet: tradeDataSheet,
          row: rowCounter,
          col: ++colCounter,
          value: trade?.value || 0,
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });
        colCounter = 0;
      }
      // await tradeDataWorkbook.xlsx.writeFile(
      //   __dirname + "/exportTradeDataDomestic.xlsx",
      // );

      // // Cek jika ada folder static/template

      // const staticFolder = process.cwd() + "/static/template";

      // if (!fs.existsSync(staticFolder)) {
      //   shelljs.mkdir("-p", staticFolder);
      // }

      // shelljs.exec(
      //   `cp ${__dirname}/exportTradeDataDomestic.xlsx static/template/`,
      // );
      // // shelljs.exec(`rm ${__dirname}/FORMAT_IMPOR_SISWA.xlsx`);
      // // shelljs.exec(`mv ${__dirname}/exportStudent.xlsx`);

      // const bitmap = fs.readFileSync(
      //   `static/template/exportTradeDataDomestic.xlsx`,
      // );

      // const xlsx64 = new Buffer(bitmap).toString("base64");
      // return xlsx64;

      const PREFIX = "SEPv2";

      if (!fs.existsSync(process.cwd() + "/static/cache/")) {
        fs.mkdirSync(process.cwd() + "/static/cache/");
      }
      if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
        fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
      }
      const filename = `exportTradeDataDomestic.xlsx`;

      const fileUrl =
        `/lkm/cache/${PREFIX}/${filename}?t=` + new Date().toISOString();
      const folderPath = path.join(
        process.cwd(),
        `../app/public/cache/${PREFIX}`,
      );
      fs.mkdirSync(folderPath, {
        recursive: true,
      });
      const filePath = path.join(
        process.cwd(),
        `../app/public/cache/${PREFIX}/${filename}`,
      );
      // console.log({ folderPath, fileUrl, filePath });
      await tradeDataWorkbook.xlsx.writeFile(filePath);

      return fileUrl;
    },
    previewImportTradeDataDomestic: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      let domesticTradeDatas = await context
        .collection("DomesticTradeDatas")
        .find({
          year: params.year,
          month: params.month,
          type: params.type,
          _deletedAt: { $exists: false },
        })
        .toArray();

      domesticTradeDatas = domesticTradeDatas.map(data => {
        return {
          ...data,
          value: lodash.round(data.value, 0),
          quantity: lodash.round(data.quantity, 0),
        };
      });

      const indexedDomesticTradeDatas = new FlexSearch({
        tokenize: "strict",
        doc: {
          id: "_id",
          field: [
            "countryId",
            "sitcCode",
            "localSITCProductId",
            "localSITCCode",
            "value",
            "quantity",
          ],
        },
      });
      indexedDomesticTradeDatas.add(domesticTradeDatas);

      // ==================================================================================
      // ================================================= GRAB THEN SAVE

      // const saveFileDir = path.join(process.cwd(), "/public/trade_data_file");

      // if (!fs.existsSync(saveFileDir)) {
      //   fs.mkdirSync(saveFileDir);
      // }

      if (!fs.existsSync(path.join(process.cwd(), "/../app/public/cache/"))) {
        fs.mkdirSync(path.join(process.cwd(), "/../app/public/cache"), {
          recursive: true,
        });
      }
      let saveFileDir = path.join(process.cwd(), "/../app/public/cache");

      // const PREFIX = "SEPv2";

      // let saveFileDir = "";
      // if (!fs.existsSync(process.cwd() + "/static/cache/")) {
      //   saveFileDir = process.cwd() + "/static/cache/";
      //   fs.mkdirSync(process.cwd() + "/static/cache/");
      // }
      // if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
      //   saveFileDir = process.cwd() + `/static/cache/${PREFIX}`;
      //   fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
      // }

      const ContentType = base64MimeType(params.excelBase64);
      const fileId = uuidv4();
      const filename = params.fileName;

      // const filename = `${params.fileName}.` + mime.getExtension(ContentType);

      const buf = Buffer.from(params.excelBase64.split("base64,")[1], "base64");
      const type = params.excelBase64.split(";")[0].split("/")[1];
      fs.writeFileSync(saveFileDir + "/" + filename, buf);

      // ==================================================================================
      // ================================================= LOAD XLSX FILE
      let workbook = new Excel.Workbook();
      await workbook.xlsx.readFile(saveFileDir + "/" + filename);

      let worksheet = workbook.getWorksheet("Template");
      if (!worksheet) {
        worksheet = workbook.getWorksheet("template");
      }

      if (!worksheet) {
        throw new Error(`Worksheet "Template/template" not found`);
      }
      let keys = [];
      let data = [];
      worksheet.eachRow({ includeEmpty: false }, function (row, rowNumber) {
        if (rowNumber === 1) {
          keys = row.values;
        } else {
          let newData = {
            _id: uuidv4(),
          };
          keys.forEach((key, index) => {
            if (key) {
              newData[key] = row.values[index] ? row.values[index] : "";
            }
          });
          // console.log("Row " + rowNumber + " = " + JSON.stringify(row.values));
          data.push(newData);
        }
      });

      let countries = await context
        .collection("Countries")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .toArray();

      countries = countries.map(c => {
        return {
          ...c,
          name: c.name.toUpperCase().trim(),
        };
      });

      let products = await context
        .collection("LocalSITCProducts")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .toArray();

      products = products.map(p => {
        return {
          ...p,
          asitcCode: p.asitcCode.trim(),
          sitcCode: p.sitcCode.trim(),
        };
      });
      let infoStatusCode = await context
        .collection("InfoStatuses")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .toArray();

      infoStatusCode = infoStatusCode.map(i => {
        return {
          ...i,
          code: i.code.toUpperCase().trim(),
        };
      });

      let missingData = [];
      let fixedData = [];
      let counter = 1;

      let savedData = [];
      for (const newData of data) {
        counter += 1;
        let newImporTradeData = {
          _id: uuidv4(),
          year: params.year,
          type: params.type,
          month: params.month,
          monthName: params.monthName,
          fileName: params.fileName,
          ...mapImporKeys(newData),
          missingMessages: [],
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
        };

        if (!newImporTradeData.quantity) {
          newImporTradeData.quantity = 0;
        } else {
          newImporTradeData.quantity = lodash.round(
            parseFloat(newImporTradeData.quantity),
            2,
          );
        }

        if (!newImporTradeData.value) {
          newImporTradeData.value = 0;
        } else {
          newImporTradeData.value = lodash.round(
            parseFloat(newImporTradeData.value),
            2,
          );
        }

        //##### Check Missing Data #####//
        // if (!newImporTradeData.year) {
        //   newImporTradeData.missingMessages.push("Invalid Year");
        // }

        // if (!newImporTradeData.type) {
        //   newImporTradeData.missingMessages.push("Invalid Type");
        // }

        // let isImport = false;
        // let isExport = false;

        // if (newImporTradeData.type === "Import") {
        //   isImport = true;
        // } else if (newImporTradeData.type === "Export") {
        //   isExport = true;
        // }

        // if (!isImport && !isExport) {
        //   newImporTradeData.missingMessages.push("Invalid Type");
        // }

        // if (!newImporTradeData.monthName) {
        //   newImporTradeData.missingMessages.push("Invalid Month");
        // } else if (newImporTradeData.monthName) {
        //   const foundMonth = MONTHS.find(
        //     m => m.monthName === newImporTradeData.monthName,
        //   );

        //   if (!foundMonth) {
        //     newImporTradeData.missingMessages.push("Invalid Month");
        //   }
        // }

        if (!newImporTradeData.countryName) {
          throw new Error("Contry Name not Inserted. Excel Row " + counter);
          // newImporTradeData.missingMessages.push("Invalid Country");
        } else if (newImporTradeData.countryName) {
          const foundCountry = countries.find(
            c => c.name === newImporTradeData.countryName.toUpperCase().trim(),
          );
          if (!foundCountry) {
            // newImporTradeData.missingMessages.push(
            //   `Country ${newImporTradeData.countryName} Not Found`,
            // );
            throw new Error(
              `Country ${newImporTradeData.countryName} Not Found at Master Data/Location/Country. Excel Row ` +
              counter,
            );
          }
        }
        if (!newImporTradeData.sitcCode) {
          // throw new Error("Invalid SITC Code")
          // newImporTradeData.missingMessages.push("Invalid SITC Code");
          throw new Error("SITC Code not Inserted. Excel Row " + counter);
        } else if (newImporTradeData.sitcCode) {
          newImporTradeData.sitcCode = "" + newImporTradeData.sitcCode;
          newImporTradeData.sitcCode = newImporTradeData.sitcCode
            .split(".")
            .join("");
          newImporTradeData.sitcCode = String(newImporTradeData.sitcCode);
          const foundProduct = products.find(
            p => p.asitcCode === newImporTradeData.sitcCode,
          );

          if (!foundProduct) {
            // throw new Error(`Product With SITC Code ${newImporTradeData.sitcCode} not found`)
            // newImporTradeData.missingMessages.push(
            //   `Product With SITC Code ${newImporTradeData.sitcCode} not found`,
            // );
            throw new Error(
              `Product With SITC Code ${newImporTradeData.sitcCode} not found at Master Data/Product/Local Product. Excel row ` +
              counter,
            );
          }
        }

        if (newImporTradeData.missingMessages.length === 0) {
          delete newImporTradeData.missingMessages;
          fixedData.push(newImporTradeData);
        } else {
          missingData.push(newImporTradeData);
        }
      }
      counter = 0;

      if (fixedData.length === 0) {
        throw new Error("No Fixed Data Found");
      }
      if (fixedData.length > 0) {
        //Save Fixed Data
        for (const fixed of fixedData) {
          counter += 1;
          const country = countries.find(
            c => c.name === fixed.countryName.toUpperCase().trim(),
          );
          const sitcProduct = products.find(
            p => p.asitcCode === fixed.sitcCode,
          );

          let infoStatus = null;
          if (fixed.infoStatusCode) {
            infoStatus = infoStatusCode.find(
              s => s.code === fixed.infoStatusCode.toUpperCase().trim(),
            );
          }

          const m = MONTHS.find(mt => mt.monthName === fixed.monthName);
          const data = {
            ...fixed,
            year: parseInt(fixed.year),
            tradeDataImportLogFileId: fileId,
            countryId: country._id,
            countryName: country.name,
            localSITCProductId: sitcProduct._id,
            localSITCCode: sitcProduct.sitcCode,
            localSITCProduct: sitcProduct.product,
            infoStatusId: infoStatus?._id || "",
            infoStatusName: infoStatus?.description || "",
            month: m.month,
            attachmentFileUrl: saveFileDir + "/" + filename,
          };

          const foundDuplicate = indexedDomesticTradeDatas.where({
            countryId: data.countryId,
            sitcCode: data.sitcCode,
            localSITCProductId: data.localSITCProductId,
            localSITCCode: data.localSITCCode,
            value: data.value,
            quantity: data.quantity,
          });
          if (foundDuplicate.length > 0) {
            throw new Error(`Duplicate data on Excel Row ${counter}`);
          }

          savedData.push(data);
        }
      }

      return savedData;
    },

    generateDomesticTradeExportImportReport,
    generateDomesticTradeExportDestinationSourceReport,
    generateDomesticTradeContributionOfExportByRegionReport,
    generateDomesticTradeCocoaBeansExportReport,
    generateDomesticTradeExportImportSelectedCountryReport,
  },
  TradeDataDomestic: {
    attachmentFileUrl: self => {
      if (self.attachmentFileUrl) {
        const fileUrl = self.attachmentFileUrl.split("/public");
        return fileUrl[1];
      }
    },
    Country: async (self, params, context) => {
      return await context.collection("Countries").findOne({
        _id: self.countryId,
      });
    },
    LocalSITCProduct: async (self, params, context) => {
      return await context.collection("LocalSITCProducts").findOne({
        _id: self.localSITCProductId,
      });
    },
    InfoStatus: async (self, params, context) => {
      return await context.collection("InfoStatuses").findOne({
        _id: self.infoStatusId,
      });
    },
  },
};
exports.resolvers = resolvers;

const base64MimeType = encoded => {
  var result = null;

  if (typeof encoded !== "string") {
    return result;
  }

  var mime = encoded.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+).*,.*/);
  if (mime && mime.length) {
    result = mime[1];
  }

  return result;
};

const importKeyMap = {
  // YEAR: "year",
  // TYPE: "type",
  // MONTH: "monthName",
  COUNTRY_NAME: "countryName",
  SITC_CODE: "sitcCode",
  PRODUCT_TYPE: "sitcCode",
  "INFO STATUS CODE": "infoStatusCode",
  QUANTITY: "quantity",
  VALUE: "value",
};

const mapImporKeys = data => {
  let mappedData = {};
  Object.keys(data).forEach(key => {
    const mappedKey = importKeyMap[key.trim()];
    if (mappedKey) {
      mappedData[mappedKey] = data[key];
    } else {
      mappedData[key] = data[key];
    }
  });
  return mappedData;
};
