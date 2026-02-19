import React, { useState, useEffect, useMemo } from "react";
// import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../App";
import gql from "graphql-tag";
import { useMutation, useQuery } from "@apollo/client";
import PDFViewer from "../PDFViewer";
import dayjs from "dayjs";
import Select from "react-select";

const LIST_QUERIES = gql`
  query listQueries {
    allLocalRegion {
      _id
      description
    }
    allCentre {
      _id
      description
    }
  }
`;

const REPORT_LUAS_KAWASAN_KOKO = gql`
  mutation generateEstateCensusReportLuasKawasanKoko($year: Int!) {
    generateEstateCensusReportLuasKawasanKoko(year: $year)
  }
`;

const REPORT_TARAF_SAH_JENIS_HAK_MILIK = gql`
  mutation generateEstateCensusReportTarafSahJenisHakMilik($year: Int!) {
    generateEstateCensusReportTarafSahJenisHakMilik(year: $year)
  }
`;

const REPORT_PROFILE_UMUR = gql`
  mutation generateEstateCensusReportProfileUmur($year: Int!) {
    generateEstateCensusReportProfileUmur(year: $year)
  }
`;

const REPORT_KELUASAN_PENGELUARAN_HASIL = gql`
  mutation generateEstateCensusReportKeluasanPengeluaranHasil($year: Int!) {
    generateEstateCensusReportKeluasanPengeluaranHasil(year: $year)
  }
`;

const REPORT_PERTAMBAHAN_KELUASAN_01 = gql`
  mutation generateEstateCensusReportPertambahanKeluasan01($year: Int!) {
    generateEstateCensusReportPertambahanKeluasan01(year: $year)
  }
`;

const REPORT_PERTAMBAHAN_KELUASAN_02 = gql`
  mutation generateEstateCensusReportPertambahanKeluasan02($year: Int!) {
    generateEstateCensusReportPertambahanKeluasan02(year: $year)
  }
`;

const REPORT_PERTAMBAHAN_KELUASAN_03 = gql`
  mutation generateEstateCensusReportPertambahanKeluasan03($year: Int!) {
    generateEstateCensusReportPertambahanKeluasan03(year: $year)
  }
`;

const REPORT_LIST_OF_ESTATE_WITH_TOTAL_HA = gql`
  mutation generateListOfEstateWithTotalHectarage($year: Int!) {
    generateListOfEstateWithTotalHectarage(year: $year)
  }
`;

const REPORT = gql`
  mutation generateEstateCensusReport(
    $title: String!
    $code: String!
    $year: Int!
  ) {
    generateEstateCensusReport(title: $title, code: $code, year: $year)
  }
`;

