import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Information from "../../components/EstateCensus/Information";
import IbuPejabat from "../../components/EstateCensus/IbuPejabat";
import Pos from "../../components/EstateCensus/Pos";
import {
  useMutation,
  useQuery,
  useApolloClient,
  ApolloProvider,
} from "@apollo/client";

import gql from "graphql-tag";
import {
  hideLoadingSpinner,
  showLoadingSpinner,
  useNotification,
} from "../../components/App";

const ESTATE_QUERY = gql`
  query listQuery(
    $recordType: String
    $stateCode: String
    $districtCode: String
    $estateId: String
  ) {
    allEstateInformation(
      recordType: $recordType
      stateCode: $stateCode
      districtCode: $districtCode
      estateId: $estateId
    ) {
      _id
      estateId
      recordType
      stateCode
      districtCode
      estateType
      estateName
      estateAddress1
      estateAddress2
      estateAddress3
      estateCity
      estateState
      estateZip
      estateInfo
      estateTelephone1
      estateTelephone2
      estateTelephone3
      estateFax1
      estateFax2
      estateFax3
      headQuarterAgent
      headQuarterAddress1
      headQuarterAddress2
      headQuarterAddress3
      headQuarterCity
      headQuarterState
      headQuarterZip
      headQuarterTelephone1
      headQuarterTelephone2
      headQuarterTelephone3
      headQuarterFax1
      headQuarterFax2
      headQuarterFax3
      postName
      postAddress
      postAddress1
      postAddress2
      postCity
      postState
      postsZip
      postTelephone1
      postTelephone2
      postTelephone3
      postFax1
      postFax2
      postFax3
      postSir
      postCont
      _createdAt
      _updatedAt
    }

    allEstateCensusStateDistricts {
      _id
      districtCode
      districtName
    }

    allEstateCensusStateCodes {
      _id
      stateCode
      stateName
    }
    countEstateInformation
  }
`;

const CREATE_INFORMATION = gql`
  mutation createEstateInformation(
    $estateId: String
    $recordType: String
    $stateCode: String
    $districtCode: String
    $estateType: String
    $estateName: String
    $estateAddress1: String
    $estateAddress2: String
    $estateAddress3: String
    $estateCity: String
    $estateState: String
    $estateZip: String
    $estateInfo: String
    $estateTelephone1: String
    $estateTelephone2: String
    $estateTelephone3: String
    $estateFax1: String
    $estateFax2: String
    $estateFax3: String
    $headQuarterAgent: String
    $headQuarterAddress1: String
    $headQuarterAddress2: String
    $headQuarterAddress3: String
    $headQuarterCity: String
    $headQuarterState: String
    $headQuarterZip: String
    $headQuarterTelephone1: String
    $headQuarterTelephone2: String
    $headQuarterTelephone3: String
    $headQuarterFax1: String
    $headQuarterFax2: String
    $headQuarterFax3: String
    $postName: String
    $postAddress: String
    $postAddress1: String
    $postAddress2: String
    $postCity: String
    $postState: String
    $postsZip: String
    $postTelephone1: String
    $postTelephone2: String
    $postTelephone3: String
    $postFax1: String
    $postFax2: String
    $postFax3: String
    $postSir: String
    $postCont: String
  ) {
    createEstateInformation(
      estateId: $estateId
      recordType: $recordType
      stateCode: $stateCode
      districtCode: $districtCode
      estateType: $estateType
      estateName: $estateName
      estateAddress1: $estateAddress1
      estateAddress2: $estateAddress2
      estateAddress3: $estateAddress3
      estateCity: $estateCity
      estateState: $estateState
      estateZip: $estateZip
      estateInfo: $estateInfo
      estateTelephone1: $estateTelephone1
      estateTelephone2: $estateTelephone2
      estateTelephone3: $estateTelephone3
      estateFax1: $estateFax1
      estateFax2: $estateFax2
      estateFax3: $estateFax3
      headQuarterAgent: $headQuarterAgent
      headQuarterAddress1: $headQuarterAddress1
      headQuarterAddress2: $headQuarterAddress2
      headQuarterAddress3: $headQuarterAddress3
      headQuarterCity: $headQuarterCity
      headQuarterState: $headQuarterState
      headQuarterZip: $headQuarterZip
      headQuarterTelephone1: $headQuarterTelephone1
      headQuarterTelephone2: $headQuarterTelephone2
      headQuarterTelephone3: $headQuarterTelephone3
      headQuarterFax1: $headQuarterFax1
      headQuarterFax2: $headQuarterFax2
      headQuarterFax3: $headQuarterFax3
      postName: $postName
      postAddress: $postAddress
      postAddress1: $postAddress1
      postAddress2: $postAddress2
      postCity: $postCity
      postState: $postState
      postsZip: $postsZip
      postTelephone1: $postTelephone1
      postTelephone2: $postTelephone2
      postTelephone3: $postTelephone3
      postFax1: $postFax1
      postFax2: $postFax2
      postFax3: $postFax3
      postSir: $postSir
      postCont: $postCont
    )
  }
`;

