import React, { useRef, useState, useEffect, useContext } from "react";
import NProgress from "nprogress";
import { useRouter } from "next/router";
import { NotificationProvider, NotificationContext } from "./Notification";
import { motion } from "framer-motion";

const LoadingSpinner = React.forwardRef(({ visible: initialVisible = false }, ref) => {
  const [visible, setVisible] = useState(initialVisible);

  React.useImperativeHandle(ref, () => ({
    show: () => setVisible(true),
    hide: () => setVisible(false)
  }));

  return (
    <div>
      <div
        className="loader-wrapper"
        style={{
          visibility: visible ? "visible" : "hidden",
          opacity: visible ? 1 : 0,
        }}
      >
        <div className="loader" />
      </div>
      <style jsx>{`
        .loader-wrapper {
          -webkit-transition: visibility 0s linear 200ms, opacity 200ms linear;
          transition: visibility 0s linear 200ms, opacity 200ms linear;

          opacity: 1;
          position: fixed;
          display: block;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(243, 243, 243, 0.4);
          z-index: 9997;
          cursor: pointer;
        }
        .loader {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          right: 0;
          margin: auto;
          border: 4px solid #ddd;
          border-top: 4px solid #0984e3;
          border-radius: 50%;
          width: 50px;
          height: 50px;
          animation: spin 0.6s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

let _loadingSpinner = null;

const App = ({ children }) => {
  const router = useRouter();
  const spinnerRef = useRef(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const handleStart = (url) => {
      console.log(`Loading: ${url}`);
      NProgress.start();
    };

    const handleComplete = () => NProgress.done();
    const handleError = () => NProgress.done();

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleError);

    setMounted(true);
    _loadingSpinner = spinnerRef.current;

    return () => {
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleError);
    };
  }, [router]);

  return (
    <NotificationProvider>
      <motion.div
        animate={mounted ? "visible" : "invisible"}
        initial="invisible"
        variants={{
          invisible: { opacity: 0 },
          visible: { opacity: 1 },
        }}
        transition={{ duration: 0.5, delay: 0 }}
        id="re-page-wrap"
      >
        {children}
        <LoadingSpinner visible={false} ref={spinnerRef} />
      </motion.div>
    </NotificationProvider>
  );
};

export default App;

export const useNotification = () => {
  return useContext(NotificationContext);
};

export const showLoadingSpinner = () => {
  if (!_loadingSpinner) return;
  _loadingSpinner.show();
};

export const hideLoadingSpinner = () => {
  if (!_loadingSpinner) return;
  _loadingSpinner.hide();
};
