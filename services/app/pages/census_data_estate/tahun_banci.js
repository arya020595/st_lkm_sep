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
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";

const QUERY = gql`
  query listQueries($year: String, $years: [String!]) {
    allEstateCensusYearList(year: $year, years: $years) {
      _id
      estateId
      year
      EstateInformation {
        _id
        estateName
      }
    }
  }
`;

const CREATE_ESTATE_YEAR_LIST = gql`
  mutation createEstateCensusYearList($estateId: String!, $year: Int) {
    createEstateCensusYearList(estateId: $estateId, year: $year)
  }
`;

const UPDATE_ESTATE_YEAR_LIST = gql`
  mutation updateEstateCensusYearList(
    $_id: String!
    $estateId: String!
    $year: Int
  ) {
    updateEstateCensusYearList(_id: $_id, estateId: $estateId, year: $year)
  }
`;
const DELETE_ESTATE_YEAR_LIST = gql`
  mutation deleteEstateCensusYearList($_id: String!) {
    deleteEstateCensusYearList(_id: $_id)
  }
`;

const EstateCensusYearList = () => {
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const router = useRouter();

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

  const columns = useMemo(() => [
    {
      Header: "Estate ID",
      accessor: "estateId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Estate Name",
      accessor: "EstateInformation.estateName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Year",
      accessor: "year",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "",
      accessor: "_id",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          <button
            className="bg-blue-400 px-4 py-2 rounded-md shadow-md text-white font-bold"
            onClick={e => {
              if (e) e.preventDefault();

              router.replace({
                pathname: `/census_data_estate/maklumat_borang`,
                query: {
                  // ...urlQuery,
                  ...router.query,
                  sidebarSubMenuName: "Maklumat Borang",
                  sidebarSubMenu: "maklumat_borang",
                  estateYear: props.row.original.year,
                  estateId: parseInt(props.row.original.estateId),
                  goTo: "maklumat_borang",
                },
              });
            }}>
            <p className="text-md">
              <i className="fa fa-forward" /> Go
            </p>
          </button>
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

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      // regionId: formData.regionId || "",
      year,
      years,
    },
  });
  const [createEstateCensusYearList] = useMutation(CREATE_ESTATE_YEAR_LIST);
  const [updateEstateCensusYearList] = useMutation(UPDATE_ESTATE_YEAR_LIST);
  const [deleteEstateCensusYearList] = useMutation(DELETE_ESTATE_YEAR_LIST);
  let allEstateCensusYearList = [];
  if (data?.allEstateCensusYearList) {
    allEstateCensusYearList = data.allEstateCensusYearList;
  }

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Tahun Banci</title>
      </Head>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Tahun Banci`}
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
              await createEstateCensusYearList({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateEstateCensusYearList({
                variables: {
                  ...formData,
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
          <label>Estate ID*</label>
          <input
            placeholder="Estate ID"
            className="form-control"
            value={formData.estateId || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                estateId: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Year</label>
          <select
            className="form-control"
            value={formData.year || parseInt(dayjs().format("YYYY"))}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                year: parseInt(e.target.value),
              });
            }}>
            {YEARS.map(year => (
              <option value={year}>{year}</option>
            ))}
          </select>
        </div>
      </FormModal>

      <div className="mt-26  pr-0 md:pr-10 py-4 bg-white h-full">
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
          loading={false}
          columns={columns}
          data={allEstateCensusYearList}
          withoutHeader={true}
          onAdd={
            currentUserDontHavePrivilege(["Tahun Banci:Create"])
              ? null
              : e => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                  setFormData({
                    year: parseInt(dayjs().format("YYYY")),
                  });
                }
          }
          onRemove={
            currentUserDontHavePrivilege(["Tahun Banci:Delete"])
              ? null
              : async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} data?`,
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteEstateCensusYearList({
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
            currentUserDontHavePrivilege(["Tahun Banci:Update"])
              ? null
              : customUtilities
          }
          customUtilitiesPosition="left"
        />
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(EstateCensusYearList);
