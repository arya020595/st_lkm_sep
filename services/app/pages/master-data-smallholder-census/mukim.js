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
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";

const QUERY = gql`
  query listQueries {
    allSmallholderCensusRefMukim {
      _id
      mukim
      daerah
      negeri
      code
      LDescription
      SDescription
    }
    allSmallholderCensusRefNegeri {
      _id
      code
      LDescription
    }
    allSmallholderCensusRefDaerah {
      _id
      code
      LDescription
    }
  }
`;

const CREATE_REF_MUKIM = gql`
  mutation createSmallholderCensusRefMukim($input: JSON) {
    createSmallholderCensusRefMukim(input: $input)
  }
`;

const UPDATE_REF_MUKIM = gql`
  mutation updateSmallholderCensusRefMukim($_id: String!, $input: JSON) {
    updateSmallholderCensusRefMukim(_id: $_id, input: $input)
  }
`;
const DELETE_REF_MUKIM = gql`
  mutation deleteSmallholderCensusRefMukim($_id: String!) {
    deleteSmallholderCensusRefMukim(_id: $_id)
  }
`;

const Mukim = () => {
  const router = useRouter();
  const notification = useNotification();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { data, loading, error, refetch } = useQuery(QUERY);
  const [createSmallholderCensusRefMukim] = useMutation(CREATE_REF_MUKIM);
  const [updateSmallholderCensusRefMukim] = useMutation(UPDATE_REF_MUKIM);
  const [deleteSmallholderCensusRefMukim] = useMutation(DELETE_REF_MUKIM);

  let allSmallholderCensusRefMukim = [];

  if (data?.allSmallholderCensusRefMukim) {
    allSmallholderCensusRefMukim = data.allSmallholderCensusRefMukim;
  }

  const allSmallholderCensusRefNegeri =
    data?.allSmallholderCensusRefNegeri || [];

  const allSmallholderCensusRefDaerah =
    data?.allSmallholderCensusRefDaerah || [];
  const columns = useMemo(() => [
    {
      Header: "Mukim",
      accessor: "mukim",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Code",
      accessor: "code",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "LDescription",
      accessor: "LDescription",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "SDescription",
      accessor: "SDescription",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Daerah",
      accessor: "daerah",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Negeri",
      accessor: "negeri",
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

                // console.log(propsTable.row.original);
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
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Mukim</title>
      </Head>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Mukim`}
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
              await createSmallholderCensusRefMukim({
                variables: {
                  input: {
                    ...formData,
                  },
                },
              });
            } else {
              await updateSmallholderCensusRefMukim({
                variables: {
                  _id: formData._id,
                  input: {
                    ...formData,
                  },
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Mukim saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Mukim</label>
          <input
            placeholder="Mukim"
            className="form-control"
            value={formData.mukim || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                mukim: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Long Description</label>
          <input
            placeholder="Long Description"
            className="form-control"
            value={formData.LDescription || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                LDescription: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Short Description</label>
          <input
            placeholder="Short Description"
            className="form-control"
            value={formData.SDescription || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                SDescription: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Negeri</label>
          <select
            className="form-control"
            value={formData.negeri || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                negeri: e.target.value,
              });
            }}>
            <option value={""} disabled>
              Negeri
            </option>
            {allSmallholderCensusRefNegeri.map(negeri => (
              <option value={negeri.code}>{negeri.LDescription}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Daerah</label>
          <select
            className="form-control"
            value={formData.daerah || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                daerah: e.target.value,
              });
            }}>
            <option value={""} disabled>
              Daerah
            </option>
            {allSmallholderCensusRefDaerah.map(daerah => (
              <option value={daerah.code}>{daerah.LDescription}</option>
            ))}
          </select>
        </div>
      </FormModal>

      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <Table
            loading={loading}
            columns={columns}
            data={allSmallholderCensusRefMukim}
            withoutHeader={true}
            onAdd={
              currentUserDontHavePrivilege([
                "Master Data Smallholder Mukim:Create",
              ])
                ? null
                : e => {
                    if (e) e.preventDefault();
                    setModalVisible(true);
                    setFormData({});
                  }
            }
            onRemove={
              currentUserDontHavePrivilege([
                "Master Data Smallholder Mukim:Delete",
              ])
                ? null
                : async ({ rows }) => {
                    showLoadingSpinner();
                    try {
                      let yes = confirm(
                        `Are you sure to delete ${rows.length} data?`,
                      );
                      if (yes) {
                        for (const row of rows) {
                          await deleteSmallholderCensusRefMukim({
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
            customUtilities={
              currentUserDontHavePrivilege([
                "Master Data Smallholder Mukim:Update",
              ])
                ? null
                : customUtilities
            }
            customUtilitiesPosition="left"
          />
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Mukim);
