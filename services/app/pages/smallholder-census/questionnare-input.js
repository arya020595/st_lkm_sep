import React, { useState, useEffect, useMemo, useCallback } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea from "../../components/AdminArea";
import { debounce, set } from "lodash";

import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import {
  hideLoadingSpinner,
  showLoadingSpinner,
  useNotification,
} from "../../components/App";
import dayjs from "dayjs";
import {
  FieldFreeText,
  FieldCheckbox,
  FieldShortQuestion,
  FieldFixedTable,
  FieldQuestionTable,
} from "./questionnare-composer";
import { Button } from "../../components/form/Button";
import { FormModal } from "../../components/Modal";
import Table from "../../components/TableAsync";

const QUERY = gql`
  query Query($formId: String!, $fillingId: String!) {
    smallholderCensusForm(_id: $formId) {
      _id
      name
      description
      specs
      banciId
    }
    smallholderCensusFormFilling(_id: $fillingId) {
      _id
      _createdAt
      _updatedAt
      formId
      name
      description
      specs
      data
      smallholderId
      smallholder {
        _id
        name
      }
    }
  }
`;

const UPDATE = gql`
  mutation updateSmallholderCensusFormFilling(
    $_id: String!
    $name: String
    $description: String
    $specs: JSON
    $data: JSON
    $smallholderId: String
  ) {
    updateSmallholderCensusFormFilling(
      _id: $_id
      name: $name
      description: $description
      specs: $specs
      data: $data
      smallholderId: $smallholderId
    )
  }
`;

const DELETE = gql`
  mutation deleteSmallholderCensusFormFilling($_id: String!) {
    deleteSmallholderCensusFormFilling(_id: $_id)
  }
`;

