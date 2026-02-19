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

import getConfig from "next/config";

const { publicRuntimeConfig } = getConfig();
const { MODE } = publicRuntimeConfig;

const JenisHakMilik = () => {
  const router = useRouter();
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const columns = useMemo(() => [
    {
      Header: "ID Estate",
      accessor: "estateId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Taraf Sah",
      accessor: "tarafSah",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Kenyataan",
      accessor: "kenyataan",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Jenis Hak Milik",
      accessor: "jenisHakMilik",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Tahun Banci",
      accessor: "tahunBanci",
      style: {
        fontSize: 20,
      },
    },
  ]);
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Jenis Hak Milik</title>
      </Head>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Jenis Hak Milik`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({});
        }}>
        <div className="form-group">
          <label>ID Estate</label>
          <select
            className="form-control"
            value={formData.estateId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                estateId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select ID Estate
            </option>
          </select>
        </div>

        <div className="form-group">
          <label>Taraf Sah</label>
          <input
            className="form-control"
            value={formData.tarafSah || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                tarafSah: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Kenyataan</label>
          <input
            className="form-control"
            value={formData.kenyataan || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                kenyataan: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Jenis Hak Milik</label>
          <input
            className="form-control"
            value={formData.jenisHakMilik || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                jenisHakMilik: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Tahun Banci</label>
          <input
            className="form-control"
            value={formData.tahunBanci || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                tahunBanci: parseInt(e.target.value),
              });
            }}
          />
        </div>
      </FormModal>

      <div className="mt-28 mx-10">
        <div className="border border-gray-200 shadow-md px-4 py-4 rounded-md shadow-md">
          <div className="grid grid-cols-5 gap-2">
            <div className="form-group">
              <label>ID Estate</label>
              <select className="form-control" value={""}>
                <option value="" disabled>
                  Select ID Estate
                </option>
              </select>
            </div>
            <div className="form-group">
              <label>Jenis Rekod</label>
              <select className="form-control" value={""}>
                <option value="" disabled>
                  Select Jenis Rekod
                </option>
              </select>
            </div>
            <div className="form-group">
              <label>Negeri</label>
              <select className="form-control" value={""}>
                <option value="" disabled>
                  Select Negeri
                </option>
              </select>
            </div>
            <div className="form-group">
              <label>Daerah</label>
              <select className="form-control" value={""}>
                <option value="" disabled>
                  Select Daerah
                </option>
              </select>
            </div>
            <div className="form-group">
              <label>Jenis Estate</label>
              <select className="form-control" value={""}>
                <option value="" disabled>
                  Select Jenis Estate
                </option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Nama</label>
            <select className="form-control" value={""}>
              <option value="" disabled>
                Select Nama
              </option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="form-group">
              <label>Estate</label>
              <select className="form-control" value={""}>
                <option value="" disabled>
                  Select Estate
                </option>
              </select>
            </div>
            <div className="form-group">
              <label>Tahun Banci</label>
              <select className="form-control" value={""}>
                <option value="" disabled>
                  Select Tahun Banci
                </option>
              </select>
            </div>
            <div className="form-group">
              <label>Mulai</label>
              <select className="form-control" value={""}>
                <option value="" disabled>
                  Select Mulai
                </option>
              </select>
            </div>
            <div className="form-group">
              <label>Dari</label>
              <select className="form-control" value={""}>
                <option value="" disabled>
                  Select Dari
                </option>
              </select>
            </div>
          </div>

          <button className="bg-mantis-500 px-4 py-2 rounded-md shadow-md text-white font-bold text-md mt-10">
            <p>
              <i className="fa fa-save" /> Submit
            </p>
          </button>
        </div>

        <div className="mt-4">
          <Table
            loading={false}
            columns={columns}
            data={[]}
            withoutHeader={true}
            onAdd={e => {
              if (e) e.preventDefault();
              setModalVisible(true);
              setFormData({});
            }}
          />
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(JenisHakMilik);
