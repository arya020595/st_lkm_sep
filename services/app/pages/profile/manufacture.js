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
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import Table from "../../components/Table";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";
import { MultiYearsFilterWithExport } from "../../components/MultiYearsFilterWithExport";

const QUERY = gql`
  query listQueries {
    allManufactures {
      _id
      year
      name
      address
      LocalState {
        _id
        description
      }
      Country {
        _id
        name
      }
      Centre {
        _id
        description
      }
      telephone
      email
      website

      branch
      factory

      productSpesification
      productManufactured

      stateName
      countryName
      centreName
    }

    allLocalState {
      _id
      description
    }
    allCountries {
      _id
      name
    }
    allCentre {
      _id
      description
    }
  }
`;

const CREATE_MANUFACTURER = gql`
  mutation createManufacture(
    $year: Int
    $name: String
    $address: String
    $stateId: String
    $countryId: String
    $centreId: String
    $telephone: String
    $email: String
    $website: String
    $branch: String
    $factory: String
    $productSpesification: String
    $productManufactured: String
  ) {
    createManufacture(
      year: $year
      name: $name
      address: $address
      stateId: $stateId
      countryId: $countryId
      centreId: $centreId
      telephone: $telephone
      email: $email
      website: $website

      branch: $branch
      factory: $factory

      productSpesification: $productSpesification
      productManufactured: $productManufactured
    )
  }
`;

const UPDATE_MANUFACTURER = gql`
  mutation updateManufacture(
    $_id: String!
    $year: Int
    $name: String
    $address: String
    $stateId: String
    $countryId: String
    $centreId: String
    $telephone: String
    $email: String
    $website: String
    $branch: String
    $factory: String
    $productSpesification: String
    $productManufactured: String
  ) {
    updateManufacture(
      _id: $_id
      year: $year
      name: $name
      address: $address
      stateId: $stateId
      countryId: $countryId
      centreId: $centreId
      telephone: $telephone
      email: $email
      website: $website

      branch: $branch
      factory: $factory

      productSpesification: $productSpesification
      productManufactured: $productManufactured
    )
  }
`;
const DELETE_MANUFACTURER = gql`
  mutation deleteManufacture($_id: String!) {
    deleteManufacture(_id: $_id)
  }
`;