const UPDATE_INFORMATION = gql`
  mutation updateEstateInformation(
    $_id: String!
    $estateId: String
    $recordType: String
    $stateCode: String
    $districtCode: String
    $estateType: String
    $estateName: String
    $estateAddress1: String
    $estateAddress2: String
    $estateAddress3: String
    $estateCity: String
    $estateState: String
    $estateZip: String
    $estateInfo: String
    $estateTelephone1: String
    $estateTelephone2: String
    $estateTelephone3: String
    $estateFax1: String
    $estateFax2: String
    $estateFax3: String
    $headQuarterAgent: String
    $headQuarterAddress1: String
    $headQuarterAddress2: String
    $headQuarterAddress3: String
    $headQuarterCity: String
    $headQuarterState: String
    $headQuarterZip: String
    $headQuarterTelephone1: String
    $headQuarterTelephone2: String
    $headQuarterTelephone3: String
    $headQuarterFax1: String
    $headQuarterFax2: String
    $headQuarterFax3: String
    $postName: String
    $postAddress: String
    $postAddress1: String
    $postAddress2: String
    $postCity: String
    $postState: String
    $postsZip: String
    $postTelephone1: String
    $postTelephone2: String
    $postTelephone3: String
    $postFax1: String
    $postFax2: String
    $postFax3: String
    $postSir: String
    $postCont: String
  ) {
    updateEstateInformation(
      _id: $_id
      estateId: $estateId
      recordType: $recordType
      stateCode: $stateCode
      districtCode: $districtCode
      estateType: $estateType
      estateName: $estateName
      estateAddress1: $estateAddress1
      estateAddress2: $estateAddress2
      estateAddress3: $estateAddress3
      estateCity: $estateCity
      estateState: $estateState
      estateZip: $estateZip
      estateInfo: $estateInfo
      estateTelephone1: $estateTelephone1
      estateTelephone2: $estateTelephone2
      estateTelephone3: $estateTelephone3
      estateFax1: $estateFax1
      estateFax2: $estateFax2
      estateFax3: $estateFax3
      headQuarterAgent: $headQuarterAgent
      headQuarterAddress1: $headQuarterAddress1
      headQuarterAddress2: $headQuarterAddress2
      headQuarterAddress3: $headQuarterAddress3
      headQuarterCity: $headQuarterCity
      headQuarterState: $headQuarterState
      headQuarterZip: $headQuarterZip
      headQuarterTelephone1: $headQuarterTelephone1
      headQuarterTelephone2: $headQuarterTelephone2
      headQuarterTelephone3: $headQuarterTelephone3
      headQuarterFax1: $headQuarterFax1
      headQuarterFax2: $headQuarterFax2
      headQuarterFax3: $headQuarterFax3
      postName: $postName
      postAddress: $postAddress
      postAddress1: $postAddress1
      postAddress2: $postAddress2
      postCity: $postCity
      postState: $postState
      postsZip: $postsZip
      postTelephone1: $postTelephone1
      postTelephone2: $postTelephone2
      postTelephone3: $postTelephone3
      postFax1: $postFax1
      postFax2: $postFax2
      postFax3: $postFax3
      postSir: $postSir
      postCont: $postCont
    )
  }
`;

