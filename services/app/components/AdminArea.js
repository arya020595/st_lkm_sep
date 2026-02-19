import React, { Component, useCallback, useEffect, useState } from "react";
// import SidebarDemo from "./SidebarDemo";
import Sidebar from "./Sidebar";
import SidebarDemo from "./SidebarDemo";
import Head from "next/head";
import Error from "next/error";
import { useQuery, useMutation, useApolloClient } from "@apollo/client";
import gql from "graphql-tag";
import Link from "next/link";
import Header from "./Header";
import { withApollo } from "../libs/apollo";
import { AnimatePresence, motion } from "framer-motion";
import redirect from "../libs/redirect";
import { useLocalStorage } from "../libs/localStorage";
import dayjs from "dayjs";

const CURRENT_USER = gql`
  query currentUser {
    currentUser {
      _id
      employeeId
      email
      phone
      roleId

      Role {
        _id
        name
        privileges
      }
      LocalRegion {
        _id
        description
      }
    }
  }
`;

const AdminArea = ({ urlQuery, children, title }) => {
  const [latestLoadAdminArea, setLatestLoadAdminArea] = useLocalStorage(
    "latestLoadAdminArea",
    dayjs().toISOString(),
  );

  const { data, error, loading, refetch } = useQuery(CURRENT_USER);
  const [widthContent, setWidthContent] = useState({
    // contentLeft: "sm:w-1/5",
    // contentRight: "sm:w-4/5",
    contentLeft: "",
    contentRight: "",
  });

  let currentUser = {};
  if (data?.currentUser) {
    currentUser = data.currentUser;
  }

  const EXPIRED_ADMIN_AREA_TIME_IN_MINUTES = 15;
  const [elapsedTimeInSeconds, setElapsedTimeInSeconds] = useState(0);
  useEffect(() => {
    if (loading || error) return;
    if (!currentUser?._id) {
      // console.log("No Current User");
      window.location.href = "/lkm/logout";
    }

    // disable auto logout on dev...
    if (process.env.NODE_ENV !== "production") return;

    const diffInMinutes = dayjs().diff(latestLoadAdminArea, "minute");
    // console.log("AdminArea:", { latestLoadAdminArea, diffInMinutes });

    if (diffInMinutes >= EXPIRED_ADMIN_AREA_TIME_IN_MINUTES) {
      window.location.href = "/lkm/logout";
      return;
    }

    setLatestLoadAdminArea(dayjs().toISOString());
    setElapsedTimeInSeconds(EXPIRED_ADMIN_AREA_TIME_IN_MINUTES * 60);

    let timer = setInterval(() => {
      setElapsedTimeInSeconds(elapsedTimeInSeconds => {
        const newElapsedTimeInSeconds = Math.max(elapsedTimeInSeconds - 1, 0);
        if (newElapsedTimeInSeconds <= 0) {
          window.location.href = "/lkm/logout";
        }
        return newElapsedTimeInSeconds;
      });
    }, 970); // approx 1 seconds
    return () => {
      clearInterval(timer);
    };
  }, [currentUser?._id, loading, error]);

  useEffect(() => {
    // disable on dev...
    if (process.env.NODE_ENV !== "production") return;

    const handleWindowClick = () => {
      // console.log("handleWindowClick...");
      setLatestLoadAdminArea(dayjs().toISOString());
      setElapsedTimeInSeconds(EXPIRED_ADMIN_AREA_TIME_IN_MINUTES * 60);
    };
    window.addEventListener("click", handleWindowClick);
    return () => window.removeEventListener("click", handleWindowClick);
  }, []);

  const [menuVisible, setMenuVisible] = useState(false);
  // console.log({ menuVisible });

  useEffect(() => {
    // console.log({ menuVisible });
    if (menuVisible) {
      // document.body.style.position = "fixed";
      document.body.style["overflow-y"] = "hidden";
    }
    // else {
    //   // document.body.style.position = "static";
    //   document.body.style["overflow-y"] = "auto";
    // }

    return () => {
      document.body.style["overflow-y"] = "auto";
    };
  }, [menuVisible]);

  return (
    <div className="bg-white">
      <Header
        title={title}
        onClickOpenSidebar={e => {
          if (e) e.preventDefault();
          console.log("onClickOpenSidebar...");
          setMenuVisible(true);
        }}
      />
      <div className="w-full flex min-h-full z-20">
        <AnimatePresence>
          {menuVisible ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.1, delay: 0 }}
              className={`w-full md:hidden bg-white h-full fixed top-0 left-0 shadow-lg transition-all duration-40 z-20 overflow-y-scroll`}>
              <Sidebar
                onClose={e => {
                  if (e) e.preventDefault();
                  setMenuVisible(false);
                }}
                sidebarWidth={widthContent.contentLeft}
                urlQuery={urlQuery}
                currentUser={currentUser}
              />
            </motion.div>
          ) : null}
        </AnimatePresence>
        <div
          className={`hidden md:block ${widthContent.contentLeft} w-2/12 bg-white h-full sticky top-0 shadow-lg transition-all duration-40 z-20`}>
          <Sidebar
            sidebarWidth={widthContent.contentLeft}
            urlQuery={urlQuery}
            currentUser={currentUser}
          />
        </div>

        <div
          className={`${widthContent.contentRight} w-full md:w-10/12 h-full pl-4 md:pl-10 pr-4 md:pr-0`}>
          {children}

          {elapsedTimeInSeconds > 0 ? (
            <div className="px-4 py-4 text-sm text-right text-gray-400">
              You will be logged out automatically in {elapsedTimeInSeconds}{" "}
              seconds for no activity.
            </div>
          ) : (
            <div className="px-4 py-4 text-sm text-right text-gray-400">
              &nbsp;
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminArea;

export const useCurrentUser = () => {
  const { data, error, loading, refetch } = useQuery(CURRENT_USER);
  let currentUser = {};
  if (data?.currentUser) {
    currentUser = data.currentUser;
  }

  const currentUserDontHavePrivilege = useCallback(
    privileges => {
      if (!currentUser || !currentUser._id) {
        // console.log("Enter Here A");
        return true;
      } else if (currentUser.Role) {
        // console.log("Enter Here B");
        if (currentUser.Role._id.indexOf("__SUPER_USER__") > -1) {
          // console.log("Enter Here C");
          return false;
        }
        // console.log("Enter Here D");
        return !privileges.some(v => currentUser.Role.privileges.includes(v));
      } else if (
        currentUser.roles &&
        currentUser.roles.includes(`__SUPER_USER__${currentUser.PREFIX}`)
        // (currentUser.roles.includes("yongchun_root") ||
        //   currentUser.roles.includes("yongchun_superuser"))
      ) {
        // console.log("Enter Here E");
        return false;
      }
      // console.log("Enter Here F ");
      return true;
    },
    [currentUser],
  );

  return {
    currentUser,
    currentUserDontHavePrivilege,
  };
};
