import React, { useState, useEffect, useMemo, useCallback } from "react";
import Head from "next/head";
import appConfig from "../../app.json";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea from "../../components/AdminArea";
import Table from "../../components/Table";
import { v4 as uuidv4 } from "uuid";
import { debounce, set } from "lodash";
import produce from "immer";
import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import {
  hideLoadingSpinner,
  showLoadingSpinner,
  useNotification,
} from "../../components/App";
import { FormModal } from "../../components/Modal";
import { SingleSelect } from "../../components/form/SingleSelect";
import { ShortText } from "../../components/form/ShortText";
import { LongText } from "../../components/form/LongText";
import { Button } from "../../components/form/Button";
import { Number } from "../../components/form/Number";

const QUERY = gql`
  query Query($formId: String!) {
    estateCensusForm(_id: $formId) {
      _id
      name
      description
      specs
    }
  }
`;

const UPDATE = gql`
  mutation updateEstateCensusForm($_id: String!, $specs: JSON) {
    updateEstateCensusForm(_id: $_id, specs: $specs)
  }
`;

const GENERATE = gql`
  mutation generateEstateCensusFormPDF($formId: String!) {
    generateEstateCensusFormPDF(_id: $formId)
  }
`;

const Questionnare = () => {
  const router = useRouter();
  const notification = useNotification();

  const [generateEstateCensusFormPDF] = useMutation(GENERATE);
  const [updateEstateCensusForm] = useMutation(UPDATE);
  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      formId: router.query.formId || "",
    },
  });
  let estateCensusForm = data?.estateCensusForm || {};

  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  useEffect(() => {
    if (!estateCensusForm?._id) return;
    setFormData({
      ...estateCensusForm,
    });
  }, [estateCensusForm?._id]);

  const handleSave = useCallback(async (e, newFormData, options = {}) => {
    if (e) e.preventDefault();
    // console.log({
    //   newFormData,
    //   options,
    // });
    // setInternalLoading(true);
    try {
      await updateEstateCensusForm({
        variables: newFormData || formData || {},
      });
      await refetch();
      // setTouched(false);
    } catch (err) {
      if (!options?.silent) {
        notification.handleError(err);
      }
    }
    // setInternalLoading(false);
  });
  const handleSaveDebounced = useCallback(debounce(handleSave, 1 * 1000), []);

  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Questionnaire Composer</title>
      </Head>

      <div className="pt-24"></div>

      <div className="pt-8 pb-4 px-6 flex justify-between items-center">
        <div className="font-bold text-xl">
          Questionnaire Composer for{" "}
          <span className="text-green-600">{estateCensusForm?.name}</span>
        </div>
        <div>
          <Button
            type="button"
            onClick={async e => {
              if (e) e.preventDefault();
              showLoadingSpinner();
              try {
                let result = await generateEstateCensusFormPDF({
                  variables: {
                    formId: router.query.formId,
                  },
                });
                const pdfUrl =
                  result.data.generateEstateCensusFormPDF +
                  "?t=" +
                  new Date().toISOString();
                // console.log({ pdfUrl });
                window.open(pdfUrl);
              } catch (err) {
                notification.handleError(err);
              }
              hideLoadingSpinner();
            }}
            className="btn btn-success btn-rounded text-lg">
            <i className="fa fa-print" /> Generate Questionnaire Form PDF File
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-start py-4 px-6">
        <div className="flex-none pr-2 text-lg">Form Specification</div>
        <div className="border-t-4 border-gray-300 w-full"></div>
      </div>

      <div className="px-6">
        {formData?.specs?.map((spec, index) => {
          if (spec.type === "Free Text") {
            return (
              <FieldFreeTextComposer
                key={spec._id}
                {...spec}
                onSpecChange={({ key, value }) => {
                  const nextState = produce(formData, draftState => {
                    set(draftState.specs[index], key, value);
                    // draftState.specs[index][key] = value;
                  });
                  setFormData(nextState);
                  // console.log({ key, value, nextState });
                  handleSaveDebounced(null, nextState, { silent: true });
                }}
                onSpecRemove={spec => {
                  const nextState = produce(formData, draftState => {
                    draftState.specs.splice(index, 1);
                  });
                  setFormData(nextState);
                  handleSaveDebounced(null, nextState, { silent: true });
                }}
              />
            );
          } else if (spec.type === "Checkbox") {
            return (
              <FieldCheckboxComposer
                key={spec._id}
                {...spec}
                onSpecChange={({ key, value }) => {
                  const nextState = produce(formData, draftState => {
                    set(draftState.specs[index], key, value);
                    // draftState.specs[index][key] = value;
                  });
                  setFormData(nextState);
                  // console.log({ key, value, nextState });
                  handleSaveDebounced(null, nextState, { silent: true });
                }}
                onSpecRemove={spec => {
                  const nextState = produce(formData, draftState => {
                    draftState.specs.splice(index, 1);
                  });
                  setFormData(nextState);
                  handleSaveDebounced(null, nextState, { silent: true });
                }}
              />
            );
          } else if (spec.type === "Short Question") {
            return (
              <FieldShortQuestionComposer
                key={spec._id}
                {...spec}
                onSpecChange={({ key, value }) => {
                  const nextState = produce(formData, draftState => {
                    set(draftState.specs[index], key, value);
                    // draftState.specs[index][key] = value;
                  });
                  setFormData(nextState);
                  // console.log({ key, value, nextState });
                  handleSaveDebounced(null, nextState, { silent: true });
                }}
                onSpecRemove={spec => {
                  const nextState = produce(formData, draftState => {
                    draftState.specs.splice(index, 1);
                  });
                  setFormData(nextState);
                  handleSaveDebounced(null, nextState, { silent: true });
                }}
              />
            );
          } else if (spec.type === "Fixed Table") {
            return (
              <FieldFixedTableComposer
                key={spec._id}
                {...spec}
                onSpecChange={({ key, value }) => {
                  const nextState = produce(formData, draftState => {
                    set(draftState.specs[index], key, value);
                    // draftState.specs[index][key] = value;
                  });
                  setFormData(nextState);
                  // console.log({ key, value, nextState });
                  handleSaveDebounced(null, nextState, { silent: true });
                }}
                onSpecRemove={spec => {
                  const nextState = produce(formData, draftState => {
                    draftState.specs.splice(index, 1);
                  });
                  setFormData(nextState);
                  handleSaveDebounced(null, nextState, { silent: true });
                }}
              />
            );
          } else if (spec.type === "Question Table") {
            return (
              <FieldQuestionTableComposer
                key={spec._id}
                {...spec}
                onSpecChange={({ key, value }) => {
                  const nextState = produce(formData, draftState => {
                    set(draftState.specs[index], key, value);
                    // draftState.specs[index][key] = value;
                  });
                  setFormData(nextState);
                  // console.log({ key, value, nextState });
                  handleSaveDebounced(null, nextState, { silent: true });
                }}
                onSpecRemove={spec => {
                  const nextState = produce(formData, draftState => {
                    draftState.specs.splice(index, 1);
                  });
                  setFormData(nextState);
                  handleSaveDebounced(null, nextState, { silent: true });
                }}
              />
            );
          } else {
            return null;
          }
        })}
        <div className="text-center py-8">
          <Button
            type="button"
            onClick={e => {
              if (e) e.preventDefault();
              const nextState = produce(formData, draftState => {
                if (!draftState.specs) {
                  draftState.specs = [];
                }
                draftState.specs.push({
                  _id: uuidv4(),
                  type: "Free Text",
                  label: "",
                });
              });
              setFormData(nextState);
              handleSaveDebounced(null, nextState, { silent: true });
            }}
            className="btn btn-primary btn-rounded">
            <i className="fa fa-plus-circle" /> Add Field / Field Group
          </Button>
        </div>
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Questionnare);