const ManufactureProfile = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const notification = useNotification();
  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const { data, loading, error, refetch } = useQuery(QUERY);

  const [createManufacture] = useMutation(CREATE_MANUFACTURER);
  const [updateManufacture] = useMutation(UPDATE_MANUFACTURER);
  const [deleteManufacture] = useMutation(DELETE_MANUFACTURER);

  const YEARS = useMemo(() => {
    const toYear = parseInt(dayjs().get("year"));
    const fromYear = 1949;
    // console.log([...new Array(toYear - fromYear)])
    return [...new Array(toYear - fromYear)].map((_, index) => {
      // console.log(index, toYear, toYear - index)
      return String(toYear - index);
    });
  }, []);

  // const year = String(router.query.year || dayjs().format("YYYY"));

  const [year, setYear] = useState(YEARS[0]);
  const [years, setYears] = useState([year]);

  let allManufactures = [];

  if (data?.allManufactures) {
    allManufactures = data.allManufactures;
  }

  let allLocalState = [];
  if (data?.allLocalState) {
    allLocalState = data.allLocalState;
  }

  let allCountries = [];
  if (data?.allCountries) {
    allCountries = data.allCountries;
  }

  let allCentre = [];
  if (data?.allCentre) {
    allCentre = data.allCentre;
  }

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
                  centreId: propsTable.row.original.Centre?._id || "",
                  stateId: propsTable.row.original.LocalState?._id || "",
                  countryId: propsTable.row.original.Country?._id || "",
                  year:
                    propsTable.row.original.year ||
                    parseInt(dayjs().format("YYYY")),
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

  const columns = useMemo(() => [
    {
      Header: "Year",
      accessor: "year",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Name",
      accessor: "name",
      style: {
        fontSize: 20,
        width: 500,
      },
    },
    {
      Header: "Address",
      accessor: "address",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "State",
      accessor: "LocalState.description",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Country",
      accessor: "Country.name",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Centre",
      accessor: "Centre.description",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Telephone",
      accessor: "telephone",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Email",
      accessor: "email",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Website",
      accessor: "website",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Branch",
      accessor: "branch",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Factory",
      accessor: "factory",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Product Specification",
      accessor: "productSpesification",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Product Manufactured",
      accessor: "productManufactured",
      style: {
        fontSize: 20,
      },
    },
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Profile | Manufacture</title>
      </Head>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Manufacture`}
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
              await createManufacture({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateManufacture({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Manufacture saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
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
            <option value={""} disabled>
              Select Year
            </option>
            {YEARS.map(year => (
              <option value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Status</label>
          <select
            className="form-control"
            value={formData.status || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                status: e.target.value,
              });
            }}>
            <option value={""} disabled>
              Select Status
            </option>
            <option value={"Aktif"}>Active</option>
            <option value={"TIdak Aktif"}>Innactive</option>
          </select>
        </div>

        <div className="form-group">
          <label>Name*</label>
          <input
            placeholder="Manufacture Name"
            className="form-control"
            value={formData.name || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                name: e.target.value.toUpperCase(),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Address*</label>
          <textarea
            placeholder="Manufacture Address"
            className="form-control"
            value={formData.address || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                address: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Telephone</label>
          <input
            placeholder="Manufacture Telephone"
            className="form-control"
            value={formData.telephone || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                telephone: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Website</label>
          <input
            placeholder="Manufacture Website"
            className="form-control"
            value={formData.website || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                website: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            placeholder="Manufacture email"
            className="form-control"
            value={formData.email || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                email: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>State*</label>
          <select
            className="form-control"
            value={formData.stateId || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                stateId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select State
            </option>
            {allLocalState.map(state => (
              <option value={state._id}>{state.description}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Country*</label>
          <select
            className="form-control"
            value={formData.countryId || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                countryId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Country
            </option>
            {allCountries.map(country => (
              <option value={country._id}>{country.name}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Centre*</label>
          <select
            className="form-control"
            value={formData.centreId || ""}
            required
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                centreId: e.target.value,
              });
            }}>
            <option value="" disabled>
              Select Centre
            </option>
            {allCentre.map(centre => (
              <option value={centre._id}>{centre.description}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Branch</label>
          <input
            placeholder="Manufacture Branch"
            className="form-control"
            value={formData.branch || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                branch: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Factory</label>
          <input
            placeholder="Manufacture Factory"
            className="form-control"
            value={formData.factory || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                factory: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Brand Name</label>
          <input
            placeholder="Brand Name"
            className="form-control"
            value={formData.productSpesification || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                productSpesification: e.target.value,
              });
            }}
          />
        </div>

        <div className="form-group">
          <label>Product Manufactured</label>
          <input
            placeholder="Product Manufactured"
            className="form-control"
            value={formData.productManufactured || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                productManufactured: e.target.value,
              });
            }}
          />
        </div>
      </FormModal>

      <div className="mt-26 pr-0 md:pr-10 py-4 h-full">
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
                  title: "Profile - Manufacture",
                  collectionName: "Manufacturers",
                  filters: {
                    year: [...years].map(year => parseInt(year)),
                  },
                  columns,
                }}
              />
            </div>
          }
          loading={loading}
          columns={columns}
          data={allManufactures}
          withoutHeader={true}
          onAdd={
            currentUserDontHavePrivilege(["Manufacturer Profile:Create"])
              ? null
              : e => {
                  if (e) e.preventDefault();
                  setModalVisible(true);
                }
          }
          onRemove={
            currentUserDontHavePrivilege(["Manufacturer Profile:Delete"])
              ? null
              : async ({ rows }) => {
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to delete ${rows.length} manufacturers?`,
                    );
                    if (yes) {
                      for (const row of rows) {
                        await deleteManufacture({
                          variables: {
                            _id: row._id,
                          },
                        });
                      }
                      notification.addNotification({
                        title: "Success!",
                        message: `${rows.length} manufacturers deleted`,
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
            currentUserDontHavePrivilege(["Manufacturer Profile:Update"])
              ? null
              : customUtilities
          }
          customUtilitiesPosition="left"
        />

        <div className="flex mt-4">
          <p className="text-md">Total Data: </p>
          <p className="text-md font-bold mx-4">{allManufactures.length}</p>
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(ManufactureProfile);
