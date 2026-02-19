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

const QUERY = gql`
  query Query($countryRegionId: String) {
    allCountryRegion {
      _id
      description
    }
    allCountries(countryRegionId: $countryRegionId) {
      _id
      name
    }
  }
`;

const REPORT = gql`
  mutation generateDomesticTradeCocoaBeansExportReport(
    $country: String
    $year: Int
  ) {
    generateDomesticTradeCocoaBeansExportReport(country: $country, year: $year)
  }
`;

const Report = () => {
  const notification = useNotification();
  const [filters, setFilters] = useState({
    country: "",
    year: "",
  });
  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {
      countryRegionId: filters.countryRegionId || "",
    },
  });
  let allCountryRegions = data?.allCountryRegion || [];
  let allCountries = data?.allCountries || [];

  const [generateDomesticTradeCocoaBeansExportReport] = useMutation(REPORT);
  const currentYear = dayjs().get("year");
  const disabled = !filters.country || !filters.year;
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
            let result = await generateDomesticTradeCocoaBeansExportReport({
              variables: {
                ...filters,
              },
            });
            const reportUrl =
              result.data.generateDomesticTradeCocoaBeansExportReport +
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
            <label>Region</label>
            <Select
              // isMulti
              // className="basic-multi-select w-full"
              required
              options={allCountryRegions.map(item => {
                return {
                  value: item.description,
                  label: item.description,
                };
              })}
              classNamePrefix="select"
              value={
                filters.region
                  ? {
                      value: String(filters.region),
                      label: String(filters.region),
                    }
                  : ""
              }
              onChange={selectedValues => {
                // console.log({ selectedValues });
                const selectedCountryRegion = allCountryRegions.find(
                  item => item.description === selectedValues.value,
                );
                setFilters({
                  ...filters,
                  region: selectedValues.value,
                  countryRegionId: selectedCountryRegion?._id || "",
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Country</label>
            <Select
              // isMulti
              // className="basic-multi-select w-full"
              required
              options={allCountries.map(item => {
                return {
                  value: item.name,
                  label: item.name,
                };
              })}
              classNamePrefix="select"
              value={
                filters.country
                  ? {
                      value: String(filters.country),
                      label: String(filters.country),
                    }
                  : ""
              }
              onChange={selectedValues => {
                // console.log({ selectedValues });
                setFilters({
                  ...filters,
                  country: selectedValues.value,
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
