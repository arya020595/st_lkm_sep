import React, { useState, useEffect, useMemo } from "react";
import Head from "next/head";
import { withApollo } from "../../libs/apollo";
import { useRouter } from "next/router";
import AdminArea from "../../components/AdminArea";
import { useMutation, useQuery } from "@apollo/client";
import gql from "graphql-tag";
import {
  hideLoadingSpinner,
  showLoadingSpinner,
  useNotification,
} from "../../components/App";
import { SingleSelect } from "../../components/form/SingleSelect";
import { MultipleSelect } from "../../components/form/MultipleSelect";
import { ShortText } from "../../components/form/ShortText";
import { LongText } from "../../components/form/LongText";
import dayjs from "dayjs";
import { orderBy } from "lodash";
import { Checkbox } from "../../components/form/Checkbox";

import { useForm, Controller } from "react-hook-form";

const QUERY = gql`
  query Query($year: String!, $dataId: String, $smallholderId: String) {
    allLocalRegion {
      _id
      code
      description
    }
    # allSmallholders {
    #   _id
    #   name
    # }
    smallholderById(_id: $smallholderId) {
      _id
      name
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
    smallholderCensusQuestionnaireData(_id: $dataId) {
      _id
      _createdAt
      _updatedAt

      year
      questionnaireId
      questionIds
      questions {
        _id

        sectionId
        subSectionId
        questionCodeId

        type
        code
        question
        options
      }

      localRegionId
      smallholderId

      data
    }
  }
`;

const CREATE = gql`
  mutation createSmallholderCensusQuestionnaireData(
    $year: String
    $localRegionId: String
    $smallholderId: String
    $data: JSON
  ) {
    createSmallholderCensusQuestionnaireData(
      year: $year
      localRegionId: $localRegionId
      smallholderId: $smallholderId
      data: $data
    ) {
      _id
      _createdAt
      _updatedAt

      year
      questionnaireId
      questionIds
      questions {
        _id

        sectionId
        subSectionId
        questionCodeId

        type
        code
        question
        options
      }

      localRegionId
      smallholderId

      data
    }
  }
`;

const UPDATE = gql`
  mutation updateSmallholderCensusQuestionnaireData(
    $_id: String!
    $year: String
    $localRegionId: String
    $smallholderId: String
    $data: JSON
  ) {
    updateSmallholderCensusQuestionnaireData(
      _id: $_id
      data: $data
      year: $year
      localRegionId: $localRegionId
      smallholderId: $smallholderId
    )
  }
`;

const DELETE = gql`
  mutation deleteSmallholderCensusQuestionnaireData($_id: String!) {
    deleteSmallholderCensusQuestionnaireData(_id: $_id)
  }
`;

