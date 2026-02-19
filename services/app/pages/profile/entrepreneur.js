import React, { useState, useEffect, useMemo } from "react";
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
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import { DateFilterWithExport } from "../../components/DateFilterWithExport";

const QUERY = gql`
  query listQueries {
    allEntrepreneurs {
      _id
      name
      companyName
      companyRegistrationNumber
      contactAddress
      premiseAddress
      idCard
      email
      telephone
      gender
      race
      establishmentYear
      level
      state

      registeredDate
      status
      stateId
    }

    allLocalState {
      _id
      code
      description
    }
  }
`;

const CREATE_ENTREPRENEUR = gql`
  mutation createEntrepreneur(
    $categoryId: String
    $name: String
    $companyName: String
    $companyRegistrationNumber: String
    $contactAddress: String
    $premiseAddress: String
    $idCard: String
    $email: String
    $telephone: String
    $gender: String
    $race: String
    $level: Int
    $establishmentYear: Int
    $state: String
    $registeredDate: String
    $status: String
    $stateId: String
  ) {
    createEntrepreneur(
      categoryId: $categoryId
      name: $name
      companyName: $companyName
      companyRegistrationNumber: $companyRegistrationNumber
      contactAddress: $contactAddress
      premiseAddress: $premiseAddress
      idCard: $idCard
      email: $email
      telephone: $telephone
      gender: $gender
      race: $race
      level: $level
      establishmentYear: $establishmentYear
      state: $state
      stateId: $stateId
      registeredDate: $registeredDate
      status: $status
    )
  }
`;

const UPDATE_ENTREPRENEUR = gql`
  mutation updateEntrepreneur(
    $_id: String!
    $categoryId: String
    $name: String
    $companyName: String
    $companyRegistrationNumber: String
    $contactAddress: String
    $premiseAddress: String
    $idCard: String
    $email: String
    $telephone: String
    $gender: String
    $race: String
    $level: Int
    $establishmentYear: Int
    $state: String
    $registeredDate: String
    $status: String
    $stateId: String
  ) {
    updateEntrepreneur(
      _id: $_id
      categoryId: $categoryId
      name: $name
      companyName: $companyName
      companyRegistrationNumber: $companyRegistrationNumber
      contactAddress: $contactAddress
      premiseAddress: $premiseAddress
      idCard: $idCard
      email: $email
      telephone: $telephone
      gender: $gender
      race: $race
      level: $level
      establishmentYear: $establishmentYear
      state: $state

      registeredDate: $registeredDate
      status: $status
      stateId: $stateId
    )
  }
`;
const DELETE_ENTREPRENEUR = gql`
  mutation deleteEntrepreneur($_id: String!) {
    deleteEntrepreneur(_id: $_id)
  }
`;

