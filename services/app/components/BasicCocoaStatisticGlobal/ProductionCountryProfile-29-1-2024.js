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

const LIST_QUERIES = gql`
  query listQueries {
    allGlobalCountryProfileProducings {
      _id
      Country {
        _id
        name
      }
      CountryRegion {
        _id
        description
      }
      cultivatedArea
      production
      grindings
      chocolateManufacturing
      consumption
    }

    allCountryRegion {
      _id
      description
      Countries {
        _id
        name
      }
    }

    allGlobalSITCProducts {
      _id
      gsitcCode
      product
    }
    countGlobalCountryProfileProducings
  }
`;

const CREATE_PRODUCING_PROFILE = gql`
  mutation createGlobalCountryProfileProducing(
    $countryId: String
    $countryRegionId: String
    $cultivatedArea: String
    $production: String
    $grindings: String
    $chocolateManufacturing: String
    $consumption: String
  ) {
    createGlobalCountryProfileProducing(
      countryId: $countryId
      countryRegionId: $countryRegionId
      cultivatedArea: $cultivatedArea
      production: $production
      grindings: $grindings
      chocolateManufacturing: $chocolateManufacturing
      consumption: $consumption
    )
  }
`;

const UPDATE_PRODUCING_PROFILE = gql`
  mutation updateGlobalCountryProfileProducing(
    $_id: String!
    $countryId: String
    $countryRegionId: String
    $cultivatedArea: String
    $production: String
    $grindings: String
    $chocolateManufacturing: String
    $consumption: String
  ) {
    updateGlobalCountryProfileProducing(
      _id: $_id
      countryId: $countryId
      countryRegionId: $countryRegionId
      cultivatedArea: $cultivatedArea
      production: $production
      grindings: $grindings
      chocolateManufacturing: $chocolateManufacturing
      consumption: $consumption
    )
  }
`;

const DELETE_PRODUCING_PROFILE = gql`
  mutation deleteGlobalCountryProfileProducing($_id: String!) {
    deleteGlobalCountryProfileProducing(_id: $_id)
  }
`;

const CONSUMING_COUNTRY_PROFILE_TRADE_QUERY = gql`
  query allGlobalCountryProfileProducingTradeByCountryId($countryId: String!) {
    allGlobalCountryProfileProducingTradeByCountryId(countryId: $countryId) {
      _id
      GlobalSITCProduct {
        _id
        code
        product
      }
      quantity
      type
      value
    }
  }
`;

const CREATE_PRODUCING_TRADE = gql`
  mutation createGlobalCountryProfileProducingTrade(
    $countryId: String
    $countryRegionId: String
    $globalSITCProductId: String
    $quantity: Float
    $type: String
    $value: Float
  ) {
    createGlobalCountryProfileProducingTrade(
      countryId: $countryId
      countryRegionId: $countryRegionId
      globalSITCProductId: $globalSITCProductId
      quantity: $quantity
      type: $type
      value: $value
    )
  }
`;

const UPDATE_PRODUCING_TRADE = gql`
  mutation updateGlobalCountryProfileProducingTrade(
    $_id: String!
    $countryId: String
    $countryRegionId: String
    $globalSITCProductId: String
    $quantity: Float
    $type: String
    $value: Float
  ) {
    updateGlobalCountryProfileProducingTrade(
      _id: $_id
      countryId: $countryId
      countryRegionId: $countryRegionId
      globalSITCProductId: $globalSITCProductId
      quantity: $quantity
      type: $type
      value: $value
    )
  }
`;

const DELETE_PRODUCING_TRADE = gql`
  mutation deleteGlobalCountryProfileProducingTrade($_id: String!) {
    deleteGlobalCountryProfileProducingTrade(_id: $_id)
  }
`;

const PRODUCING_FILE_QUERY = gql`
  query countryProducingFile($countryId: String!) {
    countryProducingFile(countryId: $countryId) {
      _id
      countryId
      type
      description
      fileUrl
    }
  }
`;

const CREATE_UPLOAD_FILE = gql`
  mutation createCountryProfileProducingFile(
    $countryId: String
    $type: String
    $description: String
    $fileUrl: String
  ) {
    createCountryProfileProducingFile(
      countryId: $countryId
      type: $type
      description: $description
      fileUrl: $fileUrl
    )
  }
`;

const UPDATE_UPLOAD_FILE = gql`
  mutation updateCountryProfileProducingFile(
    $_id: String!
    $countryId: String
    $type: String
    $description: String
    $fileUrl: String
  ) {
    updateCountryProfileProducingFile(
      _id: $_id
      countryId: $countryId
      type: $type
      description: $description
      fileUrl: $fileUrl
    )
  }
`;

