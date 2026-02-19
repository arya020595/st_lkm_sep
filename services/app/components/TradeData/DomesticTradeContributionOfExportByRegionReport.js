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
import uniqBy from "lodash/uniqBy";

const QUERY = gql`
  query Query {
    allLocalSITCProducts {
      _id
      product
      newProduct
    }
  }
`;

const REPORT = gql`
  mutation generateDomesticTradeContributionOfExportByRegionReport(
    $product: String
    $year1: Int
    $year2: Int
    $description: String
  ) {
    generateDomesticTradeContributionOfExportByRegionReport(
      product: $product
      year1: $year1
      year2: $year2
      description: $description
    )
  }
`;

const Report = () => {
  const notification = useNotification();
  const { data, error, loading, refetch } = useQuery(QUERY);
  let allLocalSITCProducts = data?.allLocalSITCProducts || [];
  allLocalSITCProducts = uniqBy(
    allLocalSITCProducts.map(item => {
      return {
        ...item,
        product: item.newProduct || item.product,
      };
    }),
    "product",
  );
  // console.log("allLocalSITCProducts", allLocalSITCProducts.length);

  const [generateDomesticTradeContributionOfExportByRegionReport] =
    useMutation(REPORT);
  const [filters, setFilters] = useState({
    product: "",
    year1: "",
    year2: "",
  });
  const currentYear = dayjs().get("year");
  const disabled = !filters.product || !filters.year1 || !filters.year2;
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
            let result =
              await generateDomesticTradeContributionOfExportByRegionReport({
                variables: {
                  ...filters,
                },
              });
            const reportUrl =
              result.data
                .generateDomesticTradeContributionOfExportByRegionReport +
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
            <label>Product Type</label>
            <Select
              // isMulti
              // className="basic-multi-select w-full"
              required
              options={allLocalSITCProducts.map(item => {
                return {
                  value: item.product,
                  label: item.product,
                };
              })}
              classNamePrefix="select"
              value={
                filters.product
                  ? {
                      value: String(filters.product),
                      label: String(filters.product),
                    }
                  : ""
              }
              onChange={selectedValues => {
                // console.log({ selectedValues });
                setFilters({
                  ...filters,
                  product: selectedValues.value,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Year 1</label>
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
                filters.year1
                  ? {
                      value: String(filters.year1),
                      label: String(filters.year1),
                    }
                  : ""
              }
              onChange={selectedValues => {
                // console.log({ selectedValues });
                setFilters({
                  ...filters,
                  year1: parseInt(selectedValues.value),
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Year 2</label>
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
                filters.year2
                  ? {
                      value: String(filters.year2),
                      label: String(filters.year2),
                    }
                  : ""
              }
              onChange={selectedValues => {
                // console.log({ selectedValues });
                setFilters({
                  ...filters,
                  year2: parseInt(selectedValues.value),
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <input
              className="form-control"
              type="text"
              // required
              value={filters.description}
              onChange={e => {
                if (e) e.preventDefault();
                setFilters({
                  ...filters,
                  description: e.target.value,
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