const Questionnare = () => {
  const router = useRouter();
  const notification = useNotification();

  const [updateSmallholderCensusFormFilling] = useMutation(UPDATE);
  const [deleteSmallholderCensusFormFilling] = useMutation(DELETE);
  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      formId: router.query.formId || "",
      fillingId: router.query.fillingId || "",
    },
  });
  let smallholderCensusFormFilling = data?.smallholderCensusFormFilling || {
    data: {},
  };
  let smallholderCensusForm = data?.smallholderCensusForm || {};
  // console.log({
  //   // smallholderCensusForm,
  //   smallholderCensusFormFilling,
  // });

  const [formData, setFormData] = useState({});
  // console.log({ formData });
  useEffect(() => {
    if (!smallholderCensusFormFilling?._id) return;
    setFormData({
      ...(smallholderCensusFormFilling.data || {}),
    });
  }, [smallholderCensusFormFilling?._id]);

  const handleSave = useCallback(async (e, newFormData, options = {}) => {
    if (e) e.preventDefault();
    // console.log({
    //   newFormData,
    //   options,
    // });
    // setInternalLoading(true);
    try {
      await updateSmallholderCensusFormFilling({
        variables: {
          _id: smallholderCensusFormFilling._id,
          name: smallholderCensusForm.name,
          description: smallholderCensusForm.description,
          specs: smallholderCensusForm.specs,
          data: newFormData || formData || {},
        },
      });
      await refetch();
      // setTouched(false);
      if (!options?.silent) {
        notification.addNotification({
          level: "success",
          message: `Questionnaire was saved successfully!`,
        });
      }
    } catch (err) {
      if (!options?.silent) {
        notification.handleError(err);
      }
    }
    // setInternalLoading(false);
  });
  const handleSaveDebounced = useCallback(debounce(handleSave, 1 * 1000), [
    smallholderCensusFormFilling?._id,
    smallholderCensusForm?._id,
  ]);

  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Questionnaire Input</title>
      </Head>

      <div className="pt-24"></div>

      <div className="pt-8 pb-8 px-6 flex justify-between items-center">
        <div className="font-bold text-2xl">
          Questionnaire Input for{" "}
          <span className="text-green-600">{smallholderCensusForm?.name}</span>
        </div>
        <div>
          <Button
            type="button"
            onClick={handleSave}
            className="btn btn-primary btn-rounded text-lg">
            <i className="fa fa-save" /> Save
          </Button>
        </div>
      </div>

      <div className="px-6 pb-8">
        <div className="pb-8 flex items-center justify-start">
          <Button
            onClick={e => {
              if (e) e.preventDefault();
              setPickerVisible(true);
            }}
            type="button"
            className="btn btn-success btn-rounded btn-lg text-lg">
            <i className="fa fa-check-circle" /> Select Smallholder
          </Button>
          &nbsp;&nbsp;&nbsp;
          {smallholderCensusFormFilling?.smallholder?._id ? (
            <div className="py-4 text-green-600 text-xl">
              Selected Smallholder:{" "}
              <span className="font-bold">
                {smallholderCensusFormFilling?.smallholder?.name}
              </span>
            </div>
          ) : (
            <div className="py-4 text-red-500 italic">
              Please select Smallholder first!
            </div>
          )}
        </div>

        {smallholderCensusForm?.specs?.map((spec, index) => {
          if (spec.type === "Free Text") {
            return (
              <div
                key={spec._id}
                className="bg-gray-50 px-4 py-4 mb-8 shadow border-l-2 border-gray-300">
                <FieldFreeText
                  formData={formData}
                  onUpdate={props => {
                    // console.log({ props });
                    const newFormData = {
                      ...formData,
                      [props.key]: props.value,
                    };
                    setFormData(newFormData);
                    handleSaveDebounced(null, newFormData, { silent: true });
                  }}
                  {...spec}
                />
              </div>
            );
          } else if (spec.type === "Checkbox") {
            return (
              <div
                key={spec._id}
                className="bg-gray-50 px-4 py-4 mb-8 shadow border-l-2 border-gray-300">
                <FieldCheckbox
                  formData={formData}
                  onUpdate={props => {
                    // console.log({ props });
                    const newFormData = {
                      ...formData,
                      [props.key]: props.value,
                    };
                    setFormData(newFormData);
                    handleSaveDebounced(null, newFormData, { silent: true });
                  }}
                  {...spec}
                />
              </div>
            );
          } else if (spec.type === "Short Question") {
            return (
              <div
                key={spec._id}
                className="bg-gray-50 px-4 py-4 mb-8 shadow border-l-2 border-gray-300">
                <FieldShortQuestion
                  formData={formData}
                  onUpdate={props => {
                    // console.log({ props });
                    const newFormData = {
                      ...formData,
                      [props.key]: props.value,
                    };
                    setFormData(newFormData);
                    handleSaveDebounced(null, newFormData, { silent: true });
                  }}
                  {...spec}
                />
              </div>
            );
          } else if (spec.type === "Fixed Table") {
            return (
              <div
                key={spec._id}
                className="bg-gray-50 px-4 py-4 mb-8 shadow border-l-2 border-gray-300">
                <FieldFixedTable
                  formData={formData}
                  onUpdate={props => {
                    // console.log({ props });
                    const newFormData = {
                      ...formData,
                      [props.key]: props.value,
                    };
                    setFormData(newFormData);
                    handleSaveDebounced(null, newFormData, { silent: true });
                  }}
                  {...spec}
                />
              </div>
            );
          } else if (spec.type === "Question Table") {
            return (
              <div
                key={spec._id}
                className="bg-gray-50 px-4 py-4 mb-8 shadow border-l-2 border-gray-300">
                <FieldQuestionTable
                  formData={formData}
                  onUpdate={props => {
                    // console.log({ props });
                    const newFormData = {
                      ...formData,
                      [props.key]: props.value,
                    };
                    setFormData(newFormData);
                    handleSaveDebounced(null, newFormData, { silent: true });
                  }}
                  {...spec}
                />
              </div>
            );
          } else {
            return null;
          }
        })}
      </div>

      <div className="pb-8 mb-8 px-6 flex justify-between items-center">
        <div />
        <div>
          <Button
            type="button"
            onClick={handleSave}
            className="btn btn-primary btn-rounded text-lg">
            <i className="fa fa-save" /> Save
          </Button>
        </div>
      </div>

      <SmallholderPicker
        visible={pickerVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setPickerVisible(false);
        }}
        onSelect={async selectedSmallholder => {
          console.log({ selectedSmallholder });

          showLoadingSpinner();
          // setInternalLoading(true);
          try {
            await updateSmallholderCensusFormFilling({
              variables: {
                _id: smallholderCensusFormFilling._id,
                name: smallholderCensusForm.name,
                description: smallholderCensusForm.description,
                specs: smallholderCensusForm.specs,
                data: formData || {},
                smallholderId: selectedSmallholder._id,
              },
            });
            await refetch();
            setPickerVisible(false);
            // notification.addNotification({
            //   level: "success",
            //   message: `Questionnaire was saved successfully!`,
            // });
          } catch (err) {
            notification.handleError(err);
          }
          // setInternalLoading(false);
          hideLoadingSpinner();
        }}
      />
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Questionnare);

