import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../App";
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
import { FormModal } from "../Modal";

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
const DailySummaryReport = ({ startDate, endDate }) => {
  const notification = useNotification();
  const [formData, setFormData] = useState({
    startDate,
    endDate,
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
    <div className="w-full px-4 py-4">
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

      <div className="grid grid-cols-8">
        <div className="col-span-2 border-2 border-gray-400 rounded-md px-4 py-4">
          <div className="form-group">
            <label>Start Date</label>
            <input
              className="form-control"
              type="date"
              value={formData.startDate}
              onChange={e => {
                if (e) e.preventDefault();
                setFormData({
                  ...formData,
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
              value={formData.endDate}
              onChange={e => {
                if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  endDate: e.target.value,
                });
              }}
            />
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
              getOptionLabel={option => `${option.name} (${option.department})`}
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
  );
};

export default withApollo({ ssr: true })(DailySummaryReport);
