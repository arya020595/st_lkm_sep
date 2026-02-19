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
  mutation generateMalaysianSmallholderReport(
    $title: String!
    $code: String!
    $year: Int!
  ) {
    generateMalaysianSmallholderReport(title: $title, code: $code, year: $year)
  }
`;

const EstateCensus = () => {
  const router = useRouter();
  const notification = useNotification();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const [generateMalaysianSmallholderReport] = useMutation(REPORT);
  // ------------------------------------------------------------------------
  const reportMutations = {
    "Jadual 1a: Perangkaan Utama Pekebun Kecil Koko": "Jadual 1a",
    "Jadual 1b: Perangkaan Utama Pekebun Kecil Koko (Dirian)": "Jadual 1b",
    "Jadual 2a: Keluasan Tanaman Cukup Umur dan Muda Pekebun Kecil Koko":
      "Jadual 2a",
    "Jadual 2b: Keluasan Tanaman Cukup Umur dan Muda Pekebun Kecil Koko":
      "Jadual 2b",
    "Jadual 5: Bilangan Tenaga Kerja Di Sektor Pekebun Kecil Koko": "Jadual 5",
    "Jadual 7: Bilangan Pekebun Kecil Koko Di Malaysia Mengikut Jantina":
      "Jadual 7",
    "Jadual 9: Bilangan Pekebun Kecil Koko Di Malaysia Mengikut Bangsa":
      "Jadual 9",
    "Jadual 10: Tahap Pendidikan Pekebun Kecil Koko": "Jadual 10",
    "Jadual 11: Pekerjaan Utama Pekebun Kecil Koko": "Jadual 11",
    "Jadual 12: Bilangan Pekebun Kecil Koko Mengikut Status Pemilikan":
      "Jadual 12",
    "Jadual 4a: Bilangan Pekebun Kecil Mengikut Saiz Keluasan": "Jadual 4a",
    "Jadual 4b: Bilangan Pekebun Kecil Mengikut Kumpulan Saiz Keluasan":
      "Jadual 4b",
    "Jadual 8: Bilangan Pekebun Kecil Mengikut Umur": "Jadual 8",
    "Jadual 3a: Keluasan Tanaman Koko Mengikut Jenis Tanaman Tunggal dan Selingan":
      "Jadual 3a",
    "Jadual 3b: Keluasan Tanaman Koko Mengikut Jenis Tanaman Tunggal dan Selingan (Dirian)":
      "Jadual 3b",
    "Jadual 13: Bilangan Pekebun Yang Menghadapi Masalah Pasaran": "Jadual 13",
    "Jadual 14: Bilangan Pekebun Yang Dihadapi Pekebun Dalam Memasarkan Koko":
      "Jadual 14",
    "Jadual 15: Masalah yang Dihadapi Dalam Tanaman Koko": "Jadual 15",
    "Jadual 16: Faktor-faktor Tanaman Koko Terbiar": "Jadual 16",
    "Jadual 17: Pemulihan Tanaman Koko Terbiar": "Jadual 17",
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
    <AdminArea urlQuery={router.query} title="Malaysian Report">
      <Head>
        <title>Malaysian Report</title>
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
                  let result = await generateMalaysianSmallholderReport({
                    variables: {
                      ...filters,
                      code: reportMutation,
                      title: filters.type,
                    },
                  });
                  const reportUrl =
                    result.data.generateMalaysianSmallholderReport +
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
