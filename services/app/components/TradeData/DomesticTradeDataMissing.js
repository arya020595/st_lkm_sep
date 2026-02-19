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

const MONTHS = [
  { monthName: "January", month: 1 },
  { monthName: "February", month: 2 },
  { monthName: "March", month: 3 },
  { monthName: "April", month: 4 },
  { monthName: "May", month: 5 },
  { monthName: "June", month: 6 },
  { monthName: "July", month: 7 },
  { monthName: "August", month: 8 },
  { monthName: "September", month: 9 },
  { monthName: "October", month: 10 },
  { monthName: "November", month: 11 },
  { monthName: "Desember", month: 12 },
];

const QUERY = gql`
  query allTradeDataDomesticMissing {
    allTradeDataDomesticMissing {
      _id
      type
      year
      month
      monthName
      missingMessages
      tradeDataImportLogFileId
      Country {
        _id
        name
      }
      LocalSITCProduct {
        _id
        sitcCode
        asitcCode
        gsitcCode
        product
        refSTICCode
      }
      InfoStatus {
        _id
        description
      }
      attachmentFileUrl
      fileName
    }

    allCountries {
      _id
      name
    }
    allLocalSITCProducts {
      _id
      product
      asitcCode
      gsitcCode
      refSTICCode
      sitcCode
    }
    allInfoStatuses {
      _id
      description
    }
  }
`;

const UDPATE_MISSING_DATA = gql`
  mutation updateMissingDomesticTradeData(
    $_id: String!
    $type: String!
    $year: Int!
    $month: Int!
    $monthName: String
    $countryId: String
    $localSITCProductId: String
    $infoStatusId: String
  ) {
    updateMissingDomesticTradeData(
      _id: $_id
      type: $type
      year: $year
      month: $month
      monthName: $monthName
      countryId: $countryId
      localSITCProductId: $localSITCProductId
      infoStatusId: $infoStatusId
    )
  }
`;

const MIGRATE_MISSING_DATA = gql`
  mutation migrateToFixedDomesticTradeData($_id: String!) {
    migrateToFixedDomesticTradeData(_id: $_id)
  }
`;

const DomesticTradeDataMissing = () => {
  const router = useRouter();
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, error, loading, refetch } = useQuery(QUERY, {});
  const [updateMissingDomesticTradeData] = useMutation(UDPATE_MISSING_DATA);
  const [migrateToFixedDomesticTradeData] = useMutation(MIGRATE_MISSING_DATA);

  let allTradeDataDomesticMissing = [];
  if (data?.allTradeDataDomesticMissing) {
    allTradeDataDomesticMissing = data.allTradeDataDomesticMissing;
  }

  let allCountries = [];
  if (data?.allCountries) {
    allCountries = data.allCountries;
  }
  let allLocalSITCProducts = [];
  if (data?.allLocalSITCProducts) {
    allLocalSITCProducts = data.allLocalSITCProducts;
  }
  let allInfoStatuses = [];
  if (data?.allInfoStatuses) {
    allInfoStatuses = data.allInfoStatuses;
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
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  countryId: propsTable.row.original?.Country?._id || "",
                  localSITCProductId:
                    propsTable.row.original?.LocalSITCProduct?._id || "",
                  infoStatusId: propsTable.row.original?.InfoStatus?._id || "",
                });
              }}
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-2 px-4 text-white focus:outline-none rounded-md shadow-lg">
              <p className="text-white font-bold text-lg font-bold">
                <i className="fa fa-pencil-alt " /> Edit
              </p>
            </button>

            <button
              onClick={async e => {
                if (e) e.preventDefault();
                showLoadingSpinner();
                if (confirm("Are you sure to migrate this data?")) {
                  try {
                    await migrateToFixedDomesticTradeData({
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
    // {
    //   Header: "ID",
    //   accessor: "_id",
    // },
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
      Header: "Month",
      accessor: "monthName",
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
      Header: "Product Code",
      accessor: "LocalSITCProduct.sitcCode",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Local SITC Product",
      accessor: "LocalSITCProduct.product",
      style: {
        fontSize: 20,
      },
    },

    {
      Header: "InfoStatus",
      accessor: "InfoStatus.description",
      style: {
        fontSize: 20,
      },
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
      Cell: props => {
        if (props.value) {
          return <a href={props.value}>{props.value}</a>;
        }
        return <div />;
      },
    },
    {
      Header: "File Log Id",
      accessor: "tradeDataImportLogFileId",
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
        title={`${!formData._id ? "New" : "Edit"} Missing Domestic Trade Data`}
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

            await updateMissingDomesticTradeData({
              variables: {
                ...formData,
              },
            });

            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Missing Domestic Trade saved!`,
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
            value={formData?.year || ""}
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
          <label>Month</label>
          <select
            className="form-control"
            value={formData?.monthName || ""}
            onChange={e => {
              if (e) e.preventDefault();
              const m = MONTHS.find(m => m.monthName === e.target.value);
              setFormData({
                ...formData,
                monthName: m.monthName,
                month: m.month,
              });
            }}
            required>
            <option value="" disabled>
              Select Month
            </option>
            {MONTHS.map(m => (
              <option value={m.monthName}>{m.monthName}</option>
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
          <label>Local SITC Product*</label>
          <select
            className="form-control"
            value={formData?.localSITCProductId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                localSITCProductId: e.target.value,
              });
            }}
            required>
            <option value="" disabled>
              Select Product
            </option>
            {allLocalSITCProducts.map(p => (
              <option value={p._id}>
                {p.product} - ({p.sitcCode})
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Info Status</label>
          <select
            className="form-control"
            value={formData?.infoStatusId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                infoStatusId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Info Status
            </option>
            {allInfoStatuses.map(info => (
              <option value={info._id}>{info.description}</option>
            ))}
          </select>
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
        data={allTradeDataDomesticMissing}
        withoutHeader={true}
        customUtilities={customUtilities}
      />
    </div>
  );
};
export default withApollo({ ssr: true })(DomesticTradeDataMissing);