const Questionnare = () => {
  const router = useRouter();
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
    ...router.query,
  });

  const [createSmallholderCensusQuestionnaireData] = useMutation(CREATE);
  const [updateSmallholderCensusQuestionnaireData] = useMutation(UPDATE);
  const [deleteSmallholderCensusQuestionnaireData] = useMutation(DELETE);
  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      year: filters.year,
      dataId: router.query.dataId || "",
      smallholderId: router.query.smallholderId || "",
    },
  });

  let smallholderCensusQuestionnaireData =
    data?.smallholderCensusQuestionnaireData || {};
  let smallholderCensusQuestionnaireByYear =
    data?.smallholderCensusQuestionnaireByYear || {};
  // console.log({ smallholderCensusQuestionnaireByYear });
  let allLocalRegion = data?.allLocalRegion || [];
  let allSmallholders = data?.allSmallholders || [];
  let smallholderById = data?.smallholderById || {};

  // const [formData, setFormData] = useState({});
  // console.log({ formData });
  // useEffect(() => {
  //   // console.log({ smallholderCensusQuestionnaireData });
  //   if (!smallholderCensusQuestionnaireData?._id) return;
  //   setFormData({
  //     ...(smallholderCensusQuestionnaireData?.data || {}),
  //   });
  // }, [smallholderCensusQuestionnaireData?._id]);

  return (
    <AdminArea urlQuery={router.query} title="Questionnaire for Data Banci">
      <Head>
        <title>Questionnaire</title>
      </Head>

      <div className="mt-26 pr-0 md:pr-10 py-4 bg-white">
        <a
          href="/lkm/smallholder-census/questionnare-data"
          onClick={e => {
            if (e) e.preventDefault();
            history.back();
          }}
          className="hover:opacity-50 text-primary-600">
          <i className="fa fa-arrow-left" /> Back
        </a>
      </div>
      <div className="py-2 font-bold text-xl">Questionnaire for Data Banci</div>
      <div className="grid grid-cols-3 gap-x-6 md:pr-10 opacity-50 pointer-events-none pb-4">
        <SingleSelect
          disabled
          required
          label="Tahun Banci"
          value={filters.year}
          options={YEARS}
          onChange={e => {
            if (e) e.preventDefault();
            return;
          }}
        />
        <SingleSelect
          disabled
          required
          label="Local Region"
          value={filters.localRegionId}
          options={allLocalRegion.map(item => {
            return {
              label: item.description,
              value: item._id,
            };
          })}
          renderValue={value => {
            const selectedItem = allLocalRegion.find(
              item => item._id === value,
            );
            return selectedItem?.description || "";
          }}
          onChange={e => {
            if (e) e.preventDefault();
            return;
          }}
        />
        <ShortText
          disabled
          required
          label="Smallholder"
          value={smallholderById?.name}
          onChange={e => {
            if (e) e.preventDefault();
            return;
          }}
        />
      </div>

      <div className="md:pr-10 pb-16">
        {loading ? (
          <div className="py-8 text-center text-blue-300">
            Loading... Please Wait...
          </div>
        ) : (
          <div className="p-4 rounded-md border-2 border-gray-200">
            <div className="font-bold text-lg">
              Questionnaire {smallholderCensusQuestionnaireByYear.year}
            </div>
            <QuestionnaireForms
              defaultValues={smallholderCensusQuestionnaireData?.data || {}}
              onSubmit={async data => {
                // if (e) e.preventDefault();

                const formData = data;

                showLoadingSpinner();
                try {
                  if (router.query.dataId) {
                    await updateSmallholderCensusQuestionnaireData({
                      variables: {
                        ...filters,
                        smallholderId: router.query.smallholderId,
                        _id: router.query.dataId,
                        data: formData || {},
                      },
                    });
                    notification.addNotification({
                      message: `Data Banci has been saved successfully!`,
                    });
                    await refetch();
                  } else {
                    let result = await createSmallholderCensusQuestionnaireData(
                      {
                        variables: {
                          ...filters,
                          smallholderId: router.query.smallholderId,
                          data: formData || {},
                        },
                      },
                    );
                    notification.addNotification({
                      message: `Data Banci has been saved successfully!`,
                    });
                    router.replace({
                      pathname: router.pathname,
                      query: {
                        ...router.query,
                        dataId:
                          result.data.createSmallholderCensusQuestionnaireData
                            ._id,
                      },
                    });
                  }
                  // setTimeout(() => {
                  //   history.back();
                  // }, 1000);
                } catch (err) {
                  notification.handleError(err);
                }
                hideLoadingSpinner();
              }}
              questions={smallholderCensusQuestionnaireByYear?.questions || []}
              // formData={formData}
              // setFormData={setFormData}
              // customHeaderUtilities={
              //   <div className="font-bold text-lg">
              //     Questionnaire {smallholderCensusQuestionnaireByYear.year}
              //   </div>
              // }
            />
          </div>
        )}
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Questionnare);

