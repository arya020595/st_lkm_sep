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
import { FormModal } from "../../components/Modal";
import Table from "../../components/Table";
import { SingleSelect } from "../../components/form/SingleSelect";
import { Checkbox } from "../../components/form/Checkbox";
import { ShortText } from "../../components/form/ShortText";
import { LongText } from "../../components/form/LongText";
import dayjs from "dayjs";
import { orderBy } from "lodash";

const QUERY = gql`
  query Query($year: String!) {
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
    smallholderCensusQuestionnaireByYear(year: $year) {
      _id
      _createdAt
      _updatedAt

      year
      questionIds
      questions {
        _id

        sectionId
        subSectionId
        questionCodeId

        type
        question
        code
        options
      }
    }
  }
`;

const CREATE = gql`
  mutation createSmallholderCensusQuestionnaire(
    $year: String
    $questionIds: [String]
  ) {
    createSmallholderCensusQuestionnaire(year: $year, questionIds: $questionIds)
  }
`;

const UPDATE = gql`
  mutation updateSmallholderCensusQuestionnaire(
    $_id: String!
    $year: String
    $questionIds: [String]
  ) {
    updateSmallholderCensusQuestionnaire(
      _id: $_id
      year: $year
      questionIds: $questionIds
    )
  }
`;

const DELETE = gql`
  mutation deleteSmallholderCensusQuestionnaire($_id: String!) {
    deleteSmallholderCensusQuestionnaire(_id: $_id)
  }
`;

const COPY = gql`
  mutation copySmallholderCensusQuestionnaire(
    $_id: String!
    $targetYear: String
  ) {
    copySmallholderCensusQuestionnaire(_id: $_id, targetYear: $targetYear)
  }
`;

