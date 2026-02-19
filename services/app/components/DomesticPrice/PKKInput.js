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

const TOKENIZED_QUERY = gql`
  query listQueries($date: String!) {
    domesticPriceByCentrePerMonthTokenized(date: $date)
  }
`;

const GET_TEMPORARY_PRICE = gql`
  query getDomesticPriceByCentreTemporaryTokenized(
    $tokenizedParamsQuery: String!
  ) {
    getDomesticPriceByCentreTemporaryTokenized(
      tokenizedParamsQuery: $tokenizedParamsQuery
    )
  }
`;

const GET_FIXED_PRICE_TOKENIZED = gql`
  query getDomesticPriceByCentre($tokenizedParams: String!) {
    getDomesticPriceByCentreTokenized(tokenizedParams: $tokenizedParams)
  }
`;

const CHECK_TEMPORARY_PRICE = gql`
  query checkTemporaryPrice {
    checkTemporaryPrice
  }
`;

const BUYER_BY_CENTRE_TOKENIZED = gql`
  query allBuyersByCentreId($tokenizedParams: String!) {
    allBuyersByCentreIdTokenized(tokenizedParams: $tokenizedParams)
  }
`;

const CREATE_TEMPORARY_DOMESTIC_PRICE_TOKENIZED = gql`
  mutation createDomesticCocoaPriceTemporaryTokenized(
    $tokenizedInput: String!
  ) {
    createDomesticCocoaPriceTemporaryTokenized(tokenizedInput: $tokenizedInput)
  }
`;

const UPDATE_TEMPORARY_DOMESTIC_PRICE = gql`
  mutation updateDomesticCocoaPriceTemporaryTokenized(
    $tokenizedInput: String!
  ) {
    updateDomesticCocoaPriceTemporaryTokenized(tokenizedInput: $tokenizedInput)
  }
`;

const DELETE_TEMPORARY_TOKENIZED = gql`
  mutation deleteDomesticCocoaPriceTemporaryTokenized(
    $tokenizedInput: String!
  ) {
    deleteDomesticCocoaPriceTemporaryTokenized(tokenizedInput: $tokenizedInput)
  }
`;

