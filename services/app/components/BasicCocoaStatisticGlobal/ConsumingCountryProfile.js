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
import dayjs from "dayjs";
import { Tab, Tabs, TabList, TabPanel } from "react-tabs";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const QUERY_ONCE = gql`
  query listQueries {
    allCountryRegionTokenized
    allGlobalSITCProductsTokenized
  }
`;

const QUERY_GLOBAL_COUNTRY_PROFILE_CONSUMING = gql`
query queryGlobalCountryProfile{
  allGlobalCountryProfileConsumingsTokenized
  countGlobalCountryProfileConsumings
}
`

const CREATE_CONSUMING_PROFILE = gql`
  mutation createGlobalCountryProfileConsumingTokenized(
    $tokenized: String!
  ) {
    createGlobalCountryProfileConsumingTokenized(
      tokenized: $tokenized
    )
  }
`;

const UPDATE_CONSUMING_PROFILE = gql`
  mutation updateGlobalCountryProfileConsumingTokenized(
    $tokenized: String!
  ) {
    updateGlobalCountryProfileConsumingTokenized(
      tokenized: $tokenized
    )
  }
`;

const DELETE_CONSUMING_PROFILE = gql`
  mutation deleteGlobalCountryProfileConsumingTokenized($tokenized: String!) {
    deleteGlobalCountryProfileConsumingTokenized(tokenized: $tokenized)
  }
`;

const CONSUMNG_COUNTRY_PROFILE_TRADE_QUERY = gql`
  query allGlobalCountryProfileConsumingTradeByCountryIdTokenized($tokenizedParams: String!) {
    allGlobalCountryProfileConsumingTradeByCountryIdTokenized(tokenizedParams: $tokenizedParams)
  }
`;

const CREATE_CONSUMING_TRADE = gql`
  mutation createGlobalCountryProfileConsumingTradeTokenized(
    $tokenized: String!
  ) {
    createGlobalCountryProfileConsumingTradeTokenized(
      tokenized: $tokenized
    )
  }
`;

const UPDATE_CONSUMING_TRADE = gql`
  mutation updateGlobalCountryProfileConsumingTradeTokenized(
    $tokenized: String!
  ) {
    updateGlobalCountryProfileConsumingTradeTokenized(
      tokenized: $tokenized
    )
  }
`;

const DELETE_CONSUMING_TRADE = gql`
  mutation deleteGlobalCountryProfileConsumingTradeTokenized($tokenized: String!) {
    deleteGlobalCountryProfileConsumingTradeTokenized(tokenized: $tokenized)
  }
`;

const CONSUMING_FILE_QUERY = gql`
  query countryConsumingFileTokenized($tokenizedParams: String!) {
    countryConsumingFileTokenized(tokenizedParams: $tokenizedParams)
  }
`;

const CREATE_UPLOAD_FILE = gql`
  mutation createCountryProfileConsumingFileTokenized(
    $tokenized: String!
  ) {
    createCountryProfileConsumingFileTokenized(
      tokenized: $tokenized
    )
  }
`;

const UPDATE_UPLOAD_FILE = gql`
  mutation updateCountryProfileConsumingFileTokenized(
    $tokenized: String!
  ) {
    updateCountryProfileConsumingFileTokenized(
      tokenized: $tokenized 
    )
  }
`;

const DELETE_UPLOAD_FILE = gql`
  mutation deleteCountryProfileConsumingFileTokenized($tokenized: String!) {
    deleteCountryProfileConsumingFileTokenized(tokenized: $tokenized)
  }
`;

