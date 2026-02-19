require("dotenv").config({
  path: "../../../.env",
});
const mongodbConnection = require("../mongodb-connection");
const dayjs = require("dayjs");
const { v4: uuidv4 } = require("uuid");
const schedule = require("node-schedule");
const lodash = require("lodash");
const FlexSearch = require("flexsearch");
var sql = require("mssql");

const start = async () => {
  const { collection, mongodb, mongoClient } = await mongodbConnection();
  const context = {
    collection,
  };
  let mssqlPool = null;
  let transaction = null;

  if (!process.env.GRAPHQL_MODE) {
    const sqlConfig = {
      user: "app_sep",
      password: "LD2022",
      database: "webstat",
      server: "192.168.1.77\\mcbcloud",
      options: {
        encrypt: false,
        trustServerCertificate: true,
        // enableArithAbort: true,
        // trustConnection: true
      },
    };
    mssqlPool = await sql.connect(sqlConfig);
    transaction = new sql.Transaction(mssqlPool);
  }

  let starYear = 1992;
  let endYear = 2023;

  let listYears = [];
  const diffYear = endYear - starYear;
  for (let i = 0; i <= diffYear; i++) {
    listYears.push(starYear + i);
  }

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

  for (const year of listYears) {
    let domesticTradeDatas = await context
      .collection("DomesticTradeDatas")
      .find({
        year: parseInt(year),
        _deletedAt: {
          $exists: false,
        },
      })
      .toArray();
    console.log("domesticTradeDatas", domesticTradeDatas.length);
    let localSITCProduct = await context
      .collection("LocalSITCProducts")
      .find({
        // _id: {
        //   $in: domesticTradeDatas.map(d => d.localSITCProductId),
        // },
        // ...NOT_DELETED_DOCUMENT_QUERY,
        _deletedAt: {
          $exists: false,
        },
      })
      .toArray();

    localSITCProduct = localSITCProduct.map(item => {
      const productName = (item.newProduct || item.product).toUpperCase();
      const product =
        ITEM_PRODUCTS_LABEL[productName.toUpperCase()] ||
        productName.toUpperCase();
      const order = PRODUCT_ORDERS.findIndex(p => p === product);
      return {
        ...item,
        product,
        order,
      };
    });

    // const indexedSITCProduct = localSITCProduct.reduce((all, sitc) => {
    //   if (!all[sitc._id]) {
    //     all[sitc._id] = {};
    //   }
    //   all[sitc._id] = sitc;
    //   return all;
    // }, {});

    const indexedSITCProduct = new FlexSearch({
      tokenize: "strict",
      doc: {
        id: "_id",
        field: ["_id", "gsitcCode"],
      },
    });
    indexedSITCProduct.add(localSITCProduct);

    domesticTradeDatas = domesticTradeDatas.map(trade => {
      const product = indexedSITCProduct.find(
        tr => tr._id === trade.localSITCProductId,
      );
      if (!product) {
        console.log(product, trade);
      }
      return {
        ...trade,
        gsitcCode: product.gsitcCode,
      };
    });

    const indexedDomesticTradeDatas = new FlexSearch({
      tokenize: "strict",
      doc: {
        id: "_id",
        field: [
          "localSITCProductId",
          "type",
          "productName",
          "year",
          "gsitcCode",
        ],
      },
    });
    indexedDomesticTradeDatas.add(domesticTradeDatas);

    // const cbData = indexedDomesticTradeDatas.where({
    //   type: "Export",
    //   year: parseInt(year),
    //   gsitcCode: "CB",
    // });

    // const indexedDomesticTradeDatasByType = domesticTradeDatas.reduce(
    //   (all, data) => {
    //     if (!all[data.type]) {
    //       all[data.type] = [];
    //     }
    //     all[data.type].push({
    //       ...data,
    //       quantity: data.quantity ? data.quantity : 0,
    //       value: data.value ? data.value : 0,
    //       gsitcCode: indexedSITCProduct[data.localSITCProductId]
    //         ? indexedSITCProduct[data.localSITCProductId].gsitcCode
    //         : "",
    //     });
    //     return all;
    //   },
    //   {},
    // );
    let recid = 0;
    if (!process.env.GRAPHQL_MODE) {
      // const latestData = await mssqlPool
      //   .request()
      //   .query("SELECT * FROM dbo.tmp_exsumm1 WHERE year='1992' AND type='E'");
      //   console.log(latestData)
      // if (latestData.recordset) {
      //   if (latestData.recordset.length > 0) {
      //     recid = latestData.recordset[0].RECID + 1;
      //   } else {
      //     recid = 1;
      //   }
      // }
    }

    const types = [
      "Export",
      "Import",
      // "Re-Export"
    ];
    await transaction.begin();
    for (const type of types) {
      console.log(`Proses ${year} ${type}`);

      const request = new sql.Request(transaction);
      const runQuery = `SELECT * FROM dbo.exsumm1 WHERE year='${year}' AND type='${type.slice(
        0,
        1,
      )}'`;

      const res = await request.query(runQuery);
      // console.log("RES => ", res.recordset);
      if (res.recordset.length > 0) {
        console.log("Continue");
        continue;
      }

      let data = {
        _id: uuidv4(),
        type,
        year,
        status: null,
        cbQty: 0,
        cbVal: 0,
        cbFobcif: 0,
        chQty: 0,
        chVal: 0,
        chFobcif: 0,
        csQty: 0,
        csVal: 0,
        csFobcif: 0,
        cdQty: 0,
        cdVal: 0,
        cdFobcif: 0,
        ctQty: 0,
        ctVal: 0,
        ctFobcif: 0,
        cpQty: 0,
        cpVal: 0,
        cpFobcif: 0,
        caQty: 0,
        caVal: 0,
        caFobcif: 0,
        ckQty: 0,
        ckVal: 0,
        ckFobcif: 0,
        ms: "",
        comment: "SEP V2",
        _createdAt: new Date().toISOString(),
        _updatedAt: new Date().toISOString(),
      };

      const cbData = indexedDomesticTradeDatas.where({
        type,
        year: parseInt(year),
        gsitcCode: "CB",
      });

      if (cbData.length > 0) {
        data.cbQty = cbData
          .map(cb => cb.quantity)
          .reduce((acc, curr) => acc + curr, 0);
        let tmpQty = data.cbQty;

        if (data.cbQty > 0) {
          data.cbQty = lodash.round(data.cbQty / 1000, 0);
        }

        data.cbVal = cbData
          .map(cb => cb.value)
          .reduce((acc, curr) => acc + curr, 0);

        let tmpVal = data.cbVal;
        if (data.cbVal > 0) {
          data.cbValDecimal = lodash.round(data.cbVal / 1000, 3);
          data.cbVal = lodash.round(data.cbVal / 1000, 0);
        }
        if (data.cbQty > 0 && data.cbVal > 0) {
          if (tmpQty > 0 && tmpVal > 0) {
            data.cbFobcif = (tmpVal / tmpQty) * 1000;
            // data.cbFobcif = (data.cbVal * 1000) / data.cbQty;
            // data.cbFobcif = parseFloat(data.cbFobcif.toFixed(3));
            data.cbFobcif = lodash.round(data.cbFobcif);
          }
        }
      }

      const chData = indexedDomesticTradeDatas.where({
        type,
        year: parseInt(year),
        gsitcCode: "CH",
      });

      if (chData.length > 0) {
        data.chQty = chData
          .map(ch => ch.quantity)
          .reduce((acc, curr) => acc + curr, 0);

        let tmpQty = data.chQty;
        if (data.chQty > 0) {
          data.chQty = lodash.round(data.chQty / 1000, 0);
        }

        data.chVal = chData
          .map(ch => ch.value)
          .reduce((acc, curr) => acc + curr, 0);
        let tmpVal = data.chVal;
        if (data.chQty > 0 && data.chVal > 0) {
          data.chValDecimal = lodash.round(data.chVal / 1000, 3);
          data.chVal = lodash.round(data.chVal / 1000, 0);

          // data.chFobcif = (data.chVal * 1000) / data.chQty;
          // data.chFobcif = parseFloat(data.chFobcif.toFixed(3));
          // data.chFobcif = lodash.round(data.chFobcif, 0);
          if (tmpVal > 0 && tmpQty > 0) {
            data.chFobcif = (tmpVal / tmpQty) * 1000;
            data.chFobcif = lodash.round(data.chFobcif);
          }
        }
      }

      const csData = indexedDomesticTradeDatas.where({
        type,
        year: parseInt(year),
        gsitcCode: "CS",
      });

      if (csData.length > 0) {
        data.csQty = csData
          .map(cs => cs.quantity)
          .reduce((acc, curr) => acc + curr, 0);

        let tmpQty = data.csQty;
        if (data.csQty > 0) {
          data.csQty = lodash.round(data.csQty / 1000, 0);
        }

        data.csVal = csData
          .map(cs => cs.value)
          .reduce((acc, curr) => acc + curr, 0);

        let tmpVal = data.csVal;
        if (data.csQty > 0 && data.csVal > 0) {
          data.csValDecimal = lodash.round(data.csVal / 1000, 3);
          data.csVal = lodash.round(data.csVal / 1000);

          // data.csFobcif = (data.csVal + 1000) / data.csQty;
          // // data.csFobcif = parseFloat(data.csFobcif.toFixed(3));
          // data.csFobcif = lodash.round(data.caFobcif, 3);
          if (tmpVal > 0 && tmpQty > 0) {
            data.csFobcif = (tmpVal / tmpQty) * 1000;
            data.csFobcif = lodash.round(data.csFobcif);
          }
        }
      }

      const cdData = indexedDomesticTradeDatas.where({
        type,
        year: parseInt(year),
        gsitcCode: "CD",
      });

      if (cdData.length > 0) {
        data.cdQty = cdData
          .map(cd => cd.quantity)
          .reduce((acc, curr) => acc + curr, 0);

        let tmpQty = data.cdQty;
        if (data.cdQty > 0) {
          data.cdQty = lodash.round(data.cdQty / 1000, 0);
        }

        data.cdVal = cdData
          .map(cd => cd.value)
          .reduce((acc, curr) => acc + curr, 0);

        let tmpVal = data.cdVal;
        if (data.cdQty > 0 && data.cdVal > 0) {
          data.cdValDecimal = lodash.round(data.cdVal / 1000, 3);
          data.cdVal = lodash.round(data.cdVal / 1000);

          // data.cdFobcif = (data.cdVal + 1000) / data.cdQty;
          // // data.cdFobcif = parseFloat(data.cdFobcif.toFixed(3));
          // data.cdFobcif = lodash.round(data.cdFobcif, 3);

          if (tmpVal > 0 && tmpQty > 0) {
            data.cdFobcif = (tmpVal / tmpQty) * 1000;
            data.cdFobcif = lodash.round(data.cdFobcif);
          }
        }
      }

      const ctData = indexedDomesticTradeDatas.where({
        type,
        year: parseInt(year),
        gsitcCode: "CT",
      });

      if (ctData.length > 0) {
        data.ctQty = ctData
          .map(ct => ct.quantity)
          .reduce((acc, curr) => acc + curr, 0);
        let tmpQty = data.ctQty;
        if (data.ctQty > 0) {
          data.ctQty = lodash.round(data.ctQty / 1000, 0);
        }
        data.ctVal = ctData
          .map(ct => ct.value)
          .reduce((acc, curr) => acc + curr, 0);

        let tmpVal = data.ctVal;
        if (data.ctQty > 0 && data.ctVal > 0) {
          // data.ctFobcif = (data.ctVal + 1000) / data.ctQty;
          // // data.ctFobcif = parseFloat(data.ctFobcif.toFixed(3));
          // data.ctFobcif = lodash.round(data.ctFobcif, 3);
          data.ctValDecimal = lodash.round(data.ctVal / 1000, 3);
          data.ctVal = lodash.round(data.ctVal / 1000);

          if (tmpVal > 0 && tmpQty > 0) {
            data.ctFobcif = (tmpVal / tmpQty) * 1000;
            data.ctFobcif = lodash.round(data.ctFobcif);
          }
        }
      }
      let cpData = indexedDomesticTradeDatas.where({
        type,
        year: parseInt(year),
      });
      cpData = cpData.filter(cp => cp.gsitcCode === "CP");

      if (cpData.length > 0) {
        data.cpQty = cpData
          .map(cp => cp.quantity)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.cpQty > 0) {
          data.cpQty = lodash.round(data.cpQty / 1000);
        }
        data.cpVal = cpData
          .map(cp => cp.value)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.cpVal > 0) {
          data.cpValDecimal = lodash.round(data.cpVal / 1000, 3);
          data.cpVal = lodash.round(data.cpVal / 1000);
        }
        if (data.cpQty > 0 && data.cpVal > 0) {
          data.cpFobcif = data.cpVal / data.cpQty;
          // data.cpFobcif = parseFloat(data.cpFobcif.toFixed(3));
          data.cpFobcif = lodash.round(data.cpFobcif, 3) * 1000;
        }
      }
      const caData = indexedDomesticTradeDatas.where({
        type,
        year: parseInt(year),
        gsitcCode: "CA",
      });

      if (caData.length > 0) {
        data.caQty = caData
          .map(ca => ca.quantity)
          .reduce((acc, curr) => acc + curr, 0);

        let tmpQty = data.caQty;
        if (data.caQty > 0) {
          data.caQty = lodash.round(data.caQty / 1000, 0);
        }
        data.caVal = caData
          .map(ca => ca.value)
          .reduce((acc, curr) => acc + curr, 0);

        let tmpVal = data.caVal;
        if (data.caQty > 0 && data.caVal > 0) {
          // data.caFobcif = (data.caVal + 1000) / data.caQty;
          // // data.caFobcif = parseFloat(data.caFobcif.toFixed(3));
          // data.caFobcif = lodash.round(data.caFobcif, 3);
          data.caValDecimal = lodash.round(data.caVal / 1000, 3);
          data.caVal = lodash.round(data.caVal / 1000);

          if (tmpVal > 0 && tmpQty > 0) {
            data.caFobcif = (tmpVal / tmpQty) * 1000;
            data.caFobcif = lodash.round(data.caFobcif);
          }
        }
      }

      const ckData = indexedDomesticTradeDatas.where({
        type,
        year: parseInt(year),
        gsitcCode: "CK",
      });

      if (ckData.length > 0) {
        data.ckQty = ckData
          .map(ck => ck.quantity)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.ckQty > 0) {
          data.ckQty = lodash.round(data.ckQty / 1000);
        }
        data.ckVal = ckData
          .map(ck => ck.value)
          .reduce((acc, curr) => acc + curr, 0);

        let tmpCkVal = data.ckVal;
        if (data.ckQty > 0 && data.ckVal > 0) {
          data.ckValDecimal = lodash.round(data.ckVal / 1000, 3);
          data.ckVal = lodash.round(data.ckVal / 1000);
          data.ckFobcif = tmpCkVal / data.ckQty;
          // console.log(data.ckFobcif);
          // data.ckFobcif = parseFloat(data.ckFobcif.toFixed(3));
          data.ckFobcif = lodash.round(data.ckFobcif, 0);
        }
      }

      let total = 0;

      if (data.cbValDecimal && !isNaN(data.cbValDecimal)) {
        total += data.cbValDecimal;
      }
      if (data.chValDecimal && !isNaN(data.chValDecimal)) {
        total += data.chValDecimal;
      }
      if (data.csValDecimal && !isNaN(data.csValDecimal)) {
        total += data.csValDecimal;
      }
      if (data.cdValDecimal && !isNaN(data.cdValDecimal)) {
        total += data.cdValDecimal;
      }
      if (data.ctValDecimal && !isNaN(data.ctValDecimal)) {
        total += data.ctValDecimal;
      }
      if (data.cpValDecimal && !isNaN(data.cpValDecimal)) {
        total += data.cpValDecimal;
      }
      if (data.caValDecimal && !isNaN(data.caValDecimal)) {
        total += data.caValDecimal;
      }
      if (data.ckValDecimal && !isNaN(data.ckValDecimal)) {
        total += data.ckValDecimal;
      }

      total = lodash.round(total, 0);
      // for (const key of Object.keys(data)) {
      //   if (
      //     key !== "_id" &&
      //     key !== "type" &&
      //     key !== "year" &&
      //     key !== "status" &&
      //     key !== "ms" &&
      //     key !== "comment" &&
      //     key !== "_createdAt" &&
      //     key !== "_updatedAt"
      //   ) {
      //     total += data[key];
      //   }
      // }

      // console.log(data);
      if (!process.env.GRAPHQL_MODE) {
        console.log("Save ExxumLogs");
        await context.collection("ExxumLogs").insertOne(data);
        console.log("Done ExxumLogs");

        try {
          const request = new sql.Request(transaction);

          const runQuery = `INSERT INTO dbo.exsumm1 (
                RECID,
                year,
                type,
                status,
                cb_qty,
                cb_val,
                cb_fobcif,
                ch_qty,
                ch_val,
                ch_fobcif,
                cs_qty,
                cs_val,
                cs_fobcif,
                cd_qty,
                cd_val,
                cd_fobcif,
                ct_qty,
                ct_val,
                ct_fobcif,
                cp_qty,
                cp_val,
                cp_fobcif,
                ca_qty,
                ca_val,
                ca_fobcif,
                ck_qty,
                ck_val,
                ck_fobcif,
                ms,
                comment,
                total
              ) VALUES (
                '${recid}',
                '${data.year}', '${data.type.slice(0, 1)}', '',
                '${data?.cbQty || 0}', '${data?.cbVal || 0}','${
            data?.cbFobcif || 0
          }',
                '${data?.chQty || 0}', '${data?.chVal || 0}','${
            data?.chFobcif || 0
          }',
                '${data?.csQty || 0}', '${data?.csVal || 0}','${
            data?.csFobcif || 0
          }',
                '${data?.cdQty || 0}', '${data?.cdVal || 0}','${
            data?.cdFobcif || 0
          }',
                '${data?.ctQty || 0}', '${data?.ctVal || 0}','${
            data?.ctFobcif || 0
          }',
                '${data?.cpQty || 0}', '${data?.cpVal || 0}','${
            data?.cpFobcif || 0
          }',
                '${data?.caQty || 0}', '${data?.caVal || 0}','${
            data?.caFobcif || 0
          }',
                '${data?.ckQty || 0}', '${data?.ckVal || 0}','${
            data?.ckFobcif || 0
          }',
                '${data.ms}', '${data.comment}', '${total}'
              )`;

          await request.query(runQuery);
        } catch (err) {
          console.log(`Error during query `, err);

          if (transaction) {
            try {
              await transaction.rollback();
              console.log("Rollback transaction");
            } catch (errRollback) {
              console.log("Error during rollback", errRollback);
            }
          }
        }
        // await transaction.begin();

        // await transaction.commit();
        // transaction.begin(err => {
        //   if (err) {
        //     console.log("Error transaction begin", err);
        //   }

        //   const request = new sql.Request(transaction);
        //   request.query(
        //     `INSERT INTO dbo.exsumm1 (
        //       RECID,
        //       year,
        //       type,
        //       status,
        //       cb_qty,
        //       cb_val,
        //       cb_fobcif,
        //       ch_qty,
        //       ch_val,
        //       ch_fobcif,
        //       cs_qty,
        //       cs_val,
        //       cs_fobcif,
        //       cd_qty,
        //       cd_val,
        //       cd_fobcif,
        //       ct_qty,
        //       ct_val,
        //       ct_fobcif,
        //       cp_qty,
        //       cp_val,
        //       cp_fobcif,
        //       ca_qty,
        //       ca_val,
        //       ca_fobcif,
        //       ck_qty,
        //       ck_val,
        //       ck_fobcif,
        //       ms,
        //       comment,
        //       total
        //     ) VALUES (
        //       '${recid}',
        //       '${data.year}', '${data.type.slice(0, 1)}', '',
        //       '${data?.cbQty || "-"}', '${data?.cbVal || "-"}','${
        //       data?.cbFobcif || "-"
        //     }',
        //       '${data?.chQty || "-"}', '${data?.chVal || "-"}','${
        //       data?.chFobcif || "-"
        //     }',
        //       '${data?.csQty || "-"}', '${data?.csVal || "-"}','${
        //       data?.csFobcif || "-"
        //     }',
        //       '${data?.cdQty || "-"}', '${data?.cdVal || "-"}','${
        //       data?.cdFobcif || "-"
        //     }',
        //       '${data?.ctQty || "-"}', '${data?.ctVal || "-"}','${
        //       data?.ctFobcif || "-"
        //     }',
        //       '${data?.cpQty || "-"}', '${data?.cpVal || "-"}','${
        //       data?.cpFobcif || "-"
        //     }',
        //       '${data?.caQty || "-"}', '${data?.caVal || "-"}','${
        //       data?.caFobcif || "-"
        //     }',
        //       '${data?.ckQty || "-"}', '${data?.ckVal || "-"}','${
        //       data?.ckFobcif || "-"
        //     }',
        //       '${data.ms}', '${data.comment}', '${total}'
        //     )`,
        //     (err, result) => {
        //       if (err) {
        //         console.log("Error MSSQL", err);
        //       }
        //       transaction.commit(err => {
        //         if (err) {
        //           console.log("Error transaction");
        //         }
        //         console.log("transaction Ommited");
        //       });
        //     },
        //   );
        // });
      }

      console.log("Saving dbo.exsumm1 ");
      recid += 1;
      await sleep(3000);
    }
    await transaction.commit();
    await sleep(3000);
  }
  console.log("DOne");
};
start();

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
