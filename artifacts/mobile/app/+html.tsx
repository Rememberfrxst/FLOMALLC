import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
        <title>FLOMA — Online Shopping for Fashion, Footwear &amp; Lifestyle</title>
        <meta
          name="description"
          content="Shop curated fashion, footwear, beauty, accessories and home lifestyle essentials on FLOMA."
        />
        <meta property="og:title" content="FLOMA — Curated Fashion &amp; Lifestyle" />
        <meta
          property="og:description"
          content="Discover trending collections, exclusive brand edits, and everyday offers on FLOMA."
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <ScrollViewStyleReset />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              html, body {
                background-color: #FFFFFF;
                color: #151515;
                font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                -webkit-font-smoothing: antialiased;
              }
              #root {
                display: flex;
                flex-direction: column;
                min-height: 100%;
              }
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