const ConsumingCountryProfile = ({ currentUserDontHavePrivilege }) => {
  const router = useRouter();
  const client = useApolloClient()
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [cocoaTradeFormData, setCocoaTradeFormData] = useState({
    visible: false,
  });
  const [uploadFormData, setUploadFormData] = useState({
    visible: false,
  });

  const [modalVisible, setModalVisible] = useState(false);
  const { data, loading, error, refetch } = useQuery(QUERY_ONCE, {});
  const [tabIndex, setTabIndex] = useState(0);
  const [allCountries, setAllCountries] = useState([]);
  // const {
  //   data: tradeData,
  //   loading: tradeLoading,
  //   error: tradeError,
  //   refetch: tradeRefetch,
  // } = useQuery(CONSUMNG_COUNTRY_PROFILE_TRADE_QUERY, {
  //   variables: {
  //     countryId: formData.countryId || "",
  //   },
  // });

  // const {
  //   data: uploadData,
  //   loading: uploadLoading,
  //   error: uploadError,
  //   refetch: uploadRefetch,
  // } = useQuery(CONSUMING_FILE_QUERY, {
  //   variables: {
  //     countryId: formData.countryId || "",
  //   },
  // });

  const [createGlobalCountryProfileConsuming] = useMutation(
    CREATE_CONSUMING_PROFILE,
  );
  const [updateGlobalCountryProfileConsuming] = useMutation(
    UPDATE_CONSUMING_PROFILE,
  );
  const [deleteGlobalCountryProfileConsuming] = useMutation(
    DELETE_CONSUMING_PROFILE,
  );

  const [createGlobalCountryProfileConsumingTrade] = useMutation(
    CREATE_CONSUMING_TRADE,
  );
  const [updateGlobalCountryProfileConsumingTrade] = useMutation(
    UPDATE_CONSUMING_TRADE,
  );
  const [deleteGlobalCountryProfileConsumingTrade] = useMutation(
    DELETE_CONSUMING_TRADE,
  );

  //#### UPLOAD FILE ####
  const [createCountryProfileConsumingFile] = useMutation(CREATE_UPLOAD_FILE);
  const [updateCountryProfileConsumingFile] = useMutation(UPDATE_UPLOAD_FILE);
  const [deleteCountryProfileConsumingFile] = useMutation(DELETE_UPLOAD_FILE);

  //#### TOKENIZED QUERY ####
  let [refetchConsuming, setRefetchConsuming] = useState(0)
  let [refetchTrade, setRefetchTrade] = useState(0)
  let [refetchUpload, setRefetchUpload] = useState(0)
  let [allGlobalSITCProducts, setAllGlobalSITCProducts] = useState([])
  let [allCountryRegion, setAllCountryRegion] = useState([])

  let [allGlobalCountryProfileConsumings, setAllGlobalCountryProfileConsumings] = useState([])
  let [countGlobalCountryProfileConsumings, setCountGlobalCountryProfileConsumings] = useState(0)
  let [tradeData, setTradeData] = useState([])
  let [uploadData, setUploadData] = useState([])

  const fetchDataQueryOnce = async () => {
    const result = await client.query({
      query: QUERY_ONCE,
      fetchPolicy: "no-cache",
    });
    const encryptCountryRegion = result.data?.allCountryRegionTokenized
    if (encryptCountryRegion) {
      let CountryRegion = []
      const decrypted = jwt.verify(encryptCountryRegion, TOKENIZE);
      CountryRegion = decrypted.results
      setAllCountryRegion(CountryRegion)
    }
    const encryptGlobalSITCProducts = result.data?.allGlobalSITCProductsTokenized
    if (encryptGlobalSITCProducts) {
      let GlobalSITCProducts = []
      const decrypted = jwt.verify(encryptGlobalSITCProducts, TOKENIZE);
      GlobalSITCProducts = decrypted.results
      setAllGlobalSITCProducts(GlobalSITCProducts)
    }
  }
  useEffect(() => {
    fetchDataQueryOnce()
  }, [])

  const fetchDataGlobalCountryProfileConsumings = async () => {
    const result = await client.query({
      query: QUERY_GLOBAL_COUNTRY_PROFILE_CONSUMING,
      fetchPolicy: "no-cache",
    });
    const encryptGlobalCountryProfileConsumings = result.data?.allGlobalCountryProfileConsumingsTokenized
    if (encryptGlobalCountryProfileConsumings) {
      let GlobalCountryProfileConsumings = []
      const decrypted = jwt.verify(encryptGlobalCountryProfileConsumings, TOKENIZE);
      GlobalCountryProfileConsumings = decrypted.results
      setAllGlobalCountryProfileConsumings(GlobalCountryProfileConsumings)
    }
    setCountGlobalCountryProfileConsumings(result.data?.countGlobalCountryProfileConsumings)
  }
  useEffect(() => {
    fetchDataGlobalCountryProfileConsumings()
  }, [refetchConsuming])


  const fetchDataConsumingCountryProfileTrade = async () => {
    const payload = {
      countryId: formData.countryId || ""
    }
    let tokenizedParams = jwt.sign(payload, TOKENIZE);
    const result = await client.query({
      query: CONSUMNG_COUNTRY_PROFILE_TRADE_QUERY,
      variables: {
        tokenizedParams: tokenizedParams,
      },
      fetchPolicy: "no-cache",
    });
    const encryptTradeData = result.data?.allGlobalCountryProfileConsumingTradeByCountryIdTokenized
    if (encryptTradeData) {
      let TradeData = []
      const decrypted = jwt.verify(encryptTradeData, TOKENIZE);
      TradeData = decrypted.results
      setTradeData(TradeData)
    }
  }
  useEffect(() => {
    fetchDataConsumingCountryProfileTrade()
  }, [refetchTrade, formData.countryId])


  const fetchDataConsumingFileQuery = async () => {
    const payload = {
      countryId: formData.countryId || ""
    }
    let tokenizedParams = jwt.sign(payload, TOKENIZE);
    const result = await client.query({
      query: CONSUMING_FILE_QUERY,
      variables: {
        tokenizedParams: tokenizedParams,
      },
      fetchPolicy: "no-cache",
    });
    const encryptUploadData = result.data?.countryConsumingFileTokenized
    if (encryptUploadData) {
      let UploadData = []
      const decrypted = jwt.verify(encryptUploadData, TOKENIZE);
      UploadData = decrypted.results
      setUploadData(UploadData)
    }
  }
  useEffect(() => {
    fetchDataConsumingFileQuery()
  }, [refetchUpload, formData.countryId])

  // let allGlobalCountryProfileConsumings = [];
  // if (data?.allGlobalCountryProfileConsumings) {
  //   allGlobalCountryProfileConsumings = data.allGlobalCountryProfileConsumings;
  // }

  // let allGlobalSITCProducts = [];
  // if (data?.allGlobalSITCProducts) {
  //   allGlobalSITCProducts = data.allGlobalSITCProducts;
  // }

  // let allCountryRegion = [];
  // if (data?.allCountryRegion) {
  //   allCountryRegion = data.allCountryRegion;
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
              onClick={openDetails(propsTable.row.original)}
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg">
              <p className="text-white font-bold text-md font-bold">
                <i className="fa fa-pencil-alt " /> Edit
              </p>
            </button>
          </div>
        );
      },
    },
    // {
    //   label: "Details",
    //   icon: <i className="fa fa-eye" />,
    //   width: 400,
    //   render: propsTable => {
    //     return (
    //       <div className="flex">
    //         <button
    //           onClick={openDetails(propsTable.row.original)}
    //           className="mb-1 bg-blue-500 hover:bg-blue-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg">
    //           <p className="text-white font-bold text-md font-bold">
    //             <i className="fa fa-eye " /> Details
    //           </p>
    //         </button>
    //       </div>
    //     );
    //   },
    // },
  ]);

  const customUtilitiesTrade = useMemo(() => [
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
                setCocoaTradeFormData({
                  ...propsTable.row.original,
                  visible: true,
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

  const customUtilitiesUpload = useMemo(() => [
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
                setUploadFormData({
                  ...propsTable.row.original,
                  visible: true,
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

  const columns = useMemo(() => [
    {
      Header: "Country Region",
      accessor: "CountryRegion.description",
      style: {
        fontSize: 20,
      },
      // disableFilters: true,
    },
    {
      Header: "Country",
      accessor: "Country.name",
      style: {
        fontSize: 20,
      },
      // disableFilters: true,
    },
  ]);

  const cocoaTradeColumns = useMemo(() => [
    {
      Header: "Trade Type",
      accessor: "type",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Cocoa Type (Global SITC Product)",
      accessor: "GlobalSITCProduct.product",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Quantity",
      accessor: "quantity",
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
      Header: "Value",
      accessor: "value",
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

  const fileUploadColumns = useMemo(() => [
    {
      Header: "Type",
      accessor: "type",
      style: {
        fontSize: 20,
      },
      // disableFilters: true,
    },
    {
      Header: "Description",
      accessor: "description",
      style: {
        fontSize: 20,
      },
      Cell: props => {
        if (props.row.original.fileUrl) {
          return (
            <p className="text-blue-500">
              <a href={props.row.original.fileUrl} target="__blank">
                {props.value}
              </a>
            </p>
          );
        } else {
          return <div />;
        }
      },
    },
  ]);

  const openDetails = propsData => e => {
    const countryRegionId = propsData.CountryRegion?._id || "";
    const region = allCountryRegion.find(reg => reg._id === countryRegionId);

    setAllCountries(region?.Countries || []);
    setFormData({
      ...propsData,
      countryId: propsData.Country._id,
      countryRegionId: countryRegionId,
    });
    setCocoaTradeFormData({
      ...cocoaTradeFormData,
      countryId: propsData.Country._id,
      countryRegionId: countryRegionId,
    });

    setUploadFormData({
      ...uploadFormData,
      countryId: propsData.Country._id,
    });

    setModalVisible(true);
  };

  const handleSaveStatistic = async e => {
    showLoadingSpinner();
    try {
      let { _id, __typename, _createdAt, _updatedAt } = formData;

      if (!_id) {
        const payload = {
          ...formData,
          cultivatedArea: String(formData.cultivatedArea),
          production: String(formData.production),
          grindings: String(formData.grindings),
          chocolateManufacturing: String(formData.chocolateManufacturing),
          consumption: String(formData.consumption),
        }
        let tokenized = jwt.sign(payload, TOKENIZE);
        await createGlobalCountryProfileConsuming({
          variables: {
            tokenized
          },
        });
      } else {
        const payload = {
          ...formData,
          cultivatedArea: String(formData.cultivatedArea),
          production: String(formData.production),
          grindings: String(formData.grindings),
          chocolateManufacturing: String(formData.chocolateManufacturing),
          consumption: String(formData.consumption),
        }
        let tokenized = jwt.sign(payload, TOKENIZE);
        await updateGlobalCountryProfileConsuming({
          variables: {
            tokenized
          },
        });
      }
      setRefetchConsuming(refetchConsuming += 1)
      // await refetch();
      notification.addNotification({
        title: "Succeess!",
        message: `Country Profile Statistic saved!`,
        level: "success",
      });
      setModalVisible(false);
      setFormData({});
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  const handleSaveTradeData = async e => {
    showLoadingSpinner();
    try {
      let { _id, __typename, _createdAt, _updatedAt } = cocoaTradeFormData;

      if (!_id) {
        const payload = {
          ...cocoaTradeFormData,
          countryId: formData.countryId,
          countryRegionId: formData.countryRegionId,
        }
        let tokenized = jwt.sign(payload, TOKENIZE);
        await createGlobalCountryProfileConsumingTrade({
          variables: {
            tokenized
          },
        });
      } else {
        const payload = {
          ...cocoaTradeFormData,
          countryId: formData.countryId,
          countryRegionId: formData.countryRegionId,
        }
        let tokenized = jwt.sign(payload, TOKENIZE);
        await updateGlobalCountryProfileConsumingTrade({
          variables: {
            tokenized
          },
        });
      }
      setRefetchTrade(refetchTrade += 1)
      // await tradeRefetch();
      notification.addNotification({
        title: "Succeess!",
        message: `Cocoa Trade saved!`,
        level: "success",
      });
      setCocoaTradeFormData({
        visible: false,
      });
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  const handleSaveUploadData = async e => {
    if (e) e.preventDefault();
    showLoadingSpinner();
    try {
      let { _id, __typename, _createdAt, _updatedAt } = uploadFormData;
      if (!_id) {
        const payload = {
          ...uploadFormData,
          countryId: formData.countryId,
        }
        let tokenized = jwt.sign(payload, TOKENIZE);
        await createCountryProfileConsumingFile({
          variables: {
            tokenized
          },
        });
      } else {
        const payload = {
          ...uploadFormData,
          countryId: formData.countryId,
        }
        let tokenized = jwt.sign(payload, TOKENIZE);
        await updateCountryProfileConsumingFile({
          variables: {
            tokenized
          },
        });
      }
      setRefetchUpload(refetchUpload += 1)
      // await uploadRefetch();
      notification.addNotification({
        title: "Succeess!",
        message: `Cocoa Trade saved!`,
        level: "success",
      });
      setUploadFormData({
        visible: false,
      });
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };
  return (
    <div>
      <FormModal
        size={tabIndex !== 1 ? "md" : "lg"}
        title={`Country Profile Consuming`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({});
        }}>
        <div className="form-group">
          <label>Country Region</label>
          <select
            className="form-control w-1/2"
            value={formData.countryRegionId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              const found = allCountryRegion.find(
                reg => reg._id === e.target.value,
              );

              setFormData({
                ...formData,
                countryRegionId: e.target.value,
                countryId: "",
              });

              if (found) {
                setAllCountries(found.Countries);
              }
            }}>
            <option value="" disabled>
              Select Country Region
            </option>
            {allCountryRegion.map(region => (
              <option value={region._id}>{region.description}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Country</label>
          <select
            className="form-control w-1/2"
            value={formData.countryId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                countryId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Country
            </option>
            {allCountries.map(country => (
              <option value={country._id}>{country.name}</option>
            ))}
          </select>
        </div>

        <div className="mt-5">
          <Tabs
            selectedIndex={tabIndex}
            onSelect={index => {
              setTabIndex(index);
            }}>
            <TabList>
              <Tab>
                <p className="text-md font-semibold">Basic Statistic</p>
              </Tab>
              <Tab>
                <p className="text-md font-semibold">Cocoa Trade</p>
              </Tab>
              <Tab>
                <p className="text-md font-semibold">Upload</p>
              </Tab>
            </TabList>

            <TabPanel>
              <div className="grid grid-cols-6 gap-1">
                <div className="col-span-2 flex items-center">
                  <p className="text-md">Cultivated Area</p>
                </div>
                <div className="col-span-4">
                  <NumberFormat
                    className="form-control w-1/2"
                    value={formData.cultivatedArea || 0}
                    thousandSeparator={","}
                    // fixedDecimalScale={true}
                    // decimalSeparator={"."}
                    // decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();
                      setFormData({
                        ...formData,
                        cultivatedArea: e.floatValue,
                      });
                    }}
                  />
                </div>

                <div className="col-span-2 flex items-center">
                  <p className="text-md">Production</p>
                </div>
                <div className="col-span-4">
                  <NumberFormat
                    className="form-control w-1/2"
                    value={formData.production || 0}
                    thousandSeparator={","}
                    // fixedDecimalScale={true}
                    // decimalSeparator={"."}
                    // decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();
                      setFormData({
                        ...formData,
                        production: e.floatValue,
                      });
                    }}
                  />
                </div>

                <div className="col-span-2 flex items-center">
                  <p className="text-md">Grindings</p>
                </div>
                <div className="col-span-4">
                  <NumberFormat
                    className="form-control w-1/2"
                    value={formData.grindings || 0}
                    thousandSeparator={","}
                    // fixedDecimalScale={true}
                    // decimalSeparator={"."}
                    // decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();
                      setFormData({
                        ...formData,
                        grindings: e.floatValue,
                      });
                    }}
                  />
                </div>
                <div className="col-span-2 flex items-center">
                  <p className="text-md">Chocolate Manufacturing</p>
                </div>
                <div className="col-span-4">
                  <NumberFormat
                    className="form-control w-1/2"
                    value={formData.chocolateManufacturing || 0}
                    thousandSeparator={","}
                    // fixedDecimalScale={true}
                    // decimalSeparator={"."}
                    // decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();
                      setFormData({
                        ...formData,
                        chocolateManufacturing: e.floatValue,
                      });
                    }}
                  />
                </div>

                <div className="col-span-2 flex items-center">
                  <p className="text-md">Consumption</p>
                </div>
                <div className="col-span-4">
                  <NumberFormat
                    className="form-control w-1/2"
                    value={formData.consumption || 0}
                    thousandSeparator={","}
                    // fixedDecimalScale={true}
                    // decimalSeparator={"."}
                    // decimalScale={2}
                    onValueChange={e => {
                      // if (e) e.preventDefault();
                      setFormData({
                        ...formData,
                        consumption: e.floatValue,
                      });
                    }}
                  />
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <button
                  className="bg-mantis-500 px-4 py-2 shadow-md rounded-md"
                  onClick={handleSaveStatistic}>
                  <p className="text-md font-bold text-white">
                    <i className="fa fa-save" /> Save Profile
                  </p>
                </button>
              </div>
            </TabPanel>
            <TabPanel>
              {cocoaTradeFormData.visible ? (
                <div className="mb-2 border border-red-500 rounded-md shadow-md px-4 py-2">
                  <div className="grid grid-cols-6 gap-1">
                    <div className="flex items-center">
                      <p className="text-md">Type</p>
                    </div>
                    <div className="col-span-5">
                      <select
                        className="form-control w-1/2"
                        value={cocoaTradeFormData.type || ""}
                        onChange={e => {
                          if (e) e.preventDefault();
                          setCocoaTradeFormData({
                            ...cocoaTradeFormData,
                            type: e.target.value,
                          });
                        }}>
                        <option value="" disabled>
                          Select Type
                        </option>
                        <option value="Export">Export</option>
                        <option value="Import">Import</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <p className="text-md">Product</p>
                    </div>
                    <div className="col-span-5">
                      <select
                        className="form-control w-1/2"
                        value={cocoaTradeFormData.globalSITCProductId || ""}
                        onChange={e => {
                          if (e) e.preventDefault();
                          setCocoaTradeFormData({
                            ...cocoaTradeFormData,
                            globalSITCProductId: e.target.value,
                          });
                        }}>
                        <option value="" disabled>
                          Select Product Type
                        </option>
                        {allGlobalSITCProducts.map(prod => (
                          <option value={prod._id}>{prod.product}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center">
                      <p className="text-md">Quantity (Tonne)</p>
                    </div>
                    <div className="col-span-5">
                      <NumberFormat
                        className="form-control w-1/2"
                        value={cocoaTradeFormData.quantity || 0}
                        thousandSeparator={"."}
                        decimalSeparator={","}
                        decimalScale={2}
                        fixedDecimalScale={true}
                        onValueChange={e => {
                          // if (e) e.preventDefault();
                          setCocoaTradeFormData({
                            ...cocoaTradeFormData,
                            quantity: e.floatValue,
                          });
                        }}
                      />
                    </div>
                    <div className="flex items-center">
                      <p className="text-md">Value</p>
                    </div>
                    <div className="col-span-5">
                      <NumberFormat
                        className="form-control w-1/2"
                        value={cocoaTradeFormData.value || 0}
                        thousandSeparator={"."}
                        decimalSeparator={","}
                        onValueChange={e => {
                          // if (e) e.preventDefault();
                          setCocoaTradeFormData({
                            ...cocoaTradeFormData,
                            value: e.floatValue,
                          });
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-center mt-4">
                    <button
                      className="bg-mantis-500 px-4 py-2 shadow-md rounded-md"
                      onClick={handleSaveTradeData}>
                      <p className="text-md font-bold text-white">
                        <i className="fa fa-save" /> Save Trade Data
                      </p>
                    </button>
                  </div>
                </div>
              ) : null}
              <Table
                loading={false}
                columns={cocoaTradeColumns}
                data={
                  tradeData ||
                  []
                }
                withoutHeader={true}
                onAdd={e => {
                  if (e) e.preventDefault();
                  setCocoaTradeFormData({
                    visible: true,
                  });
                }}
                customUtilities={customUtilitiesTrade}
                customUtilitiesPosition="left"
                onRemove={async ({ rows }) => {
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
                        await deleteGlobalCountryProfileConsumingTrade({
                          variables: {
                            tokenized
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} data deleted`,
                        level: "success",
                      });
                      setRefetchTrade(refetchTrade += 1)
                      // await tradeRefetch();
                    }
                  } catch (err) {
                    handleError(err);
                  }
                  hideLoadingSpinner();
                }}
              />
            </TabPanel>
            <TabPanel>
              {uploadFormData.visible ? (
                <div className="mb-2 border border-red-500 rounded-md shadow-md px-4 py-2">
                  <div className="grid grid-cols-6 gap-1">
                    <div className="flex items-center">
                      <p className="text-md">Type</p>
                    </div>
                    <div className="col-span-5">
                      <select
                        className="form-control w-1/2"
                        value={uploadFormData.type || ""}
                        onChange={e => {
                          if (e) e.preventDefault();
                          setUploadFormData({
                            ...uploadFormData,
                            type: e.target.value,
                          });
                        }}>
                        <option value="" disabled>
                          Select Type
                        </option>
                        <option value="Tariff">Tariff</option>
                        <option value="Market Analysis">Market Analysis</option>
                        <option value="Market Access">Market Access</option>
                      </select>
                    </div>
                    <div className="flex items-center">
                      <p className="text-md">Description</p>
                    </div>
                    <div className="col-span-5">
                      <input
                        className="form-control"
                        value={uploadFormData.description || ""}
                        onChange={e => {
                          if (e) e.preventDefault();
                          setUploadFormData({
                            ...uploadFormData,
                            description: e.target.value,
                          });
                        }}
                      />
                    </div>

                    <div className="flex items-center">
                      <p className="text-md">File</p>
                    </div>
                    <div className="col-span-5">
                      <input
                        type="file"
                        accept="*"
                        className="form-control"
                        required
                        // value={documentData.url}
                        onChange={e => {
                          if (e) e.preventDefault();
                          const file = e.target.files[0];

                          let reader = new FileReader();
                          reader.onloadend = async () => {
                            setUploadFormData({
                              ...uploadFormData,
                              fileUrl: reader.result,
                            });
                            // console.log(reader)
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex justify-center mt-4">
                    <button
                      className="bg-mantis-500 px-4 py-2 shadow-md rounded-md"
                      onClick={handleSaveUploadData}>
                      <p className="text-md font-bold text-white">
                        <i className="fa fa-save" /> Save Upload File
                      </p>
                    </button>
                  </div>
                </div>
              ) : null}
              <Table
                loading={false}
                columns={fileUploadColumns}
                data={uploadData || []}
                withoutHeader={true}
                onAdd={e => {
                  if (e) e.preventDefault();
                  setUploadFormData({
                    visible: true,
                  });
                }}
                customUtilities={customUtilitiesUpload}
                customUtilitiesPosition="left"
                onRemove={async ({ rows }) => {
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
                        await deleteCountryProfileConsumingFile({
                          variables: {
                            tokenized
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} data deleted`,
                        level: "success",
                      });
                      setRefetchUpload(refetchUpload += 1)
                      // await uploadRefetch();
                    }
                  } catch (err) {
                    handleError(err);
                  }
                  hideLoadingSpinner();
                }}
              />
            </TabPanel>
          </Tabs>
        </div>
      </FormModal>
      <Table
        loading={loading}
        columns={columns}
        data={allGlobalCountryProfileConsumings}
        withoutHeader={true}
        customUtilities={
          currentUserDontHavePrivilege(["BCS Global Country Profile:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
        onAdd={
          currentUserDontHavePrivilege(["BCS Global Country Profile:Create"])
            ? null
            : e => {
              if (e) e.preventDefault();
              setModalVisible(true);
              setFormData({});
              setTradeData([])
              setUploadData([])
            }
        }
        onRemove={
          currentUserDontHavePrivilege(["BCS Global Country Profile:Delete"])
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
                    await deleteGlobalCountryProfileConsuming({
                      variables: {
                        tokenized
                      },
                    });
                  }
                  notification.addNotification({
                    title: "Success!",
                    message: `${rows.length} data deleted`,
                    level: "success",
                  });
                  setRefetchConsuming(refetchConsuming += 1)
                  // await refetch();
                }
              } catch (err) {
                handleError(err);
              }
              hideLoadingSpinner();
            }
        }
      />
      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">
          {countGlobalCountryProfileConsumings || 0}
        </p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(ConsumingCountryProfile);
