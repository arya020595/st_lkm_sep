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
import DomesticImportTradeData from "./DomesticImportTradeData";
import DomesticExportTradeData from "./DomesticExportTradeData";
import DomesticImportFileLog from "./DomesticImportFileLog";
import DomesticTradeDataMissing from "./DomesticTradeDataMissing";

import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";

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
  { monthName: "December", month: 12 },
];

const GET_DOMESTIC_TRADES = gql`
  query domesticQuery($year: String!, $years: [String!]) {
      allTradeDataDomestics(year: $year, years: $years) {
      _id
      type
      year
      month
      monthName
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
      quantity
      value

      countryName
      localSITCCode
      infoStatusName
      localSITCProduct
    }
  }
`
const ALL_DOMESTIC_TRADES = gql`
  query listQueris($year: String!, $years: [String!]) {
    allTradeDataDomestics(year: $year, years: $years) {
      _id
      type
      year
      month
      monthName
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
      quantity
      value

      countryName
      localSITCCode
      infoStatusName
      localSITCProduct
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
    countAllTradeDataDomestic
  }
`;

const CREATE_DOMESTIC_TRADE = gql`
  mutation createTradeDataDomestic(
    $type: String!
    $year: Int!
    $month: Int!
    $monthName: String
    $countryId: String
    $localSITCProductId: String
    $infoStatusId: String
    $attachmentFileUrl: String
    $quantity: Float
    $value: Float
  ) {
    createTradeDataDomestic(
      type: $type
      year: $year
      month: $month
      monthName: $monthName
      countryId: $countryId
      localSITCProductId: $localSITCProductId
      infoStatusId: $infoStatusId
      attachmentFileUrl: $attachmentFileUrl
      quantity: $quantity
      value: $value
    )
  }
`;

const UPDATE_DOMESTIC_TRADE = gql`
  mutation updateTradeDataDomestic(
    $_id: String!
    $type: String!
    $year: Int!
    $month: Int!
    $monthName: String
    $countryId: String
    $localSITCProductId: String
    $infoStatusId: String
    $attachmentFileUrl: String
    $quantity: Float
    $value: Float
  ) {
    updateTradeDataDomestic(
      _id: $_id
      type: $type
      year: $year
      month: $month
      monthName: $monthName
      countryId: $countryId
      localSITCProductId: $localSITCProductId
      infoStatusId: $infoStatusId
      attachmentFileUrl: $attachmentFileUrl
      quantity: $quantity
      value: $value
    )
  }
`;

