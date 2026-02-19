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
import TableResizeable from "../../components/TableResizeable";
import { FormModal } from "../../components/Modal";
import NumberFormat from "react-number-format";
import { SingleSelect } from "../../components/form/SingleSelect";
import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";
import dayjs from "dayjs";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY = gql`
  query listQueries {
    allCountryRegionTokenized
  }
`;

const QUERY_GRINDING_GLOBAL = gql`
  query grindingGlobalQuery($year: String!, $years: [String!]) {
    allBasicCocoaStatisticGlobalGrindingsTokenized(year: $year, years: $years)
    countBasicCocoaStatisticGlobalGrindings
  }
`;

const CREATE_BCS_GLOBAL_GRINDING = gql`
  mutation createBasicCocoaStatisticGlobalGrindingTokenized(
    $tokenized: String!
  ) {
    createBasicCocoaStatisticGlobalGrindingTokenized(tokenized: $tokenized)
  }
`;

const UPDATE_BCS_GLOBAL_GRINDING = gql`
  mutation updateBasicCocoaStatisticGlobalGrindingTokenized(
    $tokenized: String!
  ) {
    updateBasicCocoaStatisticGlobalGrindingTokenized(tokenized: $tokenized)
  }
`;
const DELETE_BCS_GLOBAL_GRINDING = gql`
  mutation deleteBasicCocoaStatisticGlobalGrindingTokenized(
    $tokenized: String!
  ) {
    deleteBasicCocoaStatisticGlobalGrindingTokenized(tokenized: $tokenized)
  }
`;
const BasicCocoaStatisticGlobalGrinding = ({
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
  const client = useApolloClient();
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
      width: 80,
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
      Header: "Grinding Volume (Tonne)",
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

  const { data, loading, error, refetch } = useQuery(QUERY, {});

  const [createBasicCocoaStatisticGlobalGrinding] = useMutation(
    CREATE_BCS_GLOBAL_GRINDING,
  );
  const [updateBasicCocoaStatisticGlobalGrinding] = useMutation(
    UPDATE_BCS_GLOBAL_GRINDING,
  );
  const [deleteBasicCocoaStatisticGlobalGrinding] = useMutation(
    DELETE_BCS_GLOBAL_GRINDING,
  );

  let [savedCount, setSavedCount] = useState(0);
  let [
    allBasicCocoaStatisticGlobalGrindings,
    setAllBasicCocoaStatisticGlobalGrindings,
  ] = useState([]);
  let [allCountryRegion, setAllCountryRegion] = useState([]);
  let [
    countBasicCocoaStatisticGlobalGrindings,
    setCountBasicCocoaStatisticGlobalGrindings,
  ] = useState(0);

  const fetchDataQueryOnce = async () => {
    const result = await client.query({
      query: QUERY,
      fetchPolicy: "no-cache",
    });
    const encryptCountryRegion = result.data?.allCountryRegionTokenized;
    if (encryptCountryRegion) {
      let CountryRegion = [];
      const decrypted = jwt.verify(encryptCountryRegion, TOKENIZE);
      CountryRegion = decrypted.results;
      setAllCountryRegion(CountryRegion);
    }
  }
  useEffect(() => {
    fetchDataQueryOnce()
  }, []);

  const fetchDataQuery = async (year, years) => {
    const result = await client.query({
      query: QUERY_GRINDING_GLOBAL,
      variables: {
        year,
        years,
      },
      fetchPolicy: "no-cache",
    });
    const encryptGlobalGrindings =
      result.data?.allBasicCocoaStatisticGlobalGrindingsTokenized;
    if (encryptGlobalGrindings) {
      let GlobalGrindings = [];
      const decrypted = jwt.verify(encryptGlobalGrindings, TOKENIZE);
      GlobalGrindings = decrypted.results;
      setAllBasicCocoaStatisticGlobalGrindings(GlobalGrindings);
    }
    setCountBasicCocoaStatisticGlobalGrindings(
      result.data?.countBasicCocoaStatisticGlobalGrindings,
    );
  }
  useEffect(() => {
    fetchDataQuery(year, years)
  }, [year, years, savedCount]);

  // let allBasicCocoaStatisticGlobalGrindings = [];

  // if (data?.allBasicCocoaStatisticGlobalGrindings) {
  //   allBasicCocoaStatisticGlobalGrindings =
  //     data.allBasicCocoaStatisticGlobalGrindings;
  // }

  // let allCountryRegion = [];
  // if (data?.allCountryRegion) {
  //   allCountryRegion = data.allCountryRegion;
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
        title={`${!formData._id ? "New" : "Edit"} BCS Global Grinding`}
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
              const payload = {
                ...formData,
              };
              let tokenized = jwt.sign(payload, TOKENIZE);
              await createBasicCocoaStatisticGlobalGrinding({
                variables: {
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
            } else {
              const payload = {
                ...formData,
              };
              let tokenized = jwt.sign(payload, TOKENIZE);
              await updateBasicCocoaStatisticGlobalGrinding({
                variables: {
                  tokenized,
                },
              });
              setSavedCount((savedCount += 1));
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `BCS Global Grinding saved!`,
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
          <label>Grinding Volume (Tonne)</label>
          <NumberFormat
            className="form-control"
            value={formData.productionValue || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
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

      <TableResizeable
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
                title: "BCS Global - Grindings",
                collectionName: "BasicCocoaStatisticGlobalGrindings",
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
        data={allBasicCocoaStatisticGlobalGrindings}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege(["BCS Global Grinding:Create"])
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
          currentUserDontHavePrivilege(["BCS Global Grinding:Delete"])
            ? null
            : async ({ rows }) => {
              showLoadingSpinner();
              try {
                let yes = confirm(
                  `Are you sure to delete ${rows.length} data?`,
                );
                if (yes) {
                  for (const row of rows) {
                    const payload = {
                      _id: row._id,
                    };
                    let tokenized = jwt.sign(payload, TOKENIZE);
                    await deleteBasicCocoaStatisticGlobalGrinding({
                      variables: {
                        tokenized,
                      },
                    });
                  }
                  setSavedCount((savedCount += 1));
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
          currentUserDontHavePrivilege(["BCS Global Grinding:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />
      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">
          {countBasicCocoaStatisticGlobalGrindings || 0}
        </p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(BasicCocoaStatisticGlobalGrinding);
