import React, { useState, useEffect, useMemo, useCallback } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
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
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Table from "../../components/TableAsync";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";

const QUERY = gql`
  query listQueries(
    $pageIndex: Int
    $pageSize: Int
    $filters: String
    $typeOfSmallholder: String
  ) {
    countSmallholders
    allSmallholders(
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
      typeOfSmallholder: $typeOfSmallholder
    ) {
      _id
      name
      nric
      oric
      citizenship
      ethnic
      gender
      religion
      maritalStatus
      dateOfBirth
      educationStatus
      occupation
      totalDependants
      maleFamilyWorker
      femaleFamilyWorker
      farmWorkedBy
      residenceAddress
      telephoneNo
      isActive
      isFamilyRelated
      stateName
      dunName
      perlimentName
      mukimName
      is_native
      postCode
      city
      status
      statusDescription
      kampungKelompok
      award
      typeOfSmallholder

      LocalState {
        _id
        description
      }
    }

    allLocalState {
      _id
      code
      description
    }
  }
`;

const CREATE_SMALLHOLDER = gql`
  mutation createSmallholder(
    $userGuid: String
    $name: String
    $nric: String
    $oric: String
    $citizenship: String
    $ethnic: String
    $gender: String
    $religion: String
    $maritalStatus: String
    $dateOfBirth: String
    $educationStatus: String
    $occupation: String
    $totalDependants: Int
    $maleFamilyWorker: Int
    $femaleFamilyWorker: Int
    $farmWorkedBy: String
    $residenceAddress: String
    $telephoneNo: String
    $districtGuid: String
    $isActive: Int
    $isFamilyRelated: Int
    $stateName: String
    $dunName: String
    $perlimentName: String
    $mukimName: String
    $is_native: Int
    $postCode: String
    $city: String
    $status: String
    $statusDescription: String
    $kampungKelompok: String
    $award: String
    $stateId: String
    $typeOfSmallholder: String
  ) {
    createSmallholder(
      userGuid: $userGuid
      name: $name
      nric: $nric
      oric: $oric
      citizenship: $citizenship
      ethnic: $ethnic
      gender: $gender
      religion: $religion
      maritalStatus: $maritalStatus
      dateOfBirth: $dateOfBirth
      educationStatus: $educationStatus
      occupation: $occupation
      totalDependants: $totalDependants
      maleFamilyWorker: $maleFamilyWorker
      femaleFamilyWorker: $femaleFamilyWorker
      farmWorkedBy: $farmWorkedBy
      residenceAddress: $residenceAddress
      telephoneNo: $telephoneNo
      districtGuid: $districtGuid
      isActive: $isActive
      isFamilyRelated: $isFamilyRelated
      stateName: $stateName
      dunName: $dunName
      perlimentName: $perlimentName
      mukimName: $mukimName
      is_native: $is_native
      postCode: $postCode
      city: $city
      status: $status
      statusDescription: $statusDescription
      kampungKelompok: $kampungKelompok
      award: $award

      stateId: $stateId
      typeOfSmallholder: $typeOfSmallholder
    )
  }
`;

const UPDATE_SMALLHOLDER = gql`
  mutation updateSmallholder(
    $_id: String!
    $userGuid: String
    $name: String
    $nric: String
    $oric: String
    $citizenship: String
    $ethnic: String
    $gender: String
    $religion: String
    $maritalStatus: String
    $dateOfBirth: String
    $educationStatus: String
    $occupation: String
    $totalDependants: Int
    $maleFamilyWorker: Int
    $femaleFamilyWorker: Int
    $farmWorkedBy: String
    $residenceAddress: String
    $telephoneNo: String
    $districtGuid: String
    $isActive: Int
    $isFamilyRelated: Int
    $stateName: String
    $dunName: String
    $perlimentName: String
    $mukimName: String
    $is_native: Int
    $postCode: String
    $city: String
    $status: String
    $statusDescription: String
    $kampungKelompok: String
    $award: String
    $stateId: String
    $typeOfSmallholder: String
  ) {
    updateSmallholder(
      _id: $_id
      userGuid: $userGuid
      name: $name
      nric: $nric
      oric: $oric
      citizenship: $citizenship
      ethnic: $ethnic
      gender: $gender
      religion: $religion
      maritalStatus: $maritalStatus
      dateOfBirth: $dateOfBirth
      educationStatus: $educationStatus
      occupation: $occupation
      totalDependants: $totalDependants
      maleFamilyWorker: $maleFamilyWorker
      femaleFamilyWorker: $femaleFamilyWorker
      farmWorkedBy: $farmWorkedBy
      residenceAddress: $residenceAddress
      telephoneNo: $telephoneNo
      districtGuid: $districtGuid
      isActive: $isActive
      isFamilyRelated: $isFamilyRelated
      stateName: $stateName
      dunName: $dunName
      perlimentName: $perlimentName
      mukimName: $mukimName
      is_native: $is_native
      postCode: $postCode
      city: $city
      status: $status
      statusDescription: $statusDescription
      kampungKelompok: $kampungKelompok
      award: $award

      stateId: $stateId
      typeOfSmallholder: $typeOfSmallholder
    )
  }
`;

