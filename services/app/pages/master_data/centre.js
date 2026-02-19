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

const QUERY = gql`
  query listQueries {
    allCentre {
      _id
      code
      description
      seq
      LocalRegion {
        _id
        description
      }
    }
    allLocalRegion {
      _id
      description
    }
  }
`;

const CREATE_CENTRE = gql`
  mutation createCentre(
    $code: String!
    $description: String!
    $seq: String
    $regionId: String
  ) {
    createCentre(
      code: $code
      description: $description
      seq: $seq
      regionId: $regionId
    )
  }
`;

const UPDATE_CENTRE = gql`
  mutation updateCentre(
    $_id: String!
    $code: String
    $description: String
    $seq: String
    $regionId: String
  ) {
    updateCentre(
      _id: $_id
      code: $code
      description: $description
      seq: $seq
      regionId: $regionId
    )
  }
`;
const DELETE_CENTRE = gql`
  mutation deleteCentre($_id: String!) {
    deleteCentre(_id: $_id)
  }
`;

const Centre = () => {
  const notification = useNotification();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const columns = useMemo(() => [
    {
      Header: "Code",
      accessor: "code",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Description",
      accessor: "description",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Seq",
      accessor: "seq",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Region",
      accessor: "LocalRegion.description",
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
                  regionId: propsTable.row.original.LocalRegion._id,
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
  const [createCentre] = useMutation(CREATE_CENTRE);
  const [updateCentre] = useMutation(UPDATE_CENTRE);
  const [deleteCentre] = useMutation(DELETE_CENTRE);
  let allCentre = [];

  let allLocalRegion = [];

  if (data?.allLocalRegion) {
    allLocalRegion = data.allLocalRegion;
  }
  if (data?.allCentre) {
    allCentre = data.allCentre;
  }

  return (
    <AdminArea urlQuery={router.query}>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Centre`}
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
              await createCentre({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateCentre({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Centre saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Code*</label>
          <input
            placeholder="Code"
            className="form-control"
            value={formData.code || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                code: e.target.value,
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>Description*</label>
          <input
            placeholder="Description"
            className="form-control"
            value={formData.description || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                description: e.target.value,
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>Seq</label>
          <input
            placeholder="seq"
            className="form-control"
            value={formData.seq || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                seq: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Region*</label>
          <select
            className="form-control"
            value={formData.regionId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                regionId: e.target.value,
              });
            }}
            required>
            <option value="" disabled>
              Select Region
            </option>
            {allLocalRegion.map(reg => (
              <option value={reg._id}>{reg.description}</option>
            ))}
          </select>
        </div>
      </FormModal>

      <div className="mt-26  pr-0 md:pr-10 py-4 bg-white h-full">
        <Table
          loading={false}
          columns={columns}
          data={allCentre}
          withoutHeader={true}
          onAdd={
            currentUserDontHavePrivilege(["Centre:Create"])
              ? null
              : e => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                }
          }
          onRemove={
            currentUserDontHavePrivilege(["Centre:Delete"])
              ? null
              : async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} centres?`,
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteCentre({
                          variables: {
                            _id: row._id,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} centres deleted`,
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
            currentUserDontHavePrivilege(["Centre:Update"])
              ? null
              : customUtilities
          }
          customUtilitiesPosition="left"
        />

        <div className="flex mt-4">
          <p className="text-md">Total Data: </p>
          <p className="text-md font-bold mx-4">{allCentre.length}</p>
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Centre);
