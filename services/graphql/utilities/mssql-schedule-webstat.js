require("dotenv").config({
  path: "../../../.env",
});
const mongodbConnection = require("../mongodb-connection");
const dayjs = require("dayjs");
const { v4: uuidv4 } = require("uuid");
const schedule = require("node-schedule");

var sql = require("mssql");
const start = async () => {
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

  const { collection, mongodb, mongoClient } = await mongodbConnection();

  let currentMonth = dayjs().get("month") + 1;
  let currentYear = dayjs().get("year");
  console.log({ sqlConfig });
  const mssqlPool = await sql.connect(sqlConfig);
  console.log("MSSQL Connect");

  const transaction = new sql.Transaction(mssqlPool);
  // await tmpArea({ collection, transaction: null });
  // await exxum1({ collection, transaction: null });
  // await cnProd({ collection, transaction: null });
  // await grindingJob({ collection, transaction: null });
  const jobHarian = schedule.scheduleJob("1 3 *", async () => {
    console.log("Execute WebStat");
    await exxum1({ collection, transaction, mssqlPool });

    await sleep(60000);
    console.log("Execute GrindJob");
    await grindingJob({ collection, transaction });
    await sleep(60000);
    console.log("Execute CN Prod");
    await cnProd({ collection, transaction });
    console.log("Execute Tmp Area");
    await sleep(60000);
    await tmpArea({ collection, transaction });
  });
};

