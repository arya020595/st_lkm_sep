import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../../components/App";
import Table from "../../components/Table";
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
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";
import NumberFormat from "react-number-format";
import { MonthAndYearsFilterWithExport } from "../../components/MonthAndYearsFilterWithExport";

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
  query allEntrepreneurProductionAndSaleses($yearMonth: String!) {
    allEntrepreneurProductionAndSaleses(yearMonth: $yearMonth) {
      _id

      stateId
      stateName
      entrepreneurId
      entrepreneurName

      year
      month
      monthName

      covertureMilk
      covertureWhite
      covertureDark
      covertureTotal

      compoundMilk
      compoundWhite
      compoundDark
      compoundTotal

      totalProduction
      totalSales

      Entrepreneur {
        _id
        name
        idCard
        state
      }
    }
    allLocalState {
      _id
      code
      description
    }
  }
`;

const ENTREPRENEUR_QUERY = gql`
  query allEntrepreneurs {
    allEntrepreneurs {
      _id
      name
      idCard
      state
    }
  }
`;

const CREATE_PRODUCTION_AND_SALES = gql`
  mutation createEntrepreneurProductionAndSales(
    $entrepreneurId: String
    $year: Int
    $stateId: String
    $month: Int
    $monthName: String
    $covertureMilk: Float
    $covertureWhite: Float
    $covertureDark: Float
    $covertureTotal: Float
    $compoundMilk: Float
    $compoundWhite: Float
    $compoundDark: Float
    $compoundTotal: Float
    $totalProduction: Float
    $totalSales: Float
  ) {
    createEntrepreneurProductionAndSales(
      entrepreneurId: $entrepreneurId
      year: $year
      stateId: $stateId

      month: $month
      monthName: $monthName

      covertureMilk: $covertureMilk
      covertureWhite: $covertureWhite
      covertureDark: $covertureDark
      covertureTotal: $covertureTotal

      compoundMilk: $compoundMilk
      compoundWhite: $compoundWhite
      compoundDark: $compoundDark
      compoundTotal: $compoundTotal

      totalProduction: $totalProduction
      totalSales: $totalSales
    )
  }
`;

const UPDATE_PRODUCTION_AND_SALES = gql`
  mutation updateEntrepreneurProductionAndSales(
    $_id: String!
    $entrepreneurId: String
    $stateId: String
    $year: Int
    $month: Int
    $monthName: String
    $covertureMilk: Float
    $covertureWhite: Float
    $covertureDark: Float
    $covertureTotal: Float
    $compoundMilk: Float
    $compoundWhite: Float
    $compoundDark: Float
    $compoundTotal: Float
    $totalProduction: Float
    $totalSales: Float
  ) {
    updateEntrepreneurProductionAndSales(
      _id: $_id
      entrepreneurId: $entrepreneurId
      year: $year
      stateId: $stateId
      month: $month
      monthName: $monthName

      covertureMilk: $covertureMilk
      covertureWhite: $covertureWhite
      covertureDark: $covertureDark
      covertureTotal: $covertureTotal

      compoundMilk: $compoundMilk
      compoundWhite: $compoundWhite
      compoundDark: $compoundDark
      compoundTotal: $compoundTotal

      totalProduction: $totalProduction
      totalSales: $totalSales
    )
  }
`;

const DELETE_PRODUCTION_AND_SALES = gql`
  mutation deleteEntrepreneurProductionAndSales($_id: String!) {
    deleteEntrepreneurProductionAndSales(_id: $_id)
  }
