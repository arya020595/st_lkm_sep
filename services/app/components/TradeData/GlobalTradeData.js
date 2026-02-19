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
import { useRouter } from "next/router";
import Link from "next/link";
import Table from "../Table";
import { FormModal } from "../Modal";
import NumberFormat from "react-number-format";
import dayjs from "dayjs";
import GlobalExportTradeData from "./GlobalExportTradeData";
import GlobalImportTradeData from "./GlobalImportTradeData";
import GlobalImportFileLog from "./GlobalImportFileLog";
import GlobalTradeDataMissing from "./GlobalTradeDataMissing";
import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";

const ALL_GLOBAL_TRADES = gql`
  query listQueris($year: String!, $years: [String!]) {
    allTradeDataGlobals(year: $year, years: $years) {
      _id
      type
      year
      quantity
      Country {
        _id
        name
        CountryRegion {
          _id
          description
        }
      }
      GlobalSITCProduct {
        _id
        sitcCode
        asitcCode
        gsitcCode
        product
        refSTICCode
      }
      attachmentFileUrl

      countryName
      globalSITCCode
      countryRegionName
    }

    allCountryRegion {
      _id
      description
      Countries {
        _id
        name
      }
    }

    allGlobalSITCProducts {
      _id
      product
      asitcCode
      gsitcCode
      refSTICCode
      sitcCode
    }
    countAllTradeDataGlobal
  }
`;

const CREATE_GLOBAL_TRADE = gql`
  mutation createTradeDataGlobal(
    $type: String!
    $year: String!
    $countryId: String!
    $quantity: Float!
    $globalSITCProductId: String!
    $attachmentFileUrl: String
  ) {
    createTradeDataGlobal(
      type: $type
      year: $year
      quantity: $quantity
      countryId: $countryId
      globalSITCProductId: $globalSITCProductId
      attachmentFileUrl: $attachmentFileUrl
    )
  }
`;

const UPDATE_GLOBAL_TRADE = gql`
  mutation updateTradeDataGlobal(
    $_id: String!
    $type: String!
    $year: String!
    $quantity: Float
    $countryId: String
    $globalSITCProductId: String
    $attachmentFileUrl: String
  ) {
    updateTradeDataGlobal(
      _id: $_id
      type: $type
      year: $year
      quantity: $quantity
      countryId: $countryId
      globalSITCProductId: $globalSITCProductId
      attachmentFileUrl: $attachmentFileUrl
    )
  }
`;

