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
import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";

import dayjs from "dayjs";
const QUERY = gql`
  query listQueries($year: String!, $years: [String!]) {
    allGlobalCocoaProductionICCOs(year: $year, years: $years) {
      _id
      year
      CountryRegion {
        _id
        description
      }
      Country {
        _id
        name
      }
      productionValue

      countryRegionName
      countryName
    }

    allCountryRegion {
      _id
      description
      Countries {
        _id
        name
      }
    }
    countGlobalCocoaProductionICCOs
  }
`;

const CREATE_BCS_GLOBAL_PRODUCTION = gql`
  mutation createGlobalCocoaProductionICCO(
    $year: String
    $countryRegionId: String
    $countryId: String
    $productionValue: Float
  ) {
    createGlobalCocoaProductionICCO(
      year: $year
      countryRegionId: $countryRegionId
      countryId: $countryId
      productionValue: $productionValue
    )
  }
`;

const UPDATE_BCS_GLOBAL_PRODUCTION = gql`
  mutation updateGlobalCocoaProductionICCO(
    $_id: String!
    $year: String
    $countryRegionId: String
    $countryId: String
    $productionValue: Float
  ) {
    updateGlobalCocoaProductionICCO(
      _id: $_id
      year: $year
      countryRegionId: $countryRegionId
      countryId: $countryId
      productionValue: $productionValue
    )
  }
`;
const DELETE_BCS_GLOBAL_PRODUCTION = gql`
  mutation deleteGlobalCocoaProductionICCO($_id: String!) {
    deleteGlobalCocoaProductionICCO(_id: $_id)
  }
`;
const BasicCocoaStatisticGlobalProduction = ({
  currentUserDontHavePrivilege,
}) => {
  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1980;
    // console.log([...new Array(toYear - fromYear)])

    let result = [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });

    result = result.map(t => {
      const current = parseInt(t);
      let next = String(current + 1);
      next = next.slice(2, 4);
      return `${current}/${next}`;
    });
    return result;
  }, []);
  const router = useRouter();
  // const currentYear = parseInt(router.query.year || dayjs().format("YYYY"));
  // const nextYear = String(currentYear + 1);
  // const year = `${currentYear}/${nextYear.slice(2, 4)}`;

  const [year, setYear] = useState(YEARS[0]);
  const [years, setYears] = useState([year]);

  const notification = useNotification();
  const [formData, setFormData] = useState({
    year,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [allCountries, setCountries] = useState([]);

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
      Header: "Country Region",
      accessor: "countryRegionName",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Country",
      accessor: "countryName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Production Volume (Tonne)",
      accessor: "productionValue",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
  ]);

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      year,
      years,
    },
  });
  const [createGlobalCocoaProductionICCO] = useMutation(
    CREATE_BCS_GLOBAL_PRODUCTION,
  );
  const [updateGlobalCocoaProductionICCO] = useMutation(
    UPDATE_BCS_GLOBAL_PRODUCTION,
  );
  const [deleteGlobalCocoaProductionICCO] = useMutation(
    DELETE_BCS_GLOBAL_PRODUCTION,
  );
  let allGlobalCocoaProductionICCOs = [];

  if (data?.allGlobalCocoaProductionICCOs) {
    allGlobalCocoaProductionICCOs = data.allGlobalCocoaProductionICCOs;
  }

  let allCountryRegion = [];
  if (data?.allCountryRegion) {
    allCountryRegion = data.allCountryRegion;
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
                let allCountries = [];
                if (propsTable.row.original.CountryRegion) {
                  const found = allCountryRegion.find(
                    reg =>
                      reg._id === propsTable.row.original.CountryRegion._id,
                  );

                  if (found && found.Countries.length > 0) {
                    allCountries = found.Countries;
                  }
                }
                // console.log(propsTable.row.original);
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  countryRegionId:
                    propsTable.row.original.CountryRegion?._id || "",
                  countryId: propsTable.row.original.Country?._id || "",
                });
                setCountries(allCountries);
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

  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} BCS Global Production`}
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
              await createGlobalCocoaProductionICCO({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateGlobalCocoaProductionICCO({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `BCS Global Production saved!`,
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
          <select
            className="form-control"
            value={formData.year}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                year: e.target.value,
              });
            }}
            required>
            {YEARS.map(y => (
              <option value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Country Region*</label>
          <select
            className="form-control"
            value={formData.countryRegionId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              const region = allCountryRegion.find(
                reg => reg._id === e.target.value,
              );

              setFormData({
                ...formData,
                countryRegionId: e.target.value,
                countryId: "",
              });
              setCountries(region.Countries);
            }}
            required>
            <option value="" disabled>
              Select Country Region
            </option>
            {allCountryRegion.map(region => (
              <option value={region._id}>{region.description}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Country*</label>
          <select
            className="form-control"
            value={formData.countryId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                countryId: e.target.value,
              });
            }}
            required>
            <option value="" disabled>
              Select Country
            </option>
            {allCountries.map(country => (
              <option value={country._id}>{country.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Production Volume (Tonne)</label>
          <NumberFormat
            className="form-control"
            value={formData.productionValue || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                productionValue: e.floatValue,
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
              defaultValue={
                // dayjs().format("YYYY")
                year
              }
              options={YEARS}
              onSelect={(year, years) => {
                setYear(year);
                setYears(years);
              }}
              exportConfig={{
                title: "BCS Global - Production",
                collectionName: "GlobalCocoaProductionICCOs",
                filters: {
                  year: years,
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
        data={allGlobalCocoaProductionICCOs}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege(["BCS Global Production:Create"])
            ? null
            : e => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({
                  year,
                });
              }
        }
        onRemove={
          currentUserDontHavePrivilege(["BCS Global Production:Delete"])
            ? null
            : async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} data?`,
                  );
                  if (yes) {
                    for (const row of rows) {
                      await deleteGlobalCocoaProductionICCO({
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
          currentUserDontHavePrivilege(["BCS Global Production:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />

      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">
          {data?.countGlobalCocoaProductionICCOs || 0}
        </p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(BasicCocoaStatisticGlobalProduction);
