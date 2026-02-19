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
import AdminArea from "../../components/AdminArea";
import Table from "../../components/TableAsync";
import { FormModal } from "../../components/Modal";
import dayjs from "dayjs";

const QUERY = gql`
  query listQueries(
    $pageIndex: Int
    $pageSize: Int
    $filters: String
    $negeri: [String]
  ) {
    countSarawakSmallholderPangkalanData
    sarawakSmallholderPangkalanData(
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
    ) {
      _id
      name
      newKP
      oldKP
      address1
      address2
      address3
      postalCode
      phone
      negeri
      daerah
      mukim
      kampung
      noLot
      noGeran
      gardenAddress
      parlimen
      dun
      gender
      nationality
      bornYear
      age
      plantStatus
      tunggal
      selingan
      jumlah
      hibrid
      klon
      luasDilulus
      applStatus
    }
    allSmallholderCensusRefDaerah(negeri: $negeri) {
      _id
      daerah
      LDescription
    }
    allSmallholderCensusRefMukim(negeri: $negeri) {
      _id
      mukim
      LDescription
    }
    allSmallholderCensusRefKampung(negeri: $negeri) {
      _id
      kampung
      LDescription
    }
    allSmallholderCensusRefParlimen(negeri: $negeri) {
      _id
      code
      region
      LDescription
    }
    allSmallholderCensusRefParlimenDun(negeri: $negeri) {
      _id
      dun
      description
    }
    allSmallholderCensusRefBangsa {
      code
      description
      region
      subCode
    }
  }
`;

const CREATE_PANGKALAN_DATA = gql`
  mutation createSmallholderPangkalanData(
    $name: String
    $newKP: String
    $oldKP: String
    $address1: String
    $address2: String
    $address3: String
    $postalCode: String
    $phone: String
    $negeri: String
    $daerah: String
    $mukim: String
    $kampung: String
    $noLot: String
    $noGeran: String
    $gardenAddress: String
    $parlimen: String
    $dun: String
    $gender: String
    $nationality: String
    $bornYear: Int
    $age: Int
    $plantStatus: String
    $tunggal: Int
    $selingan: Int
    $jumlah: Int
    $hibrid: Int
    $klon: Int
    $luasDilulus: String
    $applStatus: String
  ) {
    createSmallholderPangkalanData(
      name: $name
      newKP: $newKP
      oldKP: $oldKP
      address1: $address1
      address2: $address2
      address3: $address3
      postalCode: $postalCode
      phone: $phone
      negeri: $negeri
      daerah: $daerah
      mukim: $mukim
      kampung: $kampung
      noLot: $noLot
      noGeran: $noGeran
      gardenAddress: $gardenAddress
      parlimen: $parlimen
      dun: $dun
      gender: $gender
      nationality: $nationality
      bornYear: $bornYear
      age: $age
      plantStatus: $plantStatus
      tunggal: $tunggal
      selingan: $selingan
      jumlah: $jumlah
      hibrid: $hibrid
      klon: $klon
      luasDilulus: $luasDilulus
      applStatus: $applStatus
    )
  }
`;

const UPDATE_PANGKALAN_DATA = gql`
  mutation updateSmallholderPangkalanData(
    $_id: String!
    $name: String
    $newKP: String
    $oldKP: String
    $address1: String
    $address2: String
    $address3: String
    $postalCode: String
    $phone: String
    $negeri: String
    $daerah: String
    $mukim: String
    $kampung: String
    $noLot: String
    $noGeran: String
    $gardenAddress: String
    $parlimen: String
    $dun: String
    $gender: String
    $nationality: String
    $bornYear: Int
    $age: Int
    $plantStatus: String
    $tunggal: Int
    $selingan: Int
    $jumlah: Int
    $hibrid: Int
    $klon: Int
    $luasDilulus: String
    $applStatus: String
  ) {
    updateSmallholderPangkalanData(
      _id: $_id
      name: $name
      newKP: $newKP
      oldKP: $oldKP
      address1: $address1
      address2: $address2
      address3: $address3
      postalCode: $postalCode
      phone: $phone
      negeri: $negeri
      daerah: $daerah
      mukim: $mukim
      kampung: $kampung
      noLot: $noLot
      noGeran: $noGeran
      gardenAddress: $gardenAddress
      parlimen: $parlimen
      dun: $dun
      gender: $gender
      nationality: $nationality
      bornYear: $bornYear
      age: $age
      plantStatus: $plantStatus
      tunggal: $tunggal
      selingan: $selingan
      jumlah: $jumlah
      hibrid: $hibrid
      klon: $klon
      luasDilulus: $luasDilulus
      applStatus: $applStatus
    )
  }
`;