const Report = () => {
  const notification = useNotification();

  const [generateEstateCensusReportLuasKawasanKoko] = useMutation(
    REPORT_LUAS_KAWASAN_KOKO,
  );
  const [generateEstateCensusReportTarafSahJenisHakMilik] = useMutation(
    REPORT_TARAF_SAH_JENIS_HAK_MILIK,
  );
  const [generateEstateCensusReportProfileUmur] =
    useMutation(REPORT_PROFILE_UMUR);
  const [generateEstateCensusReportKeluasanPengeluaranHasil] = useMutation(
    REPORT_KELUASAN_PENGELUARAN_HASIL,
  );
  const [generateEstateCensusReportPertambahanKeluasan01] = useMutation(
    REPORT_PERTAMBAHAN_KELUASAN_01,
  );
  const [generateEstateCensusReportPertambahanKeluasan02] = useMutation(
    REPORT_PERTAMBAHAN_KELUASAN_02,
  );
  const [generateEstateCensusReportPertambahanKeluasan03] = useMutation(
    REPORT_PERTAMBAHAN_KELUASAN_03,
  );
  const [generateListOfEstateWithTotalHectarage] = useMutation(
    REPORT_LIST_OF_ESTATE_WITH_TOTAL_HA,
  );

  const [generateEstateCensusReport] = useMutation(REPORT);
  //
  const reportMutations = {
    "Luas Kawasan Koko": generateEstateCensusReportLuasKawasanKoko,
    "0101 - Taraf Sah dan Jenis Hak Milik":
      generateEstateCensusReportTarafSahJenisHakMilik,
    "0201 - Profile Umur": generateEstateCensusReportProfileUmur,
    "Keluasan, Pengeluaran, dan Hasil":
      generateEstateCensusReportKeluasanPengeluaranHasil,
    "0401 - Pertambahan Keluasan 01": generateEstateCensusReportPertambahanKeluasan01,
    "0402 - Pertambahan Keluasan 02": generateEstateCensusReportPertambahanKeluasan02,
    "0403 - Pertambahan Keluasan 03": generateEstateCensusReportPertambahanKeluasan03,
    "0404 - Pertambahan Keluasan 04": "0404",
    "2201 - Daftar Gaji Mengikuti Kategori Pekerja Estet, Pekerja Kilang, dan Pekerja Sambilan":
      "2201",
    "2101 - Daftar Gaji Mengikuti Kategori Pengurusan Profesional, Bukan Profesional, Kakitangan":
      "2101",
    "2001 - Kos Pengeluaran (Langsung & Tidak Langsung)": "2001",
    "1701 - Pengurangan Keluasan Tanaman Koko": "1701",
    "1601 - Keluasan Koko": "1601",
    "1501 - Kos Pengeluaran (Langsung) Mengikuti Komponen dan Aktiviti": "1501",
    "1401 - Jumlah Gunatenaga": "1401",
    "1301 - Jumlah Gunatenaga (Bukan Warganegara - Perempuan)": "1301",
    "1201 - Jumlah Gunatenaga (Warganegara - Wanita)": "1201",
    "1101 - Jumlah Gunatenaga (Bukan Warganegara - Lelaki)": "1101",
    "1001 - Jumlah Gunatenaga (Warganegara - Lelaki)": "1001",
    "0901 - Kehilangan Tanaman": "0901",
    "0801 - Pemulihan": "0801",
    "0701 - Cadangan Ditanam dan Dipulihkan": "0701",
    "0601 - Keluasan Tanaman": "0601",
    "0501 - Pengurangan Keluasan 01": "0501",
    "0502 - Pengurangan Keluasan 02": "0502",
    "0503 - Pengurangan Keluasan 03": "0503",
    "0504 - Pengurangan Keluasan 04": "0504",
    "1901 - Profail Saiz Keluasan": "1901",
    "List of Estate With Total Hectarage":
      generateListOfEstateWithTotalHectarage,
  };
  let reportKeys = Object.keys(reportMutations);
  const [filters, setFilters] = useState({
    type: reportKeys[reportKeys.length - 1],
    year: dayjs().get("year") - 1,
  });
  const currentYear = dayjs().get("year");
  const disabled = !filters.year;
  // console.log({ filters });
  const [reportUrl, setReportUrl] = useState("");

  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const year = 1980;
    // console.log([...new Array(toYear - year)])
    return [...new Array(toYear - year)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });
  }, []);

  const MONTHS = useMemo(() => {
    return [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
  }, []);

  return (
    <div className="w-full py-4 flex flex-col md:flex-row">
      <form
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            const reportMutation = reportMutations[filters.type];
            if (typeof reportMutation === "string") {
              let result = await generateEstateCensusReport({
                variables: {
                  ...filters,
                  code: reportMutation,
                  title: filters.type,
                },
              });
              const reportUrl =
                result.data.generateEstateCensusReport +
                "?t=" +
                new Date().toISOString();
              // console.log({ reportUrl, reportMutationName });
              setReportUrl(reportUrl);
            } else {
              let result = await reportMutation({
                variables: {
                  ...filters,
                },
              });
              const reportMutationName = Object.keys(result.data)?.[0];
              const reportUrl =
                result.data[reportMutationName] +
                "?t=" +
                new Date().toISOString();
              // console.log({ reportUrl, reportMutationName });
              setReportUrl(reportUrl);
            }
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}
        className="w-full md:w-1/4">
        <div className="border-2 border-gray-400 rounded-md px-4 py-4">
          <div className="font-bold">Report Filters</div>
          <hr className="my-2" />
          <div className="form-group">
            <label>Report</label>
            <Select
              // isMulti
              // className="basic-multi-select w-full"
              required
              options={Object.keys(reportMutations).map(key => {
                return { label: key, value: key };
              })}
              classNamePrefix="select"
              value={
                filters.type
                  ? {
                      value: String(filters.type),
                      label: String(filters.type),
                    }
                  : ""
              }
              onChange={selectedValues => {
                // console.log({ selectedValues });
                setFilters({
                  ...filters,
                  type: selectedValues.value,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Year</label>
            <Select
              // isMulti
              // className="basic-multi-select w-full"
              required
              options={YEARS.map(item => {
                return {
                  value: item,
                  label: item,
                };
              })}
              classNamePrefix="select"
              value={
                filters.year
                  ? {
                      value: String(filters.year),
                      label: String(filters.year),
                    }
                  : ""
              }
              onChange={selectedValues => {
                // console.log({ selectedValues });
                setFilters({
                  ...filters,
                  year: parseInt(selectedValues.value),
                });
              }}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={disabled}
          className={`bg-mantis-600 w-full py-2 rounded-md shadow-md mt-10 ${
            disabled ? "opacity-50" : ""
          }`}>
          <p className="text-md text-white font-bold">
            <i className="fa fa-book" />
            &nbsp; Generate
          </p>
        </button>
      </form>

      <div className="w-full md:w-3/4 pl-0 md:pl-4 md:pr-4">
        {!reportUrl ? (
          <div className="py-8">
            <img
              src="/lkm/images/menu-08_unstructured-document_icon.svg"
              className="w-2/12 mx-auto opacity-75"
            />
            <div className="text-center font-bold text-lg">
              Please set the filter first, then press Generate Button
            </div>
          </div>
        ) : (
          <PDFViewer
            height={600}
            pdfUrl={reportUrl}
            // pdfUrl={"https://www.orimi.com/pdf-test.pdf"}
          />
        )}
      </div>
    </div>
  );
};

export default withApollo({ ssr: true })(Report);
