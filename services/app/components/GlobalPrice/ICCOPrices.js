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
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import NumberFormat from "react-number-format";
import dayjs from "dayjs";
import Calendar from "react-calendar";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const LIST_QUERIES = gql`
  query listQueries {
    countDailyGlobalICCOPrices
  }
`;

const QUERY_ICCO_PRICE = gql`
query queryICCOPrice($date: String!){
  allDailyGlobalICCOPricesTokenized(date: $date)
  countDailyGlobalICCOPrices
} 
`

const ICCO_PRICE_PER_DATE = gql`
  query listQueriesPerDate($date: String!) {
    dailyGlobalICCOPricesByDateTokenized(date: $date)
  }
`;

const CREATE_DAILY_ICCO_PRICE = gql`
  mutation createDailyGlobalICCOPriceTokenized(
    $tokenized: String!
  ) {
    createDailyGlobalICCOPriceTokenized(
      tokenized: $tokenized
    )
  }
`;

const UPDATE_DAILY_ICCO_PRICE = gql`
  mutation updateDailyGlobalICCOPriceTokenized(
    $tokenized: String!
  ) {
    updateDailyGlobalICCOPriceTokenized(
      tokenized: $tokenized
    )
  }
`;

const DELETE_DAILY_ICCO_PRICE = gql`
  mutation deleteDailyGlobalICCOPriceTokenized($tokenized: String!) {
    deleteDailyGlobalICCOPriceTokenized(tokenized: $tokenized)
  }
`;