const SPEC_TYPES = [
  "Free Text",
  "Short Question",
  "Checkbox",
  "Fixed Table",
  "Question Table",
];

export const FieldFreeText = ({ editMode, ...spec }) => {
  return (
    <div className="text-lg">
      <div>
        {spec.label ||
          (editMode ? (
            <span className="italic text-gray-300">No Label</span>
          ) : null)}
      </div>
      <div className="italic">
        {spec.sublabel ||
          (editMode ? (
            <span className="italic text-gray-300">No Sublabel</span>
          ) : null)}
      </div>
    </div>
  );
};

const FieldFreeTextComposer = ({ onSpecChange, onSpecRemove, ...spec }) => {
  return (
    <div className="grid grid-cols-3 border-b border-gray-300">
      <div className="bg-white py-4 col-span-2">
        <div className="flex justify-between items-center">
          <div className="font-bold">{spec.type} Preview</div>
          <Button
            type="button"
            onClick={e => {
              if (e) e.preventDefault();
              if (onSpecRemove) {
                onSpecRemove(spec);
              }
            }}
            className="btn btn-danger btn-rounded">
            <i className="fa fa-trash" /> &nbsp; Delete This Field
          </Button>
        </div>
        <div className="py-4">
          <FieldFreeText {...spec} />
        </div>
      </div>
      <div className="bg-gray-100 px-4 py-4 transform scale-90 -mt-3 -mb-3">
        <div className="font-bold">{spec.type} Composer</div>
        <SingleSelect
          label="Type"
          hideFeedbackByDefault
          required
          options={SPEC_TYPES}
          value={spec.type}
          onChange={e => {
            if (e) e.preventDefault();
            if (onSpecChange) {
              onSpecChange({
                key: "type",
                value: e.target.value,
              });
            }
          }}
        />
        <ShortText
          label="Label"
          hideFeedbackByDefault
          required
          value={spec.label}
          onChange={e => {
            if (e) e.preventDefault();
            if (onSpecChange) {
              onSpecChange({
                key: "label",
                value: e.target.value,
              });
            }
          }}
        />
        <ShortText
          label="Sublabel"
          hideFeedbackByDefault
          // required
          value={spec.sublabel}
          onChange={e => {
            if (e) e.preventDefault();
            if (onSpecChange) {
              onSpecChange({
                key: "sublabel",
                value: e.target.value,
              });
            }
          }}
        />
      </div>
    </div>
  );
};

