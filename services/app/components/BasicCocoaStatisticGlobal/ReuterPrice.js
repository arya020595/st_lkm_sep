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
const QUERY = gql`
  query listQueries($year: String!) {
    allBasicCocoaStatisticGlobalPriceReuters(year: $year) {
      _id
      date

      londonHigh
      londonLow
      londonAvg
      londonEX
      londonPrice

      nyHigh
      nyLow
      nyAvg
      nyEX
      nyPrice

      iccoPound
      iccoUSD
      iccoEX
      iccoPrice

      sgHigh
      sgLow
      sgAvg
      sgEX
      sgPrice

      different
    }
    countBasicCocoaStatisticGlobalPriceReuters
  }
`;

const CREATE_BCS_GLOBAL_REUTERS_PRICE = gql`
  mutation createBasicCocoaStatisticGlobalPriceReuters(
    $date: String
    $londonHigh: Float
    $londonLow: Float
    $londonAvg: Float
    $londonEX: Float
    $londonPrice: Float
    $nyHigh: Float
    $nyLow: Float
    $nyAvg: Float
    $nyEX: Float
    $nyPrice: Float
    $sgHigh: Float
    $sgLow: Float
    $sgAvg: Float
    $sgEX: Float
    $sgPrice: Float
    $iccoPound: Float
    $iccoUSD: Float
    $iccoEX: Float
    $iccoPrice: Float
    $different: Float
  ) {
    createBasicCocoaStatisticGlobalPriceReuters(
      date: $date

      londonHigh: $londonHigh
      londonLow: $londonLow
      londonAvg: $londonAvg
      londonEX: $londonEX
      londonPrice: $londonPrice

      nyHigh: $nyHigh
      nyLow: $nyLow
      nyAvg: $nyAvg
      nyEX: $nyEX
      nyPrice: $nyPrice

      sgHigh: $sgHigh
      sgLow: $sgLow
      sgAvg: $sgAvg
      sgEX: $sgEX
      sgPrice: $sgPrice

      iccoPound: $iccoPound
      iccoUSD: $iccoUSD
      iccoEX: $iccoEX
      iccoPrice: $iccoPrice

      different: $different
    )
  }
`;

