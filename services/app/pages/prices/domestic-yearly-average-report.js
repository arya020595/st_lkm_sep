import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../../components/App";
import { handleError } from "../../libs/errors";
import redirect from "../../libs/redirect";
import gql from "graphql-tag";
import {
  useMutation,
  useQuery,
  useApolloClient,
  ApolloProvider,
} from "@apollo/client";
import Select from "react-select";
import AsyncSelect from "react-select/async";
import { useDebounce } from "use-debounce";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";
import { useRouter } from "next/router";

const GRADES = [
  {
    value: "smc1",
    label: "SMC1",
  },
  {
    value: "smc2",
    label: "SMC2",
  },
  {
    value: "smc3",
    label: "SMC3",
  },
];
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

const SEARCH_STAFF = gql`
  mutation searchStaff($criteria: [StaffCriteria!]!) {
    searchStaffWithOrOperator(criteria: $criteria, limit: 10) {
      _id
      name
      department
    }
  }
`;
const YearlyAverageReport = () => {
  const notification = useNotification();
  const router = useRouter();

  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1940;
    // console.log([...new Array(toYear - fromYear)])
    return [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });
  }, []);

  const [formData, setFormData] = useState({
    year: dayjs().format("YYYY"),
  });
  const [selectedCentres, setSelectedCentre] = useState([]);
  const [centreModalVisible, setCentreModalVisible] = useState(false);
  const { data, error, loading, refetch } = useQuery(LIST_QUERIES);
  const [searchStaff] = useMutation(SEARCH_STAFF);

  let allLocalRegion = [];
  if (data?.allLocalRegion) {
    allLocalRegion = data.allLocalRegion;
  }

  let allCentre = [];
  if (data?.allCentre) {
    allCentre = data.allCentre;
  }

  const fetchStaff = async (input, callback) => {
    try {
      let criteria = [
        {
          key: "name",
          keyword: ("" + input).toLowerCase(),
          check: true,
          label: "Name",
        },
      ];
      // console.log("criteria", criteria);
      const res = await searchStaff({
        variables: {
          criteria,
          limit: 10,
        },
        fetchPolicy: "no-cache",
      });
      // console.log("res", res.data.searchStaff, criteria);

      callback(
        res.data.searchStaffWithOrOperator.map(s => ({
          ...s,
        })),
      );
    } catch (err) {
      notification.handleError(err);
      callback([]);
    }
  };

  // const debounceFetchStaff = debounce(fetchStaff, 800);
  const [debounceFetchStaff] = useDebounce(fetchStaff, 1000);

  const getStaff = (input, callback) => {
    if (!input) {
      callback([]);
    } else {
      debounceFetchStaff(input, callback);
    }
  };

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Daily Summary Report | Price</title>
      </Head>
      <div className="mt-26 pr-0 md:pr-10 py-4 bg-white">
        <FormModal
          title={`Centre List`}
          visible={centreModalVisible}
          onClose={e => {
            if (e) e.preventDefault();
            setCentreModalVisible(false);
          }}>
          <div className="flex justify-end mb-4">
            {selectedCentres.length !== allCentre.length ? (
              <button
                className="bg-blue-500 px-4 py-2 rounded-md shadow-md"
                onClick={e => {
                  if (e) e.preventDefault();
                  setSelectedCentre(allCentre.map(c => c._id));
                }}>
                <p className="text-white font-bold">Select All</p>
              </button>
            ) : (
              <button
                className="bg-red-500 px-4 py-2 rounded-md shadow-md"
                onClick={e => {
                  if (e) e.preventDefault();
                  setSelectedCentre([]);
                }}>
                <p className="text-white font-bold">Deselect All</p>
              </button>
            )}
          </div>
          {allCentre.map(centre => {
            const foundIndex = selectedCentres.findIndex(c => c === centre._id);
            return (
              <div className="flex justify-between mb-2 items-center">
                <p className="font-semibold">{centre.description}</p>
                {foundIndex === -1 ? (
                  <button
                    className="bg-mantis-500 px-4 py-2 rounded-md shadow-md"
                    onClick={e => {
                      if (e) e.preventDefault();
                      setSelectedCentre([...selectedCentres, centre._id]);
                    }}>
                    <p className="text-white font-bold">Select</p>
                  </button>
                ) : (
                  <button
                    className="bg-medium-red-violet-500 px-4 py-2 rounded-md shadow-md"
                    onClick={e => {
                      if (e) e.preventDefault();
                      setSelectedCentre(
                        selectedCentres.filter(s => s !== centre._id),
                      );
                    }}>
                    <p className="text-white font-bold">Deselect</p>
                  </button>
                )}
              </div>
            );
          })}
        </FormModal>

        <div className="flex mb-10">
          <div
            className={`${
              router.query.componentName === "Domestic Daily Summary Report"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              `}
            onClick={e => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/prices/domestic-daily-summary-report",
                query: {
                  appState: "SEP",
                  componentName: "Domestic Daily Summary Report",
                  sidebarMenu: "prices",
                  sidebarSubMenu: "domestic-daily-summary-report",
                  sidebarSubMenuName: "Price Report",
                },
              });
            }}>
            <p className="text-lg font-semibold">
              Domestic Daily Summary Report
            </p>
          </div>
          <div
            className={`${
              router.query.componentName === "Domestic Daily Average Report"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              `}
            onClick={e => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/prices/domestic-daily-average-report",
                query: {
                  appState: "SEP",
                  componentName: "Domestic Daily Average Report",
                  sidebarMenu: "prices",
                  sidebarSubMenu: "domestic-daily-average-report",
                  sidebarSubMenuName: "Price Report",
                },
              });
            }}>
            <p className="text-lg font-semibold">
              Domestic Daily Average Report
            </p>
          </div>
          <div
            className={`${
              router.query.componentName === "Domestic Daily Cocoa Report"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              `}
            onClick={e => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/prices/domestic-daily-cocoa-report",
                query: {
                  appState: "SEP",
                  componentName: "Domestic Daily Cocoa Report",
                  sidebarMenu: "prices",
                  sidebarSubMenu: "domestic-daily-cocoa-report",
                  sidebarSubMenuName: "Price Report",
                },
              });
            }}>
            <p className="text-lg font-semibold">Domestic Daily Cocoa Report</p>
          </div>

          <div
            className={`${
              router.query.componentName === "Domestic Monthly Summary Report"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              `}
            onClick={e => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/prices/domestic-monthly-summary-report",
                query: {
                  appState: "SEP",
                  componentName: "Domestic Monthly Summary Report",
                  sidebarMenu: "prices",
                  sidebarSubMenu: "domestic-monthly-summary-report",
                  sidebarSubMenuName: "Price Report",
                },
              });
            }}>
            <p className="text-lg font-semibold">
              Domestic Monthly Summary Report
            </p>
          </div>

          <div
            className={`${
              router.query.componentName === "Domestic Monthly Average Report"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              `}
            onClick={e => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/prices/domestic-monthly-average-report",
                query: {
                  appState: "SEP",
                  componentName: "Domestic Monthly Average Report",
                  sidebarMenu: "prices",
                  sidebarSubMenu: "domestic-monthly-average-report",
                  sidebarSubMenuName: "Price Report",
                },
              });
            }}>
            <p className="text-lg font-semibold">
              Domestic Monthly Average Report
            </p>
          </div>

          <div
            className={`${
              router.query.componentName === "Domestic Monthly Cocoa Report"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              `}
            onClick={e => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/prices/domestic-monthly-cocoa-report",
                query: {
                  appState: "SEP",
                  componentName: "Domestic Monthly Cocoa Report",
                  sidebarMenu: "prices",
                  sidebarSubMenu: "domestic-monthly-cocoa-report",
                  sidebarSubMenuName: "Price Report",
                },
              });
            }}>
            <p className="text-lg font-semibold">
              Domestic Monthly Cocoa Report
            </p>
          </div>

          <div
            className={`${
              router.query.componentName === "Domestic Yearly Summary Report"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              `}
            onClick={e => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/prices/domestic-yearly-summary-report",
                query: {
                  appState: "SEP",
                  componentName: "Domestic Yearly Summary Report",
                  sidebarMenu: "prices",
                  sidebarSubMenu: "domestic-yearly-summary-report",
                  sidebarSubMenuName: "Price Report",
                },
              });
            }}>
            <p className="text-lg font-semibold">
              Domestic Yearly Summary Report
            </p>
          </div>

          <div
            className={`${
              router.query.componentName === "Domestic Yearly Average Report"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              `}
            onClick={e => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/prices/domestic-yearly-average-report",
                query: {
                  appState: "SEP",
                  componentName: "Domestic Yearly Average Report",
                  sidebarMenu: "prices",
                  sidebarSubMenu: "domestic-yearly-average-report",
                  sidebarSubMenuName: "Price Report",
                },
              });
            }}>
            <p className="text-lg font-semibold">
              Domestic Yearly Average Report
            </p>
          </div>

          <div
            className={`${
              router.query.componentName === "Domestic Yearly Cocoa Report"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4
              
              `}
            onClick={e => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/prices/domestic-yearly-cocoa-report",
                query: {
                  appState: "SEP",
                  componentName: "Domestic Yearly Cocoa Report",
                  sidebarMenu: "prices",
                  sidebarSubMenu: "domestic-yearly-cocoa-report",
                  sidebarSubMenuName: "Price Report",
                },
              });
            }}>
            <p className="text-lg font-semibold">
              Domestic Yearly Cocoa Report
            </p>
          </div>
        </div>

        <div className="grid grid-cols-8">
          <div className="col-span-2 border-2 border-gray-400 rounded-md px-4 py-4">
            <div className="form-group">
              <label>Years</label>
              <select
                className="form-control"
                value={formData.year}
                onChange={e => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    year: parseInt(e.target.value),
                  });
                }}>
                {YEARS.map(y => (
                  <option value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Region</label>
              <Select
                isMulti
                options={allLocalRegion.map(reg => {
                  return {
                    value: reg._id,
                    label: reg.description,
                  };
                })}
                className="basic-multi-select w-full"
                classNamePrefix="select"
                onChange={data => {
                  setFormData({
                    ...formData,
                    regionIds: data.map(d => d.value),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Grade</label>
              <Select
                isMulti
                options={GRADES}
                className="basic-multi-select w-full"
                classNamePrefix="select"
                onChange={data => {
                  setFormData({
                    ...formData,
                    grades: data.map(d => d.value),
                  });
                }}
              />
            </div>
            <div className="form-group">
              <label>Sign</label>
              <AsyncSelect
                loadOptions={getStaff}
                value={formData.staffObj || null}
                onChange={data => {
                  setFormData({
                    ...formData,
                    staffObj: data,
                  });
                }}
                getOptionLabel={option =>
                  `${option.name} (${option.department})`
                }
                getOptionValue={option => option._id}
                autoFocus={true}
              />
            </div>
            <div className="form-group mt-4">
              <label>Centre</label>
              <p className={"text-md text-red-500 font-bold"}>
                Selected {selectedCentres.length} Centres
              </p>
              <button
                className="bg-medium-red-violet-500 w-full py-2 rounded-md shadow-md"
                onClick={e => {
                  if (e) e.preventDefault();
                  setCentreModalVisible(true);
                }}>
                <p className="text-md text-white font-bold">Open Centre</p>
              </button>
            </div>

            <button
              className="bg-mantis-500 w-full py-2 rounded-md shadow-md mt-10"
              onClick={e => {
                if (e) e.preventDefault();
              }}>
              <p className="text-md text-white font-bold">
                {" "}
                <i className="fa fa-file" />
                Generate
              </p>
            </button>
          </div>
        </div>
        <div className="col-span-6"></div>
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(YearlyAverageReport);