const DELETE_PANGKALAN_DATA = gql`
  mutation deleteSmallholderPangkalanData($_id: String!) {
    deleteSmallholderPangkalanData(_id: $_id)
  }
`;

const Smallholder = () => {
  const router = useRouter();
  const notification = useNotification();
  const columns = useMemo(() => [
    {
      Header: "Name",
      accessor: "name",
      style: {
        fontSize: 20,
        width: 500,
      },
    },
    {
      Header: "New KP",
      accessor: "newKP",
      style: {
        fontSize: 20,
        width: 350,
      },
    },
    {
      Header: "Old KP",
      accessor: "oldKP",
      style: {
        fontSize: 20,
        width: 350,
      },
    },
    {
      Header: "Negeri",
      accessor: "negeri",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Mukim",
      accessor: "mukim",
      style: {
        fontSize: 20,
        width: 350,
      },
    },
    {
      Header: "Address 1",
      accessor: "address1",
      style: {
        fontSize: 20,
        width: 350,
      },
    },
    {
      Header: "Address 2",
      accessor: "address2",
      style: {
        fontSize: 20,
        width: 350,
      },
    },
    {
      Header: "Address 3",
      accessor: "address3",
      style: {
        fontSize: 20,
        width: 350,
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

  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      pageIndex: router.query.pageIndex ? parseInt(router.query.pageIndex) : 0,
      pageSize: router.query.pageSize ? parseInt(router.query.pageSize) : 10,
      filters: router.query.filters || "",
      negeri: ["13"],
    },
  });

  const allSmallholderCensusRefDaerah =
    data?.allSmallholderCensusRefDaerah || [];

  const allSmallholderCensusRefMukim = data?.allSmallholderCensusRefMukim || [];
  const allSmallholderCensusRefKampung =
    data?.allSmallholderCensusRefKampung || [];
  const allSmallholderCensusRefParlimen =
    data?.allSmallholderCensusRefParlimen || [];

  const allSmallholderCensusRefParlimenDun =
    data?.allSmallholderCensusRefParlimenDun || [];

  const allSmallholderCensusRefBangsa =
    data?.allSmallholderCensusRefBangsa || [];

  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [createSmallholderPangkalanData] = useMutation(CREATE_PANGKALAN_DATA);
  const [updateSmallholderPangkalanData] = useMutation(UPDATE_PANGKALAN_DATA);
  const [deleteSmallholderPangkalanData] = useMutation(DELETE_PANGKALAN_DATA);

  let sarawakSmallholderPangkalanData = [];
  if (data?.sarawakSmallholderPangkalanData) {
    sarawakSmallholderPangkalanData = data.sarawakSmallholderPangkalanData;
  }
  // console.log({ sarawakSmallholderPangkalanData });
  let countSarawakSmallholderPangkalanData =
    data?.countSarawakSmallholderPangkalanData || 0;
  let [internalLoading, setInternalLoading] = useState(false);
  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countSarawakSmallholderPangkalanData) return 1;
    return Math.ceil(countSarawakSmallholderPangkalanData / pageSize);
  }, [countSarawakSmallholderPangkalanData, pageSize]);
  const handlePageChange = useCallback(
    async ({ pageIndex, pageSize, filters }) => {
      // console.log("filters", JSON.stringify(filters));
      router.replace(
        {
          pathname: router.pathname,
          query: {
            ...router.query,
            pageIndex,
            pageSize,
            filters: JSON.stringify(filters),
          },
        },
        null,
        {
          scroll: false,
        },
      );
    },
    [],
  );

  let filters = useMemo(() => {
    // console.log("router.query.filters", router.query.filters);
    if (!router.query.filters) return [];
    try {
      let filters = JSON.parse(router.query.filters);
      // console.log({ filters });
      return filters;
    } catch (err) {
      console.warn(err);
    }
    return [];
  }, [router.query.filters]);
  // console.log(router.query.filters, { filters });

  return (
    <div>
      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Smallholder`}
        visible={modalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setModalVisible(false);
          setFormData({
            negeri: "13",
          });
        }}
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            let { _id, __typename, _createdAt, _updatedAt } = formData;
            if (!_id) {
              await createSmallholderPangkalanData({
                variables: {
                  ...formData,
                },
              });
            } else {
              await updateSmallholderPangkalanData({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            notification.addNotification({
              title: "Succeess!",
              message: `Smallholder saved!`,
              level: "success",
            });
            setModalVisible(false);
          } catch (e) {
            notification.handleError(e);
          }
          hideLoadingSpinner();
        }}>
        <div className="form-group">
          <label>Name</label>
          <input
            placeholder="Name"
            className="form-control"
            value={formData.name || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                name: e.target.value,
              });
            }}
            required
          />
        </div>
        <div className="form-group">
          <label>New KP</label>
          <input
            placeholder="New KP"
            className="form-control"
            value={formData.newKP || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                newKP: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Old KP</label>
          <input
            placeholder="Old KP"
            className="form-control"
            value={formData.oldKP || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                oldKP: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Address 1</label>
          <textarea
            placeholder="Address 1"
            className="form-control"
            value={formData.address1 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                address1: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Address 2</label>
          <textarea
            placeholder="Address 2"
            className="form-control"
            value={formData.address1 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                address2: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Address 3</label>
          <textarea
            placeholder="Address 3"
            className="form-control"
            value={formData.address1 || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                address3: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Postal Code</label>
          <input
            placeholder="Postal Code"
            className="form-control"
            value={formData.postalCode || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                postalCode: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Phone Number</label>
          <input
            placeholder="Phone Number"
            className="form-control"
            value={formData.phone || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                phone: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Daerah</label>
          <select
            className="form-control"
            value={formData.daerah || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                daerah: e.target.value,
              });
            }}>
            <option value={""}>Daerah</option>
            {allSmallholderCensusRefDaerah.map(daerah => (
              <option value={daerah.daerah}>{daerah.LDescription}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Mukim</label>
          <select
            className="form-control"
            value={formData.mukim || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                mukim: e.target.value,
              });
            }}>
            <option value={""}>Mukim</option>
            {allSmallholderCensusRefMukim.map(mukim => (
              <option value={mukim.mukim}>{mukim.LDescription}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Kampung</label>
          <select
            className="form-control"
            value={formData.kampung || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                kampung: e.target.value,
              });
            }}>
            <option value={""}>Kampung</option>
            {allSmallholderCensusRefKampung.map(kampung => (
              <option value={kampung.kampung}>{kampung.LDescription}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>No Lot</label>
          <input
            placeholder="No Lot"
            className="form-control"
            value={formData.noLot || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                noLot: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>No Geran</label>
          <input
            placeholder="No Geran"
            className="form-control"
            value={formData.noGeran || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                noGeran: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Garden Adress</label>
          <textarea
            placeholder="Garden Adress"
            className="form-control"
            value={formData.gardenAddress || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                gardenAddress: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Parlimen</label>
          <input
            placeholder="Parlimen"
            className="form-control"
            value={formData.noGeran || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                noGeran: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Parlimen</label>
          <select
            className="form-control"
            value={formData.parlimen || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                parlimen: e.target.value,
              });
            }}>
            <option value={""}>Parlimen</option>
            {allSmallholderCensusRefParlimen.map(parlimen => (
              <option value={parlimen.code}>{parlimen.LDescription}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Dun</label>
          <select
            className="form-control"
            value={formData.dun || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                dun: e.target.value,
              });
            }}>
            <option value={""}>Dun</option>
            {allSmallholderCensusRefParlimenDun.map(dun => (
              <option value={dun.dun}>{dun.description}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Gender</label>
          <select
            className="form-control"
            value={formData.gender || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                gender: e.target.value,
              });
            }}>
            <option value={""}>Gender</option>
            <option value={"L"}>Lelaki</option>
            <option value={"P"}>Perempuan</option>
          </select>
        </div>
        <div className="form-group">
          <label>Nationality</label>
          <select
            className="form-control"
            value={formData.nationality || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                nationality: e.target.value,
              });
            }}>
            <option value={""}>Nationality</option>
            {allSmallholderCensusRefBangsa.map(bangsa => (
              <option value={`${bangsa.code}${bangsa.subcode}`}>
                {bangsa.description}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Born Year</label>
          <input
            placeholder="Born Year (YYYY)"
            className="form-control"
            value={formData.bornYear || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                bornYear: parseInt(e.target.value),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Age</label>
          <input
            placeholder="Age"
            className="form-control"
            value={formData.age || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                age: parseInt(e.target.value),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Plant Status</label>
          <input
            placeholder="Plant Status"
            className="form-control"
            value={formData.plantStatus || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                plantStatus: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Tunggal</label>
          <input
            placeholder="Tunggal"
            className="form-control"
            value={formData.tunggal || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                tunggal: parseInt(e.target.value),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Selingan</label>
          <input
            placeholder="Selingan"
            className="form-control"
            value={formData.selingan || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                selingan: parseInt(e.target.value),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Jumlah</label>
          <input
            placeholder="Jumlah"
            className="form-control"
            value={formData.jumlah || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                jumlah: parseInt(e.target.value),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Hibrid</label>
          <input
            placeholder="Hibrid"
            className="form-control"
            value={formData.hibrid || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                hibrid: parseInt(e.target.value),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Klon</label>
          <input
            placeholder="Klon"
            className="form-control"
            value={formData.klon || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                klon: parseInt(e.target.value),
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Luas Dilulus</label>
          <input
            placeholder="Luas Dilulus"
            className="form-control"
            value={formData.luasDilulus || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                luasDilulus: e.target.value,
              });
            }}
          />
        </div>
        <div className="form-group">
          <label>Appl Status</label>
          <input
            placeholder="Appl Status"
            className="form-control"
            value={formData.applStatus || ""}
            onChange={e => {
              if (e) e.preventDefault();
              setFormData({
                ...formData,
                applStatus: e.target.value,
              });
            }}
          />
        </div>
      </FormModal>
      <Table
        loading={loading}
        columns={columns}
        data={sarawakSmallholderPangkalanData}
        withoutHeader={true}
        controlledFilters={filters}
        controlledPageIndex={pageIndex}
        controlledPageCount={pageCount}
        controlledPageSize={pageSize}
        onPageChange={handlePageChange}
        onAdd={e => {
          if (e) e.preventDefault();
          setFormData({
            negeri: "13",
          });
          setModalVisible(true);
        }}
        customUtilities={customUtilities}
        customUtilitiesPosition="left"
        onRemove={async ({ rows }) => {
          showLoadingSpinner();
          try {
            let yes = confirm(`Are you sure to delete ${rows.length} data ?`);
            if (yes) {
              for (const row of rows) {
                await deleteSmallholderPangkalanData({
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
        }}
      />

      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">
          {countSarawakSmallholderPangkalanData}
        </p>
      </div>
    </div>
  );
};
export default withApollo({ ssr: true })(Smallholder);