const DELETE_DOMESTIC_TRADE = gql`
  mutation deleteTradeDataDomestic($_id: String!) {
    deleteTradeDataDomestic(_id: $_id)
  }
`;
const DomesticTradeData = ({ currentUserDontHavePrivilege }) => {
  const client = useApolloClient();
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

  const notification = useNotification();
  const router = useRouter();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  // const year = parseInt(router.query.year || dayjs().format("YYYY"));

  const [year, setYear] = useState(YEARS[0]);
  const [years, setYears] = useState([year]);

  const [allTradeDataDomestics, setAllDomesticTrades] = useState([])
  const [loading, setLoading] = useState(false)
  const { data, error, refetch } = useQuery(ALL_DOMESTIC_TRADES, {
    variables: {
      year,
      years,
    },
  });

  const [createTradeDataDomestic] = useMutation(CREATE_DOMESTIC_TRADE);
  const [updateTradeDataDomestic] = useMutation(UPDATE_DOMESTIC_TRADE);
  const [deleteTradeDataDomestic] = useMutation(DELETE_DOMESTIC_TRADE);

  const fetchData = async (router) => {

    setLoading(true)
    try {
      const result = await client.query({
        query: GET_DOMESTIC_TRADES,
        variables: {
          year,
          years,
        },
        fetchPolicy: 'no-cache'
      })

      let allTradeDataDomestics = result.data.allTradeDataDomestics
      allTradeDataDomestics = allTradeDataDomestics.map(dom => {
        return {
          ...dom,
          localSITCCode: dom.LocalSITCProduct?.sitcCode || "-",
          localSITCProduct: dom.LocalSITCProduct?.product || "-",
        };
      });

      setAllDomesticTrades(allTradeDataDomestics)
    } catch (err) {
      notification.handleError(err)
    }
    setLoading(false)
  }
  useEffect(() => {
    // await refetch();
    if (!router.query.optionTypes) {
      fetchData(router.query)
    }
  }, [router.query]);

  // let allTradeDataDomestics = [];
  // if (data?.allTradeDataDomestics) {
  //   allTradeDataDomestics = data.allTradeDataDomestics;
  //   allTradeDataDomestics = allTradeDataDomestics.map(dom => {
  //     return {
  //       ...dom,
  //       localSITCCode: dom.LocalSITCProduct?.sitcCode || "-",
  //       localSITCProduct: dom.LocalSITCProduct?.product || "-",
  //     };
  //   });
  // }
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
      Header: "Month",
      accessor: "monthName",
      style: {
        fontSize: 20,
      },
    },

    {
      Header: "GSITC",
      accessor: "localSITCCode",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "SITC",
      accessor: "localSITCProduct",
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
        width: 250,
      },
    },
    {
      Header: "InfoStatus",
      accessor: "infoStatusName",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Quantity",
      accessor: "quantity",
      style: {
        fontSize: 20,
        width: 250,
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
      Header: "Value",
      accessor: "value",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          {Number(props.value)
            .toFixed(2)
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
    //   Cell: props => {
    //     if (props.value) {
    //       return <a href={props.value}>{props.value}</a>;
    //     }
    //     return <div />;
    //   },
    // },
    // {
    //   Header: "File Log Id",
    //   accessor: "tradeDataImportLogFileId",
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

  const handleClickOptionTypes = type => e => {
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
    return <DomesticImportTradeData years={YEARS} months={MONTHS} />;
  } else if (router.query.optionTypes === "EXPORT") {
    return <DomesticExportTradeData years={YEARS} months={MONTHS} />;
  } else if (router.query.optionTypes === "LOG") {
    return <DomesticImportFileLog type={"DOMESTIC"} />;
  } else if (router.query.optionTypes === "MISSING") {
    return <DomesticTradeDataMissing />;
  } else {
    return (
      <div>
        <FormModal
          title={`${!formData._id ? "New" : "Edit"} Domestic Trade`}
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
                await createTradeDataDomestic({
                  variables: {
                    year: parseInt(year),
                    ...formData,
                  },
                });
                await refetch();
                await fetchData()
              } else {
                await updateTradeDataDomestic({
                  variables: {
                    year: parseInt(year),
                    ...formData,
                  },
                });
                await refetch();
                await fetchData()
              }
              notification.addNotification({
                title: "Succeess!",
                message: `Domestic Trade saved!`,
                level: "success",
              });
              setModalVisible(false);
            } catch (e) {
              notification.handleError(e);
            }
            hideLoadingSpinner();
          }}>
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
              <option value="Re-Export">Re-Export</option>
            </select>
          </div>
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
            <label>Quantity (Tonne)</label>
            <NumberFormat
              className="form-control"
              value={formData.quantity || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  quantity: e.floatValue,
                });
              }}
            />
          </div>
          <div className="form-group">
            <label>Value</label>
            <NumberFormat
              className="form-control"
              value={formData.value || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  value: e.floatValue,
                });
              }}
            />
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
          {/* <div className="form-group">
            <label>Attachment File</label>
            <input
              type="file"
              accept="*"
              className="form-control"
              required
              // value={documentData.url}
              onChange={e => {
                if (e) e.preventDefault;
                const file = e.target.files[0];

                let reader = new FileReader();
                reader.onloadend = async () => {
                  setFormData({
                    ...formData,
                    attachmentFileUrl: reader.result,
                  });
                };
                reader.readAsDataURL(file);
              }}
            />
          </div> */}
        </FormModal>

        <div className="flex">
          {currentUserDontHavePrivilege([
            "Domestic Trade Import File:Create",
          ]) ? null : (
            <button
              className="bg-mantis-700 mr-2 shadow-md rounded-md px-4 py-2"
              onClick={handleClickOptionTypes("IMPORT")}>
              <p className="text-white font-bold text-md">
                <i className="fa fa-upload" /> Import File
              </p>
            </button>
          )}

          {currentUserDontHavePrivilege([
            "Domestic Trade Export File:Create",
          ]) ? null : (
            <button
              className="bg-medium-red-violet-700 mr-2 shadow-md rounded-md px-4 py-2"
              onClick={handleClickOptionTypes("EXPORT")}>
              <p className="text-white font-bold text-md">
                <i className="fa fa-download" /> Export File
              </p>
            </button>
          )}

          {currentUserDontHavePrivilege([
            "Domestic Trade Log File:Read",
          ]) ? null : (
            <button
              className="bg-cyan-700 mr-2 shadow-md rounded-md px-4 py-2"
              onClick={handleClickOptionTypes("LOG")}>
              <p className="text-white font-bold text-md">
                <i className="fa fa-history" /> Log File
              </p>
            </button>
          )}

          {currentUserDontHavePrivilege([
            "Domestic Trade Missing Data:Create",
          ]) ? null : (
            <button
              className="bg-yellow-500 mr-2 shadow-md rounded-md px-4 py-2"
              onClick={handleClickOptionTypes("MISSING")}>
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
                type="Domestic Trade Data"
                defaultValue={dayjs().format("YYYY")}
                options={YEARS}
                onSelect={(year, years) => {
                  setYear(year);
                  setYears(years);
                }}
                exportConfig={{
                  title: "Trade Data - Domestic Trade",
                  collectionName: "DomesticTradeDatas",
                  filters: {
                    year: [...years].map(year => parseInt(year)),
                  },
                  columns,
                }}
              />
            </div>
          }
          onAdd={
            currentUserDontHavePrivilege(["Domestic Trade:Create"])
              ? null
              : e => {
                if (e) e.preventDefault();
                setFormData({});
                setModalVisible(true);
              }
          }
          onRemove={
            currentUserDontHavePrivilege(["Domestic Trade:Delete"])
              ? null
              : async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} trade data ?`,
                  );
                  if (yes) {
                    for (const row of rows) {
                      await deleteTradeDataDomestic({
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
          data={allTradeDataDomestics}
          withoutHeader={true}
          customUtilities={
            currentUserDontHavePrivilege(["Domestic Trade:Update"])
              ? null
              : customUtilities
          }
          customUtilitiesPosition="left"
        />

        <div className="flex mt-4">
          <p className="text-md">Total Data: </p>
          <p className="text-md font-bold mx-4">
            {data?.countAllTradeDataDomestic || 0}
          </p>
        </div>
      </div>
    );
  }
};
export default withApollo({ ssr: true })(DomesticTradeData);