export const FieldShortQuestion = ({
  formData = {},
  onUpdate,
  editMode,
  ...spec
}) => {
  const questionKey = spec.label;
  const rowKey = "";
  const columnKey = "";

  const key = [questionKey, rowKey, columnKey].filter(text => !!text).join("-");
  const value = formData?.[key] || "";
  // console.log({ formData, key, value });

  return (
    <div className="text-lg">
      <ShortText
        label={
          <div>
            <div>
              {spec.label ||
                (editMode ? (
                  <span className="italic text-gray-300">No Label</span>
                ) : null)}
            </div>
            <div className="italic">
              {spec.sublabel ||
                (editMode ? (
                  <span className="italic text-gray-300">No Sublabel</span>
                ) : null)}
            </div>
          </div>
        }
        name={spec.label || " "}
        required
        hideFeedbackByDefault
        value={value}
        onChange={e => {
          if (e) e.preventDefault();
          if (onUpdate) {
            onUpdate({
              questionKey,
              rowKey,
              columnKey,
              key,
              value: e.target.value,
            });
          }
        }}
      />
    </div>
  );
};

const FieldShortQuestionComposer = ({
  onSpecChange,
  onSpecRemove,
  ...spec
}) => {
  return (
    <div className="grid grid-cols-3 border-b border-gray-300">
      <div className="bg-white py-4 col-span-2">
        <div className="flex justify-between items-center">
          <div className="font-bold">{spec.type} Preview</div>
          <Button
            type="button"
            onClick={e => {
              if (e) e.preventDefault();
              if (onSpecRemove) {
                onSpecRemove(spec);
              }
            }}
            className="btn btn-danger btn-rounded">
            <i className="fa fa-trash" /> &nbsp; Delete This Field
          </Button>
        </div>
        <div className="py-4">
          <FieldShortQuestion {...spec} editMode />
        </div>
      </div>
      <div className="bg-gray-100 px-4 py-4 transform scale-90 -mt-3 -mb-3">
        <div className="font-bold">{spec.type} Composer</div>
        <SingleSelect
          label="Type"
          hideFeedbackByDefault
          required
          options={SPEC_TYPES}
          value={spec.type}
          onChange={e => {
            if (e) e.preventDefault();
            if (onSpecChange) {
              onSpecChange({
                key: "type",
                value: e.target.value,
              });
            }
          }}
        />
        <ShortText
          label="Label"
          hideFeedbackByDefault
          required
          value={spec.label}
          onChange={e => {
            if (e) e.preventDefault();
            if (onSpecChange) {
              onSpecChange({
                key: "label",
                value: e.target.value,
              });
            }
          }}
        />
        <ShortText
          label="Sublabel"
          hideFeedbackByDefault
          // required
          value={spec.sublabel}
          onChange={e => {
            if (e) e.preventDefault();
            if (onSpecChange) {
              onSpecChange({
                key: "sublabel",
                value: e.target.value,
              });
            }
          }}
        />
      </div>
    </div>
  );
};