const ICCOPrice = ({ currentUserDontHavePrivilege }) => {
  const notification = useNotification();
  const router = useRouter();
  const client = useApolloClient();
  const date = router.query.date || dayjs().format("YYYY-MM-DD");
  const [selectedActiveDate, setSelectedActiveDate] = useState("");

  const [formData, setFormData] = useState({
    date: dayjs().format("YYYY-MM-DD"),
  });
  const [modalVisible, setModalVisible] = useState(false);

  const { data, loading, error, refetch } = useQuery(LIST_QUERIES, {
  });

  const {
    data: iccoData,
    loading: iccoLoading,
    error: iccoError,
    refetch: iccoRefetch,
  } = useQuery(ICCO_PRICE_PER_DATE, {
    variables: {
      date,
    },
  });

  const [createDailyGlobalICCOPrice] = useMutation(CREATE_DAILY_ICCO_PRICE);
  const [updateDailyGlobalICCOPrice] = useMutation(UPDATE_DAILY_ICCO_PRICE);
  const [deleteDailyGlobalICCOPrice] = useMutation(DELETE_DAILY_ICCO_PRICE);
  let [savedCount, setSavedCount] = useState(0)
  let [allDailyGlobalICCOPrices, setAllDailyGlobalICCOPrices] = useState([])
  let [countDailyGlobalICCOPrices, setCountDailyGlobalICCOPrices] = useState(0)
  let [dailyGlobalICCOPricesByDate, setDailyGlobalICCOPricesByDate] = useState([])

  const fetchDataICCOPrice = async (date) => {
    const result = await client.query({
      query: QUERY_ICCO_PRICE,
      variables: {
        date,
      },
      fetchPolicy: "no-cache",
    });
    const encryptICCOPrice = result.data?.allDailyGlobalICCOPricesTokenized
    if (encryptICCOPrice) {
      let ICCOPrice = []
      const decrypted = jwt.verify(encryptICCOPrice, TOKENIZE);
      ICCOPrice = decrypted.results
      setAllDailyGlobalICCOPrices(ICCOPrice)
    }
    setCountDailyGlobalICCOPrices(result.data?.countDailyGlobalICCOPrices)
  }
  useEffect(() => {
    fetchDataICCOPrice(date)
  }, [date, savedCount]);

  const fetchDataICOOPricePerDate = async (date) => {
    const result = await client.query({
      query: ICCO_PRICE_PER_DATE,
      variables: {
        date,
      },
      fetchPolicy: "no-cache",
    });
    const encryptICCOPrice = result.data?.dailyGlobalICCOPricesByDateTokenized
    if (encryptICCOPrice) {
      let ICCOPrice = []
      const decrypted = jwt.verify(encryptICCOPrice, TOKENIZE);
      ICCOPrice = decrypted.results
      setDailyGlobalICCOPricesByDate(ICCOPrice)
    }
  }
  useEffect(() => {
    fetchDataICOOPricePerDate(date)
  }, [date, savedCount]);

  // let allDailyGlobalICCOPrices = [];
  // if (data?.allDailyGlobalICCOPrices) {
  //   allDailyGlobalICCOPrices = data.allDailyGlobalICCOPrices;
  // }

  // let dailyGlobalICCOPricesByDate = [];
  // if (iccoData?.dailyGlobalICCOPricesByDate) {
  //   dailyGlobalICCOPricesByDate = iccoData.dailyGlobalICCOPricesByDate;
  // }

  // console.log("allDailyGlobalICCOPrices", allDailyGlobalICCOPrices.length);
  const dailyICCOPriceColumns = useMemo(() => [
    {
      Header: "Date",
      accessor: "date",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Currency",
      accessor: "currency",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Exchange Rate",
      accessor: "exchangeRate",
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
      Header: "Price (RM)",
      accessor: "price",
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

  const handleViewChangeCalendar = (activeStartDate, value, view) => {
    const date = dayjs(activeStartDate).format("YYYY-MM-DD");
    router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          date: dayjs(date).format("YYYY-MM-DD"),
        },
      },
      "",
      { scroll: false },
    );
  };

  const handleSelectDate = date => {
    setSelectedActiveDate(dayjs(date).format("YYYY-MM-DD"));
    router.replace(
      {
        pathname: router.pathname,
        query: {
          ...router.query,
          date: dayjs(date).format("YYYY-MM-DD"),
        },
      },
      "",
      { scroll: false },
    );
  };

  const getAllPrice = (activeStartDate, date, view) => {
    // const getYear = dayjs(date).get("year");
    // const getMonth = dayjs(date).get("month") + 1;
    // const getDate = dayjs(date).get("date");

    const calendarDate = dayjs(date).format("YYYY-MM-DD");
    const currentDate = dayjs().format("YYYY-MM-DD");

    if (currentDate === dayjs(date).format("YYYY-MM-DD")) {
      return (
        <div
          className={`flex justify-center items-center absolute w-8 h-8 border-4 border-yellow-500`}
          style={{
            left: "50%",
            top: "50%",
            borderRadius: "100%",
            transform: "translate(-50%,-50%)",
            backgroundColor: "#fff",
          }}>
          <span>{dayjs(date).format("DD")}</span>
        </div>
      );
    }

    if (dayjs(date).format("YYYY-MM-DD") === selectedActiveDate) {
      return (
        <div
          className={`flex justify-center items-center absolute w-8 h-8 border-4 border-black`}
          style={{
            left: "50%",
            top: "50%",
            borderRadius: "100%",
            transform: "translate(-50%,-50%)",
            backgroundColor: "#fff",
          }}>
          <span>{dayjs(date).format("DD")}</span>
        </div>
      );
    }

    if (allDailyGlobalICCOPrices.length > 0) {
      const foundPrice = allDailyGlobalICCOPrices.filter(
        price => price.date === calendarDate,
      );

      if (foundPrice.length > 0) {
        return (
          <div
            className={`flex justify-center items-center absolute w-8 h-8 border-4 border-red-500`}
            style={{
              left: "50%",
              top: "50%",
              borderRadius: "100%",
              transform: "translate(-50%,-50%)",
              backgroundColor: "#fff",
            }}>
            <span>{dayjs(date).format("DD")}</span>
          </div>
        );
      }
    }
  };

  return (
    <div className="mt-10">
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Global ICCO Price`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            date: dayjs().format("YYYY-MM-DD"),
          });
        }}
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { _id, __typename, _createdAt, _updatedAt } = formData;
            if (!_id) {
              const payload = {
                ...formData
              }
              let tokenized = jwt.sign(payload, TOKENIZE);
              await createDailyGlobalICCOPrice({
                variables: {
                  tokenized
                },
              });
              setSavedCount(savedCount += 1)
            } else {
              const payload = {
                ...formData
              }
              let tokenized = jwt.sign(payload, TOKENIZE);
              await updateDailyGlobalICCOPrice({
                variables: {
                  tokenized
                },
              });
              setSavedCount(savedCount += 1)
            }
            await refetch();
            await iccoRefetch();

            notification.addNotification({
              title: "Succeess!",
              message: `Daily ICCO Price saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Date*</label>
          <input
            className="form-control"
            type="date"
            value={formData.date || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                date: e.target.value,
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>Currency*</label>
          <select
            className="form-control"
            value={formData.currency || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                currency: e.target.value,
              });
            }}
            required>
            <option value="" disabled>
              Select Currency
            </option>
            <option value="SDR">SDR</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div className="form-group">
          <label>Exchange Rate*</label>
          <NumberFormat
            className="form-control"
            value={formData.exchangeRate || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            decimalScale={4}
            onValueChange={e => {
              // if (e) e.preventDefault();

              setFormData({
                ...formData,
                exchangeRate: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Price</label>
          <NumberFormat
            className="form-control"
            value={formData.price || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                price: e.floatValue,
              });
            }}
          />
        </div>
      </FormModal>
      <Calendar
        calendarType="US"
        className="!w-full rounded-md shadow-lg py-4 mb-4 border-2 border-mantis-500"
        activeStartDate={new Date(date)}
        formatDay={(locale, date) => dayjs(date).format("DD")}
        onChange={e => {
          handleSelectDate(e);
          // setCalendarVisible(false);
        }}
        tileClassName={
          ({ activeStartDate, date, view }) => {
            return "relative";
          }
          // getAgendaAll(activeStartDate, date, view)
        }
        onActiveStartDateChange={({ activeStartDate, value, view }) => {
          handleViewChangeCalendar(activeStartDate, value, view);
        }}
        tileContent={({ activeStartDate, date, view }) => {
          return getAllPrice(activeStartDate, date, view);
        }}
      />

      <Table
        loading={iccoLoading}
        columns={dailyICCOPriceColumns}
        data={dailyGlobalICCOPricesByDate}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege(["Global Price ICCO Price:Create"])
            ? null
            : e => {
              if (e) e.preventDefault();
              setModalVisible(true);
              setFormData({
                date: router.query.date || dayjs().format("YYYY-MM-DD"),
              });
            }
        }
        onRemove={
          currentUserDontHavePrivilege(["Global Price ICCO Price:Delete"])
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
                    }
                    let tokenized = jwt.sign(payload, TOKENIZE);
                    await deleteDailyGlobalICCOPrice({
                      variables: {
                        tokenized
                      },
                    });
                  }
                  setSavedCount(savedCount += 1)
                  notification.addNotification({
                    title: "Success!",
                    message: `${rows.length} data deleted`,
                    level: "success",
                  });
                }
                await iccoRefetch();
                await refetch();
              } catch (err) {
                handleError(err);
              }
              hideLoadingSpinner();
            }
        }
        customUtilities={
          currentUserDontHavePrivilege(["Global Price ICCO Price:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />
      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">
          {countDailyGlobalICCOPrices || 0}
        </p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(ICCOPrice);
