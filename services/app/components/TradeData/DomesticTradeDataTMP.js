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
import { FormModal } from "../Modal";
import Table from "../Table";
import NumberFormat from "react-number-format";
const TYPES = [
  { value: "Export", label: "Export" },
  { value: "Import", label: "Import" },
  { value: "Re-Export", label: "Re-Export" },
];

const IMPORT_TRADE_DATA = gql`
  mutation importTradeDataDomestic(
    $excelBase64: String!
    $year: Int!
    $type: String!
    $month: Int!
    $monthName: String!
    $fileName: String!
  ) {
    importTradeDataDomestic(
      excelBase64: $excelBase64
      year: $year
      type: $type
      month: $month
      monthName: $monthName
      fileName: $fileName
    ) {
      countMissingData
      countFixedData
    }
  }
`;

const PREVIEW_TRADE_DATA = gql`
  mutation previewImportTradeDataDomestic(
    $excelBase64: String!
    $year: Int!
    $type: String!
    $month: Int!
    $monthName: String!
    $fileName: String!
  ) {
    previewImportTradeDataDomestic(
      excelBase64: $excelBase64
      year: $year
      type: $type
      month: $month
      monthName: $monthName
      fileName: $fileName
    )
  }
`;

const DomesticImportTradeData = ({ years, months }) => {
  const MONTHS = months.map(m => {
    return {
      value: m.month,
      label: m.monthName,
    };
  });
  const YEARS = years.map(m => {
    return {
      value: m,
      label: m,
    };
  });

  const router = useRouter();
  const notification = useNotification();
  const [importTradeDataDomestic] = useMutation(IMPORT_TRADE_DATA);
  const [previewImportTradeDataDomestic] = useMutation(PREVIEW_TRADE_DATA);
  const [excelBase64Result, setBase64Result] = useState(null);
  const [importTypes, setImportTypes] = useState("");
  const [selectedMonths, setSelectMonths] = useState([]);
  const [selectedYears, setSelectedYears] = useState("");
  const [previewList, setPreviewList] = useState({
    visible: false,
    data: [],
  });

  const previewColumns = useMemo(() => [
    {
      Header: "Year",
      accessor: "year",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Month",
      accessor: "monthName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Product Type",
      accessor: "localSITCCode",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Country",
      accessor: "countryName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Quantity",
      accessor: "quantity",
      Cell: props => (
        <NumberFormat
          className="form-control bg-none border-0 text-lg"
          value={props.value || 0}
          thousandSeparator={","}
          decimalSeparator={"."}
          fixedDecimalScale={true}
          disabled={true}
          decimalScale={2}
        />
      ),
    },
    {
      Header: "Value",
      accessor: "value",
      Cell: props => (
        <NumberFormat
          className="form-control bg-none border-0 text-lg"
          value={props.value || 0}
          thousandSeparator={","}
          decimalSeparator={"."}
          fixedDecimalScale={true}
          disabled={true}
          decimalScale={2}
        />
      ),
    },
  ]);

  const handleDrop = acceptedFiles => {
    var reader = new FileReader();
    reader.readAsDataURL(acceptedFiles[0]);

    reader.onload = async () => {
      showLoadingSpinner();
      try {
        if (!importTypes || selectedMonths.length === 0 || !selectedYears) {
          throw {
            message: "Filter Invalid",
          };
        }
        let fileName = acceptedFiles[0].path;

        let previewRes = await previewImportTradeDataDomestic({
          variables: {
            excelBase64: reader.result,
            year: parseInt(selectedYears),
            type: importTypes,
            month: selectedMonths[0].value,
            monthName: selectedMonths[0].label,
            fileName,
          },
        });

        setPreviewList({
          visible: true,
          data: previewRes.data.previewImportTradeDataDomestic,
        });

        // let res = await importTradeDataDomestic({
        //   variables: {
        //     excelBase64: reader.result,
        //     year: parseInt(selectedYears),
        //     type: importTypes,
        //     month: selectedMonths[0].value,
        //     monthName: selectedMonths[0].label,
        //     fileName,
        //   },
        // });
        // setBase64Result(res.data.importTradeDataDomestic);

        // if (excelBase64Result && excelBase64Result.countMissingData > 0) {
        //   throw {
        //     message: `There is ${excelBase64Result.countMissingData} invalid/missing data!`,
        //   };
        // } else {
        //   notification.addNotification({
        //     title: "Success!",
        //     message: `Import File Success`,
        //     level: "success",
        //   });
        // }
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
      <FormModal
        title={`Preview`}
        size="xl"
        visible={previewList.visible}
        onClose={e => {
          if (e) e.preventDefault();
          setPreviewList({
            visible: false,
            data: [],
          });
        }}>
        <Table
          loading={false}
          columns={previewColumns}
          data={previewList.data}
          withoutHeader={true}
        />
      </FormModal>
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
          <div className="form-group">
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
          <div className="form-group mx-20">
            <label>
              <p className="text-xl font-semibold">Month</p>
            </label>
            <Select
              options={MONTHS}
              className="basic-multi-select w-60"
              classNamePrefix="select"
              onChange={data => {
                setSelectMonths([data]);
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
            href={"/public/template/trade_data_domestic_import_template.xlsx"}
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
export default withApollo({ ssr: true })(DomesticImportTradeData);
