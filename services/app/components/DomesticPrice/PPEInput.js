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

const QUERY = gql`
  query listQueries($date: String!) {
    domesticPriceByCentrePerMonthTokenized(date: $date)
    domesticPricePerMonthTokenized(date: $date)
    countDomesticCocoaPrices

    getDomesticPriceTotalByDate(date: $date)
    getLastUpdateDomesticPrice(date: $date)
    getLastUpdateDomesticPricePushedToWBC(date: $date)
  }
`;

const DETAIL_QUERY = gql`
  query getDomesticPriceByCentreTokenized($tokenizedParams: String!) {
    getDomesticPriceByCentreTokenized(tokenizedParams: $tokenizedParams)
  }
`;

const BUYER_BY_CENTRE_TOKENIZED = gql`
  query allBuyersByCentreId($tokenizedParams: String!) {
    allBuyersByCentreIdTokenized(tokenizedParams: $tokenizedParams)
  }
`;

const CREATE_DETAIL = gql`
  mutation createDomesticCocoaPriceTokenized($tokenizedInput: String!) {
    createDomesticCocoaPriceTokenized(tokenizedInput: $tokenizedInput)
  }
`;

const UPDATE_DETAIL = gql`
  mutation updateDomesticCocoaPriceTokenized($tokenizedInput: String!) {
    updateDomesticCocoaPriceTokenized(tokenizedInput: $tokenizedInput)
  }
`;

const DELETE_DETAIL = gql`
  mutation deleteDomesticCocoaPrice($tokenizedInput: String!) {
    deleteDomesticCocoaPriceTokenized(tokenizedInput: $tokenizedInput)
  }
`;

