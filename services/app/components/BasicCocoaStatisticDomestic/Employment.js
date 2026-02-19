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
import { useRouter } from "next/router";
import Link from "next/link";
import AdminArea from "../../components/AdminArea";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";
import { SingleSelect } from "../../components/form/SingleSelect";
import dayjs from "dayjs";

import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY_ONCE = gql`
  query listQueries {
    allLocalRegionTokenized
    allCategoriesTokenized
  }
`;

const QUERY_EMPLOYMENTS = gql`
  query employmentsQuery($year: String!, $years: [String!]) {
    allEmploymentsTokenized(year: $year, years: $years)
    countEmployments
  }
`;
const CREATE_BCS_EMPLOYMENT = gql`
  mutation createEmploymentTokenized($tokenizedInput: String!) {
    createEmploymentTokenized(tokenizedInput: $tokenizedInput)
  }
`;

const UPDATE_BCS_EMPLOYMENT = gql`
  mutation updateEmploymentTokenized($tokenizedInput: String!) {
    updateEmploymentTokenized(tokenizedInput: $tokenizedInput)
  }
`;
const DELETE_BCS_EMPLOYMENT = gql`
  mutation deleteEmploymentTokenized($tokenizedInput: String!) {
    deleteEmploymentTokenized(tokenizedInput: $tokenizedInput)
  }
`;
const BasicCocoaStatisticCultivatedArea = ({
  currentUserDontHavePrivilege,
}) => {
  const client = useApolloClient();
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [allDivisions, setAllDivisions] = useState([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1980;
    // console.log([...new Array(toYear - fromYear)])
    return [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });
  }, []);

  const columns = useMemo(() => [
    {
      Header: "Year",
      accessor: "year",
      style: {
        fontSize: 20,
        width: 80,
      },
      disableFilters: true,
    },
    {
      Header: "Region",
      accessor: "regionName",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Category",
      accessor: "categoryName",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Division",
      accessor: "divisionName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "No Of Worker",
      accessor: "noOfWorker",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Worker Type",
      accessor: "workerType",
      style: {
        fontSize: 20,
      },
    },
  ]);

  // const year = String(router.query.year || dayjs().format("YYYY"));
  const [year, setYear] = useState(YEARS[0]);
  const [years, setYears] = useState([year]);
  let [savedCount, setSavedCount] = useState(0);

  const [createEmploymentTokenized] = useMutation(CREATE_BCS_EMPLOYMENT);
  const [updateEmploymentTokenized] = useMutation(UPDATE_BCS_EMPLOYMENT);
  const [deleteEmploymentTokenized] = useMutation(DELETE_BCS_EMPLOYMENT);
  const [allEmployments, setAllEmployments] = useState([]);
  const [countEmployments, setCountData] = useState(0);
  const [allLocalRegion, setLocalRegion] = useState([]);
  const [allCategories, setAllCategories] = useState([]);

  // let allEmployments = [];

  // if (data?.allEmployments) {
  //   allEmployments = data.allEmployments;
  // }

  // let allCategories = [];
  // if (data?.allCategories) {
  //   allCategories = data.allCategories;
  // }

  const customUtilities = useMemo(() => [
    {
      label: "Edit",
      icon: <i className="fa fa-pencil" />,
      width: 400,
      render: propsTable => {
        return (
          <div className="flex">
            <button
              onClick={e => {
                if (e) e.preventDefault();

                let allDivisions = [];
                if (propsTable.row.original.Category) {
                  const found = allCategories.find(
                    reg => reg._id === propsTable.row.original.Category._id,
                  );

                  if (found && found.Divisions.length > 0) {
                    allDivisions = found.Divisions;
                  }
                }
                // console.log(propsTable.row.original);
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  divisionId: propsTable.row.original.Division?._id || "",
                  localRegionId: propsTable.row.original.LocalRegion?._id || "",
                });
                setAllDivisions(allDivisions);
              }}
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg">
              <p className="text-white font-bold text-md font-bold">
                <i className="fa fa-pencil-alt " /> Edit
              </p>
            </button>
          </div>
        );
      },
    },
  ]);
  // console.log(allStates);

  const fetchQueryEmployments = async (year, years) => {
    const result = await client.query({
      query: QUERY_EMPLOYMENTS,
      variables: {
        year,
        years,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedData = result.data?.allEmploymentsTokenized || "";
    if (encryptedData) {
      const decrypted = jwt.verify(encryptedData, TOKENIZE);
      setAllEmployments(decrypted.results);
    }

    setCountData(result.data?.countEmployments || 0);
  }
  useEffect(() => {
    showLoadingSpinner();
    try {
      setLoading(true);
      fetchQueryEmployments(year, years)

      setLoading(false);
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  }, [year, years, savedCount]);

  const fetchDataQueryOnce = async () => {
    const result = await client.query({
      query: QUERY_ONCE,
      variables: {},
      fetchPolicy: "no-cache",
    });

    const encryptedRegion = result.data?.allLocalRegionTokenized || "";
    if (encryptedRegion) {
      const decrypted = jwt.verify(encryptedRegion, TOKENIZE);
      setLocalRegion(decrypted.results);
    }

    const encrypteCategory = result.data?.allCategoriesTokenized || "";
    if (encrypteCategory) {
      const decrypted = jwt.verify(encrypteCategory, TOKENIZE);
      setAllCategories(decrypted.results);
    }
  }
  useEffect(() => {
    try {
      fetchDataQueryOnce()
    } catch (err) {
      notification.handleError(err);
    }
  }, []);

  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} BCS Employment`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({});
        }}
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { _id, __typename, _createdAt, _updatedAt } = formData;
            if (!_id) {
              const tokenizedInput = jwt.sign(
                {
                  ...formData,
                },
                TOKENIZE,
              );
              await createEmploymentTokenized({
                variables: {
                  tokenizedInput,
                },
              });
            } else {
              const tokenizedInput = jwt.sign(
                {
                  ...formData,
                },
                TOKENIZE,
              );
              await updateEmploymentTokenized({
                variables: {
                  tokenizedInput,
                },
              });
            }
            setSavedCount((savedCount += 1));
            notification.addNotification({
              title: "Succeess!",
              message: `BCS Employment saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Year*</label>
          <input
            placeholder="Year (YYYY)"
            className="form-control"
            value={formData.year || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                year: parseInt(e.target.value),
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>Region*</label>
          <select
            className="form-control"
            value={formData.localRegionId || ""}
            onChange={e => {
              if (e) e.preventDefault();

              setFormData({
                ...formData,
                localRegionId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Region
            </option>
            {allLocalRegion.map(reg => (
              <option value={reg._id}>{reg.description}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Category*</label>
          <select
            className="form-control"
            value={formData.categoryId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              const category = allCategories.find(
                reg => reg._id === e.target.value,
              );

              setFormData({
                ...formData,
                categoryId: e.target.value,
                divisionId: "",
              });
              setAllDivisions(category.Divisions);
            }}>
            <option value="" disabled>
              Select Category
            </option>
            {allCategories.map(cat => (
              <option value={cat._id}>{cat.description}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Division*</label>
          <select
            className="form-control"
            value={formData.divisionId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                divisionId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Division
            </option>
            {allDivisions.map(division => (
              <option value={division._id}>{division.description}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Worker Type</label>
          <select
            className="form-control"
            value={formData.workerType || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                workerType: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Worker Type
            </option>
            <option value="Foreign">Foreign</option>
            <option value="Local">Local</option>
          </select>
        </div>

        <div className="form-group">
          <label>No Of Worker*</label>
          <input
            placeholder="No Of Worker"
            className="form-control"
            value={formData.noOfWorker || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                noOfWorker: e.target.value,
              });
            }}
            required
          />
        </div>
      </FormModal>

      <Table
        customHeaderUtilities={
          <div>
            <MultiYearsFilterWithExport
              label="Year Filter"
              defaultValue={dayjs().format("YYYY")}
              options={YEARS}
              onSelect={(year, years) => {
                setYear(year);
                setYears(years);
              }}
              exportConfig={{
                title: "BCS Domestic - Employements",
                collectionName: "Employments",
                filters: {
                  year: [...years].map(year => parseInt(year)),
                },
                columns,
              }}
            />
            {/* <SingleSelect
              hideFeedbackByDefault
              label="Year Filter"
              required
              options={YEARS}
              value={year}
              onChange={e => {
                if (e) e.preventDefault();
                router.push({
                  pathname: router.pathname,
                  query: {
                    ...router.query,
                    year: e.target.value,
                  },
                });
              }}
            /> */}
          </div>
        }
        loading={false}
        columns={columns}
        data={allEmployments}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege(["BCS Domestic Employment:Create"])
            ? null
            : e => {
              if (e) e.preventDefault();
              setModalVisible(true);
              setFormData({});
            }
        }
        onRemove={
          currentUserDontHavePrivilege(["BCS Domestic Employment:Delete"])
            ? null
            : async ({ rows }) => {
              showLoadingSpinner();
              try {
                let yes = confirm(
                  `Are you sure to delete ${rows.length} data?`,
                );
                if (yes) {
                  for (const row of rows) {
                    const tokenizedInput = jwt.sign(
                      {
                        _id: row._id,
                      },
                      TOKENIZE,
                    );

                    await deleteEmploymentTokenized({
                      variables: {
                        tokenizedInput,
                      },
                    });
                  }
                  notification.addNotification({
                    title: "Success!",
                    message: `${rows.length} data deleted`,
                    level: "success",
                  });
                  setSavedCount((savedCount += 1));
                }
              } catch (err) {
                handleError(err);
              }
              hideLoadingSpinner();
            }
        }
        customUtilities={
          currentUserDontHavePrivilege(["BCS Domestic Employment:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />
      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">{countEmployments || 0}</p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(BasicCocoaStatisticCultivatedArea);
