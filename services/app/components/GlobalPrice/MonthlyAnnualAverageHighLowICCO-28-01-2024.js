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
import AdminArea from "../AdminArea";
import Table from "../Table";
import { FormModal } from "../Modal";
import NumberFormat from "react-number-format";
import { SingleSelect } from "../form/SingleSelect";
import dayjs from "dayjs";
import { MultiYearsFilterWithExport } from "../MultiYearsFilterWithExport";

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
  query listQueries($year: String, $years: [String!]) {
    allMonthlyAverageHighLowICCOPrices(year: $year, years: $years) {
      _id
      year
      month
      sourceName
      averageSDR
      highestSDR
      lowestSDR
      averageUSD
      highsetUSD
      lowestUSD

      Source {
        _id
      }
    }

    allSources {
      _id
      description
    }
  }
`;

const CREATE_ANNUAL_AVG_HILO_ICCO = gql`
  mutation createMonthlyAverageHighLowICCOPrice(
    $month: Int!
    $year: Int!
    $sourceId: String!
    $averageSDR: Float
    $highestSDR: Float
    $lowestSDR: Float
    $averageUSD: Float
    $highsetUSD: Float
    $lowestUSD: Float
  ) {
    createMonthlyAverageHighLowICCOPrice(
      month: $month
      year: $year
      sourceId: $sourceId
      averageSDR: $averageSDR
      highestSDR: $highestSDR
      lowestSDR: $lowestSDR
      averageUSD: $averageUSD
      highsetUSD: $highsetUSD
      lowestUSD: $lowestUSD
    )
  }
`;

const UPDATE_ANNUAL_AVG_HILO_ICCO = gql`
  mutation updateMonthlyAverageHighLowICCOPrice(
    $_id: String!
    $month: Int!
    $year: Int!
    $sourceId: String!
    $averageSDR: Float
    $highestSDR: Float
    $lowestSDR: Float
    $averageUSD: Float
    $highsetUSD: Float
    $lowestUSD: Float
  ) {
    updateMonthlyAverageHighLowICCOPrice(
      _id: $_id
      month: $month
      year: $year
      sourceId: $sourceId
      averageSDR: $averageSDR
      highestSDR: $highestSDR
      lowestSDR: $lowestSDR
      averageUSD: $averageUSD
      highsetUSD: $highsetUSD
      lowestUSD: $lowestUSD
    )
  }
`;
const DELETE_ANNUAL_AVG_HILO_ICCO = gql`
  mutation deleteMonthlyAverageHighLowICCOPrice($_id: String!) {
    deleteMonthlyAverageHighLowICCOPrice(_id: $_id)
  }
