const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const fs = require("fs");
const path = require("path");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const mime = require("mime");
const shelljs = require("shelljs");
const { assertValidSession } = require("../../authentication");

const {
  generateGlobalTradeDataCocoaProductByCountryReport,
  generateGlobalTradeDataCocoaProductByRegionReport,
  generateGlobalTradeDataCocoaProductByRegionPercentageReport,
} = require("./reports");

const resolvers = {
  Query: {
    allTradeDataGlobals: async (self, params, context) => {
      await context.collection("GlobalTradeDatas").createIndex({ year: 1 });
      return await context
        .collection("GlobalTradeDatas")
        .find({
          year: params.years
            ? {
                $in: params.years,
              }
            : params.year,
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .sort({
          _createdAt: -1,
        })
        .toArray();
    },
    countAllTradeDataGlobal: async (self, params, context) => {
      await context.collection("GlobalTradeDatas").createIndex({ year: 1 });
      return await context
        .collection("GlobalTradeDatas")
        .find({
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .count();
    },
  },
  Mutation: {
    createTradeDataGlobal: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      const newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const foundExisted = await context
        .collection("GlobalTradeDatas")
        .findOne({
          type: newData.type,
          year: newData.year,
          countryId: newData.countryId,
          globalSITCProductId: newData.globalSITCProductId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Duplicate Type, Year, Country, Global SITC Product");
      }

      if (newData.countryId) {
        const country = await context.collection("Countries").findOne({
          _id: newData.countryId,
        });
        const countryRegion = await context
          .collection("CountryRegions")
          .findOne({
            _id: country.countryRegionId,
          })
          .toArray();
        newData.countryName = country.name;
        newData.countryRegionName = countryRegion.description;
      }

      if (newData.localSITCProductId) {
        const sitcProduct = await context
          .collection("GlobalSITCProducts")
          .findOne({
            _id: newData.globalSITCProductId,
          });
        newData.globalSITCCode = sitcProduct.sitcCode;
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalTradeDatas",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalTradeDatas").insertOne(newData);
      return "success";
    },
    updateTradeDataGlobal: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      let updateObject = {};

      if (params.countryId) {
        const country = await context.collection("Countries").findOne({
          _id: params.countryId,
        });
        const countryRegion = await context
          .collection("CountryRegions")
          .findOne({
            _id: country.countryRegionId,
          })
        updateObject.countryName = country.name;
        updateObject.countryRegionName = countryRegion.description;
      }

      if (params.localSITCProductId) {
        const sitcProduct = await context
          .collection("GlobalSITCProducts")
          .findOne({
            _id: params.globalSITCProductId,
          });
        updateObject.globalSITCCode = sitcProduct.sitcCode;
      }

      const found = await context.collection("GlobalTradeDatas").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalTradeDatas",
        affectedDocumentId: found._id,
        dataBeforeChanges: found,
        dataAfterChanges: {
          ...found,
          ...params,
          ...updateObject,
          _updatedAt: new Date().toISOString(),
        },
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "UPDATE",
      };
      await context.collection("ActivityLogs").insertOne(payload);

      await context.collection("GlobalTradeDatas").updateOne(
        {
          _id: params._id,
        },
        {
          $set: {
            ...params,
            ...updateObject,
            _updatedAt: new Date().toISOString(),
          },
        },
      );
      return "success";
    },
    deleteTradeDataGlobal: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context.collection("GlobalTradeDatas").findOne({
        _id: params._id,
      });
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "GlobalTradeDatas",
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

      await context.collection("GlobalTradeDatas").updateOne(
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
    importTradeDataGlobal: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      // const saveFileDir = process.cwd() + "/public/trade_data_file";
      const saveFileDir = path.join(process.cwd(), "/public/trade_data_file");

      if (!fs.existsSync(saveFileDir)) {
        fs.mkdirSync(saveFileDir);
      }

      const ContentType = base64MimeType(params.excelBase64);
      const fileId = uuidv4();
      const filename =
        `tmp_global_trade_import_${fileId}.` + mime.getExtension(ContentType);
      const buf = Buffer.from(params.excelBase64.split("base64,")[1], "base64");
      const type = params.excelBase64.split(";")[0].split("/")[1];
      fs.writeFileSync(saveFileDir + "/" + filename, buf);

      // ==================================================================================
      // ================================================= LOAD XLSX FILE
      let workbook = new Excel.Workbook();
      await workbook.xlsx.readFile(saveFileDir + "/" + filename);
      let worksheet = workbook.getWorksheet("Template");
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

      let countryRegion = await context
        .collection("CountryRegions")
        .find({
          _id: {
            $in: countries.map(c => c.countryRegionId),
          },
        })
        .toArray();

      countryRegion = countryRegion.reduce((all, reg) => {
        if (!all[reg._id]) {
          all[reg._id] = {};
        }
        all[reg._id] = reg;
        return all;
      }, {});

      countries = countries.map(country => {
        let countryRegionName = "";
        if (country.countryRegionId && countryRegion[country.countryRegionId]) {
          countryRegionName =
            countryRegion[country.countryRegionId].description;
        }
        return {
          ...country,
          name: country.name.toUpperCase().trim(),
          countryRegionName,
        };
      });

      let products = await context
        .collection("GlobalSITCProducts")
        .find({ ...NOT_DELETED_DOCUMENT_QUERY })
        .toArray();

      products = products.map(p => {
        return {
          ...p,
          sitcCode: p.gsitcCode.trim(),
        };
      });

      let missingData = [];
      let fixedData = [];

      for (const newData of data) {
        let newImporTradeData = {
          _id: uuidv4(),
          year: params.year,
          type: params.type,
          fileName: params.fileName,
          ...mapImporKeys(newData),
          missingMessages: [],
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
        };
        //##### Check Missing Data #####//
        if (typeof newImporTradeData.year === "number") {
          newImporTradeData["year"] = String(newImporTradeData.year);
        }
        if (!newImporTradeData.year) {
          newImporTradeData.missingMessages.push("Invalid Year");
        } else if (
          newImporTradeData.year &&
          !newImporTradeData.year.includes("/")
        ) {
          newImporTradeData.missingMessages.push("Invalid Year");
        }

        if (!newImporTradeData.type) {
          newImporTradeData.missingMessages.push("Invalid Type");
        }

        let isImport = false;
        let isExport = false;

        if (newImporTradeData.type === "Import") {
          isImport = true;
        } else if (newImporTradeData.type === "Export") {
          isExport = true;
        }

        if (!isImport && !isExport) {
          newImporTradeData.missingMessages.push("Invalid Type");
        }
        if (!newImporTradeData.countryName) {
          newImporTradeData.missingMessages.push("Invalid Country");
        } else if (newImporTradeData.countryName) {
          const foundCountry = countries.find(
            c => c.name === newImporTradeData.countryName.toUpperCase().trim(),
          );
          if (!foundCountry) {
            newImporTradeData.missingMessages.push(
              `Country ${newImporTradeData.countryName} Not Found`,
            );
          }
        }
        if (!newImporTradeData.product) {
          newImporTradeData.missingMessages.push("Invalid Product Type");
        } else if (newImporTradeData.product) {
          const foundProduct = products.find(
            p => p.product === newImporTradeData.product,
          );

          if (!foundProduct) {
            newImporTradeData.missingMessages.push(
              `Product Type ${newImporTradeData.product} not found`,
            );
          }
        }

        if (!newImporTradeData.quantity) {
          newImporTradeData.missingMessages.push("Invalid Quantity");
        }

        if (typeof newImporTradeData.quantity !== "number") {
          newImporTradeData.missingMessages.push("Invalid Quantity");
        }

        if (isNaN(newImporTradeData.quantity)) {
          newImporTradeData.quantity = 0;
        }

        if (newImporTradeData.missingMessages.length === 0) {
          delete newImporTradeData.missingMessages;
          fixedData.push(newImporTradeData);
        } else {
          missingData.push(newImporTradeData);
        }
      }

      console.log({ fixedData, missingData });

      // return {
      //   countMissingData: missingData.length,
      //   countFixedData: fixedData.length,
      // };
      if (fixedData.length > 0) {
        //Save Fixed Data
        for (const fixed of fixedData) {
          const country = countries.find(
            c => c.name === fixed.countryName.toUpperCase().trim(),
          );
          const gsitcProduct = products.find(p => p.product === fixed.product);

          const data = {
            ...fixed,
            year: fixed.year,
            tradeDataImportLogFileId: fileId,
            countryId: country._id,
            countryName: country.name,
            countryRegionName: country.countryRegionName,

            globalSITCProductId: gsitcProduct._id,
            globalSITCCode: gsitcProduct.product,
            attachmentFileUrl: saveFileDir + "/" + filename,
          };

          const payload = {
            _id: uuidv4(),
            affectedCollectionName: "GlobalTradeDatas",
            affectedDocumentId: data._id,
            dataBeforeChanges: data,
            dataAfterChanges: data,
            modifiedBy: context.activeSession.User,
            timeStamp: new Date().toISOString(),
            action: "CREATE",
          };
          await context.collection("ActivityLogs").insertOne(payload);

          await context.collection("GlobalTradeDatas").insertOne(data);
        }
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

          let year = "";
          if (messages.includes("Invalid Year")) {
            year = "";
          } else {
            year = missing.year;
          }

          let gsitcProduct = null;
          if (messages.includes("SITC")) {
            gsitcProduct = null;
          } else {
            gsitcProduct = products.find(p => p.product === missing.product);
          }

          let quantity = parseFloat(missing.quantity);
          if (messages.includes("Quantity")) {
            quantity = 0;
          }

          const data = {
            ...missing,
            type: missing.type,
            tradeDataImportLogFileId: fileId,
            countryId: country?._id || "",
            globalSITCProductId: gsitcProduct?._id || "",
            quantity,
            attachmentFileUrl: saveFileDir + "/" + filename,
            missingMessages: missing.missingMessages,
          };

          const payload = {
            _id: uuidv4(),
            affectedCollectionName: "MissingGlobalTradeData",
            affectedDocumentId: data._id,
            dataBeforeChanges: data,
            dataAfterChanges: data,
            modifiedBy: context.activeSession.User,
            timeStamp: new Date().toISOString(),
            action: "CREATE",
          };
          await context.collection("ActivityLogs").insertOne(payload);

          await context.collection("MissingGlobalTradeData").insertOne(data);
        }
      }

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "TradeDataImportLogFile",
        affectedDocumentId: fileId,
        dataBeforeChanges: {
          _id: fileId,
          type: "GLOBAL",
          urlFile: saveFileDir + "/" + filename,
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
        },
        dataAfterChanges: {
          _id: fileId,
          type: "GLOBAL",
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
        type: "GLOBAL",
        urlFile: saveFileDir + "/" + filename,
        fileName: params.fileName,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      });
      return {
        countMissingData: missingData.length,
        countFixedData: fixedData.length,
      };
    },
    exportTradeDataGlobal: async (self, params, context) => {
      await context.collection("GlobalTradeDatas").createIndex({
        year: 1,
        month: 1,
        countryId: 1,
      });

      const tradeDatas = await context
        .collection("GlobalTradeDatas")
        .find({
          year: {
            $in: params.year,
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

      const globalSITCProducts = await context
        .collection("GlobalSITCProducts")
        .find({
          _id: {
            $in: tradeDatas.map(t => t.globalSITCProductId),
          },
        })
        .toArray();

      const indexedProduct = globalSITCProducts.reduce((all, prod) => {
        if (!all[prod.product]) {
          all[prod.product] = {};
        }
        all[prod.product] = prod;
        return all;
      }, {});

      let tradeDataWorkbook = new Excel.Workbook();
      tradeDataWorkbook.creator = "SEP V2";
      let tradeDataSheet = tradeDataWorkbook.addWorksheet("Template");

      //################ Drawing Header  ########################
      //##########################################################
      //#########################################################

      let columnWidths = [20, 20, 20, 40, 40, 40];
      let headerRow = [
        "YEAR",
        "TYPE",
        "COUNTRY NAME",
        "GLOBAL SITC PRODUCT CODE",
        "QUANTITY",
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
        const product = indexedProduct[trade.globalSITCProductId];

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
          value: product?.product || "",
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
          value: trade.quantity,
          alignment: {
            vertical: "middle",
            horizontal: "left",
          },
          // borderStyle: excelHelper.BorderStyle.Thin
        });

        colCounter = 0;
      }

      // await tradeDataWorkbook.xlsx.writeFile(
      //   __dirname + "/exportTradeDataGlobal.xlsx",
      // );

      // // Cek jika ada folder static/template

      // const staticFolder = process.cwd() + "/static/template";

      // if (!fs.existsSync(staticFolder)) {
      //   shelljs.mkdir("-p", staticFolder);
      // }

      // shelljs.exec(
      //   `cp ${__dirname}/exportTradeDataGlobal.xlsx static/template/`,
      // );
      // // shelljs.exec(`rm ${__dirname}/FORMAT_IMPOR_SISWA.xlsx`);
      // // shelljs.exec(`mv ${__dirname}/exportStudent.xlsx`);

      // const bitmap = fs.readFileSync(
      //   `static/template/exportTradeDataGlobal.xlsx`,
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
      const filename = `exportTradeDataGlobal.xlsx`;

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

    generateGlobalTradeDataCocoaProductByCountryReport,
    generateGlobalTradeDataCocoaProductByRegionReport,
    generateGlobalTradeDataCocoaProductByRegionPercentageReport,
  },
  TradeDataGlobal: {
    Country: async (self, params, context) => {
      return await context.collection("Countries").findOne({
        _id: self.countryId,
      });
    },
    GlobalSITCProduct: async (self, params, context) => {
      return await context.collection("GlobalSITCProducts").findOne({
        _id: self.globalSITCProductId,
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
  COUNTRY_NAME: "countryName",
  PRODUCT_TYPE: "product",
  QUANTITY: "quantity",
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