const QuestionnaireForms = ({
  defaultValues,
  onSubmit,
  questions = [],
  // formData = {},
  // setFormData,
  customHeaderUtilities,
  customHeaderButton,
}) => {
  const {
    control,
    register,
    handleSubmit,
    // watch,
    formState: { errors },
  } = useForm({ defaultValues });
  // console.log(watch("example"));

  // const customOnSubmit = data => {
  //   console.log(JSON.stringify(data));
  // };

  // console.log({ questions, formData });
  let [sortingSpecs, setSortingSpecs] = useState({
    sectionId: "asc",
    subSectionId: "asc",
    questionCodeId: "asc",
  });
  let sortedQuestions = useMemo(() => {
    if (!questions) return [];
    return orderBy(
      questions,
      Object.keys(sortingSpecs),
      Object.values(sortingSpecs),
    );
    // .slice(0, 2);
  }, [sortingSpecs, questions]);
  // console.log({ sortedQuestions });

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

  if (!questions?.length) {
    return (
      <div className="py-8 text-center text-gray-300">
        Questionnaire Has No Questions
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
                // console.log({ item, formData, value: formData[item?._id] });

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
                            <input
                              className="form-control py-2"
                              {...register(item._id)}
                            />
                            {/* <LongText
                              key={item._id}
                              name={item.question}
                              label={
                                <div>
                                  <div className="text-sm text-right">
                                    [{item.code}]
                                  </div>
                                </div>
                              }
                              // required
                              // value={formData[item?._id] || ""}
                              // onChange={e => {
                              //   if (e) e.preventDefault();
                              //   // console.log(item?._id, e.target.value);
                              //   if (!setFormData) return;
                              //   setFormData({
                              //     ...formData,
                              //     [item?._id]: e.target.value,
                              //   });
                              // }}
                              rows={1}
                            /> */}
                          </div>
                        </div>
                      ) : item.type === "Tick" ? (
                        <div>
                          {item.options?.map(option => {
                            return (
                              <Controller
                                key={option.value}
                                // name={`${item._id}.${option.value}`}
                                name={item._id}
                                control={control}
                                // rules={{ required: true }}
                                render={({ field }) => (
                                  <Checkbox
                                    name={option.value}
                                    statement={
                                      <div>
                                        {option.value}{" "}
                                        <span className="text-sm text-right">
                                          [{option.code}]
                                        </span>
                                      </div>
                                    }
                                    // {...field}
                                    value={
                                      !!field?.value?.includes(option.value)
                                    }
                                    onChange={e => {
                                      if (e) e.preventDefault();

                                      const values = (field.value || []).filter(
                                        val => val !== option.value,
                                      );
                                      if (e.target.value === true) {
                                        values.push(option.value);
                                      }
                                      field.onChange(values);
                                    }}
                                  />
                                )}
                              />
                            );
                            // return (
                            //   <Checkbox
                            //     key={option.value}
                            //     name={option.value}
                            //     statement={
                            //       <div>
                            //         {option.value}{" "}
                            //         <span className="text-sm text-right">
                            //           [{option.code}]
                            //         </span>
                            //       </div>
                            //     }
                            //     // required
                            //     value={
                            //       (formData[item?._id] || []).includes(
                            //         option.value,
                            //       )
                            //         ? option.value
                            //         : ""
                            //     }
                            //     onChange={e => {
                            //       if (e) e.preventDefault();
                            //       // console.log(item?._id, e.target.value);
                            //       const values = (
                            //         formData[item?._id] || []
                            //       ).filter(val => val !== option.value);
                            //       if (e.target.value === true) {
                            //         values.push(option.value);
                            //       }
                            //       if (!setFormData) return;
                            //       setFormData({
                            //         ...formData,
                            //         [item?._id]: values,
                            //       });
                            //     }}
                            //   />
                            // );
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
      </div>

      <div className="text-center py-8">
        <button type="submit" className="btn btn-success btn-block btn-rounded">
          Save Data Banci <i className="fa fa-check-circle" />
        </button>
      </div>
    </form>
  );
};