const DELETE_INFORMATION = gql`
  mutation deleteEstateInformation($_id: String!) {
    deleteEstateInformation(_id: $_id)
  }
`;
const EstateInformation = () => {
  const { currentUserDontHavePrivilege } = useCurrentUser();
  const router = useRouter();
  const client = useApolloClient();
  const notification = useNotification();
  const [estateInformationButton, setEstateInformationButton] =
    useState("ESTATE");

  const [initateStatus, setInitiateStatus] = useState("");
  const [formData, setFormData] = useState({});
  const [allEstateInformation, setAllEstateInfo] = useState([]);
  const [nextPage, setNextPage] = useState(1);

  const { data, loading, error, refetch } = useQuery(ESTATE_QUERY, {
    onCompleted: completedData => {
      setFormData({
        ...completedData.allEstateInformation[0],
      });
      setAllEstateInfo(completedData.allEstateInformation);
    },
  });

  const allEstateCensusStateCodes = data?.allEstateCensusStateCodes || [];
  const allEstateCensusStateDistricts =
    data?.allEstateCensusStateDistricts || [];
  const countEstateInformation = data?.countEstateInformation || 0;

  const [createEstateInformation] = useMutation(CREATE_INFORMATION);
  const [updateEstateInformation] = useMutation(UPDATE_INFORMATION);
  const [deleteEstateInformation] = useMutation(DELETE_INFORMATION);

  // useEffect(async () => {
  //   const res = await client.query({
  //     query: ESTATE_QUERY,
  //     fetchPolicy: "no-cache",
  //   });

  //   const formData = res.data.allEstateInformation[0];
  //   setFormData({ ...formData });
  //   setAllEstateInfo(res.data.allEstateInformation);
  // }, []);

  const nextData = e => {
    if (e) e.preventDefault();
    let next = nextPage + 1;
    setNextPage(nextPage + 1);
    const formData = allEstateInformation[next - 1];
    setFormData({ ...formData });
  };

  const prevData = e => {
    if (e) e.preventDefault();
    setNextPage(nextPage - 1);
    const formData = allEstateInformation[nextPage - 1];
    setFormData({ ...formData });
  };

  const firstData = e => {
    if (e) e.preventDefault();
    setFormData(allEstateInformation[0]);
    setNextPage(0);
  };

  const lastData = e => {
    if (e) e.preventDefault();
    setFormData(allEstateInformation[allEstateInformation.length - 1]);
    setNextPage(allEstateInformation.length);
  };

  const handleInputEstate = key => e => {
    setFormData({
      ...formData,
      [key]: e.target.value,
    });
  };

  const handleReset = async e => {
    if (e) e.preventDefault();

    showLoadingSpinner();
    try {
      const res = await client.query({
        query: ESTATE_QUERY,
        fetchPolicy: "no-cache",
      });

      const formData = res.data.allEstateInformation[0];
      setFormData({ ...formData });
      setNextPage(0);
      setInitiateStatus("");
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  const addNewData = e => {
    if (e) e.preventDefault();
    setFormData({});
    setInitiateStatus("ADD");
  };

  const editData = data => e => {
    if (e) e.preventDefault();
    setFormData({ ...data });
    setInitiateStatus("EDIT");
  };

  const handleSubmit = submitedData => async e => {
    if (e) e.preventDefault();
    showLoadingSpinner();
    try {
      if (submitedData._id) {
        await updateEstateInformation({
          variables: {
            ...submitedData,
          },
        });
      } else {
        await createEstateInformation({
          variables: {
            ...submitedData,
          },
        });
      }

      // // await refetch();

      // //Fetching...
      const res = await client.query({
        query: ESTATE_QUERY,
        fetchPolicy: "no-cache",
      });

      const formData = res.data.allEstateInformation[0];
      setFormData({ ...formData });
      setAllEstateInfo(res.data.allEstateInformation);
      setNextPage(0);
      setInitiateStatus("");

      notification.addNotification({
        title: "Succeess!",
        message: `Data saved!`,
        level: "success",
      });
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  const handleDelete = data => async e => {
    if (e) e.preventDefault();
    showLoadingSpinner();
    try {
      if (confirm("Are you sure to delete this data ?")) {
        await deleteEstateInformation({
          variables: {
            _id: data._id,
          },
        });

        // //Fetching...
        const res = await client.query({
          query: ESTATE_QUERY,
          fetchPolicy: "no-cache",
        });

        const formData = res.data.allEstateInformation[0];
        setFormData({ ...formData });
        setAllEstateInfo(res.data.allEstateInformation);
        setNextPage(0);
        setInitiateStatus("");

        notification.addNotification({
          title: "Succeess!",
          message: `Data deleted!`,
          level: "success",
        });
      }
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  const handleSearch = filterType => async e => {
    if (e) e.preventDefault();
    showLoadingSpinner();
    try {
      let filter = {};
      if (filterType === "all") {
        filter = {};
      } else {
        filter = {
          recordType: formData?.recordType || "",
          districtCode: formData?.districtCode || "",
          estateId: formData?.estateId || "",
          stateCode: formData?.stateCode || "",
        };
      }
      const res = await client.query({
        query: ESTATE_QUERY,
        variables: {
          ...filter,
        },
        fetchPolicy: "no-cache",
      });

      console.log("res", res.data.allEstateInformation);
      const filtered = res.data.allEstateInformation[0];
      setFormData({ ...filtered });
      setAllEstateInfo(res.data.allEstateInformation);
      setNextPage(0);
      setInitiateStatus("");
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Estate Information</title>
      </Head>

      <div className="mt-28">
        <div className="grid grid-cols-6 gap-4">
          <div className="border border-gray-400 rounded-md px-4 py-4 shadow-md h-[48rem]">
            <p className="text-md font-bold text-center mb-4">
              Filter Criteria
            </p>
            <div className="form-group">
              <label>Jenis Rekod</label>
              <input
                className={`form-control`}
                value={formData.recordType || ""}
                onChange={e => {
                  if (e) e.preventDefault();
                  if (isNaN(e.target.value)) {
                    //Do Nothing
                  } else {
                    setFormData({
                      ...formData,
                      recordType: e.target.value.toUpperCase(),
                    });
                  }
                }}
                //
              />
            </div>
            <div className="form-group">
              <label>Negeri</label>
              <select
                className="form-control"
                value={formData.stateCode || ""}
                onChange={e => {
                  if (e) e.preventDefault();
                  const found = allEstateCensusStateCodes.find(
                    c => c.stateCode === e.target.value,
                  );
                  setFormData({
                    ...formData,
                    stateCode: found?.stateCode || "",
                    estateState: found?.stateName || "",
                    headQuarterState: found?.stateName || "",
                    postState: found?.stateName || "",
                  });
                }}>
                <option value={""} disabled>
                  Select Negeri
                </option>

                {allEstateCensusStateCodes.map(code => (
                  <option value={code.stateCode}>{code.stateCode}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Daerah</label>
              <select
                className="form-control"
                value={formData.districtCode || ""}
                onChange={e => {
                  if (e) e.preventDefault();
                  const found = allEstateCensusStateDistricts.find(
                    c => c.districtCode === e.target.value,
                  );
                  setFormData({
                    ...formData,
                    districtCode: found?.districtCode || "",
                  });
                }}>
                <option value={""} disabled>
                  Select Daerah
                </option>

                {allEstateCensusStateDistricts.map(code => (
                  <option value={code.districtCode}>{code.districtCode}</option>
                ))}
              </select>
              {/* <input
                className={`form-control`}
                value={formData.districtCode || ""}
                onChange={e => {
                  if (e) e.preventDefault();
                  if (isNaN(e.target.value)) {
                    //Do Nothing
                  } else {
                    setFormData({
                      ...formData,
                      districtCode: e.target.value.toUpperCase(),
                    });
                  }
                }}
              /> */}
            </div>
            <div className="form-group">
              <label>ID Estate</label>
              <input
                className={`form-control`}
                value={formData.estateId || ""}
                onChange={e => {
                  if (e) e.preventDefault();
                  if (isNaN(e.target.value)) {
                    //Do Nothing
                  } else {
                    setFormData({
                      ...formData,
                      estateId: e.target.value.toUpperCase(),
                    });
                  }
                }}
              />
            </div>
            <div className="form-group">
              <label>Jenis Estate</label>
              <select
                className={`form-control`}
                value={formData.estateType || ""}
                onChange={e => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    estateType: e.target.value.toUpperCase(),
                  });
                }}>
                <option value="" disabled>
                  {""}
                </option>
                <option value="01">01</option>
                <option value="02">02</option>
              </select>
            </div>
            <div className="form-group">
              <label>Estate Mempunyai Kilang Memproses Koko</label>
              <select className="form-control" value={formData.estateType}>
                <option value="" disabled>
                  {""}
                </option>
                <option value="1">Ya</option>
                <option value="2">Tidak</option>
              </select>
            </div>

            <div className="justify-center">
              <button
                className="bg-cyan-600 px-4 py-2 rounded-md shadow-md mt-4 w-full"
                onClick={handleSearch("byFilter")}>
                <p className="text-white font-bold">
                  <i className="fa fa-search" /> Search
                </p>
              </button>
              <button
                className="bg-mantis-500 px-4 py-2 rounded-md shadow-md mt-4 w-full"
                onClick={handleSearch("all")}>
                <p className="text-white font-bold">
                  <i className="fa fa-search" /> Show All
                </p>
              </button>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="flex items-center">
                <p
                  className={`text-xl font-bold cursor-pointer ${
                    nextPage === 0 ? "text-gray-400" : "text-black"
                  }`}
                  onClick={firstData}>
                  <i className="fa fa-step-backward" />
                </p>
              </div>
              <div className="flex items-center">
                <p
                  className={`text-3xl font-bold cursor-pointer ${
                    nextPage === 0 ? "text-gray-400" : "text-black"
                  }`}
                  onClick={nextPage === 0 ? null : prevData}>
                  <i className="fa fa-caret-left" />
                </p>
              </div>
              <div className="flex items-center">
                <p
                  className={`text-3xl font-bold cursor-pointer ${
                    nextPage === allEstateInformation.length ||
                    allEstateInformation.length === 1
                      ? "text-gray-400"
                      : "text-black"
                  }`}
                  onClick={
                    nextPage === allEstateInformation.length ||
                    allEstateInformation.length === 1
                      ? null
                      : nextData
                  }>
                  <i className="fa fa-caret-right" />
                </p>
              </div>
              <div className="flex items-center cursor-pointer">
                <p
                  className={`text-xl font-bold ${
                    nextPage === allEstateInformation.length ||
                    allEstateInformation.length === 1
                      ? "text-gray-400"
                      : "text-black"
                  }`}
                  onClick={
                    nextPage === allEstateInformation.length ||
                    allEstateInformation.length === 1
                      ? null
                      : lastData
                  }>
                  <i className="fa fa-step-forward" />
                </p>
              </div>
            </div>

            <div className="flex justify-between mt-4">
              <p className="text-md font-bold">Total Records:</p>
              <p className="text-md font-bold">{countEstateInformation}</p>
            </div>
          </div>

          <div className="col-span-5">
            <div className="border border-gray-200 rounded-md px-4 py-4 shadow-md mr-4">
              <button
                className={`px-4 py-2 rounded-md shadow-md ${
                  estateInformationButton === "ESTATE"
                    ? "bg-mantis-500 text-white"
                    : "bg-white border border-gray-200"
                }`}
                onClick={e => {
                  if (e) e.preventDefault();
                  setEstateInformationButton("ESTATE");
                }}>
                <p className="text-md font-bold">Estate</p>
              </button>
              <button
                className={`px-4 py-2 rounded-md shadow-md mx-4 ${
                  estateInformationButton === "IBU PEJABAT"
                    ? "bg-mantis-500 text-white"
                    : "bg-white border border-gray-200"
                }`}
                onClick={e => {
                  if (e) e.preventDefault();
                  setEstateInformationButton("IBU PEJABAT");
                }}>
                <p className="text-md font-bold">Ibu Pejabat</p>
              </button>
              <button
                className={`px-10 py-2 rounded-md shadow-md ${
                  estateInformationButton === "POS"
                    ? "bg-mantis-500 text-white"
                    : "bg-white border border-gray-200"
                }`}
                onClick={e => {
                  if (e) e.preventDefault();
                  setEstateInformationButton("POS");
                }}>
                <p className="text-md font-bold">Pos</p>
              </button>

              <div className="mt-10">
                {estateInformationButton === "ESTATE" ? (
                  <Information
                    initateStatus={initateStatus}
                    estateFormData={formData}
                    handleInputEstate={handleInputEstate}
                    addNewData={addNewData}
                    onSave={handleSubmit}
                    handleReset={handleReset}
                    editData={editData}
                    handleDelete={handleDelete}
                    currentUserDontHavePrivilege={currentUserDontHavePrivilege}
                  />
                ) : estateInformationButton === "IBU PEJABAT" ? (
                  <IbuPejabat
                    initateStatus={initateStatus}
                    estateFormData={formData}
                    handleInputEstate={handleInputEstate}
                    addNewData={addNewData}
                    onSave={handleSubmit}
                    handleReset={handleReset}
                    editData={editData}
                    handleDelete={handleDelete}
                    currentUserDontHavePrivilege={currentUserDontHavePrivilege}
                  />
                ) : (
                  <Pos
                    initateStatus={initateStatus}
                    estateFormData={formData}
                    handleInputEstate={handleInputEstate}
                    addNewData={addNewData}
                    onSave={handleSubmit}
                    handleReset={handleReset}
                    editData={editData}
                    handleDelete={handleDelete}
                    currentUserDontHavePrivilege={currentUserDontHavePrivilege}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(EstateInformation);
