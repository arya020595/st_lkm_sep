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

const LIST_QUERIES = gql`
  query listQueries($date: String!) {
    allFuturePrices(date: $date) {
      _id
      date
      Source {
        _id
        description
      }

      londonHigh
      londonLow
      londonClosed
      londonEx

      nyHigh
      nyLow
      nyClosed
      nyEx
    }
    allSources {
      _id
      description
    }
    allInfoStatuses {
      _id
      description
    }
    countDataFuturePrices
  }
`;

const FUTURE_MARKET_BY_DATE = gql`
  query futurePriceByDate($date: String!) {
    futurePriceByDate(date: $date) {
      _id
      date
      Source {
        _id
        description
      }

      londonHigh
      londonLow
      londonClosed
      londonEx

      nyHigh
      nyLow
      nyClosed
      nyEx
    }
  }
`;

const CREATE_FUTURE_MARKET = gql`
  mutation createFuturePrice(
    $date: String
    $sourceId: String
    $londonHigh: Float
    $londonLow: Float
    $londonClosed: Float
    $londonEx: Float
    $nyHigh: Float
    $nyLow: Float
    $nyClosed: Float
    $nyEx: Float
  ) {
    createFuturePrice(
      date: $date
      sourceId: $sourceId

      londonHigh: $londonHigh
      londonLow: $londonLow
      londonClosed: $londonClosed
      londonEx: $londonEx

      nyHigh: $nyHigh
      nyLow: $nyLow
      nyClosed: $nyClosed
      nyEx: $nyEx
    )
  }
`;

const UPDATE_FUTURE_MARKET = gql`
  mutation updateFuturePrice(
    $_id: String!
    $date: String
    $sourceId: String
    $londonHigh: Float
    $londonLow: Float
    $londonClosed: Float
    $londonEx: Float
    $nyHigh: Float
    $nyLow: Float
    $nyClosed: Float
    $nyEx: Float
  ) {
    updateFuturePrice(
      _id: $_id
      date: $date
      sourceId: $sourceId

      londonHigh: $londonHigh
      londonLow: $londonLow
      londonClosed: $londonClosed
      londonEx: $londonEx

      nyHigh: $nyHigh
      nyLow: $nyLow
      nyClosed: $nyClosed
      nyEx: $nyEx
    )
  }
`;

