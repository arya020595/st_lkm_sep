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
import AdminArea from "../../components/AdminArea";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";

const QUERY = gql`
  query listQueries($banciId: String, $negeri: [String]) {
    allSmallholderCensusDataBanci(banciId: $banciId) {
      _id
      banciId
      shid
      name
      newKp
      oldKp
      address1
      address2
      address3
      postalCode
      negeri
      daerah
      mukim
      kampung
      lokasi
      parlimen
      tkhDaftar
      dun
      tempat
      userCreate
      createdDate
      userUpdate
      updatedDate
      recId
      mail1
      mail2
      mail3
      fax
      addressR1
      addressR2
      enId
      enDate
      suID
      validId
      validDate
      validStat
    }

    allSmallholderCensusRefDaerah(negeri: $negeri) {
      _id
      code
      daerah
      LDescription
    }
    allSmallholderCensusRefMukim(negeri: $negeri) {
      _id
      code
      mukim
      LDescription
    }
    allSmallholderCensusRefKampung(negeri: $negeri) {
      _id
      code
      kampung
      LDescription
    }
    allSmallholderCensusRefParlimen(negeri: $negeri) {
      _id
      code
      region
      LDescription
    }
    allSmallholderCensusRefParlimenDun(negeri: $negeri) {
      _id
      dun
      description
    }
    allSmallholderCensusRefBangsa {
      code
      description
      region
      subCode
    }
  }
`;

const CREATE_BANCI = gql`
  mutation createSmallholderCensusDataBanci($inputJSON: JSON) {
    createSmallholderCensusDataBanci(inputJSON: $inputJSON)
  }
`;

const UPDATE_BANCI = gql`
  mutation updateSmallholderCensusDataBanci($inputJSON: JSON) {
    updateSmallholderCensusDataBanci(inputJSON: $inputJSON)
  }
`;
const DELETE_BANCI = gql`
  mutation deleteSmallholderCensusDataBanci($_id: String!, $banciId: String!) {
    deleteSmallholderCensusDataBanci(_id: $_id, banciId: $banciId)
  }
`;

