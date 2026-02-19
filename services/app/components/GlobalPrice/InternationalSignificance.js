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
import Link from "next/link";
import AdminArea from "../AdminArea";
import Table from "../Table";
import { FormModal } from "../Modal";
import NumberFormat from "react-number-format";
import { SingleSelect } from "../form/SingleSelect";
import dayjs from "dayjs";
import { MultiYearsFilterWithExport } from "../MultiYearsFilterWithExport";
import jwt from "jsonwebtoken";
import getConfig from "next/config";
const { publicRuntimeConfig } = getConfig();
const { TOKENIZE } = publicRuntimeConfig;

const MONTHS = [
  { monthName: "January", month: 1 },
  { monthName: "February", month: 2 },
  { monthName: "March", month: 3 },
  { monthName: "April", month: 4 },
  { monthName: "May", month: 5 },
  { monthName: "June", month: 6 },
  { monthName: "July", month: 7 },
  { monthName: "August", month: 8 },
  { monthName: "September", month: 9 },
  { monthName: "October", month: 10 },
  { monthName: "November", month: 11 },
  { monthName: "Desember", month: 12 },
];

const QUERY = gql`
  query listQueries {
    allSourcesTokenized
  }
`;

const QUERY_INTERNATIONAL_SIGNIFICANE = gql`
query internationalSignificaneQuery($year: String, $years: [String!]){
  allInternationalSignificancePricesTokenized(year: $year, years: $years)
}
`

const CREATE_INTERNATIONAL_SIGNIFICANCE = gql`
  mutation createInternationalSignificancePriceTokenized(
    $tokenized: String!
  ) {
    createInternationalSignificancePriceTokenized(
      tokenized: $tokenized
    )
  }
`;

