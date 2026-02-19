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
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";

const QUERY = gql`
  query listQueries {
    allCocoaWarehouses {
      _id
      name
      address
      LocalState {
        _id
        description
      }
      Country {
        _id
        name
      }
      telephone
      email
      website

      branch
    }

    allLocalState {
      _id
      description
    }
    allCountries {
      _id
      name
    }
  }
`;

const CREATE_WAREHOUSE_PROFILE = gql`
  mutation createCocoaWarehouse(
    $name: String
    $address: String
    $localStateId: String
    $countryId: String
    $telephone: String
    $email: String
    $website: String
    $branch: String
  ) {
    createCocoaWarehouse(
      name: $name
      address: $address
      localStateId: $localStateId
      countryId: $countryId
      telephone: $telephone
      email: $email
      website: $website

      branch: $branch
    )
  }
`;

const UPDATE_WAREHOUSE_PROFILE = gql`
  mutation updateCocoaWarehouse(
    $_id: String!
    $name: String
    $address: String
    $localStateId: String
    $countryId: String
    $telephone: String
    $email: String
    $website: String
    $branch: String
  ) {
    updateCocoaWarehouse(
      _id: $_id
      name: $name
      address: $address
      localStateId: $localStateId
      countryId: $countryId
      telephone: $telephone
      email: $email
      website: $website

      branch: $branch
    )
  }
`;

const DELETE_WAREHOUSE_PROFILE = gql`
  mutation deleteCocoaWarehouse($_id: String!) {
    deleteCocoaWarehouse(_id: $_id)
  }
`;

const Grinder = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const notification = useNotification();
  const { data, loading, error, refetch } = useQuery(QUERY);
  const [createCocoaWarehouse] = useMutation(CREATE_WAREHOUSE_PROFILE);
  const [updateCocoaWarehouse] = useMutation(UPDATE_WAREHOUSE_PROFILE);
  const [deleteCocoaWarehouse] = useMutation(DELETE_WAREHOUSE_PROFILE);

  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  let allCocoaWarehouses = [];
  if (data?.allCocoaWarehouses) {
    allCocoaWarehouses = data.allCocoaWarehouses;
  }

  let allLocalState = [];
  if (data?.allLocalState) {
    allLocalState = data.allLocalState;
  }

  let allCountries = [];
  if (data?.allCountries) {
    allCountries = data.allCountries;
  }

  const columns = useMemo(() => [
    {
      Header: "Name",
      accessor: "name",
      style: {
        fontSize: 20,
        width: 500,
      },
    },
    {
      Header: "Address",
      accessor: "address",
      style: {
        fontSize: 20,
        width: 500,
      },
    },
    {
      Header: "State",
      accessor: "LocalState.description",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Country",
      accessor: "Country.name",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Telephone",
      accessor: "telephone",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Email",
      accessor: "email",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Website",
      accessor: "website",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Branch",
      accessor: "branch",
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
                  localStateId: propsTable.row.original.LocalState?._id || "",
                  countryId: propsTable.row.original.Country?._id || "",
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
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Profile | Cocoa Warehouse</title>
      </Head>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Cocoa Warehouse`}
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
              await createCocoaWarehouse({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateCocoaWarehouse({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Cocoa Warehouse saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Name*</label>
          <input
            placeholder="Warehouse Name"
            className="form-control"
            value={formData.name || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                name: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Address*</label>
          <textarea
            placeholder="Warehouse Address"
            className="form-control"
            value={formData.address || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                address: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Telephone</label>
          <input
            placeholder="Warehouse Telephone"
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
          <label>Website</label>
          <input
            placeholder="Warehouse Website"
            className="form-control"
            value={formData.website || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                website: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Warehouse email"
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
          <label>State*</label>
          <select
            className="form-control"
            value={formData.localStateId || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                localStateId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select State
            </option>
            {allLocalState.map(state => (
              <option value={state._id}>{state.description}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Country*</label>
          <select
            className="form-control"
            value={formData.countryId || ""}
            required
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

        <div className="form-group">
          <label>Branch</label>
          <input
            placeholder="Cocoa Warehouse Branch"
            className="form-control"
            value={formData.branch || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                branch: e.target.value,
              });
            }}
          />
        </div>
      </FormModal>

      <div className="mt-26  pr-0 md:pr-10 py-4 bg-white h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allCocoaWarehouses}
          withoutHeader={true}
          onAdd={
            currentUserDontHavePrivilege(["Cocoa Warehouse Profile:Create"])
              ? null
              : e => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                }
          }
          onRemove={
            currentUserDontHavePrivilege(["Cocoa Warehouse Profile:Delete"])
              ? null
              : async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} warehouses?`,
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteCocoaWarehouse({
                          variables: {
                            _id: row._id,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} warehouses deleted`,
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
            currentUserDontHavePrivilege(["Cocoa Warehouse Profile:Update"])
              ? null
              : customUtilities
          }
          customUtilitiesPosition="left"
        />

        <div className="flex mt-4">
          <p className="text-md">Total Data: </p>
          <p className="text-md font-bold mx-4">{allCocoaWarehouses.length}</p>
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Grinder);
