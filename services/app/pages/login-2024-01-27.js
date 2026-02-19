import React, { useState, useEffect } from "react";
import Head from "next/head";
import appConfig from "../app.json";
import { withApollo } from "../libs/apollo";
import {
  showLoadingSpinner,
  hideLoadingSpinner,
  useNotification,
} from "../components/App";
import { handleError } from "../libs/errors";
import ms from "ms";
import redirect from "../libs/redirect";
import checkLoggedIn from "../libs/checkLoggedIn";
import cookie from "cookie";
import gql from "graphql-tag";
import firebaseConfig from "../firebaseConfig.json";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getMessaging, getToken, isSupported } from "firebase/messaging";
import Fingerprint2 from "fingerprintjs2";
import querystring from "query-string";
import { useMutation, useApolloClient, ApolloProvider } from "@apollo/client";
import localforage from "localforage";
import { useRouter } from "next/router";
import Link from "next/link";
import lodash from "lodash";

const CHECK_USER_PASSWORD = gql`
  mutation checkEmployeeIdAndPassword(
    $employeeId: String!
    $password: String!
  ) {
    checkEmployeeIdAndPassword(employeeId: $employeeId, password: $password)
  }
`;
const Page = props => {
  const router = useRouter();
  const client = useApolloClient();
  const [checkEmployeeIdAndPassword] = useMutation(CHECK_USER_PASSWORD);
  const notification = useNotification();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async e => {
    if (e) e.preventDefault();
    showLoadingSpinner();
    try {
      const result = await checkEmployeeIdAndPassword({
        variables: {
          employeeId: username,
          password,
        },
      });
      if (result.data.checkEmployeeIdAndPassword) {
        notification.addNotification({
          title: "Succeess!",
          message: `Redirecting...`,
          level: "success",
        });

        setTimeout(
          () =>
            router.replace({
              pathname: "/login-by-employee-id",
              query: {
                employeeID: result.data.checkEmployeeIdAndPassword,
              },
            }),
          1500,
        );
      }
    } catch (err) {
      notification.handleError(err);
    }
    hideLoadingSpinner();
  };
  return (
    <ApolloProvider client={client}>
      <div>
        <Head>
          <title>Login</title>
        </Head>
        <div className="flex items-center justify-center h-screen w-screen">
          <div className="flex flex-col justify-center w-full h-full md:w-2/5">
            <img
              className="self-center w-1/4 mb-12 text-center"
              src="/lkm/images/lkm-logo.png"
            />

            <div className="my-4 text-3xl font-black text-center">Sign In</div>

            <div className="px-32 pb-4">
              <input
                required
                className="py-3 bg-white form-control rounded-3xl"
                placeholder="Employee ID"
                type="text"
                value={username}
                onChange={e => {
                  if (e) e.preventDefault;
                  setUsername(e.target.value);
                }}
              />
            </div>

            <div className="px-32 pb-4">
              <input
                required
                className="py-3 bg-white form-control rounded-3xl"
                placeholder="Password"
                type="password"
                value={password}
                onChange={e => {
                  if (e) e.preventDefault;
                  setPassword(e.target.value);
                }}
              />
            </div>

            <div className="hidden px-32">
              <p className="text-sm font-bold text-right text-blue-500">
                Lupa Kata Sandi
              </p>
            </div>

            <div className="self-center mt-8 mb-2 text-center">
              <button
                className="px-20 py-2 text-lg font-bold text-white rounded-full shadow-md bg-matrix-500"
                onClick={handleSubmit}>
                <div className="flex items-center">
                  <img
                    className="self-center h-6 mr-2 text-center"
                    src="/lkm/images/login-icon-button.svg"
                  />
                  <p>Login</p>
                </div>
              </button>
            </div>

            <div className="my-4 text-sm text-center">
              Powered by ST Advisory
            </div>
          </div>
        </div>
      </div>
    </ApolloProvider>
  );
};

export default withApollo({ ssr: true })(Page);

Page.getInitialProps = async context => {
  // console.log("Process ENV", process.env.NODE_ENV)
  const { loggedInUser } = await checkLoggedIn(context.apolloClient);
  // console.log({ loggedInUser });

  if (loggedInUser.currentUser) {
    return redirect(
      context,
      `/lkm/dashboard?sidebarMenu=dashboard&appState=SEP`,
    );
  }
  // else if (typeof loggedInUser.currentUser === "undefined") {
  //   return { errorCode: 500 };
  // }

  return {};
};
