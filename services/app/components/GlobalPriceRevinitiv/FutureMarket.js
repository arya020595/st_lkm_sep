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
import Calendar from "react-calendar";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const LIST_QUERIES = gql`
  query listQueries {
    allSourcesTokenized
    allInfoStatusesTokenized
  }
`;

const ALL_FUTURE_MARKET = gql`
  query allFutureMarketsTokenized($date: String!) {
    allFutureMarketsTokenized(date: $date)
    getLastUpdateFutureMarketReutersPricePushedToWBC(date: $date)
    getLastUpdateFutureMarketReutersPrice(date: $date)
    countDataFutureMarkets
  }
`;

const FUTURE_MARKET_BY_DATE = gql`
  query futureMarketByDateTokenized($date: String!) {
    futureMarketByDateTokenized(date: $date)
  }
`;

const CREATE_FUTURE_MARKET = gql`
  mutation createFutureMarketTokenized($tokenized: String!) {
    createFutureMarketTokenized(tokenized: $tokenized)
  }
`;

const UPDATE_FUTURE_MARKET = gql`
  mutation updateFutureMarketTokenized($tokenized: String!) {
    updateFutureMarketTokenized(tokenized: $tokenized)
  }
`;

const DELETE_FUTURE_MARKET = gql`
  mutation deleteFutureMarketTokenized($tokenized: String!) {
    deleteFutureMarketTokenized(tokenized: $tokenized)
  }
`;

const CHECK_DUPLICATE = gql`
  mutation checkDuplicateFutureMarket($year: Int!) {
    checkDuplicateFutureMarket(year: $year) {
      _id
      date
      label

      londonHigh
      londonLow
      londonAvg
      londonEx
      londonPrice

      nyHigh
      nyLow
      nyAvg
      nyEx
      nyPrice

      sgHigh
      sgLow
      sgAvg
      sgEx
      sgPrice

      iccoPoundsterling
      iccoUSD
      iccoEx
      iccoPrice

      different
    }
  }
`;

