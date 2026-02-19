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
import dayjs from "dayjs";
import { FormModal } from "../Modal";
import NumberFormat from "react-number-format";
const QUERY = gql`
  query allTradeDataGlobalMissing {
    allTradeDataGlobalMissing {
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
      missingMessages
      tradeDataImportLogFileId

      fileName
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
  }
`;

const UDPATE_MISSING_DATA = gql`
  mutation updateMissingGlobalTradeData(
    $_id: String!
    $type: String
    $year: String
    $countryId: String
    $globalSITCProductId: String
    $quantity: Float
    $attachmentFileUrl: String
  ) {
    updateMissingGlobalTradeData(
      _id: $_id
      type: $type
      year: $year
      countryId: $countryId
      globalSITCProductId: $globalSITCProductId
      quantity: $quantity
      attachmentFileUrl: $attachmentFileUrl
    )
  }
`;

const MIGRATE_MISSING_DATA = gql`
  mutation migrateToFixedGlobalTradeData($_id: String!) {
    migrateToFixedGlobalTradeData(_id: $_id)
  }
`;

const GlobalTradeDataMissing = () => {
  const router = useRouter();
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY, {});
  const [updateMissingGlobalTradeData] = useMutation(UDPATE_MISSING_DATA);
  const [migrateToFixedGlobalTradeData] = useMutation(MIGRATE_MISSING_DATA);
  const [allCountries, setAllCountries] = useState([]);

  const currentYear = parseInt(router.query.year || dayjs().format("YYYY"));
  const nextYear = String(currentYear + 1);
  const year = `${currentYear}/${nextYear.slice(2, 4)}`;

  let allTradeDataGlobalMissing = [];
  if (data?.allTradeDataGlobalMissing) {
    allTradeDataGlobalMissing = data.allTradeDataGlobalMissing;
  }

  let allCountryRegion = [];
  if (data?.allCountryRegion) {
    allCountryRegion = data.allCountryRegion;
  }
  let allGlobalSITCProducts = [];
  if (data?.allGlobalSITCProducts) {
    allGlobalSITCProducts = data.allGlobalSITCProducts;
  }

  const fetchData = async () => {
    await refetch()
  }
  useEffect(() => {
    // await refetch();
    if (router.query.optionTypes && router.query.optionTypes === "MISSING") {
      console.log("fetching....");
      fetchData()
    }
  }, [router.query]);

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

                const country = propsTable.row.original.Country || null;

                const countryRegionId = country?.CountryRegion?._id || "";

                const region = allCountryRegion.find(
                  reg => reg._id === countryRegionId,
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
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg">
              <p className="text-white font-bold text-md font-bold">
                <i className="fa fa-pencil-alt " /> Edit
              </p>
            </button>

            <button
              onClick={async e => {
                if (e) e.preventDefault();
                showLoadingSpinner();
                if (confirm("Are you sure to migrate this data?")) {
                  try {
                    await migrateToFixedGlobalTradeData({
                      variables: {
                        _id: propsTable.row.original._id,
                      },
                    });

                    await refetch();
                    notification.addNotification({
                      title: "Succeess!",
                      message: `Missing data migrated`,
                      level: "success",
                    });
                  } catch (err) {
                    notification.handleError(err);
                  }
                }
                hideLoadingSpinner();
              }}
              className="mb-1 bg-blue-500 hover:bg-purple-600 mx-1 py-2 px-4 text-white focus:outline-none rounded-md shadow-lg">
              <p className="text-white font-bold text-lg font-bold">
                <i className="fa fa-exchange-alt " /> Migrate
              </p>
            </button>
          </div>
        );
      },
    },
  ]);

  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1940;
    // console.log([...new Array(toYear - fromYear)])

    let result = [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });

    return result;
  }, []);

  const columns = useMemo(() => [
    {
      Header: "Year",
      accessor: "year",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Type",
      accessor: "type",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Country",
      accessor: "Country.name",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Country Region",
      accessor: "Country.CountryRegion.description",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Product Code",
      accessor: "GlobalSITCProduct.gsitcCode",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Global SITC Product",
      accessor: "GlobalSITCProduct.product",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Quantity",
      accessor: "quantity",
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
    {
      Header: "File Name",
      accessor: "fileName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "URL File",
      accessor: "attachmentFileUrl",
      style: {
        fontSize: 20,
        width: 350,
      },
    },
    {
      Header: "Note",
      accessor: "missingMessages",
      style: {
        fontSize: 20,
        width: 350,
      },
      Cell: props => <span>{props.value.toString()}</span>,
    },
  ]);
  return (
    <div className="w-full px-4 mt-4">
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Missing Global Trade Data`}
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

            await updateMissingGlobalTradeData({
              variables: {
                ...formData,
              },
            });

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Missing Global Trade saved!`,
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
            value={formData?.year || year}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                year: parseInt(e.target.value),
              });
            }}
            required>
            {YEARS.map(y => (
              <option value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Type*</label>
          <select
            className="form-control"
            value={formData?.type || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                type: e.target.value,
              });
            }}
            required>
            <option value="" disabled>
              Select Export/Import Type
            </option>
            <option value="Export">Export</option>
            <option value="Import">Import</option>
          </select>
        </div>

        <div className="form-group">
          <label>Country Region*</label>
          <select
            className="form-control"
            value={formData?.countryRegionId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              const region = allCountryRegion.find(
                reg => reg._id === e.target.value,
              );

              setAllCountries(region?.Countries || []);
              setFormData({
                ...formData,
                countryRegionId: e.target.value,
                countryId: "",
              });
            }}
            required>
            <option value="" disabled>
              Select Country Region
            </option>
            {allCountryRegion.map(c => (
              <option value={c._id}>{c.description}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Country*</label>
          <select
            className="form-control"
            value={formData?.countryId || ""}
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
            {allCountries.map(c => (
              <option value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Global SITC Product*</label>
          <select
            className="form-control"
            value={formData?.globalSITCProductId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                globalSITCProductId: e.target.value,
              });
            }}
            required>
            <option value="" disabled>
              Select Product
            </option>
            {allGlobalSITCProducts.map(p => (
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
            onValueChange={e => {
              // if (e) e.preventDefault();

              setFormData({
                ...formData,
                quantity: e.floatValue,
              });
            }}
          />
        </div>
      </FormModal>

      <div className="flex justify-between mb-4">
        <div>
          <p
            className="text-xl font-bold cursor-pointer"
            onClick={e => {
              if (e) e.preventDefault();
              router.replace({
                pathname: router.pathname,
                query: {
                  sidebarMenu: "trade_data",
                  appState: "SEP",
                },
              });
            }}>
            <i className="fa fa-arrow-left" /> Back
          </p>
        </div>
        <div>
          <p className="text-xl font-bold">
            <i className="fa fa-exclamation-circle" /> Missing Data
          </p>
        </div>
      </div>
      <Table
        loading={loading}
        columns={columns}
        data={allTradeDataGlobalMissing}
        withoutHeader={true}
        customUtilities={customUtilities}
      />
    </div>
  );
};
export default withApollo({ ssr: true })(GlobalTradeDataMissing);
