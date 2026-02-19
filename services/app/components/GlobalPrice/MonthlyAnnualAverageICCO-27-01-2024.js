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
    allMonthlyAnnualAverageICCO(year: $year, years: $years) {
      _id
      year
      month
      sourceName
      sdrTonne
      usdCent

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

const CREATE_ANNUAL_AVG_ICCO = gql`
  mutation createMonthlyAverageAnnualICCOPrice(
    $month: Int!
    $year: Int!
    $sourceId: String!
    $sdrTonne: Float
    $usdCent: Float
  ) {
    createMonthlyAverageAnnualICCOPrice(
      month: $month
      year: $year
      sourceId: $sourceId
      sdrTonne: $sdrTonne
      usdCent: $usdCent
    )
  }
`;

const UPDATE_ANNUAL_AVG_ICCO = gql`
  mutation updateMonthlyAverageAnnualICCOPrice(
    $_id: String!
    $month: Int!
    $year: Int!
    $sourceId: String!
    $sdrTonne: Float
    $usdCent: Float
  ) {
    updateMonthlyAverageAnnualICCOPrice(
      _id: $_id
      month: $month
      year: $year
      sourceId: $sourceId
      sdrTonne: $sdrTonne
      usdCent: $usdCent
    )
  }
`;
const DELETE_ANNUAL_AVG_ICCO = gql`
  mutation deleteMonthlyAverageAnnualICCOPrice($_id: String!) {
    deleteMonthlyAverageAnnualICCOPrice(_id: $_id)
  }
`;
const MonthlyAnnualAverageICCO = ({ currentUserDontHavePrivilege }) => {
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
      Header: "SDRs/Tonne b/",
      accessor: "sdrTonne",
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
      Header: "USD Cents /lb a/",
      accessor: "usdCent",
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

  const [createMonthlyAverageAnnualICCOPrice] = useMutation(
    CREATE_ANNUAL_AVG_ICCO,
  );
  const [updateMonthlyAverageAnnualICCOPrice] = useMutation(
    UPDATE_ANNUAL_AVG_ICCO,
  );
  const [deleteMonthlyAverageAnnualICCOPrice] = useMutation(
    DELETE_ANNUAL_AVG_ICCO,
  );
  let allMonthlyAnnualAverageICCO = [];

  if (data?.allMonthlyAnnualAverageICCO) {
    allMonthlyAnnualAverageICCO = data.allMonthlyAnnualAverageICCO;
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
        title={`${
          !formData._id ? "New" : "Edit"
        } Montlhy & Annual Average ICCO`}
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
              await createMonthlyAverageAnnualICCOPrice({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateMonthlyAverageAnnualICCOPrice({
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
        <div className="form-group">
          <label>USD Cents/lb a/</label>
          <NumberFormat
            className="form-control"
            value={formData.usdCent || 0}
            thousandSeparator={","}
            fixedDecimalScale={true}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                usdCent: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>SDRs/Tonne b/</label>
          <NumberFormat
            className="form-control"
            value={formData.sdrTonne || 0}
            thousandSeparator={","}
            fixedDecimalScale={true}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                sdrTonne: e.floatValue,
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
                title: "Monthly & Annual Average ICCO",
                collectionName: "MonthlyAnnualAverageICCOPrices",
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
        data={allMonthlyAnnualAverageICCO}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege([
            "Global Price ICCO Buletin Monthly Annual Average:Create",
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
            "Global Price ICCO Buletin Monthly Annual Average:Delete",
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
                      await deleteMonthlyAverageAnnualICCOPrice({
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
            "Global Price ICCO Buletin Monthly Annual Average:Update",
          ])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />
    </div>
  );
};
export default withApollo({ ssr: true })(MonthlyAnnualAverageICCO);