const DELETE_FUTURE_MARKET = gql`
  mutation deleteFuturePrice($_id: String!) {
    deleteFuturePrice(_id: $_id)
  }
`;
const FuturePrice = ({ currentUserDontHavePrivilege }) => {
  const notification = useNotification();
  const router = useRouter();
  const client = useApolloClient();
  const date = router.query.date || dayjs().format("YYYY-MM-DD");
  const [selectedActiveDate, setSelectedActiveDate] = useState("");

  const [futurePriceByDate, setFuturePrice] = useState({
    different: 0,
  });

  const { data, loading, error, refetch } = useQuery(LIST_QUERIES, {
    variables: {
      date,
    },
  });

  const [createFuturePrice] = useMutation(CREATE_FUTURE_MARKET);
  const [updateFuturePrice] = useMutation(UPDATE_FUTURE_MARKET);
  const [deleteFuturePrice] = useMutation(DELETE_FUTURE_MARKET);

  useEffect(async () => {
    const result = await client.query({
      query: FUTURE_MARKET_BY_DATE,
      variables: {
        date,
      },
      fetchPolicy: "no-cache",
    });

    if (result.data.futurePriceByDate) {
      setFuturePrice({
        ...result.data.futurePriceByDate,
        sourceId: result.data.futurePriceByDate?.Source?._id || "",
      });
    }
  }, [date]);

  let allFuturePrices = [];
  if (data?.allFuturePrices) {
    allFuturePrices = data.allFuturePrices;
  }

  let allSources = [];
  if (data?.allSources) {
    allSources = data.allSources;
  }

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

    if (allFuturePrices.length > 0) {
      const foundPrice = allFuturePrices.filter(
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

  const handleSave = async e => {
    if (e) e.preventDefault();
    showLoadingSpinner();
    try {
      let { _id, __typename, _createdAt, _updatedAt } = futurePriceByDate;
      if (!_id) {
        await createFuturePrice({
          variables: {
            ...futurePriceByDate,
            date,
          },
        });
      } else {
        await updateFuturePrice({
          variables: {
            ...futurePriceByDate,
          },
        });
      }
      await refetch();
      notification.addNotification({
        title: "Succeess!",
        message: `Future Price saved!`,
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
      if (futurePriceByDate._id) {
        if (
          confirm(`Are you sure to clear future market price on this date ?`)
        ) {
          await deleteFuturePrice({
            variables: {
              _id: futurePriceByDate._id,
            },
          });
          setFuturePrice({
            different: 0,
          });
          notification.addNotification({
            title: "Succeess!",
            message: `Future Price cleared!`,
            level: "success",
          });
          await refetch();
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

  return (
    <div className="mt-10">
      <Calendar
        calendarType="US"
        className="rounded-md w-full shadow-lg py-4 mb-4 border-2 border-mantis-500"
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
                  <p className="text-lg font-bold">Source</p>
                </label>
                <select
                  className="form-control"
                  value={futurePriceByDate.sourceId || ""}
                  onChange={e => {
                    if (e) e.preventDefault();
                    setFuturePrice({
                      ...futurePriceByDate,
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
                  value={futurePriceByDate.infoStatusId || ""}
                  onChange={e => {
                    if (e) e.preventDefault();
                    setFuturePrice({
                      ...futurePriceByDate,
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
              <div className="grid grid-cols-3 gap-2 mb-2">
                <p className="text-lg font-bold">Prices</p>
                <p className="text-lg font-bold">London</p>
                <p className="text-lg font-bold">New York</p>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="flex items-center">
                  <p className="text-lg font-bold">First</p>
                </div>

                <div>
                  <NumberFormat
                    className="form-control"
                    value={futurePriceByDate.londonHigh || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFuturePrice({
                        ...futurePriceByDate,
                        londonHigh: e.floatValue,
                        sgHigh: e.floatValue + futurePriceByDate.different,
                      });
                    }}
                  />
                </div>
                <div>
                  <NumberFormat
                    className="form-control"
                    value={futurePriceByDate.nyHigh || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFuturePrice({
                        ...futurePriceByDate,
                        nyHigh: e.floatValue,
                      });
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="flex items-center">
                  <p className="text-lg font-bold">Second</p>
                </div>

                <div>
                  <NumberFormat
                    className="form-control"
                    value={futurePriceByDate.londonLow || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFuturePrice({
                        ...futurePriceByDate,
                        londonLow: e.floatValue,
                        sgLow: e.floatValue + futurePriceByDate.different,
                      });
                    }}
                  />
                </div>
                <div>
                  <NumberFormat
                    className="form-control"
                    value={futurePriceByDate.nyLow || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFuturePrice({
                        ...futurePriceByDate,
                        nyLow: e.floatValue,
                      });
                    }}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="flex items-center">
                  <p className="text-lg font-bold">Third</p>
                </div>

                <div>
                  <NumberFormat
                    className="form-control"
                    value={futurePriceByDate.londonClosed || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFuturePrice({
                        ...futurePriceByDate,
                        londonClosed: e.floatValue,
                      });
                    }}
                  />
                </div>
                <div>
                  <NumberFormat
                    className="form-control"
                    value={futurePriceByDate.nyClosed || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();
                      setFuturePrice({
                        ...futurePriceByDate,
                        nyClosed: e.floatValue,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mb-2">
                <div className="flex items-center">
                  <p className="text-lg font-bold">Exchange Rate (RM)</p>
                </div>

                <div>
                  <NumberFormat
                    className="form-control"
                    value={futurePriceByDate.londonEx || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={4}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFuturePrice({
                        ...futurePriceByDate,
                        londonEx: e.floatValue,
                      });
                    }}
                  />
                </div>
                <div>
                  <NumberFormat
                    className="form-control"
                    value={futurePriceByDate.nyEx || 0}
                    thousandSeparator={","}
                    fixedDecimalScale={true}
                    decimalSeparator={"."}
                    decimalScale={4}
                    onValueChange={e => {
                      // if (e) e.preventDefault();

                      setFuturePrice({
                        ...futurePriceByDate,
                        nyEx: e.floatValue,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-end mt-4">
                {currentUserDontHavePrivilege([
                  "Global Price Future Price:Delete",
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
                  "Global Price Future Price:Create",
                ]) ? null : (
                  <button className="bg-purple-500 px-4 py-2 rounded-md shadow-md text-white font-bold mx-2">
                    <p className="text-md">
                      <i className="fa fa-calculator" /> Calculate
                    </p>
                  </button>
                )} */}

                {currentUserDontHavePrivilege([
                  "Global Price Future Price:Create",
                  "Global Price Future Price:Update",
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
              {data?.countDataFuturePrices || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(FuturePrice);