const Entrepreneur = () => {
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1949;
    // console.log([...new Array(toYear - fromYear)])
    return [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });
  }, []);

  const columns = useMemo(() => [
    {
      Header: "Registered Date",
      accessor: "registeredDate",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Level",
      accessor: "level",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Name",
      accessor: "name",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Status",
      accessor: "status",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
    {
      Header: "Company Name",
      accessor: "companyName",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Company Reg. No",
      accessor: "companyRegistrationNumber",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Contact Address",
      accessor: "contactAddress",
      style: {
        fontSize: 20,
        width: 450,
      },
    },
    {
      Header: "Premise Address",
      accessor: "premiseAddress",
      style: {
        fontSize: 20,
        width: 450,
      },
    },
    {
      Header: "State",
      accessor: "state",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "ID Card",
      accessor: "idCard",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Email",
      accessor: "email",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Telephone",
      accessor: "telephone",
      style: {
        fontSize: 20,
        width: 350,
      },
    },
    {
      Header: "Gender",
      accessor: "gender",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Race",
      accessor: "race",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Establishment Year",
      accessor: "establishmentYear",
      style: {
        fontSize: 20,
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

  const { data, loading, error, refetch } = useQuery(QUERY);
  const [createEntrepreneur] = useMutation(CREATE_ENTREPRENEUR);
  const [updateEntrepreneur] = useMutation(UPDATE_ENTREPRENEUR);
  const [deleteEntrepreneur] = useMutation(DELETE_ENTREPRENEUR);
  let allEntrepreneurs = [];
  if (data?.allEntrepreneurs) {
    allEntrepreneurs = data.allEntrepreneurs;
  }

  const allLocalState = data?.allLocalState || [];
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Profile | Entrepreneur</title>
      </Head>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Entrepreneur`}
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
              await createEntrepreneur({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateEntrepreneur({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Employee saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Level*</label>
          <select
            className="form-control w-1/4"
            value={formData.level || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                level: parseInt(e.target.value),
              });
            }}
            required>
            <option value={""} disabled>
              Select Level
            </option>
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
          </select>
        </div>
        <div className="form-group">
          <label>Name*</label>
          <input
            placeholder="Entrepreneur Name"
            className="form-control"
            value={formData.name || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                name: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Registered Date</label>
          <input
            type="month"
            className="form-control"
            value={formData.registerdDate || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                registerdDate: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Status</label>
          <select
            className="form-control"
            value={formData.status || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                status: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Status
            </option>
            <option value="Aktif">Active</option>
            <option value="Tidak Aktif">Inactive</option>
          </select>
        </div>
        <div className="form-group">
          <label>Company Name</label>
          <input
            placeholder="Company Name"
            className="form-control"
            value={formData.companyName || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                companyName: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Company Registration No</label>
          <input
            placeholder="Company Registration No"
            className="form-control"
            value={formData.companyRegistrationNumber || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                companyRegistrationNumber: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Contact Address</label>
          <textarea
            placeholder="Contact Address"
            className="form-control"
            value={formData.contactAddress || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                contactAddress: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Premise Address</label>
          <textarea
            placeholder="Premise Address"
            className="form-control"
            value={formData.premiseAddress || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                premiseAddress: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>State</label>
          <select
            className="form-control"
            value={formData.stateId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                stateId: e.target.value,
              });
            }}>
            <option value={""} disabled>
              Select State
            </option>
            {allLocalState.map(st => (
              <option value={st._id}>{st.description}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>ID Card</label>
          <input
            placeholder="ID Card"
            className="form-control"
            value={formData.idCard || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                idCard: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Email"
            className="form-control"
            value={formData.email || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                email: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Telephone</label>
          <input
            placeholder="Telephone"
            className="form-control"
            value={formData.telephone || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                telephone: e.target.value,
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
            }}
            required>
            <option value="" disabled>
              Select Gennder
            </option>
            <option value="MALE">MALE</option>
            <option value="FEMALE">FEMALE</option>
          </select>
        </div>
        <div className="form-group">
          <label>Race</label>
          <input
            placeholder="Race"
            className="form-control"
            value={formData.race || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                race: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Establishment Year</label>
          <select
            className="form-control"
            value={
              formData.establishmentYear || parseInt(dayjs().format("YYYY"))
            }
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                establishmentYear: parseInt(e.target.value),
              });
            }}>
            {YEARS.map(year => (
              <option value={year}>{year}</option>
            ))}
          </select>
        </div>
      </FormModal>

      <div className="mt-26  pr-0 md:pr-10 py-4 bg-white h-full">
        <Table
          customHeaderUtilities={
            <div>
              <DateFilterWithExport
                label=""
                defaultValue={""}
                showDate={false}
                // options={YEARS}
                exportConfig={{
                  title: "Profile - Entrepreneur",
                  collectionName: "Entrepreneurs",
                  filters: {},
                  columns,
                }}
              />
            </div>
          }
          loading={false}
          columns={columns}
          data={allEntrepreneurs}
          withoutHeader={true}
          onAdd={
            currentUserDontHavePrivilege(["Entrepreneur Profile:Create"])
              ? null
              : e => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({})
                }
          }
          onRemove={
            currentUserDontHavePrivilege(["Entrepreneur Profile:Delete"])
              ? null
              : async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} entrepreneurs?`,
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteEntrepreneur({
                          variables: {
                            _id: row._id,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} entrepreneurs deleted`,
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
            currentUserDontHavePrivilege(["Entrepreneur Profile:Update"])
              ? null
              : customUtilities
          }
          customUtilitiesPosition="left"
        />

        <div className="flex mt-4">
          <p className="text-md">Total Data: </p>
          <p className="text-md font-bold mx-4">{allEntrepreneurs.length}</p>
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Entrepreneur);
