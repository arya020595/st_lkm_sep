const jadual18Resolvers = (tmpRows, indexedValues, estateIds) => {
  let rows = [];
  for (let row of tmpRows) {
    if (row.label === "1. Tanah") {
      let valueK06701 = 0;
      let valueK07101 = 0;
      let valueK06901 = 0;
      let valueK07001 = 0;
      let valueK07201 = 0;
      let valueK07301 = 0;
      let valueK07401 = 0;
      let valueK06801 = 0;
      for (let columnCodeKey of Object.values(row.columnCodes)) {
        const values = indexedValues.where({
          code: columnCodeKey,
        });
        for (const estId of estateIds) {
          if (columnCodeKey === "K06701") {
            valueK06701 =
              valueK06701 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07101") {
            valueK07101 =
              valueK07101 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06901") {
            valueK06901 =
              valueK06901 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07001") {
            valueK07001 =
              valueK07001 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07201") {
            valueK07201 =
              valueK07201 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07301") {
            valueK07301 =
              valueK07301 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07401") {
            valueK07401 =
              valueK07401 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06801") {
            valueK06801 =
              valueK06801 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          }
        }
      }

      row.columnCodes["Nilai Bersih Seperti pada 1 Januari"] = valueK06701;
      row.columnCodes["Jumlah"] = valueK07101;
      row.columnCodes["Baru"] = valueK06801;
      row.columnCodes["Terpakai"] = valueK06901;
      row.columnCodes["Binaan Sendiri"] = valueK07001;
      row.columnCodes["Harta Tetap Dijual Dilupus"] = valueK07201;
      row.columnCodes["Susut Nilai Sepanjang Tahun"] = valueK07301;
      row.columnCodes["Nilai Bersih Seperti Pada 31 Disember"] = valueK07401;
    } else if (
      row.label === "2. Bangunan dan binaan lain\n(a) Bangunan Kediaman"
    ) {
      let valueK06702 = 0;
      let valueK07102 = 0;
      let valueK06902 = 0;
      let valueK07002 = 0;
      let valueK07202 = 0;
      let valueK07302 = 0;
      let valueK07402 = 0;
      let valueK06802 = 0;
      for (let columnCodeKey of Object.values(row.columnCodes)) {
        const values = indexedValues.where({
          code: columnCodeKey,
        });
        for (const estId of estateIds) {
          if (columnCodeKey === "K06702") {
            valueK06702 =
              valueK06702 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07102") {
            valueK07102 =
              valueK07102 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06902") {
            valueK06902 =
              valueK06902 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07002") {
            valueK07002 =
              valueK07002 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07202") {
            valueK07202 =
              valueK07202 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07302") {
            valueK07302 =
              valueK07302 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07402") {
            valueK07402 =
              valueK07402 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06802") {
            valueK06802 =
              valueK06802 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          }
        }
      }

      row.columnCodes["Nilai Bersih Seperti pada 1 Januari"] = valueK06702;
      row.columnCodes["Jumlah"] = valueK07102;
      row.columnCodes["Baru"] = valueK06802;
      row.columnCodes["Terpakai"] = valueK06902;
      row.columnCodes["Binaan Sendiri"] = valueK07002;
      row.columnCodes["Harta Tetap Dijual Dilupus"] = valueK07202;
      row.columnCodes["Susut Nilai Sepanjang Tahun"] = valueK07302;
      row.columnCodes["Nilai Bersih Seperti Pada 31 Disember"] = valueK07402;
    } else if (
      row.label === "(b) Bukan Bangunan Kediaman (Cth: Stor, Pejabat, dll)"
    ) {
      let valueK06703 = 0;
      let valueK07103 = 0;
      let valueK06903 = 0;
      let valueK07003 = 0;
      let valueK07203 = 0;
      let valueK07303 = 0;
      let valueK07403 = 0;
      let valueK06803 = 0;
      for (let columnCodeKey of Object.values(row.columnCodes)) {
        const values = indexedValues.where({
          code: columnCodeKey,
        });
        for (const estId of estateIds) {
          if (columnCodeKey === "K06703") {
            valueK06703 =
              valueK06703 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07103") {
            valueK07103 =
              valueK07103 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06903") {
            valueK06903 =
              valueK06903 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07003") {
            valueK07003 =
              valueK07003 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07203") {
            valueK07203 =
              valueK07203 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07303") {
            valueK07303 =
              valueK07303 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07403") {
            valueK07403 =
              valueK07403 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06803") {
            valueK06803 =
              valueK06803 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          }
        }
      }

      row.columnCodes["Nilai Bersih Seperti pada 1 Januari"] = valueK06703;
      row.columnCodes["Jumlah"] = valueK07103;
      row.columnCodes["Baru"] = valueK06803;
      row.columnCodes["Terpakai"] = valueK06903;
      row.columnCodes["Binaan Sendiri"] = valueK07003;
      row.columnCodes["Harta Tetap Dijual Dilupus"] = valueK07203;
      row.columnCodes["Susut Nilai Sepanjang Tahun"] = valueK07303;
      row.columnCodes["Nilai Bersih Seperti Pada 31 Disember"] = valueK07403;
    } else if (row.label === "(c) Binaan-binaan lain (Kecuali pembangunan)") {
      let valueK06704 = 0;
      let valueK07104 = 0;
      let valueK06904 = 0;
      let valueK07004 = 0;
      let valueK07204 = 0;
      let valueK07304 = 0;
      let valueK07404 = 0;
      let valueK06804 = 0;
      for (let columnCodeKey of Object.values(row.columnCodes)) {
        const values = indexedValues.where({
          code: columnCodeKey,
        });
        for (const estId of estateIds) {
          if (columnCodeKey === "K06704") {
            valueK06704 =
              valueK06704 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07104") {
            valueK07104 =
              valueK07104 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06904") {
            valueK06904 =
              valueK06904 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07004") {
            valueK07004 =
              valueK07004 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07204") {
            valueK07204 =
              valueK07204 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07304") {
            valueK07304 =
              valueK07304 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07404") {
            valueK07404 =
              valueK07404 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06804") {
            valueK06804 =
              valueK06804 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          }
        }
      }

      row.columnCodes["Nilai Bersih Seperti pada 1 Januari"] = valueK06704;
      row.columnCodes["Jumlah"] = valueK07104;
      row.columnCodes["Baru"] = valueK06804;
      row.columnCodes["Terpakai"] = valueK06904;
      row.columnCodes["Binaan Sendiri"] = valueK07004;
      row.columnCodes["Harta Tetap Dijual Dilupus"] = valueK07204;
      row.columnCodes["Susut Nilai Sepanjang Tahun"] = valueK07304;
      row.columnCodes["Nilai Bersih Seperti Pada 31 Disember"] = valueK07404;
    } else if (row.label === "3. Pembangunan Tanah") {
      let valueK06705 = 0;
      let valueK07105 = 0;
      let valueK06905 = 0;
      let valueK07005 = 0;
      let valueK07205 = 0;
      let valueK07305 = 0;
      let valueK07405 = 0;
      let valueK06805 = 0;
      for (let columnCodeKey of Object.values(row.columnCodes)) {
        const values = indexedValues.where({
          code: columnCodeKey,
        });
        for (const estId of estateIds) {
          if (columnCodeKey === "K06705") {
            valueK06705 =
              valueK06705 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07105") {
            valueK07105 =
              valueK07105 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06905") {
            valueK06905 =
              valueK06905 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07005") {
            valueK07005 =
              valueK07005 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07205") {
            valueK07205 =
              valueK07205 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07305") {
            valueK07305 =
              valueK07305 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07405") {
            valueK07405 =
              valueK07405 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06805") {
            valueK06805 =
              valueK06805 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          }
        }
      }

      row.columnCodes["Nilai Bersih Seperti pada 1 Januari"] = valueK06705;
      row.columnCodes["Jumlah"] = valueK07105;
      row.columnCodes["Baru"] = 0;
      row.columnCodes["Terpakai"] = 0;
      row.columnCodes["Binaan Sendiri"] = valueK07005;
      row.columnCodes["Harta Tetap Dijual Dilupus"] = 0;
      row.columnCodes["Susut Nilai Sepanjang Tahun"] = 0;
      row.columnCodes["Nilai Bersih Seperti Pada 31 Disember"] = valueK07405;
    } else if (
      row.label === "4. Alat-alat Pengangkutan\n(a) Kereta-kereta Penumpang"
    ) {
      let valueK06706 = 0;
      let valueK07106 = 0;
      let valueK06906 = 0;
      let valueK07006 = 0;
      let valueK07206 = 0;
      let valueK07306 = 0;
      let valueK07406 = 0;
      let valueK06806 = 0;
      for (let columnCodeKey of Object.values(row.columnCodes)) {
        const values = indexedValues.where({
          code: columnCodeKey,
        });
        for (const estId of estateIds) {
          if (columnCodeKey === "K06706") {
            valueK06706 =
              valueK06706 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07106") {
            valueK07106 =
              valueK07106 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06906") {
            valueK06906 =
              valueK06906 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07006") {
            valueK07006 =
              valueK07006 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07206") {
            valueK07206 =
              valueK07206 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07306") {
            valueK07306 =
              valueK07306 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07406") {
            valueK07406 =
              valueK07406 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06806") {
            valueK06806 =
              valueK06806 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          }
        }
      }

      row.columnCodes["Nilai Bersih Seperti pada 1 Januari"] = valueK06706;
      row.columnCodes["Jumlah"] = valueK07106;
      row.columnCodes["Baru"] = valueK06806;
      row.columnCodes["Terpakai"] = valueK06906;
      row.columnCodes["Binaan Sendiri"] = valueK07006;
      row.columnCodes["Harta Tetap Dijual Dilupus"] = valueK07206;
      row.columnCodes["Susut Nilai Sepanjang Tahun"] = valueK07306;
      row.columnCodes["Nilai Bersih Seperti Pada 31 Disember"] = valueK07406;
    } else if (row.label === "(b) Lori-lori, Van, Pikap, dll") {
      let valueK06707 = 0;
      let valueK07107 = 0;
      let valueK06907 = 0;
      let valueK07007 = 0;
      let valueK07207 = 0;
      let valueK07307 = 0;
      let valueK07407 = 0;
      let valueK06807 = 0;
      for (let columnCodeKey of Object.values(row.columnCodes)) {
        const values = indexedValues.where({
          code: columnCodeKey,
        });
        for (const estId of estateIds) {
          if (columnCodeKey === "K06707") {
            valueK06707 =
              valueK06707 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07107") {
            valueK07107 =
              valueK07107 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06907") {
            valueK06907 =
              valueK06907 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07007") {
            valueK07007 =
              valueK07007 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07207") {
            valueK07207 =
              valueK07207 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07307") {
            valueK07307 =
              valueK07307 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07407") {
            valueK07407 =
              valueK07407 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06807") {
            valueK06807 =
              valueK06807 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          }
        }
      }

      row.columnCodes["Nilai Bersih Seperti pada 1 Januari"] = valueK06707;
      row.columnCodes["Jumlah"] = valueK07107;
      row.columnCodes["Baru"] = valueK06807;
      row.columnCodes["Terpakai"] = valueK06907;
      row.columnCodes["Binaan Sendiri"] = valueK07007;
      row.columnCodes["Harta Tetap Dijual Dilupus"] = valueK07207;
      row.columnCodes["Susut Nilai Sepanjang Tahun"] = valueK07307;
      row.columnCodes["Nilai Bersih Seperti Pada 31 Disember"] = valueK07407;
    } else if (row.label === "(c) Lain-lain\n(Bot, motosikal, troli)") {
      let valueK06708 = 0;
      let valueK07108 = 0;
      let valueK06908 = 0;
      let valueK07008 = 0;
      let valueK07208 = 0;
      let valueK07308 = 0;
      let valueK07408 = 0;
      let valueK06808 = 0;
      for (let columnCodeKey of Object.values(row.columnCodes)) {
        const values = indexedValues.where({
          code: columnCodeKey,
        });
        for (const estId of estateIds) {
          if (columnCodeKey === "K06708") {
            valueK06708 =
              valueK06708 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07108") {
            valueK07108 =
              valueK07108 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06908") {
            valueK06908 =
              valueK06908 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07008") {
            valueK07008 =
              valueK07008 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07208") {
            valueK07208 =
              valueK07208 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07308") {
            valueK07308 =
              valueK07308 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07408") {
            valueK07408 =
              valueK07408 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06808") {
            valueK06808 =
              valueK06808 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          }
        }
      }

      row.columnCodes["Nilai Bersih Seperti pada 1 Januari"] = valueK06708;
      row.columnCodes["Jumlah"] = valueK07108;
      row.columnCodes["Baru"] = valueK06808;
      row.columnCodes["Terpakai"] = valueK06908;
      row.columnCodes["Binaan Sendiri"] = valueK07008;
      row.columnCodes["Harta Tetap Dijual Dilupus"] = valueK07208;
      row.columnCodes["Susut Nilai Sepanjang Tahun"] = valueK07308;
      row.columnCodes["Nilai Bersih Seperti Pada 31 Disember"] = valueK07408;
    } else if (row.label === "5. Jentera Pertanian") {
      let valueK06709 = 0;
      let valueK07109 = 0;
      let valueK06909 = 0;
      let valueK07009 = 0;
      let valueK07209 = 0;
      let valueK07309 = 0;
      let valueK07409 = 0;
      let valueK06809 = 0;
      for (let columnCodeKey of Object.values(row.columnCodes)) {
        const values = indexedValues.where({
          code: columnCodeKey,
        });
        for (const estId of estateIds) {
          if (columnCodeKey === "K06709") {
            valueK06709 =
              valueK06709 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07109") {
            valueK07109 =
              valueK07109 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06909") {
            valueK06909 =
              valueK06909 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07009") {
            valueK07009 =
              valueK07009 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07209") {
            valueK07209 =
              valueK07209 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07309") {
            valueK07309 =
              valueK07309 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07409") {
            valueK07409 =
              valueK07409 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06809") {
            valueK06809 =
              valueK06809 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          }
        }
      }

      row.columnCodes["Nilai Bersih Seperti pada 1 Januari"] = valueK06709;
      row.columnCodes["Jumlah"] = valueK07109;
      row.columnCodes["Baru"] = valueK06809;
      row.columnCodes["Terpakai"] = valueK06909;
      row.columnCodes["Binaan Sendiri"] = valueK07009;
      row.columnCodes["Harta Tetap Dijual Dilupus"] = valueK07209;
      row.columnCodes["Susut Nilai Sepanjang Tahun"] = valueK07309;
      row.columnCodes["Nilai Bersih Seperti Pada 31 Disember"] = valueK07409;
    } else if (row.label === "(b) Jentera loji dan kelengkapan") {
      let valueK06710 = 0;
      let valueK07110 = 0;
      let valueK06910 = 0;
      let valueK07010 = 0;
      let valueK07210 = 0;
      let valueK07310 = 0;
      let valueK07410 = 0;
      let valueK06810 = 0;
      for (let columnCodeKey of Object.values(row.columnCodes)) {
        const values = indexedValues.where({
          code: columnCodeKey,
        });
        for (const estId of estateIds) {
          if (columnCodeKey === "K06710") {
            valueK06710 =
              valueK06710 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07110") {
            valueK07110 =
              valueK07110 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06910") {
            valueK06910 =
              valueK06910 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07010") {
            valueK07010 =
              valueK07010 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07210") {
            valueK07210 =
              valueK07210 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07310") {
            valueK07310 =
              valueK07310 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07410") {
            valueK07410 =
              valueK07410 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06810") {
            valueK06810 =
              valueK06810 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          }
        }
      }

      row.columnCodes["Nilai Bersih Seperti pada 1 Januari"] = valueK06710;
      row.columnCodes["Jumlah"] = valueK07110;
      row.columnCodes["Baru"] = valueK06810;
      row.columnCodes["Terpakai"] = valueK06910;
      row.columnCodes["Binaan Sendiri"] = valueK07010;
      row.columnCodes["Harta Tetap Dijual Dilupus"] = valueK07210;
      row.columnCodes["Susut Nilai Sepanjang Tahun"] = valueK07310;
      row.columnCodes["Nilai Bersih Seperti Pada 31 Disember"] = valueK07410;
    } else if (row.label === "(c) peralatan fermentasi") {
      let valueK06711 = 0;
      let valueK07111 = 0;
      let valueK06911 = 0;
      let valueK07011 = 0;
      let valueK07211 = 0;
      let valueK07311 = 0;
      let valueK07411 = 0;
      let valueK06811 = 0;
      for (let columnCodeKey of Object.values(row.columnCodes)) {
        const values = indexedValues.where({
          code: columnCodeKey,
        });
        for (const estId of estateIds) {
          if (columnCodeKey === "K06711") {
            valueK06711 =
              valueK06711 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07111") {
            valueK07111 =
              valueK07111 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06911") {
            valueK06911 =
              valueK06911 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07011") {
            valueK07011 =
              valueK07011 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07211") {
            valueK07211 =
              valueK07211 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07311") {
            valueK07311 =
              valueK07311 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07411") {
            valueK07411 =
              valueK07411 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06811") {
            valueK06811 =
              valueK06811 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          }
        }
      }

      row.columnCodes["Nilai Bersih Seperti pada 1 Januari"] = valueK06711;
      row.columnCodes["Jumlah"] = valueK07111;
      row.columnCodes["Baru"] = valueK06811;
      row.columnCodes["Terpakai"] = valueK06911;
      row.columnCodes["Binaan Sendiri"] = valueK07011;
      row.columnCodes["Harta Tetap Dijual Dilupus"] = valueK07211;
      row.columnCodes["Susut Nilai Sepanjang Tahun"] = valueK07311;
      row.columnCodes["Nilai Bersih Seperti Pada 31 Disember"] = valueK07411;
    } else if (row.label === "(d) peralatan pengeringan") {
      let valueK06712 = 0;
      let valueK07112 = 0;
      let valueK06912 = 0;
      let valueK07012 = 0;
      let valueK07212 = 0;
      let valueK07312 = 0;
      let valueK07412 = 0;
      let valueK06812 = 0;
      for (let columnCodeKey of Object.values(row.columnCodes)) {
        const values = indexedValues.where({
          code: columnCodeKey,
        });
        for (const estId of estateIds) {
          if (columnCodeKey === "K06712") {
            valueK06712 =
              valueK06712 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07112") {
            valueK07112 =
              valueK07112 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06912") {
            valueK06912 =
              valueK06912 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07012") {
            valueK07012 =
              valueK07012 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07212") {
            valueK07212 =
              valueK07212 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07312") {
            valueK07312 =
              valueK07312 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07412") {
            valueK07412 =
              valueK07412 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06812") {
            valueK06812 =
              valueK06812 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          }
        }
      }

      row.columnCodes["Nilai Bersih Seperti pada 1 Januari"] = valueK06712;
      row.columnCodes["Jumlah"] = valueK07112;
      row.columnCodes["Baru"] = valueK06812;
      row.columnCodes["Terpakai"] = valueK06912;
      row.columnCodes["Binaan Sendiri"] = valueK07012;
      row.columnCodes["Harta Tetap Dijual Dilupus"] = valueK07212;
      row.columnCodes["Susut Nilai Sepanjang Tahun"] = valueK07312;
      row.columnCodes["Nilai Bersih Seperti Pada 31 Disember"] = valueK07412;
    } else if (row.label === "6. Perabot dan Pemasangan") {
      let valueK06713 = 0;
      let valueK07113 = 0;
      let valueK06913 = 0;
      let valueK07013 = 0;
      let valueK07213 = 0;
      let valueK07313 = 0;
      let valueK07413 = 0;
      let valueK06813 = 0;
      for (let columnCodeKey of Object.values(row.columnCodes)) {
        const values = indexedValues.where({
          code: columnCodeKey,
        });
        for (const estId of estateIds) {
          if (columnCodeKey === "K06713") {
            valueK06713 =
              valueK06713 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07113") {
            valueK07113 =
              valueK07113 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06913") {
            valueK06913 =
              valueK06913 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07013") {
            valueK07013 =
              valueK07013 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07213") {
            valueK07213 =
              valueK07213 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07313") {
            valueK07313 =
              valueK07313 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K07413") {
            valueK07413 =
              valueK07413 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          } else if (columnCodeKey === "K06813") {
            valueK06813 =
              valueK06813 +
              values
                .filter(v => v.estateId === estId)
                .map(vl => vl.value)
                .reduce((acc, curr) => acc + curr, 0);
          }
        }
      }

      row.columnCodes["Nilai Bersih Seperti pada 1 Januari"] = valueK06713;
      row.columnCodes["Jumlah"] = valueK07113;
      row.columnCodes["Baru"] = valueK06813;
      row.columnCodes["Terpakai"] = valueK06913;
      row.columnCodes["Binaan Sendiri"] = valueK07013;
      row.columnCodes["Harta Tetap Dijual Dilupus"] = valueK07213;
      row.columnCodes["Susut Nilai Sepanjang Tahun"] = valueK07313;
      row.columnCodes["Nilai Bersih Seperti Pada 31 Disember"] = valueK07413;
    } else if (row.label === "7. Lain Lain Jenis Harta Tetap") {
      {
        let valueK06714 = 0;
        let valueK07114 = 0;
        let valueK06914 = 0;
        let valueK07014 = 0;
        let valueK07214 = 0;
        let valueK07314 = 0;
        let valueK07414 = 0;
        let valueK06814 = 0;
        for (let columnCodeKey of Object.values(row.columnCodes)) {
          const values = indexedValues.where({
            code: columnCodeKey,
          });
          for (const estId of estateIds) {
            if (columnCodeKey === "K06714") {
              valueK06714 =
                valueK06714 +
                values
                  .filter(v => v.estateId === estId)
                  .map(vl => vl.value)
                  .reduce((acc, curr) => acc + curr, 0);
            } else if (columnCodeKey === "K07114") {
              valueK07114 =
                valueK07114 +
                values
                  .filter(v => v.estateId === estId)
                  .map(vl => vl.value)
                  .reduce((acc, curr) => acc + curr, 0);
            } else if (columnCodeKey === "K06914") {
              valueK06914 =
                valueK06914 +
                values
                  .filter(v => v.estateId === estId)
                  .map(vl => vl.value)
                  .reduce((acc, curr) => acc + curr, 0);
            } else if (columnCodeKey === "K07014") {
              valueK07014 =
                valueK07014 +
                values
                  .filter(v => v.estateId === estId)
                  .map(vl => vl.value)
                  .reduce((acc, curr) => acc + curr, 0);
            } else if (columnCodeKey === "K07214") {
              valueK07214 =
                valueK07214 +
                values
                  .filter(v => v.estateId === estId)
                  .map(vl => vl.value)
                  .reduce((acc, curr) => acc + curr, 0);
            } else if (columnCodeKey === "K07314") {
              valueK07314 =
                valueK07314 +
                values
                  .filter(v => v.estateId === estId)
                  .map(vl => vl.value)
                  .reduce((acc, curr) => acc + curr, 0);
            } else if (columnCodeKey === "K07414") {
              valueK07414 =
                valueK07414 +
                values
                  .filter(v => v.estateId === estId)
                  .map(vl => vl.value)
                  .reduce((acc, curr) => acc + curr, 0);
            } else if (columnCodeKey === "K06814") {
              valueK06814 =
                valueK06814 +
                values
                  .filter(v => v.estateId === estId)
                  .map(vl => vl.value)
                  .reduce((acc, curr) => acc + curr, 0);
            }
          }
        }

        row.columnCodes["Nilai Bersih Seperti pada 1 Januari"] = valueK06714;
        row.columnCodes["Jumlah"] = valueK07114;
        row.columnCodes["Baru"] = valueK06814;
        row.columnCodes["Terpakai"] = valueK06914;
        row.columnCodes["Binaan Sendiri"] = valueK07014;
        row.columnCodes["Harta Tetap Dijual Dilupus"] = valueK07214;
        row.columnCodes["Susut Nilai Sepanjang Tahun"] = valueK07314;
        row.columnCodes["Nilai Bersih Seperti Pada 31 Disember"] = valueK07414;
      }
    } else if (row.label === "Jumlah") {
      {
        let valueK06715 = 0;
        let valueK07115 = 0;
        let valueK06915 = 0;
        let valueK07015 = 0;
        let valueK07215 = 0;
        let valueK07315 = 0;
        let valueK07415 = 0;
        let valueK06815 = 0;
        for (let columnCodeKey of Object.values(row.columnCodes)) {
          const values = indexedValues.where({
            code: columnCodeKey,
          });
          for (const estId of estateIds) {
            if (columnCodeKey === "K06715") {
              valueK06715 =
                valueK06715 +
                values
                  .filter(v => v.estateId === estId)
                  .map(vl => vl.value)
                  .reduce((acc, curr) => acc + curr, 0);
            } else if (columnCodeKey === "K07115") {
              valueK07115 =
                valueK07115 +
                values
                  .filter(v => v.estateId === estId)
                  .map(vl => vl.value)
                  .reduce((acc, curr) => acc + curr, 0);
            } else if (columnCodeKey === "K06915") {
              valueK06915 =
                valueK06915 +
                values
                  .filter(v => v.estateId === estId)
                  .map(vl => vl.value)
                  .reduce((acc, curr) => acc + curr, 0);
            } else if (columnCodeKey === "K07015") {
              valueK07015 =
                valueK07015 +
                values
                  .filter(v => v.estateId === estId)
                  .map(vl => vl.value)
                  .reduce((acc, curr) => acc + curr, 0);
            } else if (columnCodeKey === "K07215") {
              valueK07215 =
                valueK07215 +
                values
                  .filter(v => v.estateId === estId)
                  .map(vl => vl.value)
                  .reduce((acc, curr) => acc + curr, 0);
            } else if (columnCodeKey === "K07315") {
              valueK07315 =
                valueK07315 +
                values
                  .filter(v => v.estateId === estId)
                  .map(vl => vl.value)
                  .reduce((acc, curr) => acc + curr, 0);
            } else if (columnCodeKey === "K07415") {
              valueK07415 =
                valueK07415 +
                values
                  .filter(v => v.estateId === estId)
                  .map(vl => vl.value)
                  .reduce((acc, curr) => acc + curr, 0);
            } else if (columnCodeKey === "K06815") {
              valueK06815 =
                valueK06815 +
                values
                  .filter(v => v.estateId === estId)
                  .map(vl => vl.value)
                  .reduce((acc, curr) => acc + curr, 0);
            }
          }
        }

        row.columnCodes["Nilai Bersih Seperti pada 1 Januari"] = valueK06715;
        row.columnCodes["Jumlah"] = valueK07115;
        row.columnCodes["Baru"] = valueK06815;
        row.columnCodes["Terpakai"] = valueK06915;
        row.columnCodes["Binaan Sendiri"] = valueK07015;
        row.columnCodes["Harta Tetap Dijual Dilupus"] = valueK07215;
        row.columnCodes["Susut Nilai Sepanjang Tahun"] = valueK07315;
        row.columnCodes["Nilai Bersih Seperti Pada 31 Disember"] = valueK07415;
      }
    }

    rows.push(row);
  }

  return rows;
};
exports.jadual18Resolvers = jadual18Resolvers;
