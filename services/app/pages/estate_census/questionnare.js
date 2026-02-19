import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea from "../../components/AdminArea";
import Table from "../../components/Table";
import { v4 as uuidv4 } from "uuid";

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
import { FormModal } from "../../components/Modal";
import { ShortText } from "../../components/form/ShortText";
import { LongText } from "../../components/form/LongText";

const QUERY = gql`
  query Query {
    allEstateCensusForms {
      _id
      name
      description
    }
  }
`;

const CREATE = gql`
  mutation createEstateCensusForm($name: String!, $description: String!) {
    createEstateCensusForm(name: $name, description: $description)
  }
`;

const UPDATE = gql`
  mutation updateEstateCensusForm(
    $_id: String!
    $name: String!
    $description: String!
  ) {
    updateEstateCensusForm(_id: $_id, name: $name, description: $description)
  }
`;

const DELETE = gql`
  mutation deleteEstateCensusForm($_id: String!) {
    deleteEstateCensusForm(_id: $_id)
  }
`;

const COPY = gql`
  mutation copyEstateCensusForm(
    $sourceFormId: String!
    $name: String!
    $description: String!
  ) {
    copyEstateCensusForm(
      sourceFormId: $sourceFormId
      name: $name
      description: $description
    )
  }
`;

const Questionnare = () => {
  const router = useRouter();
  const notification = useNotification();

  const [copyEstateCensusForm] = useMutation(COPY);
  const [createEstateCensusForm] = useMutation(CREATE);
  const [updateEstateCensusForm] = useMutation(UPDATE);
  const [deleteEstateCensusForm] = useMutation(DELETE);
  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {},
  });
  let allEstateCensusForms = data?.allEstateCensusForms || [];

  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const columns = useMemo(() => [
    {
      Header: "Form Name",
      accessor: "name",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Description",
      accessor: "description",
      style: {
        fontSize: 20,
        // width: 300,
      },
      Cell: props =>
        props.cell.value || (
          <span className="italic text-gray-300">No Description</span>
        ),
    },
  ]);
  const customUtilities = useMemo(() => [
    // {
    //   label: "Form Filling",
    //   icon: <i className="fa fa-arrow-right" />,
    //   width: 400,
    //   render: propsTable => {
    //     return (
    //       <div className="flex">
    //         <button
    //           onClick={e => {
    //             if (e) e.preventDefault();
    //             // console.log(propsTable);
    //             router.push({
    //               pathname: "/estate_census/questionnare-filling",
    //               query: {
    //                 ...router.query,
    //                 formId: propsTable.row.original._id,
    //               },
    //             });
    //             // window.location.href =
    //             //   "/lkm/estate_census/questionnare-filling?formId=" +
    //             //   propsTable.row.original._id;
    //           }}
    //           className="mb-1 bg-blue-500 hover:bg-blue-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg">
    //           <p className="text-white text-md font-bold">
    //             <i className="fa fa-edit" /> Form Filling
    //           </p>
    //         </button>
    //       </div>
    //     );
    //   },
    // },
    {
      label: "Copy",
      icon: <i className="fa fa-arrow-right" />,
      width: 400,
      render: propsTable => {
        return (
          <div className="flex">
            <button
              onClick={async e => {
                if (e) e.preventDefault();
                showLoadingSpinner();
                try {
                  await copyEstateCensusForm({
                    variables: {
                      sourceFormId: propsTable.row.original._id,
                      name: `${propsTable.row.original.name} (Copy)`,
                      description: `${propsTable.row.original.description} (Copy)`,
                    },
                  });
                  window.location.reload();
                } catch (err) {
                  notification.handleError(err);
                }
                hideLoadingSpinner();
              }}
              className="mb-1 bg-gray-500 hover:bg-gray-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg">
              <p className="text-white text-md font-bold">
                Copy <i className="fa fa-copy" />
              </p>
            </button>
          </div>
        );
      },
    },
    {
      label: "Compose Form",
      icon: <i className="fa fa-arrow-right" />,
      width: 400,
      render: propsTable => {
        return (
          <div className="flex">
            <button
              onClick={e => {
                if (e) e.preventDefault();
                // console.log(propsTable);
                router.push({
                  pathname: "/estate_census/questionnare-composer",
                  query: {
                    ...router.query,
                    formId: propsTable.row.original._id,
                  },
                });
                // window.location.href =
                //   "/lkm/estate_census/questionnare-composer?formId=" +
                //   propsTable.row.original._id;
              }}
              className="mb-1 bg-green-500 hover:bg-green-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg">
              <p className="text-white text-md font-bold">
                Compose Form <i className="fa fa-arrow-right" />
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
        <title>Questionnaire</title>
      </Head>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Form`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            customFields: [],
          });
        }}
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            if (formData?._id) {
              await updateEstateCensusForm({
                variables: {
                  name: "",
                  description: "",
                  ...formData,
                },
              });
            } else {
              await createEstateCensusForm({
                variables: {
                  name: "",
                  description: "",
                  ...formData,
                },
              });
            }
            await refetch();
            setModalVisible(false);
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}>
        <ShortText
          label="Form Name"
          value={formData.name}
          required
          onChange={e => {
            if (e) e.preventDefault();
            setFormData({
              ...formData,
              name: e.target.value,
            });
          }}
        />
        <LongText
          label="Form Description"
          value={formData.description}
          onChange={e => {
            if (e) e.preventDefault();
            setFormData({
              ...formData,
              description: e.target.value,
            });
          }}
        />
      </FormModal>

      <div className="mt-26  pr-0 md:pr-10 py-4 bg-white">
        <Table
          loading={false}
          columns={columns}
          data={allEstateCensusForms}
          withoutHeader={true}
          onAdd={e => {
            if (e) e.preventDefault();
            setModalVisible(true);
            setFormData({});
          }}
          onEdit={props => {
            // console.log(props);
            setModalVisible(true);
            setFormData({
              ...props.row,
            });
          }}
          onRemove={async props => {
            // console.log(props);
            showLoadingSpinner();
            try {
              let yes = confirm(
                `Are you sure to remove ${props.rows.length} form(s)?`,
              );
              if (yes) {
                for (const row of props.rows) {
                  await deleteEstateCensusForm({
                    variables: {
                      _id: row._id,
                    },
                  });
                }
                await refetch();
              }
            } catch (err) {
              notification.handleError(err);
            }
            hideLoadingSpinner();
          }}
          customUtilities={customUtilities}
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Questionnare);