const RESEND_SCHEDULER_INTERNATIONAL = gql`
  mutation resendFutureMarket($date: String!) {
    resendFutureMarket(date: $date)
  }
`;
const FutureMarket = ({ currentUserDontHavePrivilege }) => {
  const notification = useNotification();
  const router = useRouter();
  const client = useApolloClient();
  const date = router.query.date || dayjs().format("YYYY-MM-DD");
  const [selectedActiveDate, setSelectedActiveDate] = useState("");
  const [foundDuplicate, setFounDuplicate] = useState([]);
  const [selectedDuplicateToDelete, setSelectedDuplicateToDelete] = useState(
    [],
  );
  const [futureMarketByDate, setFutureMarket] = useState({
    different: 0,
  });

  // const { data, loading, error, refetch } = useQuery(LIST_QUERIES, {
  //   variables: {
  //     date,
  //   },
  // });

  const [createFutureMarket] = useMutation(CREATE_FUTURE_MARKET);
  const [updateFutureMarket] = useMutation(UPDATE_FUTURE_MARKET);
  const [deleteFutureMarket] = useMutation(DELETE_FUTURE_MARKET);
  const [checkDuplicateFutureMarket] = useMutation(CHECK_DUPLICATE);
  const [resendFutureMarket] = useMutation(RESEND_SCHEDULER_INTERNATIONAL);
  let [
    getLastUpdateFutureMarketReutersPricePushedToWBC,
    setGetLastUpdateFutureMarketReutersPricePushedToWBC,
  ] = useState(0);
  let [
    getLastUpdateFutureMarketReutersPrice,
    setGetLastUpdateFutureMarketReutersPrice,
  ] = useState(0);
  let [allFutureMarkets, setAllFutureMarkets] = useState([]);
  let [allInfoStatuses, setAllInfoStatuses] = useState([]);
  let [allSources, setAllSources] = useState([]);
  let [savedCount, setSavedCount] = useState(0);
  let [countDataFutureMarkets, setCountDataFutureMarket] = useState(0);

  const fetchDataOnce = async () => {
    const result = await client.query({
      query: LIST_QUERIES,
      fetchPolicy: "no-cache",
    });
    const encryptSource = result.data?.allSourcesTokenized;
    if (encryptSource) {
      let Source = [];
      const decrypted = jwt.verify(encryptSource, TOKENIZE);
      Source = decrypted.results;
      setAllSources(Source);
    }
    const encryptInfoStatus = result.data?.allInfoStatusesTokenized;
    if (encryptInfoStatus) {
      let InfoStatus = [];
      const decrypted = jwt.verify(encryptInfoStatus, TOKENIZE);
      InfoStatus = decrypted.results;
      setAllInfoStatuses(InfoStatus);
    }
  }
  useEffect(() => {
    fetchDataOnce()
  }, []);


  const fetchDataFutureMarketByDate = async (date) => {
    const result = await client.query({
      query: FUTURE_MARKET_BY_DATE,
      variables: {
        date,
      },
      fetchPolicy: "no-cache",
    });
    let futureMarketByDate = [];
    const encryptFutureMarketByDate = result.data?.futureMarketByDateTokenized;
    if (encryptFutureMarketByDate) {
      const decrypted = jwt.verify(encryptFutureMarketByDate, TOKENIZE);
      futureMarketByDate = decrypted.queryResult;
    }
    if (futureMarketByDate) {
      setFutureMarket({
        ...futureMarketByDate,
        sourceId: futureMarketByDate.Source?._id || "",
        infoStatusId: futureMarketByDate.InfoStatus?._id || "",
      });
    } else {
      setFutureMarket({
        different: 0,
      });
    }
  }
  useEffect(() => {
    fetchDataFutureMarketByDate(date)
  }, [date, savedCount]);

  // useEffect hook to run side effects in function components
  useEffect(() => {
    // Function to be executed every second
    const intervalId = setInterval(() => {
      // Update the state using the previous state value

      let sgData = {
        avg: futureMarketByDate?.sgAvg || 0,
        exc: futureMarketByDate?.sgEx || 0,
      };
      setFutureMarket({
        ...futureMarketByDate,
        sgPrice: sgData.avg * futureMarketByDate.londonEx,
        iccoPrice: futureMarketByDate.nyEx * futureMarketByDate.iccoUSD,
      });
    }, 1000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(intervalId);
  }, [futureMarketByDate]); // The

  const duplicateColumn = useMemo(() => [
    {
      Header: "Date",
      accessor: "date",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "Label",
      accessor: "label",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "Ldn High",
      accessor: "londonHigh",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "Ldn Low",
      accessor: "londonLow",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "Ldn Avg",
      accessor: "londonAvg",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "Ldn Ex",
      accessor: "londonEx",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "Ldn Price",
      accessor: "londonPrice",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "NY High",
      accessor: "nyHigh",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "NY Low",
      accessor: "nyLow",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "NY Avg",
      accessor: "nyAvg",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "NY Ex",
      accessor: "nyEx",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "NY Price",
      accessor: "nyPrice",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "SG High",
      accessor: "sgHigh",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "SG Low",
      accessor: "sgLow",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "SG Avg",
      accessor: "sgAvg",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "SG Ex",
      accessor: "sgEx",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "SG Price",
      accessor: "sgPrice",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "ICCO Pound",
      accessor: "iccoPoundsterling",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "ICCO USD",
      accessor: "iccoUSD",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "ICCO Ex",
      accessor: "iccoEx",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
    {
      Header: "ICCO Price",
      accessor: "iccoPrice",
      style: {
        width: 100,
        fontSize: 16,
      },
    },
  ]);

  const fetchDataAllFutureMarket = async (date) => {
    const result = await client.query({
      query: ALL_FUTURE_MARKET,
      variables: {
        date: date,
      },
      fetchPolicy: "no-cache",
    });
    const encryptedAllFutureMarket =
      result.data?.allFutureMarketsTokenized || "";
    let allFutureMarkets = [];
    if (encryptedAllFutureMarket) {
      const decrypted = jwt.verify(encryptedAllFutureMarket, TOKENIZE);
      allFutureMarkets = decrypted.queryResult;
      setAllFutureMarkets(allFutureMarkets);
    }
    setGetLastUpdateFutureMarketReutersPrice(
      result.data?.getLastUpdateFutureMarketReutersPrice,
    );
    setGetLastUpdateFutureMarketReutersPricePushedToWBC(
      result.data?.setGetLastUpdateFutureMarketReutersPrice,
    );
    setCountDataFutureMarket(result.data?.countDataFutureMarkets);
  }
  useEffect(() => {
    showLoadingSpinner();
    fetchDataAllFutureMarket(date)
    hideLoadingSpinner();
  }, [date, savedCount]);

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

    if (allFutureMarkets.length > 0) {
      const foundPrice = allFutureMarkets.filter(
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

  const handleViewChangeCalendar = (activeStartDate, value, view) => {
    // console.log({ activeStartDate, value, view });
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

    setTimeout(() => {
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
    }, 10);
  };

  const handleSave = async e => {
    if (e) e.preventDefault();
    showLoadingSpinner();
    try {
      let { _id, __typename, _createdAt, _updatedAt } = futureMarketByDate;
      if (!_id) {
        const payload = {
          ...futureMarketByDate,
          date,
        };
        let tokenized = jwt.sign(payload, TOKENIZE);
        await createFutureMarket({
          variables: {
            tokenized,
          },
        });
        setSavedCount((savedCount += 1));
      } else {
        const payload = {
          ...futureMarketByDate,
        };
        let tokenized = jwt.sign(payload, TOKENIZE);
        await updateFutureMarket({
          variables: {
            tokenized,
          },
        });
        setSavedCount((savedCount += 1));
      }
      // await refetch();
      setSavedCount((savedCount += 1));
      notification.addNotification({
        title: "Succeess!",
        message: `Future Market saved!`,
        level: "success",
      });
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  const handleDelete = async e => {
    if (e) e.preventDefault();
    showLoadingSpinner();
    try {
      if (futureMarketByDate._id) {
        if (
          confirm(`Are you sure to clear future market price on this date ?`)
        ) {
          const payload = {
            _id: futureMarketByDate._id,
          };
          let tokenized = jwt.sign(payload, TOKENIZE);
          await deleteFutureMarket({
            variables: {
              tokenized,
            },
          });
          setSavedCount((savedCount += 1));
          setFutureMarket({
            different: 0,
          });
          notification.addNotification({
            title: "Succeess!",
            message: `Future Market cleared!`,
            level: "success",
          });

          // await refetch();
        }
      } else {
        throw {
          message: "No data yet on this date. Delete cannot perform",
        };
      }
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  const handleDeleteDuplicate = async e => {
    showLoadingSpinner();
    try {
      if (selectedDuplicateToDelete.length === 0) {
        throw {
          message: "No selected data",
        };
      }
      let yes = confirm(
        `Are you sure to delete ${selectedDuplicateToDelete.length} data?`,
      );
      if (yes) {
        for (const _id of selectedDuplicateToDelete) {
          await deleteFutureMarket({
            variables: {
              _id,
            },
          });
        }
        notification.addNotification({
          title: "Success!",
          message: `${selectedDuplicateToDelete.length} data deleted`,
          level: "success",
        });
      }

      const result = await checkDuplicateFutureMarket({
        variables: {
          year: dayjs(date).get("year"),
        },
      });
      setFounDuplicate(result.data.checkDuplicateFutureMarket);
    } catch (err) {
      notification.handleError(err);
    }

    hideLoadingSpinner();
  };

  return (
    <div className="mt-10">
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

      <div className="grid grid-cols-4 mb-4">
        <div>
          <p>Price On {dayjs(router.query.date).format("DD-MM-YYYY")}: </p>
        </div>

        <div>
          <p>
            Last Update on {dayjs(router.query.date).format("DD-MM-YYYY")}:{" "}
          </p>
          <p className="font-bold">
            {getLastUpdateFutureMarketReutersPrice || "-"}
          </p>
        </div>
        <div>
          <p>
            Last Pushed to MBC Web on{" "}
            {dayjs(router.query.date).format("DD-MM-YYYY")}:{" "}
          </p>
          <p className="font-bold">
            {getLastUpdateFutureMarketReutersPricePushedToWBC || "-"}
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <div className="w-3/4 border border-mantis-500 rounded-t-md">
          <div className="bg-mantis-500 rounded-t-md py-2">
            <p className="mx-4 text-lg text-white font-bold">
              {dayjs(date).format("dddd, DD MMMM YYYY")}
            </p>
          </div>

          <div className="bg-white px-10 mt-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="form-group">
                <label>
                  <p className="text-lg font-bold">Future Label</p>
                </label>
                <input
                  className="form-control"
                  value={futureMarketByDate.label || ""}
                  onChange={e => {
                    if (e) e.preventDefault();
                    setFutureMarket({
                      ...futureMarketByDate,
                      label: e.target.value,
                    });
                  }}
                />
              </div>

              <div className="form-group">
                <label>
                  <p className="text-lg font-bold">Source</p>
                </label>
                <select
                  className="form-control"
                  value={futureMarketByDate.sourceId || ""}
                  onChange={e => {
                    if (e) e.preventDefault();
                    setFutureMarket({
                      ...futureMarketByDate,
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
              {/* <div className="form-group">
                <label>
                  <p className="text-lg font-bold">Info Status</p>
                </label>
                <select
                  className="form-control"
                  value={futureMarketByDate.infoStatusId || ""}
                  onChange={e => {
                    if (e) e.preventDefault();
                    setFutureMarket({
                      ...futureMarketByDate,
                      infoStatusId: e.target.value,
                    });
                  }}>
                  <option value="" disabled>
                    Select Info Status
                  </option>
                  {allInfoStatuses.map(stats => (
                    <option value={stats._id}>{stats.description}</option>
                  ))}
                </select>
              </div> */}
            </div>

            <div className="border border-matrix-500 my-2 rounded-md px-4 py-4">
              <div className="grid grid-cols-5 gap-2 mb-2">
                <p className="text-lg font-bold">Prices</p>
                <p className="text-lg font-bold">London</p>
                <p className="text-lg font-bold">New York</p>
                <p className="text-lg font-bold">Spot Ghana</p>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-2">
                <div className="flex items-center">
                  <p className="text-lg font-bold">High</p>
                </div>

                <div>
                  <NumberFormat
                    className="form-control"
                    value={futureMarketByDate.londonHigh || 0}
                    thousandSeparator={","}
                    // fixedDecimalScale={true}
                    decimalSeparator={"."}
                    // decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFutureMarket({
                        ...futureMarketByDate,
                        londonHigh: e.floatValue,
                        sgHigh: e.floatValue + futureMarketByDate.different,
                      });
                    }}
                  />
                </div>
                <div>
                  <NumberFormat
                    className="form-control"
                    value={futureMarketByDate.nyHigh || 0}
                    thousandSeparator={","}
                    // fixedDecimalScale={true}
                    decimalSeparator={"."}
                    // decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFutureMarket({
                        ...futureMarketByDate,
                        nyHigh: e.floatValue,
                      });
                    }}
                  />
                </div>
                <div>
                  <NumberFormat
                    className="form-control bg-gray-200"
                    value={futureMarketByDate.sgHigh || 0}
                    thousandSeparator={","}
                    // fixedDecimalScale={true}
                    decimalSeparator={"."}
                    // decimalScale={2}
                    disabled
                  />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-2">
                <div className="flex items-center">
                  <p className="text-lg font-bold">Low</p>
                </div>

                <div>
                  <NumberFormat
                    className="form-control"
                    value={futureMarketByDate.londonLow || 0}
                    thousandSeparator={","}
                    // fixedDecimalScale={true}
                    decimalSeparator={"."}
                    // decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFutureMarket({
                        ...futureMarketByDate,
                        londonLow: e.floatValue,
                        sgLow: e.floatValue + futureMarketByDate.different,
                      });
                    }}
                  />
                </div>
                <div>
                  <NumberFormat
                    className="form-control"
                    value={futureMarketByDate.nyLow || 0}
                    thousandSeparator={","}
                    // fixedDecimalScale={true}
                    decimalSeparator={"."}
                    // decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFutureMarket({
                        ...futureMarketByDate,
                        nyLow: e.floatValue,
                      });
                    }}
                  />
                </div>
                <div>
                  <NumberFormat
                    className="form-control bg-gray-200"
                    value={futureMarketByDate.sgLow || 0}
                    thousandSeparator={","}
                    // fixedDecimalScale={true}
                    decimalSeparator={"."}
                    // decimalScale={2}
                    disabled
                  />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-2">
                <div className="flex items-center">
                  <p className="text-lg font-bold">Average</p>
                </div>

                <div>
                  <NumberFormat
                    className="form-control"
                    value={futureMarketByDate.londonAvg || 0}
                    thousandSeparator={","}
                    // fixedDecimalScale={true}
                    decimalSeparator={"."}
                    // decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      let londonPrice = 0;
                      // let sgPrice = 0;
                      // if (futureMarketByDate.londonEx) {
                      //   londonPrice =
                      //     e.floatValue * futureMarketByDate.londonEx;
                      // }
                      // if (futureMarketByDate.sgEx) {
                      //   sgPrice =
                      //     (e.floatValue + futureMarketByDate.different) *
                      //     futureMarketByDate.sgEx;
                      // }
                      setFutureMarket({
                        ...futureMarketByDate,
                        londonAvg: e.floatValue,
                        londonPrice,
                        sgAvg: e.floatValue + futureMarketByDate.different,
                        // sgPrice,
                      });
                    }}
                  />
                </div>
                <div>
                  <NumberFormat
                    className="form-control"
                    value={futureMarketByDate.nyAvg || 0}
                    thousandSeparator={","}
                    // fixedDecimalScale={true}
                    decimalSeparator={"."}
                    // decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      let nyPrice = 0;
                      if (futureMarketByDate.nyEx) {
                        nyPrice = e.floatValue * futureMarketByDate.nyEx;
                      }

                      setFutureMarket({
                        ...futureMarketByDate,
                        nyAvg: e.floatValue,
                        nyPrice,
                      });
                    }}
                  />
                </div>
                <div>
                  <NumberFormat
                    className="form-control bg-gray-200"
                    value={futureMarketByDate.sgAvg || 0}
                    thousandSeparator={","}
                    // fixedDecimalScale={true}
                    decimalSeparator={"."}
                    // decimalScale={2}
                    disabled
                  />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-2">
                <div className="flex items-center">
                  <p className="text-lg font-bold">Different</p>
                </div>

                <div>
                  <NumberFormat
                    className="form-control"
                    value={futureMarketByDate.different || 0}
                    thousandSeparator={","}
                    // fixedDecimalScale={true}
                    decimalSeparator={"."}
                    // decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      console.log(e.floatValue);
                      let sgHigh = 0,
                        sgLow = 0,
                        sgAvg = 0;

                      if (futureMarketByDate.londonHigh) {
                        sgHigh = e.floatValue + futureMarketByDate.londonHigh;
                      }

                      if (futureMarketByDate.londonLow) {
                        sgLow = e.floatValue + futureMarketByDate.londonLow;
                      }
                      if (futureMarketByDate.londonAvg) {
                        sgAvg = e.floatValue + futureMarketByDate.londonAvg;
                      }

                      let sgPrice = 0;
                      if (futureMarketByDate.sgEx) {
                        sgPrice = futureMarketByDate.sgEx * sgAvg;
                      }

                      // console.log({sgPrice})

                      setFutureMarket({
                        ...futureMarketByDate,
                        different: e.floatValue,
                        sgAvg,
                        sgHigh,
                        sgLow,
                        sgPrice,
                      });
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-5 gap-2 mb-2">
                <div className="flex items-center">
                  <p className="text-lg font-bold">Exchange Rate (RM)</p>
                </div>

                <div>
                  <NumberFormat
                    className="form-control"
                    value={futureMarketByDate.londonEx || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={4}
                    onValueChange={e => {
                      // if (e) e.preventDefault();
                      let londonPrice = 0;
                      if (futureMarketByDate.londonAvg) {
                        londonPrice =
                          e.floatValue * futureMarketByDate.londonAvg;
                      }

                      let sgPrice = 0;
                      if (futureMarketByDate.sgAvg) {
                        sgPrice =
                          (e.floatValue + futureMarketByDate.different) *
                          futureMarketByDate.sgAvg;
                      }

                      setFutureMarket({
                        ...futureMarketByDate,
                        londonEx: e.floatValue,
                        londonPrice,
                        sgEx: e.floatValue,
                        sgPrice,
                      });
                    }}
                  />
                </div>
                <div>
                  <NumberFormat
                    className="form-control"
                    value={futureMarketByDate.nyEx || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={4}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      let nyPrice = 0;
                      if (futureMarketByDate.nyAvg) {
                        nyPrice = e.floatValue * futureMarketByDate.nyAvg;
                      }

                      setFutureMarket({
                        ...futureMarketByDate,
                        nyEx: e.floatValue,
                        iccoEx: e.floatValue,
                        nyPrice,
                      });
                    }}
                  />
                </div>
                <div>
                  <NumberFormat
                    className="form-control"
                    value={futureMarketByDate.sgEx || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={4}
                    onValueChange={e => {
                      // if (e) e.preventDefault();
                      let sgPrice = 0;
                      if (futureMarketByDate.sgAvg) {
                        sgPrice = e.floatValue * futureMarketByDate.sgAvg;
                      }

                      setFutureMarket({
                        ...futureMarketByDate,
                        sgEx: e.floatValue,
                        iccoPrice: e.floatValue * futureMarketByDate.iccoUSD,
                        iccoEx: e.floatValue,
                        sgPrice,
                      });
                    }}
                  // disabled
                  />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-2">
                <div className="flex items-center">
                  <p className="text-lg font-bold">Price (RM)</p>
                </div>

                <div>
                  <NumberFormat
                    className="form-control"
                    value={futureMarketByDate.londonPrice || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();
                      setFutureMarket({
                        ...futureMarketByDate,
                        londonPrice: e.floatValue,
                      });
                    }}
                  />
                </div>
                <div>
                  <NumberFormat
                    className="form-control"
                    value={futureMarketByDate.nyPrice || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();
                      setFutureMarket({
                        ...futureMarketByDate,
                        nyPrice: e.floatValue,
                      });
                    }}
                  />
                </div>
                <div>
                  <NumberFormat
                    className="form-control"
                    value={futureMarketByDate.sgPrice || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();
                      setFutureMarket({
                        ...futureMarketByDate,
                        sgPrice: e.floatValue,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-2">
                <div className="flex items-center">
                  <p className="text-md font-bold">ICCO</p>
                </div>

                <div>
                  <label className="text-md font-bold">Pound</label>
                  <NumberFormat
                    className="form-control"
                    value={futureMarketByDate.iccoPoundsterling || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();
                      setFutureMarket({
                        ...futureMarketByDate,
                        iccoPoundsterling: e.floatValue,
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-md font-bold">USD</label>
                  <NumberFormat
                    className="form-control"
                    value={futureMarketByDate.iccoUSD || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();
                      setFutureMarket({
                        ...futureMarketByDate,
                        iccoUSD: e.floatValue,
                        iccoPrice: e.floatValue * futureMarketByDate.sgEx,
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-md font-bold">
                    Exchange Rate (USD)
                  </label>
                  <NumberFormat
                    className="form-control bg-gray-200"
                    disabled={true}
                    value={futureMarketByDate.iccoEx || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={4}
                    onValueChange={e => {
                      // if (e) e.preventDefault();
                      setFutureMarket({
                        ...futureMarketByDate,
                        iccoEx: e.floatValue,
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="text-md font-bold">Prices</label>
                  <NumberFormat
                    className="form-control"
                    value={futureMarketByDate.iccoPrice || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();
                      setFutureMarket({
                        ...futureMarketByDate,
                        iccoPrice: e.floatValue,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                {currentUserDontHavePrivilege([
                  "Global Price Future Market:Delete",
                ]) ? null : (
                  <button
                    className="bg-red-500 px-4 py-2 rounded-md shadow-md text-white font-bold"
                    onClick={handleDelete}>
                    <p className="text-md">
                      <i className="fa fa-times" /> Clear All
                    </p>
                  </button>
                )}

                {/* {currentUserDontHavePrivilege([
                  "Global Price Future Market:Create",
                ]) ? null : (
                  <button className="bg-purple-500 px-4 py-2 rounded-md shadow-md text-white font-bold mx-2">
                    <p className="text-md">
                      <i className="fa fa-calculator" /> Calculate
                    </p>
                  </button>
                )} */}

                {currentUserDontHavePrivilege([
                  "Global Price Future Market:Create",
                  "Global Price Future Market:Update",
                ]) ? null : (
                  <button
                    className="bg-mantis-500 px-4 py-2 rounded-md shadow-md text-white font-bold mx-2"
                    onClick={handleSave}>
                    <p className="text-md">
                      <i className="fa fa-save" /> Save
                    </p>
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="flex mt-4 mx-4">
            <p className="text-md">Total Data: </p>
            <p className="text-md font-bold mx-4">
              {countDataFutureMarkets || 0}
            </p>
          </div>

          <div className="flex mt-4 my-4">
            {currentUserDontHavePrivilege([
              "Global Price Future Market:Create",
              "Global Price Future Market:Update",
            ]) ? null : (
              <div>
                <button
                  className="bg-blue-500 px-4 py-2 rounded-md shadow-md text-white font-bold mx-2"
                  onClick={async e => {
                    if (e) e.preventDefault();
                    showLoadingSpinner();
                    try {
                      const result = await checkDuplicateFutureMarket({
                        variables: {
                          year: dayjs(date).get("year"),
                        },
                      });
                      setSelectedDuplicateToDelete([]);
                      if (result.data.checkDuplicateFutureMarket.length > 0) {
                        notification.addNotification({
                          title: "Duplicate!!",
                          message: `Found Duplicate !!`,
                          level: "danger",
                        });
                        setFounDuplicate(
                          result.data.checkDuplicateFutureMarket,
                        );
                      } else {
                        setFounDuplicate([]);

                        notification.addNotification({
                          title: "Success",
                          message: `No Duplication`,
                          level: "success",
                        });
                      }
                    } catch (err) {
                      notification.handleError(err);
                    }
                    hideLoadingSpinner();
                  }}>
                  <p className="text-md">
                    <i className="fa fa-info" /> Check Duplicate
                  </p>
                </button>

                <button
                  className="bg-purple-500 px-4 py-2 rounded-md shadow-md text-white font-bold mx-2"
                  onClick={async e => {
                    if (e) e.preventDefault();
                    showLoadingSpinner();
                    try {
                      const result = await resendFutureMarket({
                        variables: {
                          date,
                        },
                      });

                      notification.addNotification({
                        title: "Success",
                        message: `Send In Progress`,
                        level: "success",
                      });
                    } catch (err) {
                      notification.handleError(err);
                    }
                    hideLoadingSpinner();
                  }}>
                  <p className="text-md">
                    <i className="fa fa-calendar" /> Send To TMP WEB
                  </p>
                </button>
              </div>
            )}
          </div>

          {foundDuplicate.length > 0 ? (
            <Table
              withoutHeader={true}
              loading={false}
              columns={duplicateColumn}
              data={foundDuplicate}
              onRemove={async ({ rows }) => {
                handleDeleteDuplicate();
              }}
              onChangeSelection={({ rows }) => {
                // console.log("onChangeSelection", rows);
                setSelectedDuplicateToDelete(rows.map(r => r._id));
                // console.log(selectedDuplicateToDelete)
              }}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(FutureMarket);
