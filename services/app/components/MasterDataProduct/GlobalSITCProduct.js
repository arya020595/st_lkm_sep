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

const QUERY = gql`
  query listQueries {
    allGlobalSITCProducts {
      _id
      code
      gsitcCode
      product
      seq
    }
  }
`;

const CREATE_GLOBAL_PRODCUT = gql`
  mutation createGlobalSITCProduct(
    $code: String
    $gsitcCode: String
    $product: String!
    $seq: String
  ) {
    createGlobalSITCProduct(
      code: $code
      gsitcCode: $gsitcCode
      product: $product
      seq: $seq
    )
  }
`;

const UPDATE_GLOBAL_PRODCUT = gql`
  mutation updateGlobalSITCProduct(
    $_id: String!
    $code: String
    $gsitcCode: String
    $product: String
    $seq: String
  ) {
    updateGlobalSITCProduct(
      _id: $_id
      code: $code
      gsitcCode: $gsitcCode
      product: $product
      seq: $seq
    )
  }
`;
const DELETE_GLOBAL_PRODCUT = gql`
  mutation deleteGlobalSITCProduct($_id: String!) {
    deleteGlobalSITCProduct(_id: $_id)
  }
`;
const GlobalSITCProduct = ({ currentUserDontHavePrivilege }) => {
  const notification = useNotification();
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
      Header: "GSITC Code",
      accessor: "gsitcCode",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Product Description",
      accessor: "product",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Sequence",
      accessor: "seq",
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
                console.log(propsTable.row.original);
                setModalVisible(true);
                setFormData(propsTable.row.original);
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
  const [createGlobalSITCProduct] = useMutation(CREATE_GLOBAL_PRODCUT);
  const [updateGlobalSITCProduct] = useMutation(UPDATE_GLOBAL_PRODCUT);
  const [deleteGlobalSITCProduct] = useMutation(DELETE_GLOBAL_PRODCUT);
  let allGlobalSITCProducts = [];

  if (data?.allGlobalSITCProducts) {
    allGlobalSITCProducts = data.allGlobalSITCProducts;
  }
  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Global Product`}
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
              await createGlobalSITCProduct({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateGlobalSITCProduct({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Product saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Code</label>
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
          />
        </div>

        <div className="form-group">
          <label>GSITC Code</label>
          <input
            placeholder="GSITC Code"
            className="form-control"
            value={formData.gsitcCode || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                gsitcCode: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Product Description</label>
          <input
            placeholder="Product"
            className="form-control"
            value={formData.product || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                product: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Sequence</label>
          <input
            placeholder="Sequence"
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
      </FormModal>

      <Table
        loading={false}
        columns={columns}
        data={allGlobalSITCProducts}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege(["International Product:Create"])
            ? null
            : e => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({});
              }
        }
        onRemove={
          currentUserDontHavePrivilege(["International Product:Delete"])
            ? null
            : async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} products?`,
                  );
                  if (yes) {
                    for (const row of rows) {
                      await deleteGlobalSITCProduct({
                        variables: {
                          _id: row._id,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} products deleted`,
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
          currentUserDontHavePrivilege(["International Product:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />
      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">{allGlobalSITCProducts.length}</p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(GlobalSITCProduct);
