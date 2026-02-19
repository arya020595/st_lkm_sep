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
  mutation generateYearlyCocoaPriceReportForDomesticCocoaPrices(
    $fromYearIds: [String!]!
    $toYearIds: [String!]!
    $gradeIds: [String!]!
  ) {
    generateYearlyCocoaPriceReportForDomesticCocoaPrices(
      fromYearIds: $fromYearIds
      toYearIds: $toYearIds
      gradeIds: $gradeIds
    )
  }
`;

const GET_REPORT_PROGRESS = gql`
  query getReportProgress($reportId: String!) {
    getReportProgress(reportId: $reportId) {
      status
      progress
      reportUrl
    }
  }
`;

const Report = () => {
  const notification = useNotification();
  // const { data, error, loading, refetch } = useQuery(LIST_QUERIES);
  // let allCentre = data?.allCentre || [];
  // let allLocalRegion = data?.allLocalRegion || [];

  const [generateYearlyCocoaPriceReportForDomesticCocoaPrices] =
    useMutation(REPORT);
  const [filters, setFilters] = useState({
    fromYearIds: [],
    toYearIds: [],
    gradeIds: [],
  });
  const [reportId, setReportId] = useState("");
  const [reportUrl, setReportUrl] = useState("");
  const [reportProgress, setReportProgress] = useState(0);
  const [reportStatus, setReportStatus] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Query for polling report status
  const { data: progressData, refetch: refetchProgress } = useQuery(
    GET_REPORT_PROGRESS,
    {
      variables: { reportId },
      skip: !reportId,
      fetchPolicy: "network-only",
      notifyOnNetworkStatusChange: true,
    },
  );

  // Polling report status
  useEffect(() => {
    if (reportId && reportStatus !== "completed" && reportStatus !== "error") {
      // Start polling
      const interval = setInterval(() => {
        refetchProgress();
      }, 2000); // Check every 2 seconds

      setPollingInterval(interval);

      return () => {
        if (interval) clearInterval(interval);
      };
    } else if (
      pollingInterval &&
      (reportStatus === "completed" || reportStatus === "error")
    ) {
      // Stop polling if completed or error
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [reportId, reportStatus, refetchProgress]);

  // Update state when there is new progress data
  useEffect(() => {
    if (progressData?.getReportProgress) {
      const { status, progress, reportUrl } = progressData.getReportProgress;

      setReportProgress(progress);
      setReportStatus(status);

      if (status === "completed" && reportUrl) {
        setReportUrl(reportUrl + "?t=" + new Date().toISOString());
        hideLoadingSpinner();
        setIsGenerating(false);
      } else if (status === "error") {
        notification.handleError(new Error("Failed to generate report"));
        hideLoadingSpinner();
        setIsGenerating(false);
      }
    }
  }, [progressData, notification]);

  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1980;
    // console.log([...new Array(toYear - fromYear)])
    return [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });
  }, []);

  const handleGenerateReport = async e => {
    if (e) e.preventDefault();

    setIsGenerating(true);
    showLoadingSpinner();

    try {
      const result = await generateYearlyCocoaPriceReportForDomesticCocoaPrices(
        {
          variables: {
            ...filters,
          },
        },
      );

      // Result is now report ID for polling
      const newReportId =
        result.data.generateYearlyCocoaPriceReportForDomesticCocoaPrices;
      setReportId(newReportId);
      setReportStatus("processing");
      setReportProgress(0);

      // Polling starts in useEffect
    } catch (err) {
      notification.handleError(err);
      hideLoadingSpinner();
      setIsGenerating(false);
    }
  };

  // Render progress indicator
  const renderProgress = () => {
    if (!isGenerating) return null;

    return (
      <div className="py-4">
        <div className="text-center font-bold mb-2">
          Processing report... ({reportProgress}%)
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-mantis-600 h-4 rounded-full transition-all duration-300 ease-in-out"
            style={{ width: `${reportProgress}%` }}></div>
        </div>
        <div className="text-center mt-2 text-sm text-gray-600">
          {reportProgress < 50
            ? "Collecting data..."
            : reportProgress < 90
            ? "Processing data..."
            : "Generating PDF..."}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full py-4 flex flex-col md:flex-row">
      <form onSubmit={handleGenerateReport} className="w-full md:w-1/4">
        <div className="border-2 border-gray-400 rounded-md px-4 py-4">
          <div className="font-bold">Report Filters</div>
          <hr className="my-2" />
          <div className="form-group">
            <label>From Year</label>
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
              value={filters.fromYears || ""}
              onChange={selectedValues => {
                // console.log({ selectedValues });
                setFilters({
                  ...filters,
                  fromYears: [selectedValues],
                  fromYearIds: [selectedValues.value],
                  // fromYears: [...selectedValues],
                  // fromYearIds: selectedValues.map(item => item.value),
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>To Year</label>
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
              value={filters.toYears || ""}
              onChange={selectedValues => {
                // console.log({ selectedValues });
                setFilters({
                  ...filters,
                  toYears: [selectedValues],
                  toYearIds: [selectedValues.value],
                  // toYears: [...selectedValues],
                  // toYearIds: selectedValues.map(item => item.value),
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Grade</label>
            <Select
              // isMulti
              // className="basic-multi-select w-full"
              required
              options={["Wet Cocoa Beans", "SMC 1", "SMC 2", "SMC 3"].map(
                item => {
                  return {
                    value: item,
                    label: item,
                  };
                },
              )}
              classNamePrefix="select"
              value={filters.grades || ""}
              onChange={selectedValues => {
                // console.log({ selectedValues });
                setFilters({
                  ...filters,
                  grades: [selectedValues],
                  gradeIds: [selectedValues.value],
                  // grades: [...selectedValues],
                  // gradeIds: selectedValues.map(item => item.value),
                });
              }}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={
            isGenerating ||
            !filters.gradeIds?.length ||
            !filters.fromYearIds?.length ||
            !filters.toYearIds?.length
          }
          className={`bg-mantis-600 w-full py-2 rounded-md shadow-md mt-10 ${
            isGenerating ||
            !filters.gradeIds?.length ||
            !filters.fromYearIds?.length ||
            !filters.toYearIds?.length
              ? "opacity-50"
              : ""
          }`}>
          <p className="text-md text-white font-bold">
            <i className="fa fa-book" />
            &nbsp; {isGenerating ? "Processing..." : "Generate"}
          </p>
        </button>
      </form>

      <div className="w-full md:w-3/4 pl-0 md:pl-4">
        {isGenerating && renderProgress()}

        {!reportUrl && !isGenerating ? (
          <div className="py-8">
            <img
              src="/lkm/images/menu-08_unstructured-document_icon.svg"
              className="w-2/12 mx-auto opacity-75"
            />
            <div className="text-center font-bold text-lg">
              Please set the filter first, then press Generate Button
            </div>
          </div>
        ) : reportUrl && !isGenerating ? (
          <PDFViewer
            height={600}
            pdfUrl={reportUrl}
            // pdfUrl={"https://www.orimi.com/pdf-test.pdf"}
          />
        ) : null}
      </div>
    </div>
  );
};

export default withApollo({ ssr: true })(Report);
