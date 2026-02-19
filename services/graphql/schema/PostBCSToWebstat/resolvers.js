const { v4: uuidv4 } = require("uuid");
const { NOT_DELETED_DOCUMENT_QUERY } = require("../../data-loader");
const { assertValidSession } = require("../../authentication");
const lodash = require("lodash");
const FlexSearch = require("flexsearch");
var sql = require("mssql");

const resolvers = {
  Mutation: {
    sendToWebstatBCSGlobal: async (self, params, context) => {
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

      // const mssqlPool = null;
      // const transaction = null;

      if (!params.year) {
        throw new Error("Invalid Year");
      }
      if (!params.type) {
        throw new Error("Invalid Type");
      }
      if (params.years.length === 0) {
        throw new Error("Invalid Years");
      }

      const yearsList = params.years.map(year => parseInt(year));

      if (params.type === "Grinding") {
        console.log("create grinding index");
        await context
          .collection("BasicCocoaStatisticDomesticGrindings")
          .createIndex({
            year: 1,
            regionId: 1,
          });
        console.log("done create grinding index");

        let domesticGrindings = await context
          .collection("BasicCocoaStatisticDomesticGrindings")
          .find({
            year: parseInt(params.year),
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();

        domesticGrindings = domesticGrindings.map(g => {
          return {
            ...g,
            grindingsTotal: g.grindingsTotal ? g.grindingsTotal : 0,
          };
        });
        console.log(
          "BasicCocoaStatisticDomesticGrindings",
          domesticGrindings.length,
        );

        let data = {
          _id: uuidv4(),
          year: params.year,
          ntotground: 0,
          infostat: "",
          NoteBI: "e",
          NoteBM: "a",
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
        };

        data.ntotground = lodash.round(
          domesticGrindings
            .map(g => g.grindingsTotal)
            .reduce((acc, curr) => acc + curr, 0),
          0,
        );

        console.log("Save GrindingMSSQLLogs");
        await context.collection("GrindingMSSQLLogs").insertOne(data);
        console.log("Done GrindingMSSQLLogs");
        transaction.begin(err => {
          if (err) {
            console.log("Error transaction begin", err);
          }

          const request = new sql.Request(transaction);
          request.query(
            `INSERT INTO dbo.l_grind (
                  year,
                  ntotground,
                  infostat,
                  NoteBI,
                  NoteBM
                ) VALUES (
                  '${data.year}', ${data.ntotground}, '${data.infostat}',
                  '${data.NoteBI}', '${data.NoteBM}'
                )`,
            (err, result) => {
              if (err) {
                console.log("Error MSSQL", err);
              }
              transaction.commit(err => {
                if (err) {
                  console.log("Error transaction");
                }
                console.log("transaction Ommited");
              });
            },
          );
        });
        console.log("Saving dbo.l_grind ");
      } else if (params.type === "Production") {
        console.log("create index bcs domestic production");
        await context
          .collection("BasicCocoaStatisticDomesticProductions")
          .createIndex({
            year: 1,
            regionId: 1,
          });
        console.log("done create index cultivated area");

        const region = await context
          .collection("Regions")
          .find({
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        const indexedRegion = region.reduce((all, reg) => {
          if (!all[reg._id]) {
            all[reg._id] = {};
          }
          all[reg._id] = reg;
          return all;
        }, {});

        let bcsDomesticProduction = await context
          .collection("BasicCocoaStatisticDomesticProductions")
          .find({
            regionId: {
              $in: region.map(r => r._id),
            },
            year: parseInt(params.year),
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();

        bcsDomesticProduction = bcsDomesticProduction.map(bcs => {
          return {
            ...bcs,
            regionName: indexedRegion[bcs.regionId]
              ? indexedRegion[bcs.regionId].description
              : "",
          };
        });
        console.log(
          "BasicCocoaStatisticDomesticProductions",
          bcsDomesticProduction.length,
        );

        let data = {
          _id: uuidv4(),
          year: params.year,
          peninsular: 0,
          sabah: 0,
          sarawak: 0,
          malaysia: 0,
          infostat: "",
          NoteBI: "e",
          NoteBM: "a",
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
        };

        //#### Peninsular / Semenanjung Malaysia ######
        let peninsularEstateProduction = 0,
          peninsularSmallhProduction = 0;
        const peninsular = bcsDomesticProduction
          .filter(reg => reg.regionName === "Semenanjung Malaysia")
          .map(r => {
            let estateProduction = 0;
            let smallholdingProduction = 0;

            if (r.estateProduction) {
              estateProduction = lodash.round(
                parseFloat(r.estateProduction),
                2,
              );
            }

            if (r.smallholdingProduction) {
              smallholdingProduction = lodash.round(
                parseFloat(r.smallholdingProduction),
                2,
              );
            }
            return {
              _id: r._id,
              estateProduction,
              smallholdingProduction,
            };
          });

        if (peninsular.length > 0) {
          peninsularEstateProduction = peninsular
            .map(p => p.estateProduction)
            .reduce((acc, curr) => acc + curr, 0);

          peninsularSmallhProduction = peninsular
            .map(p => p.smallholdingProduction)
            .reduce((acc, curr) => acc + curr, 0);

          data.peninsular = lodash.round(
            peninsularEstateProduction + peninsularSmallhProduction,
            2,
          );
        }

        //#### Sabah ######
        let sabahEstateProduction = 0,
          sabahSmallhProduction = 0;
        const sabah = bcsDomesticProduction
          .filter(reg => reg.regionName === "Sabah")
          .map(r => {
            let estateProduction = 0;
            let smallholdingProduction = 0;

            if (r.estateProduction) {
              estateProduction = lodash.round(
                parseFloat(r.estateProduction),
                2,
              );
            }

            if (r.smallholdingProduction) {
              smallholdingProduction = lodash.round(
                parseFloat(r.smallholdingProduction),
                2,
              );
            }
            return {
              _id: r._id,
              estateProduction,
              smallholdingProduction,
            };
          });

        if (sabah.length > 0) {
          sabahEstateProduction = sabah
            .map(p => p.estateProduction)
            .reduce((acc, curr) => acc + curr, 0);

          sabahSmallhProduction = sabah
            .map(p => p.smallholdingProduction)
            .reduce((acc, curr) => acc + curr, 0);

          data.sabah = lodash.round(
            sabahEstateProduction + sabahSmallhProduction,
            2,
          );
        }

        //#### Sarawak ######
        let sarawakEstateProduction = 0,
          sarawakSmallhProduction = 0;
        const sarawak = bcsDomesticProduction
          .filter(reg => reg.regionName === "Sarawak")
          .map(r => {
            let estateProduction = 0;
            let smallholdingProduction = 0;

            if (r.estateProduction) {
              estateProduction = lodash.round(
                parseFloat(r.estateProduction),
                2,
              );
            }

            if (r.smallholdingProduction) {
              smallholdingProduction = lodash.round(
                parseFloat(r.smallholdingProduction),
                2,
              );
            }
            return {
              _id: r._id,
              estateProduction,
              smallholdingProduction,
            };
          });

        if (sarawak.length > 0) {
          sarawakEstateProduction = sarawak
            .map(p => p.estateProduction)
            .reduce((acc, curr) => acc + curr, 0);

          sarawakSmallhProduction = sarawak
            .map(p => p.smallholdingProduction)
            .reduce((acc, curr) => acc + curr, 0);

          data.sarawak = lodash.round(
            sarawakEstateProduction + sarawakSmallhProduction,
            2,
          );
          //##################################################
        }
        data.malaysia = data.peninsular + data.sabah + data.sarawak;
        console.log("Save to MongoDB Logs");
        await context.collection("CNProdLogs").insertOne(data);

        transaction.begin(err => {
          if (err) {
            console.log("Error transaction begin", err);
          }

          const request = new sql.Request(transaction);
          request.query(
            `INSERT INTO dbo.cn_prod (
              year,
              peninsular,
              sabah,
              sarawak,
              malaysia,
              infostat,
              NoteBI,
              NoteBM
            ) VALUES (
              '${data.year}', ${data.peninsular}, ${data.sabah},
              ${data.sarawak}, ${data.malaysia}, '', 'e', 'a'
            )`,
            (err, result) => {
              if (err) {
                console.log("Error MSSQL", err);
              }
              transaction.commit(err => {
                if (err) {
                  console.log("Error transaction");
                }
                console.log("transaction CN Prod Ommited");
              });
            },
          );
        });
        console.log("Saving dbo.cn_prod ");
      } else if (params.type === "Cultivated Area") {
        console.log("create index bcs cultivated area");
        await context
          .collection("BasicCocoaStatisticDomesticCultivatedAreas")
          .createIndex({
            year: 1,
            regionId: 1,
          });
        console.log("done create index cultivated area");

        const region = await context
          .collection("Regions")
          .find({
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();
        const indexedRegion = region.reduce((all, reg) => {
          if (!all[reg._id]) {
            all[reg._id] = {};
          }
          all[reg._id] = reg;
          return all;
        }, {});

        let bcsCultivatedArea = await context
          .collection("BasicCocoaStatisticDomesticCultivatedAreas")
          .find({
            regionId: {
              $in: region.map(r => r._id),
            },
            year: parseInt(params.year),
            _deletedAt: {
              $exists: false,
            },
          })
          .toArray();

        bcsCultivatedArea = bcsCultivatedArea.map(bcs => {
          return {
            ...bcs,
            regionName: indexedRegion[bcs.regionId]
              ? indexedRegion[bcs.regionId].description
              : "",
          };
        });
        console.log(
          "BasicCocoaStatisticDomesticCultivatedAreas",
          bcsCultivatedArea.length,
        );

        // console.log(bcsCultivatedArea)
        let data = {
          _id: uuidv4(),
          year: params.year,
          month: "",
          est_no12: 0,
          est_ha12: 0,
          smh_no12: 0,
          smh_ha12: 0,
          est_no13: 0,
          est_ha13: 0,
          smh_no13: 0,
          smh_ha13: 0,
          est_no01: 0,
          est_ha01: 0,
          smh_no01: 0,
          smh_ha01: 0,
          infostat: "",
          dt_updated: new Date().toISOString(),
          source: "SEP V2",
          NoteBI: "e",
          NoteBM: "a",
          _createdAt: new Date().toISOString(),
          _updatedAt: new Date().toISOString(),
        };

        //#### Sabah ######
        let estateNoSabah = 0,
          estateAreaSabah = 0,
          smallhNoSabah = 0,
          smallhAreaSabah = 0;

        const sabah = bcsCultivatedArea
          .filter(reg => reg.regionName === "Sabah")
          .map(r => {
            return {
              _id: r._id,
              estateArea: r.estateArea ? r.estateArea : 0,
              estateNo: r.estateNo ? r.estateNo : 0,
              smallhNo: r.smallhNo ? r.smallhNo : 0,
              smallhArea: r.smallhArea ? r.smallhArea : 0,
            };
          });

        if (sabah.length > 0) {
          estateNoSabah = sabah
            .map(p => p.estateNo)
            .reduce((acc, curr) => acc + curr, 0);

          estateAreaSabah = sabah
            .map(p => p.estateArea)
            .reduce((acc, curr) => acc + curr, 0);

          smallhNoSabah = sabah
            .map(p => p.smallhNo)
            .reduce((acc, curr) => acc + curr, 0);

          smallhAreaSabah = sabah
            .map(p => p.smallhArea)
            .reduce((acc, curr) => acc + curr, 0);

          data.est_no12 = estateNoSabah;
          data.est_ha12 = estateAreaSabah;
          data.smh_no12 = smallhNoSabah;
          data.smh_ha12 = smallhAreaSabah;
        }

        //#### Sarawak ######
        let estateNoSarawak = 0,
          estateAreaSarawak = 0,
          smallhNoSarawak = 0,
          smallhAreaSarawak = 0;

        const sarawak = bcsCultivatedArea
          .filter(reg => reg.regionName === "Sarawak")
          .map(r => {
            return {
              _id: r._id,
              estateArea: r.estateArea ? r.estateArea : 0,
              estateNo: r.estateNo ? r.estateNo : 0,
              smallhNo: r.smallhNo ? r.smallhNo : 0,
              smallhArea: r.smallhArea ? r.smallhArea : 0,
            };
          });

        if (sarawak.length > 0) {
          estateNoSarawak = sarawak
            .map(p => p.estateNo)
            .reduce((acc, curr) => acc + curr, 0);

          estateAreaSarawak = sarawak
            .map(p => p.estateArea)
            .reduce((acc, curr) => acc + curr, 0);

          smallhNoSarawak = sarawak
            .map(p => p.smallhNo)
            .reduce((acc, curr) => acc + curr, 0);

          smallhAreaSarawak = sarawak
            .map(p => p.smallhArea)
            .reduce((acc, curr) => acc + curr, 0);

          data.est_no13 = estateNoSarawak;
          data.est_ha13 = estateAreaSarawak;
          data.smh_no13 = smallhNoSarawak;
          data.smh_ha13 = smallhAreaSarawak;
        }

        //#### Semenanjung ######
        let estateNoSemenanjung = 0,
          estateAreaSemenanjung = 0,
          smallhNoSemenanjung = 0,
          smallhAreaSemenanjung = 0;

        const semenanjung = bcsCultivatedArea
          .filter(reg => reg.regionName === "Semenanjung Malaysia")
          .map(r => {
            return {
              _id: r._id,
              estateArea: r.estateArea ? r.estateArea : 0,
              estateNo: r.estateNo ? r.estateNo : 0,
              smallhNo: r.smallhNo ? r.smallhNo : 0,
              smallhArea: r.smallhArea ? r.smallhArea : 0,
            };
          });

        if (semenanjung.length > 0) {
          estateNoSemenanjung = semenanjung
            .map(p => p.estateNo)
            .reduce((acc, curr) => acc + curr, 0);

          estateAreaSemenanjung = semenanjung
            .map(p => p.estateArea)
            .reduce((acc, curr) => acc + curr, 0);

          smallhNoSemenanjung = semenanjung
            .map(p => p.smallhNo)
            .reduce((acc, curr) => acc + curr, 0);

          smallhAreaSemenanjung = semenanjung
            .map(p => p.smallhArea)
            .reduce((acc, curr) => acc + curr, 0);

          data.est_no01 = estateNoSemenanjung;
          data.est_ha01 = estateAreaSemenanjung;
          data.smh_no01 = smallhNoSemenanjung;
          data.smh_ha01 = smallhAreaSemenanjung;
        }

        console.log("Save TmpAreaLogs");
        await context.collection("TmpAreaLogs").insertOne(data);
        console.log("Done TmpAreaLogs");

        transaction.begin(err => {
          if (err) {
            console.log("Error transaction begin", err);
          }

          const request = new sql.Request(transaction);
          request.query(
            `INSERT INTO dbo.l_area1 (
              year,
              month,
              est_no12,
              est_ha12,
              smh_no12,
              smh_ha12,
              est_no13,
              est_ha13,
              smh_no13,
              smh_ha13,
              est_no01,
              est_ha01,
              smh_no01,
              smh_ha01,
              infostat,
              dt_updated,
              source,
              NoteBI,
              NoteBM
            ) VALUES (
              '${data.year}','', ${data.est_no12}, ${data.est_ha12}, ${data.smh_no12}, ${data.smh_ha12},
              ${data.est_no13}, ${data.est_ha13}, ${data.smh_no13}, ${data.smh_ha13},
              ${data.est_no01}, ${data.est_ha01}, ${data.smh_no01}, ${data.smh_ha01},
              '${data.infostat}', '${data.dt_updated}', '${data.source}', '${data.NoteBI}', '${data.NoteBM}'
            )`,
            (err, result) => {
              if (err) {
                console.log("Error MSSQL", err);
              }
              transaction.commit(err => {
                if (err) {
                  console.log("Error transaction");
                }
                console.log("transaction Ommited");
              });
            },
          );
        });
        console.log("Saving dbo.l_area1 ");
      } else if (params.type === "Domestic Trade Data") {
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

        console.log("create index");
        await context.collection("DomesticTradeDatas").createIndex({
          year: 1,
          type: 1,
        });
        console.log("done create index");

        for (const year of yearsList) {
          let domesticTradeDatas = await context
            .collection("DomesticTradeDatas")
            .find({
              year: parseInt(params.year),
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
              ...NOT_DELETED_DOCUMENT_QUERY,
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
          //   year: parseInt(params.year),
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
            const latestData = await mssqlPool
              .request()
              .query("SELECT * FROM dbo.tmp_exsumm1 ORDER BY RECID DESC");

            if (latestData.recordset) {
              if (latestData.recordset.length > 0) {
                recid = latestData.recordset[0].RECID + 1;
              } else {
                recid = 1;
              }
            }
          }

          const types = [
            "Export",
            "Import",
            // "Re-Export"
          ];
          for (const type of types) {
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
              year: parseInt(params.year),
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
                data.cbVal = lodash.round(data.cbVal / 1000);
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
              year: parseInt(params.year),
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
              year: parseInt(params.year),
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
              year: parseInt(params.year),
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
              year: parseInt(params.year),
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
              year: parseInt(params.year),
            });
            cpData = cpData.filter(
              cp => cp.gsitcCode === "CP" || cp.gsitcCode === "CA",
            );

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
              year: parseInt(params.year),
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
              year: parseInt(params.year),
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
                console.log(data.ckFobcif);
                // data.ckFobcif = parseFloat(data.ckFobcif.toFixed(3));
                data.ckFobcif = lodash.round(data.ckFobcif, 0);
              }
            }

            let total = 0;

            if (data.cbValDecimal && !isNaN(data.cbValDecimal)) {
              // console.log({ cbValDecimal: (data.cbValDecimal) });
              total += data.cbValDecimal;
            }
            if (data.chValDecimal && !isNaN(data.chValDecimal)) {
              // console.log({ chValDecimal: (data.chValDecimal) });
              total += data.chValDecimal;
            }
            if (data.csValDecimal && !isNaN(data.csValDecimal)) {
              // console.log({ csValDecimal: (data.csValDecimal) });
              total += data.csValDecimal;
            }
            if (data.cdValDecimal && !isNaN(data.cdValDecimal)) {
              // console.log({ cdValDecimal: (data.cdValDecimal) });
              total += data.cdValDecimal;
            }
            if (data.ctValDecimal && !isNaN(data.ctValDecimal)) {
              // console.log({ ctValDecimal: (data.ctValDecimal) });
              total += data.ctValDecimal;
            }
            if (data.cpValDecimal && !isNaN(data.cpValDecimal)) {
              // console.log({ cpValDecimal: (data.cpValDecimal) });
              total += data.cpValDecimal;
            }
            if (data.caValDecimal && !isNaN(data.caValDecimal)) {
              // console.log({ caValDecimal: (data.caValDecimal) });
              // total += lodash.round(data.caValDecimal);
            }
            if (data.ckValDecimal && !isNaN(data.ckValDecimal)) {
              // console.log({ ckValDecimal: (data.ckValDecimal) });
              total += data.ckValDecimal;
            }

            total = lodash.round(total, 0);

            // let total = 0;
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

            console.log(data);
            if (!process.env.GRAPHQL_MODE) {
              console.log("Save ExxumLogs");
              await context.collection("ExxumLogs").insertOne(data);
              console.log("Done ExxumLogs");

              try {
                await transaction.begin();
                const request = new sql.Request(transaction);
                const query = `
                  IF EXISTS (SELECT 1 FROM dbo.exsumm1 WHERE year = '${
                    data.year
                  }' AND type = '${data.type.slice(0, 1)}')
                    BEGIN
                      UPDATE dbo.exsumm1
                      SET 
                        cb_qty = '${data?.cbQty || "-"}', 
                        cb_val = '${data?.cbVal || "-"}',
                        cb_fobcif = '${data?.cbFobcif || "-"}',
                        ch_qty = '${data?.chQty || "-"}', 
                        ch_val = '${data?.chVal || "-"}',
                        ch_fobcif = '${data?.chFobcif || "-"}',
                        cs_qty = '${data?.csQty || "-"}', 
                        cs_val = '${data?.csVal || "-"}',
                        cs_fobcif = '${data?.csFobcif || "-"}',
                        cd_qty = '${data?.cdQty || "-"}', 
                        cd_val = '${data?.cdVal || "-"}',
                        cd_fobcif = '${data?.cdFobcif || "-"}',
                        ct_qty = '${data?.ctQty || "-"}', 
                        ct_val = '${data?.ctVal || "-"}',
                        ct_fobcif = '${data?.ctFobcif || "-"}',
                        cp_qty = '${data?.cpQty || "-"}', 
                        cp_val = '${data?.cpVal || "-"}',
                        cp_fobcif = '${data?.cpFobcif || "-"}',
                        ca_qty = '${data?.caQty || "-"}', 
                        ca_val = '${data?.caVal || "-"}',
                        ca_fobcif = '${data?.caFobcif || "-"}',
                        ck_qty = '${data?.ckQty || "-"}', 
                        ck_val = '${data?.ckVal || "-"}',
                        ck_fobcif = '${data?.ckFobcif || "-"}',
                        ms = '${data.ms}', 
                        comment = '${data.comment}', 
                        total = '${total}'
                      WHERE year = '${data.year}' AND type = '${data.type.slice(
                  0,
                  1,
                )}';
                    END
                    ELSE
                    BEGIN
                      INSERT INTO dbo.exsumm1 (
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
                        '${data?.cbQty || "-"}', '${data?.cbVal || "-"}',
                        '${data?.cbFobcif || "-"}',
                        '${data?.chQty || "-"}', '${data?.chVal || "-"}',
                        '${data?.chFobcif || "-"}',
                        '${data?.csQty || "-"}', '${data?.csVal || "-"}',
                        '${data?.csFobcif || "-"}',
                        '${data?.cdQty || "-"}', '${data?.cdVal || "-"}',
                        '${data?.cdFobcif || "-"}',
                        '${data?.ctQty || "-"}', '${data?.ctVal || "-"}',
                        '${data?.ctFobcif || "-"}',
                        '${data?.cpQty || "-"}', '${data?.cpVal || "-"}',
                        '${data?.cpFobcif || "-"}',
                        '${data?.caQty || "-"}', '${data?.caVal || "-"}',
                        '${data?.caFobcif || "-"}',
                        '${data?.ckQty || "-"}', '${data?.ckVal || "-"}',
                        '${data?.ckFobcif || "-"}',
                        '${data.ms}', '${data.comment}', '${total}'
                      );
                    END`;
                await request.query(query);
                await transaction.commit();
              } catch (err) {
                console.log("Error during transaction", err);
                await transaction.rollback();
              }
            }

            console.log("Saving dbo.exsumm1 ");
            recid += 1;

            await sleep(5000);
          }
          // await sleep(5000);
        }
      } else if (params.type === "Global Trade Data") {
      }

      return "ok";
    },
  },
};
exports.resolvers = resolvers;

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
