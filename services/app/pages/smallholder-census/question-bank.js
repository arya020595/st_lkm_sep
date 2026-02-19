import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea, { useCurrentUser } from "../../components/AdminArea";
import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import {
  hideLoadingSpinner,
  showLoadingSpinner,
  useNotification,
} from "../../components/App";
import { DropDownMenu } from "../../components/DropDownMenu";
import { FormModal } from "../../components/Modal";
import Table from "../../components/Table";
import { SingleSelect } from "../../components/form/SingleSelect";
import { ShortText } from "../../components/form/ShortText";

const QUERY = gql`
  query Query {
    allSmallholderCensusQuestions {
      _id

      sectionId
      subSectionId
      questionCodeId

      type
      question
      code
      options
    }
    allSmallholderRefQuestionnareSection {
      _id
      section
    }
    allSmallholderRefQuestionnareSubSection {
      _id
      subSection
    }
    allSmallholderRefQuestionnareQuestionCode {
      _id
      code
    }
  }
`;

const CREATE = gql`
  mutation createSmallholderCensusQuestion(
    $sectionId: String
    $subSectionId: String
    $questionCodeId: String
    $type: String
    $code: String
    $question: String
    $options: JSON
  ) {
    createSmallholderCensusQuestion(
      sectionId: $sectionId
      subSectionId: $subSectionId
      questionCodeId: $questionCodeId
      type: $type
      question: $question
      code: $code
      options: $options
    )
  }
`;

const UPDATE = gql`
  mutation updateSmallholderCensusQuestion(
    $_id: String!
    $sectionId: String
    $subSectionId: String
    $questionCodeId: String
    $type: String
    $code: String
    $question: String
    $options: JSON
  ) {
    updateSmallholderCensusQuestion(
      _id: $_id
      sectionId: $sectionId
      subSectionId: $subSectionId
      questionCodeId: $questionCodeId
      type: $type
      question: $question
      code: $code
      options: $options
    )
  }
`;

const DELETE = gql`
  mutation deleteSmallholderCensusQuestion($_id: String!) {
    deleteSmallholderCensusQuestion(_id: $_id)
  }
`;

