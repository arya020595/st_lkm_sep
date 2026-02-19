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
    allBasicCocoaStatisticGlobalPriceICCOs(year: $year) {
      _id
      date
      exchangeRate
      price
      currency
    }
    countBasicCocoaStatisticGlobalPriceICCOs
  }
`;

const CREATE_BCS_GLOBAL_ICCO_PRICE = gql`
  mutation createBasicCocoaStatisticGlobalPriceICCO(
    $date: String
    $currency: String
    $exchangeRate: Float
    $price: Float
  ) {
    createBasicCocoaStatisticGlobalPriceICCO(
      date: $date
      currency: $currency
      exchangeRate: $exchangeRate
      price: $price
    )
  }
`;

const UPDATE_BCS_GLOBAL_ICCO_PRICE = gql`
  mutation updateBasicCocoaStatisticGlobalPriceICCO(
    $_id: String!
    $date: String
    $currency: String
    $exchangeRate: Float
    $price: Float
  ) {
    updateBasicCocoaStatisticGlobalPriceICCO(
      _id: $_id
      date: $date
      currency: $currency
      exchangeRate: $exchangeRate
      price: $price
    )
  }
`;
const DELETE_BCS_GLOBAL_ICCO_PRICE = gql`
  mutation deleteBasicCocoaStatisticGlobalPriceICCO($_id: String!) {
    deleteBasicCocoaStatisticGlobalPriceICCO(_id: $_id)
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
  });
  const [modalVisible, setModalVisible] = useState(false);

  const columns = useMemo(() => [
    {
      Header: "Date",
      accessor: "date",
      style: {
        fontSize: 20,
      },
      // disableFilters: true,
    },
    {
      Header: "Currency",
      accessor: "currency",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Exchange Rate (RM)",
      accessor: "exchangeRate",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Price",
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

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      year,
    },
  });
  const [createBasicCocoaStatisticGlobalPriceICCO] = useMutation(
    CREATE_BCS_GLOBAL_ICCO_PRICE,
  );
  const [updateBasicCocoaStatisticGlobalPriceICCO] = useMutation(
    UPDATE_BCS_GLOBAL_ICCO_PRICE,
  );
  const [deleteBasicCocoaStatisticGlobalPriceICCO] = useMutation(
    DELETE_BCS_GLOBAL_ICCO_PRICE,
  );
  let allBasicCocoaStatisticGlobalPriceICCOs = [];

  if (data?.allBasicCocoaStatisticGlobalPriceICCOs) {
    allBasicCocoaStatisticGlobalPriceICCOs =
      data.allBasicCocoaStatisticGlobalPriceICCOs;
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
        title={`${!formData._id ? "New" : "Edit"} BCS ICCO Price`}
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
              await createBasicCocoaStatisticGlobalPriceICCO({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateBasicCocoaStatisticGlobalPriceICCO({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `BCS ICCO Price saved!`,
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
            className="form-control"
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
          <label>Exchange Rate (RM)</label>
          <NumberFormat
            className="form-control"
            value={formData.exchangeRate || 0}
            thousandSeparator={","}
            fixedDecimalScale={true}
            decimalSeparator={"."}
            decimalScale={2}
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
            fixedDecimalScale={true}
            decimalSeparator={"."}
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
        customUtilitiesPosition="left"
        loading={false}
        columns={columns}
        data={allBasicCocoaStatisticGlobalPriceICCOs}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege(["BCS Global ICCO Price:Create"])
            ? null
            : e => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({
                  date: dayjs().format("YYYY-MM-DD"),
                });
              }
        }
        onRemove={
          currentUserDontHavePrivilege(["BCS Global ICCO Price:Delete"])
            ? null
            : async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} data?`,
                  );
                  if (yes) {
                    for (const row of rows) {
                      await deleteBasicCocoaStatisticGlobalPriceICCO({
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
          currentUserDontHavePrivilege(["BCS Global ICCO Price:Update"])
            ? null
            : customUtilities
        }
      />
      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">
          {data?.countBasicCocoaStatisticGlobalPriceICCOs || 0}
        </p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(BasicCocoaStatisticGlobalPriceICCO);
