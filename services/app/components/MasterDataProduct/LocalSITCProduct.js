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
    allLocalSITCProducts {
      _id
      sitcCode
      asitcCode
      gsitcCode
      product
      refSTICCode
      seq

      useForReport
      newProduct
    }
  }
`;

const CREATE_LOCAL_PRODCUT = gql`
  mutation createLocalSITCProduct(
    $sitcCode: String
    $asitcCode: String
    $gsitcCode: String
    $product: String
    $refSTICCode: String
    $seq: String
    $useForReport: Boolean
    $newProduct: String
  ) {
    createLocalSITCProduct(
      sitcCode: $sitcCode
      asitcCode: $asitcCode
      gsitcCode: $gsitcCode
      product: $product
      refSTICCode: $refSTICCode
      seq: $seq
      useForReport: $useForReport
      newProduct: $newProduct
    )
  }
`;

const UPDATE_LOCAL_PRODCUT = gql`
  mutation updateLocalSITCProduct(
    $_id: String!
    $sitcCode: String
    $asitcCode: String
    $gsitcCode: String
    $product: String
    $refSTICCode: String
    $seq: String
    $useForReport: Boolean
    $newProduct: String
  ) {
    updateLocalSITCProduct(
      _id: $_id
      sitcCode: $sitcCode
      asitcCode: $asitcCode
      gsitcCode: $gsitcCode
      product: $product
      refSTICCode: $refSTICCode
      seq: $seq
      useForReport: $useForReport
      newProduct: $newProduct
    )
  }
`;
const DELETE_LOCAL_PRODCUT = gql`
  mutation deleteLocalSITCProduct($_id: String!) {
    deleteLocalSITCProduct(_id: $_id)
  }
`;
const LocalSITCProduct = ({ currentUserDontHavePrivilege }) => {
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const columns = useMemo(() => [
    {
      Header: "SITC Code",
      accessor: "sitcCode",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "ASITC Code",
      accessor: "asitcCode",
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
      Header: "Use For Report",
      accessor: "useForReport",
      style: {
        fontSize: 20,
      },
      Cell: props => <span>{props.value ? "Yes" : "No"}</span>,
    },
    {
      Header: "Sequence",
      accessor: "seq",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "New Product",
      accessor: "newProduct",
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
  const [createLocalSITCProduct] = useMutation(CREATE_LOCAL_PRODCUT);
  const [updateLocalSITCProduct] = useMutation(UPDATE_LOCAL_PRODCUT);
  const [deleteLocalSITCProduct] = useMutation(DELETE_LOCAL_PRODCUT);
  let allLocalSITCProducts = [];

  if (data?.allLocalSITCProducts) {
    allLocalSITCProducts = data.allLocalSITCProducts;
  }

  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Local Product`}
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
              await createLocalSITCProduct({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateLocalSITCProduct({
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
          <label>SITC Code</label>
          <input
            placeholder="SITC Code"
            className="form-control"
            value={formData.sitcCode || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                sitcCode: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>ASITC Code</label>
          <input
            placeholder="ASITC Code"
            className="form-control"
            value={formData.asitcCode || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                asitcCode: e.target.value,
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
        <div className="form-group">
          <label>New Product</label>
          <select
            className="form-control"
            value={formData.newProduct || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                newProduct: e.target.value,
              });
            }}>
            <option value={""}>New Product</option>
            <option value={"Chocolate"}>Chocolate</option>
            <option value={"Cocoa Beans"}>Cocoa Beans</option>
            <option value={"Cocoa Butter"}>Cocoa Butter</option>
            <option value={"Cocoa Paste Defatted"}>Cocoa Paste Defatted</option>
            <option value={"Cocoa Paste Not Defatted"}>
              Cocoa Paste Not Defatted
            </option>
            <option value={"Cocoa Powder Not Sweetened"}>
              Cocoa Powder Not Sweetened
            </option>
            <option value={"Cocoa Powder Sweetened"}>
              Cocoa Powder Sweetened
            </option>
            <option value={"Cocoa Shells"}>Cocoa Shells</option>
            <option value={"Cocoa Powder & Cake"}>Cocoa Powder & Cake</option>
            <option value={"Cocoa Paste & Liquor"}>Cocoa Paste & Liquor</option>
          </select>
        </div>
        <div className="form-group">
          <div className="flex items-center">
            <input
              className="h-4 w-6 mr-2"
              type="checkbox"
              checked={formData.useForReport || false}
              onChange={e => {
                // if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  useForReport: e.target.checked,
                });
              }}
            />{" "}
            Use For Report
          </div>
        </div>
      </FormModal>

      <Table
        loading={false}
        columns={columns}
        data={allLocalSITCProducts}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege(["Local Product:Create"])
            ? null
            : e => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({});
              }
        }
        onRemove={
          currentUserDontHavePrivilege(["Local Product:Delete"])
            ? null
            : async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} products?`,
                  );
                  if (yes) {
                    for (const row of rows) {
                      await deleteLocalSITCProduct({
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
          currentUserDontHavePrivilege(["Local Product:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />
      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">{allLocalSITCProducts.length}</p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(LocalSITCProduct);
