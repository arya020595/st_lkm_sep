import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../../components/App";
import { handleError } from "../../libs/errors";
import gql from "graphql-tag";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import NumberFormat from "react-number-format";
import dayjs from "dayjs";
import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";
import Select from "react-select";

const QUERY = gql`
  query listQueries($year: String, $years: [String!]) {
    allSingleOrigins(year: $year, years: $years) {
      _id
      year
      companyName
      quarter
      LocalRegion {
        _id
        description
      }
      Trader {
        _id
        name
      }
      tonne
      rmTonne
    }
    allLocalRegion {
      _id
      description
    }
    allTraders {
      _id
      name
    }
    countSingleOrigins
  }
`;

const CREATE_SINGLE_ORIGIN = gql`
  mutation createSingleOrigin(
    $year: Int
    $traderId: String
    $quarter: String
    $regionId: String
    $tonne: Float
    $rmTonne: Float
  ) {
    createSingleOrigin(
      year: $year
      traderId: $traderId
      quarter: $quarter
      regionId: $regionId
      tonne: $tonne
      rmTonne: $rmTonne
    )
  }
`;

const UPDATE_SINGLE_ORIGIN = gql`
  mutation updateSingleOrigin(
    $_id: String!
    $year: Int
    $traderId: String
    $quarter: String
    $regionId: String
    $tonne: Float
    $rmTonne: Float
  ) {
    updateSingleOrigin(
      _id: $_id
      year: $year
      traderId: $traderId
      quarter: $quarter
      regionId: $regionId
      tonne: $tonne
      rmTonne: $rmTonne
    )
  }
`;
const DELETE_SINGLE_ORIGIN = gql`
  mutation deleteSingleOrigin($_id: String!) {
    deleteSingleOrigin(_id: $_id)
  }
`;

const SingleOrigin = () => {
  const notification = useNotification();
  const router = useRouter();
  const { currentUserDontHavePrivilege } = useCurrentUser();

  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1949;
    // console.log([...new Array(toYear - fromYear)])
    return [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });
  }, []);
  const [year, setYear] = useState(YEARS[0]);
  const [years, setYears] = useState([year]);

  const [createSingleOrigin] = useMutation(CREATE_SINGLE_ORIGIN);
  const [updateSingleOrigin] = useMutation(UPDATE_SINGLE_ORIGIN);
  const [deleteSingleOrigin] = useMutation(DELETE_SINGLE_ORIGIN);
  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      years,
      year,
    },
  });
  let allSingleOrigins = data?.allSingleOrigins || [];
  let allLocalRegion = data?.allLocalRegion || [];
  let allTraders = data?.allTraders || [];

  const [formData, setFormData] = useState({
    year,
  });
  const [modalVisible, setModalVisible] = useState(false);

  const columns = useMemo(() => [
    {
      Header: "Year",
      accessor: "year",
      style: {
        fontSize: 20,
      },
      disableFilters: true,
    },
    {
      Header: "Company Name",
      accessor: "Trader.name",
      style: {
        fontSize: 20,
        width: 300,
      },
    },
    {
      Header: "Quarter",
      accessor: "quarter",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Region",
      accessor: "LocalRegion.description",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Tonne",
      accessor: "tonne",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
    },
    {
      Header: "Price (RM/Kg)",
      accessor: "rmTonne",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          {Number(props.value)
            .toLocaleString("en-GB")
            .replace(/(\d)(?=(\d{3})+\.)/g, "$1,")}
        </span>
      ),
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
                  regionId: propsTable.row.original.LocalRegion?._id || "",
                  traders: [
                    {
                      label: propsTable.row.original.Trader?.name || "",
                      value: propsTable.row.original.Trader?._id || "",
                    },
                  ],
                });
              }}
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg">
              <p className="text-white font-bold text-md">
                <i className="fa fa-pencil-alt " /> Edit
              </p>
            </button>
          </div>
        );
      },
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Single Origin | Price</title>
      </Head>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Single Origin`}
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
              await createSingleOrigin({
                variables: {
                  ...formData,
                  year: parseInt(formData?.year || dayjs().format("YYYY")),
                },
              });
            } else {
              await updateSingleOrigin({
                variables: {
                  ...formData,
                  year: parseInt(formData?.year || dayjs().format("YYYY")),
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Single Origin saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Year*</label>
          <select
            className="form-control"
            value={formData.year}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                year: parseInt(e.target.value),
              });
            }}
            required>
            {YEARS.map(y => (
              <option value={parseInt(y)}>{y}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Company Name*</label>
          <Select
            options={allTraders.map(trade => {
              return {
                label: trade.name,
                value: trade._id,
              };
            })}
            className="basic-multi-select"
            classNamePrefix="select"
            onChange={data => {
              setFormData({
                ...formData,
                traderId: data.value,
                traders: [data],
              });
            }}
            value={formData.traders || ""}
          />
        </div>
        <div className="form-group">
          <label>Quarter</label>
          <select
            className="form-control"
            value={formData.quarter || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                quarter: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Quarter
            </option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
          </select>
        </div>

        <div className="form-group">
          <label>Region*</label>
          <select
            className="form-control"
            value={formData.regionId || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                regionId: e.target.value,
              });
            }}
            required>
            <option value="" disabled>
              Select Region
            </option>
            {allLocalRegion.map(reg => (
              <option value={reg._id}>{reg.description}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Tonne</label>
          <NumberFormat
            className="form-control"
            value={formData.tonne || 0}
            thousandSeparator={","}
            fixedDecimalScale={true}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                tonne: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Price (RM/Kg)</label>
          <NumberFormat
            className="form-control"
            value={formData.rmTonne || 0}
            thousandSeparator={","}
            fixedDecimalScale={true}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                rmTonne: e.floatValue,
              });
            }}
          />
        </div>
      </FormModal>

      <div className="mt-26  pr-0 md:pr-10 py-4 bg-white">
        <Table
          customHeaderUtilities={
            <MultiYearsFilterWithExport
              label="Year Filter"
              defaultValue={dayjs().format("YYYY")}
              options={YEARS}
              onSelect={(year, years) => {
                setYear(year);
                setYears(years);
              }}
              exportConfig={{
                title: "Prices - Single Origin",
                // collectionName: "SingleOrigins",
                // filters: {
                //   year: years.map(year => parseInt(year)),
                // },
                columns,
                data: allSingleOrigins,
              }}
            />
          }
          loading={false}
          columns={columns}
          data={allSingleOrigins}
          withoutHeader={true}
          onAdd={
            currentUserDontHavePrivilege(["Single Origin:Create"])
              ? null
              : e => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({});
                }
          }
          onRemove={
            currentUserDontHavePrivilege(["Single Origin:Create"])
              ? null
              : async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} origins?`,
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteSingleOrigin({
                          variables: {
                            _id: row._id,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} origins deleted`,
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
            currentUserDontHavePrivilege(["Single Origin:Update"])
              ? null
              : customUtilities
          }
          customUtilitiesPosition="left"
        />

        <div className="flex mt-4">
          <p className="text-md">Total Data: </p>
          <p className="text-md font-bold mx-4">
            {data?.countSingleOrigins || 0}
          </p>
        </div>
      </div>
    </AdminArea>
  );
};

export default withApollo({ ssr: true })(SingleOrigin);
