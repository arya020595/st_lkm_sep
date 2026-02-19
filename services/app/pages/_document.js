import { Html, Head, Main, NextScript } from "next/document";
import appConfig from "../app.json";

export default function MyDocument() {
  const basePath = appConfig.basePath || "";
  const faviconUrl = `${basePath}${appConfig.favicon}${process.env.NODE_ENV !== "production" ? "?t=" + new Date().getTime() : ""}`;

  return (
    <Html>
      <Head>
        <meta name="theme-color" content="#2F80EC" />
        <link rel="shortcut icon" href={faviconUrl} type="image/x-icon" />
        <link rel="icon" href={faviconUrl} type="image/x-icon" />
        <link
          href={`${basePath}/fontawesome-free-5.12.1-web/css/all.min.css`}
          rel="stylesheet"
        />
        <link
          href={`${basePath}/css/react-multi-carousel.css`}
          rel="stylesheet"
        />
        <link
          href={`${basePath}/css/react-big-calendar.css`}
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link href={`${basePath}/css/nprogress.css`} rel="stylesheet" />
      </Head>
      <body>
        <Main />
        <NextScript />
        <script defer src={`${basePath}/js/mathlive.min.js`}></script>
      </body>
    </Html>
  );
}