`;
const MonthlyAnnualAverageHighLowICCO = ({ currentUserDontHavePrivilege }) => {
  const notification = useNotification();

  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    year: router.query.year
      ? parseInt(router.query.year)
      : parseInt(dayjs().format("YYYY")),
  });
  const columns = useMemo(() => [
    {
      Header: "Year",
      accessor: "year",
      style: {
        fontSize: 20,
        width: 100,
      },
    },
    {
      Header: "Month",
      accessor: "month",
      style: {
        fontSize: 20,
        width: 100,
      },
    },
    {
      Header: "Source",
      accessor: "sourceName",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
    {
      Header: "Average (SDR per tonne a/)",
      accessor: "averageSDR",
      style: {
        fontSize: 20,
        width: 200,
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
      Header: "Highest (SDR per tonne a/)",
      accessor: "highestSDR",
      style: {
        fontSize: 20,
        width: 200,
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
      Header: "Lowest (SDR per tonne a/)",
      accessor: "lowestSDR",
      style: {
        fontSize: 20,
        width: 200,
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
      Header: "Average (USD per tonne a/)",
      accessor: "averageUSD",
      style: {
        fontSize: 20,
        width: 150,
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
      Header: "Highest (USD per tonne a/)",
      accessor: "highsetUSD",
      style: {
        fontSize: 20,
        width: 150,
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
      Header: "Lowest (USD per tonne a/)",
      accessor: "lowestUSD",
      style: {
        fontSize: 20,
        width: 150,
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

  // const year = String(router.query.year || dayjs().format("YYYY"));
  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1980;
    // console.log([...new Array(toYear - fromYear)])
    return [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });
  }, []);

  const [year, setYear] = useState(YEARS[0]);
  const [years, setYears] = useState([year]);

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      // regionId: formData.regionId || "",
      year,
      years,
    },
  });

  const [createMonthlyAverageHighLowICCOPrice] = useMutation(
    CREATE_ANNUAL_AVG_HILO_ICCO,
  );
  const [updateMonthlyAverageHighLowICCOPrice] = useMutation(
    UPDATE_ANNUAL_AVG_HILO_ICCO,
  );
  const [deleteMonthlyAverageHighLowICCOPrice] = useMutation(
    DELETE_ANNUAL_AVG_HILO_ICCO,
  );
  let allMonthlyAverageHighLowICCOPrices = [];

  if (data?.allMonthlyAverageHighLowICCOPrices) {
    allMonthlyAverageHighLowICCOPrices =
      data.allMonthlyAverageHighLowICCOPrices;
  }
  let allSources = [];
  if (data?.allSources) {
    allSources = data.allSources;
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
                // console.log(propsTable.row.original);
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  sourceId: propsTable.row.original.Source?._id || "",
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

  // console.log(allStates);
  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"
          } Montlhy & Annual Average High Low ICCO`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            year: router.query.year
              ? parseInt(router.query.year)
              : parseInt(dayjs().format("YYYY")),
          });
        }}
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { _id, __typename, _createdAt, _updatedAt } = formData;
            if (!_id) {
              console.log({ formData });
              await createMonthlyAverageHighLowICCOPrice({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateMonthlyAverageHighLowICCOPrice({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Monthly & Annual Average ICCO saved!`,
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
          <label>Month</label>
          <select
            className="form-control"
            value={formData?.month || dayjs().get("month") + 1}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                month: parseInt(e.target.value),
              });
            }}
            required>
            <option value="" disabled>
              Select Month
            </option>
            {MONTHS.map(m => (
              <option value={m.month}>{m.monthName}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Source*</label>

          <select
            className="form-control"
            value={formData.sourceId || ""}
            onChange={e => {
              if (e) e.preventDefault();

              setFormData({
                ...formData,
                sourceId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Source
            </option>
            {allSources.map(source => (
              <option value={source._id}>{source.description}</option>
            ))}
          </select>
        </div>

        <hr className="border border-gray-200 my-2" />
        <p className="text-md font-bold">DAILY PRICES (SDRs per tonne)/a</p>

        <div className="form-group">
          <label>Average</label>
          <NumberFormat
            className="form-control"
            value={formData.averageSDR || 0}
            thousandSeparator={","}
            fixedDecimalScale={true}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                averageSDR: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Highest</label>
          <NumberFormat
            className="form-control"
            value={formData.highestSDR || 0}
            thousandSeparator={","}
            fixedDecimalScale={true}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                highestSDR: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Lowest</label>
          <NumberFormat
            className="form-control"
            value={formData.lowestSDR || 0}
            thousandSeparator={","}
            fixedDecimalScale={true}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                lowestSDR: e.floatValue,
              });
            }}
          />
        </div>

        <hr className="border border-gray-200 my-2" />
        <p className="text-md font-bold">
          DAILY PRICES (US Dollars per tonne)/a
        </p>

        <div className="form-group">
          <label>Average</label>
          <NumberFormat
            className="form-control"
            value={formData.averageUSD || 0}
            thousandSeparator={","}
            fixedDecimalScale={true}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                averageUSD: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Highest</label>
          <NumberFormat
            className="form-control"
            value={formData.highestUSD || 0}
            thousandSeparator={","}
            fixedDecimalScale={true}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                highestUSD: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Lowest</label>
          <NumberFormat
            className="form-control"
            value={formData.lowestUSD || 0}
            thousandSeparator={","}
            fixedDecimalScale={true}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                lowestUSD: e.floatValue,
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
                title: "Monthly & Annual Average High Low ICCO",
                collectionName: "MonthlyAverageHighLowICCO",
                filters: {
                  year: [...years].map(year => parseInt(year)),
                },
                columns,
              }}
            />
          </div>
        }
        loading={false}
        columns={columns}
        data={allMonthlyAverageHighLowICCOPrices}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege([
            "Global Price ICCO Buletin Monthly Average High Low:Create",
          ])
            ? null
            : e => {
              if (e) e.preventDefault();
              setModalVisible(true);
              setFormData({
                year: router.query.year
                  ? parseInt(router.query.year)
                  : parseInt(dayjs().format("YYYY")),
                month: dayjs().get("month") + 1,
              });
            }
        }
        onRemove={
          currentUserDontHavePrivilege([
            "Global Price ICCO Buletin Monthly Average High Low:Delete",
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
                    await deleteMonthlyAverageHighLowICCOPrice({
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
            "Global Price ICCO Buletin Monthly Average High Low:Update",
          ])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />
    </div>
  );
};
export default withApollo({ ssr: true })(MonthlyAnnualAverageHighLowICCO);
