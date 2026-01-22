function getSpinnerHtml(ctx) {
  const themeParam = ctx.query.theme;
  const theme = themeParam === 'light' || themeParam === 'dark' ? themeParam : null;

  // If no theme param, we'll use CSS media query to detect browser preference
  const useSystemTheme = !theme;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Loading - Odysee</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      width: 100%;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      ${
        useSystemTheme
          ? `
      background-color: #0b0b0d;
      `
          : theme === 'dark'
          ? `
      background-color: #0b0b0d;
      `
          : `
      background-color: #f7f7f7;
      `
      }
    }

    ${
      useSystemTheme
        ? `
    @media (prefers-color-scheme: light) {
      body {
        background-color: #f7f7f7;
      }
    }
    `
        : ''
    }

    .spinner-container {
      position: relative;
      width: 120px;
      height: 120px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner-logo {
      position: absolute;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
    }

    .spinner-logo svg {
      width: 100%;
      height: 100%;
    }

    .spinner-ring {
      position: absolute;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      border: 3px solid transparent;
      border-top-color: #f24158;
      animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }
  </style>
</head>
<body>
  <div class="spinner-container">
    <div class="spinner-ring"></div>
    <div class="spinner-logo">
      <svg viewBox="0 0 103.1 103.1" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="37.15" y1="1.79" x2="79.91" y2="149.73" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#EF1970"/>
            <stop offset=".14" stop-color="#F23B5C"/>
            <stop offset=".45" stop-color="#F77D35"/>
            <stop offset=".7" stop-color="#FCAD18"/>
            <stop offset=".89" stop-color="#FECB07"/>
            <stop offset="1" stop-color="#FFD600"/>
          </linearGradient>
          <clipPath id="c">
            <circle cx="51.5" cy="51.5" r="51.5"/>
          </clipPath>
        </defs>
        <circle cx="51.5" cy="51.5" r="51.5" fill="url(#g)"/>
        <g clip-path="url(#c)">
          <path fill="#fff" d="M89.2,85.1c-1.3-5.8-3.1-10.9-6.1-18.5c-2-5.2-8.8-11.6-13.1-14.8c-1.6-1.2-1.7-3.4-0.3-4.9C74,42.9,81.6,35,84,30.8c1.6-2.9,4.7-8.5,4.9-13.3C89.2,14,88.7,9.9,84,8c-4.3-1.7-7.1,0.9-7.1,0.9c-3,2.1-3.9,7.7-6.1,13.3c-2.4,6.5-6.3,7.3-8.3,7.3c-1.9,0-0.7-2.1-5.4-15.6c-4.7-13.4-17-11-26.3-5.4c-11.8,7.1-6.6,22.1-3.6,31.9c-1.6,1.6-7.9,2.8-13.5,5.9c-3.5,1.9-6.5,3.1-9.5,5.5c-4.1,3.3-5.9,7-4.4,12.1c0.3,1.1,1.4,2.9,3.6,4.1c3.3,1.5,8.3-0.7,15.8-6.3c5.5-3.7,11.9-5.6,11.9-5.6s4.6,7,8.8,15.3c4.2,8.3-4.6,11-5.5,11c-1,0-14.8-1.3-11.6,10.4c3,11.6,19.9,7.5,28.5,1.8s6.5-24.2,6.5-24.2c8.4-1.3,11,7.6,11.8,12.1c0.8,4.5-1,12.4,7.5,12.6c1.2,0,2.4-0.2,3.5-0.5c4.6-1.1,7.2-3.4,8.3-5.8C89.4,87.6,89.5,86.3,89.2,85.1z M46.9,30.1c-8.6,3.2-12.7-1-13.2-8.8c-0.6-8.8,7.6-11,7.6-11c9.1-3,11.5,1.3,13.7,7.8C57,24.6,55.4,26.9,46.9,30.1z"/>
        </g>
      </svg>
    </div>
  </div>
</body>
</html>`;
}

module.exports = { getSpinnerHtml };
