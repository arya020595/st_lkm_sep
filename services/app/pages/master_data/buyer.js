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
    }

    allBuyers {
      _id
      code
      name
      Centre {
        _id
        description
      }
    }
  }
`;

const CREATE_BUYER = gql`
  mutation createBuyer($code: String!, $name: String!, $centreId: String!) {
    createBuyer(code: $code, name: $name, centreId: $centreId)
  }
`;

const UPDATE_BUYER = gql`
  mutation updateBuyer(
    $_id: String!
    $code: String
    $name: String
    $centreId: String
  ) {
    updateBuyer(_id: $_id, code: $code, name: $name, centreId: $centreId)
  }
`;

const Buyer = () => {
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
        width: 250
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
      Header: "Centre",
      accessor: "Centre.description",
      style: {
        fontSize: 20,
        width: 250,
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
                  centreId: propsTable.row.original.Centre?._id || "",
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
  const [createBuyer] = useMutation(CREATE_BUYER);
  const [updateBuyer] = useMutation(UPDATE_BUYER);

  let allCentre = [];
  if (data?.allCentre) {
    allCentre = data.allCentre;
  }

  const allBuyers = data?.allBuyers || [];

  return (
    <AdminArea urlQuery={router.query}>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Buyer`}
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
              await createBuyer({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateBuyer({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Buyer saved!`,
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
          <label>Name*</label>
          <input
            placeholder="Name"
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
          <label>Centre*</label>
          <select
            className="form-control"
            value={formData.centreId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                centreId: e.target.value,
              });
            }}
            required>
            <option value="" disabled>
              Select Centre
            </option>
            {allCentre.map(centre => (
              <option value={centre._id}>{centre.description}</option>
            ))}
          </select>
        </div>
      </FormModal>

      <div className="mt-26  pr-0 md:pr-10 py-4 bg-white h-full">
        <Table
          loading={false}
          columns={columns}
          data={allBuyers}
          withoutHeader={true}
          onAdd={
            currentUserDontHavePrivilege(["Buyer:Create"])
              ? null
              : e => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                }
          }
          customUtilities={
            currentUserDontHavePrivilege(["Buyer:Update"])
              ? null
              : customUtilities
          }
          customUtilitiesPosition="left"
        />

        <div className="flex mt-4">
          <p className="text-md">Total Data: </p>
          <p className="text-md font-bold mx-4">{allBuyers.length}</p>
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Buyer);