const PKKInput = ({ currentUserDontHavePrivilege }) => {
  const notification = useNotification();

  const router = useRouter();
  const client = useApolloClient();
  const date = router.query.date || dayjs().format("YYYY-MM-DD");
  const [formData, setFormData] = useState({});
  const [addEditVisible, setAddEditVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [allBuyers, setBuyers] = useState([]);
  const [pricesList, setPricesList] = useState([]);
  const [isFixed, setIsFixed] = useState(false);
  const [allCentres, setAllCentres] = useState([]);
  let [savedCount, setSavedCount] = useState(0);

  const [loading, setLoading] = useState(false);

  const [createDomesticCocoaPriceTemporary] = useMutation(
    CREATE_TEMPORARY_DOMESTIC_PRICE_TOKENIZED,
  );
  const [updateDomesticCocoaPriceTemporary] = useMutation(
    UPDATE_TEMPORARY_DOMESTIC_PRICE,
  );
  const [deleteDomesticCocoaPriceTemporary] = useMutation(
    DELETE_TEMPORARY_TOKENIZED,
  );

  const fetchData = async (date) => {
    const result = await client.query({
      query: TOKENIZED_QUERY,
      variables: {
        date,
      },
      fetchPolicy: "no-cache",
    });

    const encryptedCentres =
      result.data?.domesticPriceByCentrePerMonthTokenized || "";
    let allCentres = [];
    if (encryptedCentres) {
      const decrypted = jwt.verify(encryptedCentres, TOKENIZE);
      allCentres = decrypted.results;
      setAllCentres(allCentres);
    }
  }
  useEffect(() => {
    showLoadingSpinner();
    try {
      setLoading(true);
      fetchData(date)
      setLoading(false);
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  }, [date, savedCount]);
  // let allCentres = [];
  // if (data?.domesticPriceByCentrePerMonth) {
  //   allCentres = data.domesticPriceByCentrePerMonth;
  // }
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

                setFormData({
                  ...propsTable.row.original,
                  buyerId: propsTable.row.original?.Buyer?._id || "",
                  centreId: propsTable.row.original?.Centre?._id || "",
                });
                setAddEditVisible(true);
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
            "Input From PKK:Create",
            "Input From PKK:Update",
            "Input From PKK:Delete",
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

  const priceColumns = useMemo(() => [
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
    },
    {
      Header: "SMC1 Price",
      accessor: "smc1",
      style: {
        fontSize: 18,
      },
    },
    {
      Header: "SMC2 Price",
      accessor: "smc2",
      style: {
        fontSize: 18,
      },
    },
    {
      Header: "SMC3 Price",
      accessor: "smc3",
      style: {
        fontSize: 18,
      },
    },
  ]);

  const openCentre = centre => async e => {
    // console.log({ centre, date });
    const currentHour = dayjs().get("hour");
    showLoadingSpinner();
    try {
      let prices = [];
      if (currentHour >= 15) {
        //Check if there is temporary, then save it first
        await client.query({
          query: CHECK_TEMPORARY_PRICE,
          variables: {},
          fetchPolicy: "no-cache",
        });

        // const tmp = await client.query({
        //   query: GET_FIXED_PRICE,
        //   variables: {
        //     date,
        //     centreId: centre._id,
        //   },
        //   fetchPolicy: "no-cache",
        // });
        // prices = tmp.data.getDomesticPriceByCentre;
        // prices = prices.map(p => {
        //   return {
        //     ...p,
        //     type: "FIXED",
        //   };
        // });

        const tokenizedParams = jwt.sign(
          {
            date,
            centreId: centre._id,
          },
          TOKENIZE,
        );
        const tmp = await client.query({
          query: GET_FIXED_PRICE_TOKENIZED,
          variables: {
            tokenizedParams,
          },
          fetchPolicy: "no-cache",
        });

        const encryptedData = tmp.data?.getDomesticPriceByCentreTokenized || "";
        if (encryptedData) {
          const decrypted = jwt.verify(encryptedData, TOKENIZE);
          prices = decrypted.results;
          prices = prices.map(p => {
            return {
              ...p,
              type: "FIXED",
            };
          });
        }

        setSavedCount((savedCount += 1));
        setIsFixed(true);
      } else {
        //Today but return with temporary data
        const tokenizedParamsQuery = jwt.sign(
          {
            date,
            centreId: centre._id,
          },
          TOKENIZE,
        );

        const tmp = await client.query({
          query: GET_TEMPORARY_PRICE,
          variables: {
            tokenizedParamsQuery,
          },
          fetchPolicy: "no-cache",
        });

        const encryptedData =
          tmp.data?.getDomesticPriceByCentreTemporaryTokenized || "";
        if (encryptedData) {
          const decrypted = jwt.verify(encryptedData, TOKENIZE);
          prices = decrypted.results;
          prices = prices.map(p => {
            return {
              ...p,
              type: "TEMPORARY",
            };
          });
        }
        setIsFixed(false);
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
      setFormData({
        Centre: centre,
      });
      setPricesList(prices);
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  const handleSaveTemporary = async e => {
    showLoadingSpinner();
    try {
      const currentHour = dayjs().get("hour");
      if (currentHour >= 15) {
        throw new Error(
          "Exceed time limit to input. Max time to input is   15:00",
        );
      }
      if (formData._id) {
        const tokenizedInput = jwt.sign(
          {
            _id: formData._id,
            date,
            buyerId: formData.buyerId,
            centreId: formData.Centre._id,
            wetPrice: formData.wetPrice || 0,
            smc1: formData.smc1 || 0,
            smc2: formData.smc2 || 0,
            smc3: formData.smc3 || 0,
          },
          TOKENIZE,
        );

        await updateDomesticCocoaPriceTemporary({
          variables: {
            tokenizedInput,
          },
        });
      } else {
        const tokenizedInput = jwt.sign(
          {
            date,
            buyerId: formData.buyerId,
            centreId: formData.Centre._id,
            wetPrice: formData.wetPrice || 0,
            smc1: formData.smc1 || 0,
            smc2: formData.smc2 || 0,
            smc3: formData.smc3 || 0,
          },
          TOKENIZE,
        );
        await createDomesticCocoaPriceTemporary({
          variables: {
            tokenizedInput,
          },
        });
      }

      setSavedCount((savedCount += 1));

      //Fetch temporary data
      let prices = [];
      const tokenizedParamsQuery = jwt.sign(
        {
          date,
          centreId: formData.Centre._id,
        },
        TOKENIZE,
      );
      const tmp = await client.query({
        query: GET_TEMPORARY_PRICE,
        variables: {
          tokenizedParamsQuery,
        },
        fetchPolicy: "no-cache",
      });

      const encryptedData =
        tmp.data?.getDomesticPriceByCentreTemporaryTokenized || "";
      if (encryptedData) {
        const decrypted = jwt.verify(encryptedData, TOKENIZE);
        prices = decrypted.results;
        prices = prices.map(p => {
          return {
            ...p,
            type: "TEMPORARY",
          };
        });
      }

      setPricesList(prices);
      setAddEditVisible(false);
      setFormData({
        Centre: formData.Centre,
      });

      notification.addNotification({
        title: "Succeess!",
        message: `Price Saved!`,
        level: "success",
      });
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  const getAllPrice = (activeStartDate, date, view) => {
    // const getYear = dayjs(date).get("year");
    // const getMonth = dayjs(date).get("month") + 1;
    // const getDate = dayjs(date).get("date");
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
  };
  return (
    <div className="mt-10">
      <FormModal
        title={`Domestic Cocoa Price Input`}
        visible={modalVisible}
        size="lg"
        onClose={async e => {
          if (e) e.preventDefault();
          setSavedCount((savedCount += 1));

          setModalVisible(false);
          setFormData({});
          setBuyers([]);
          setAddEditVisible(false);
        }}>
        <div className="grid grid-cols-4 gap-2">
          <div className="form-group">
            <label>Date</label>
            <input
              className="form-control bg-gray-200"
              type="date"
              disabled
              value={date}
            />
          </div>
          <div className="form-group">
            <label>Centre</label>
            <input
              className="form-control bg-gray-200"
              disabled
              value={formData?.Centre?.description || ""}
            />
          </div>
        </div>
        {addEditVisible ? (
          <div className="border-2 border-mantis-500 px-4 py-4 rounded-md shadow-md mt-2">
            <p className="text-lg font-bold">
              {formData._id ? "Edit Data" : "New Data"}
            </p>
            <div className="grid grid-cols-5 gap-2 mt-4">
              <div className="form-group">
                <label>Buyer</label>
                <select
                  className="form-control"
                  value={formData.buyerId || ""}
                  onChange={e => {
                    if (e) e.preventDefault();
                    setFormData({
                      ...formData,
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
                  value={formData.wetPrice || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  // decimalScale={2}
                  // fixedDecimalScale={true}
                  onValueChange={e => {
                    // if (e) e.preventDefault();
                    setFormData({
                      ...formData,
                      wetPrice: e.floatValue,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>SMC1 Price</label>
                <NumberFormat
                  className="form-control"
                  value={formData.smc1 || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  // decimalScale={2}
                  // fixedDecimalScale={true}
                  onValueChange={e => {
                    // if (e) e.preventDefault();
                    setFormData({
                      ...formData,
                      smc1: e.floatValue,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>SMC2 Price</label>
                <NumberFormat
                  className="form-control"
                  value={formData.smc2 || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  // decimalScale={2}
                  // fixedDecimalScale={true}
                  onValueChange={e => {
                    // if (e) e.preventDefault();
                    setFormData({
                      ...formData,
                      smc2: e.floatValue,
                    });
                  }}
                />
              </div>
              <div className="form-group">
                <label>SMC3 Price</label>
                <NumberFormat
                  className="form-control"
                  value={formData.smc3 || ""}
                  thousandSeparator={","}
                  decimalSeparator={"."}
                  // decimalScale={2}
                  // fixedDecimalScale={true}
                  onValueChange={e => {
                    // if (e) e.preventDefault();
                    setFormData({
                      ...formData,
                      smc3: e.floatValue,
                    });
                  }}
                />
              </div>
            </div>
          </div>
        ) : null}
        <Table
          loading={false}
          columns={priceColumns}
          data={pricesList}
          withoutHeader={true}
          customUtilities={isFixed ? null : customUtilities}
          onRemove={
            isFixed
              ? null
              : async ({ rows }) => {
                showLoadingSpinner();
                const currentHour = dayjs().get("hour");
                try {
                  if (currentHour >= 15) {
                    throw new Error("Exceed time limit to delete");
                  }
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} data ?`,
                  );
                  if (yes) {
                    for (const row of rows) {
                      const tokenizedInput = jwt.sign(
                        {
                          _id: row._id,
                        },
                        TOKENIZE,
                      );

                      await deleteDomesticCocoaPriceTemporary({
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
                    setSavedCount((savedCount += 1));

                    //Fetch temporary data
                    let prices = [];

                    const tokenizedParamsQuery = jwt.sign(
                      {
                        date,
                        centreId: formData.Centre._id,
                      },
                      TOKENIZE,
                    );

                    const tmp = await client.query({
                      query: GET_TEMPORARY_PRICE,
                      variables: {
                        tokenizedParamsQuery,
                      },
                      fetchPolicy: "no-cache",
                    });

                    const encryptedData =
                      tmp.data?.getDomesticPriceByCentreTemporaryTokenized ||
                      "";
                    if (encryptedData) {
                      const decrypted = jwt.verify(encryptedData, TOKENIZE);
                      prices = decrypted.results;
                      prices = prices.map(p => {
                        return {
                          ...p,
                          type: "TEMPORARY",
                        };
                      });
                    }
                    setPricesList(prices);
                  }
                } catch (err) {
                  handleError(err);
                }
                hideLoadingSpinner();
              }
          }
        />

        <hr className="border-1  border-gray-400 my-2" />
        {addEditVisible ? (
          <div className="flex justify-center">
            <button
              className="bg-red-500 text-white font-bold rounded-md shadow-md px-4 py-2 mx-4"
              onClick={e => {
                if (e) e.preventDefault();
                setAddEditVisible(false);
              }}>
              <i className="fa fa-times" /> Cancel
            </button>
            <button
              className="bg-mantis-500 text-white font-bold rounded-md shadow-md px-4 py-2 mx-4"
              onClick={handleSaveTemporary}>
              <i className="fa fa-save" /> Save
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button
              className="bg-red-500 text-white font-bold rounded-md shadow-md px-4 py-2 mx-4"
              onClick={async e => {
                if (e) e.preventDefault();
                setSavedCount((savedCount += 1));
                setModalVisible(false);
                setFormData({});
                setBuyers([]);
                setAddEditVisible(false);
              }}>
              <i className="fa fa-times" /> Close
            </button>
            <button
              className={`bg-mantis-500 text-white font-bold rounded-md shadow-md px-4 py-2 mx-4`}
              onClick={e => {
                if (e) e.preventDefault();
                setAddEditVisible(true);
              }}>
              <i className="fa fa-plus" /> Add
            </button>
          </div>
        )}
      </FormModal>
      <Calendar
        calendarType="US"
        className="!w-full rounded-md shadow-lg py-4 mb-4 border-2 border-mantis-500"
        activeStartDate={new Date(date)}
        formatDay={(locale, date) => dayjs(date).format("DD")}
        tileClassName={
          ({ activeStartDate, date, view }) => {
            return "relative";
          }
          // getAgendaAll(activeStartDate, date, view)
        }
        tileContent={({ activeStartDate, date, view }) => {
          return getAllPrice(activeStartDate, date, view);
        }}
      />
      <Table
        loading={false}
        columns={columns}
        data={allCentres}
        withoutHeader={true}
      />
    </div>
  );
};
export default withApollo({ ssr: true })(PKKInput);
