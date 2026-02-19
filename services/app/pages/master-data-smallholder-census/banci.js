import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
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
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";

const QUERY = gql`
  query listQueries {
    allSmallholderCensusRefBanci {
      _id
      banciUpd
      consolGrp
      description
      startDate
      endDate
      region
      year
      officer
    }

    allLocalRegion {
      _id
      code
      description
    }
  }
`;

const CREATE_REF_BANCI = gql`
  mutation createSmallholderCensusRefBanci($input: JSON) {
    createSmallholderCensusRefBanci(input: $input)
  }
`;

const UPDATE_REF_BANCI = gql`
  mutation updateSmallholderCensusRefBanci($_id: String!, $input: JSON) {
    updateSmallholderCensusRefBanci(_id: $_id, input: $input)
  }
`;
const DELETE_REF_BANCI = gql`
  mutation deleteSmallholderCensusRefBanci($_id: String!) {
    deleteSmallholderCensusRefBanci(_id: $_id)
  }
`;
const Bangsa = () => {
  const router = useRouter();
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const { data, loading, error, refetch } = useQuery(QUERY);
  const [createSmallholderCensusRefBanci] = useMutation(CREATE_REF_BANCI);
  const [updateSmallholderCensusRefBanci] = useMutation(UPDATE_REF_BANCI);
  const [deleteSmallholderCensusRefBanci] = useMutation(DELETE_REF_BANCI);

  let allSmallholderCensusRefBanci = [];

  if (data?.allSmallholderCensusRefBanci) {
    allSmallholderCensusRefBanci = data.allSmallholderCensusRefBanci;
  }

  let allLocalRegion = [];

  if (data?.allLocalRegion) {
    allLocalRegion = data.allLocalRegion;
  }

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

  const columns = useMemo(() => [
    {
      Header: "Banci Upd",
      accessor: "banciUpd",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Consol Grp",
      accessor: "consolGrp",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Description",
      accessor: "description",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Start Date",
      accessor: "startDate",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "End Date",
      accessor: "endDate",
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
      Header: "Officer",
      accessor: "officer",
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

                // console.log(propsTable.row.original);
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

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Ref Banci</title>
      </Head>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Ref Banci`}
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
              await createSmallholderCensusRefBanci({
                variables: {
                  input: {
                    ...formData,
                  },
                },
              });
            } else {
              await updateSmallholderCensusRefBanci({
                variables: {
                  _id: formData._id,
                  input: {
                    ...formData,
                  },
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Ref Banci saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Banci Upd</label>
          <input
            placeholder="Banci Upd"
            className="form-control"
            value={formData.banciUpd || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                banciUpd: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Consol Grp</label>
          <input
            placeholder="Consol Grp"
            className="form-control"
            value={formData.consolGrp || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                consolGrp: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Description</label>
          <textarea
            placeholder="Description"
            className="form-control"
            value={formData.description || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                description: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Start Date</label>
          <input
            type="date"
            className="form-control"
            value={formData.startDate || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                startDate: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>End Date</label>
          <input
            type="date"
            className="form-control"
            value={formData.endDate || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                endDate: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Region</label>
          <select
            className="form-control"
            value={formData.region || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                region: e.target.value,
              });
            }}>
            <option value={""} disabled>
              Region
            </option>
            {allLocalRegion.map(region => (
              <option value={region.code}>{region.description}</option>
            ))}
          </select>
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
            <option value="" disabled>
              Year
            </option>
            {YEARS.map(year => (
              <option value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Officer</label>
          <input
            placeholder="Officer"
            className="form-control"
            value={formData.officer || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                officer: e.target.value,
              });
            }}
          />
        </div>
      </FormModal>
      <div className="mt-26">
        <div className=" pr-0 md:pr-10 py-4 bg-white h-full">
          <Table
            loading={loading}
            columns={columns}
            data={allSmallholderCensusRefBanci}
            withoutHeader={true}
            onAdd={
              currentUserDontHavePrivilege([
                "Master Data Smallholder Ref Banci:Create",
              ])
                ? null
                : e => {
                    if (e) e.preventDefault();
                    setModalVisible(true);
                    setFormData({});
                  }
            }
            onRemove={
              currentUserDontHavePrivilege([
                "Master Data Smallholder Ref Banci:Delete",
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
                          await deleteSmallholderCensusRefBanci({
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
              currentUserDontHavePrivilege([
                "Master Data Smallholder Ref Banci:Create",
              ])
                ? null
                : customUtilities
            }
            customUtilitiesPosition="left"
          />
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Bangsa);