export const FieldCheckbox = ({
  formData = {},
  onUpdate,
  editMode,
  ...spec
}) => {
  const questionKey = spec.label;
  console.log({ spec });

  return (
    <div className="text-lg">
      <div>
        {spec.label ||
          (editMode ? (
            <span className="italic text-gray-300">No Label</span>
          ) : null)}
      </div>
      <div className="italic">
        {spec.sublabel ||
          (editMode ? (
            <span className="italic text-gray-300">No Sublabel</span>
          ) : null)}
      </div>

      {spec?.options?.map((option, index) => {
        const rowKey = option.label || "";
        const columnKey = "";

        const key = [questionKey, rowKey, columnKey]
          .filter(text => !!text)
          .join("-");
        const value = formData?.[key] || "No";
        const checked = value === "Yes";
        // console.log({
        //   value,
        //   checked,
        // });

        return (
          <div key={key} className="flex justify-start items-start pl-2 pt-4">
            <div className="pr-2">
              <input
                type="checkbox"
                className="w-6 h-6"
                // value={value}
                checked={checked}
                onMouseDown={e => {
                  if (e) e.preventDefault();
                  if (onUpdate) {
                    // console.log(e.target.checked, checked);
                    onUpdate({
                      questionKey,
                      rowKey,
                      columnKey,
                      key,
                      value: !checked ? "Yes" : "No",
                    });
                  }
                }}
              />
            </div>
            <div>
              <div>
                {option?.label ||
                  (editMode ? (
                    <span className="italic text-gray-300">No Label</span>
                  ) : null)}
              </div>
              <div className="italic">
                {option?.sublabel ||
                  (editMode ? (
                    <span className="italic text-gray-300">No Sublabel</span>
                  ) : null)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const FieldCheckboxComposer = ({ onSpecChange, onSpecRemove, ...spec }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="grid grid-cols-3 border-b border-gray-300">
      <div className="bg-white py-4 col-span-2">
        <div className="flex justify-between items-center">
          <div className="font-bold">{spec.type} Preview</div>
          <Button
            type="button"
            onClick={e => {
              if (e) e.preventDefault();
              if (onSpecRemove) {
                onSpecRemove(spec);
              }
            }}
            className="btn btn-danger btn-rounded">
            <i className="fa fa-trash" /> &nbsp; Delete This Field
          </Button>
        </div>
        <div className="py-4">
          <FieldCheckbox {...spec} editMode />
        </div>
      </div>
      <div className="bg-gray-100 px-4 py-4 transform scale-90 -mt-3 -mb-3">
        <div className="font-bold">{spec.type} Composer</div>
        <SingleSelect
          label="Type"
          hideFeedbackByDefault
          required
          options={SPEC_TYPES}
          value={spec.type}
          onChange={e => {
            if (e) e.preventDefault();
            if (onSpecChange) {
              onSpecChange({
                key: "type",
                value: e.target.value,
              });
            }
          }}
        />
        <ShortText
          label="Label"
          hideFeedbackByDefault
          required
          value={spec.label}
          onChange={e => {
            if (e) e.preventDefault();
            if (onSpecChange) {
              onSpecChange({
                key: "label",
                value: e.target.value,
              });
            }
          }}
        />
        <ShortText
          label="Sublabel"
          hideFeedbackByDefault
          // required
          value={spec.sublabel}
          onChange={e => {
            if (e) e.preventDefault();
            if (onSpecChange) {
              onSpecChange({
                key: "sublabel",
                value: e.target.value,
              });
            }
          }}
        />
        <div className="pt-2">
          <a
            href="#"
            onClick={e => {
              if (e) e.preventDefault();
              setExpanded(!expanded);
            }}
            className="flex items-center justify-between hover:bg-gray-200 py-1 rounded-md">
            <div className="font-bold italic px-2">
              Options ({spec.options?.length} items):
            </div>
            <div className="px-2">
              {expanded ? (
                <i className="fa fa-chevron-up" />
              ) : (
                <i className="fa fa-chevron-down" />
              )}
            </div>
          </a>
          {!expanded
            ? null
            : spec.options?.map((option, index) => {
                return (
                  <div
                    key={index}
                    className="border-l-4 border-gray-300 pl-2 mt-2 mb-4 relative">
                    <ShortText
                      label="Option Label"
                      hideFeedbackByDefault
                      required
                      value={option?.label}
                      onChange={e => {
                        if (e) e.preventDefault();
                        if (onSpecChange) {
                          onSpecChange({
                            key: `options[${index}].label`,
                            value: e.target.value,
                          });
                        }
                      }}
                    />
                    <ShortText
                      label="Option Sublabel"
                      hideFeedbackByDefault
                      // required
                      value={option?.sublabel}
                      onChange={e => {
                        if (e) e.preventDefault();
                        if (onSpecChange) {
                          onSpecChange({
                            key: `options[${index}].sublabel`,
                            value: e.target.value,
                          });
                        }
                      }}
                    />
                    <div className="absolute top-0 right-0 -mt-1">
                      <Button
                        type="button"
                        onClick={e => {
                          if (e) e.preventDefault();
                          if (onSpecChange) {
                            onSpecChange({
                              key: `options`,
                              value: spec.options.filter((o, i) => i !== index),
                            });
                          }
                        }}
                        className="btn btn-danger btn-rounded">
                        <i className="fa fa-trash" /> &nbsp; Delete Option
                      </Button>
                    </div>
                  </div>
                );
              })}
          <div className="text-center pt-2">
            <Button
              type="button"
              onClick={e => {
                if (e) e.preventDefault();
                if (onSpecChange) {
                  onSpecChange({
                    key: `options[${spec.options?.length || 0}]`,
                    value: {
                      label: "",
                      sublabel: "",
                    },
                  });
                }
                setExpanded(true);
              }}
              className="btn btn-primary btn-rounded">
              <i className="fa fa-plus" /> Add Option
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FieldFixedTable = ({
  formData = {},
  onUpdate,
  editMode,
  ...spec
}) => {
  const questionKey = spec.label;

  return (
    <div className="text-lg">
      <div>
        {spec.label ||
          (editMode ? (
            <span className="italic text-gray-300">No Label</span>
          ) : null)}
      </div>
      <div className="italic">
        {spec.sublabel ||
          (editMode ? (
            <span className="italic text-gray-300">No Sublabel</span>
          ) : null)}
      </div>

      <div className="overflow-x-scroll w-full">
        <table class="table-fixed whitespace-nowrap align-top text-left font-normal">
          <thead>
            <tr className="border-solid border-b border-gray-300">
              <th style={{ width: 50 }}>#</th>
              {spec?.columns?.map((column, index) => {
                return (
                  <th
                    key={index}
                    className="font-normal text-base text-center"
                    style={{ width: 200 }}>
                    <div>
                      {column.label ||
                        (editMode ? (
                          <span className="italic text-gray-300">No Label</span>
                        ) : null)}
                    </div>
                    <div className="italic">
                      {column.sublabel ||
                        (editMode ? (
                          <span className="italic text-gray-300">
                            No Sublabel
                          </span>
                        ) : null)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {[...new Array(spec.rowCount || 1)].map((_, index) => {
              const rowKey = "#" + (index + 1);

              return (
                <tr
                  key={index}
                  className="border-solid border-b border-gray-300">
                  <td style={{ width: 50 }}>{index + 1}.</td>
                  {spec?.columns?.map((column, index) => {
                    const columnKey = column.label || "";

                    const key = [questionKey, rowKey, columnKey]
                      .filter(text => !!text)
                      .join("-");
                    const value = formData?.[key] || "";

                    return (
                      <td
                        key={index}
                        className="transform scale-90"
                        style={{ width: 200 }}>
                        <ShortText
                          label=""
                          hideFeedbackByDefault
                          value={value}
                          onChange={e => {
                            if (e) e.preventDefault();
                            if (onUpdate) {
                              // console.log(e.target.checked, checked);
                              onUpdate({
                                questionKey,
                                rowKey,
                                columnKey,
                                key,
                                value: e.target.value,
                              });
                            }
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FieldFixedTableComposer = ({ onSpecChange, onSpecRemove, ...spec }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="grid grid-cols-3 border-b border-gray-300">
      <div className="bg-white py-4 col-span-2">
        <div className="flex justify-between items-center">
          <div className="font-bold">{spec.type} Preview</div>
          <Button
            type="button"
            onClick={e => {
              if (e) e.preventDefault();
              if (onSpecRemove) {
                onSpecRemove(spec);
              }
            }}
            className="btn btn-danger btn-rounded">
            <i className="fa fa-trash" /> &nbsp; Delete This Field
          </Button>
        </div>
        <div className="py-4">
          <FieldFixedTable {...spec} editMode />
        </div>
      </div>
      <div className="bg-gray-100 px-4 py-4 transform scale-90 -mt-3 -mb-3">
        <div className="font-bold">{spec.type} Composer</div>
        <SingleSelect
          label="Type"
          hideFeedbackByDefault
          required
          options={SPEC_TYPES}
          value={spec.type}
          onChange={e => {
            if (e) e.preventDefault();
            if (onSpecChange) {
              onSpecChange({
                key: "type",
                value: e.target.value,
              });
            }
          }}
        />
        <ShortText
          label="Label"
          hideFeedbackByDefault
          required
          value={spec.label}
          onChange={e => {
            if (e) e.preventDefault();
            if (onSpecChange) {
              onSpecChange({
                key: "label",
                value: e.target.value,
              });
            }
          }}
        />
        <ShortText
          label="Sublabel"
          hideFeedbackByDefault
          // required
          value={spec.sublabel}
          onChange={e => {
            if (e) e.preventDefault();
            if (onSpecChange) {
              onSpecChange({
                key: "sublabel",
                value: e.target.value,
              });
            }
          }}
        />
        <Number
          label="Row Count"
          hideFeedbackByDefault
          required
          value={spec.rowCount || 1}
          onChange={e => {
            if (e) e.preventDefault();
            if (onSpecChange) {
              onSpecChange({
                key: "rowCount",
                value: parseInt(e.target.value || 1),
              });
            }
          }}
        />
        <div className="pt-2">
          <a
            href="#"
            onClick={e => {
              if (e) e.preventDefault();
              setExpanded(!expanded);
            }}
            className="flex items-center justify-between hover:bg-gray-200 py-1 rounded-md">
            <div className="font-bold italic px-2">
              Columns ({spec.columns?.length} items):
            </div>
            <div className="px-2">
              {expanded ? (
                <i className="fa fa-chevron-up" />
              ) : (
                <i className="fa fa-chevron-down" />
              )}
            </div>
          </a>
          {!expanded
            ? null
            : spec.columns?.map((column, index) => {
                return (
                  <div
                    key={index}
                    className="border-l-4 border-gray-300 pl-2 mt-2 mb-4 relative">
                    <ShortText
                      label="Column Label"
                      hideFeedbackByDefault
                      required
                      value={column?.label}
                      onChange={e => {
                        if (e) e.preventDefault();
                        if (onSpecChange) {
                          onSpecChange({
                            key: `columns[${index}].label`,
                            value: e.target.value,
                          });
                        }
                      }}
                    />
                    <ShortText
                      label="Column Sublabel"
                      hideFeedbackByDefault
                      // required
                      value={column?.sublabel}
                      onChange={e => {
                        if (e) e.preventDefault();
                        if (onSpecChange) {
                          onSpecChange({
                            key: `columns[${index}].sublabel`,
                            value: e.target.value,
                          });
                        }
                      }}
                    />
                    <div className="absolute top-0 right-0 -mt-1">
                      <Button
                        type="button"
                        onClick={e => {
                          if (e) e.preventDefault();
                          if (onSpecChange) {
                            onSpecChange({
                              key: `columns`,
                              value: spec.columns.filter((o, i) => i !== index),
                            });
                          }
                        }}
                        className="btn btn-danger btn-rounded">
                        <i className="fa fa-trash" /> &nbsp; Delete Column
                      </Button>
                    </div>
                  </div>
                );
              })}
          <div className="text-center pt-2">
            <Button
              type="button"
              onClick={e => {
                if (e) e.preventDefault();
                if (onSpecChange) {
                  onSpecChange({
                    key: `columns[${spec.columns?.length || 0}]`,
                    value: {
                      label: "",
                      sublabel: "",
                    },
                  });
                }
                setExpanded(true);
              }}
              className="btn btn-primary btn-rounded">
              <i className="fa fa-plus" /> Add Column
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FieldQuestionTable = ({
  formData = {},
  onUpdate,
  editMode,
  ...spec
}) => {
  const questionKey = spec.label;

  return (
    <div className="text-lg">
      <div>
        {spec.label ||
          (editMode ? (
            <span className="italic text-gray-300">No Label</span>
          ) : null)}
      </div>
      <div className="italic">
        {spec.sublabel ||
          (editMode ? (
            <span className="italic text-gray-300">No Sublabel</span>
          ) : null)}
      </div>

      <div className="overflow-x-scroll w-full">
        <table class="table-fixed whitespace-nowrap align-top text-left font-normal">
          <thead>
            <tr className="border-solid border-b border-gray-300 flex items-stretch">
              <th className="text-center" style={{ width: 200 }}>
                #
              </th>
              {spec?.columns?.map((column, index) => {
                return (
                  <th
                    key={index}
                    className="font-normal text-base text-center"
                    style={{ width: 200 }}>
                    <div>
                      {column.label ||
                        (editMode ? (
                          <span className="italic text-gray-300">No Label</span>
                        ) : null)}
                    </div>
                    <div className="italic">
                      {column.sublabel ||
                        (editMode ? (
                          <span className="italic text-gray-300">
                            No Sublabel
                          </span>
                        ) : null)}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {spec?.rows?.map((row, index) => {
              const rowKey = row.label || "";

              return (
                <tr
                  key={index}
                  className="border-solid border-b border-gray-300 flex items-stretch">
                  <td className="font-normal text-base" style={{ width: 200 }}>
                    <div>
                      {row.label ||
                        (editMode ? (
                          <span className="italic text-gray-300">No Label</span>
                        ) : null)}
                    </div>
                    <div className="italic">
                      {row.sublabel ||
                        (editMode ? (
                          <span className="italic text-gray-300">
                            No Sublabel
                          </span>
                        ) : null)}
                    </div>
                  </td>
                  {spec?.columns?.map((column, index) => {
                    const columnKey = column.label || "";

                    const key = [questionKey, rowKey, columnKey]
                      .filter(text => !!text)
                      .join("-");
                    const value = formData?.[key] || "";

                    return (
                      <td
                        key={index}
                        className="transform scale-90"
                        style={{ width: 200 }}>
                        <ShortText
                          label=""
                          hideFeedbackByDefault
                          value={value}
                          onChange={e => {
                            if (e) e.preventDefault();
                            if (onUpdate) {
                              // console.log(e.target.checked, checked);
                              onUpdate({
                                questionKey,
                                rowKey,
                                columnKey,
                                key,
                                value: e.target.value,
                              });
                            }
                          }}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FieldQuestionTableComposer = ({
  onSpecChange,
  onSpecRemove,
  ...spec
}) => {
  const [expanded, setExpanded] = useState(false);
  const [rowExpanded, setRowExpanded] = useState(false);

  return (
    <div className="grid grid-cols-3 border-b border-gray-300">
      <div className="bg-white py-4 col-span-2">
        <div className="flex justify-between items-center">
          <div className="font-bold">{spec.type} Preview</div>
          <Button
            type="button"
            onClick={e => {
              if (e) e.preventDefault();
              if (onSpecRemove) {
                onSpecRemove(spec);
              }
            }}
            className="btn btn-danger btn-rounded">
            <i className="fa fa-trash" /> &nbsp; Delete This Field
          </Button>
        </div>
        <div className="py-4">
          <FieldQuestionTable {...spec} editMode />
        </div>
      </div>
      <div className="bg-gray-100 px-4 py-4 transform scale-90 -mt-3 -mb-3">
        <div className="font-bold">{spec.type} Composer</div>
        <SingleSelect
          label="Type"
          hideFeedbackByDefault
          required
          options={SPEC_TYPES}
          value={spec.type}
          onChange={e => {
            if (e) e.preventDefault();
            if (onSpecChange) {
              onSpecChange({
                key: "type",
                value: e.target.value,
              });
            }
          }}
        />
        <ShortText
          label="Label"
          hideFeedbackByDefault
          required
          value={spec.label}
          onChange={e => {
            if (e) e.preventDefault();
            if (onSpecChange) {
              onSpecChange({
                key: "label",
                value: e.target.value,
              });
            }
          }}
        />
        <ShortText
          label="Sublabel"
          hideFeedbackByDefault
          // required
          value={spec.sublabel}
          onChange={e => {
            if (e) e.preventDefault();
            if (onSpecChange) {
              onSpecChange({
                key: "sublabel",
                value: e.target.value,
              });
            }
          }}
        />

        <div className="pt-2">
          <a
            href="#"
            onClick={e => {
              if (e) e.preventDefault();
              setExpanded(!expanded);
            }}
            className="flex items-center justify-between hover:bg-gray-200 py-1 rounded-md">
            <div className="font-bold italic px-2">
              Columns ({spec.columns?.length} items):
            </div>
            <div className="px-2">
              {expanded ? (
                <i className="fa fa-chevron-up" />
              ) : (
                <i className="fa fa-chevron-down" />
              )}
            </div>
          </a>
          {!expanded
            ? null
            : spec.columns?.map((column, index) => {
                return (
                  <div
                    key={index}
                    className="border-l-4 border-gray-300 pl-2 mt-2 mb-4 relative">
                    <ShortText
                      label="Column Label"
                      hideFeedbackByDefault
                      required
                      value={column?.label}
                      onChange={e => {
                        if (e) e.preventDefault();
                        if (onSpecChange) {
                          onSpecChange({
                            key: `columns[${index}].label`,
                            value: e.target.value,
                          });
                        }
                      }}
                    />
                    <ShortText
                      label="Column Sublabel"
                      hideFeedbackByDefault
                      // required
                      value={column?.sublabel}
                      onChange={e => {
                        if (e) e.preventDefault();
                        if (onSpecChange) {
                          onSpecChange({
                            key: `columns[${index}].sublabel`,
                            value: e.target.value,
                          });
                        }
                      }}
                    />
                    <div className="absolute top-0 right-0 -mt-1">
                      <Button
                        type="button"
                        onClick={e => {
                          if (e) e.preventDefault();
                          if (onSpecChange) {
                            onSpecChange({
                              key: `columns`,
                              value: spec.columns.filter((o, i) => i !== index),
                            });
                          }
                        }}
                        className="btn btn-danger btn-rounded">
                        <i className="fa fa-trash" /> &nbsp; Delete Column
                      </Button>
                    </div>
                  </div>
                );
              })}
          <div className="text-center pt-2">
            <Button
              type="button"
              onClick={e => {
                if (e) e.preventDefault();
                if (onSpecChange) {
                  onSpecChange({
                    key: `columns[${spec.columns?.length || 0}]`,
                    value: {
                      label: "",
                      sublabel: "",
                    },
                  });
                  setExpanded(true);
                }
              }}
              className="btn btn-primary btn-rounded">
              <i className="fa fa-plus" /> Add Column
            </Button>
          </div>
        </div>

        <div className="pt-2">
          <a
            href="#"
            onClick={e => {
              if (e) e.preventDefault();
              setRowExpanded(!rowExpanded);
            }}
            className="flex items-center justify-between hover:bg-gray-200 py-1 rounded-md">
            <div className="font-bold italic px-2">
              Rows ({spec.rows?.length} items):
            </div>
            <div className="px-2">
              {rowExpanded ? (
                <i className="fa fa-chevron-up" />
              ) : (
                <i className="fa fa-chevron-down" />
              )}
            </div>
          </a>
          {!rowExpanded
            ? null
            : spec.rows?.map((row, index) => {
                return (
                  <div
                    key={index}
                    className="border-l-4 border-gray-300 pl-2 mt-2 mb-4 relative">
                    <ShortText
                      label="Row Label"
                      hideFeedbackByDefault
                      required
                      value={row?.label}
                      onChange={e => {
                        if (e) e.preventDefault();
                        if (onSpecChange) {
                          onSpecChange({
                            key: `rows[${index}].label`,
                            value: e.target.value,
                          });
                        }
                      }}
                    />
                    <ShortText
                      label="Row Sublabel"
                      hideFeedbackByDefault
                      // required
                      value={row?.sublabel}
                      onChange={e => {
                        if (e) e.preventDefault();
                        if (onSpecChange) {
                          onSpecChange({
                            key: `rows[${index}].sublabel`,
                            value: e.target.value,
                          });
                        }
                      }}
                    />
                    <div className="absolute top-0 right-0 -mt-1">
                      <Button
                        type="button"
                        onClick={e => {
                          if (e) e.preventDefault();
                          if (onSpecChange) {
                            onSpecChange({
                              key: `rows`,
                              value: spec.rows.filter((o, i) => i !== index),
                            });
                          }
                        }}
                        className="btn btn-danger btn-rounded">
                        <i className="fa fa-trash" /> &nbsp; Delete Row
                      </Button>
                    </div>
                  </div>
                );
              })}
          <div className="text-center pt-2">
            <Button
              type="button"
              onClick={e => {
                if (e) e.preventDefault();
                if (onSpecChange) {
                  onSpecChange({
                    key: `rows[${spec.rows?.length || 0}]`,
                    value: {
                      label: "",
                      sublabel: "",
                    },
                  });
                }
                setRowExpanded(true);
              }}
              className="btn btn-primary btn-rounded">
              <i className="fa fa-plus" /> Add Row
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
