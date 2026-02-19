const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");

const lodash = require("lodash");
const fs = require("fs");
const Excel = require("exceljs");
const excelHelper = require("../../excel");
const path = require("path");

const exportCollectionDataAsExcel = async (self, params, context) => {
  assertValidSession(context.activeSession);
  // console.log(params.exportConfig);

  let allItems = [];
  if (params.exportConfig.data) {
    allItems = params.exportConfig.data;
  } else {
    if (!params.exportConfig.collectionName) return "";

    let query = {};
    for (const key in params.exportConfig.filters) {
      if (key === "years") {
        query.year = { $in: params.exportConfig.filters[key] };
      } else if (lodash.isArray(params.exportConfig.filters[key])) {
        query[key] = { $in: params.exportConfig.filters[key] };
      } else {
        query[key] = params.exportConfig.filters[key];
      }
    }

    if (
      params.exportConfig.collectionName === "EntrepreneurProductionAndSaleses"
    ) {
      if (query.yearMonth) {
        query = {
          year: parseInt(query.yearMonth.split("-")[0]),
          month: parseInt(query.yearMonth.split("-")[1]),
        };
      }
    }
    await context.collection(params.exportConfig.collectionName).createIndex({
      year: -1,
    });
    allItems = await context
      .collection(params.exportConfig.collectionName)
      .find({
        ...query,
        ...NOT_DELETED_DOCUMENT_QUERY,
      })
      .sort({
        year: -1,
      })
      .toArray();
    // console.log(
    //   {
    //     ...query,
    //     ...NOT_DELETED_DOCUMENT_QUERY,
    //   },
    //   { allItems },
    // );
  }

  if (
    params.exportConfig.collectionName === "BasicCocoaStatisticGlobalGrindings"
  ) {
    allItems = allItems.map(item => {
      let productionValue = 0;
      if (item.productionValue) {
        productionValue = item.productionValue;
      }

      if (!productionValue) {
        if (item.grindingValue) {
          productionValue = item.grindingValue;
        }
      }
      return {
        ...item,
        productionValue,
      };
    });
  }
  // ##############################################################################################
  // ##############################################################################################
  let rowIterator = 0;
  let columnIterator = 0;
  const nextRow = () => {
    rowIterator += 1;
    columnIterator = 1;
    return {
      row: rowIterator,
      col: columnIterator,
    };
  };
  const nextColumn = () => {
    columnIterator += 1;
    return {
      row: rowIterator,
      col: columnIterator,
    };
  };
  // ---------------------------------------------------------------------------------------------

  const workbook = new Excel.Workbook();
  workbook.creator = "LKM SEPv2";
  let sheet = workbook.addWorksheet(`Data`);

  // ##############################################################################################
  // ---------------------------------------------------------------------------------------------
  excelHelper.addText({
    sheet,
    ...nextRow(),
    value: params.exportConfig.title,
    alignment: {
      vertical: "middle",
      // horizontal: "center",
    },
    font: {
      bold: true,
      size: 14,
    },
  });
  // sheet.mergeCells(
  //   rowIterator,
  //   columnIterator,
  //   rowIterator,
  //   columnIterator + 8,
  // );

  // ##############################################################################################
  // ---------------------------------------------------------------------------------------------
  nextRow();
  nextRow();
  // console.log("params.exportConfig", params.exportConfig);
  var TABLE_BODY = [
    params.exportConfig.columns.map(column => {
      return {
        text: column.Header,
        alignment: "center",
        bold: true,
        fillColor: "#f0f0f0",
        width: 100,
        // fontSize: BASE_FONT_SIZE - 1,
      };
    }),
    ...allItems.map(item => {
      return params.exportConfig.columns.map(column => {
        const value = lodash.get(item, column.accessor, " ");
        return {
          text: value,
          alignment: "center",
          // bold: true,
          // fillColor: "#f0f0f0",
          width: 100,
          // fontSize: BASE_FONT_SIZE - 1,
        };
      });
    }),
  ];

  TABLE_BODY.forEach((row, rowIndex) => {
    row.forEach((column, columnIndex) => {
      excelHelper.addText({
        sheet,
        ...(columnIndex === 0 ? nextRow() : nextColumn()),
        value: column.text,
        alignment: {
          vertical: "middle",
          horizontal: column.alignment,
          wrapText: true,
        },
        font: {
          bold: column.bold,
          size: 12,
        },
        borderStyle: excelHelper.BorderStyle.Thin,
      });
      if (column.width) {
        excelHelper.setColumnWidth({
          sheet,
          column: columnIndex + 1,
          width: column.width / 5,
        });
      }
    });
  });

  // ##############################################################################################
  // ##############################################################################################
  const PREFIX = "SEPv2";

  if (!fs.existsSync(process.cwd() + "/static/cache/")) {
    fs.mkdirSync(process.cwd() + "/static/cache/");
  }
  if (!fs.existsSync(process.cwd() + `/static/cache/${PREFIX}`)) {
    fs.mkdirSync(process.cwd() + `/static/cache/${PREFIX}`);
  }
  const filename = `${params.exportConfig.title}.xlsx`;
  const fileUrl =
    `/lkm/cache/${PREFIX}/${filename}?t=` + new Date().toISOString();
  const folderPath = path.join(process.cwd(), `../app/public/cache/${PREFIX}`);
  fs.mkdirSync(folderPath, {
    recursive: true,
  });
  const filePath = path.join(
    process.cwd(),
    `../app/public/cache/${PREFIX}/${filename}`,
  );
  // console.log({ folderPath, fileUrl, filePath });
  await workbook.xlsx.writeFile(filePath);
  // throw {};
  return fileUrl;
};

module.exports = {
  exportCollectionDataAsExcel,
};
