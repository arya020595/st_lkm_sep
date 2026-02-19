import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/router";
import { withApollo } from "../libs/apollo";
import AdminArea from "../components/AdminArea";
import Head from "next/head";

import gql from "graphql-tag";
import { useMutation, useApolloClient, useQuery } from "@apollo/client";
import dayjs from "dayjs";
import { FormModal } from "../components/Modal";
import checkLoggedIn from "../libs/checkLoggedIn";

const Dashboard = () => {
  const router = useRouter();

  useEffect(() => {
    router.replace({
      pathname: "/dashboard",
      query: {
        ...router.query,
        // studentId: router.query?.studentId || allStudents[0]?._id || "",
      },
    });
  }, []);
  return (
    <AdminArea urlQuery={router.query}>
      <Head>
        <title>Dashboard</title>
      </Head>
      <div className="mt-28 h-screen flex justify-center">
        <iframe
          title="lkm-dashboard"
          width="100%"
          height="100%"
          src="https://app.powerbi.com/view?r=eyJrIjoiMDIxOGFkNTMtMjFhNi00ZTUxLTgxODYtZmVlYTBmNmQ2Zjc0IiwidCI6IjIxMGI0NTUzLWEwOTktNDYyMi05YTlhLTdjZWRkMjc3Mzk1NCIsImMiOjEwfQ%3D%3D"
          frameborder="0"
          allowFullScreen="true"></iframe>
        {/* <iframe
          title="LKM Dashboard"
          width="100%"
          height="100%"
          src="https://app.powerbi.com/view?r=eyJrIjoiMjAyNDA2NDctMDA2ZC00YWU5LTllYjktZTRjZmUyM2FiNDNiIiwidCI6IjNiNmFjMTJhLTgwMDAtNGYwZS1iYmMyLWYwNzhiNTY0NGFlNiIsImMiOjEwfQ%3D%3D&pageName=ReportSection"
          frameborder="0"
          allowFullScreen="true"
        /> */}
      </div>
    </AdminArea>
  );
};
export default withApollo({ ssr: true })(Dashboard);

// Dashboard.getInitialProps = async context => {
//   // console.log("Process ENV", process.env.NODE_ENV)
//   const { loggedInUser } = await checkLoggedIn(context.apolloClient);
//   // console.log({ loggedInUser });

//   if (loggedInUser.currentUser) {
//     // return  redirect(context, `/dashboard?sidebarMenu=dashboard&appState=SEP`);
//   } else if (typeof loggedInUser.currentUser === "undefined") {
//     return { errorCode: 500 };
//   }

//   return {};
// };