const DELETE_GLOBAL_TRADE = gql`
  mutation deleteTradeDataGlobal($_id: String!) {
    deleteTradeDataGlobal(_id: $_id)
  }
`;
const GlobalTradeData = ({ currentUserDontHavePrivilege }) => {
  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1980;
    // console.log([...new Array(toYear - fromYear)])

    let result = [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });

    result = result.map((t) => {
      const current = parseInt(t);
      let next = String(current + 1);
      next = next.slice(2, 4);
      return `${current}/${next}`;
    });
    return result;
  }, []);

  const notification = useNotification();
  const router = useRouter();
  const [formData, setFormData] = useState({});
  const [allCountries, setAllCountries] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);

  // const currentYear = parseInt(router.query.year || dayjs().format("YYYY"));
  // const nextYear = String(currentYear + 1);
  // const year = `${currentYear}/${nextYear.slice(2, 4)}`;
  const [year, setYear] = useState(YEARS[0]);
  const [years, setYears] = useState([year]);

  const { data, loading, error, refetch } = useQuery(ALL_GLOBAL_TRADES, {
    variables: {
      year,
      years,
    },
  });

  const fetchData = async () => {
    await refetch();
  };

  useEffect(() => {
    // await refetch();
    if (!router.query.optionTypes) {
      console.log("fetching....");
      fetchData();
    }
  }, [router.query]);

  const [createTradeDataGlobal] = useMutation(CREATE_GLOBAL_TRADE);
  const [updateTradeDataGlobal] = useMutation(UPDATE_GLOBAL_TRADE);
  const [deleteTradeDataGlobal] = useMutation(DELETE_GLOBAL_TRADE);

  let allTradeDataGlobals = [];
  if (data?.allTradeDataGlobals) {
    allTradeDataGlobals = data.allTradeDataGlobals;
  }

  let allCountryRegion = [];
  if (data?.allCountryRegion) {
    allCountryRegion = data.allCountryRegion;
  }
  let allGlobalSITCProducts = [];
  if (data?.allGlobalSITCProducts) {
    allGlobalSITCProducts = data.allGlobalSITCProducts;
  }

  const columns = useMemo(() => [
    {
      Header: "Type",
      accessor: "type",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Year",
      accessor: "year",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Country Region",
      accessor: "countryRegionName",
      style: {
        fontSize: 20,
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
      Header: "Product Type",
      accessor: "globalSITCCode",
      style: {
        fontSize: 20,
      },
    },
    // {
    //   Header: "Product Code",
    //   accessor: "GlobalSITCProduct.gsitcCode",
    //   style: {
    //     fontSize: 20,
    //   },
    // },

    {
      Header: "Quantity",
      accessor: "quantity",
      style: {
        fontSize: 20,
      },
      Cell: (props) => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    // {
    //   Header: "URL File",
    //   accessor: "attachmentFileUrl",
    //   style: {
    //     fontSize: 20,
    //     width: 350,
    //   },
    // },
  ]);

  const customUtilities = useMemo(() => [
    {
      label: "Edit",
      icon: <i className="fa fa-pencil" />,
      width: 400,
      render: (propsTable) => {
        return (
          <div className="flex">
            <button
              onClick={(e) => {
                if (e) e.preventDefault();

                const country = propsTable.row.original.Country;

                const countryRegionId = country.CountryRegion?._id || "";

                const region = allCountryRegion.find(
                  (reg) => reg._id === countryRegionId
                );

                setAllCountries(region?.Countries || []);

                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  countryId: country?._id || "",
                  countryRegionId,
                  globalSITCProductId:
                    propsTable.row.original?.GlobalSITCProduct?._id || "",
                });
              }}
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg"
            >
              <p className="text-white font-bold text-md font-bold">
                <i className="fa fa-pencil-alt " /> Edit
              </p>
            </button>
          </div>
        );
      },
    },
  ]);

  const handleClickOptionTypes = (type) => (e) => {
    if (e) e.preventDefault();
    router.replace({
      pathname: router.pathname,
      query: {
        ...router.query,
        optionTypes: type,
      },
    });
  };

  if (router.query.optionTypes && router.query.optionTypes === "IMPORT") {
    return <GlobalImportTradeData years={YEARS} />;
  } else if (router.query.optionTypes === "EXPORT") {
    return <GlobalExportTradeData years={YEARS} />;
  } else if (router.query.optionTypes === "LOG") {
    return <GlobalImportFileLog type={"GLOBAL"} />;
  } else if (router.query.optionTypes === "MISSING") {
    return <GlobalTradeDataMissing />;
  } else {
    return (
      <div>
        <FormModal
          title={`${!formData._id ? "New" : "Edit"} Global Trade`}
          visible={modalVisible}
          onClose={(e) => {
            if (e) e.preventDefault();
            setModalVisible(false);
            setFormData({});
          }}
          onSubmit={async (e) => {
            if (e) e.preventDefault();
            showLoadingSpinner();
            try {
              let { _id, __typename, _createdAt, _updatedAt } = formData;
              console.log({ formData });
              if (!_id) {
                await createTradeDataGlobal({
                  variables: {
                    year,
                    ...formData,
                  },
                });
              } else {
                await updateTradeDataGlobal({
                  variables: {
                    year,
                    ...formData,
                  },
                });
              }
              await refetch();
              notification.addNotification({
                title: "Succeess!",
                message: `Global Trade saved!`,
                level: "success",
              });
              setModalVisible(false);
            } catch (e) {
              notification.handleError(e);
            }
            hideLoadingSpinner();
          }}
        >
          <div className="form-group">
            <label>Type*</label>
            <select
              className="form-control"
              value={formData?.type || ""}
              onChange={(e) => {
                if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  type: e.target.value,
                });
              }}
              required
            >
              <option value="" disabled>
                Select Export/Import Type
              </option>
              <option value="Export">Export</option>
              <option value="Import">Import</option>
              <option value="Re-Export">Re-Export</option>
            </select>
          </div>
          <div className="form-group">
            <label>Year*</label>
            <select
              className="form-control"
              value={formData?.year || year}
              onChange={(e) => {
                if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  year: "" + e.target.value,
                });
              }}
              required
            >
              {YEARS.map((y) => (
                <option value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Country Region*</label>
            <select
              className="form-control"
              value={formData?.countryRegionId || ""}
              onChange={(e) => {
                if (e) e.preventDefault();
                const region = allCountryRegion.find(
                  (reg) => reg._id === e.target.value
                );

                setAllCountries(region?.Countries || []);
                setFormData({
                  ...formData,
                  countryRegionId: e.target.value,
                  countryId: "",
                });
              }}
              required
            >
              <option value="" disabled>
                Select Country Region
              </option>
              {allCountryRegion.map((c) => (
                <option value={c._id}>{c.description}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Country*</label>
            <select
              className="form-control"
              value={formData?.countryId || ""}
              onChange={(e) => {
                if (e) e.preventDefault();

                setFormData({
                  ...formData,
                  countryId: e.target.value,
                });
              }}
              required
            >
              <option value="" disabled>
                Select Country
              </option>
              {allCountries.map((c) => (
                <option value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Global SITC Product*</label>
            <select
              className="form-control"
              value={formData?.globalSITCProductId || ""}
              onChange={(e) => {
                if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  globalSITCProductId: e.target.value,
                });
              }}
              required
            >
              <option value="" disabled>
                Select Product
              </option>
              {allGlobalSITCProducts.map((p) => (
                <option value={p._id}>
                  {p.product} - ({p.gsitcCode})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Quantity*</label>
            <NumberFormat
              className="form-control"
              value={formData.quantity || 0}
              thousandSeparator={"."}
              decimalSeparator={","}
              onValueChange={(e) => {
                // if (e) e.preventDefault();

                setFormData({
                  ...formData,
                  quantity: e.floatValue,
                });
              }}
            />
          </div>
        </FormModal>

        <div className="flex">
          {currentUserDontHavePrivilege([
            "Global Trade Import File:Create",
          ]) ? null : (
            <button
              className="bg-mantis-700 mr-2 shadow-md rounded-md px-4 py-2"
              onClick={handleClickOptionTypes("IMPORT")}
            >
              <p className="text-white font-bold text-md">
                <i className="fa fa-upload" /> Import File
              </p>
            </button>
          )}

          {currentUserDontHavePrivilege([
            "Global Trade Export File:Create",
          ]) ? null : (
            <button
              className="bg-medium-red-violet-700 mr-2 shadow-md rounded-md px-4 py-2"
              onClick={handleClickOptionTypes("EXPORT")}
            >
              <p className="text-white font-bold text-md">
                <i className="fa fa-download" /> Export File
              </p>
            </button>
          )}

          {currentUserDontHavePrivilege([
            "Global Trade Log File:Read",
          ]) ? null : (
            <button
              className="bg-cyan-700 mr-2 shadow-md rounded-md px-4 py-2"
              onClick={handleClickOptionTypes("LOG")}
            >
              <p className="text-white font-bold text-md">
                <i className="fa fa-history" /> Log File
              </p>
            </button>
          )}

          {currentUserDontHavePrivilege([
            "Global Trade Missing Data:Create",
          ]) ? null : (
            <button
              className="bg-yellow-500 mr-2 shadow-md rounded-md px-4 py-2"
              onClick={handleClickOptionTypes("MISSING")}
            >
              <p className="text-white font-bold text-md">
                <i className="fa fa-exclamation-circle" /> Missing Data
              </p>
            </button>
          )}
        </div>

        <Table
          customHeaderUtilities={
            <div>
              <MultiYearsFilterWithExport
                label="Year Filter"
                defaultValue={year}
                type="Global Trade Data"
                options={YEARS}
                onSelect={(year, years) => {
                  setYear(year);
                  setYears(years);
                }}
                exportConfig={{
                  title: "Trade Data - Global Trade",
                  collectionName: "GlobalTradeDatas",
                  filters: {
                    year: [...years].map((year) => year),
                  },
                  columns,
                }}
              />
            </div>
          }
          onAdd={
            currentUserDontHavePrivilege(["Global Trade:Create"])
              ? null
              : (e) => {
                  if (e) e.preventDefault();
                  setFormData({});
                  setModalVisible(true);
                }
          }
          onRemove={
            currentUserDontHavePrivilege(["Global Trade:Delete"])
              ? null
              : async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} trade data ?`
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteTradeDataGlobal({
                          variables: {
                            _id: row._id,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} trade data deleted`,
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
          loading={loading}
          columns={columns}
          data={allTradeDataGlobals}
          withoutHeader={true}
          customUtilities={
            currentUserDontHavePrivilege(["Global Trade:Update"])
              ? null
              : customUtilities
          }
          customUtilitiesPosition="left"
        />

        <div className="flex mt-4">
          <p className="text-md">Total Data: </p>
          <p className="text-md font-bold mx-4">
            {data?.countAllTradeDataGlobal || 0}
          </p>
        </div>
      </div>
    );
  }
};
export default withApollo({ ssr: true })(GlobalTradeData);
