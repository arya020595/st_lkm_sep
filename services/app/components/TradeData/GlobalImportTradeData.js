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
import dayjs from "dayjs";
import Dropzone from "react-dropzone";
import Select from "react-select";
const TYPES = [
  { value: "Export", label: "Export" },
  { value: "Import", label: "Import" },
  { value: "Re-Export", label: "Re-Export" },
];
const IMPORT_GLOBAL_TRADE_DATA = gql`
  mutation importTradeDataGlobal(
    $excelBase64: String!
    $year: String!
    $type: String!
    $fileName: String!
  ) {
    importTradeDataGlobal(
      excelBase64: $excelBase64
      year: $year
      type: $type
      fileName: $fileName
    ) {
      countMissingData
      countFixedData
    }
  }
`;
const GlobalImportTradeData = ({ years }) => {
  const YEARS = years.map(m => {
    return {
      value: m,
      label: m,
    };
  });

  const router = useRouter();
  const notification = useNotification();
  const [excelBase64Result, setBase64Result] = useState(null);
  const [importTypes, setImportTypes] = useState("");
  const [selectedYears, setSelectedYears] = useState("");

  const [importTradeDataGlobal] = useMutation(IMPORT_GLOBAL_TRADE_DATA);

  const handleDrop = acceptedFiles => {
    var reader = new FileReader();
    reader.readAsDataURL(acceptedFiles[0]);

    let fileName = acceptedFiles[0].path;
    reader.onload = async () => {
      showLoadingSpinner();
      try {
        let res = await importTradeDataGlobal({
          variables: {
            excelBase64: reader.result,
            year: selectedYears,
            type: importTypes,
            fileName: fileName,
          },
        });

        setBase64Result(res.data.importTradeDataGlobal);

        notification.addNotification({
          title: "Success!",
          message: `Import File Success`,
          level: "success",
        });
      } catch (err) {
        notification.handleError(err);
      }
      hideLoadingSpinner();
    };
    reader.onerror = error => {
      notification.handleError(error);
    };
  };

  return (
    <div className="w-full px-4 mt-4">
      <div className="flex justify-between mb-4">
        <div>
          <p
            className="text-md font-bold cursor-pointer"
            onClick={e => {
              if (e) e.preventDefault();
              router.replace({
                pathname: router.pathname,
                query: {
                  sidebarMenu: "trade_data",
                  appState: "SEP",
                },
              });
            }}>
            <i className="fa fa-arrow-left" /> Back
          </p>
        </div>
        <div>
          <p className="text-xl font-bold">
            <i className="fa fa-upload" /> Import File
          </p>
        </div>
      </div>

      <div className="border-2 border-gray-400 rounded-md px-4 py-4 shadow-md">
        <div className="flex justify-center items-center mt-20">
          <div className="form-group mx-20">
            <label>
              <p className="text-xl font-semibold">Type</p>
            </label>
            <Select
              options={TYPES}
              className="basic-multi-select w-60"
              classNamePrefix="select"
              onChange={data => {
                setImportTypes(data.value);
              }}
            />
          </div>

          <div className="form-group">
            <label>
              <p className="text-xl font-semibold">Year</p>
            </label>
            <Select
              options={YEARS}
              className="basic-multi-select w-60"
              classNamePrefix="select"
              onChange={data => {
                setSelectedYears(data.value);
              }}
            />
          </div>
        </div>

        <div className="border-5 border-mantis-500 rounded-md shadow-md mt-4">
          <Dropzone
            onDrop={acceptedFiles => handleDrop(acceptedFiles)}
            accept="application/vnd.ms-excel, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            style={{
              position: "relative",
              border: "2px solid black",
              padding: "40px 20px",
            }}
            multiple={false}>
            {({ getRootProps, getInputProps }) => (
              <section
                className="card rounded-md px-6"
                style={{
                  border: "8px solid #1AB08D",
                  paddingTop: "2.5rem",
                  paddingBottom: "2.5rem",
                }}
                {...getRootProps()}>
                <input {...getInputProps()} />
                <div className="w-full flex flex-wrap justify-center mb-2">
                  <p className="text-4xl text-mantis-700">
                    <i className="fa fa-file-excel" />
                  </p>
                </div>
                <div className="w-full flex flex-wrap justify-center mb-2">
                  <p className="text-lg font-semibold">
                    Drop file here or click to import
                  </p>
                </div>
              </section>
            )}
          </Dropzone>
        </div>

        <div className="flex justify-center my-4">
          <p className="text-lg font-bold">
            <i className="fa fa-info-circle" /> Attention! The file format for
            import must see the provided template!
          </p>
        </div>
        <div className="flex justify-center mt-4">
          <a
            href={"/public/template/trade_data_global_import_template.xlsx"}
            target="__blank">
            <button className="bg-mantis-500 rounded-md px-4 py-2 shadow-md">
              <p className="text-lg text-white font-bold">
                <i className="fa fa-file-excel" /> Download Template
              </p>
            </button>
          </a>
        </div>

        {excelBase64Result ? (
          <div>
            <div className="flex">
              <p className="text-lg">Total Fixed Data</p>
              <p className="text-lg font-bold mx-4">
                {excelBase64Result.countFixedData} data
              </p>
            </div>

            <div className="flex">
              <p className="text-lg">Total Missing Data</p>
              <p className="text-lg font-bold mx-4">
                {excelBase64Result.countMissingData} data
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(GlobalImportTradeData);