const Questionnare = () => {
  const router = useRouter();
  const notification = useNotification();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();

  const [createSmallholderCensusQuestion] = useMutation(CREATE);
  const [updateSmallholderCensusQuestion] = useMutation(UPDATE);
  const [deleteSmallholderCensusQuestion] = useMutation(DELETE);
  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {},
  });

  let allSmallholderCensusQuestions = data?.allSmallholderCensusQuestions || [];
  let allSmallholderRefQuestionnareSection =
    data?.allSmallholderRefQuestionnareSection || [];
  let allSmallholderRefQuestionnareSubSection =
    data?.allSmallholderRefQuestionnareSubSection || [];
  let allSmallholderRefQuestionnareQuestionCode =
    data?.allSmallholderRefQuestionnareQuestionCode || [];

  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);

  const columns = useMemo(() => [
    {
      Header: "Section",
      accessor: "sectionId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Sub Section",
      accessor: "subSectionId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Question Code",
      accessor: "questionCodeId",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Question",
      accessor: "question",
      style: {
        fontSize: 20,
      },
      Cell: props => {
        return (
          <div>
            {props.cell.value}
            <div className="italic text-sm font-semibold">
              {props.row.original.type}
            </div>
            {props.row.original.type === "Tick" ? (
              <div className="italic text-sm">
                <span className="font-semibold">Options:</span>
                <br />
                {props.row.original.options
                  ?.map(option => option?.value || option)
                  .join(", ")}
              </div>
            ) : null}
          </div>
        );
      },
    },
  ]);
  const customUtilities = useMemo(() => [
    // {
    //   label: "Form Filling",
    //   icon: <i className="fa fa-arrow-right" />,
    //   width: 400,
    //   render: propsTable => {
    //     return (
    //       <div className="flex">
    //         <button
    //           onClick={e => {
    //             if (e) e.preventDefault();
    //             // console.log(propsTable);
    //             router.push({
    //               pathname: "/smallholder-census/questionnare-filling",
    //               query: {
    //                 ...router.query,
    //                 formId: propsTable.row.original._id,
    //               },
    //             });
    //             // window.location.href =
    //             //   "/lkm/smallholder-census/questionnare-filling?formId=" +
    //             //   propsTable.row.original._id;
    //           }}
    //           className="mb-1 bg-blue-500 hover:bg-blue-600 mx-1 py-2 px-2 text-white focus:outline-none rounded-md shadow-lg">
    //           <p className="text-white text-md font-bold">
    //             <i className="fa fa-edit" /> Form Filling
    //           </p>
    //         </button>
    //       </div>
    //     );
    //   },
    // },
  ]);

  return (
    <AdminArea urlQuery={router.query} title="Question Bank">
      <Head>
        <title>Question Bank</title>
      </Head>

      <div className="mt-26 pr-0 md:pr-10 py-4 bg-white">
        {/* <DropDownMenu componentName={router.query.componentName}>
          <div
            className={`${
              !router.query.componentName ||
              router.query.componentName === "Question Bank"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
            onClick={e => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/smallholder-census/questionnare",
                query: {
                  ...router.query,
                  componentName: "Question Bank",
                },
              });
            }}>
            <p className="text-lg font-semibold">Question Bank</p>
          </div>
          <div
            className={`${
              router.query.componentName === "Questionnaire"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
            onClick={e => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/smallholder-census/questionnare-forms",
                query: {
                  ...router.query,
                  componentName: "Questionnaire",
                },
              });
            }}>
            <p className="text-lg font-semibold">Questionnaire</p>
          </div>
          <div
            className={`${
              router.query.componentName === "Data Banci"
                ? "bg-mantis-200 text-black font-bold"
                : "bg-white text-black border border-gray-300"
            } cursor-pointer px-4 py-2 shadow-md rounded-lg mr-0 md:mr-4`}
            onClick={e => {
              if (e) e.preventDefault();
              router.replace({
                pathname: "/smallholder-census/questionnare-data",
                query: {
                  ...router.query,
                  componentName: "Data Banci",
                },
              });
            }}>
            <p className="text-lg font-semibold">Data Banci</p>
          </div>
        </DropDownMenu> */}

        <Table
          // customHeaderUtilities={
          //   <div>
          //     <SingleSelect
          //       label="Banci ID"
          //       value={router.query.banciId}
          //       options={allRefBanci.map(item => {
          //         return {
          //           // value: item.originalFieldObj?.BanciID,
          //           // label: item.originalFieldObj?.BanciID,
          //           value: item.year,
          //           label: item.year,
          //         };
          //       })}
          //       required
          //       onChange={e => {
          //         if (e) e.preventDefault();
          //         router.replace({
          //           pathname: router.pathname,
          //           query: {
          //             ...router.query,
          //             banciId: e.target.value,
          //           },
          //         });
          //       }}
          //     />
          //   </div>
          // }
          loading={false}
          columns={columns}
          data={allSmallholderCensusQuestions}
          withoutHeader={true}
          onAdd={
            currentUserDontHavePrivilege(["Question Bank:Create"])
              ? null
              : e => {
                  if (e) e.preventDefault();
                  // if (!router.query.banciId) {
                  //   notification.handleError({
                  //     message: `Please select Banci ID first!`,
                  //   });
                  //   return;
                  // }
                  setModalVisible(true);
                  setFormData({});
                }
          }
          onEdit={
            currentUserDontHavePrivilege(["Question Bank:Update"])
              ? null
              : props => {
                  // console.log(props);
                  setModalVisible(true);
                  setFormData({
                    ...props.row,
                  });
                }
          }
          onRemove={
            currentUserDontHavePrivilege(["Question Bank:Delete"])
              ? null
              : async props => {
                  // console.log(props);
                  showLoadingSpinner();
                  try {
                    let yes = confirm(
                      `Are you sure to remove ${props.rows.length} item(s)?`,
                    );
                    if (yes) {
                      for (const row of props.rows) {
                        await deleteSmallholderCensusQuestion({
                          variables: {
                            _id: row._id,
                          },
                        });
                      }
                      await refetch();
                    }
                  } catch (err) {
                    notification.handleError(err);
                  }
                  hideLoadingSpinner();
                }
          }
          customUtilities={customUtilities}
        />
      </div>

      <FormModal
        title={`${!formData._id ? "New" : "Edit"} Question`}
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
            if (formData?._id) {
              await updateSmallholderCensusQuestion({
                variables: {
                  ...formData,
                },
              });
            } else {
              await createSmallholderCensusQuestion({
                variables: {
                  ...formData,
                },
              });
            }
            await refetch();
            setModalVisible(false);
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}
        size="lg">
        <div className="grid grid-cols-2 gap-x-6">
          <div>
            <SingleSelect
              required
              label="Section"
              value={formData.sectionId}
              options={allSmallholderRefQuestionnareSection.map(item => {
                return item.section;
                return {
                  value: item._id,
                  label: item.section,
                };
              })}
              onChange={e => {
                if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  sectionId: e.target.value,
                });
              }}
            />
            <SingleSelect
              // required
              label="Sub Section"
              value={formData.subSectionId}
              options={allSmallholderRefQuestionnareSubSection.map(item => {
                return item.subSection;
                return {
                  value: item._id,
                  label: item.subSection,
                };
              })}
              onChange={e => {
                if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  subSectionId: e.target.value,
                });
              }}
            />
            <SingleSelect
              required
              label="Question Code"
              value={formData.questionCodeId}
              options={allSmallholderRefQuestionnareQuestionCode.map(item => {
                return item.code;
                return {
                  value: item._id,
                  label: item.code,
                };
              })}
              onChange={e => {
                if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  questionCodeId: e.target.value,
                });
              }}
            />
          </div>
          <div>
            <ShortText
              label="Question"
              value={formData.question}
              required
              onChange={e => {
                if (e) e.preventDefault();
                setFormData({
                  ...formData,
                  question: e.target.value,
                });
              }}
            />
            <SingleSelect
              required
              label="Answer Type"
              value={formData.type}
              options={["Open-ended", "Tick"]}
              onChange={e => {
                if (e) e.preventDefault();
                let options = formData.options || [];
                if (options.length === 0) {
                  options.push("");
                }
                // console.log({ options });
                setFormData({
                  ...formData,
                  type: e.target.value,
                  options,
                });
              }}
            />
            {formData.type === "Tick" ? (
              <div>
                <div className="font-bold">Answer Options:</div>
                <div className="pl-4 pb-4">
                  {formData.options?.map((option, index) => {
                    return (
                      <div
                        key={index}
                        className="flex justify-between items-start">
                        <ShortText
                          required
                          hideFeedbackByDefault
                          label={`Answer Option #${index + 1}`}
                          value={option?.value}
                          onChange={e => {
                            if (e) e.preventDefault();
                            let options = formData.options || [];
                            options = options.map((o, i) => {
                              return i === index
                                ? {
                                    ...o,
                                    value: e.target.value,
                                  }
                                : o;
                            });
                            setFormData({
                              ...formData,
                              options,
                            });
                          }}
                        />
                        &nbsp;&nbsp;
                        <ShortText
                          hideFeedbackByDefault
                          label="Answer Code"
                          value={option?.code}
                          required
                          onChange={e => {
                            if (e) e.preventDefault();
                            let options = formData.options || [];
                            options = options.map((o, i) => {
                              return i === index
                                ? {
                                    ...o,
                                    code: e.target.value,
                                  }
                                : o;
                            });
                            setFormData({
                              ...formData,
                              options,
                            });
                          }}
                        />
                        &nbsp;&nbsp;
                        <div className="flex-none pt-8">
                          <button
                            type="button"
                            onClick={e => {
                              if (e) e.preventDefault();
                              let options = formData.options || [];
                              options = options.filter((o, i) => {
                                return i !== index;
                              });
                              setFormData({
                                ...formData,
                                options,
                              });
                            }}
                            className="btn btn-lg btn-rounded btn-danger">
                            <i className="fa fa-times" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={e => {
                    if (e) e.preventDefault();
                    let options = formData.options || [];
                    options.push("");
                    setFormData({
                      ...formData,
                      options,
                    });
                  }}
                  className="btn btn-lg btn-rounded btn-primary">
                  <i className="fa fa-plus-circle" /> Add Another Option
                </button>
              </div>
            ) : (
              <ShortText
                label="Answer Code"
                value={formData.code}
                required
                onChange={e => {
                  if (e) e.preventDefault();
                  setFormData({
                    ...formData,
                    code: e.target.value,
                  });
                }}
              />
            )}
          </div>
        </div>
        <div className="py-8" />
      </FormModal>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Questionnare);
