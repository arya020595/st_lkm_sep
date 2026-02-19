import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../../components/App";
import { handleError } from "../../libs/errors";
import gql from "graphql-tag";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import Link from "next/link";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import dayjs from "dayjs";
import { LongText } from "../../components/form/LongText";
import Select from "react-select";
import PDFViewer from "../../components/PDFViewer";

const ProductionAndSales = () => {
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Production And Sales Report</title>
      </Head>

      <div className="mt-26 pt-8 pr-8">
        <Tabs
          selectedIndex={tabIndex}
          onSelect={index => {
            setTabIndex(index);
          }}>
          <TabList>
            <Tab>
              <p className="text-md font-semibold">Monthly Report</p>
            </Tab>
            <Tab>
              <p className="text-md font-semibold">Quarterly Report</p>
            </Tab>
            <Tab>
              <p className="text-md font-semibold">Yearly Report</p>
            </Tab>
          </TabList>
          <TabPanel>
            <MonthlyReport />
          </TabPanel>
          <TabPanel>
            <QuarterlyReport />
          </TabPanel>
          <TabPanel>
            <YearlyReport />
          </TabPanel>
        </Tabs>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(ProductionAndSales);

const QUERY = gql`
  query allLocalState {
    allLocalState {
      _id
      code
      description
    }
    allLocalRegion {
      _id
      code
      description
    }
  }
`;

const REPORT_MONTHLY = gql`
  mutation generateProductionAndSalesRepoprt(
    $fromDateIds: [String!]!
    $toDateIds: [String!]!
    $stateIds: [String!]!
    $titleSuffix: String
    $description: String
  ) {
    generateProductionAndSalesRepoprt(
      fromDateIds: $fromDateIds
      toDateIds: $toDateIds
      stateIds: $stateIds
      titleSuffix: $titleSuffix
      description: $description
    )
  }
`;

const MonthlyReport = () => {
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const router = useRouter();
  const notification = useNotification();
  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {},
  });
  let allLocalState = data?.allLocalState || [];
  let allLocalRegion = data?.allLocalRegion || [];

  const [generateProductionAndSalesRepoprt] = useMutation(REPORT_MONTHLY);
  const [filters, setFilters] = useState({
    fromDateIds: [],
    toDateIds: [],
    stateIds: [],
    description: "",
  });
  const [reportUrl, setReportUrl] = useState("");

  return (
    <div className="pt-0">
      <div className="w-full py-4 flex flex-col md:flex-row">
        <form
          onSubmit={async e => {
            if (e) e.preventDefault();
            showLoadingSpinner();
            try {
              let result = await generateProductionAndSalesRepoprt({
                variables: {
                  ...filters,
                },
              });
              const reportUrl =
                result.data.generateProductionAndSalesRepoprt +
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
              <label>Month / Year</label>
              <input
                className="form-control"
                type="month"
                required
                value={filters.fromDates?.[0] || ""}
                onChange={e => {
                  // console.log(e.target.value);
                  setFilters({
                    ...filters,
                    fromDates: [e.target.value],
                    fromDateIds: [e.target.value],
                    toDates: [e.target.value],
                    toDateIds: [e.target.value],
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <Select
                required
                options={allLocalRegion.map(item => {
                  return {
                    value: item._id,
                    label: `${item.code} (${item.description})`,
                  };
                })}
                classNamePrefix="select"
                value={filters.states || ""}
                onChange={selectedValues => {
                  // console.log({ selectedValues });
                  setFilters({
                    ...filters,
                    states: [selectedValues],
                    stateIds: [selectedValues.value],
                    // states: [...selectedValues],
                    // stateIds: selectedValues.map(item => item.value),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <LongText
                // required
                value={filters.description || ""}
                onChange={e => {
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
            disabled={
              !filters.fromDateIds?.length ||
              !filters.toDateIds?.length ||
              !filters.stateIds?.length
            }
            className={`bg-mantis-600 w-full py-2 rounded-md shadow-md mt-10 ${
              !filters.fromDateIds?.length ||
              !filters.toDateIds?.length ||
              !filters.stateIds?.length
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
            <PDFViewer height={600} pdfUrl={reportUrl} />
          )}
        </div>
      </div>
    </div>
  );
};

const REPORT_QUARTERYLY = gql`
  mutation generateProductionAndSalesRepoprt(
    $fromDateIds: [String!]!
    $toDateIds: [String!]!
    $stateIds: [String!]!
    $titleSuffix: String
    $description: String
  ) {
    generateProductionAndSalesRepoprt(
      fromDateIds: $fromDateIds
      toDateIds: $toDateIds
      stateIds: $stateIds
      titleSuffix: $titleSuffix
      description: $description
    )
  }
`;

const QuarterlyReport = () => {
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const router = useRouter();
  const notification = useNotification();
  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {},
  });
  let allLocalState = data?.allLocalState || [];
  let allLocalRegion = data?.allLocalRegion || [];

  const [generateProductionAndSalesRepoprt] = useMutation(REPORT_QUARTERYLY);
  const [filters, setFilters] = useState({
    fromDateIds: [],
    toDateIds: [],
    yearIds: [],
    quarterIds: [],
    stateIds: [],
    description: "",
  });
  const [reportUrl, setReportUrl] = useState("");

  return (
    <div className="pt-0">
      <div className="w-full py-4 flex flex-col md:flex-row">
        <form
          onSubmit={async e => {
            if (e) e.preventDefault();
            showLoadingSpinner();
            try {
              const fromDateIds = [
                `${filters.yearIds[0]}-${(
                  "00" +
                  (filters.quarterIds[0] * 3 - 3 + 1)
                ).slice(-2)}`,
              ];
              const toDateIds = [
                `${filters.yearIds[0]}-${(
                  "00" +
                  filters.quarterIds[0] * 3
                ).slice(-2)}`,
              ];
              // console.log({
              //   fromDateIds,
              //   toDateIds,
              // });
              let result = await generateProductionAndSalesRepoprt({
                variables: {
                  ...filters,
                  fromDateIds,
                  toDateIds,
                  titleSuffix: `Quarter ${filters.quarterIds[0]} ${filters.yearIds[0]}`,
                },
              });
              const reportUrl =
                result.data.generateProductionAndSalesRepoprt +
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
              <input
                className="form-control"
                type="number"
                required
                value={filters.years?.[0] || ""}
                onChange={e => {
                  // console.log(e.target.value);
                  setFilters({
                    ...filters,
                    years: [e.target.value],
                    yearIds: [e.target.value],
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Quarter</label>
              <Select
                required
                options={[1, 2, 3, 4].map(item => {
                  return {
                    value: item,
                    label: item,
                  };
                })}
                classNamePrefix="select"
                value={filters.quarters || ""}
                onChange={selectedValues => {
                  // console.log({ selectedValues });
                  setFilters({
                    ...filters,
                    quarters: [selectedValues],
                    quarterIds: [selectedValues.value],
                    // states: [...selectedValues],
                    // stateIds: selectedValues.map(item => item.value),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <Select
                required
                options={allLocalRegion.map(item => {
                  return {
                    value: item._id,
                    label: `${item.code} (${item.description})`,
                  };
                })}
                classNamePrefix="select"
                value={filters.states || ""}
                onChange={selectedValues => {
                  // console.log({ selectedValues });
                  setFilters({
                    ...filters,
                    states: [selectedValues],
                    stateIds: [selectedValues.value],
                    // states: [...selectedValues],
                    // stateIds: selectedValues.map(item => item.value),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <LongText
                // required
                value={filters.description || ""}
                onChange={e => {
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
            disabled={
              !filters.yearIds?.length ||
              !filters.quarterIds?.length ||
              !filters.stateIds?.length
            }
            className={`bg-mantis-600 w-full py-2 rounded-md shadow-md mt-10 ${
              !filters.yearIds?.length ||
              !filters.quarterIds?.length ||
              !filters.stateIds?.length
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
            <PDFViewer height={600} pdfUrl={reportUrl} />
          )}
        </div>
      </div>
    </div>
  );
};

const REPORT_YEARLY = gql`
  mutation generateProductionAndSalesRepoprt(
    $fromDateIds: [String!]!
    $toDateIds: [String!]!
    $stateIds: [String!]!
    $titleSuffix: String
    $description: String
  ) {
    generateProductionAndSalesRepoprt(
      fromDateIds: $fromDateIds
      toDateIds: $toDateIds
      stateIds: $stateIds
      titleSuffix: $titleSuffix
      description: $description
    )
  }
`;

const YearlyReport = () => {
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const router = useRouter();
  const notification = useNotification();
  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {},
  });
  let allLocalState = data?.allLocalState || [];
  let allLocalRegion = data?.allLocalRegion || [];

  const [generateProductionAndSalesRepoprt] = useMutation(REPORT_YEARLY);
  const [filters, setFilters] = useState({
    fromDateIds: [],
    toDateIds: [],
    toYearIds: [],
    quarterIds: [],
    stateIds: [],
    description: "",
  });
  const [reportUrl, setReportUrl] = useState("");

  return (
    <div className="pt-0">
      <div className="w-full py-4 flex flex-col md:flex-row">
        <form
          onSubmit={async e => {
            if (e) e.preventDefault();
            showLoadingSpinner();
            try {
              const fromDateIds = [`${filters.toYearIds[0]}-01`];
              const toDateIds = [`${filters.toYearIds[0]}-12`];
              // console.log({
              //   fromDateIds,
              //   toDateIds,
              // });
              let result = await generateProductionAndSalesRepoprt({
                variables: {
                  ...filters,
                  fromDateIds,
                  toDateIds,
                  titleSuffix: `YEAR ${filters.toYearIds[0]}`,
                },
              });
              const reportUrl =
                result.data.generateProductionAndSalesRepoprt +
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
              <input
                className="form-control"
                type="number"
                required
                value={filters.toYears?.[0] || ""}
                onChange={e => {
                  // console.log(e.target.value);
                  setFilters({
                    ...filters,
                    toYears: [e.target.value],
                    toYearIds: [e.target.value],
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>State</label>
              <Select
                required
                options={allLocalRegion.map(item => {
                  return {
                    value: item._id,
                    label: `${item.code} (${item.description})`,
                  };
                })}
                classNamePrefix="select"
                value={filters.states || ""}
                onChange={selectedValues => {
                  // console.log({ selectedValues });
                  setFilters({
                    ...filters,
                    states: [selectedValues],
                    stateIds: [selectedValues.value],
                    // states: [...selectedValues],
                    // stateIds: selectedValues.map(item => item.value),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <LongText
                // required
                value={filters.description || ""}
                onChange={e => {
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
            disabled={!filters.toYearIds?.length || !filters.stateIds?.length}
            className={`bg-mantis-600 w-full py-2 rounded-md shadow-md mt-10 ${
              !filters.toYearIds?.length || !filters.stateIds?.length
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
            <PDFViewer height={600} pdfUrl={reportUrl} />
          )}
        </div>
      </div>
    </div>
  );
};
