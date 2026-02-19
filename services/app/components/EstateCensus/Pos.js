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

const Pos = ({
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
              value={estateFormData.postName || ""}
              onChange={handleInputEstate("postName")}
            />
          </div>
          <div className="form-group">
            <label>Alamat 1</label>
            <input
              className="form-control"
              value={estateFormData.postAddress || ""}
              onChange={handleInputEstate("postAddress")}
            />
          </div>
          <div className="form-group">
            <label>Alamat 2</label>
            <input
              className="form-control"
              value={estateFormData.postAddress1 || ""}
              onChange={handleInputEstate("postAddress1")}
            />
          </div>
          <div className="form-group">
            <label>Alamat 3</label>
            <input
              className="form-control"
              value={estateFormData.postAddress2 || ""}
              onChange={handleInputEstate("postAddress2")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Poskod</label>
              <input
                className="form-control"
                value={estateFormData.postZip || ""}
                onChange={handleInputEstate("postZip")}
              />
            </div>
            <div className="form-group">
              <label>Bandar</label>
              <input
                className="form-control"
                value={estateFormData.postCity || ""}
                onChange={handleInputEstate("postCity")}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Negeri</label>
            <input
              className="form-control"
              value={estateFormData.postState || ""}
              onChange={handleInputEstate("postState")}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Tel 1</label>
              <input
                className="form-control"
                value={estateFormData.postTelephone1 || ""}
                onChange={handleInputEstate("postTelephone1")}
              />
            </div>
            <div className="form-group">
              <label>Fax 1</label>
              <input
                className="form-control"
                value={estateFormData.postFax1 || ""}
                onChange={handleInputEstate("postFax1")}
              />
            </div>

            <div className="form-group">
              <label>Tel 2</label>
              <input
                className="form-control"
                value={estateFormData.postTelephone2 || ""}
                onChange={handleInputEstate("postTelephone2")}
              />
            </div>
            <div className="form-group">
              <label>Fax 2</label>
              <input
                className="form-control"
                value={estateFormData.postFax2 || ""}
                onChange={handleInputEstate("postFax2")}
              />
            </div>

            <div className="form-group">
              <label>Tel 3</label>
              <input
                className="form-control"
                value={estateFormData.postTelephone3 || ""}
                onChange={handleInputEstate("postTelephone3")}
              />
            </div>
            <div className="form-group">
              <label>Fax 3</label>
              <input
                className="form-control"
                value={estateFormData.postFax3 || ""}
                onChange={handleInputEstate("postFax3")}
              />
            </div>
          </div>

          <div className="grid grid-cols-8">
            <div className="form-group">
              <label>Perhatian</label>
              <input
                className="form-control"
                value={estateFormData.postSir || ""}
                onChange={handleInputEstate("postSir")}
              />
            </div>
            <div className="col-span-7">
              <div className="form-group">
                <label>.</label>
                <input
                  className="form-control"
                  value={estateFormData.postCont || ""}
                  onChange={handleInputEstate("postCont")}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <button className="bg-cyan-600 text-white font-bold text-md px-4 py-2 rounded-md shadow-md">
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
              value={estateFormData.postName || ""}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Alamat 1</label>
            <input
              className="form-control bg-gray-400"
              value={estateFormData.postAddress || ""}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Alamat 2</label>
            <input
              className="form-control bg-gray-400"
              value={estateFormData.postAddress1 || ""}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Alamat 3</label>
            <input
              className="form-control bg-gray-400"
              value={estateFormData.postAddress2 || ""}
              disabled
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Poskod</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.postZip || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Bandar</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.postCity || ""}
                disabled
              />
            </div>
          </div>
          <div className="form-group">
            <label>Negeri</label>
            <input
              className="form-control bg-gray-400"
              value={estateFormData.postState || ""}
              disabled
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>Tel 1</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.postTelephone1 || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Fax 1</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.postFax1 || ""}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Tel 2</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.postTelephone2 || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Fax 2</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.postFax2 || ""}
                disabled
              />
            </div>

            <div className="form-group">
              <label>Tel 3</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.postTelephone3 || ""}
                disabled
              />
            </div>
            <div className="form-group">
              <label>Fax 3</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.postFax3 || ""}
                disabled
              />
            </div>
          </div>
          <div className="grid grid-cols-8">
            <div className="form-group">
              <label>Perhatian</label>
              <input
                className="form-control bg-gray-400"
                value={estateFormData.postSir || ""}
                disabled
              />
            </div>
            <div className="col-span-7">
              <div className="form-group">
                <label>.</label>
                <input
                  className="form-control bg-gray-400"
                  value={estateFormData.postCont || ""}
                  disabled
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default withApollo({ ssr: true })(Pos);