const DELETE_SMALLHOLDER = gql`
  mutation deleteSmallholder($_id: String!) {
    deleteSmallholder(_id: $_id)
  }
`;

const Smallholder = () => {
  const router = useRouter();
  const notification = useNotification();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const columns = useMemo(() => [
    {
      Header: "Name",
      accessor: "name",
      style: {
        fontSize: 20,
        maxWidth: 200,
      },
    },
    {
      Header: "NRIC",
      accessor: "nric",
      style: {
        fontSize: 20,
        width: 170,
      },
    },
    {
      Header: "State",
      accessor: "LocalState.description",
      style: {
        fontSize: 20,
        // width: 250,
      },
    },
    {
      Header: "Type",
      accessor: "typeOfSmallholder",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "ORIC",
      accessor: "oric",
      style: {
        fontSize: 20,
        // width: 350,
      },
    },
    {
      Header: "Citizenship",
      accessor: "citizenship",
      style: {
        fontSize: 20,
        // width: 250,
      },
    },
    {
      Header: "Ethnic",
      accessor: "ethnic",
      style: {
        fontSize: 20,
        // width: 250,
      },
    },
    {
      Header: "Gender",
      accessor: "gender",
      style: {
        fontSize: 20,
        // width: 250,
      },
    },
    {
      Header: "Religion",
      accessor: "religion",
      style: {
        fontSize: 20,
        // width: 250,
      },
    },
    {
      Header: "Telephone",
      accessor: "telephoneNo",
      style: {
        fontSize: 20,
        // width: 250,
      },
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
                  stateId: propsTable.row.original.LocalState?._id || "",
                  stateName:
                    propsTable.row.original.LocalState?.description || "",
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

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      pageIndex: router.query.pageIndex ? parseInt(router.query.pageIndex) : 0,
      pageSize: router.query.pageSize ? parseInt(router.query.pageSize) : 10,
      filters: router.query.filters || "",
    },
  });
  const [createSmallholder] = useMutation(CREATE_SMALLHOLDER);
  const [updateSmallholder] = useMutation(UPDATE_SMALLHOLDER);
  const [deleteSmallholder] = useMutation(DELETE_SMALLHOLDER);

  let allSmallholders = [];
  if (data?.allSmallholders) {
    allSmallholders = data.allSmallholders;
  }
  const allLocalState = data?.allLocalState || [];
  // console.log({ allSmallholders });
  let countSmallholders = data?.countSmallholders || 0;
  let [internalLoading, setInternalLoading] = useState(false);
  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countSmallholders) return 1;
    return Math.ceil(countSmallholders / pageSize);
  }, [countSmallholders, pageSize]);
  const handlePageChange = useCallback(
    async ({ pageIndex, pageSize, filters }) => {
      // console.log("filters", JSON.stringify(filters));
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            pageIndex,
            pageSize,
            filters: JSON.stringify(filters),
          },
        },
        null,
        {
          scroll: false,
        },
      );
    },
    [],
  );

  let filters = useMemo(() => {
    // console.log("router.query.filters", router.query.filters);
    if (!router.query.filters) return [];
    try {
      let filters = JSON.parse(router.query.filters);
      // console.log({ filters });
      return filters;
    } catch (err) {
      console.warn(err);
    }
    return [];
  }, [router.query.filters]);
  // console.log(router.query.filters, { filters });

  return (
    <AdminArea urlQuery={router.query} title="Smallholder Profile (eCocoa)">
      <Head>
        <title>Smallholder Profile (eCocoa)</title>
      </Head>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Smallholder`}
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
              await createSmallholder({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateSmallholder({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Smallholder saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Name</label>
          <input
            className="form-control"
            value={formData.name || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                name: e.target.value,
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>NRIC</label>
          <input
            className="form-control"
            value={formData.nric || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                nric: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>ORIC</label>
          <input
            className="form-control"
            value={formData.oric || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                oric: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Citizenship</label>
          <input
            className="form-control"
            value={formData.citizenship || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                citizenship: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Ethnic</label>
          <input
            className="form-control"
            value={formData.ethnic || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                ethnic: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Gender</label>

          <select
            className="form-control"
            value={formData.gender || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                gender: e.target.value,
              });
            }}>
            <option value={""} disabled>
              Select Gender
            </option>
            <option value={"MALE"}>Male</option>
            <option value={"FEMALE"}>Female</option>
          </select>
        </div>
        <div className="form-group">
          <label>Religion</label>

          <input
            className="form-control"
            value={formData.religion || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                religion: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Marital Status</label>
          <input
            className="form-control"
            value={formData.maritalStatus || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                maritalStatus: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Date Of Birth</label>
          <input
            type="date"
            className="form-control"
            value={formData.dateOfBirth || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                dateOfBirth: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Education Status</label>
          <input
            className="form-control"
            value={formData.educationStatus || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                educationStatus: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Occupation</label>
          <input
            className="form-control"
            value={formData.occupation || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                occupation: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Total Dependants</label>
          <input
            type="number"
            className="form-control"
            value={formData.totalDependants || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                totalDependants: parseInt(e.target.value),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Male Family Worker</label>
          <input
            type="number"
            className="form-control"
            value={formData.maleFamilyWorker || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                maleFamilyWorker: parseInt(e.target.value),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Female Family Worker</label>
          <input
            type="number"
            className="form-control"
            value={formData.femaleFamilyWorker || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                femaleFamilyWorker: parseInt(e.target.value),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Farm Worked By</label>
          <input
            className="form-control"
            value={formData.farmWorkedBy || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                farmWorkedBy: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Residence Address</label>
          <textarea
            rows={3}
            className="form-control"
            value={formData.residenceAddress || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                residenceAddress: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Telephone No</label>
          <input
            className="form-control"
            value={formData.telephoneNo || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                telephoneNo: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Active</label>
          <select
            className="form-control"
            value={formData.isActive || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                isActive: parseInt(e.target.value),
              });
            }}>
            <option value={""} disabled>
              Select Active Status
            </option>
            <option value={1}>Yes</option>
            <option value={2}>No</option>
          </select>
        </div>
        <div className="form-group">
          <label>Family Related</label>
          <select
            className="form-control"
            value={formData.isFamilyRelated || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                isFamilyRelated: parseInt(e.target.value),
              });
            }}>
            <option value={""} disabled>
              Select Family Related
            </option>
            <option value={1}>Yes</option>
            <option value={2}>No</option>
          </select>
        </div>

        <div className="form-group">
          <label>State Name</label>

          <select
            className="form-control"
            value={formData.stateId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              const found = allLocalState.find(st => st._id === e.target.value);
              setFormData({
                ...formData,
                stateId: e.target.value,
                stateName: found?.stateName || "",
              });
            }}>
            <option value={""} disabled>
              Select State
            </option>
            {allLocalState.map(state => (
              <option value={state._id}>{state.description}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Dun. Name</label>
          <input
            className="form-control"
            value={formData.dunName || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                dunName: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Perliment Name</label>
          <input
            className="form-control"
            value={formData.perlimentName || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                perlimentName: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Mukim Name</label>
          <input
            className="form-control"
            value={formData.mukimName || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                mukimName: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Is Native</label>
          <select
            className="form-control"
            value={formData.is_native || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                is_native: parseInt(e.target.value),
              });
            }}>
            <option value={""} disabled>
              Select Native Status
            </option>
            <option value={1}>Yes</option>
            <option value={2}>No</option>
          </select>
        </div>

        <div className="form-group">
          <label>Postcode</label>
          <input
            className="form-control"
            value={formData.postCode || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                postCode: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>City</label>
          <input
            className="form-control"
            value={formData.city || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                city: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Status</label>
          <input
            className="form-control"
            value={formData.status || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                status: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Status Description</label>
          <input
            className="form-control"
            value={formData.statusDescription || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                statusDescription: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Kampung Kelompok</label>
          <input
            className="form-control"
            value={formData.kampungKelompok || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                kampungKelompok: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Award</label>
          <input
            className="form-control"
            value={formData.award || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                award: e.target.value,
              });
            }}
          />
        </div>
      </FormModal>

      <div className="mt-26  pr-0 md:pr-10 py-4 bg-white h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allSmallholders}
          withoutHeader={true}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          onAdd={
            currentUserDontHavePrivilege(["Smallholder Profile Ecocoa:Create"])
              ? null
              : e => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                }
          }
          customUtilities={
            currentUserDontHavePrivilege(["Smallholder Profile Ecocoa:Update"])
              ? null
              : customUtilities
          }
          customUtilitiesPosition="left"
          onRemove={
            currentUserDontHavePrivilege(["Smallholder Profile Ecocoa:Delete"])
              ? null
              : async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} unregistered smallholder ?`,
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteSmallholder({
                          variables: {
                            _id: row._id,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} unregistered smallholder deleted`,
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
          <p className="text-md font-bold mx-4">{countSmallholders}</p>
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Smallholder);