const DELETE_UPLOAD_FILE = gql`
  mutation deleteCountryProfileProducingFile($_id: String!) {
    deleteCountryProfileProducingFile(_id: $_id)
  }
`;
const ProducingCountryProfile = ({ currentUserDontHavePrivilege }) => {
  const router = useRouter();
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [cocoaTradeFormData, setCocoaTradeFormData] = useState({
    visible: false,
  });

  const [uploadFormData, setUploadFormData] = useState({
    visible: false,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const { data, loading, error, refetch } = useQuery(LIST_QUERIES, {});
  const [tabIndex, setTabIndex] = useState(0);
  const [allCountries, setAllCountries] = useState([]);
  const {
    data: tradeData,
    loading: tradeLoading,
    error: tradeError,
    refetch: tradeRefetch,
  } = useQuery(CONSUMING_COUNTRY_PROFILE_TRADE_QUERY, {
    variables: {
      countryId: formData.countryId || "",
    },
  });

  const {
    data: uploadData,
    loading: uploadLoading,
    error: uploadError,
    refetch: uploadRefetch,
  } = useQuery(PRODUCING_FILE_QUERY, {
    variables: {
      countryId: formData.countryId || "",
    },
  });

  const [createGlobalCountryProfileProducing] = useMutation(
    CREATE_PRODUCING_PROFILE,
  );
  const [updateGlobalCountryProfileProducing] = useMutation(
    UPDATE_PRODUCING_PROFILE,
  );
  const [deleteGlobalCountryProfileProducing] = useMutation(
    DELETE_PRODUCING_PROFILE,
  );

  //##### TRADE #####
  const [createGlobalCountryProfileProducingTrade] = useMutation(
    CREATE_PRODUCING_TRADE,
  );
  const [updateGlobalCountryProfileProducingTrade] = useMutation(
    UPDATE_PRODUCING_TRADE,
  );
  const [deleteGlobalCountryProfileProducingTrade] = useMutation(
    DELETE_PRODUCING_TRADE,
  );

  //#### UPLOAD FILE ####
  const [createCountryProfileProducingFile] = useMutation(CREATE_UPLOAD_FILE);
  const [updateCountryProfileProducingFile] = useMutation(UPDATE_UPLOAD_FILE);
  const [deleteCountryProfileProducingFile] = useMutation(DELETE_UPLOAD_FILE);

  let allGlobalCountryProfileProducings = [];
  if (data?.allGlobalCountryProfileProducings) {
    allGlobalCountryProfileProducings = data.allGlobalCountryProfileProducings;
  }

  let allGlobalSITCProducts = [];
  if (data?.allGlobalSITCProducts) {
    allGlobalSITCProducts = data.allGlobalSITCProducts;
  }

  let allCountryRegion = [];
  if (data?.allCountryRegion) {
    allCountryRegion = data.allCountryRegion;
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
        await createGlobalCountryProfileProducing({
          variables: {
            ...formData,
            cultivatedArea: String(formData.cultivatedArea),
            production: String(formData.production),
            grindings: String(formData.grindings),
            chocolateManufacturing: String(formData.chocolateManufacturing),
            consumption: String(formData.consumption),
          },
        });
      } else {
        await updateGlobalCountryProfileProducing({
          variables: {
            ...formData,
            cultivatedArea: String(formData.cultivatedArea),
            production: String(formData.production),
            grindings: String(formData.grindings),
            chocolateManufacturing: String(formData.chocolateManufacturing),
            consumption: String(formData.consumption),
          },
        });
      }
      await refetch();
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
        await createGlobalCountryProfileProducingTrade({
          variables: {
            ...cocoaTradeFormData,
            countryId: formData.countryId,
            countryRegionId: formData.countryRegionId,
          },
        });
      } else {
        await updateGlobalCountryProfileProducingTrade({
          variables: {
            ...cocoaTradeFormData,
            countryId: formData.countryId,
            countryRegionId: formData.countryRegionId,
          },
        });
      }
      await tradeRefetch();
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
        await createCountryProfileProducingFile({
          variables: {
            ...uploadFormData,
            countryId: formData.countryId,
          },
        });
      } else {
        await updateCountryProfileProducingFile({
          variables: {
            ...uploadFormData,
            countryId: formData.countryId,
          },
        });
      }
      await uploadRefetch();
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
        title={`Country Profile Producing`}
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
                      <p className="text-md">Quantity</p>
                    </div>
                    <div className="col-span-5">
                      <NumberFormat
                        className="form-control w-1/2"
                        value={cocoaTradeFormData.quantity || 0}
                        thousandSeparator={"."}
                        decimalSeparator={","}
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
                loading={tradeLoading}
                columns={cocoaTradeColumns}
                data={
                  tradeData?.allGlobalCountryProfileProducingTradeByCountryId ||
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
                        await deleteGlobalCountryProfileProducingTrade({
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
                      await tradeRefetch();
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
                loading={uploadLoading}
                columns={fileUploadColumns}
                data={uploadData?.countryProducingFile || []}
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
                        await deleteCountryProfileProducingFile({
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
                      await uploadRefetch();
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
        data={allGlobalCountryProfileProducings}
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
                      await deleteGlobalCountryProfileProducing({
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
      />
      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">
          {data?.countGlobalCountryProfileProducings || 0}
        </p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(ProducingCountryProfile);
