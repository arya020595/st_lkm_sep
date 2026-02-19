import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../App";
import { handleError } from "../../libs/errors";
import gql from "graphql-tag";
import {
  useMutation,
  useQuery,
  useApolloClient,
  ApolloProvider,
} from "@apollo/client";
import { useRouter } from "next/router";
import Select from "react-select";
import FileSaver from "file-saver";
import { base64toBlob } from "../../libs/base64";

const TYPES = [
  { value: "Export", label: "Export" },
  { value: "Import", label: "Import" },
  { value: "Re-Export", label: "Re-Export" },
];

const EXPORT_TRADE_DATA = gql`
  mutation exportTradeDataGlobal($type: [String]!, $year: [String]!) {
    exportTradeDataGlobal(type: $type, year: $year)
  }
`;

const GlobalExportTradeData = ({ years }) => {
  const notification = useNotification();
  const [exportTradeDataGlobal] = useMutation(EXPORT_TRADE_DATA);

  const YEARS = years.map(m => {
    return {
      value: m,
      label: m,
    };
  });
  const router = useRouter();
  const [exportTypes, setExportTypes] = useState([...TYPES]);
  const [selectedMonths, setSelectMonths] = useState([]);
  const [selectedYears, setSelectedYears] = useState([YEARS[0]]);

  const submitExport = async e => {
    if (e) e.preventDefault();
    showLoadingSpinner();
    try {
      // console.log({ selectedYears, selectedMonths, exportTypes });
      if (exportTypes.length === 0 || selectedYears.length === 0) {
        throw {
          message: "Filter Cannot Be Empty",
        };
      }
      const response = await exportTradeDataGlobal({
        variables: {
          year: selectedYears.map(y => y.value),
          type: exportTypes.map(t => t.value),
        },
      });

      // const blob = base64toBlob(
      //   response.data.exportTradeDataGlobal,
      //   "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      // );
      // FileSaver.saveAs(blob, `export_trade_data_global.xlsx`);
      FileSaver.saveAs(response.data.exportTradeDataGlobal, `export_trade_data_global.xlsx`);
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
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
            <i className="fa fa-download" /> Export File
          </p>
        </div>
      </div>

      <div className="border-2 border-gray-400 rounded-md px-4 py-4 shadow-md">
        <p className="text-2xl font-bold">Check List Export Data</p>

        <div className="flex justify-center items-center mt-20">
          <div className="form-group">
            <label>
              <p className="text-xl font-semibold">Type</p>
            </label>
            <Select
              isMulti
              options={TYPES}
              className="basic-multi-select w-60"
              classNamePrefix="select"
              onChange={data => {
                setExportTypes([...data]);
              }}
              value={exportTypes}
            />
          </div>

          <div className="form-group ml-4">
            <label>
              <p className="text-xl font-semibold">Year</p>
            </label>
            <Select
              isMulti
              options={YEARS}
              className="basic-multi-select w-60"
              classNamePrefix="select"
              onChange={data => {
                setSelectedYears([...data]);
              }}
              value={selectedYears}
            />
          </div>
        </div>
        <div className="flex justify-center items-center mt-4">
          <button
            className="bg-mantis-700 px-40 py-2 text-white font-bold rounded-md"
            onClick={submitExport}>
            <p>
              <i className="fa fa-upload" /> Export File
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(GlobalExportTradeData);