const UPDATE_BCS_GLOBAL_REUTERS_PRICE = gql`
  mutation updateBasicCocoaStatisticGlobalPriceReuters(
    $_id: String!
    $date: String
    $londonHigh: Float
    $londonLow: Float
    $londonAvg: Float
    $londonEX: Float
    $londonPrice: Float
    $nyHigh: Float
    $nyLow: Float
    $nyAvg: Float
    $nyEX: Float
    $nyPrice: Float
    $sgHigh: Float
    $sgLow: Float
    $sgAvg: Float
    $sgEX: Float
    $sgPrice: Float
    $iccoPound: Float
    $iccoUSD: Float
    $iccoEX: Float
    $iccoPrice: Float
    $different: Float
  ) {
    updateBasicCocoaStatisticGlobalPriceReuters(
      _id: $_id
      date: $date

      londonHigh: $londonHigh
      londonLow: $londonLow
      londonAvg: $londonAvg
      londonEX: $londonEX
      londonPrice: $londonPrice

      nyHigh: $nyHigh
      nyLow: $nyLow
      nyAvg: $nyAvg
      nyEX: $nyEX
      nyPrice: $nyPrice

      sgHigh: $sgHigh
      sgLow: $sgLow
      sgAvg: $sgAvg
      sgEX: $sgEX
      sgPrice: $sgPrice

      iccoPound: $iccoPound
      iccoUSD: $iccoUSD
      iccoEX: $iccoEX
      iccoPrice: $iccoPrice

      different: $different
    )
  }
`;
const DELETE_BCS_GLOBAL_REUTERS_PRICE = gql`
  mutation deleteBasicCocoaStatisticGlobalPriceReuters($_id: String!) {
    deleteBasicCocoaStatisticGlobalPriceReuters(_id: $_id)
  }
`;
const BasicCocoaStatisticGlobalPriceICCO = ({
  currentUserDontHavePrivilege,
}) => {
  const router = useRouter();
  const year = String(router.query.year || dayjs().format("YYYY-MM"));

  const notification = useNotification();
  const [formData, setFormData] = useState({
    date: dayjs().format("YYYY-MM-DD"),
    different: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);

  const columns = useMemo(() => [
    {
      Header: "Date",
      accessor: "date",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
    {
      Header: "London High",
      accessor: "londonHigh",
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
    {
      Header: "London Low",
      accessor: "londonLow",
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
    {
      Header: "London Avg",
      accessor: "londonAvg",
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
    {
      Header: "London EX",
      accessor: "londonEX",
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
    {
      Header: "London Price",
      accessor: "londonPrice",
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

    {
      Header: "New York High",
      accessor: "nyHigh",
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
    {
      Header: "New York Low",
      accessor: "nyLow",
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
    {
      Header: "New York Avg",
      accessor: "nyAvg",
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
    {
      Header: "New York EX",
      accessor: "nyEX",
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
    {
      Header: "New York Price",
      accessor: "nyPrice",
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
    {
      Header: "Spot Ghana High",
      accessor: "sgHigh",
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
    {
      Header: "Spot Ghana Low",
      accessor: "sgLow",
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
    {
      Header: "Spot Ghana Avg",
      accessor: "sgAvg",
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
    {
      Header: "Spot Ghana EX",
      accessor: "sgEX",
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
    {
      Header: "Spot Ghana Price",
      accessor: "sgPrice",
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
    {
      Header: "ICCO Pound",
      accessor: "iccoPound",
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
    {
      Header: "ICCO USD",
      accessor: "iccoUSD",
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
    {
      Header: "ICCO EX",
      accessor: "iccoEX",
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
    {
      Header: "ICCO Price",
      accessor: "iccoPrice",
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
    {
      Header: "Different",
      accessor: "different",
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
  ]);

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      year,
    },
  });
  const [createBasicCocoaStatisticGlobalPriceReuters] = useMutation(
    CREATE_BCS_GLOBAL_REUTERS_PRICE,
  );
  const [updateBasicCocoaStatisticGlobalPriceReuters] = useMutation(
    UPDATE_BCS_GLOBAL_REUTERS_PRICE,
  );
  const [deleteBasicCocoaStatisticGlobalPriceReuters] = useMutation(
    DELETE_BCS_GLOBAL_REUTERS_PRICE,
  );
  let allBasicCocoaStatisticGlobalPriceReuters = [];

  if (data?.allBasicCocoaStatisticGlobalPriceReuters) {
    allBasicCocoaStatisticGlobalPriceReuters =
      data.allBasicCocoaStatisticGlobalPriceReuters;
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
        title={`${!formData._id ? "New" : "Edit"} BCS Reuters Price`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({});
        }}
        size="lg"
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { _id, __typename, _createdAt, _updatedAt } = formData;
            // console.log({ formData });
            if (!_id) {
              await createBasicCocoaStatisticGlobalPriceReuters({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateBasicCocoaStatisticGlobalPriceReuters({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `BCS Reuters Price saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Date*</label>
          <input
            type="date"
            className="form-control w-1/4"
            value={formData.date || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                date: e.target.value,
              });
            }}
          />
        </div>

        <hr className="bg-gray-500 my-2" />
        <div className="grid grid-cols-5 gap-1">
          <p className="text-md font-bold">Prices</p>
          <p className="text-md font-bold">London</p>
          <p className="text-md font-bold">New York</p>
          <p className="text-md font-bold">Spot Ghana </p>
        </div>
        <div className="grid grid-cols-5 gap-1">
          <div className="flex items-center">
            <p className="text-md font-bold">High</p>
          </div>

          <div>
            <NumberFormat
              className="form-control"
              value={formData.londonHigh || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();

                setFormData({
                  ...formData,
                  londonHigh: e.floatValue,
                  sgHigh: e.floatValue + formData.different,
                });
              }}
            />
          </div>
          <div>
            <NumberFormat
              className="form-control"
              value={formData.nyHigh || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  nyHigh: e.floatValue,
                });
              }}
            />
          </div>
          <div>
            <NumberFormat
              className="form-control bg-gray-200"
              value={formData.sgHigh || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              disabled
            />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1 my-2">
          <div className="flex items-center">
            <p className="text-md font-bold">Low</p>
          </div>

          <div>
            <NumberFormat
              className="form-control"
              value={formData.londonLow || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  londonLow: e.floatValue,
                  sgLow: e.floatValue + formData.different,
                });
              }}
            />
          </div>
          <div>
            <NumberFormat
              className="form-control"
              value={formData.nyLow || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  nyLow: e.floatValue,
                });
              }}
            />
          </div>
          <div>
            <NumberFormat
              className="form-control bg-gray-200"
              value={formData.sgLow || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              disabled
            />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-1 my-2">
          <div className="flex items-center">
            <p className="text-md font-bold">Average</p>
          </div>

          <div>
            <NumberFormat
              className="form-control"
              value={formData.londonAvg || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  londonAvg: e.floatValue,
                  sgAvg: e.floatValue + formData.different,
                });
              }}
            />
          </div>
          <div>
            <NumberFormat
              className="form-control"
              value={formData.nyAvg || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  nyAvg: e.floatValue,
                });
              }}
            />
          </div>
          <div>
            <NumberFormat
              className="form-control bg-gray-200"
              value={formData.sgAvg || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              disabled
            />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1 my-2">
          <div className="flex items-center">
            <p className="text-md font-bold">Different</p>
          </div>

          <div>
            <NumberFormat
              className="form-control"
              value={formData.different || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();

                let sgHigh = 0,
                  sgLow = 0,
                  sgAvg = 0;

                if (formData.londonHigh) {
                  sgHigh = e.floatValue + formData.londonHigh;
                }

                if (formData.londonLow) {
                  sgLow = e.floatValue + formData.londonLow;
                }
                if (formData.londonAvg) {
                  sgAvg = e.floatValue + formData.londonAvg;
                }
                setFormData({
                  ...formData,
                  different: e.floatValue,
                  sgHigh,
                  sgLow,
                  sgAvg,
                });
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1 my-2">
          <div className="flex items-center">
            <p className="text-md font-bold">Exchange Rate(RM)</p>
          </div>

          <div>
            <NumberFormat
              className="form-control"
              value={formData.londonEX || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  londonEX: e.floatValue,
                  sgEX: e.floatValue,
                });
              }}
            />
          </div>
          <div>
            <NumberFormat
              className="form-control"
              value={formData.nyEX || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  nyEX: e.floatValue,
                });
              }}
            />
          </div>
          <div>
            <NumberFormat
              className="form-control"
              value={formData.sgEX || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  sgEX: e.floatValue,
                  iccoPrice: e.floatValue * formData.iccoUSD,
                  iccoEX: e.floatValue,
                });
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1 my-2">
          <div className="flex items-center">
            <p className="text-md font-bold">Price (RM)</p>
          </div>

          <div>
            <NumberFormat
              className="form-control"
              value={formData.londonPrice || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  londonPrice: e.floatValue,
                });
              }}
            />
          </div>
          <div>
            <NumberFormat
              className="form-control"
              value={formData.nyPrice || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  nyPrice: e.floatValue,
                });
              }}
            />
          </div>
          <div>
            <NumberFormat
              className="form-control"
              value={formData.sgPrice || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  sgPrice: e.floatValue,
                });
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-5 gap-1 my-2">
          <div className="flex items-center">
            <p className="text-md font-bold">ICCO</p>
          </div>

          <div>
            <label className="text-md font-bold">Pound</label>
            <NumberFormat
              className="form-control"
              value={formData.iccoPound || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  iccoPound: e.floatValue,
                });
              }}
            />
          </div>
          <div>
            <label className="text-md font-bold">USD</label>
            <NumberFormat
              className="form-control"
              value={formData.iccoUSD || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  iccoUSD: e.floatValue,
                  iccoPrice: e.floatValue * formData.sgEX,
                });
              }}
            />
          </div>
          <div>
            <label className="text-md font-bold">Exchange Rate</label>
            <NumberFormat
              className="form-control"
              value={formData.iccoEX || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  iccoEX: e.floatValue,
                });
              }}
            />
          </div>
          <div>
            <label className="text-md font-bold">Prices</label>
            <NumberFormat
              className="form-control"
              value={formData.iccoPrice || 0}
              thousandSeparator={","}
              fixedDecimalScale={true}
              decimalSeparator={"."}
              decimalScale={2}
              onValueChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  iccoPrice: e.floatValue,
                });
              }}
            />
          </div>
        </div>
      </FormModal>

      <Table
        customHeaderUtilities={
          <div>
            <div className="form-group">
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
          </div>
        }
        loading={false}
        columns={columns}
        data={allBasicCocoaStatisticGlobalPriceReuters}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege(["BCS Global Reuters Price:Create"])
            ? null
            : e => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({
                  date: dayjs().format("YYYY-MM-DD"),
                  different: 0,
                });
              }
        }
        onRemove={
          currentUserDontHavePrivilege(["BCS Global Reuters Price:Delete"])
            ? null
            : async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} data?`,
                  );
                  if (yes) {
                    for (const row of rows) {
                      await deleteBasicCocoaStatisticGlobalPriceReuters({
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
          currentUserDontHavePrivilege(["BCS Global Reuters Price:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />
      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">
          {data?.countBasicCocoaStatisticGlobalPriceReuters || 0}
        </p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(BasicCocoaStatisticGlobalPriceICCO);
