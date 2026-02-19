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

const LIST_QUERIES = gql`
  query listQueries {
    # allLocalRegion {
    #   _id
    #   description
    # }
    # allCentre {
    #   _id
    #   description
    # }
    allStaffList {
      _id
      name
      staffId
      department
    }
  }
`;

const REPORT = gql`
  mutation generateDailySummaryReportForDomesticCocoaPrices(
    $date: String!
    $signersName: [String!]
  ) {
    generateDailySummaryReportForDomesticCocoaPrices(
      date: $date
      signersName: $signersName
    )
  }
`;

const Report = () => {
  const notification = useNotification();
  const { data, error, loading, refetch } = useQuery(LIST_QUERIES);
  // let allLocalRegion = data?.allLocalRegion || [];
  // let allCentre = data?.allCentre || [];
  let allStaffList = data?.allStaffList || [];

  const [generateDailySummaryReportForDomesticCocoaPrices] =
    useMutation(REPORT);
  const [filters, setFilters] = useState({
    date: dayjs().format("YYYY-MM-DD"),
  });
  const [reportUrl, setReportUrl] = useState("");

  return (
    <div className="w-full py-4 flex flex-col md:flex-row">
      <form
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let result = await generateDailySummaryReportForDomesticCocoaPrices(
              {
                variables: {
                  ...filters,
                },
              },
            );
            const reportUrl =
              result.data.generateDailySummaryReportForDomesticCocoaPrices +
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
            <label>Date</label>
            <input
              className="form-control"
              type="date"
              required
              value={filters.date}
              onChange={e => {
                if (e) e.preventDefault();
                setFilters({
                  ...filters,
                  date: e.target.value,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Signer 1 (Disemak Oleh)</label>
            <select
              className="form-control"
              required
              value={filters.signersName?.[0] || ""}
              onChange={e => {
                if (e) e.preventDefault();
                setFilters({
                  ...filters,
                  signersName: [e.target.value, filters.signersName?.[1] || ""],
                });
              }}>
              <option value="" disabled>
                Select Signer Name
              </option>
              {allStaffList.map(item => (
                <option value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Signer 2 (Disediakan Oleh)</label>
            <select
              className="form-control"
              required
              value={filters.signersName?.[1] || ""}
              onChange={e => {
                if (e) e.preventDefault();
                setFilters({
                  ...filters,
                  signersName: [filters.signersName?.[0] || "", e.target.value],
                });
              }}>
              <option value="" disabled>
                Select Signer Name
              </option>
              {allStaffList.map(item => (
                <option value={item.name}>{item.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          type="submit"
          className="bg-mantis-600 w-full py-2 rounded-md shadow-md mt-10">
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
