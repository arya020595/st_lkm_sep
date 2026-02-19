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

const Information = ({
  initateStatus,
  estateFormData,
  handleReset,
  addNewData,
  onSave,
  handleInputEstate,
  editData,
  handleDelete,
  currentUserDontHavePrivilege,
}) => {
  return (
    <div>
      <div className="flex justify-end mb-4">
        {initateStatus === "ADD" || initateStatus === "EDIT" ? (
          <div>
            {currentUserDontHavePrivilege([
              "Estate Information:Create",
            ]) ? null : (
              <button
                className="bg-mantis-500 text-md font-bold text-white px-4 py-2 rounded-md shadow-md mx-4"
                onClick={onSave(estateFormData)}>
                <p>
                  <i className="fa fa-plus" /> Save
                </p>
              </button>
            )}

            {currentUserDontHavePrivilege([
              "Estate Information:Create",
            ]) ? null : (
              <button
                className="bg-red-500 text-md font-bold text-white px-4 py-2 rounded-md shadow-md"
                onClick={handleReset}>
                <p>
                  <i className="fa fa-times" /> Cancel
                </p>
              </button>
            )}
          </div>
        ) : (
          <div>
            {currentUserDontHavePrivilege([
              "Estate Information:Create",
            ]) ? null : (
              <button
                className="bg-mantis-500 text-md font-bold text-white px-4 py-2 rounded-md shadow-md mx-4"
                onClick={addNewData}>
                <p>
                  <i className="fa fa-plus" /> Add
                </p>
              </button>
            )}

            {currentUserDontHavePrivilege([
              "Estate Information:Update",
            ]) ? null : (
              <button
                className="bg-yellow-500 text-md font-bold text-white px-4 py-2 rounded-md shadow-md mx-4"
                onClick={editData(estateFormData)}>
                <p>
                  <i className="fa fa-plus" /> Edit
                </p>
              </button>
            )}

            {currentUserDontHavePrivilege([
              "Estate Information:Delete",
            ]) ? null : (
              <button
                className="bg-red-500 text-md font-bold text-white px-4 py-2 rounded-md shadow-md"
                onClick={handleDelete(estateFormData)}>
                <p>
                  <i className="fa fa-times" /> Delete
                </p>
              </button>
            )}
          </div>
        )}
      </div>

      {initateStatus === "ADD" || initateStatus === "EDIT" ? (
        <div className="border border-gray-500 shadow-md px-4 py-4 rounded-md">
          <div className="form-group">
            <label>Nama</label>
            <input
              className="form-control"
              value={estateFormData.estateName || ""}
              onChange={handleInputEstate("estateName")}
            />
          </div>
          <div className="form-group">
            <label>Estate</label>
            <input
              className="form-control"
              value={estateFormData.estateInfo || ""}
              onChange={handleInputEstate("estateInfo")}
            />
          </div>
          <div className="form-group">
            <label>Alamat 1</label>
            <input
              className="form-control"
              value={estateFormData.estateAddress1 || ""}
              onChange={handleInputEstate("estateAddress1")}
            />
          </div>

          <div className="form-group">
            <label>Alamat 2</label>
            <input
              className="form-control bg-gray-400"
              value={estateFormData.estateAddress2 || ""}
              onChange={handleInputEstate("estateAddress2")}
            />
          </div>

          <div className="form-group">
            <label>Alamat 3</label>
            <input
              className="form-control bg-gray-400"
              value={estateFormData.estateAddress3 || ""}
              onChange={handleInputEstate("estateAddress3")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Poskod</label>
              <input
                className="form-control"
                value={estateFormData.estateZip || ""}
                onChange={handleInputEstate("estateZip")}
              />
            </div>
            <div className="form-group">
              <label>Bandar</label>
              <input
                className="form-control"
                value={estateFormData.estateCity || ""}
                onChange={handleInputEstate("estateCity")}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Negeri</label>
            <input
              className="form-control"
              value={estateFormData.estateState || ""}
              onChange={handleInputEstate("estateState")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Tel 1</label>
              <input
                className="form-control"
                value={estateFormData.estateTelephone1 || ""}
                onChange={handleInputEstate("estateTelephone1")}
              />
            </div>
            <div className="form-group">
              <label>Fax 1</label>
              <input
                className="form-control"
                value={estateFormData.estateFax1 || ""}
                onChange={handleInputEstate("estateFax1")}
              />
            </div>

            <div className="form-group">
              <label>Tel 2</label>
              <input
                className="form-control"
                value={estateFormData.estateTelephone2 || ""}
                onChange={handleInputEstate("estateTelephone2")}
              />
            </div>
            <div className="form-group">
              <label>Fax 2</label>
              <input
                className="form-control"
                value={estateFormData.estateFax2 || ""}
                onChange={handleInputEstate("estateFax2")}
              />
            </div>

            <div className="form-group">
              <label>Tel 3</label>
              <input
                className="form-control"
                value={estateFormData.estateTelephone3 || ""}
                onChange={handleInputEstate("estateTelephone3")}
              />
            </div>
            <div className="form-group">
              <label>Fax 3</label>
              <input
                className="form-control"
                value={estateFormData.estateFax3 || ""}
                onChange={handleInputEstate("estateFax3")}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button
              className="bg-mantis-500 text-md font-bold text-white px-4 py-2 rounded-md shadow-md mx-4"
              onClick={onSave(estateFormData)}>
              <p>
                <i className="fa fa-plus" /> Save
              </p>
            </button>
          </div>
        </div>
      ) : (
        <div className="border border-gray-500 shadow-md px-4 py-4 rounded-md">
          <div className="form-group">
            <label>Nama</label>
            <input
              className="form-control bg-gray-400"
              value={estateFormData.estateName || ""}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Estate</label>
            <input
              className="form-control bg-gray-400 "
              value={estateFormData.estateInfo || ""}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Alamat 1</label>
            <input
              className="form-control bg-gray-400"
              value={estateFormData.estateAddress1 || ""}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Alamat 2</label>
            <input
              className="form-control bg-gray-400"
              value={estateFormData.estateAddress2 || ""}
              disabled
            />
          </div>

          <div className="form-group">
            <label>Alamat 3</label>
            <input
              className="form-control bg-gray-400"
              value={estateFormData.estateAddress3 || ""}
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Poskod</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.estateZip || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Bandar</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.estateCity || ""}
                disabled
              />
            </div>
          </div>

          <div className="form-group">
            <label>Negeri</label>
            <input
              className="form-control bg-gray-400"
              value={estateFormData.estateState || ""}
              disabled
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Tel 1</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.estateTelephone1}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Fax 1</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.estateFax1}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Tel 2</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.estateTelephone2}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Fax 2</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.estateFax2}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Tel 3</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.estateTelephone3}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Fax 3</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.estateFax3}
                disabled
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default withApollo({ ssr: true })(Information);