const exxum1 = async ({ collection, transaction, mssqlPool }) => {
  const year = parseInt(dayjs().subtract(1, "year").format("YYYY"));

  console.log("create index");
  await collection("DomesticTradeDatas").createIndex({
    year: 1,
    type: 1,
  });
  console.log("done create index");

  const domesticTradeDatas = await collection("DomesticTradeDatas")
    .find({
      year,
      _deletedAt: {
        $exists: false,
      },
    })
    .toArray();
  console.log("domesticTradeDatas", domesticTradeDatas.length);
  const localSITCProduct = await collection("LocalSITCProducts")
    .find({
      _id: {
        $in: domesticTradeDatas.map(d => d.localSITCProductId),
      },
    })
    .toArray();

  console.log("domesticTradeDatas", domesticTradeDatas.length);

  const indexedSITCProduct = localSITCProduct.reduce((all, sitc) => {
    if (!all[sitc._id]) {
      all[sitc._id] = {};
    }
    all[sitc._id] = sitc;
    return all;
  }, {});

  const indexedDomesticTradeDatasByType = domesticTradeDatas.reduce(
    (all, data) => {
      if (!all[data.type]) {
        all[data.type] = [];
      }
      all[data.type].push({
        ...data,
        quantity: data.quantity ? data.quantity : 0,
        value: data.value ? data.value : 0,
        gsitcCode: indexedSITCProduct[data.localSITCProductId]
          ? indexedSITCProduct[data.localSITCProductId].gsitcCode
          : "",
      });
      return all;
    },
    {},
  );

  const latestData = await mssqlPool
    .request()
    .query("SELECT * FROM dbo.exsumm1 ORDER BY RECID DESC");

  let recid = 0;
  if (latestData.recordset) {
    recid = latestData.recordset[0].RECID + 1;
  }

  const types = ["Export", "Import", "Re-Export"];

  for (const type of types) {
    if (indexedDomesticTradeDatasByType[type]) {
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

      const cbData = indexedDomesticTradeDatasByType[type].filter(
        d => d.gsitcCode === "CB",
      );

      if (cbData.length > 0) {
        data.cbQty = cbData
          .map(cb => cb.quantity)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.cbQty > 0) {
          data.cbQty = data.cbQty / 1000;
        }

        data.cbVal = cbData
          .map(cb => cb.value)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.cbQty > 0 && data.cbVal > 0) {
          data.cbFobcif = (data.cbVal + 1000) / data.cbQty;

          data.cbFobcif = parseFloat(data.cbFobcif.toFixed(3));
        }
      }

      const chData = indexedDomesticTradeDatasByType[type].filter(
        d => d.gsitcCode === "CH",
      );

      if (chData.length > 0) {
        data.chQty = chData
          .map(ch => ch.quantity)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.chQty > 0) {
          data.chQty = data.chQty / 1000;
        }

        data.chVal = chData
          .map(ch => ch.value)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.chQty > 0 && data.chVal > 0) {
          data.chFobcif = (data.chVal + 1000) / data.chQty;
          data.chFobcif = parseFloat(data.chFobcif.toFixed(3));
        }
      }

      const csData = indexedDomesticTradeDatasByType[type].filter(
        d => d.gsitcCode === "CS",
      );

      if (csData.length > 0) {
        data.csQty = csData
          .map(cs => cs.quantity)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.csQty > 0) {
          data.csQty = data.csQty / 1000;
        }

        data.csVal = csData
          .map(cs => cs.value)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.csQty > 0 && data.csVal) {
          data.csFobcif = (data.csVal + 1000) / data.csQty;
          data.csFobcif = parseFloat(data.csFobcif.toFixed(3));
        }
      }

      const cdData = indexedDomesticTradeDatasByType[type].filter(
        d => d.gsitcCode === "CD",
      );

      if (cdData.length > 0) {
        data.cdQty = cdData
          .map(cd => cd.quantity)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.cdQty > 0) {
          data.cdQty = data.cdQty / 1000;
        }

        data.cdVal = cdData
          .map(cd => cd.value)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.cdQty > 0 && data.cdVal > 0) {
          data.cdFobcif = (data.cdVal + 1000) / data.cdQty;
          data.cdFobcif = parseFloat(data.cdFobcif.toFixed(3));
        }
      }

      const ctData = indexedDomesticTradeDatasByType[type].filter(
        d => d.gsitcCode === "CT",
      );

      if (ctData.length > 0) {
        data.ctQty = ctData
          .map(ct => ct.quantity)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.ctQty > 0) {
          data.ctQty = data.ctQty / 1000;
        }
        data.ctVal = ctData
          .map(ct => ct.value)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.ctQty > 0 && data.ctVal > 0) {
          data.ctFobcif = (data.ctVal + 1000) / data.ctQty;
          data.ctFobcif = parseFloat(data.ctFobcif.toFixed(3));
        }
      }
      const cpData = indexedDomesticTradeDatasByType[type].filter(
        d => d.gsitcCode === "CP",
      );

      if (cpData.length > 0) {
        data.cpQty = cpData
          .map(cp => cp.quantity)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.cpQty > 0) {
          data.cpQty = data.cpQty / 1000;
        }
        data.cpVal = cpData
          .map(cp => cp.value)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.cpQty > 0 && data.cpVal > 0) {
          data.cpFobcif = (data.cpVal + 1000) / data.cpQty;
          data.cpFobcif = parseFloat(data.cpFobcif.toFixed(3));
        }
      }

      const caData = indexedDomesticTradeDatasByType[type].filter(
        d => d.gsitcCode === "CA",
      );

      if (caData.length > 0) {
        data.caQty = caData
          .map(ca => ca.quantity)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.caQty > 0) {
          data.caQty = data.caQty / 1000;
        }
        data.caVal = caData
          .map(ca => ca.value)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.caQty > 0 && data.caVal > 0) {
          data.caFobcif = (data.caVal + 1000) / data.caQty;
          data.caFobcif = parseFloat(data.caFobcif.toFixed(3));
        }
      }

      const ckData = indexedDomesticTradeDatasByType[type].filter(
        d => d.gsitcCode === "CK",
      );

      if (ckData.length > 0) {
        data.ckQty = ckData
          .map(ck => ck.quantity)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.ckQty > 0) {
          data.ckQty = data.ckQty / 1000;
        }
        data.ckVal = ckData
          .map(ck => ck.value)
          .reduce((acc, curr) => acc + curr, 0);

        if (data.ckQty > 0 && data.ckVal > 0) {
          data.ckFobcif = (data.ckVal + 1000) / data.ckQty;
          data.ckFobcif = parseFloat(data.ckFobcif.toFixed(3));
        }
      }

      // console.log({ data });
      console.log("Save ExxumLogs");
      await collection("ExxumLogs").insertOne(data);
      console.log("Done ExxumLogs");

      transaction.begin(err => {
        if (err) {
          console.log("Error transaction begin", err);
        }

        const request = new sql.Request(transaction);
        request.query(
          `INSERT INTO dbo.exsumm1 (
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
              comment
            ) VALUES (
              '${recid}',
              '${data.year}', '${data.type.slice(0, 1)}', '',
              '${data.cbQty}', '${data.cbVal}','${data.cbFobcif}',
              '${data.chQty}', '${data.chVal}','${data.chFobcif}',
              '${data.csQty}', '${data.csVal}','${data.csFobcif}',
              '${data.cdQty}', '${data.cdVal}','${data.cdFobcif}',
              '${data.ctQty}', '${data.ctVal}','${data.ctFobcif}',
              '${data.cpQty}', '${data.cpVal}','${data.cpFobcif}',
              '${data.caQty}', '${data.caVal}','${data.caFobcif}',
              '${data.ckQty}', '${data.ckVal}','${data.ckFobcif}',
              '${data.ms}', '${data.comment}'
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
      console.log("Saving dbo.tmp1_exsumm1 ");
      recid += 1;
    }
    await sleep(10000);
  }
};

const cnProd = async ({ collection, transaction }) => {
  const year = 2022; //parseInt(dayjs().subtract(1, "year").format("YYYY"));
  console.log("create index bcs domestic production");
  await collection("BasicCocoaStatisticDomesticProductions").createIndex({
    year: 1,
    regionId: 1,
  });
  console.log("done create index cultivated area");

  const region = await collection("Regions")
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

  let bcsDomesticProduction = await collection(
    "BasicCocoaStatisticDomesticProductions",
  )
    .find({
      regionId: {
        $in: region.map(r => r._id),
      },
      year,
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
    year,
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
      return {
        _id: r._id,
        estateProduction: r.estateProduction ? r.estateProduction : 0,
        smallholdingProduction: r.smallholdingProduction
          ? r.smallholdingProduction
          : 0,
      };
    });

  if (peninsular.length > 0) {
    peninsularEstateProduction = peninsular
      .map(p => p.estateProduction)
      .reduce((acc, curr) => acc + curr, 0);

    peninsularSmallhProduction = peninsular
      .map(p => p.smallholdingProduction)
      .reduce((acc, curr) => acc + curr, 0);

    data.peninsular = peninsularEstateProduction + peninsularSmallhProduction;
  }

  //#### Sabah ######
  let sabahEstateProduction = 0,
    sabahSmallhProduction = 0;
  const sabah = bcsDomesticProduction
    .filter(reg => reg.regionName === "Sabah")
    .map(r => {
      return {
        _id: r._id,
        estateProduction: r.estateProduction ? r.estateProduction : 0,
        smallholdingProduction: r.smallholdingProduction
          ? r.smallholdingProduction
          : 0,
      };
    });

  if (sabah.length > 0) {
    sabahEstateProduction = sabah
      .map(p => p.estateProduction)
      .reduce((acc, curr) => acc + curr, 0);

    sabahSmallhProduction = sabah
      .map(p => p.smallholdingProduction)
      .reduce((acc, curr) => acc + curr, 0);

    data.sabah = sabahEstateProduction + sabahSmallhProduction;
  }

  //#### Sarawak ######
  let sarawakEstateProduction = 0,
    sarawakSmallhProduction = 0;
  const sarawak = bcsDomesticProduction
    .filter(reg => reg.regionName === "Sarawak")
    .map(r => {
      return {
        _id: r._id,
        estateProduction: r.estateProduction ? r.estateProduction : 0,
        smallholdingProduction: r.smallholdingProduction
          ? r.smallholdingProduction
          : 0,
      };
    });

  if (sarawak.length > 0) {
    sarawakEstateProduction = sarawak
      .map(p => p.estateProduction)
      .reduce((acc, curr) => acc + curr, 0);

    sarawakSmallhProduction = sarawak
      .map(p => p.smallholdingProduction)
      .reduce((acc, curr) => acc + curr, 0);

    data.sarawak = sarawakEstateProduction + sarawakSmallhProduction;
    //##################################################
  }
  data.malaysia = data.peninsular + data.sabah + data.sarawak;
  console.log("Save to MongoDB Logs");
  await collection("CNProdLogs").insertOne(data);

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
};

const grindingJob = async ({ collection, transaction }) => {
  const year = parseInt(dayjs().subtract(1, "year").format("YYYY"));

  console.log("create grinding index");
  await collection("BasicCocoaStatisticDomesticGrindings").createIndex({
    year: 1,
    regionId: 1,
  });
  console.log("done create grinding index");

  let domesticGrindings = await collection(
    "BasicCocoaStatisticDomesticGrindings",
  )
    .find({
      year,
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
  console.log("BasicCocoaStatisticDomesticGrindings", domesticGrindings.length);

  let data = {
    _id: uuidv4(),
    year,
    ntotground: 0,
    infostat: "",
    NoteBI: "e",
    NoteBM: "a",
    _createdAt: new Date().toISOString(),
    _updatedAt: new Date().toISOString(),
  };

  data.ntotground = domesticGrindings
    .map(g => g.grindingsTotal)
    .reduce((acc, curr) => acc + curr, 0);

  console.log("Save GrindingMSSQLLogs");
  await collection("GrindingMSSQLLogs").insertOne(data);
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
};

const tmpArea = async ({ collection, transaction }) => {
  const year = parseInt(dayjs().subtract(1, "year").format("YYYY"));
  console.log("create index bcs cultivated area");
  await collection("BasicCocoaStatisticDomesticCultivatedAreas").createIndex({
    year: 1,
    regionId: 1,
  });
  console.log("done create index cultivated area");

  const region = await collection("Regions")
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

  let bcsCultivatedArea = await collection(
    "BasicCocoaStatisticDomesticCultivatedAreas",
  )
    .find({
      regionId: {
        $in: region.map(r => r._id),
      },
      year,
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

  let data = {
    _id: uuidv4(),
    year,
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
  await collection("TmpAreaLogs").insertOne(data);
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
};

start();

function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}
