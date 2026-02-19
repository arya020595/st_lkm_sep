const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { generateProductionAndSalesRepoprt } = require("./report");

const Excel = require("exceljs");
const fs = require("fs");
const shelljs = require("shelljs");
const mime = require("mime");
const bcrypt = require("bcryptjs");
const lodash = require("lodash");
const moment = require("moment");
const excelHelper = require("../../excel");
const { assertValidSession } = require("../../authentication");

const resolvers = {
  Query: {
    allEntrepreneurProductionAndSaleses: async (self, params, context) => {
      const fullYearMonth = params.yearMonth || dayjs().format("YYYY-MM");

      const year = fullYearMonth.split("-")[0];
      const month = fullYearMonth.split("-")[1];

      return await context
        .collection("EntrepreneurProductionAndSaleses")
        .find({
          year: parseInt(year),
          month: parseInt(month),
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();
    },
  },
  Mutation: {
    createEntrepreneurProductionAndSales: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      let newData = {
        _id: uuidv4(),
        ...params,
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      if (newData.stateId) {
        const state = await context.collection("States").findOne({
          _id: newData.stateId,
        });
        newData.stateName = state.description;
      }
      if (newData.entrepreneurId) {
        const entrepreneur = await context.collection("Entrepreneurs").findOne({
          _id: newData.entrepreneurId,
        });
        newData.entrepreneurName = entrepreneur.name;
      }

      const foundExisted = await context
        .collection("EntrepreneurProductionAndSaleses")
        .findOne({
          year: newData.year,
          month: newData.month,
          entrepreneurId: newData.entrepreneurId,
          stateId: newData.stateId,
          ...NOT_DELETED_DOCUMENT_QUERY,
        });

      if (foundExisted) {
        throw new Error("Duplicate Year, Month, State, and Entrepreneur");
      }
      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EntrepreneurProductionAndSaleses",
        affectedDocumentId: newData._id,
        dataBeforeChanges: newData,
        dataAfterChanges: newData,
        modifiedBy: context.activeSession.User,
        timeStamp: new Date().toISOString(),
        action: "CREATE",
      };

      await context.collection("ActivityLogs").insertOne(payload);

      await context
        .collection("EntrepreneurProductionAndSaleses")
        .insertOne(newData);
      return "success";
    },
    updateEntrepreneurProductionAndSales: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }

      let updateObject = {};
      if (params.stateId) {
        const state = await context.collection("States").findOne({
          _id: params.stateId,
        });
        updateObject.stateName = state.description;
      }
      if (params.entrepreneurId) {
        const entrepreneur = await context.collection("Entrepreneurs").findOne({
          _id: params.entrepreneurId,
        });
        updateObject.entrepreneurName = entrepreneur.name;
      }

      const found = await context
        .collection("EntrepreneurProductionAndSaleses")
        .findOne({
          _id: params._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EntrepreneurProductionAndSaleses",
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

      await context.collection("EntrepreneurProductionAndSaleses").updateOne(
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
    deleteEntrepreneurProductionAndSales: async (self, params, context) => {
      assertValidSession(context.activeSession);
      if (!context.activeSession.User) {
        throw new Error("Session End. Please re-login");
      }
      const found = await context
        .collection("EntrepreneurProductionAndSaleses")
        .findOne({
          _id: params._id,
        });

      const payload = {
        _id: uuidv4(),
        affectedCollectionName: "EntrepreneurProductionAndSaleses",
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

      await context.collection("EntrepreneurProductionAndSaleses").updateOne(
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

    generateProductionAndSalesRepoprt,
    exportProductionAndSalesExcel: async (self, params, context) => {
      const fullYearMonth = params.year || dayjs().format("YYYY-MM");

      const year = fullYearMonth.split("-")[0];
      const month = fullYearMonth.split("-")[1];

      await context.collection("EntrepreneurProductionAndSaleses").createIndex({
        year: 1,
        month: 1,
      });
      const listData = await context
        .collection("EntrepreneurProductionAndSaleses")
        .find({
          year: parseInt(year),
          month: parseInt(month),
          ...NOT_DELETED_DOCUMENT_QUERY,
        })
        .toArray();

      let entrepreneurs = await context
        .collection("Entrepreneurs")
        .find({
          _id: {
            $in: listData.entrepreneurId,
          },
        })
        .toArray();

      entrepreneurs = entrepreneurs.reduce((all, ent) => {
        if (!all[ent._id]) {
          all[ent._id] = {};
        }
        all[ent._id] = ent;
        return all;
      }, {});

      let states = await context
        .collection("States")
        .find({
          _id: {
            $in: listData.stateId,
          },
        })
        .toArray();

      states = states.reduce((all, stat) => {
        if (!all[stat._id]) {
          all[stat._id] = {};
        }
        all[stat._id] = stat;
        return all;
      }, {});
      const workbook = new Excel.Workbook();
      workbook.creator = "LKM SEPv2";
      let sheet = workbook.addWorksheet(`Data`);

      const headerRow = [
        "Year",
        "Month",
        "Entrepreneur",

        "State",
        "Coverture Milk",
        "Coverture White",
        "Coverture Dark",
        "Coverture Total",

        "Compound Milk",
        "Compound White",
        "Compound Dark",
        "Compound Total",

        "Total Production",
        "Total Sales",
      ];

      let columnWidths = headerRow.map(h => {
        return 25;
      });

      let colCounter = 0;
      columnWidths.forEach(width => {
        const column = ++colCounter;
        excelHelper.setColumnWidth({
          sheet: sheet,
          column,
          width,
        });
      });

      colCounter = 0;
      headerRow.forEach(data => {
        excelHelper.addText({
          sheet,
          row: 4,
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

      excelHelper.addText({
        sheet,
        row: 1,
        col: 1,
        value: "Entrepreneur - Production And Sales",
        font: { bold: true, size: 12 },
        alignment: {
          vertical: "middle",
          horizontal: "center",
        },
        borderStyle: excelHelper.BorderStyle.Thin,
      });

      colCounter = 0;
      let rowCounter = 5;
      for (const data of listData) {
        if (data.entrepreneurId) {
          const entrepreneur = entrepreneurs[data.entrepreneurId];
          const state = states[data.stateId];
          excelHelper.addText({
            sheet,
            row: rowCounter,
            col: ++colCounter,
            value: data.year,
            font: { bold: false },
            alignment: {
              vertical: "middle",
              horizontal: "center",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });

          excelHelper.addText({
            sheet,
            row: rowCounter,
            col: ++colCounter,
            value: data.monthName,
            font: { bold: false },
            alignment: {
              vertical: "middle",
              horizontal: "center",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });

          excelHelper.addText({
            sheet,
            row: rowCounter,
            col: ++colCounter,
            value: entrepreneur ? entrepreneur.name : "",
            font: { bold: false },
            alignment: {
              vertical: "middle",
              horizontal: "center",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });
          excelHelper.addText({
            sheet,
            row: rowCounter,
            col: ++colCounter,
            value: state ? state.description : "",
            font: { bold: false },
            alignment: {
              vertical: "middle",
              horizontal: "center",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });

          excelHelper.addText({
            sheet,
            row: rowCounter,
            col: ++colCounter,
            value: data.covertureMilk,
            font: { bold: false },
            alignment: {
              vertical: "middle",
              horizontal: "center",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });
          excelHelper.addText({
            sheet,
            row: rowCounter,
            col: ++colCounter,
            value: data.covertureWhite,
            font: { bold: false },
            alignment: {
              vertical: "middle",
              horizontal: "center",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });
          excelHelper.addText({
            sheet,
            row: rowCounter,
            col: ++colCounter,
            value: data.covertureDark,
            font: { bold: false },
            alignment: {
              vertical: "middle",
              horizontal: "center",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });
          excelHelper.addText({
            sheet,
            row: rowCounter,
            col: ++colCounter,
            value: data.covertureTotal,
            font: { bold: false },
            alignment: {
              vertical: "middle",
              horizontal: "center",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });

          excelHelper.addText({
            sheet,
            row: rowCounter,
            col: ++colCounter,
            value: data.compoundMilk,
            font: { bold: false },
            alignment: {
              vertical: "middle",
              horizontal: "center",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });
          excelHelper.addText({
            sheet,
            row: rowCounter,
            col: ++colCounter,
            value: data.compoundWhite,
            font: { bold: false },
            alignment: {
              vertical: "middle",
              horizontal: "center",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });
          excelHelper.addText({
            sheet,
            row: rowCounter,
            col: ++colCounter,
            value: data.compoundDark,
            font: { bold: false },
            alignment: {
              vertical: "middle",
              horizontal: "center",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });
          excelHelper.addText({
            sheet,
            row: rowCounter,
            col: ++colCounter,
            value: data.compoundTotal,
            font: { bold: false },
            alignment: {
              vertical: "middle",
              horizontal: "center",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });

          excelHelper.addText({
            sheet,
            row: rowCounter,
            col: ++colCounter,
            value: data.totalProduction,
            font: { bold: false },
            alignment: {
              vertical: "middle",
              horizontal: "center",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });

          excelHelper.addText({
            sheet,
            row: rowCounter,
            col: ++colCounter,
            value: data.totalSales,
            font: { bold: false },
            alignment: {
              vertical: "middle",
              horizontal: "center",
            },
            // borderStyle: excelHelper.BorderStyle.Thin
          });
        }
      }
    },
  },

  EntrepreneurProductionAndSales: {
    Entrepreneur: async (self, params, context) => {
      return await context.collection("Entrepreneurs").findOne({
        _id: self.entrepreneurId,
      });
    },
  },
};
exports.resolvers = resolvers;