const DataBanciSabah = ({ currentUserDontHavePrivilege }) => {
  const router = useRouter();
  const notification = useNotification();
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
      Header: "SH ID",
      accessor: "shid",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "New KP",
      accessor: "newKp",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
    {
      Header: "Old KP",
      accessor: "oldKp",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
    {
      Header: "Daerah",
      accessor: "daerah",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
    {
      Header: "Mukim",
      accessor: "mukim",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
    {
      Header: "Kampung",
      accessor: "kampung",
      style: {
        fontSize: 20,
        width: 150,
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

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      banciId: "15",
      negeri: ["12"],
    },
  });

  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [createSmallholderCensusDataBanci] = useMutation(CREATE_BANCI);
  const [updateSmallholderCensusDataBanci] = useMutation(UPDATE_BANCI);
  const [deleteSmallholderCensusDataBanci] = useMutation(DELETE_BANCI);

  let allSmallholderCensusDataBanci = [];
  if (data?.allSmallholderCensusDataBanci) {
    allSmallholderCensusDataBanci = data.allSmallholderCensusDataBanci;
  }

  const allSmallholderCensusRefDaerah =
    data?.allSmallholderCensusRefDaerah || [];

  const allSmallholderCensusRefMukim = data?.allSmallholderCensusRefMukim || [];
  const allSmallholderCensusRefKampung =
    data?.allSmallholderCensusRefKampung || [];
  const allSmallholderCensusRefParlimen =
    data?.allSmallholderCensusRefParlimen || [];

  const allSmallholderCensusRefParlimenDun =
    data?.allSmallholderCensusRefParlimenDun || [];

  const allSmallholderCensusRefBangsa =
    data?.allSmallholderCensusRefBangsa || [];

  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Banci`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            negeri: "12",
          });
        }}
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { _id, __typename, _createdAt, _updatedAt } = formData;
            if (!_id) {
              await createSmallholderCensusDataBanci({
                variables: {
                  inputJSON: {
                    ...formData,
                  },
                },
              });
            } else {
              await updateSmallholderCensusDataBanci({
                variables: {
                  inputJSON: {
                    ...formData,
                  },
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Data banci saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Name</label>
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
          <label>New KP</label>
          <input
            placeholder="New KP"
            className="form-control"
            value={formData.newKp || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                newKp: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Old KP</label>
          <input
            placeholder="Old KP"
            className="form-control"
            value={formData.oldKp || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                oldKp: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Address 1</label>
          <textarea
            placeholder="Address 1"
            className="form-control"
            value={formData.address1 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                address1: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Address 2</label>
          <textarea
            placeholder="Address 2"
            className="form-control"
            value={formData.address2 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                address2: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Address 3</label>
          <textarea
            placeholder="Address 3"
            className="form-control"
            value={formData.address3 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                address3: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Postal Code</label>
          <input
            placeholder="Postal Code"
            className="form-control"
            value={formData.postalCode || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                postalCode: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Daerah</label>
          <select
            className="form-control"
            value={formData.daerah || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                daerah: e.target.value,
              });
            }}>
            <option value={""}>Daerah</option>
            {allSmallholderCensusRefDaerah.map(daerah => (
              <option value={daerah.daerah}>
                {daerah.code} - {daerah.LDescription}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Mukim</label>
          <select
            className="form-control"
            value={formData.mukim || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                mukim: e.target.value,
              });
            }}>
            <option value={""}>Mukim</option>
            {allSmallholderCensusRefMukim.map(mukim => (
              <option value={mukim.code}>{mukim.LDescription}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Kampung</label>
          <select
            className="form-control"
            value={formData.kampung || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                kampung: e.target.value,
              });
            }}>
            <option value={""}>Kampung</option>
            {allSmallholderCensusRefKampung.map(kampung => (
              <option value={kampung.kampung}>{kampung.LDescription}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Lokasi</label>
          <input
            placeholder="Lokasi"
            className="form-control"
            value={formData.lokasi || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                lokasi: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Parlimen</label>
          <select
            className="form-control"
            value={formData.parlimen || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                parlimen: e.target.value,
              });
            }}>
            <option value={""}>Parlimen</option>
            {allSmallholderCensusRefParlimen.map(p => (
              <option value={p.code}>{p.LDescription}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Tkh Daftar</label>
          <input
            placeholder="Tkh Daftar"
            className="form-control"
            value={formData.tkhDaftar || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                tkhDaftar: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Dun</label>
          <select
            className="form-control"
            value={formData.dun || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                dun: e.target.value,
              });
            }}>
            <option value={""}>Dun</option>
            {allSmallholderCensusRefParlimenDun.map(p => (
              <option value={p.dun}>{p.dun}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Tempat</label>
          <input
            placeholder="Tempat"
            className="form-control"
            value={formData.tempat || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                tempat: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Mail 1</label>
          <input
            type="email"
            placeholder="Mail1@mail.com"
            className="form-control"
            value={formData.mail1 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                mail1: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Mail 2</label>
          <input
            type="email"
            placeholder="Mail2@mail.com"
            className="form-control"
            value={formData.mail2 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                mail2: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Mail 3</label>
          <input
            type="email"
            placeholder="Mail3@mail.com"
            className="form-control"
            value={formData.mail3 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                mail3: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Fax</label>
          <input
            placeholder="Fax"
            className="form-control"
            value={formData.fax || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                fax: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Address R1</label>
          <textarea
            placeholder="Address R1"
            className="form-control"
            value={formData.addressR1 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                addressR1: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Address R2</label>
          <textarea
            placeholder="Address R2"
            className="form-control"
            value={formData.addressR2 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                addressR2: e.target.value,
              });
            }}
          />
        </div>
      </FormModal>
      <Table
        loading={loading}
        columns={columns}
        data={allSmallholderCensusDataBanci}
        withoutHeader={true}
        customUtilities={
          currentUserDontHavePrivilege([
            "Smallholder Profile Cosis Sabah:Update",
          ])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
        onAdd={
          currentUserDontHavePrivilege([
            "Smallholder Profile Cosis Sabah:Create",
          ])
            ? null
            : e => {
                if (e) e.preventDefault();
                setFormData({
                  banciId: "15",
                  negeri: "12",
                });
                setModalVisible(true);
              }
        }
        onRemove={
          currentUserDontHavePrivilege([
            "Smallholder Profile Cosis Sabah:Delete",
          ])
            ? null
            : async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} data ?`,
                  );
                  if (yes) {
                    for (const row of rows) {
                      await deleteSmallholderCensusDataBanci({
                        variables: {
                          _id: row._id,
                          banciId: row.banciId,
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
      />
    </div>
  );
};
export default withApollo({ ssr: true })(DataBanciSabah);
