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
  query listQueries($centreId: String!) {
    allBuyersByCentreId(centreId: $centreId) {
      _id
      code
      name
    }
    allCentre {
      _id
      description
    }
  }
`;

const REPORT = gql`
  mutation generateDailyBuyerReportForDomesticCocoaPrices(
    $startDate: String!
    $endDate: String!
    $centreIds: [String!]!
    $buyerIds: [String!]!
  ) {
    generateDailyBuyerReportForDomesticCocoaPrices(
      startDate: $startDate
      endDate: $endDate
      centreIds: $centreIds
      buyerIds: $buyerIds
    )
  }
`;

const Report = () => {
  const notification = useNotification();
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    centreIds: [],
    buyerIds: [],
  });
  const { data, error, loading, refetch } = useQuery(LIST_QUERIES, {
    variables: {
      centreId: filters.centreIds?.[0] || "",
    },
  });
  let allCentre = data?.allCentre || [];
  let allBuyersByCentreId = data?.allBuyersByCentreId || [];

  const [generateDailyBuyerReportForDomesticCocoaPrices] = useMutation(REPORT);
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
            let result = await generateDailyBuyerReportForDomesticCocoaPrices({
              variables: {
                ...filters,
              },
            });
            const reportUrl =
              result.data.generateDailyBuyerReportForDomesticCocoaPrices +
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
            <label>Start Date</label>
            <input
              className="form-control"
              type="date"
              required
              value={filters.startDate}
              onChange={e => {
                if (e) e.preventDefault();
                setFilters({
                  ...filters,
                  startDate: e.target.value,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>End Date</label>
            <input
              className="form-control"
              type="date"
              required
              value={filters.endDate}
              onChange={e => {
                if (e) e.preventDefault();
                setFilters({
                  ...filters,
                  endDate: e.target.value,
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
              options={[
                {
                  value: "Select All",
                  label: "Select All",
                },
                ...allCentre.map(item => {
                  return {
                    value: item._id,
                    label: item.description,
                  };
                }),
              ]}
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
                  buyerIds: [],
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Buyer</label>
            <Select
              // isMulti
              // className="basic-multi-select w-full"
              required
              options={[
                {
                  value: "Select All",
                  label: "Select All",
                },
                ...allBuyersByCentreId.map(item => {
                  return {
                    value: item._id,
                    label: item.name,
                  };
                }),
              ]}
              classNamePrefix="select"
              value={filters.buyers || ""}
              onChange={selectedValues => {
                // console.log({ selectedValues });
                setFilters({
                  ...filters,
                  buyers: [selectedValues],
                  buyerIds: [selectedValues.value],
                  // buyers: [...selectedValues],
                  // buyerIds: selectedValues.map(item => item.value),
                });
              }}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={
            !filters.centreIds?.length || !filters.endDate || !filters.startDate
          }
          className={`bg-mantis-600 w-full py-2 rounded-md shadow-md mt-10 ${
            !filters.centreIds?.length || !filters.endDate || !filters.startDate
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
