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

const QUERY = gql`
  query Query($formId: String!, $fillingId: String!) {
    estateCensusForm(_id: $formId) {
      _id
      name
      description
      specs
    }
    estateCensusFormFilling(_id: $fillingId) {
      _id
      _createdAt
      _updatedAt
      formId
      name
      description
      specs
      data
    }
  }
`;

const UPDATE = gql`
  mutation updateEstateCensusFormFilling(
    $_id: String!
    $name: String
    $description: String
    $specs: JSON
    $data: JSON
  ) {
    updateEstateCensusFormFilling(
      _id: $_id
      name: $name
      description: $description
      specs: $specs
      data: $data
    )
  }
`;

const DELETE = gql`
  mutation deleteEstateCensusFormFilling($_id: String!) {
    deleteEstateCensusFormFilling(_id: $_id)
  }
`;

const Questionnare = () => {
  const router = useRouter();
  const notification = useNotification();

  const [updateEstateCensusFormFilling] = useMutation(UPDATE);
  const [deleteEstateCensusFormFilling] = useMutation(DELETE);
  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      formId: router.query.formId || "",
      fillingId: router.query.fillingId || "",
    },
  });
  let estateCensusFormFilling = data?.estateCensusFormFilling || {
    data: {},
  };
  let estateCensusForm = data?.estateCensusForm || {};
  // console.log({
  //   estateCensusForm,
  //   estateCensusFormFilling,
  // });

  const [formData, setFormData] = useState({});
  // console.log({ formData });
  useEffect(() => {
    if (!estateCensusFormFilling?._id) return;
    setFormData({
      ...(estateCensusFormFilling.data || {}),
    });
  }, [estateCensusFormFilling?._id]);

  const handleSave = useCallback(async (e, newFormData, options = {}) => {
    if (e) e.preventDefault();
    // console.log({
    //   newFormData,
    //   options,
    // });
    // setInternalLoading(true);
    try {
      await updateEstateCensusFormFilling({
        variables: {
          _id: estateCensusFormFilling._id,
          name: estateCensusForm.name,
          description: estateCensusForm.description,
          specs: estateCensusForm.specs,
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
    estateCensusFormFilling?._id,
    estateCensusForm?._id,
  ]);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Questionnaire Input</title>
      </Head>

      <div className="pt-24"></div>

      <div className="pt-8 pb-8 px-6 flex justify-between items-center">
        <div className="font-bold text-2xl">
          Questionnaire Input for{" "}
          <span className="text-green-600">{estateCensusForm?.name}</span>
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
        {estateCensusForm?.specs?.map((spec, index) => {
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
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Questionnare);