`;

const ProductionAndSales = () => {
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const router = useRouter();
  const notification = useNotification();
  const [formData, setFormData] = useState({
    year: parseInt(dayjs().format("YYYY")),
    month: parseInt(dayjs().get("month") + 1),
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedEntrepreneur, setSelectedEntrepreneur] = useState({});
  const [entrepreneurListModal, setEntrepreneurModalVisible] = useState(false);

  const [yearMonth, setYearMonth] = useState(
    router.query.yearMonth || dayjs().format("YYYY-MM"),
  );
  const { data, error, loading, refetch } = useQuery(QUERY, {
    variables: {
      yearMonth,
    },
  });
  const [createEntrepreneurProductionAndSales] = useMutation(
    CREATE_PRODUCTION_AND_SALES,
  );
  const [updateEntrepreneurProductionAndSales] = useMutation(
    UPDATE_PRODUCTION_AND_SALES,
  );
  const [deleteEntrepreneurProductionAndSales] = useMutation(
    DELETE_PRODUCTION_AND_SALES,
  );

  const {
    data: entrepreneurData,
    error: entrepreneurError,
    loading: entrepreneurLoading,
    refetch: entrepreneurRefetch,
  } = useQuery(ENTREPRENEUR_QUERY, {
    variables: {},
  });

  let allEntrepreneurProductionAndSaleses = [];
  if (data?.allEntrepreneurProductionAndSaleses) {
    allEntrepreneurProductionAndSaleses =
      data.allEntrepreneurProductionAndSaleses;
  }

  let allLocalState = [];
  if (data?.allLocalState) {
    allLocalState = data.allLocalState;
    allLocalState = allLocalState.map(state => {
      return {
        ...state,
        description: state.description.toUpperCase().trim(),
      };
    });
  }

  let allEntrepreneurs = [];
  if (entrepreneurData?.allEntrepreneurs) {
    allEntrepreneurs = entrepreneurData.allEntrepreneurs;
  }

  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1940;
    // console.log([...new Array(toYear - fromYear)])
    return [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });
  }, []);

  useEffect(() => {
    const res = autoCalculate();
    setFormData({
      ...formData,
      covertureTotal: res.covertureTotal,
      compoundTotal: res.compoundTotal,
      totalProduction: res.covertureTotal + res.compoundTotal,
    });
  }, [
    formData.covertureMilk,
    formData.covertureDark,
    formData.covertureWhite,

    formData.compoundMilk,
    formData.compoundDark,
    formData.compoundWhite,
  ]);
  const columns = useMemo(() => [
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
      Header: "Entrepreneur",
      accessor: "entrepreneurName",
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
      Header: "Coverture Milk",
      accessor: "covertureMilk",
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
      Header: "Coverture White",
      accessor: "covertureWhite",
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
      Header: "Coverture Dark",
      accessor: "covertureDark",
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
      Header: "Coverture Total",
      accessor: "covertureTotal",
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
      Header: "Compound Milk",
      accessor: "compoundMilk",
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
      Header: "Compound White",
      accessor: "compoundWhite",
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
      Header: "Compound Dark",
      accessor: "compoundDark",
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
      Header: "Compound Total",
      accessor: "compoundTotal",
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
      Header: "Total Production",
      accessor: "totalProduction",
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
      Header: "Total Sales (RM)",
      accessor: "totalSales",
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

  const entrepreneurColumn = useMemo(() => [
    {
      Header: "ID Card",
      accessor: "idCard",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Name",
      accessor: "name",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "State",
      accessor: "state",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "",
      accessor: "_id",
      Cell: props => (
        <span>
          <button
            className="px-4 py-2 bg-orange-500 rounded-md shadow-md"
            onClick={handleSelectEntrepreneur(props.row.original)}>
            <p className="text-lg font-bold text-white">Select</p>
          </button>
        </span>
      ),
    },
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
                console.log(propsTable.row.original);
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                });
                setSelectedEntrepreneur(propsTable.row.original.Entrepreneur);
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

  const handleSelectEntrepreneur = entrepreneur => e => {
    if (e) e.preventDefault();

    const foundState = allLocalState.find(st =>
      st.description.includes(entrepreneur.state.toUpperCase().trim()),
    );

    const m = MONTHS.find(mt => mt.month === dayjs().get("month") + 1);
    setSelectedEntrepreneur(entrepreneur);
    setFormData({
      entrepreneurId: entrepreneur._id,
      year: parseInt(dayjs().format("YYYY")),
      month: dayjs().get("month") + 1,
      monthName: m.monthName,
      stateId: foundState?._id || "",
      covertureMilk: 0,
      covertureWhite: 0,
      covertureDark: 0,
      covertureTotal: 0,
      compoundMilk: 0,
      compoundWhite: 0,
      compoundDark: 0,
      compoundTotal: 0,
      totalProduction: 0,
      totalSales: 0,
    });
    setEntrepreneurModalVisible(false);
    setModalVisible(true);
  };
  const autoCalculate = e => {
    if (e) e.preventDefault();

    const covertureMilk = formData?.covertureMilk || 0;
    const covertureDark = formData?.covertureDark || 0;
    const covertureWhite = formData?.covertureWhite || 0;

    const compoundMilk = formData?.compoundMilk || 0;
    const compoundDark = formData?.compoundDark || 0;
    const compoundWhite = formData?.compoundWhite || 0;

    const covertureTotal = covertureMilk + covertureDark + covertureWhite;
    const compoundTotal = compoundWhite + compoundMilk + compoundDark;

    return {
      covertureTotal,
      compoundTotal,
    };
  };

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Production And Sales</title>
      </Head>
      <FormModal
        title={`Entrepreneur List`}
        visible={entrepreneurListModal}
        onClose={e => {
          if (e) e.preventDefault();
          setEntrepreneurModalVisible(false);
          setModalVisible(true);
        }}
        size="xl">
        <Table
          loading={entrepreneurLoading}
          columns={entrepreneurColumn}
          data={allEntrepreneurs}
          withoutHeader={true}
          // customUtilities={customUtilities}
        />
      </FormModal>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Production And Sales`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({});
          setSelectedEntrepreneur({});
        }}
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { _id, __typename, _createdAt, _updatedAt } = formData;
            if (!_id) {
              await createEntrepreneurProductionAndSales({
                variables: {
                  ...formData,
                  year: parseInt(formData.year),
                },
              });
            } else {
              await updateEntrepreneurProductionAndSales({
                variables: {
                  ...formData,
                  year: parseInt(formData.year),
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Local State saved!`,
              level: "success",
            });
            setModalVisible(false);
            setFormData({});
            setSelectedEntrepreneur({});
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <button
          className="px-4 py-2 rounded-md shadow-md bg-mantis-500"
          onClick={e => {
            if (e) e.preventDefault();
            setModalVisible(false);
            setEntrepreneurModalVisible(true);
          }}>
          <p className="text-md text-white font-bold">Select Entrepreneur</p>
        </button>

        {selectedEntrepreneur._id ? (
          <div className="mt-10">
            <div className="form-group">
              <label>
                <p className="text-lg">Entrepreneur</p>
              </label>
              <input
                className="form-control bg-gray-200"
                value={selectedEntrepreneur.name}
                disabled
              />
            </div>
            <div className="form-group">
              <label>
                <p className="text-lg">State</p>
              </label>
              <select
                className="form-control bg-gray-200"
                value={formData.stateId || ""}
                disabled>
                {allLocalState.map(state => (
                  <option value={state._id}>{state.description}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="form-group">
                  <label>
                    <p className="text-lg">Year</p>
                  </label>
                  <select
                    className="form-control "
                    value={formData.year}
                    onChange={e => {
                      if (e) e.preventDefault();
                      setFormData({
                        ...formData,
                        year: e.target.value,
                      });
                    }}>
                    {YEARS.map(y => (
                      <option value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <div className="form-group">
                  <label>
                    <p className="text-lg">Month</p>
                  </label>
                  <select
                    className="form-control"
                    value={formData.month}
                    onChange={e => {
                      if (e) e.preventDefault();
                      const m = MONTHS.find(
                        mt => mt.month === parseInt(e.target.value),
                      );
                      setFormData({
                        ...formData,
                        month: m.month,
                        monthName: m.monthName,
                      });
                    }}>
                    {MONTHS.map(m => (
                      <option value={m.month}>{m.monthName}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-2 border-gray-500 bg-gray-500" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="flex justify-center">
                  <p className="text-lg">Coverture (Kg)</p>
                </div>
                <div className="form-group">
                  <label>
                    <p className="text-lg">Milk</p>
                  </label>
                  <NumberFormat
                    className="form-control"
                    value={formData.covertureMilk || 0}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFormData({
                        ...formData,
                        covertureMilk: e.floatValue,
                      });

                      autoCalculate();
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <p className="text-lg">White</p>
                  </label>
                  <NumberFormat
                    className="form-control"
                    value={formData.covertureWhite || 0}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFormData({
                        ...formData,
                        covertureWhite: e.floatValue,
                      });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <p className="text-lg">Dark</p>
                  </label>
                  <NumberFormat
                    className="form-control"
                    value={formData.covertureDark || 0}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFormData({
                        ...formData,
                        covertureDark: e.floatValue,
                      });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <p className="text-lg">Total</p>
                  </label>
                  <NumberFormat
                    disabled={true}
                    className="form-control bg-gray-200"
                    value={formData.covertureTotal || 0}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFormData({
                        ...formData,
                        covertureTotal: e.floatValue,
                      });
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-center">
                  <p className="text-lg">Compound (Kg)</p>
                </div>
                <div className="form-group">
                  <label>
                    <p className="text-lg">Milk</p>
                  </label>
                  <NumberFormat
                    className="form-control"
                    value={formData.compoundMilk || 0}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFormData({
                        ...formData,
                        compoundMilk: e.floatValue,
                      });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <p className="text-lg">White</p>
                  </label>
                  <NumberFormat
                    className="form-control"
                    value={formData.compoundWhite || 0}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFormData({
                        ...formData,
                        compoundWhite: e.floatValue,
                      });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <p className="text-lg">Dark</p>
                  </label>
                  <NumberFormat
                    className="form-control"
                    value={formData.compoundDark || 0}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFormData({
                        ...formData,
                        compoundDark: e.floatValue,
                      });
                    }}
                  />
                </div>
                <div className="form-group">
                  <label>
                    <p className="text-lg">Total</p>
                  </label>
                  <NumberFormat
                    disabled={true}
                    className="form-control bg-gray-200"
                    value={formData.compoundTotal || 0}
                    thousandSeparator={","}
                    decimalSeparator={"."}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFormData({
                        ...formData,
                        compoundTotal: e.floatValue,
                      });
                    }}
                  />
                </div>
              </div>
            </div>
            <hr className="border-2 border-gray-500 bg-gray-500" />
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center">
                <p className="text-lg">Total Production (Kg)</p>
              </div>
              <div>
                <NumberFormat
                  disabled={true}
                  className="form-control bg-gray-200"
                  value={formData.totalProduction || 0}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  onValueChange={e => {
                    // if (e) e.preventDefault();
                    setFormData({
                      ...formData,
                      totalProduction: e.floatValue,
                    });
                  }}
                />
              </div>
              <div className="flex items-center">
                <p className="text-lg">Total Sales(RM)</p>
              </div>
              <div>
                <NumberFormat
                  className="form-control"
                  value={formData.totalSales || 0}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  fixedDecimalScale={true}
                  decimalScale={2}
                  onValueChange={e => {
                    // if (e) e.preventDefault();

                    setFormData({
                      ...formData,
                      totalSales: e.floatValue,
                    });
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}
      </FormModal>
      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <Table
            customHeaderUtilities={
              <div>
                <MonthAndYearsFilterWithExport
                  label="Month Year Filter"
                  defaultValue={dayjs().format("YYYY-MM")}
                  // options={YEARS}
                  onSelect={yearMonth => {
                    setYearMonth(yearMonth);
                  }}
                  exportConfig={{
                    title: "Entrepreneur - Production And Sales",
                    collectionName: "EntrepreneurProductionAndSaleses",
                    filters: {
                      yearMonth,
                    },
                    columns,
                  }}
                />
                {/* <div className="form-group">
                  <label>Month Filter</label>
                  <input
                    className="form-control border border-green-500"
                    type="month"
                    value={router.query.year}
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
                  />
                </div>
                <div className="flex items-end mx-2 py-2">
                  <button className="btn btn-orange btn-lg shadow-lg border-b-0">
                    Export Excel
                  </button>
                </div> */}
              </div>
            }
            loading={loading}
            columns={columns}
            data={allEntrepreneurProductionAndSaleses}
            withoutHeader={true}
            onAdd={
              currentUserDontHavePrivilege(["Production And Sales:Create"])
                ? null
                : e => {
                    if (e) e.preventDefault();
                    setModalVisible(true);
                    setFormData({});
                    setSelectedEntrepreneur({});
                  }
            }
            onRemove={
              currentUserDontHavePrivilege(["Production And Sales:Delete"])
                ? null
                : async ({ rows }) => {
                    showLoadingSpinner();
                    try {
                      let yes = confirm(
                        `Are you sure to delete ${rows.length} data ?`,
                      );
                      if (yes) {
                        for (const row of rows) {
                          await deleteEntrepreneurProductionAndSales({
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
                      notification.handleError(err);
                    }
                    hideLoadingSpinner();
                  }
            }
            customUtilities={
              currentUserDontHavePrivilege(["Production And Sales:Update"])
                ? null
                : customUtilities
            }
            customUtilitiesPosition="left"
          />
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(ProductionAndSales);
