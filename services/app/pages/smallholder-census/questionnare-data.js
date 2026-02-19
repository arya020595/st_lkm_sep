import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import TableAsync from "../../components/TableAsync";
import { SingleSelect } from "../../components/form/SingleSelect";
import { ShortText } from "../../components/form/ShortText";
import dayjs from "dayjs";

const QUERY = gql`
  query Query($year: String!, $localRegionId: String) {
    allSmallholderCensusQuestionnaireData(
      year: $year
      localRegionId: $localRegionId
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
      localRegion {
        _id
        code
        description
      }
      smallholderId
      smallholder {
        _id
        name
      }

      data
    }
    allLocalRegion {
      _id
      code
      description
    }
    # allSmallholders {
    #   _id
    #   name
    # }
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
  mutation createSmallholderCensusQuestionnaireData(
    $sectionId: String
    $subSectionId: String
    $questionCodeId: String
    $type: String
    $code: String
    $question: String
    $options: [String]
  ) {
    createSmallholderCensusQuestionnaireData(
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
  mutation updateSmallholderCensusQuestionnaireData(
    $_id: String!
    $sectionId: String
    $subSectionId: String
    $questionCodeId: String
    $type: String
    $code: String
    $question: String
    $options: [String]
  ) {
    updateSmallholderCensusQuestionnaireData(
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
  mutation deleteSmallholderCensusQuestionnaireData($_id: String!) {
    deleteSmallholderCensusQuestionnaireData(_id: $_id)
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
    ...router.query,
  });

  const [createSmallholderCensusQuestionnaireData] = useMutation(CREATE);
  const [updateSmallholderCensusQuestionnaireData] = useMutation(UPDATE);
  const [deleteSmallholderCensusQuestionnaireData] = useMutation(DELETE);
  const { data, loading, error, refetch } = useQuery(QUERY, {
    variables: {
      year: filters.year || "",
      localRegionId: filters.localRegionId || "",
      // smallholderId: filters.smallholderId || "",
    },
  });

  let smallholderCensusQuestionnaireByYear =
    data?.smallholderCensusQuestionnaireByYear || {};
  let allSmallholderCensusQuestionnaireData =
    data?.allSmallholderCensusQuestionnaireData || [];
  let allLocalRegion = data?.allLocalRegion || [];
  let allSmallholders = data?.allSmallholders || [];
  // console.log({
  //   allSmallholderCensusQuestionnaireData,
  //   allLocalRegion,
  //   allSmallholders,
  // });

  const columns = useMemo(() => [
    {
      Header: "Year",
      accessor: "year",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Local Region",
      accessor: "localRegion.description",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Smallholder",
      accessor: "smallholder.name",
      style: {
        fontSize: 20,
      },
    },
    {
      Header: "Date",
      accessor: "_createdAt",
      style: {
        fontSize: 20,
      },
      Cell: props => dayjs(props.cell.value).format("DD MMMM YYYY HH:mm"),
    },
  ]);
  const customUtilities = useMemo(() => []);
  const [smallholderPickerVisible, setSmallholderPickerVisible] =
    useState(false);

  return (
    <AdminArea urlQuery={router.query} title="Input Data Banci">
      <Head>
        <title>Input Data Banci</title>
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

      <div className="grid grid-cols-2 gap-x-6 md:pr-10">
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
            router.replace({
              pathname: router.pathname,
              query: {
                ...router.query,
                year: e.target.value,
              },
            });
          }}
        />
        <SingleSelect
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
            setFilters({
              ...filters,
              localRegionId: e.target.value,
            });
            router.replace({
              pathname: router.pathname,
              query: {
                ...router.query,
                localRegionId: e.target.value,
              },
            });
          }}
        />

        <ShortText
          required
          label="Smallholder"
          placeholder="Select Smallholder"
          // value={filters.smallholderId}
          value={filters.selectedSmallholder?.name}
          onChange={e => {}}
          onFocus={e => {
            if (e) e.preventDefault();
            // console.log("onFocus...");
            setSmallholderPickerVisible(true);
          }}
          // options={allSmallholders.map(item => {
          //   return {
          //     label: item.name,
          //     value: item._id,
          //   };
          // })}
          // renderValue={value => {
          //   const selectedItem = allSmallholders.find(
          //     item => item._id === value,
          //   );
          //   return selectedItem?.name || "";
          // }}
          // onChange={e => {
          //   if (e) e.preventDefault();
          //   setFilters({
          //     ...filters,
          //     smallholderId: e.target.value,
          //   });
          //   router.replace({
          //     pathname: router.pathname,
          //     query: {
          //       ...router.query,
          //       smallholderId: e.target.value,
          //     },
          //   });
          // }}
        />
        <SmallholderPicker
          visible={smallholderPickerVisible}
          onClose={e => {
            if (e) e.preventDefault();
            setSmallholderPickerVisible(false);
          }}
          onSelect={selectedSmallholder => {
            setFilters({
              ...filters,
              selectedSmallholder,
              smallholderId: selectedSmallholder._id,
            });
            setSmallholderPickerVisible(false);
          }}
        />
        {currentUserDontHavePrivilege(["Input Data Banci:Create"]) ? null : (
          <div className="md:pt-10">
            <button
              type="button"
              disabled={
                !smallholderCensusQuestionnaireByYear?._id ||
                !(
                  filters.localRegionId &&
                  filters.smallholderId &&
                  filters.year
                )
              }
              onClick={e => {
                if (e) e.preventDefault();
                const foundData = allSmallholderCensusQuestionnaireData.find(
                  item => {
                    return (
                      item.year === filters.year &&
                      item.localRegionId === filters.localRegionId &&
                      item.smallholderId === filters.smallholderId
                    );
                  },
                );
                // console.log({ foundData });
                // throw {}
                if (!!foundData) {
                  window.location.href = `/lkm/smallholder-census/questionnare-data-input?questionnaireId=${smallholderCensusQuestionnaireByYear?._id}&localRegionId=${filters.localRegionId}&smallholderId=${filters.smallholderId}&year=${filters.year}&dataId=${foundData._id}`;
                } else {
                  window.location.href = `/lkm/smallholder-census/questionnare-data-input?questionnaireId=${smallholderCensusQuestionnaireByYear?._id}&localRegionId=${filters.localRegionId}&smallholderId=${filters.smallholderId}&year=${filters.year}`;
                }
              }}
              className="btn btn-primary btn-block btn-rounded py-4 -mt-4"
              style={{
                fontSize: 18,
              }}>
              New Data Banci <i className="fa fa-arrow-right" />
            </button>
          </div>
        )}
      </div>

      {filters.localRegionId &&
      // filters.smallholderId &&
      filters.year ? (
        <div className="md:pr-10">
          <Table
            loading={false}
            withoutHeader={true}
            columns={columns}
            data={allSmallholderCensusQuestionnaireData}
            customUtilities={customUtilities}
            // onAdd={() => {}}
            onEdit={props => {
              // console.log(props);
              window.location.href = `/lkm/smallholder-census/questionnare-data-input?questionnaireId=${smallholderCensusQuestionnaireByYear?._id}&localRegionId=${props.row.localRegionId}&smallholderId=${props.row.smallholderId}&year=${props.row.year}&dataId=${props.row._id}`;
            }}
            onRemove={async props => {
              // console.log(props);
              showLoadingSpinner();
              try {
                let yes = confirm(
                  `Are you sure to remove ${props.rows.length} item(s)?`,
                );
                if (yes) {
                  for (const row of props.rows) {
                    await deleteSmallholderCensusQuestionnaireData({
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
            }}
          />
        </div>
      ) : null}
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Questionnare);

const SMALLHOLDERS = gql`
  query listQueries($pageIndex: Int, $pageSize: Int, $filters: String) {
    countSmallholders(filters: $filters)
    allSmallholders(
      pageIndex: $pageIndex
      pageSize: $pageSize
      filters: $filters
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
  }
`;

const SmallholderPicker = ({ visible, onClose, onSelect }) => {
  const router = useRouter();

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

  const { data, loading, error, refetch } = useQuery(SMALLHOLDERS, {
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
      // console.log({ pageIndex, pageSize, filters });
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
    <FormModal title="Select Smallholder" size="lg" visible onClose={onClose}>
      <div className="pb-4 bg-white h-full">
        <TableAsync
          loading={loading}
          columns={columns}
          data={allSmallholders}
          withoutHeader={true}
          controlledFilters={filters}
          controlledPageIndex={pageIndex}
          controlledPageCount={pageCount}
          controlledPageSize={pageSize}
          onPageChange={handlePageChange}
          onRowClick={props => {
            // console.log("onRowClick", props.row);
            if (!onSelect) return;
            onSelect(props.row.original);
          }}
        />

        <div className="flex mt-4">
          <p className="text-md">Total Data: </p>
          <p className="text-md font-bold mx-4">{countSmallholders}</p>
        </div>
      </div>
    </FormModal>
  );
};
