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

const REPORT = gql`
  mutation generateMonthlyAverageReportForDomesticCocoaPrices(
    $yearIds: [String!]!
    $centreIds: [String!]!
  ) {
    generateMonthlyAverageReportForDomesticCocoaPrices(
      yearIds: $yearIds
      centreIds: $centreIds
    )
  }
`;

const Report = () => {
  const notification = useNotification();
  const { data, error, loading, refetch } = useQuery(LIST_QUERIES);
  let allCentre = data?.allCentre || [];
  // let allLocalRegion = data?.allLocalRegion || [];

  const [generateMonthlyAverageReportForDomesticCocoaPrices] =
    useMutation(REPORT);
  const [filters, setFilters] = useState({
    yearIds: [],
    monthIds: [],
    centreIds: [],
  });
  // console.log({ filters });
  const [reportUrl, setReportUrl] = useState("");

  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1980;
    // console.log([...new Array(toYear - fromYear)])
    return [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });
  }, []);

  return (
    <div className="w-full py-4 flex flex-col md:flex-row">
      <form
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let result =
              await generateMonthlyAverageReportForDomesticCocoaPrices({
                variables: {
                  ...filters,
                },
              });
            const reportUrl =
              result.data.generateMonthlyAverageReportForDomesticCocoaPrices +
              "?t=" +
              new Date().toISOString();
            // console.log({ reportUrl });
            setReportUrl(reportUrl);
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
              value={filters.years || ""}
              onChange={selectedValues => {
                // console.log({ selectedValues });
                setFilters({
                  ...filters,
                  years: [selectedValues],
                  yearIds: [selectedValues.value],
                  // years: [...selectedValues],
                  // yearIds: selectedValues.map(item => item.value),
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Centre</label>
            <Select
              // isMulti
              // className="basic-multi-select w-full"
              required
              options={allCentre.map(item => {
                return {
                  value: item._id,
                  label: item.description,
                };
              })}
              classNamePrefix="select"
              value={filters.centres || ""}
              onChange={selectedValues => {
                // console.log({ selectedValues });
                setFilters({
                  ...filters,
                  centres: [selectedValues],
                  centreIds: [selectedValues.value],
                  // centres: [...selectedValues],
                  // centreIds: selectedValues.map(item => item.value),
                });
              }}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!filters.centreIds?.length || !filters.yearIds?.length}
          className={`bg-mantis-600 w-full py-2 rounded-md shadow-md mt-10 ${
            !filters.centreIds?.length || !filters.yearIds?.length
              ? "opacity-50"
              : ""
          }`}>
          <p className="text-md text-white font-bold">
            <i className="fa fa-book" />
            &nbsp; Generate
          </p>
        </button>
      </form>

      <div className="w-full md:w-3/4 pl-0 md:pl-4">
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
