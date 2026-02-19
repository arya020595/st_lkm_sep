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
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Table from "../../components/TableAsync";
import { FormModal } from "../../components/Modal";
import NumberFormat from "react-number-format";
import dayjs from "dayjs";
import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";
const QUERY = gql`
  query listQueries($year: String, $years: [String!]) {
    countCocoaMonitor
    allCocoaMonitor(year: $year, years: $years) {
      _id
      code
      censusYear
      value
    }
  }
`;

const CREATE_COCOA_MONITOR = gql`
  mutation createCocoaMonitor($code: String!, $censusYear: Int, $value: Float) {
    createCocoaMonitor(code: $code, censusYear: $censusYear, value: $value)
  }
`;

const UPDATE_COCOA_MONITOR = gql`
  mutation updateCocoaMonitor(
    $_id: String!
    $code: String
    $censusYear: Int
    $value: Float
  ) {
    updateCocoaMonitor(
      _id: $_id
      code: $code
      censusYear: $censusYear
      value: $value
    )
  }
`;

const DELETE_COCOA_MONITOR = gql`
  mutation deleteCocoaMonitor($_id: String!) {
    deleteCocoaMonitor(_id: $_id)
  }
`;
const ValidationCode = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const columns = useMemo(() => [
    {
      Header: "Census Year",
      accessor: "censusYear",
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
      Header: "Value",
      accessor: "value",
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

  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1980;
    // console.log([...new Array(toYear - fromYear)])
    return [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });
  }, []);

  const [year, setYear] = useState(YEARS[0]);
  const [years, setYears] = useState([year]);

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      // regionId: formData.regionId || "",
      year,
      years,
    },
  });

  const [createCocoaMonitor] = useMutation(CREATE_COCOA_MONITOR);
  const [updateCocoaMonitor] = useMutation(UPDATE_COCOA_MONITOR);
  const [deleteCocoaMonitor] = useMutation(DELETE_COCOA_MONITOR);

  let allCocoaMonitor = [];
  if (data?.allCocoaMonitor) {
    allCocoaMonitor = data.allCocoaMonitor;
  }
  // console.log({ allCocoaMonitor });

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Cocoa Monitor</title>
      </Head>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Cocoa Monitor`}
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
              await createCocoaMonitor({
                variables: {
                  ...formData,
                  censusYear: parseInt(formData.censusYear),
                },
              });
            } else {
              await updateCocoaMonitor({
                variables: {
                  ...formData,
                  censusYear: parseInt(formData.censusYear),
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Data saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Code*</label>
          <input
            placeholder="Code"
            className="form-control"
            value={formData.code || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                code: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Census Year*</label>
          <select
            className="form-control"
            value={formData.censusYear || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                censusYear: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Census Year
            </option>
            {YEARS.map(year => (
              <option value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Value*</label>
          <NumberFormat
            className="form-control"
            value={formData.value || 0}
            thousandSeparator={","}
            decimalSeparator={"."}
            fixedDecimalScale={true}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();

              setFormData({
                ...formData,
                value: e.floatValue,
              });
            }}
          />
        </div>
      </FormModal>

      <div className="mt-26  pr-0 md:pr-10 py-4 bg-white h-full">
        <Table
          loading={loading}
          columns={columns}
          data={allCocoaMonitor}
          withoutHeader={true}
          customHeaderUtilities={
            <div>
              <MultiYearsFilterWithExport
                label="Year Filter"
                defaultValue={dayjs().format("YYYY")}
                options={YEARS}
                onSelect={(year, years) => {
                  setYear(year);
                  setYears(years);
                }}
                exportButtonVisible={"hidden"}
              />
              {/* <SingleSelect
                hideFeedbackByDefault
                label="Year Filter"
                required
                options={YEARS}
                value={year}
                onChange={e => {
                  if (e) e.preventDefault();
                  router.push({
                    pathname: router.pathname,
                    query: {
                      ...router.query,
                      year: e.target.value,
                    },
                  });
                }}
              /> */}
            </div>
          }
          onAdd={
            currentUserDontHavePrivilege(["Cocoa Monitor:Create"])
              ? null
              : e => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({
                    ncheck: "" + countCocoaMonitor + 1,
                  });
                }
          }
          onRemove={
            currentUserDontHavePrivilege(["Cocoa Monitor:Delete"])
              ? null
              : async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} data?`,
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteCocoaMonitor({
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
            currentUserDontHavePrivilege(["Cocoa Monitor:Update"])
              ? null
              : customUtilities
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(ValidationCode);