const Questionnare = () => {
  const router = useRouter();
  const { currentUser, currentUserDontHavePrivilege } = useCurrentUser();
  const notification = useNotification();

  const YEARS = useMemo(() => {
    let years = [];
    let currentYear = dayjs().format("YYYY");
    let iterativeYear = "1980";
    do {
      years.push(iterativeYear);
      iterativeYear = dayjs()
        .set("year", parseInt(iterativeYear))
        .add(1, "year")
        .format("YYYY");
    } while (currentYear !== iterativeYear);
    years.push(iterativeYear);
    return years.reverse();
  }, []);
  let [filters, setFilters] = useState({
    year: dayjs().format("YYYY"),
  });

  const [createSmallholderCensusQuestionnaire] = useMutation(CREATE);
  const [updateSmallholderCensusQuestionnaire] = useMutation(UPDATE);
  const [deleteSmallholderCensusQuestionnaire] = useMutation(DELETE);
  const [copySmallholderCensusQuestionnaire] = useMutation(COPY);
  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      year: filters.year,
    },
  });

  let smallholderCensusQuestionnaireByYear =
    data?.smallholderCensusQuestionnaireByYear || {};

  let allSmallholderCensusQuestions = useMemo(() => {
    if (!data?.allSmallholderCensusQuestions?.length) return [];

    return orderBy(
      (data?.allSmallholderCensusQuestions || []).map(item => {
        return {
          order: (item.order =
            item.sectionId + item.subSectionId + item.questionCode),
          ...item,
        };
      }),
      ["order"],
      ["asc"],
    );
  }, [data?.allSmallholderCensusQuestions?.length]);

  let allSmallholderRefQuestionnareSection =
    data?.allSmallholderRefQuestionnareSection || [];
  let allSmallholderRefQuestionnareSubSection =
    data?.allSmallholderRefQuestionnareSubSection || [];
  let allSmallholderRefQuestionnareQuestionCode =
    data?.allSmallholderRefQuestionnareQuestionCode || [];

  const [formData, setFormData] = useState({});
  const [modalVisible, setModalVisible] = useState(false);
  const [copyModalVisible, setCopyModalVisible] = useState(false);

  const formColumns = useMemo(() => [
    {
      Header: "Section",
      accessor: "sectionId",
      style: {
        fontSize: 20,
        width: 100,
      },
    },
    {
      Header: "Sub Section",
      accessor: "subSectionId",
      style: {
        fontSize: 20,
        width: 100,
      },
    },
    {
      Header: "Code",
      accessor: "questionCodeId",
      style: {
        fontSize: 20,
        width: 100,
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
            <div className="italic text-sm font-semibold text-gray-400">
              Type: {props.row.original.type}
            </div>
          </div>
        );
      },
    },
    {
      Header: "Answer",
      accessor: "type",
      style: {
        fontSize: 20,
      },
      Cell: props => {
        const question = props.row.original;

        if (question.type === "Open-ended") {
          return (
            <div key={question._id} className="flex justify-between">
              <div className="w-full">
                <LongText
                  name={question.question}
                  label={
                    <div>
                      {/* {question.question}{" "} */}
                      <div className="text-sm text-right">
                        ({question.code})
                      </div>
                    </div>
                  }
                  // required
                  value=""
                  onChange={e => {}}
                  rows={1}
                />
              </div>
            </div>
          );
        } else if (question.type === "Tick") {
          return question.options?.map(option => {
            return (
              <Checkbox
                name={option.value}
                statement={
                  <div>
                    {option.value}{" "}
                    <span className="text-sm text-right">({option.code})</span>
                  </div>
                }
                // required
                value=""
                onChange={e => {}}
              />
            );
          });
          // <div key={question._id} className="flex justify-between">
          //   <div className="w-full">
          //     <MultipleSelect
          //       name={question.question}
          //       label={
          //         <div>
          //           {question.question}{" "}
          //           <span className="opacity-0">({question.code})</span>
          //         </div>
          //       }
          //       required
          //       value=""
          //       onChange={e => {}}
          //       options={question.options || []}
          //     />
          //   </div>
          // </div>
        }
        return <div key={question._id} />;
      },
    },
  ]);

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

  return (
    <AdminArea urlQuery={router.query} title="Set Questionnaire">
      <Head>
        <title>Set Questionnaire</title>
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
      </div>
      <div className="grid grid-cols-2 gap-x-6">
        <div>
          <SingleSelect
            required
            label="Tahun Banci"
            value={filters.year}
            options={YEARS}
            onChange={e => {
              if (e) e.preventDefault();
              setFilters({
                ...filters,
                year: e.target.value,
              });
            }}
          />
        </div>
      </div>

      <div className="md:pr-10">
        {loading ? (
          <div className="py-8 text-center text-blue-300">
            Loading... Please Wait...
          </div>
        ) : smallholderCensusQuestionnaireByYear?._id &&
          smallholderCensusQuestionnaireByYear?.questions?.length > 0 ? (
          <div className="p-4 rounded-md border-2 border-gray-200">
            <QuestionnaireForms
              questions={smallholderCensusQuestionnaireByYear?.questions || []}
              // formData={formData}
              // setFormData={setFormData}
              customHeaderUtilities={
                <div className="font-bold text-lg">
                  Questionnaire {smallholderCensusQuestionnaireByYear.year}
                </div>
              }
              customHeaderButton={
                currentUserDontHavePrivilege([
                  "Set Questionnaire:Create",
                ]) ? null : (
                  <div>
                    <button
                      type="button"
                      onClick={e => {
                        if (e) e.preventDefault();
                        setFormData({
                          _id: smallholderCensusQuestionnaireByYear?._id,
                          targetYear: "",
                        });
                        setCopyModalVisible(true);
                      }}
                      className="my-1 md:my-0 flex items-center h-9 w-auto py-4 px-3 text-white bg-yellow-600 rounded-xl shadow focus:outline-none md:mr-2">
                      <i className="fa fa-copy"></i>
                      <p className="text-lg font-bold mx-2">Copy</p>
                    </button>
                  </div>
                )
              }
            />
          </div>
        ) : (
          <div className="py-8 text-center text-gray-300">
            Questionnaire Has No Questions
          </div>
        )}
        {currentUserDontHavePrivilege(["Set Questionnaire:Create"]) ? null : (
          <div className="text-center py-8">
            <button
              type="button"
              onClick={e => {
                if (e) e.preventDefault();
                setModalVisible(true);
                setFormData({
                  quetionIds: [],
                  year: filters.year,
                  ...smallholderCensusQuestionnaireByYear,
                });
              }}
              className="btn btn-primary btn-rounded py-4"
              style={{
                fontSize: 18,
              }}>
              <i className="fa fa-edit" /> Select Questions from Question Bank
            </button>
          </div>
        )}
      </div>

      <FormModal
        title="Copy Questionnaire"
        visible={copyModalVisible}
        onClose={e => {
          if (e) e.preventDefault();
          setCopyModalVisible(false);
          setFormData({});
        }}
        onSubmit={async e => {
          if (e) e.preventDefault();
          showLoadingSpinner();
          try {
            await copySmallholderCensusQuestionnaire({
              variables: {
                ...formData,
              },
            });
            setFilters({
              ...filters,
              year: formData.targetYear,
            });
            await refetch();
            setCopyModalVisible(false);
          } catch (err) {
            notification.handleError(err);
          }
          hideLoadingSpinner();
        }}>
        <SingleSelect
          required
          label="Copy To Tahun Banci"
          value={formData.targetYear}
          options={YEARS}
          onChange={e => {
            if (e) e.preventDefault();
            setFormData({
              ...formData,
              targetYear: e.target.value,
            });
          }}
        />
        <div className="py-12" />
      </FormModal>

      <FormModal
        title="Select Questions"
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
              await updateSmallholderCensusQuestionnaire({
                variables: {
                  ...formData,
                },
              });
            } else {
              await createSmallholderCensusQuestionnaire({
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
        <Table
          loading={false}
          columns={columns || []}
          data={allSmallholderCensusQuestions || []}
          withoutHeader={true}
          initialSelectedRowIds={formData?.questionIds || []}
          onChangeSelection={({ rows }) => {
            // console.log("onChangeSelection", rows);
            setFormData({
              ...formData,
              questionIds: rows.map(item => item._id),
            });
          }}
        />
      </FormModal>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Questionnare);

const QuestionnaireForms = ({
  questions = [],
  formData = {},
  setFormData,
  customHeaderUtilities,
  customHeaderButton,
}) => {
  let [sortingSpecs, setSortingSpecs] = useState({
    sectionId: "asc",
    subSectionId: "asc",
    questionCodeId: "asc",
  });
  let sortedQuestions = useMemo(() => {
    if (!questions) return questions.length;
    return orderBy(
      questions,
      Object.keys(sortingSpecs),
      Object.values(sortingSpecs),
    );
  }, [sortingSpecs, questions]);

  const headers = useMemo(() => {
    return [
      {
        title: "Section",
        key: "sectionId",
        sortable: true,
        style: { width: 70 },
      },
      {
        title: "Sub Section",
        key: "subSectionId",
        sortable: true,
        style: { width: 70 },
      },
      {
        title: "Question Code",
        key: "questionCodeId",
        sortable: true,
        style: { width: 70 },
      },
      { title: "Question", style: { minWidth: 100 } },
      { title: "Answer" },
    ];
  }, []);

  return (
    <>
      <div className="flex justify-between py-5 px-0 sm:px-5 items-center">
        <div>{customHeaderUtilities}</div>
        <div className="flex flex-col items-stretch md:flex-row">
          {customHeaderButton ? customHeaderButton : null}
        </div>
      </div>
      <div className="rounded-md bg-white flex flex-row shadow-lg flex-wrap text-sm">
        <div className="w-full overflow-x-auto">
          <table className="w-full overflow-scroll md:overflow-x-hidden overflow-y-visible bg-blue-100 ">
            <thead>
              <tr>
                {headers.map((column, index) => {
                  return (
                    <th
                      className="pt-4 pb-3 px-6 font-bolder bg-transparent text-sm text-left border-b bg-custom text-white border-gray-200"
                      style={{
                        paddingLeft: 20,
                        paddingRight: 15,
                        fontSize: 20,
                        backgroundColor: "#74C46F",
                        ...column.style,
                      }}
                      key={index}>
                      <a
                        href="#"
                        onClick={e => {
                          if (e) e.preventDefault();
                          if (!column.sortable) return;
                          if (sortingSpecs[column.key] === "asc") {
                            setSortingSpecs({
                              ...sortingSpecs,
                              [column.key]: "desc",
                            });
                          } else if (sortingSpecs[column.key] === "desc") {
                            let specs = {
                              ...sortingSpecs,
                            };
                            delete specs[column.key];
                            setSortingSpecs({
                              ...specs,
                            });
                          } else {
                            setSortingSpecs({
                              ...sortingSpecs,
                              [column.key]: "asc",
                            });
                          }
                        }}
                        className="flex flex-row hover:opacity-50"
                        style={{}}>
                        <div className="whitespace-no-wrap truncate">
                          {column.title}
                        </div>
                        <div className="text-white pl-2">
                          {column.sortable ? (
                            sortingSpecs[column.key] === "asc" ? (
                              <i className="fa fa-sort-up" />
                            ) : sortingSpecs[column.key] === "desc" ? (
                              <i className="fa fa-sort-down" />
                            ) : (
                              <i className="fa fa-sort" />
                            )
                          ) : null}
                        </div>
                      </a>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="transition duration-500">
              {sortedQuestions.map((item, index) => {
                // console.log({ item });
                return (
                  <tr
                    key={index}
                    className="transition duration-100 ease-linear border-b border-gray-300 bg-white hover:bg-gray-100 text-gray-700 cursor-pointer">
                    <td
                      className="py-5 px-6"
                      style={{
                        paddingLeft: 20,
                        paddingRight: 15,
                        fontSize: 20,
                        width: 70,
                      }}>
                      {item.sectionId}
                    </td>
                    <td
                      className="py-5 px-6"
                      style={{
                        paddingLeft: 20,
                        paddingRight: 15,
                        fontSize: 20,
                        width: 70,
                      }}>
                      {item.subSectionId}
                    </td>
                    <td
                      className="py-5 px-6"
                      style={{
                        paddingLeft: 20,
                        paddingRight: 15,
                        fontSize: 20,
                        width: 70,
                      }}>
                      {item.questionCodeId}
                    </td>
                    <td
                      className="py-5 px-6"
                      style={{
                        paddingLeft: 20,
                        paddingRight: 15,
                        fontSize: 20,
                        minWidth: 100,
                      }}>
                      {item.question}
                    </td>
                    <td
                      className="py-5 px-6"
                      style={{
                        paddingLeft: 20,
                        paddingRight: 15,
                        fontSize: 20,
                        // ...cell.column.style,
                      }}>
                      {item.type === "Open-ended" ? (
                        <div className="flex justify-between">
                          <div className="w-full">
                            <LongText
                              key={item._id}
                              name={item.question}
                              label={
                                <div>
                                  {/* {item.question}{" "} */}
                                  <div className="text-sm text-right">
                                    [{item.code}]
                                  </div>
                                </div>
                              }
                              required
                              value={formData[item?._id] || ""}
                              onChange={e => {
                                if (e) e.preventDefault();
                                // console.log(item?._id, e.target.value);
                                if (!setFormData) return;
                                setFormData({
                                  ...formData,
                                  [item?._id]: e.target.value,
                                });
                              }}
                              rows={1}
                            />
                          </div>
                        </div>
                      ) : item.type === "Tick" ? (
                        <div>
                          {item.options?.map(option => {
                            return (
                              <Checkbox
                                key={option.value}
                                name={option.value}
                                statement={
                                  <div>
                                    {option.value}{" "}
                                    <span className="text-sm text-right">
                                      [{option.code}]
                                    </span>
                                  </div>
                                }
                                required
                                value={
                                  (formData[item?._id] || []).includes(
                                    option.value,
                                  )
                                    ? option.value
                                    : ""
                                }
                                onChange={e => {
                                  if (e) e.preventDefault();
                                  // console.log(item?._id, e.target.value);
                                  const values = (
                                    formData[item?._id] || []
                                  ).filter(val => val !== option.value);
                                  if (e.target.value === true) {
                                    values.push(option.value);
                                  }
                                  if (!setFormData) return;
                                  setFormData({
                                    ...formData,
                                    [item?._id]: values,
                                  });
                                }}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div key={item._id} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* {questions.length === 0 ? (
          <div className="w-full text-center py-5 text-lg">No Question</div>
        ) : null} */}
      </div>
    </>
  );
};
