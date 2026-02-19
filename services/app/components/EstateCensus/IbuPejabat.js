import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../App";
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

const IbuPejabat = ({
  initateStatus,
  estateFormData,
  handleReset,
  addNewData,
  onSave,
  handleInputEstate,
  handleDelete,
}) => {
  return (
    <div>
      <div className="flex justify-end mb-4">
        {initateStatus === "ADD" ? (
          <div>
            <button
              className="bg-mantis-500 text-md font-bold text-white px-4 py-2 rounded-md shadow-md mx-4"
              onClick={onSave(estateFormData)}>
              <p>
                <i className="fa fa-plus" /> Save
              </p>
            </button>
            <button
              className="bg-red-500 text-md font-bold text-white px-4 py-2 rounded-md shadow-md"
              onClick={handleReset}>
              <p>
                <i className="fa fa-times" /> Cancel
              </p>
            </button>
          </div>
        ) : (
          <div>
            <button
              className="bg-mantis-500 text-md font-bold text-white px-4 py-2 rounded-md shadow-md mx-4"
              onClick={addNewData}>
              <p>
                <i className="fa fa-plus" /> Add
              </p>
            </button>
            <button
              className="bg-red-500 text-md font-bold text-white px-4 py-2 rounded-md shadow-md"
              onClick={handleDelete(estateFormData)}>
              <p>
                <i className="fa fa-times" /> Delete
              </p>
            </button>
          </div>
        )}
      </div>

      {initateStatus === "ADD" ? (
        <div className="border border-gray-500 shadow-md px-4 py-4 rounded-md">
          <div className="form-group">
            <label>Nama</label>
            <input
              className="form-control"
              value={estateFormData.headQuarterAgent || ""}
              onChange={handleInputEstate("headQuarterAgent")}
            />
          </div>

          <div className="form-group">
            <label>Alamat 1</label>
            <input
              className="form-control"
              value={estateFormData.headQuarterAddress1 || ""}
              onChange={handleInputEstate("headQuarterAddress1")}
            />
          </div>
          <div className="form-group">
            <label>Alamat 2</label>
            <input
              className="form-control"
              value={estateFormData.headQuarterAddress2 || ""}
              onChange={handleInputEstate("headQuarterAddress2")}
            />
          </div>
          <div className="form-group">
            <label>Alamat 3</label>
            <input
              className="form-control"
              value={estateFormData.headQuarterAddress3 || ""}
              onChange={handleInputEstate("headQuarterAddress3")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Poskod</label>
              <input
                className="form-control"
                value={estateFormData.headQuarterZip || ""}
                onChange={handleInputEstate("headQuarterZip")}
              />
            </div>
            <div className="form-group">
              <label>Bandar</label>
              <input
                className="form-control"
                value={estateFormData.headQuarterCity || ""}
                onChange={handleInputEstate("headQuarterCity")}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Negeri</label>
            <input
              className="form-control"
              value={estateFormData.headQuarterState || ""}
              onChange={handleInputEstate("headQuarterState")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Tel 1</label>
              <input
                className="form-control"
                value={estateFormData.headQuarterTelephone1 || ""}
                onChange={handleInputEstate("headQuarterTelephone1")}
              />
            </div>
            <div className="form-group">
              <label>Fax 1</label>
              <input
                className="form-control"
                value={estateFormData.headQuarterFax1 || ""}
                onChange={handleInputEstate("headQuarterFax1")}
              />
            </div>

            <div className="form-group">
              <label>Tel 2</label>
              <input
                className="form-control"
                value={estateFormData.headQuarterTelephone2 || ""}
                onChange={handleInputEstate("headQuarterTelephone2")}
              />
            </div>
            <div className="form-group">
              <label>Fax 2</label>
              <input
                className="form-control"
                value={estateFormData.headQuarterFax2 || ""}
                onChange={handleInputEstate("headQuarterFax2")}
              />
            </div>

            <div className="form-group">
              <label>Tel 3</label>
              <input
                className="form-control"
                value={estateFormData.headQuarterTelephone3 || ""}
                onChange={handleInputEstate("headQuarterTelephone3")}
              />
            </div>
            <div className="form-group">
              <label>Fax 3</label>
              <input
                className="form-control"
                value={estateFormData.headQuarterFax3 || ""}
                onChange={handleInputEstate("headQuarterFax3")}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              className="bg-cyan-600 text-white font-bold text-md px-4 py-2 rounded-md shadow-md"
              onClick={onSave(estateFormData)}>
              <p className="fa fa-save" /> Save
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-gray-500 shadow-md px-4 py-4 rounded-md">
          <div className="form-group">
            <label>Nama</label>
            <input
              className="form-control bg-gray-400"
              value={estateFormData.headQuarterAgent || ""}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Alamat 1</label>
            <input
              className="form-control bg-gray-400"
              value={estateFormData.headQuarterAddress1 || ""}
              disabled
            />
          </div>

          <div className="form-group">
            <label>Alamat 2</label>
            <input
              className="form-control bg-gray-400"
              value={estateFormData.headQuarterAddress2 || ""}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Alamat 3</label>
            <input
              className="form-control bg-gray-400"
              value={estateFormData.headQuarterAddress3 || ""}
              disabled
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Poskod</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.headQuarterZip || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Bandar</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.headQuarterCity || ""}
                disabled
              />
            </div>
          </div>

          <div className="form-group">
            <label>Negeri</label>
            <input
              className="form-control bg-gray-400"
              value={estateFormData.headQuarterState || ""}
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Tel 1</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.headQuarterTelephone1 || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Fax 1</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.headQuarterFax1 || ""}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Tel 2</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.headQuarterTelephone2 || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Fax 2</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.headQuarterFax2 || ""}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Tel 3</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.headQuarterTelephone3 || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Fax 3</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.headQuarterFax3 || ""}
                disabled
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default withApollo({ ssr: true })(IbuPejabat);