const UPDATE_INTERNATIONAL_SIGNIFICANCE = gql`
  mutation updateInternationalSignificancePriceTokenized(
    $tokenized: String!
  ) {
    updateInternationalSignificancePriceTokenized(
      tokenized: $tokenized
    )
  }
`;
const DELETE_INTERNATIONAL_SIGNIFICANCE = gql`
  mutation deleteInternationalSignificancePriceTokenized($tokenized: String!) {
    deleteInternationalSignificancePriceTokenized(tokenized: $tokenized)
  }
`;
const MonthlyAnnualAverageICCO = ({ currentUserDontHavePrivilege }) => {
  const notification = useNotification();
  const client = useApolloClient()
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();
  const [formData, setFormData] = useState({
    year: router.query.year
      ? parseInt(router.query.year)
      : parseInt(dayjs().format("YYYY")),
  });
  const columns = useMemo(() => [
    {
      Header: "Year",
      accessor: "year",
      style: {
        fontSize: 20,
        width: 100,
      },
    },
    {
      Header: "Month",
      accessor: "month",
      style: {
        fontSize: 20,
        width: 100,
      },
    },
    {
      Header: "Source",
      accessor: "sourceName",
      style: {
        fontSize: 20,
        width: 150,
      },
    },
    {
      Header: "London Future (£/Tonne)",
      accessor: "londonFuture",
      style: {
        fontSize: 20,
        width: 200,
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
      Header: "New York Futures (US cents/lb)",
      accessor: "newYorkFuture",
      style: {
        fontSize: 20,
        width: 200,
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

  // const year = String(router.query.year || dayjs().format("YYYY"));
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
    // variables: {
    //   // regionId: formData.regionId || "",
    //   year,
    //   years,
    // },
  });

  const [createInternationalSignificancePrice] = useMutation(
    CREATE_INTERNATIONAL_SIGNIFICANCE,
  );
  const [updateInternationalSignificancePrice] = useMutation(
    UPDATE_INTERNATIONAL_SIGNIFICANCE,
  );
  const [deleteInternationalSignificancePrice] = useMutation(
    DELETE_INTERNATIONAL_SIGNIFICANCE,
  );

  let [savedCount, setSavedCount] = useState(0)
  let [allInternationalSignificancePrices, setAllInternationalSignificancePrices] = useState([])
  let [allSources, setAllSources] = useState([])

  const fetchDataOnce = async () => {
    const result = await client.query({
      query: QUERY,
      fetchPolicy: "no-cache",
    });
    const encryptSource = result.data?.allSourcesTokenized
    if (encryptSource) {
      let Source = []
      const decrypted = jwt.verify(encryptSource, TOKENIZE);
      Source = decrypted.results
      setAllSources(Source)
    }
  }
  useEffect(() => {
    fetchDataOnce()
  }, [])

  const fetchDataInternationalSignificance = async (year, years) => {
    const result = await client.query({
      query: QUERY_INTERNATIONAL_SIGNIFICANE,
      variables: {
        year,
        years,
      },
      fetchPolicy: "no-cache",
    });
    const encryptInternationalSignificance = result.data?.allInternationalSignificancePricesTokenized
    if (encryptInternationalSignificance) {
      let InternationalSignificance = []
      const decrypted = jwt.verify(encryptInternationalSignificance, TOKENIZE);
      InternationalSignificance = decrypted.results
      setAllInternationalSignificancePrices(InternationalSignificance)
    }
  }
  useEffect(() => {
    fetchDataInternationalSignificance(year, years)
  }, [year, years, savedCount])

  // let allInternationalSignificancePrices = [];

  // if (data?.allInternationalSignificancePrices) {
  //   allInternationalSignificancePrices =
  //     data.allInternationalSignificancePrices;
  // }
  // let allSources = [];
  // if (data?.allSources) {
  //   allSources = data.allSources;
  // }

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
                // console.log(propsTable.row.original);
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  sourceId: propsTable.row.original.Source?._id || "",
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

  // console.log(allStates);
  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} International Significance`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            year: router.query.year
              ? parseInt(router.query.year)
              : parseInt(dayjs().format("YYYY")),
          });
        }}
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { _id, __typename, _createdAt, _updatedAt } = formData;
            if (!_id) {
              const payload = {
                ...formData,
              }
              let tokenized = jwt.sign(payload, TOKENIZE);
              await createInternationalSignificancePrice({
                variables: {
                  tokenized
                },
              });
              setSavedCount(savedCount += 1)
            } else {
              const payload = {
                ...formData,
              }
              let tokenized = jwt.sign(payload, TOKENIZE);
              await updateInternationalSignificancePrice({
                variables: {
                  tokenized
                },
              });
              setSavedCount(savedCount += 1)
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `International Significance saved!`,
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
          <input
            placeholder="Year (YYYY)"
            className="form-control"
            value={formData.year || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                year: parseInt(e.target.value),
              });
            }}
            required
          />
        </div>

        <div className="form-group">
          <label>Month</label>
          <select
            className="form-control"
            value={formData?.month || dayjs().get("month") + 1}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                month: parseInt(e.target.value),
              });
            }}
            required>
            <option value="" disabled>
              Select Month
            </option>
            {MONTHS.map(m => (
              <option value={m.month}>{m.monthName}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Source*</label>

          <select
            className="form-control"
            value={formData.sourceId || ""}
            onChange={e => {
              if (e) e.preventDefault();

              setFormData({
                ...formData,
                sourceId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Source
            </option>
            {allSources.map(source => (
              <option value={source._id}>{source.description}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>London Future (£/Tonne)</label>
          <NumberFormat
            className="form-control"
            value={formData.londonFuture || 0}
            thousandSeparator={","}
            fixedDecimalScale={true}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                londonFuture: e.floatValue,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>New York Futures (US cents/lb)</label>
          <NumberFormat
            className="form-control"
            value={formData.newYorkFuture || 0}
            thousandSeparator={","}
            fixedDecimalScale={true}
            decimalSeparator={"."}
            decimalScale={2}
            onValueChange={e => {
              // if (e) e.preventDefault();
              setFormData({
                ...formData,
                newYorkFuture: e.floatValue,
              });
            }}
          />
        </div>
      </FormModal>

      <Table
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
              exportConfig={{
                title: "International Significance",
                collectionName: "InternationalSignificancePrices",
                filters: {
                  year: [...years].map(year => parseInt(year)),
                },
                columns,
              }}
            />
          </div>
        }
        loading={false}
        columns={columns}
        data={allInternationalSignificancePrices}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege([
            "Global Price ICCO Buletin International Significance:Create",
          ])
            ? null
            : e => {
              if (e) e.preventDefault();
              setModalVisible(true);
              setFormData({
                year: router.query.year
                  ? parseInt(router.query.year)
                  : parseInt(dayjs().format("YYYY")),
                month: dayjs().get("month") + 1,
              });
            }
        }
        onRemove={
          currentUserDontHavePrivilege([
            "Global Price ICCO Buletin International Significance:Delete",
          ])
            ? null
            : async ({ rows }) => {
              showLoadingSpinner();
              try {
                let yes = confirm(
                  `Are you sure to delete ${rows.length} data?`,
                );
                if (yes) {
                  for (const row of rows) {
                    const payload = {
                      _id: row._id,
                    }
                    let tokenized = jwt.sign(payload, TOKENIZE);
                    await deleteInternationalSignificancePrice({
                      variables: {
                        tokenized
                      },
                    });
                  }
                  setSavedCount(savedCount += 1)
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
          currentUserDontHavePrivilege([
            "Global Price ICCO Buletin International Significance:Update",
          ])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />
    </div >
  );
};
export default withApollo({ ssr: true })(MonthlyAnnualAverageICCO);
