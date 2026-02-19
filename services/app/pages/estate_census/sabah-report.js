import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import dayjs from "dayjs";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../../components/App";
import gql from "graphql-tag";
import { useMutation, useQuery } from "@apollo/client";
import PDFViewer from "../../components/PDFViewer";
import Select from "react-select";

const REPORT = gql`
  mutation generateSabahReport($title: String!, $code: String!, $year: Int!) {
    generateSabahReport(title: $title, code: $code, year: $year)
  }
`;

const EstateCensus = () => {
  const router = useRouter();
  const notification = useNotification();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const [generateSabahReport] = useMutation(REPORT);
  // ------------------------------------------------------------------------
  const reportMutations = {
    "Perangkaan Utama Koko": "Jadual 1",
    "Jumlah Luas Kawasan Koko Di Estet Mengikuti Negeri": "Jadual 2",
    "Luas Kawasan Ditanam Di Estet Koko Mengikuti Hak Milik Dan Negeri":
      "Jadual 3",
    "Bilangan Estet Koko Mengikuti Taraf Sah, Hakmilik, Dan Kumpulan Saiz Luas Hektar Ditanam":
      "Jadual 4",
    "Bilangan Estet Koko Mengikuti Taraf Sah, Hakmilik, Dan Negeri":
      "Jadual 5",
    "Keluasan Tanaman Di Estet Koko Mengikuti Taraf Sah": "Jadual 6",
    "Bilangan Estet Dan Luas Hektar Ditanam Di Estet Koko Mengikut Kumpulan Saiz Luas Hektar Properti":
      "Jadual 7",
    "Luasan Kawasan Koko Di Estet": "Jadual 8",
    "Pengeluaran Biji Koko": "Jadual 9",
    "Pengeluaran Biji Koko Kering": "Jadual 10",
    "Pengeluaran Biji Koko Kering": "Jadual 11",
    "Pengeluaran Biji Koko Kering": "Jadual 12",
    "Tanaman Baru Tanaman Semula": "Jadual 13",
    "Jumlah Gunatenaga Dan Daftar Gaji Mengikuti Kategori Pekerja Bagi Estet Koko":
      "Jadual 14",
    "Jumlah Gunatenaga Dan Daftar Gaji di Estet Koko": "Jadual 15",
    "Penggunaan Input (Baja)": "Jadual 16",
    "Penggunaan Input": "Jadual 17",
    "Perbelanjaan Modal Dan Nilai Harta Tetap Di Estet Koko":
      "Jadual 18",
    "Perbelanjaan Menanam, Modal, Dan, Menyelenggara Di Estet Koko":
      "Jadual 19",
  };
  // ------------------------------------------------------------------------
  let reportKeys = Object.keys(reportMutations);
  // if (process.env.NODE_ENV !== "production") {
  // reportKeys = reportKeys.sort();
  // }
  // console.log({ reportKeys });
  const [filters, setFilters] = useState({
    type: reportKeys[reportKeys.length - 1],
    year: dayjs().get("year") - 1,
  });
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

  return (
    <AdminArea urlQuery={router.query} title="Sabah Report">
      <Head>
        <title>Sabah Report</title>
      </Head>

      <div className="mt-26">
        <div className="w-full py-4 flex flex-col md:flex-row">
          <form
            onSubmit={async e => {
              if (e) e.preventDefault();
              showLoadingSpinner();
              try {
                const reportMutation = reportMutations[filters.type];
                if (typeof reportMutation === "string") {
                  let result = await generateSabahReport({
                    variables: {
                      ...filters,
                      code: reportMutation,
                      title: filters.type,
                    },
                  });
                  const reportUrl =
                    result.data.generateSabahReport +
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
                  options={reportKeys.map(key => {
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
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(EstateCensus);
