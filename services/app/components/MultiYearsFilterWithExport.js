import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { SingleSelect } from "./form/SingleSelect";
import gql from "graphql-tag";
import { useMutation, useQuery } from "@apollo/client";
import { hideLoadingSpinner, showLoadingSpinner } from "./App";
import { addNotification, useNotification } from "./Notification";

const EXPORT = gql`
  mutation exportCollectionDataAsExcel($exportConfig: JSON!) {
    exportCollectionDataAsExcel(exportConfig: $exportConfig)
  }
`;

const SEND_TO_WEBSTAT = gql`
  mutation sendToWebstatBCSGlobal(
    $year: String
    $type: String!
    $years: [String]
  ) {
    sendToWebstatBCSGlobal(year: $year, type: $type, years: $years)
  }
`;

export const MultiYearsFilterWithExport = ({
  label,
  options,
  defaultValue = "",
  onSelect,
  exportConfig = {},
  exportButtonVisible = "",
  type = "",
}) => {
  // console.log({ exportConfig });
  const notification = useNotification();
  const [exportCollectionDataAsExcel] = useMutation(EXPORT);
  const [sendToWebstatBCSGlobal] = useMutation(SEND_TO_WEBSTAT);

  const router = useRouter();
  const [year, setYear] = useState(defaultValue);
  let years = [
    ...new Set(
      (router.query.years || "")
        .split(",")
        .map(year => year.trim())
        .filter(year => !!year),
    ),
  ];
  // if (years.length === 0 && defaultValue) {
  //   years = [defaultValue];
  // }

  let { columns = [], filters = { years }, collectionName = "" } = exportConfig;
  columns = columns?.map(column => {
    return {
      Header: columns.Header,
      accessor: columns.accessor,
    };
  });
  // console.log({
  //   collectionName,
  //   filters,
  //   columns,
  // });

  useEffect(() => {
    if (!onSelect) return;

    onSelect(year, !years || years.length === 0 ? [year] : years);
    if (year && (!years || years.length === 0)) {
      let values = [...new Set([...years, year])];
      router.replace({
        pathname: router.pathname,
        query: {
          ...router.query,
          years: values.join(","),
        },
      });
    }
  }, []);

  return (
    <div className="">
      <div className="flex flex-col-reverse md:flex-row">
        <div className="w-40">
          <SingleSelect
            hideFeedbackByDefault
            label={label}
            required
            options={options}
            value={year}
            onChange={e => {
              if (e) e.preventDefault();
              setYear(e.target.value);
              let values = [...new Set([...years, e.target.value])];
              // console.log({ values });
              router.replace({
                pathname: router.pathname,
                query: {
                  ...router.query,
                  years: values.join(","),
                },
              });
              if (onSelect) {
                onSelect(e.target.value, values);
              }
            }}
          />
        </div>
        <div className={`pb-4 md:pb-0 md:pt-10 md:pl-3 ${exportButtonVisible}`}>
          <button
            type="button"
            onClick={async e => {
              if (e) e.preventDefault();
              showLoadingSpinner();
              try {
                let result = await exportCollectionDataAsExcel({
                  variables: {
                    exportConfig,
                  },
                });
                // console.log(result);
                window.location.href = result.data.exportCollectionDataAsExcel;
              } catch (err) {
                notification.handleError(err);
              }
              hideLoadingSpinner();
            }}
            className="btn btn-orange btn-lg shadow-lg border-b-0">
            <i className="fa fa-download" /> Export as Excel
          </button>

          {type ? (
            <button
              type="button"
              onClick={async e => {
                if (e) e.preventDefault();
                showLoadingSpinner();
                try {
                  let result = await sendToWebstatBCSGlobal({
                    variables: {
                      year,
                      type,
                      years: router.query.years
                        ? router.query.years.split(",")
                        : [],
                    },
                  });
                  // console.log(result);
                  notification.addNotification({
                    level: "success",
                    message: "Processing To Push Web Stat",
                  });
                } catch (err) {
                  notification.handleError(err);
                }
                hideLoadingSpinner();
              }}
              className="btn bg-purple-500 btn-lg shadow-lg border-b-0 mx-4 px-4 py-2">
              <i className="fa fa-sync" /> Sync To Webstat
            </button>
          ) : null}
        </div>
      </div>
      <div>
        {years.map(year => {
          return (
            <div
              key={year}
              className="inline-block mr-2 rounded border border-gray-200 text-sm py-1 px-3 relative group">
              {year}
              {years.length === 1 && years[0] === defaultValue ? null : (
                <a
                  href="#"
                  onClick={e => {
                    if (e) e.preventDefault();
                    let values = years.filter(y => y !== year);
                    // console.log({ values });
                    router.replace({
                      pathname: router.pathname,
                      query: {
                        ...router.query,
                        years: values.join(","),
                      },
                    });
                    if (onSelect) {
                      onSelect(values[0] || defaultValue, values);
                    }
                  }}
                  className="absolute top-0 right-0 -mr-2 -mt-2 hover:text-red-500 group-hover:opacity-100 opacity-0">
                  <i className="fa fa-times-circle" />
                </a>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