const PPEInput = ({ currentUserDontHavePrivilege }) => {
  const notification = useNotification();
  const router = useRouter();
  const client = useApolloClient();
  const [selectedActiveDate, setSelectedActiveDate] = useState("");
  const date = router.query.date || dayjs().format("YYYY-MM-DD");
  const [priceDetails, setPriceDetail] = useState([]);
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [detailFormVisible, setDetailFormVisible] = useState(false);
  const [detailFormData, setDetailFormData] = useState({});

  const [allBuyers, setBuyers] = useState([]);
  const [pricesList, setPricesList] = useState([]);
  const [isFixed, setIsFixed] = useState(false);
  let [savedCount, setSavedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const [allCentres, setAllCentres] = useState([]);
  const [latestUpdateDomesticPriceAtDate, setLatestUpdateDomesticPriceAtDate] =
    useState("");
  const [latestUpdateDomesticPricePushedToWBCAtDate, setPushedDataWBC] =
    useState("");
  const [domesticPricePerMonth, setDomesticPricePerMonth] = useState([]);
  const [countDomesticCocoaPrices, setCountDomesticCocoaPrice] = useState(0);

  const [updateDomesticCocoaPrice] = useMutation(UPDATE_DETAIL);
  const [createDomesticCocoaPrice] = useMutation(CREATE_DETAIL);
  const [deleteDomesticCocoaPrice] = useMutation(DELETE_DETAIL);

  const fetchData = async (date) => {
    const result = await client.query({
      query: QUERY,
      variables: {
        date,
      },
      fetchPolicy: "no-cache",
    });
    const encryptedPriceByCentrePerMonthTokenized =
      result.data?.domesticPriceByCentrePerMonthTokenized || "";
    let allCentres = [];
    if (encryptedPriceByCentrePerMonthTokenized) {
      const decrypted = jwt.verify(
        encryptedPriceByCentrePerMonthTokenized,
        TOKENIZE,
      );
      allCentres = decrypted.results;
      setAllCentres(allCentres);
    }

    const encryptedPricePerMonth =
      result.data?.domesticPricePerMonthTokenized || "";
    if (encryptedPricePerMonth) {
      let domesticPricePerMonth = [];
      const decrypted = jwt.verify(encryptedPricePerMonth, TOKENIZE);
      domesticPricePerMonth = decrypted.results;
      setDomesticPricePerMonth(domesticPricePerMonth);
    }
    setCountDomesticCocoaPrice(result.data.countDomesticCocoaPrices);
    setLatestUpdateDomesticPriceAtDate(
      result.data?.getLastUpdateDomesticPrice || "-",
    );
    setPushedDataWBC(
      result.data?.getLastUpdateDomesticPricePushedToWBC || "-",
    );
  }
  useEffect(() => {
    // await refetch();

    showLoadingSpinner();
    try {
      setLoading(true);
      fetchData(router?.query?.date || dayjs().format("YYYY-MM-DD"))
      setLoading(false);
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  }, [router.query.date, savedCount]);

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
                setDetailFormData(propsTable.row.original);
                setDetailFormVisible(true);
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

  const columns = useMemo(() => [
    {
      Header: "",
      accessor: "_id",
      style: {
        fontSize: 20,
        width: 150,
      },
      disableFilters: true,
      Cell: props => {
        if (
          currentUserDontHavePrivilege([
            "Input For PPE:Create",
            "Input For PPE:Update",
            "Input For PPE:Delete",
          ])
        ) {
          return <div />;
        }
        return (
          <div>
            <button
              className="bg-blue-500 px-4 py-2 rounded-md shadow-md font-bold text-white text-md"
              onClick={openCentre(props.row.original)}>
              <i className="fa fa-eye" /> Detail
            </button>
          </div>
        );
      },
    },
    {
      Header: "Centre",
      accessor: "description",
      style: {
        fontSize: 20,
        width: 200,
      },
    },
    {
      Header: "Wet Price High",
      accessor: "DomesticCocoaPrice.wetHigh",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "Wet Price Low",
      accessor: "DomesticCocoaPrice.wetLow",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "Wet Price Avg",
      accessor: "DomesticCocoaPrice.wetAverage",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },

    {
      Header: "SMC1 High",
      accessor: "DomesticCocoaPrice.smc1High",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "SMC1 Low",
      accessor: "DomesticCocoaPrice.smc1Low",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "SMC1 Avg",
      accessor: "DomesticCocoaPrice.smc1Average",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },

    {
      Header: "SMC2 High",
      accessor: "DomesticCocoaPrice.smc2High",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "SMC2 Low",
      accessor: "DomesticCocoaPrice.smc2Low",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "SMC2 Avg",
      accessor: "DomesticCocoaPrice.smc2Average",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },

    {
      Header: "SMC3 High",
      accessor: "DomesticCocoaPrice.smc3High",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "SMC3 Low",
      accessor: "DomesticCocoaPrice.smc3Low",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "SMC3 Avg",
      accessor: "DomesticCocoaPrice.smc3Average",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
  ]);

  const detailColumns = useMemo(() => [
    {
      Header: "Buyer",
      accessor: "Buyer.name",
      style: {
        fontSize: 18,
      },
    },
    {
      Header: "Wet Price",
      accessor: "wetPrice",
      style: {
        fontSize: 18,
      },
      disableFilters: true,
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "SMC1 Price",
      accessor: "smc1",
      style: {
        fontSize: 18,
      },
      disableFilters: true,
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "SMC2 Price",
      accessor: "smc2",
      style: {
        fontSize: 18,
      },
      disableFilters: true,
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "SMC3 Price",
      accessor: "smc3",
      style: {
        fontSize: 18,
      },
      disableFilters: true,
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
  ]);

  const handleViewChangeCalendar = (activeStartDate, value, view) => {
    // if (e) e.preventDefault();
    let date = "";

    if (selectedActiveDate) {
      date = dayjs(selectedActiveDate).format("YYYY-MM-DD");
    } else {
      date = dayjs(activeStartDate).format("YYYY-MM-DD");
    }

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

    if (domesticPricePerMonth.length > 0) {
      const foundSched = domesticPricePerMonth.filter(
        sched => sched.date === calendarDate,
      );

      if (foundSched.length > 0) {
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

  const handleSelectDate = async date => {
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

  const openCentre = centre => async e => {
    // console.log({ centre, date });

    const tokenizedParams = jwt.sign(
      {
        date,
        centreId: centre._id,
      },
      TOKENIZE,
    );

    const result = await client.query({
      query: DETAIL_QUERY,
      variables: {
        tokenizedParams,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedData = result.data?.getDomesticPriceByCentreTokenized || "";
    if (encryptedData) {
      const decrypted = jwt.verify(encryptedData, TOKENIZE);
      setPriceDetail(decrypted.results);
    }

    const tokenizedParamsBuyersQuery = jwt.sign(
      {
        centreId: centre._id,
      },
      TOKENIZE,
    );
    const buyers = await client.query({
      query: BUYER_BY_CENTRE_TOKENIZED,
      variables: {
        tokenizedParams: tokenizedParamsBuyersQuery,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedDataBuyersQuery =
      buyers.data?.allBuyersByCentreIdTokenized || "";
    if (encryptedDataBuyersQuery) {
      const decrypted = jwt.verify(encryptedDataBuyersQuery, TOKENIZE);
      setBuyers(decrypted.results);
    }

    setModalVisible(true);
    setFormData(centre);
  };

  const saveDetail = async e => {
    showLoadingSpinner();
    try {
      let centreId = "";
      if (!detailFormData._id) {
        centreId = formData._id;
        const tokenizedInput = jwt.sign(
          {
            date,
            buyerId: detailFormData.buyerId,
            centreId: formData._id,
            wetPrice: detailFormData.wetPrice || 0,
            smc1: detailFormData.smc1 || 0,
            smc2: detailFormData.smc2 || 0,
            smc3: detailFormData.smc3 || 0,
          },
          TOKENIZE,
        );

        await createDomesticCocoaPrice({
          variables: {
            tokenizedInput,
          },
        });
      } else {
        centreId = detailFormData.Centre._id;

        const tokenizedInput = jwt.sign(
          {
            _id: detailFormData._id,
            date,
            buyerId: detailFormData.Buyer._id,
            centreId: detailFormData.Centre._id,

            wetPrice: detailFormData.wetPrice || 0,
            smc1: detailFormData.smc1 || 0,
            smc2: detailFormData.smc2 || 0,
            smc3: detailFormData.smc3 || 0,
          },
          TOKENIZE,
        );

        await updateDomesticCocoaPrice({
          variables: {
            tokenizedInput,
          },
        });

        notification.addNotification({
          title: "Success!",
          message: `Data saved!`,
          level: "success",
        });
      }

      //Refetch Detail
      const tokenizedParams = jwt.sign(
        {
          date,
          centreId,
        },
        TOKENIZE,
      );

      const result = await client.query({
        query: DETAIL_QUERY,
        variables: {
          tokenizedParams,
        },
        fetchPolicy: "no-cache",
      });

      const encryptedData =
        result.data?.getDomesticPriceByCentreTokenized || "";
      if (encryptedData) {
        const decrypted = jwt.verify(encryptedData, TOKENIZE);
        setPriceDetail(decrypted.results);
      }

      //Fetch domesticPriceByCentrePerMonth
      // await refetch();
      setSavedCount((savedCount += 1));

      setDetailFormVisible(false);

      notification.addNotification({
        title: "Success!",
        message: `Data saved!`,
        level: "success",
      });
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  return (
    <div className="mt-10">
      <FormModal
        title={`Domestic Cocoa Price Details`}
        visible={modalVisible}
        size="lg"
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({});
          setDetailFormData({});
          setDetailFormVisible(false);
        }}>
        <div className="flex mb-2">
          <p className="text-md">Centre: </p>
          <p className="text-md font-bold ml-4">{formData.description}</p>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="form-group">
            <label>Tanggal</label>
            <input className="form-control bg-gray-300" value={date} disabled />
          </div>

          <div className="form-group">
            <label>Centre</label>
            <input
              className="form-control bg-gray-300"
              value={formData.description || ""}
              disabled
            />
          </div>
        </div>

        {detailFormVisible && detailFormData._id ? (
          <div className="border-2 border-mantis-500 px-4 py-4 rounded-md shadow-md">
            <p className="text-lg font-bold">Edit Data</p>
            <div className="flex">
              <p className="text-md">Buyer: </p>
              <p className="text-md font-bold ml-4">
                {detailFormData?.Buyer?.name || ""}
              </p>
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div className="form-group">
                <label>Wet Price</label>
                <NumberFormat
                  className="form-control"
                  value={detailFormData.wetPrice || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  decimalScale={2}
                  fixedDecimalScale={true}
                  onValueChange={e => {
                    // if (e) e.preventDefault();
                    setDetailFormData({
                      ...detailFormData,
                      wetPrice: e.floatValue,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>SMC1 Price</label>
                <NumberFormat
                  className="form-control"
                  value={detailFormData.smc1 || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  decimalScale={2}
                  fixedDecimalScale={true}
                  onValueChange={e => {
                    // if (e) e.preventDefault();
                    setDetailFormData({
                      ...detailFormData,
                      smc1: e.floatValue,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>SMC2 Price</label>
                <NumberFormat
                  className="form-control"
                  value={detailFormData.smc2 || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  decimalScale={2}
                  fixedDecimalScale={true}
                  onValueChange={e => {
                    // if (e) e.preventDefault();
                    setDetailFormData({
                      ...detailFormData,
                      smc2: e.floatValue,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>SMC3 Price</label>
                <NumberFormat
                  className="form-control"
                  value={detailFormData.smc3 || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  decimalScale={2}
                  fixedDecimalScale={true}
                  onValueChange={e => {
                    // if (e) e.preventDefault();
                    setDetailFormData({
                      ...detailFormData,
                      smc3: e.floatValue,
                    });
                  }}
                />
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <button
                className="bg-red-500 px-4 py-2 rounded-md shadow-md text-white font-bold"
                onClick={e => {
                  setDetailFormData({});
                  setDetailFormVisible(false);
                }}>
                <p className="text-md">
                  <i className="fa fa-times" /> Close
                </p>
              </button>
              <button
                className="bg-mantis-500 px-4 py-2 rounded-md shadow-md text-white font-bold mx-4"
                onClick={saveDetail}>
                <p className="text-md">
                  <i className="fa fa-save" /> Save
                </p>
              </button>
            </div>
          </div>
        ) : detailFormVisible && !detailFormData._id ? (
          <div className="border-2 border-mantis-500 px-4 py-4 rounded-md shadow-md">
            <p className="text-lg font-bold">New Data</p>
            <div className="grid grid-cols-5 gap-2 mt-4">
              <div className="form-group">
                <label>Buyer</label>
                <select
                  className="form-control"
                  value={detailFormData.buyerId || ""}
                  onChange={e => {
                    if (e) e.preventDefault();
                    setDetailFormData({
                      ...detailFormData,
                      buyerId: e.target.value,
                    });
                  }}>
                  <option value="" disabled>
                    Select Buyer
                  </option>
                  {allBuyers.map(buyer => (
                    <option value={buyer._id}>
                      {buyer.code} - {buyer.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Wet Price</label>
                <NumberFormat
                  className="form-control"
                  value={detailFormData.wetPrice || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  // decimalScale={2}
                  // fixedDecimalScale={true}
                  onValueChange={e => {
                    // if (e) e.preventDefault();
                    setDetailFormData({
                      ...detailFormData,
                      wetPrice: e.floatValue,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>SMC1 Price</label>
                <NumberFormat
                  className="form-control"
                  value={detailFormData.smc1 || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  // decimalScale={2}
                  // fixedDecimalScale={true}
                  onValueChange={e => {
                    // if (e) e.preventDefault();
                    setDetailFormData({
                      ...detailFormData,
                      smc1: e.floatValue,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>SMC2 Price</label>
                <NumberFormat
                  className="form-control"
                  value={detailFormData.smc2 || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  // decimalScale={2}
                  // fixedDecimalScale={true}
                  onValueChange={e => {
                    // if (e) e.preventDefault();
                    setDetailFormData({
                      ...detailFormData,
                      smc2: e.floatValue,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>SMC3 Price</label>
                <NumberFormat
                  className="form-control"
                  value={detailFormData.smc3 || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  // decimalScale={2}
                  // fixedDecimalScale={true}
                  onValueChange={e => {
                    // if (e) e.preventDefault();
                    setDetailFormData({
                      ...detailFormData,
                      smc3: e.floatValue,
                    });
                  }}
                />
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <button
                className="bg-red-500 px-4 py-2 rounded-md shadow-md text-white font-bold"
                onClick={e => {
                  setDetailFormData({});
                  setDetailFormVisible(false);
                }}>
                <p className="text-md">
                  <i className="fa fa-times" /> Close
                </p>
              </button>
              <button
                className="bg-mantis-500 px-4 py-2 rounded-md shadow-md text-white font-bold mx-4"
                onClick={saveDetail}>
                <p className="text-md">
                  <i className="fa fa-save" /> Save
                </p>
              </button>
            </div>
          </div>
        ) : null}

        <Table
          loading={false}
          columns={detailColumns}
          data={priceDetails}
          withoutHeader={true}
          customUtilities={customUtilities}
          customUtilitiesPosition="left"
          onRemove={async ({ rows }) => {
            showLoadingSpinner();
            try {
              const currentHour = dayjs().get("hour");
              if (currentHour >= 15) {
                throw new Error("Exceed time limit to delete");
              }
              let yes = confirm(`Are you sure to delete ${rows.length} data ?`);

              if (yes) {
                for (const row of rows) {
                  const tokenizedInput = jwt.sign(
                    {
                      _id: row._id,
                    },
                    TOKENIZE,
                  );

                  await deleteDomesticCocoaPrice({
                    variables: {
                      tokenizedInput,
                    },
                  });
                }

                notification.addNotification({
                  title: "Success!",
                  message: `${rows.length} data deleted`,
                  level: "success",
                });
                // await refetch();
                setSavedCount((savedCount += 1));
                const tokenizedParams = jwt.sign(
                  {
                    date,
                    centreId: formData._id,
                  },
                  TOKENIZE,
                );

                const result = await client.query({
                  query: DETAIL_QUERY,
                  variables: {
                    tokenizedParams,
                  },
                  fetchPolicy: "no-cache",
                });

                const encryptedData =
                  result.data?.getDomesticPriceByCentreTokenized || "";
                if (encryptedData) {
                  const decrypted = jwt.verify(encryptedData, TOKENIZE);
                  setPriceDetail(decrypted.results);
                }
              }
            } catch (err) {
              notification.handleError(err);
            }
            hideLoadingSpinner();
          }}
        />

        {!detailFormVisible ? (
          <div className="flex justify-center">
            <button
              className={`bg-mantis-500 text-white font-bold rounded-md shadow-md px-4 py-2 mx-4 my-2`}
              onClick={e => {
                if (e) e.preventDefault();
                setDetailFormVisible(true);
                setDetailFormData({});
              }}>
              <i className="fa fa-plus" /> Add
            </button>
          </div>
        ) : null}
      </FormModal>

      <Calendar
        calendarType="US"
        className="!w-full rounded-md shadow-lg py-4 mb-4 border-2 border-mantis-500"
        activeStartDate={new Date(date)}
        onChange={e => {
          handleSelectDate(e);
          // setCalendarVisible(false);
        }}
        formatDay={(locale, date) => dayjs(date).format("DD")}
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

      <div className="my-2">
        <div className="grid grid-cols-4">
          <div>
            <p>Price on {dayjs(router.query.date).format("DD-MM-YYYY")}: </p>
          </div>
          <div>
            <p>
              Last Update on {dayjs(router.query.date).format("DD-MM-YYYY")}:{" "}
            </p>
            <p className="font-bold">{latestUpdateDomesticPriceAtDate}</p>
          </div>
          <div>
            <p>
              Last Pushed to MBC Web on{" "}
              {dayjs(router.query.date).format("DD-MM-YYYY")}:{" "}
            </p>
            <p className="font-bold">
              {latestUpdateDomesticPricePushedToWBCAtDate}
            </p>
          </div>
        </div>
      </div>

      <Table
        loading={false}
        columns={columns}
        data={allCentres}
        withoutHeader={true}
      />

      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">
          {countDomesticCocoaPrices || 0}
        </p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(PPEInput);
