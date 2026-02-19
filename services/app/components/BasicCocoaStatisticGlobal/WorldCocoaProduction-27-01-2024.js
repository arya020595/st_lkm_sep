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
    allGlobalWorldCocoaProductions(year: $year, years: $years) {
      _id
      year
      grossCorp
      grindings
      surplus
      deficit
      totalEndOfSeasonStocks
      iccoBufferStocks
      freeStocks
      totalStocks
      usdAnnualAve
      sdrAnnualAve
    }
    countGlobalWorldCocoaProductions
  }
`;

const CREATE_BCS_GLOBAL_WORLD_PRODUCTION = gql`
  mutation createGlobalWorldCocoaProduction(
    $year: String
    $grossCorp: Float
    $grindings: Float
    $surplus: Float
    $deficit: Float
    $totalEndOfSeasonStocks: Float
    $iccoBufferStocks: Float
    $freeStocks: Float
    $totalStocks: Float
    $usdAnnualAve: Float
    $sdrAnnualAve: Float
  ) {
    createGlobalWorldCocoaProduction(
      year: $year
      grossCorp: $grossCorp
      grindings: $grindings
      surplus: $surplus
      deficit: $deficit
      totalEndOfSeasonStocks: $totalEndOfSeasonStocks
      iccoBufferStocks: $iccoBufferStocks
      freeStocks: $freeStocks
      totalStocks: $totalStocks
      usdAnnualAve: $usdAnnualAve
      sdrAnnualAve: $sdrAnnualAve
    )
  }
`;

const UPDATE_BCS_GLOBAL_WORLD_PRODUCTION = gql`
  mutation updateGlobalWorldCocoaProduction(
    $_id: String!
    $year: String
    $grossCorp: Float
    $grindings: Float
    $surplus: Float
    $deficit: Float
    $totalEndOfSeasonStocks: Float
    $iccoBufferStocks: Float
    $freeStocks: Float
    $totalStocks: Float
    $usdAnnualAve: Float
    $sdrAnnualAve: Float
  ) {
    updateGlobalWorldCocoaProduction(
      _id: $_id
      year: $year
      grossCorp: $grossCorp
      grindings: $grindings
      surplus: $surplus
      deficit: $deficit
      totalEndOfSeasonStocks: $totalEndOfSeasonStocks
      iccoBufferStocks: $iccoBufferStocks
      freeStocks: $freeStocks
      totalStocks: $totalStocks
      usdAnnualAve: $usdAnnualAve
      sdrAnnualAve: $sdrAnnualAve
    )
  }
`;
const DELETE_BCS_GLOBAL_WORLD_PRODUCTION = gql`
  mutation deleteGlobalWorldCocoaProduction($_id: String!) {
    deleteGlobalWorldCocoaProduction(_id: $_id)
  }
`;
const WorldCocoaProduction = ({ currentUserDontHavePrivilege }) => {
  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1959;
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

  const columns = useMemo(() => [
    {
      Header: "Year",
      accessor: "year",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Gross Corp",
      accessor: "grossCorp",
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
      Header: "Grindings",
      accessor: "grindings",
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
      Header: "Surplus (%)",
      accessor: "surplus",
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
      Header: "Deficit (%)",
      accessor: "deficit",
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
      Header: "Total End Of Stocks",
      accessor: "totalEndOfSeasonStocks",
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
      Header: "ICCO Buffer Stock",
      accessor: "iccoBufferStocks",
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
      Header: "Free Stocks (%)",
      accessor: "freeStocks",
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
      Header: "Total Stocks (%)",
      accessor: "totalStocks",
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
      Header: "Annual Ave (US dollars/tonne)",
      accessor: "usdAnnualAve",
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
      Header: "Annual Ave (SDRs/tonne)",
      accessor: "sdrAnnualAve",
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
  const [createGlobalWorldCocoaProduction] = useMutation(
    CREATE_BCS_GLOBAL_WORLD_PRODUCTION,
  );
  const [updateGlobalWorldCocoaProduction] = useMutation(
    UPDATE_BCS_GLOBAL_WORLD_PRODUCTION,
  );
  const [deleteGlobalWorldCocoaProduction] = useMutation(
    DELETE_BCS_GLOBAL_WORLD_PRODUCTION,
  );
  let allGlobalWorldCocoaProductions = [];

  if (data?.allGlobalWorldCocoaProductions) {
    allGlobalWorldCocoaProductions = data.allGlobalWorldCocoaProductions;
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

  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} BCS World Production`}
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
              await createGlobalWorldCocoaProduction({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateGlobalWorldCocoaProduction({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `BCS World Production saved!`,
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
          <label>Gross Corp</label>
          <NumberFormat
            className="form-control"
            value={formData.grossCorp || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                grossCorp: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Grindings</label>
          <NumberFormat
            className="form-control"
            value={formData.grindings || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                grindings: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Surplus</label>
          <NumberFormat
            className="form-control"
            value={formData.surplus || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                surplus: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Deficit</label>
          <NumberFormat
            className="form-control"
            value={formData.deficit || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                deficit: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Total End Of Season Stocks</label>
          <NumberFormat
            className="form-control"
            value={formData.totalEndOfSeasonStocks || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                totalEndOfSeasonStocks: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>ICCO Buffer Stocks</label>
          <NumberFormat
            className="form-control"
            value={formData.iccoBufferStocks || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                iccoBufferStocks: e.floatValue,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Free Stocks (%)</label>
          <NumberFormat
            className="form-control"
            value={formData.freeStocks || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                freeStocks: e.floatValue,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Total Stocks (%)</label>
          <NumberFormat
            className="form-control"
            value={formData.totalStocks || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                totalStocks: e.floatValue,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Annual Ave (US dollars/tonne)</label>
          <NumberFormat
            className="form-control"
            value={formData.usdAnnualAve || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                usdAnnualAve: e.floatValue,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Annual Ave (SDRs/tonne)</label>
          <NumberFormat
            className="form-control"
            value={formData.sdrAnnualAve || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                sdrAnnualAve: e.floatValue,
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
                title: "BCS Global - World Cocoa Production",
                collectionName: "GlobalWorldCocoaProductions",
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
        data={allGlobalWorldCocoaProductions}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege([
            "BCS Global World Cocoa Production:Create",
          ])
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
          currentUserDontHavePrivilege([
            "BCS Global World Cocoa Production:Delete",
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
                      await deleteGlobalWorldCocoaProduction({
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
            "BCS Global World Cocoa Production:Update",
          ])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />

      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">
          {data?.countGlobalWorldCocoaProductions || 0}
        </p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(WorldCocoaProduction);
