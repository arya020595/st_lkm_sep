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
      useForReport
      newProduct
    }
  }
`;

const REPORT = gql`
  mutation generateDomesticTradeExportDestinationSourceReport(
    $type: String
    $product: String
    $year: Int
    $fromMonth: String
    $toMonth: String
    $title: String
    $size: Int
    $description2: String
    $description3: String
  ) {
    generateDomesticTradeExportDestinationSourceReport(
      type: $type
      product: $product
      year: $year
      fromMonth: $fromMonth
      toMonth: $toMonth
      title: $title
      size: $size
      description2: $description2
      description3: $description3
    )
  }
`;

const Report = () => {
  const notification = useNotification();
  const { data, error, loading, refetch } = useQuery(QUERY);
  // let allLocalSITCProducts = data?.allLocalSITCProducts || [];
  let allLocalSITCProducts = data?.allLocalSITCProducts || [];
  // .filter(
  //   product => !!product.useForReport,
  // );
  allLocalSITCProducts = uniqBy(
    allLocalSITCProducts.map(item => {
      return {
        ...item,
        product: item.newProduct || item.product,
      };
    }),
    "product",
  );

  const [generateDomesticTradeExportDestinationSourceReport] =
    useMutation(REPORT);
  const [filters, setFilters] = useState({
    type: "",
    product: "",
    year: "",
    fromMonth: "",
    toMonth: "",
    title: "",
    size: 100,
  });
  const currentYear = dayjs().get("year");
  const disabled =
    !filters.type ||
    !filters.product ||
    !filters.year ||
    !filters.fromMonth ||
    !filters.toMonth;
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
              await generateDomesticTradeExportDestinationSourceReport({
                variables: {
                  ...filters,
                },
              });
            const reportUrl =
              result.data.generateDomesticTradeExportDestinationSourceReport +
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
            <label>Type</label>
            <Select
              // isMulti
              // className="basic-multi-select w-full"
              required
              options={["Export", "Import", "Re-Export"].map(item => {
                return {
                  value: item,
                  label: item,
                };
              })}
              classNamePrefix="select"
              value={
                filters.type ? { value: filters.type, label: filters.type } : ""
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
          <div className="form-group">
            <label>Month From (Current Year)</label>
            <Select
              // isMulti
              // className="basic-multi-select w-full"
              required
              options={MONTHS.map(item => {
                return {
                  value: item,
                  label: item,
                };
              })}
              classNamePrefix="select"
              value={
                filters.fromMonth
                  ? { value: filters.fromMonth, label: filters.fromMonth }
                  : ""
              }
              onChange={selectedValues => {
                // console.log({ selectedValues });
                setFilters({
                  ...filters,
                  fromMonth: selectedValues.value,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Month To (Current Year)</label>
            <Select
              // isMulti
              // className="basic-multi-select w-full"
              required
              options={MONTHS.map(item => {
                return {
                  value: item,
                  label: item,
                };
              })}
              classNamePrefix="select"
              value={
                filters.toMonth
                  ? { value: filters.toMonth, label: filters.toMonth }
                  : ""
              }
              onChange={selectedValues => {
                // console.log({ selectedValues });
                setFilters({
                  ...filters,
                  toMonth: selectedValues.value,
                });
              }}
            />
          </div>
          {/* <div className="form-group">
            <label>Report Title / Description</label>
            <input
              className="form-control"
              type="text"
              // required
              value={filters.title}
              onChange={e => {
                if (e) e.preventDefault();
                setFilters({
                  ...filters,
                  title: e.target.value,
                });
              }}
            />
          </div> */}
          <div className="form-group">
            <label>Report Size</label>
            <input
              className="form-control"
              type="number"
              // required
              value={filters.size}
              onChange={e => {
                if (e) e.preventDefault();
                setFilters({
                  ...filters,
                  size: parseInt(e.target.value),
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Description 1</label>
            <input
              className="form-control"
              type="text"
              // required
              value={filters.description2}
              onChange={e => {
                if (e) e.preventDefault();
                setFilters({
                  ...filters,
                  description2: e.target.value,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Description 2</label>
            <input
              className="form-control"
              type="text"
              // required
              value={filters.description3}
              onChange={e => {
                if (e) e.preventDefault();
                setFilters({
                  ...filters,
                  description3: e.target.value,
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