const QUERY_SMALLHOLDER = gql`
  query listQueries(
    $pageIndex: Int
    $pageSize: Int
    $filters: String
    $typeOfSmallholder: String
  ) {
    countSmallholders
    allSmallholders(
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
      typeOfSmallholder: $typeOfSmallholder
    ) {
      _id
      name
      nric
      oric
      citizenship
      ethnic
      gender
      religion
      maritalStatus
      dateOfBirth
      educationStatus
      occupation
      totalDependants
      maleFamilyWorker
      femaleFamilyWorker
      farmWorkedBy
      residenceAddress
      telephoneNo
      isActive
      isFamilyRelated
      stateName
      dunName
      perlimentName
      mukimName
      is_native
      postCode
      city
      status
      statusDescription
      kampungKelompok
      award
      typeOfSmallholder

      LocalState {
        _id
        description
      }
    }

    allLocalState {
      _id
      code
      description
    }
  }
`;

const SmallholderPicker = ({ visible, onClose, onSelect }) => {
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
      Header: "NRIC",
      accessor: "nric",
      style: {
        fontSize: 20,
        width: 350,
      },
    },
    {
      Header: "ORIC",
      accessor: "oric",
      style: {
        fontSize: 20,
        width: 350,
      },
    },
    {
      Header: "Citizenship",
      accessor: "citizenship",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Ethnic",
      accessor: "ethnic",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Gender",
      accessor: "gender",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Religion",
      accessor: "religion",
      style: {
        fontSize: 20,
        width: 250,
      },
    },
    {
      Header: "Telephone",
      accessor: "telephoneNo",
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
      Header: "Smallholder Type",
      accessor: "typeOfSmallholder",
      style: {
        fontSize: 20,
      },
    },
  ]);

  const customUtilities = useMemo(() => [
    {
      label: "Select This Smallholder",
      icon: <i className="fa fa-pencil" />,
      width: 400,
      render: propsTable => {
        return (
          <div className="flex">
            <button
              onClick={e => {
                if (e) e.preventDefault();
                onSelect({
                  ...propsTable.row.original,
                });
              }}
              className="mb-1 bg-success-500 hover:bg-success-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg">
              <p className="text-white font-bold text-md font-bold">
                <i className="fa fa-check-circle" /> Select
              </p>
            </button>
          </div>
        );
      },
    },
  ]);

  const { data, loading, error, refetch } = useQuery(QUERY_SMALLHOLDER, {
    variables: {
      pageIndex: router.query.pageIndex ? parseInt(router.query.pageIndex) : 0,
      pageSize: router.query.pageSize ? parseInt(router.query.pageSize) : 10,
      filters: router.query.filters || "",
    },
  });

  let allSmallholders = [];
  if (data?.allSmallholders) {
    allSmallholders = data.allSmallholders;
  }
  const allLocalState = data?.allLocalState || [];
  // console.log({ allSmallholders });
  let countSmallholders = data?.countSmallholders || 0;
  let [internalLoading, setInternalLoading] = useState(false);
  let pageSize = router.query.pageSize ? parseInt(router.query.pageSize) : 10;
  let pageIndex = router.query.pageIndex ? parseInt(router.query.pageIndex) : 0;
  let pageCount = useMemo(() => {
    if (!countSmallholders) return 1;
    return Math.ceil(countSmallholders / pageSize);
  }, [countSmallholders, pageSize]);
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

  if (!visible) return null;
  return (
    <FormModal
      visible={visible}
      size="lg"
      onClose={onClose}
      title="Select Smallholder">
      <Table
        loading={loading}
        columns={columns}
        data={allSmallholders}
        withoutHeader={true}
        controlledFilters={filters}
        controlledPageIndex={pageIndex}
        controlledPageCount={pageCount}
        controlledPageSize={pageSize}
        onPageChange={handlePageChange}
        // onAdd={e => {
        //   if (e) e.preventDefault();
        //   setModalVisible(true);
        // }}
        customUtilities={customUtilities}
        customUtilitiesPosition="left"
        // onRemove={async ({ rows }) => {
        //   showLoadingSpinner();
        //   try {
        //     let yes = confirm(
        //       `Are you sure to delete ${rows.length} unregistered smallholder ?`,
        //     );
        //     if (yes) {
        //       for (const row of rows) {
        //         await deleteSmallholder({
        //           variables: {
        //             _id: row._id,
        //           },
        //         });
        //       }
        //       notification.addNotification({
        //         title: "Success!",
        //         message: `${rows.length} unregistered smallholder deleted`,
        //         level: "success",
        //       });
        //       await refetch();
        //     }
        //   } catch (err) {
        //     handleError(err);
        //   }
        //   hideLoadingSpinner();
        // }}
      />

      <div className="flex mt-4">
        <p className="text-md">Total Data: </p>
        <p className="text-md font-bold mx-4">{countSmallholders}</p>
      </div>
    </FormModal>
  );
};
