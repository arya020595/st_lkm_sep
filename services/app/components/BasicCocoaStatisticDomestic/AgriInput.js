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
import NumberFormat from "react-number-format";
import { SingleSelect } from "../../components/form/SingleSelect";
import dayjs from "dayjs";
import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";

const QUERY = gql`
  query listQueries($year: String!, $years: [String!]) {
    allBasicCocoaStatisticDomesticInputAgries(year: $year, years: $years) {
      _id
      year
      quarter
      LocalRegion {
        _id
        description
      }
      LocalState {
        _id
        description
      }
      AgriInputType {
        _id
        description
      }
      brand
      prices

      regionName
      agriInputTypeName
      stateName
    }

    allInfoStatuses {
      _id
      description
    }
    allLocalRegion {
      _id
      description
      States {
        _id
        description
      }
    }
    allAgriInputType {
      _id
      description
    }
    countBasicCocoaStatisticDomesticInputAgries
  }
`;

const CREATE_BCS_INPUT_AGRI = gql`
  mutation createBasicCocoaStatisticDomesticInputAgri(
    $year: Int!
    $quarter: String!
    $regionId: String!
    $stateId: String!
    $agriInputTypeId: String!
    $brand: String!
    $prices: Float
  ) {
    createBasicCocoaStatisticDomesticInputAgri(
      year: $year
      quarter: $quarter
      regionId: $regionId
      stateId: $stateId
      agriInputTypeId: $agriInputTypeId
      brand: $brand
      prices: $prices
    )
  }
`;

const UPDATE_BCS_INPUT_AGRI = gql`
  mutation updateBasicCocoaStatisticDomesticInputAgri(
    $_id: String!
    $year: Int
    $quarter: String
    $regionId: String
    $stateId: String
    $agriInputTypeId: String
    $brand: String
    $prices: Float
  ) {
    updateBasicCocoaStatisticDomesticInputAgri(
      _id: $_id
      year: $year
      quarter: $quarter
      regionId: $regionId
      stateId: $stateId
      agriInputTypeId: $agriInputTypeId
      brand: $brand
      prices: $prices
    )
  }
`;
const DELETE_BCS_INPUT_AGRI = gql`
  mutation deleteBasicCocoaStatisticDomesticInputAgri($_id: String!) {
    deleteBasicCocoaStatisticDomesticInputAgri(_id: $_id)
  }
`;
const BasicCocoaStatisticDomesticInputAgri = ({
  currentUserDontHavePrivilege,
}) => {
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [allStates, setState] = useState([]);

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
      Header: "State",
      accessor: "stateName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Quarter",
      accessor: "quarter",
      Cell: props => {
        return (
          <div>
            <p className="text-center">{props.value}</p>
          </div>
        );
      },
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Product",
      accessor: "agriInputTypeName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Brand",
      accessor: "brand",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
    {
      Header: "Prices",
      accessor: "prices",
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
      style: {
        fontSize: 20,
      },
    },
  ]);

  // const year = String(router.query.year || dayjs().format("YYYY"));

  const [year, setYear] = useState(YEARS[0]);
  const [years, setYears] = useState([year]);

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      // regionId: formData.regionId || "",
      year,
      years,
    },
  });
  const [createBasicCocoaStatisticDomesticInputAgri] = useMutation(
    CREATE_BCS_INPUT_AGRI,
  );
  const [updateBasicCocoaStatisticDomesticInputAgri] = useMutation(
    UPDATE_BCS_INPUT_AGRI,
  );
  const [deleteBasicCocoaStatisticDomesticInputAgri] = useMutation(
    DELETE_BCS_INPUT_AGRI,
  );
  let allBasicCocoaStatisticDomesticInputAgries = [];

  if (data?.allBasicCocoaStatisticDomesticInputAgries) {
    allBasicCocoaStatisticDomesticInputAgries =
      data.allBasicCocoaStatisticDomesticInputAgries;
  }

  let allLocalRegion = [];
  if (data?.allLocalRegion) {
    allLocalRegion = data.allLocalRegion;
  }

  let allAgriInputType = [];
  if (data?.allAgriInputType) {
    allAgriInputType = data.allAgriInputType;
  }

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
                let allStates = [];
                if (propsTable.row.original.LocalRegion) {
                  const found = allLocalRegion.find(
                    reg => reg._id === propsTable.row.original.LocalRegion._id,
                  );

                  if (found && found.States.length > 0) {
                    allStates = found.States;
                  }
                }
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  regionId: propsTable.row.original.LocalRegion?._id || "",
                  stateId: propsTable.row.original.LocalState?._id || "",
                  agriInputTypeId:
                    propsTable.row.original.AgriInputType?._id || "",
                });
                setState(allStates);
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
  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Agri Input`}
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
              await createBasicCocoaStatisticDomesticInputAgri({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateBasicCocoaStatisticDomesticInputAgri({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Agri Input saved!`,
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
          <label>Quarter*</label>
          <select
            className="form-control"
            value={formData.quarter || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                quarter: e.target.value,
              });
            }}
            required>
            <option value="" disabled>
              Select Quarter
            </option>
            <option value="1">Q1</option>
            <option value="2">Q2</option>
            <option value="3">Q3</option>
            <option value="4">Q4</option>
          </select>
        </div>

        <div className="form-group">
          <label>Region*</label>

          <select
            className="form-control"
            value={formData.regionId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              const region = allLocalRegion.find(
                reg => reg._id === e.target.value,
              );

              setFormData({
                ...formData,
                regionId: e.target.value,
                stateId: "",
              });
              setState(region.States);
            }}>
            <option value="" disabled>
              Select Region
            </option>
            {allLocalRegion.map(region => (
              <option value={region._id}>{region.description}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>State*</label>

          <select
            className="form-control"
            value={formData.stateId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                stateId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select State
            </option>
            {allStates.map(state => (
              <option value={state._id}>{state.description}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Brand*</label>
          <input
            placeholder="brand"
            className="form-control"
            value={formData.brand || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                brand: e.target.value,
              });
            }}
            required
          />
        </div>

        <div className="form-group">
          <label>Agri Type*</label>
          <select
            className="form-control"
            value={formData.agriInputTypeId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                agriInputTypeId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Agri Type
            </option>
            {allAgriInputType.map(type => (
              <option value={type._id}>{type.description}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Prices</label>
          <NumberFormat
            className="form-control"
            value={formData.prices || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            onValueChange={e => {
              setFormData({
                ...formData,
                prices: e.floatValue,
              });
            }}
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
                title: "BCS Domestic - Agri Input",
                collectionName: "BasicCocoaStatisticDomesticInputAgries",
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
        data={allBasicCocoaStatisticDomesticInputAgries}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege([
            "BCS Domestic Input Agri Fertilizer:Create",
          ])
            ? null
            : e => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({});
              }
        }
        onRemove={
          currentUserDontHavePrivilege([
            "BCS Domestic Input Agri Fertilizer:Delete  ",
          ])
            ? null
            : async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} data?`,
                  );
                  if (yes) {
                    for (const row of rows) {
                      await deleteBasicCocoaStatisticDomesticInputAgri({
                        variables: {
                          _id: row._id,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} data deleted`,
                      level: "success",
                    });
                    await refetch();
                  }
                } catch (err) {
                  handleError(err);
                }
                hideLoadingSpinner();
              }
        }
        customUtilities={
          currentUserDontHavePrivilege([
            "BCS Domestic Input Agri Fertilizer:Update",
          ])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />
      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">
          {data?.countBasicCocoaStatisticDomesticInputAgries || 0}
        </p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(BasicCocoaStatisticDomesticInputAgri);
