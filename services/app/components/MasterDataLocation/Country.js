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
import AdminArea from "../../components/AdminArea";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import Select from "react-select";

const QUERY = gql`
  query listQueries {
    allCountryRegion {
      _id
      code
      description
      SubRegions {
        _id
        code
        description
      }
    }

    allCountries {
      _id
      name
      refName
      codeA2
      codeA3
      number
      CountryRegion {
        _id
        description
        SubRegions {
          _id
          code
          description
        }
      }
      SubRegions {
        _id
        code
        description
      }
    }
  }
`;

const CREATE_COUNTRY = gql`
  mutation createCountry(
    $name: String!
    $refName: String
    $codeA2: String
    $codeA3: String
    $codeNol: String
    $countryRegionId: String
    $number: Int
    $subRegionIds: [String]
  ) {
    createCountry(
      name: $name
      refName: $refName
      codeA2: $codeA2
      codeA3: $codeA3
      codeNol: $codeNol
      countryRegionId: $countryRegionId
      number: $number
      subRegionIds: $subRegionIds
    )
  }
`;

const UPDATE_COUNTRY = gql`
  mutation updateCountry(
    $_id: String!
    $name: String!
    $refName: String
    $codeA2: String
    $codeA3: String
    $codeNol: String
    $countryRegionId: String
    $number: Int
    $subRegionIds: [String]
  ) {
    updateCountry(
      _id: $_id
      name: $name
      refName: $refName
      codeA2: $codeA2
      codeA3: $codeA3
      codeNol: $codeNol
      countryRegionId: $countryRegionId
      number: $number
      subRegionIds: $subRegionIds
    )
  }
`;
const DELETE_COUNTRY = gql`
  mutation deleteCountry($_id: String!) {
    deleteCountry(_id: $_id)
  }
`;
const Country = ({ currentUserDontHavePrivilege }) => {
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [allSubRegion, setAllSubRegion] = useState([]);
  const [selectedSubRegion, setSelectedSubRegion] = useState([]);
  const router = useRouter();
  const columns = useMemo(() => [
    {
      Header: "Country Name",
      accessor: "name",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Ref Country Name",
      accessor: "refName",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "A2 Code",
      accessor: "codeA2",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "A3 Code",
      accessor: "codeA3",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Number",
      accessor: "number",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Country Region",
      accessor: "CountryRegion.description",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Sub Region",
      accessor: "SubRegions.description",
      style: {
        fontSize: 20,
      },
      Cell: props => (
        <span>
          {props.row.original.SubRegions.map(sb => sb.description).join(", ")}
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
                let subRegionIds = [];
                if (propsTable.row.original.SubRegions) {
                  subRegionIds = propsTable.row.original.SubRegions.map(
                    sb => sb._id,
                  );
                  setSelectedSubRegion(
                    propsTable.row.original.SubRegions.map(sb => {
                      return {
                        ...sb,
                        value: sb._id,
                        label: sb.description,
                      };
                    }),
                  );
                }

                let subRegionsArrays = [];

                if (
                  propsTable.row.original.CountryRegion &&
                  propsTable.row.original.CountryRegion.SubRegions
                ) {
                  subRegionsArrays =
                    propsTable.row.original.CountryRegion.SubRegions.map(
                      reg => {
                        return {
                          ...reg,
                          value: reg._id,
                          label: reg.description,
                        };
                      },
                    );
                }
                setModalVisible(true);
                setFormData({
                  ...propsTable.row.original,
                  countryRegionId:
                    propsTable.row.original.CountryRegion?._id || "",
                  subRegionIds,
                });

                setAllSubRegion(subRegionsArrays);
              }}
              className="mb-1 bg-yellow-500 hover:bg-orange-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg">
              <p className="text-white text-md font-bold">
                <i className="fa fa-pencil-alt " /> Edit
              </p>
            </button>
          </div>
        );
      },
    },
  ]);

  const { data, loading, error, refetch } = useQuery(QUERY);
  const [createCountry] = useMutation(CREATE_COUNTRY);
  const [updateCountry] = useMutation(UPDATE_COUNTRY);
  const [deleteCountry] = useMutation(DELETE_COUNTRY);

  let allCountryRegion = [];
  if (data?.allCountryRegion) {
    allCountryRegion = data.allCountryRegion;
  }

  let allCountries = [];
  if (data?.allCountries) {
    allCountries = data.allCountries;
  }
  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Country`}
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
              await createCountry({
                variables: {
                  ...formData,
                  subRegionIds: selectedSubRegion.map(sub => sub.value),
                },
              });
            } else {
              await updateCountry({
                variables: {
                  ...formData,
                  subRegionIds: selectedSubRegion.map(sub => sub.value),
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Country saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Country Name</label>
          <input
            placeholder="Country Name"
            className="form-control"
            value={formData.name || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                name: e.target.value.toUpperCase(),
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>Ref Country Name</label>
          <input
            placeholder="Ref Country Name"
            className="form-control"
            value={formData.refName || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                refName: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>A2 Code</label>
          <input
            placeholder="A2 Code"
            className="form-control"
            value={formData.codeA2 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                codeA2: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>A3 Code</label>
          <input
            placeholder="A3 Code"
            className="form-control"
            value={formData.codeA3 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                codeA3: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Number</label>
          <input
            className="form-control"
            value={formData.number || 0}
            type="number"
            min={0}
            step={1}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                number: parseInt(e.target.value),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Country Region</label>
          <select
            className="form-control"
            value={formData.countryRegionId || ""}
            onChange={e => {
              const countryRegionId = e.target.value;

              const subRegion = allCountryRegion.find(
                reg => reg._id === countryRegionId,
              );

              setFormData({
                ...formData,
                countryRegionId,
              });
              if (subRegion) {
                setAllSubRegion(
                  subRegion.SubRegions.map(reg => {
                    return {
                      ...reg,
                      value: reg._id,
                      label: reg.description,
                    };
                  }),
                );
              }
              setSelectedSubRegion([]);
            }}
            required>
            <option value="" disabled>
              Select Country
            </option>
            {allCountryRegion.map(reg => (
              <option value={reg._id}>{reg.description}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Sub Region</label>
          <Select
            isMulti
            options={allSubRegion}
            className="basic-multi-select w-full"
            classNamePrefix="select"
            onChange={data => {
              setSelectedSubRegion([...data]);
            }}
            value={selectedSubRegion}
          />
        </div>
      </FormModal>

      <Table
        loading={false}
        columns={columns}
        data={allCountries}
        withoutHeader={true}
        onAdd={
          currentUserDontHavePrivilege(["Country:Create"])
            ? null
            : e => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({});
              }
        }
        onRemove={
          currentUserDontHavePrivilege(["Country:Delete"])
            ? null
            : async ({ rows }) => {
                showLoadingSpinner();
                try {
                  let yes = confirm(
                    `Are you sure to delete ${rows.length} countries ?`,
                  );
                  if (yes) {
                    for (const row of rows) {
                      await deleteCountry({
                        variables: {
                          _id: row._id,
                        },
                      });
                    }
                    notification.addNotification({
                      title: "Success!",
                      message: `${rows.length} countries deleted`,
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
          currentUserDontHavePrivilege(["Country:Update"])
            ? null
            : customUtilities
        }
        customUtilitiesPosition="left"
      />
      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">{allCountries.length}</p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(Country);
