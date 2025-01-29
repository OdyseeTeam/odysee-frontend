// @flow
// A housing for all of our icons. Mostly taken from https://github.com/feathericons/react-feather
import * as ICONS from 'constants/icons';
import React, { forwardRef } from 'react';
import { v4 as uuid } from 'uuid';

type IconProps = {
  size: number,
  color: string,
  title?: string,
};

type CustomProps = {
  size?: number,
  className?: string,
};

// Returns a react component
// Icons with tooltips need to use this function so the ref can be properly forwarded
const buildIcon = (iconStrokes: React$Node, customSvgValues = {}) =>
  forwardRef((props: IconProps, ref) => {
    const { size = 24, color = 'currentColor', title, ...otherProps } = props;
    return (
      <svg
        ref={ref}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...otherProps}
        {...customSvgValues}
      >
        {iconStrokes}
        {title && <title>{title}</title>}
      </svg>
    );
  });

export const icons = {
  [ICONS.ODYSEE_LOGO]: (props: IconProps) => (
    <svg
      {...props}
      id="Layer_1"
      strokeWidth="0"
      style={{ enableBackground: 'new 0 0 103.1 103.1' }}
      version="1.1"
      viewBox="0 0 103.1 103.1"
      x="0px"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      xmlSpace="preserve"
      y="0px"
    >
      <style type="text/css">{'.st0--odyseeLogo{fill:url(#SVGID_1_);}.st1--odyseeLogo{fill:#FFFFFF;}'}</style>
      <g>
        <linearGradient
          id="SVGID_1_"
          gradientUnits="userSpaceOnUse"
          x1="37.1511"
          y1="1.7925"
          x2="79.9092"
          y2="149.7319"
        >
          <stop offset="0" style={{ stopColor: '#EF1970' }} />
          <stop offset="0.1438" style={{ stopColor: '#F23B5C' }} />
          <stop offset="0.445" style={{ stopColor: '#F77D35' }} />
          <stop offset="0.6983" style={{ stopColor: '#FCAD18' }} />
          <stop offset="0.8909" style={{ stopColor: '#FECB07' }} />
          <stop offset="1" style={{ stopColor: '#FFD600' }} />
        </linearGradient>
        <path
          className="st0--odyseeLogo"
          d="M51.5,103.1L51.5,103.1C23.1,103.1,0,80,0,51.5v0C0,23.1,23.1,0,51.5,0h0c28.5,0,51.5,23.1,51.5,51.5v0C103.1,80,80,103.1,51.5,103.1z"
        />
        <g>
          <defs>
            <path
              id="SVGID_00000170984886341847456420000000262070696033326467_"
              d="M51.5,103.1L51.5,103.1C23.1,103.1,0,80,0,51.5v0C0,23.1,23.1,0,51.5,0h0c28.5,0,51.5,23.1,51.5,51.5v0C103.1,80,80,103.1,51.5,103.1z"
            />
          </defs>
          <clipPath id="SVGID_00000173159025839821803030000017583277320152650913_">
            <use
              xlinkHref="#SVGID_00000170984886341847456420000000262070696033326467_"
              style={{ overflow: 'visible' }}
            />
          </clipPath>
          <g style={{ clipPath: 'url(#SVGID_00000173159025839821803030000017583277320152650913_)' }}>
            <g>
              <g>
                <path
                  className="st1--odyseeLogo"
                  d="M8.7,40.1c0.5-0.3,0.6-0.9,0.3-1.3c-0.3-0.4-0.9-0.6-1.3-0.3c-0.4,0.3-0.6,0.9-0.3,1.3C7.7,40.3,8.3,40.5,8.7,40.1z M64.8,15c0.5-0.3,0.6-0.8,0.3-1.3c-0.3-0.4-0.9-0.6-1.3-0.3c-0.4,0.3-0.6,0.9-0.3,1.3C63.8,15.1,64.4,15.3,64.8,15z M76.7,51.4c-0.1,0.6,0.2,1.2,0.8,1.3c0.6,0.1,1.2-0.2,1.3-0.8c0.1-0.6-0.2-1.2-0.8-1.3C77.4,50.5,76.9,50.8,76.7,51.4z M60.9,88.2c-0.4-0.2-0.8,0.1-1,0.6c-0.1,0.5,0.2,0.9,0.6,1c0.5,0.1,0.9-0.2,1-0.6C61.7,88.7,61.4,88.3,60.9,88.2z M15.1,20.2c0.3,0.1,0.6-0.1,0.6-0.4c0.1-0.3-0.1-0.6-0.4-0.6c-0.3,0-0.6,0.1-0.6,0.4C14.6,19.9,14.8,20.2,15.1,20.2z M18.3,70.3c-0.4,0.1-0.7,0.4-0.6,0.8c0.1,0.4,0.4,0.7,0.8,0.6c0.4,0,0.6-0.4,0.6-0.8C19,70.5,18.7,70.2,18.3,70.3z M85.5,36l-0.6,2.6l-2.3,1.1l2.6,0.6l1.1,2.3l0.6-2.6l2.3-1.1l-2.6-0.6L85.5,36z M51.3,18.7c-0.6,0.2-0.8,0.8-0.6,1.4c0.5,1.2,0.5,1.8,0.3,3c-0.1,0.6,0.3,1.2,0.9,1.3c0.1,0,0.1,0,0.2,0c0.5,0,1-0.4,1-0.9c0.4-1.6,0.2-2.7-0.4-4.2C52.6,18.7,51.9,18.5,51.3,18.7z M50.8,14.4c-0.5-1-0.9-1.4-1-1.5c-0.4-0.4-1.1-0.4-1.5,0c-0.4,0.4-0.4,1.1,0,1.5c0,0,0.2,0.2,0.6,1c0.2,0.4,0.6,0.6,1,0.6c0.1,0,0.3,0,0.5-0.1C50.9,15.6,51.1,14.9,50.8,14.4zM89.2,85.1c-1.3-5.8-3.1-10.9-6.1-18.5c-2-5.2-8.8-11.6-13.1-14.8c-1.6-1.2-1.7-3.4-0.3-4.9C74,42.9,81.6,35,84,30.8c1.6-2.9,4.7-8.5,4.9-13.3C89.2,14,88.7,9.9,84,8c-4.3-1.7-7.1,0.9-7.1,0.9c-3,2.1-3.9,7.7-6.1,13.3c-2.4,6.5-6.3,7.3-8.3,7.3c-1.9,0-0.7-2.1-5.4-15.6c-4.7-13.4-17-11-26.3-5.4c-11.8,7.1-6.6,22.1-3.6,31.9c-1.6,1.6-7.9,2.8-13.5,5.9c-3.5,1.9-6.5,3.1-9.5,5.5c-4.1,3.3-5.9,7-4.4,12.1c0.3,1.1,1.4,2.9,3.6,4.1c3.3,1.5,8.3-0.7,15.8-6.3c5.5-3.7,11.9-5.6,11.9-5.6s4.6,7,8.8,15.3c4.2,8.3-4.6,11-5.5,11c-1,0-14.8-1.3-11.6,10.4c3,11.6,19.9,7.5,28.5,1.8s6.5-24.2,6.5-24.2c8.4-1.3,11,7.6,11.8,12.1c0.8,4.5-1,12.4,7.5,12.6c1.2,0,2.4-0.2,3.5-0.5c4.6-1.1,7.2-3.4,8.3-5.8C89.4,87.6,89.5,86.3,89.2,85.1z M46.9,30.1c-8.6,3.2-12.7-1-13.2-8.8c-0.6-8.8,7.6-11,7.6-11c9.1-3,11.5,1.3,13.7,7.8C57,24.6,55.4,26.9,46.9,30.1z"
                />
              </g>
            </g>
          </g>
        </g>
      </g>
    </svg>
  ),
  [ICONS.ODYSEE_WHITE_TEXT]: (props: IconProps) => (
    <svg
      {...props}
      data-name="Layer 1"
      id="Layer_1"
      strokeWidth="0"
      viewBox="0 0 397 119.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <style>
          {
            '.cls-1--whiteLogo{fill:#fff;}.cls-2--whiteLogo{fill:url(#linear-gradient);}.cls-3--whiteLogo{clip-path:url(#clip-path);}'
          }
        </style>
        <linearGradient id="linear-gradient" x1="45.6" y1="9.82" x2="88.36" y2="157.76" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef1970" />
          <stop offset="0.14" stopColor="#f23b5c" />
          <stop offset="0.45" stopColor="#f77d35" />
          <stop offset="0.7" stopColor="#fcad18" />
          <stop offset="0.89" stopColor="#fecb07" />
          <stop offset="1" stopColor="#ffd600" />
        </linearGradient>
        <clipPath id="clip-path">
          <rect x="8.45" y="8.03" width="103.05" height="103.05" rx="51.52" />
        </clipPath>
      </defs>
      <path
        className="cls-1--whiteLogo"
        d="M216,36.55A105.13,105.13,0,0,0,214.51,25c-.21-1.11-.45-2.47-.78-4.44s-.61-3.46-.83-4.51-.45-2-.68-2.85A5,5,0,0,0,211,10.74a4.62,4.62,0,0,0-1.61-1,6.27,6.27,0,0,0-2-.28c-.78,0-3.16,0-4.16,1.74-.39.67-.74,1.81-.74,5.57a14.41,14.41,0,0,0,.14,2.48l.14,1.12a40.39,40.39,0,0,0,.89,5.22,2.86,2.86,0,0,0,.12.35,11.3,11.3,0,0,0,.15,1.36,12.27,12.27,0,0,0,.56,2.47,6.14,6.14,0,0,1,.3,1.78c.48,5.45.35,6.88.3,7.28a1.07,1.07,0,0,1-.48.07c-1.4,0-15.06,4-18.61,6.36a22.12,22.12,0,0,0-7.78,8C176.52,56.48,176,74.82,176,75c-.09,4.22.64,6.82,2.27,8.14l.32.35a18.94,18.94,0,0,0,11.85,6.2,88.44,88.44,0,0,0,14.48.73c1.79,0,3.48,0,5.06,0h.3l7.36-2.4-.24-14C217.36,67.55,216.89,46.57,216,36.55ZM207.2,74.16c-.11.88-.2,1.55-.27,2a4.85,4.85,0,0,1-.28,1c-.07.17-.13.29-.14.33l-.24.1a2.82,2.82,0,0,1-.8.15c-.42,0-1,0-1.84,0a45.33,45.33,0,0,1-9.91-1.43,30.77,30.77,0,0,1-5.88-1.77h0c-.8-1.88,1.22-16,6.72-20.09s8.27-4.54,9.65-4.11c.38.12,1.54.48,2.33,3,.2,1,.41,7.6.52,11.15.08,2.47.14,4.51.19,5.14A22.23,22.23,0,0,1,207.2,74.16Z"
      />
      <path
        className="cls-1--whiteLogo"
        d="M251.17,34.44A8.26,8.26,0,0,0,248.7,38l0,.06a41,41,0,0,1-2.6,5.89,10.94,10.94,0,0,0-1.38,4.79A4.41,4.41,0,0,1,244.4,50a5.3,5.3,0,0,1-.55,1.17l-.44-.28a26.83,26.83,0,0,1-2.5-2.09c-1-1-2.35-2.29-4-4-7.07-7.19-11.28-9.75-14.07-8.62-1.59.65-2.4,2.31-2.4,4.94,0,1.63.85,3.69,2.61,6.27a96.53,96.53,0,0,0,7.64,9.36c5.21,5.9,8.73,7.54,10.36,8.23a21.38,21.38,0,0,1-.37,4.4,45.35,45.35,0,0,1-1.89,5.06,42,42,0,0,0-2.5,6.39,20.24,20.24,0,0,0-1.06,5.49c0,2.11.3,3.41,1,4.22a3.19,3.19,0,0,0,2.57,1.06,5.87,5.87,0,0,0,1.21-.13,7.75,7.75,0,0,0,3-1.1,5.46,5.46,0,0,0,2.12-2.15c.18-.34.58-1.13,1.19-2.37s1-2.08,1.24-2.56a25,25,0,0,0,1.92-5.43c.7-2.58,1.34-5.32,1.88-8.11s1.44-6,2.48-9.67,2-6.73,2.85-9.09c1.16-3.07,2-5.52,2.56-7.5a19.84,19.84,0,0,0,.88-5.21,5.07,5.07,0,0,0-1.35-3.85C257,32.86,253.27,32.86,251.17,34.44Z"
      />
      <path
        className="cls-1--whiteLogo"
        d="M296.7,35.06a3.39,3.39,0,0,0-1.31-.87A5.37,5.37,0,0,0,294,33.8c-.33,0-.87-.08-1.61-.12s-1.39-.06-2-.08-1.56,0-2.75,0c-6,0-10.18.83-12.84,2.55a17.31,17.31,0,0,0-7.18,8.16c-1.41,3.3-2.13,7.74-2.13,13.17l-.12,10.68,11,3.6c3.51,1.15,5.37,1.87,6.35,2.3a15.28,15.28,0,0,1-2.6.73,24.58,24.58,0,0,1-5.24.57,38,38,0,0,0-4.87.21A4.88,4.88,0,0,0,267,76.75a4,4,0,0,0-1,2.93A5.37,5.37,0,0,0,268.22,84a11.22,11.22,0,0,0,4.94,2,26.55,26.55,0,0,0,4.73.4l1.2,0a25.46,25.46,0,0,0,6.49-1.14,20.68,20.68,0,0,0,5.84-2.8,13.33,13.33,0,0,0,3.76-3.92,10.08,10.08,0,0,0,1.06-5,9,9,0,0,0-3.14-7.37c-1.87-1.5-5.33-3-10.56-4.44-5.54-1.67-6.51-2.49-6.7-2.71s-.7-1.29.68-4.65a23.14,23.14,0,0,1,5.14-7.64c2.55-2.54,3.78-3.27,4.28-3.48s1.66-.46,4.33-.08c1,.15,1.77.25,2.27.3a9.47,9.47,0,0,0,1.76,0,4.44,4.44,0,0,0,1.61-.37,2.83,2.83,0,0,0,1.24-1.33,4,4,0,0,0,.42-1.58c0-.35,0-.87,0-1.57V37.65a4,4,0,0,0-.26-1.4A3.59,3.59,0,0,0,296.7,35.06Z"
      />
      <path
        className="cls-1--whiteLogo"
        d="M341.77,41.73a8.9,8.9,0,0,0-1-1.91,13,13,0,0,0-1.64-2l-1.61-1.68a19.65,19.65,0,0,0-5.45-4.2,16.56,16.56,0,0,0-6.49-1,19.81,19.81,0,0,0-11.31,3.24h0a30.8,30.8,0,0,0-6.52,5.73,17.93,17.93,0,0,0-3.4,6.7,45.67,45.67,0,0,0-1.29,9.6c-.57,10.37,1.22,18.06,5.31,22.88,3.78,4.44,9.71,6.69,17.69,6.69.81,0,1.64,0,2.49-.07l3.38-.25a21.33,21.33,0,0,0,2.43-.32,7.45,7.45,0,0,0,2-.56,3.81,3.81,0,0,0,1.33-1.14,3.5,3.5,0,0,0,.74-1.75,14.71,14.71,0,0,0,.07-1.59c0-1.39-.17-3.34-1.63-4.21-.67-.39-1.77-.68-5.28-.24a16.13,16.13,0,0,1-9-1.7,13.27,13.27,0,0,1-6.38-5.67l-.84-1.58,5.84-.64a34.24,34.24,0,0,0,8-1.56,27.41,27.41,0,0,0,6.56-3.33c1.4-1,2.42-1.75,3.07-2.31a8.54,8.54,0,0,0,2-2.56,9.49,9.49,0,0,0,1.05-3.07c.13-.87.26-2.23.37-4.08q.12-1.87.12-3a18.62,18.62,0,0,0-.15-2.37A11.51,11.51,0,0,0,341.77,41.73ZM316.33,53.11l-1.68-1.74,4.24-4.11A32,32,0,0,1,323,43.63a20.31,20.31,0,0,1,2-1.27,5,5,0,0,1,1.52.92,18.22,18.22,0,0,1,2.93,2.8l2.54,3-2.26,2a14.46,14.46,0,0,1-3.48,2.14,17.43,17.43,0,0,1-4,1.4,9.45,9.45,0,0,1-3.66.14A5.19,5.19,0,0,1,316.33,53.11Z"
      />
      <path
        className="cls-1--whiteLogo"
        d="M387.35,46.9a10.38,10.38,0,0,0-.43-2,7.76,7.76,0,0,0-1-1.92,12.53,12.53,0,0,0-1.42-1.8l-1.82-1.91a19.86,19.86,0,0,0-5.46-4.2,16.66,16.66,0,0,0-6.48-1,19.84,19.84,0,0,0-11.32,3.24h0A31.34,31.34,0,0,0,352.91,43a18.23,18.23,0,0,0-3.4,6.7,45.1,45.1,0,0,0-1.28,9.6c-.57,10.37,1.21,18.07,5.31,22.88,3.77,4.44,9.71,6.69,17.68,6.69.81,0,1.64,0,2.49-.07l3.39-.25a19.3,19.3,0,0,0,2.43-.32,7.71,7.71,0,0,0,2-.55,3.82,3.82,0,0,0,1.34-1.14,3.54,3.54,0,0,0,.74-1.76,14.71,14.71,0,0,0,.07-1.59c0-1.39-.17-3.34-1.64-4.21-.67-.39-1.77-.68-5.27-.24a16.09,16.09,0,0,1-9-1.7,13.29,13.29,0,0,1-6.37-5.67l-.85-1.57,5.85-.65a34.15,34.15,0,0,0,8-1.56,27.23,27.23,0,0,0,6.56-3.33c1.4-1,2.43-1.75,3.07-2.3a8.82,8.82,0,0,0,2-2.56,9.87,9.87,0,0,0,1-3.08c.13-.87.26-2.23.37-4.08.08-1.25.11-2.24.11-3A18.62,18.62,0,0,0,387.35,46.9Zm-25.86,9.34-1.68-1.74L364,50.39a33.45,33.45,0,0,1,4.15-3.63,18.65,18.65,0,0,1,2-1.26,5,5,0,0,1,1.52.91,18.17,18.17,0,0,1,2.92,2.8l2.55,3-2.27,2a15.16,15.16,0,0,1-3.47,2.14,17.83,17.83,0,0,1-4,1.39,9.23,9.23,0,0,1-3.66.14A5.08,5.08,0,0,1,361.49,56.24Z"
      />
      <path
        className="cls-1--whiteLogo"
        d="M135.65,41.29a21.51,21.51,0,0,1,5.44-1,82,82,0,0,1,8.25-.4c4.56,0,7.65.16,9.28.62A14.23,14.23,0,0,1,164.13,44a16.32,16.32,0,0,1,3.68,5.32,31.66,31.66,0,0,1,1.73,8.12,48.43,48.43,0,0,1-.46,15.29q-1.43,7.38-4.3,9a60,60,0,0,0-7.43,5.2,13.3,13.3,0,0,1-5,2.69,22.19,22.19,0,0,1-6.71-.09,23.84,23.84,0,0,1-7.13-2.26A28.75,28.75,0,0,1,132,82.05q-1.89-1.86-2.7-2.7a14.72,14.72,0,0,1-1.73-2.23A11.59,11.59,0,0,1,126.4,75a15.75,15.75,0,0,1-.56-2.61,22.94,22.94,0,0,1-.29-3.4V64.15Q125.55,45.13,135.65,41.29Zm20,8.79q-4.53-4.3-5.66-4.3c-1.62,0-3.68,1-6.19,2.83a25.06,25.06,0,0,0-6.07,6.2q-3.8,5.53-3.42,10t5.1,9.61l5.23,5.67,6.41-2.93A17.64,17.64,0,0,0,159.5,70a14.09,14.09,0,0,0,1.71-10A18.78,18.78,0,0,0,155.67,50.08Z"
      />
      <rect className="cls-2--whiteLogo" x="8.45" y="8.03" width="103.05" height="103.05" rx="51.52" />
      <g className="cls-3--whiteLogo">
        <path
          className="cls-1--whiteLogo"
          d="M17.12,48.17a.9.9,0,0,0,.31-1.31,1,1,0,0,0-1.32-.3,1,1,0,0,0,1,1.61ZM73.24,23a.88.88,0,0,0,.3-1.32,1,1,0,0,0-1.31-.3,1,1,0,0,0-.3,1.31A1,1,0,0,0,73.24,23ZM85.17,59.4a1.09,1.09,0,1,0,1.32-.81A1.13,1.13,0,0,0,85.17,59.4ZM69.4,96.2c-.41-.2-.81.1-1,.61a.83.83,0,1,0,1-.61Zm-45.89-68a.51.51,0,1,0,.2-1c-.3,0-.61.1-.61.4A.45.45,0,0,0,23.51,28.19Zm3.22,50.12c-.41.1-.71.4-.61.81a.69.69,0,0,0,.81.6c.4,0,.61-.4.61-.81A.69.69,0,0,0,26.73,78.31ZM94,44l-.61,2.63L91,47.77l2.62.61,1.12,2.32.6-2.63L97.71,47l-2.63-.61ZM59.79,26.74a1,1,0,0,0-.6,1.41,4.59,4.59,0,0,1,.3,3,1.14,1.14,0,0,0,.91,1.31h.2a1,1,0,0,0,1-.91,6.14,6.14,0,0,0-.4-4.24A1,1,0,0,0,59.79,26.74Zm-.5-4.35a6,6,0,0,0-1-1.52,1.11,1.11,0,0,0-1.52,0,1.09,1.09,0,0,0,0,1.52,4.6,4.6,0,0,1,.61,1,1.18,1.18,0,0,0,1.51.51A1.15,1.15,0,0,0,59.29,22.39ZM97.66,93.14a128,128,0,0,0-6-18.49C89.59,69.43,82.85,63,78.5,59.8A3.16,3.16,0,0,1,78.19,55C82.44,50.9,90,43,92.45,38.87c1.6-2.92,4.75-8.46,4.89-13.26.31-3.57-.18-7.7-4.91-9.59a6.9,6.9,0,0,0-7.14.92c-3,2.06-4,7.7-6.07,13.32-2.44,6.48-6.28,7.3-8.31,7.3s-.7-2.14-5.35-15.59-17-11-26.29-5.44c-11.83,7.07-6.58,22.14-3.64,31.85C34,50,27.74,51.21,22.08,54.24c-3.52,1.89-6.53,3.11-9.47,5.47-4.09,3.29-5.86,7-4.44,12.06a7.22,7.22,0,0,0,3.58,4.09c3.34,1.52,8.26-.69,15.79-6.35A46.19,46.19,0,0,1,39.47,64s4.55,7,8.8,15.27-4.56,11-5.47,11S28,88.92,31.18,100.65s19.92,7.48,28.51,1.82,6.47-24.16,6.47-24.16C74.55,77,77.18,85.89,78,90.44s-1,12.44,7.48,12.64a13.28,13.28,0,0,0,3.54-.51c4.58-1.06,7.23-3.36,8.32-5.81A5.84,5.84,0,0,0,97.66,93.14Zm-42.32-55c-8.59,3.24-12.74-1-13.24-8.79-.61-8.8,7.58-11,7.58-11,9.1-3,11.53,1.31,13.65,7.78S63.84,34.93,55.34,38.16Z"
        />
      </g>
    </svg>
  ),
  [ICONS.ODYSEE_DARK_TEXT]: (props: IconProps) => (
    <svg
      {...props}
      data-name="Layer 1"
      id="Layer_1"
      strokeWidth="0"
      viewBox="0 0 397 119.1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
    >
      <defs>
        <style>
          {
            '.cls-1--darkLogo{fill:none;}.cls-2--darkLogo{fill:url(#linear-gradient);}.cls-3--darkLogo{clip-path:url(#clip-path);}.cls-4--darkLogo{fill:#fff;}'
          }
        </style>
        <linearGradient id="linear-gradient" x1="45.6" y1="9.82" x2="88.36" y2="157.76" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ef1970" />
          <stop offset="0.14" stopColor="#f23b5c" />
          <stop offset="0.45" stopColor="#f77d35" />
          <stop offset="0.7" stopColor="#fcad18" />
          <stop offset="0.89" stopColor="#fecb07" />
          <stop offset="1" stopColor="#ffd600" />
        </linearGradient>
        <clipPath id="clip-path">
          <rect className="cls-1--darkLogo" x="8.45" y="8.03" width="103.05" height="103.05" rx="51.52" />
        </clipPath>
      </defs>
      <path d="M216,36.55A105.13,105.13,0,0,0,214.51,25c-.21-1.11-.45-2.47-.78-4.44s-.61-3.46-.83-4.51-.45-2-.68-2.85A5,5,0,0,0,211,10.74a4.62,4.62,0,0,0-1.61-1,6.27,6.27,0,0,0-2-.28c-.78,0-3.16,0-4.16,1.74-.39.67-.74,1.81-.74,5.57a14.41,14.41,0,0,0,.14,2.48l.14,1.12a40.39,40.39,0,0,0,.89,5.22,2.86,2.86,0,0,0,.12.35,11.3,11.3,0,0,0,.15,1.36,12.27,12.27,0,0,0,.56,2.47,6.14,6.14,0,0,1,.3,1.78c.48,5.45.35,6.88.3,7.28a1.07,1.07,0,0,1-.48.07c-1.4,0-15.06,4-18.61,6.36a22.12,22.12,0,0,0-7.78,8C176.52,56.48,176,74.82,176,75c-.09,4.22.64,6.82,2.27,8.14l.32.35a18.94,18.94,0,0,0,11.85,6.2,88.44,88.44,0,0,0,14.48.73c1.79,0,3.48,0,5.06,0h.3l7.36-2.4-.24-14C217.36,67.55,216.89,46.57,216,36.55ZM207.2,74.16c-.11.88-.2,1.55-.27,2a4.85,4.85,0,0,1-.28,1c-.07.17-.13.29-.14.33l-.24.1a2.82,2.82,0,0,1-.8.15c-.42,0-1,0-1.84,0a45.33,45.33,0,0,1-9.91-1.43,30.77,30.77,0,0,1-5.88-1.77h0c-.8-1.88,1.22-16,6.72-20.09s8.27-4.54,9.65-4.11c.38.12,1.54.48,2.33,3,.2,1,.41,7.6.52,11.15.08,2.47.14,4.51.19,5.14A22.23,22.23,0,0,1,207.2,74.16Z" />
      <path d="M251.17,34.44A8.26,8.26,0,0,0,248.7,38l0,.06a41,41,0,0,1-2.6,5.89,10.94,10.94,0,0,0-1.38,4.79A4.41,4.41,0,0,1,244.4,50a5.3,5.3,0,0,1-.55,1.17l-.44-.28a26.83,26.83,0,0,1-2.5-2.09c-1-1-2.35-2.29-4-4-7.07-7.19-11.28-9.75-14.07-8.62-1.59.65-2.4,2.31-2.4,4.94,0,1.63.85,3.69,2.61,6.27a96.53,96.53,0,0,0,7.64,9.36c5.21,5.9,8.73,7.54,10.36,8.23a21.38,21.38,0,0,1-.37,4.4,45.35,45.35,0,0,1-1.89,5.06,42,42,0,0,0-2.5,6.39,20.24,20.24,0,0,0-1.06,5.49c0,2.11.3,3.41,1,4.22a3.19,3.19,0,0,0,2.57,1.06,5.87,5.87,0,0,0,1.21-.13,7.75,7.75,0,0,0,3-1.1,5.46,5.46,0,0,0,2.12-2.15c.18-.34.58-1.13,1.19-2.37s1-2.08,1.24-2.56a25,25,0,0,0,1.92-5.43c.7-2.58,1.34-5.32,1.88-8.11s1.44-6,2.48-9.67,2-6.73,2.85-9.09c1.16-3.07,2-5.52,2.56-7.5a19.84,19.84,0,0,0,.88-5.21,5.07,5.07,0,0,0-1.35-3.85C257,32.86,253.27,32.86,251.17,34.44Z" />
      <path d="M296.7,35.06a3.39,3.39,0,0,0-1.31-.87A5.37,5.37,0,0,0,294,33.8c-.33,0-.87-.08-1.61-.12s-1.39-.06-2-.08-1.56,0-2.75,0c-6,0-10.18.83-12.84,2.55a17.31,17.31,0,0,0-7.18,8.16c-1.41,3.3-2.13,7.74-2.13,13.17l-.12,10.68,11,3.6c3.51,1.15,5.37,1.87,6.35,2.3a15.28,15.28,0,0,1-2.6.73,24.58,24.58,0,0,1-5.24.57,38,38,0,0,0-4.87.21A4.88,4.88,0,0,0,267,76.75a4,4,0,0,0-1,2.93A5.37,5.37,0,0,0,268.22,84a11.22,11.22,0,0,0,4.94,2,26.55,26.55,0,0,0,4.73.4l1.2,0a25.46,25.46,0,0,0,6.49-1.14,20.68,20.68,0,0,0,5.84-2.8,13.33,13.33,0,0,0,3.76-3.92,10.08,10.08,0,0,0,1.06-5,9,9,0,0,0-3.14-7.37c-1.87-1.5-5.33-3-10.56-4.44-5.54-1.67-6.51-2.49-6.7-2.71s-.7-1.29.68-4.65a23.14,23.14,0,0,1,5.14-7.64c2.55-2.54,3.78-3.27,4.28-3.48s1.66-.46,4.33-.08c1,.15,1.77.25,2.27.3a9.47,9.47,0,0,0,1.76,0,4.44,4.44,0,0,0,1.61-.37,2.83,2.83,0,0,0,1.24-1.33,4,4,0,0,0,.42-1.58c0-.35,0-.87,0-1.57V37.65a4,4,0,0,0-.26-1.4A3.59,3.59,0,0,0,296.7,35.06Z" />
      <path d="M341.77,41.73a8.9,8.9,0,0,0-1-1.91,13,13,0,0,0-1.64-2l-1.61-1.68a19.65,19.65,0,0,0-5.45-4.2,16.56,16.56,0,0,0-6.49-1,19.81,19.81,0,0,0-11.31,3.24h0a30.8,30.8,0,0,0-6.52,5.73,17.93,17.93,0,0,0-3.4,6.7,45.67,45.67,0,0,0-1.29,9.6c-.57,10.37,1.22,18.06,5.31,22.88,3.78,4.44,9.71,6.69,17.69,6.69.81,0,1.64,0,2.49-.07l3.38-.25a21.33,21.33,0,0,0,2.43-.32,7.45,7.45,0,0,0,2-.56,3.81,3.81,0,0,0,1.33-1.14,3.5,3.5,0,0,0,.74-1.75,14.71,14.71,0,0,0,.07-1.59c0-1.39-.17-3.34-1.63-4.21-.67-.39-1.77-.68-5.28-.24a16.13,16.13,0,0,1-9-1.7,13.27,13.27,0,0,1-6.38-5.67l-.84-1.58,5.84-.64a34.24,34.24,0,0,0,8-1.56,27.41,27.41,0,0,0,6.56-3.33c1.4-1,2.42-1.75,3.07-2.31a8.54,8.54,0,0,0,2-2.56,9.49,9.49,0,0,0,1.05-3.07c.13-.87.26-2.23.37-4.08q.12-1.87.12-3a18.62,18.62,0,0,0-.15-2.37A11.51,11.51,0,0,0,341.77,41.73ZM316.33,53.11l-1.68-1.74,4.24-4.11A32,32,0,0,1,323,43.63a20.31,20.31,0,0,1,2-1.27,5,5,0,0,1,1.52.92,18.22,18.22,0,0,1,2.93,2.8l2.54,3-2.26,2a14.46,14.46,0,0,1-3.48,2.14,17.43,17.43,0,0,1-4,1.4,9.45,9.45,0,0,1-3.66.14A5.19,5.19,0,0,1,316.33,53.11Z" />
      <path d="M387.35,46.9a10.38,10.38,0,0,0-.43-2,7.76,7.76,0,0,0-1-1.92,12.53,12.53,0,0,0-1.42-1.8l-1.82-1.91a19.86,19.86,0,0,0-5.46-4.2,16.66,16.66,0,0,0-6.48-1,19.84,19.84,0,0,0-11.32,3.24h0A31.34,31.34,0,0,0,352.91,43a18.23,18.23,0,0,0-3.4,6.7,45.1,45.1,0,0,0-1.28,9.6c-.57,10.37,1.21,18.07,5.31,22.88,3.77,4.44,9.71,6.69,17.68,6.69.81,0,1.64,0,2.49-.07l3.39-.25a19.3,19.3,0,0,0,2.43-.32,7.71,7.71,0,0,0,2-.55,3.82,3.82,0,0,0,1.34-1.14,3.54,3.54,0,0,0,.74-1.76,14.71,14.71,0,0,0,.07-1.59c0-1.39-.17-3.34-1.64-4.21-.67-.39-1.77-.68-5.27-.24a16.09,16.09,0,0,1-9-1.7,13.29,13.29,0,0,1-6.37-5.67l-.85-1.57,5.85-.65a34.15,34.15,0,0,0,8-1.56,27.23,27.23,0,0,0,6.56-3.33c1.4-1,2.43-1.75,3.07-2.3a8.82,8.82,0,0,0,2-2.56,9.87,9.87,0,0,0,1-3.08c.13-.87.26-2.23.37-4.08.08-1.25.11-2.24.11-3A18.62,18.62,0,0,0,387.35,46.9Zm-25.86,9.34-1.68-1.74L364,50.39a33.45,33.45,0,0,1,4.15-3.63,18.65,18.65,0,0,1,2-1.26,5,5,0,0,1,1.52.91,18.17,18.17,0,0,1,2.92,2.8l2.55,3-2.27,2a15.16,15.16,0,0,1-3.47,2.14,17.83,17.83,0,0,1-4,1.39,9.23,9.23,0,0,1-3.66.14A5.08,5.08,0,0,1,361.49,56.24Z" />
      <path d="M135.65,41.29a21.51,21.51,0,0,1,5.44-1,82,82,0,0,1,8.25-.4c4.56,0,7.65.16,9.28.62A14.23,14.23,0,0,1,164.13,44a16.32,16.32,0,0,1,3.68,5.32,31.66,31.66,0,0,1,1.73,8.12,48.43,48.43,0,0,1-.46,15.29q-1.43,7.38-4.3,9a60,60,0,0,0-7.43,5.2,13.3,13.3,0,0,1-5,2.69,22.19,22.19,0,0,1-6.71-.09,23.84,23.84,0,0,1-7.13-2.26A28.75,28.75,0,0,1,132,82.05q-1.89-1.86-2.7-2.7a14.72,14.72,0,0,1-1.73-2.23A11.59,11.59,0,0,1,126.4,75a15.75,15.75,0,0,1-.56-2.61,22.94,22.94,0,0,1-.29-3.4V64.15Q125.55,45.13,135.65,41.29Zm20,8.79q-4.53-4.3-5.66-4.3c-1.62,0-3.68,1-6.19,2.83a25.06,25.06,0,0,0-6.07,6.2q-3.8,5.53-3.42,10t5.1,9.61l5.23,5.67,6.41-2.93A17.64,17.64,0,0,0,159.5,70a14.09,14.09,0,0,0,1.71-10A18.78,18.78,0,0,0,155.67,50.08Z" />
      <rect className="cls-2--darkLogo" x="8.45" y="8.03" width="103.05" height="103.05" rx="51.52" />
      <g className="cls-3--darkLogo">
        <path
          className="cls-4--darkLogo"
          d="M17.12,48.17a.9.9,0,0,0,.31-1.31,1,1,0,0,0-1.32-.3,1,1,0,0,0,1,1.61ZM73.24,23a.88.88,0,0,0,.3-1.32,1,1,0,0,0-1.31-.3,1,1,0,0,0-.3,1.31A1,1,0,0,0,73.24,23ZM85.17,59.4a1.09,1.09,0,1,0,1.32-.81A1.13,1.13,0,0,0,85.17,59.4ZM69.4,96.2c-.41-.2-.81.1-1,.61a.83.83,0,1,0,1-.61Zm-45.89-68a.51.51,0,1,0,.2-1c-.3,0-.61.1-.61.4A.45.45,0,0,0,23.51,28.19Zm3.22,50.12c-.41.1-.71.4-.61.81a.69.69,0,0,0,.81.6c.4,0,.61-.4.61-.81A.69.69,0,0,0,26.73,78.31ZM94,44l-.61,2.63L91,47.77l2.62.61,1.12,2.32.6-2.63L97.71,47l-2.63-.61ZM59.29,22.39a6,6,0,0,0-1-1.52,1.11,1.11,0,0,0-1.52,0,1.09,1.09,0,0,0,0,1.52,4.6,4.6,0,0,1,.61,1,1.18,1.18,0,0,0,1.51.51A1.15,1.15,0,0,0,59.29,22.39Zm.5,4.35a1,1,0,0,0-.6,1.41,4.59,4.59,0,0,1,.3,3,1.14,1.14,0,0,0,.91,1.31h.2a1,1,0,0,0,1-.91,6.14,6.14,0,0,0-.4-4.24A1,1,0,0,0,59.79,26.74Zm37.87,66.4a128,128,0,0,0-6-18.49C89.59,69.43,82.85,63,78.5,59.8A3.16,3.16,0,0,1,78.19,55C82.44,50.9,90,43,92.45,38.87c1.6-2.92,4.75-8.46,4.89-13.26.31-3.57-.18-7.7-4.91-9.59a6.9,6.9,0,0,0-7.14.92c-3,2.06-4,7.7-6.07,13.32-2.44,6.48-6.28,7.3-8.31,7.3s-.7-2.14-5.35-15.59-17-11-26.29-5.44c-11.83,7.07-6.58,22.14-3.64,31.85C34,50,27.74,51.21,22.08,54.24c-3.52,1.89-6.53,3.11-9.47,5.47-4.09,3.29-5.86,7-4.44,12.06a7.22,7.22,0,0,0,3.58,4.09c3.34,1.52,8.26-.69,15.79-6.35A46.19,46.19,0,0,1,39.47,64s4.55,7,8.8,15.27-4.56,11-5.47,11S28,88.92,31.18,100.65s19.92,7.48,28.51,1.82,6.47-24.16,6.47-24.16C74.55,77,77.18,85.89,78,90.44s-1,12.44,7.48,12.64a13.28,13.28,0,0,0,3.54-.51c4.58-1.06,7.23-3.36,8.32-5.81A5.84,5.84,0,0,0,97.66,93.14Zm-42.32-55c-8.59,3.24-12.74-1-13.24-8.79-.61-8.8,7.58-11,7.58-11,9.1-3,11.53,1.31,13.65,7.78S63.84,34.93,55.34,38.16Z"
        />
      </g>
    </svg>
  ),
  [ICONS.USDC]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...rest } = props;
    return (
      <svg
        width={size}
        height={size}
        data-name="86977684-12db-4850-8f30-233a7c267d11"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 2000 2000"
      >
        <path
          d="M1000 2000c554.17 0 1000-445.83 1000-1000S1554.17 0 1000 0 0 445.83 0 1000s445.83 1000 1000 1000z"
          fill="#2775ca"
        />
        <path
          d="M1275 1158.33c0-145.83-87.5-195.83-262.5-216.66-125-16.67-150-50-150-108.34s41.67-95.83 125-95.83c75 0 116.67 25 137.5 87.5 4.17 12.5 16.67 20.83 29.17 20.83h66.66c16.67 0 29.17-12.5 29.17-29.16v-4.17c-16.67-91.67-91.67-162.5-187.5-170.83v-100c0-16.67-12.5-29.17-33.33-33.34h-62.5c-16.67 0-29.17 12.5-33.34 33.34v95.83c-125 16.67-204.16 100-204.16 204.17 0 137.5 83.33 191.66 258.33 212.5 116.67 20.83 154.17 45.83 154.17 112.5s-58.34 112.5-137.5 112.5c-108.34 0-145.84-45.84-158.34-108.34-4.16-16.66-16.66-25-29.16-25h-70.84c-16.66 0-29.16 12.5-29.16 29.17v4.17c16.66 104.16 83.33 179.16 220.83 200v100c0 16.66 12.5 29.16 33.33 33.33h62.5c16.67 0 29.17-12.5 33.34-33.33v-100c125-20.84 208.33-108.34 208.33-220.84z"
          fill="#fff"
        />
        <path
          d="M787.5 1595.83c-325-116.66-491.67-479.16-370.83-800 62.5-175 200-308.33 370.83-370.83 16.67-8.33 25-20.83 25-41.67V325c0-16.67-8.33-29.17-25-33.33-4.17 0-12.5 0-16.67 4.16-395.83 125-612.5 545.84-487.5 941.67 75 233.33 254.17 412.5 487.5 487.5 16.67 8.33 33.34 0 37.5-16.67 4.17-4.16 4.17-8.33 4.17-16.66v-58.34c0-12.5-12.5-29.16-25-37.5zM1229.17 295.83c-16.67-8.33-33.34 0-37.5 16.67-4.17 4.17-4.17 8.33-4.17 16.67v58.33c0 16.67 12.5 33.33 25 41.67 325 116.66 491.67 479.16 370.83 800-62.5 175-200 308.33-370.83 370.83-16.67 8.33-25 20.83-25 41.67V1700c0 16.67 8.33 29.17 25 33.33 4.17 0 12.5 0 16.67-4.16 395.83-125 612.5-545.84 487.5-941.67-75-237.5-258.34-416.67-487.5-491.67z"
          fill="#fff"
        />
      </svg>
    );
  },
  [ICONS.BNB]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...rest } = props;

    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" fill="url(#pattern0_714_25)" />
        <defs>
          <pattern id="pattern0_714_25" patternContentUnits="objectBoundingBox" width="1" height="1">
            <use xlinkHref="#image0_714_25" transform="scale(0.00416667)" />
          </pattern>
          <image
            id="image0_714_25"
            width="240"
            height="240"
            xlinkHref="data:image/png;base64,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"
          />
        </defs>
      </svg>
    );
  },
  [ICONS.BASE]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...rest } = props;

    return (
      <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" fill="url(#pattern0_714_28)" />
        <defs>
          <pattern id="pattern0_714_28" patternContentUnits="objectBoundingBox" width="1" height="1">
            <use xlinkHref="#image0_714_28" transform="scale(0.00390625)" />
          </pattern>
          <image
            id="image0_714_28"
            width="256"
            height="256"
            xlinkHref="data:image/png;base64,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"
          />
        </defs>
      </svg>
    );
  },
  [ICONS.LBC]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...rest } = props;
    const randomId = uuid();

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        // fill={color}
        fill="black"
        stroke={color}
        strokeWidth="0"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        <path d="M1.03125 14.1562V9.84375L12 0L22.9688 9.84375V14.1562L12 24L1.03125 14.1562Z" />
        <path d="M8.925 10.3688L3.99375 14.8125L7.70625 18.15L12.6375 13.7063L8.925 10.3688Z" />
        <path d="M8.925 10.3688L15.1312 4.80005L12 1.98755L2.60625 10.425V13.575L3.99375 14.8125L8.925 10.3688Z" />
        <path
          d="M8.925 10.3688L3.99375 14.8125L7.70625 18.15L12.6375 13.7063L8.925 10.3688Z"
          fill={`url(#paint0_linear${randomId})`}
        />
        <path
          d="M8.925 10.3688L15.1312 4.80005L12 1.98755L2.60625 10.425V13.575L3.99375 14.8125L8.925 10.3688Z"
          fill={`url(#paint1_linear${randomId})`}
        />
        <path
          d="M15.075 13.6313L20.0062 9.1876L16.2937 5.8501L11.3625 10.2938L15.075 13.6313Z"
          fill={`url(#paint2_linear${randomId})`}
        />
        <path
          d="M15.075 13.6312L8.86875 19.2L12 22.0125L21.3937 13.575V10.425L20.0062 9.1875L15.075 13.6312Z"
          fill={`url(#paint3_linear${randomId})`}
        />

        <defs>
          <linearGradient
            id={`paint0_linear${randomId}`}
            x1="3.7206"
            y1="14.2649"
            x2="15.1645"
            y2="14.2649"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.2464" stopColor="#E700FF" />
            <stop offset="0.3166" stopColor="#E804F9" />
            <stop offset="0.4108" stopColor="#E90EE8" />
            <stop offset="0.5188" stopColor="#EC1FCC" />
            <stop offset="0.637" stopColor="#F037A5" />
            <stop offset="0.7635" stopColor="#F45672" />
            <stop offset="0.8949" stopColor="#FA7A36" />
            <stop offset="1" stopColor="#FF9B00" />
          </linearGradient>
          <linearGradient
            id={`paint1_linear${randomId}`}
            x1="2.60274"
            y1="8.40089"
            x2="15.14"
            y2="8.40089"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0.4233" stopColor="#FABD09" />
            <stop offset="0.8292" stopColor="#FA6B00" />
          </linearGradient>
          <linearGradient
            id={`paint2_linear${randomId}`}
            x1="6.8682"
            y1="14.1738"
            x2="25.405"
            y2="4.84055"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#BAFF8E" />
            <stop offset="0.6287" stopColor="#008EBB" />
          </linearGradient>
          <linearGradient
            id={`paint3_linear${randomId}`}
            x1="25.2522"
            y1="6.08799"
            x2="3.87697"
            y2="27.836"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#BAFF8E" />
            <stop offset="0.6287" stopColor="#008EBB" />
          </linearGradient>
          <clipPath id="clip0">
            <rect width="24" height="24" fill="white" />
          </clipPath>
        </defs>
      </svg>
    );
  },
  [ICONS.ARCONNECT]: buildIcon(
    <svg width="24" height="22" viewBox="0 0 41 40" fill="none" stroke="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M36.7932 25.6763L40.0604 25.0926L37.0991 21.7885L39.6625 20.3593L36.4184 17.9485L38.505 12.9485H33.9416L35.1402 8.03703L30.2504 10.5363L31.5877 4.06223L26.6469 8.12557L26.1227 1.87481L22.3896 7.50037L20.0604 0L17.7319 7.50037L13.9973 1.87481L13.4734 8.12557L8.53447 4.06223L9.87184 10.5363L4.97964 8.03703L6.17993 12.9481H1.61543L3.70135 17.9481L0.457863 20.3593L3.02115 21.7885L0.060368 25.0926L3.32949 25.6763L1.08829 29.9356L3.98073 31.0074L3.15229 33.744L5.50199 33.2281L5.73639 36.602L7.68969 35.6097L7.86689 38.7053L9.42195 38.1893C9.42195 38.1893 12.1736 41.0377 17.7036 39.5893C18.3455 39.4213 18.8924 38.978 19.1502 38.367C19.4385 37.6913 19.343 36.872 17.4974 36.569C14.2465 36.037 9.747 36.6627 8.11728 32.5926C8.10548 32.5641 8.1029 32.5325 8.10992 32.5025C8.11694 32.4724 8.13319 32.4453 8.15646 32.4249C8.1797 32.4045 8.20876 32.3918 8.23955 32.3887C8.27037 32.3856 8.30137 32.3921 8.32828 32.4074C10.3343 33.54 15.0356 34.562 15.4271 32.4219C15.8454 30.1422 13.8371 29.3885 12.7022 28.7644C11.5673 28.1404 6.40989 26.4752 6.64952 23.4119C6.88911 20.3485 10.2426 21.1667 11.003 21.7778C11.6884 22.2222 18.4596 26.377 18.4596 26.377C18.4596 26.377 16.0044 29.6267 20.0604 29.6267C24.1163 29.6267 21.6622 26.3763 21.6622 26.3763C21.6622 26.3763 28.4315 22.2222 29.1184 21.7778C29.8789 21.1667 33.2338 20.3493 33.4712 23.4119C33.7085 26.4744 28.5497 28.1407 27.4159 28.7648C26.2821 29.3889 24.2742 30.1426 24.691 32.4222C25.084 34.5613 29.7804 33.541 31.7891 32.4085C31.816 32.3931 31.8471 32.3864 31.8779 32.3895C31.9088 32.3926 31.938 32.4052 31.9613 32.4256C31.9846 32.4461 32.0009 32.4732 32.0079 32.5034C32.015 32.5335 32.0124 32.5651 32.0004 32.5937C30.3729 36.6627 25.8735 36.037 22.6237 36.5703C20.7788 36.8733 20.6826 37.693 20.9716 38.3687C21.2317 38.978 21.7748 39.4213 22.4167 39.5907C27.9482 41.0393 30.701 38.1907 30.701 38.1907L32.2553 38.7037L32.431 35.6097L34.3829 36.602L34.6179 33.2281L36.967 33.744L36.1412 31.0059L39.0336 29.9341L36.7932 25.6763ZM15.734 21.343C15.2941 21.343 14.864 21.2129 14.4983 20.9692C14.1325 20.7256 13.8474 20.3792 13.6791 19.974C13.5108 19.5688 13.4668 19.123 13.5526 18.6928C13.6384 18.2627 13.8503 17.8676 14.1614 17.5575C14.4725 17.2474 14.8688 17.0362 15.3003 16.9507C15.7318 16.8652 16.1789 16.9092 16.5854 17.077C16.9918 17.2449 17.3391 17.5292 17.5834 17.8939C17.8278 18.2586 17.9581 18.6873 17.9581 19.1259C17.9582 19.4172 17.9008 19.7056 17.7891 19.9748C17.6774 20.2439 17.5136 20.4885 17.307 20.6945C17.1005 20.9005 16.8552 21.0638 16.5853 21.1753C16.3154 21.2868 16.0261 21.3441 15.734 21.3441V21.343ZM24.3867 21.343C23.9468 21.343 23.5167 21.213 23.1509 20.9694C22.7851 20.7258 22.5 20.3795 22.3316 19.9743C22.1632 19.5691 22.1192 19.1232 22.205 18.6931C22.2908 18.2629 22.5026 17.8677 22.8137 17.5576C23.1248 17.2475 23.5211 17.0363 23.9526 16.9507C24.384 16.8652 24.8312 16.9091 25.2377 17.077C25.6441 17.2449 25.9914 17.5292 26.2358 17.8939C26.4802 18.2586 26.6106 18.6873 26.6105 19.1259C26.6106 19.4172 26.5532 19.7056 26.4415 19.9747C26.3298 20.2438 26.1661 20.4883 25.9596 20.6943C25.7531 20.9003 25.5079 21.0637 25.238 21.1752C24.9681 21.2867 24.6789 21.3441 24.3867 21.3441V21.343Z"
        fill="currentColor"
      />
    </svg>
  ),
  [ICONS.REWARDS]: buildIcon(
    <g fill="none" fillRule="evenodd" strokeLinecap="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </g>
  ),
  [ICONS.ARROW_LEFT]: buildIcon(
    <g fill="none" fillRule="evenodd" strokeLinecap="round">
      <polyline points="15 18 9 12 15 6" />
    </g>
  ),
  [ICONS.ARROW_RIGHT]: buildIcon(
    <g fill="none" fillRule="evenodd" strokeLinecap="round">
      <polyline points="9 18 15 12 9 6" />
    </g>
  ),
  [ICONS.HOME]: buildIcon(
    <g fill="none" fillRule="evenodd" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1, 11 L12, 2 C12, 2 22.9999989, 11.0000005 23, 11" />
      <path d="M3, 10 C3, 10 3, 10.4453982 3, 10.9968336 L3, 20.0170446 C3, 20.5675806 3.43788135, 21.0138782 4.00292933, 21.0138781 L8.99707067, 21.0138779 C9.55097324, 21.0138779 10, 20.5751284 10, 20.0089602 L10, 15.0049177 C10, 14.449917 10.4433532, 14 11.0093689, 14 L12.9906311, 14 C13.5480902, 14 14, 14.4387495 14, 15.0049177 L14, 20.0089602 C14, 20.5639609 14.4378817, 21.0138779 15.0029302, 21.0138779 L19.9970758, 21.0138781 C20.5509789, 21.0138782 21.000006, 20.56848 21.000006, 20.0170446 L21.0000057, 10" />
    </g>
  ),
  [ICONS.PUBLISH]: buildIcon(
    <g fill="none" fillRule="evenodd" strokeLinecap="round">
      <path
        d="M8, 18 L5, 18 L5, 18 C2.790861, 18 1, 16.209139 1, 14 C1, 11.790861 2.790861, 10 5, 10 C5.35840468, 10 5.70579988, 10.0471371 6.03632437, 10.1355501 C6.01233106, 9.92702603 6, 9.71495305 6, 9.5 C6, 6.46243388 8.46243388, 4 11.5, 4 C14.0673313, 4 16.2238156, 5.7590449 16.8299648, 8.1376465 C17.2052921, 8.04765874 17.5970804, 8 18, 8 C20.7614237, 8 23, 10.2385763 23, 13 C23, 15.7614237 20.7614237, 18 18, 18 L16, 18"
        strokeLinejoin="round"
      />
      <path d="M12, 13 L12, 21" />
      <polyline
        strokeLinejoin="round"
        transform="translate(12.000000, 12.500000) scale(1, -1) translate(-12.000000, -12.500000)"
        points="15 11 12 14 9 11"
      />
    </g>
  ),
  [ICONS.FETCH]: buildIcon(
    <g fill="none" fillRule="evenodd" strokeLinecap="round">
      <polyline points="8 17 12 21 16 17" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
    </g>
  ),
  [ICONS.SUBSCRIBE]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...otherProps } = props;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={color}
        stroke={'#FFFFFF'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...otherProps}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    );
  },
  [ICONS.SUBSCRIBED]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...otherProps } = props;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={color}
        stroke={'#FFFFFF'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...otherProps}
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    );
  },

  [ICONS.UNSUBSCRIBE]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...otherProps } = props;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={color}
        stroke={'#FFFFFF'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...otherProps}
      >
        <path d="M 12,5.67 10.94,4.61 C 5.7533356,-0.57666427 -2.0266644,7.2033357 3.16,12.39 l 1.06,1.06 7.78,7.78 7.78,-7.78 1.06,-1.06 c 2.149101,-2.148092 2.149101,-5.6319078 0,-7.78 -2.148092,-2.1491008 -5.631908,-2.1491008 -7.78,0 L 9.4481298,8.2303201 15.320603,9.2419066 11.772427,13.723825" />
      </svg>
    );
  },
  [ICONS.SETTINGS]: buildIcon(
    <g>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </g>
  ),
  [ICONS.FILTER]: buildIcon(
    <g>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </g>
  ),
  [ICONS.ACCOUNT]: buildIcon(
    <g>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </g>
  ),
  [ICONS.OVERVIEW]: buildIcon(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />),
  [ICONS.WALLET]: buildIcon(
    <g>
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </g>
  ),
  [ICONS.COIN_SWAP]: buildIcon(
    <g>
      <path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
    </g>
  ),

  [ICONS.LIBRARY]: buildIcon(<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />),
  [ICONS.EDIT]: buildIcon(
    <g>
      <path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34" />
      <polygon points="18 2 22 6 12 16 8 16 8 12 18 2" />
    </g>
  ),
  [ICONS.DOWNLOAD]: buildIcon(
    <g>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </g>
  ),
  [ICONS.HELP]: buildIcon(
    <g>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12" y2="17" />
    </g>
  ),
  [ICONS.BLOCK]: buildIcon(
    <g>
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </g>
  ),
  [ICONS.UNBLOCK]: buildIcon(
    <g>
      <circle cx="12" cy="12" r="10" />
    </g>
  ),
  [ICONS.MUTE]: buildIcon(
    <g>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </g>
  ),
  [ICONS.LIGHT]: buildIcon(
    <g>
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </g>
  ),
  [ICONS.DARK]: buildIcon(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />),
  [ICONS.FEEDBACK]: buildIcon(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />),
  [ICONS.SEARCH]: buildIcon(
    <g>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </g>
  ),
  [ICONS.SHARE]: buildIcon(
    <g>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </g>
  ),
  [ICONS.REPORT]: buildIcon(
    <g>
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" y1="22" x2="4" y2="15" />
    </g>
  ),
  [ICONS.EXTERNAL]: buildIcon(
    <g>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </g>
  ),
  [ICONS.DELETE]: buildIcon(
    <g>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </g>
  ),
  [ICONS.COPY]: buildIcon(
    <g>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </g>
  ),
  [ICONS.REMOVE]: buildIcon(
    <g>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </g>
  ),
  [ICONS.ADD]: buildIcon(
    <g>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </g>
  ),
  [ICONS.SUBTRACT]: buildIcon(
    <g>
      <line x1="5" y1="12" x2="19" y2="12" />
    </g>
  ),
  [ICONS.CHAT]: buildIcon(
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  ),
  [ICONS.COMPACT]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...otherProps } = props;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={color}
        stroke={'#FFFFFF'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...otherProps}
      >
        <g clipPath="url(#clip0_1_166)">
          <path d="M1 12H17" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M1 9H17" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M1 6H17" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M8.75007 3.77817L8.75007 -4" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M10.8714 1.65685L8.75008 3.77817L6.62876 1.65685" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M8.75017 14L8.75017 21.7782" strokeWidth="1.3" strokeLinecap="round" />
          <path d="M6.62885 16.1213L8.75017 14L10.8715 16.1213" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      </svg>
    );
  },
  [ICONS.EXPAND]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...otherProps } = props;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={color}
        stroke={'#FFFFFF'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...otherProps}
      >
        <path
          d="M0.999878 17H15.9999M0.999878 15H15.9999M0.999878 1.00002H15.9999M0.999878 3.00002H15.9999M8.50728 12.2501L8.50725 5.75006M10.6285 11.3714L9.21426 12.7856C8.82374 13.1761 8.19057 13.1761 7.80005 12.7856L6.38584 11.3714M6.38592 6.62874L7.80013 5.21453C8.19065 4.824 8.82382 4.824 9.21434 5.21453L10.6286 6.62874"
          strokeWidth="1.3"
          strokeLinecap="round"
        />
      </svg>
    );
  },
  [ICONS.UP]: buildIcon(<polyline transform="matrix(1,0,0,-1,0,24.707107)" points="6 9 12 15 18 9" />),
  [ICONS.UP_TOP]: buildIcon(<path d="m6 16 6-6 6 6M6 8h12" />),
  [ICONS.DOWN_BOTTOM]: buildIcon(<path d="m6 8 6 6 6-6M6 16h12" />),
  [ICONS.DRAG]: buildIcon(<path d="m8 18 4 4 4-4M4 14h16M4 10h16M8 6l4-4 4 4" />),
  [ICONS.DOWN]: buildIcon(<polyline points="6 9 12 15 18 9" />),
  [ICONS.FILE]: buildIcon(
    <g>
      <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <polyline points="13 2 13 9 20 9" />
    </g>
  ),
  [ICONS.CHANNEL]: buildIcon(
    <g>
      <circle cx="12" cy="12" r="4" />
      <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
    </g>
  ),
  [ICONS.WEB]: buildIcon(
    <g>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </g>
  ),
  [ICONS.ALERT]: buildIcon(
    <g>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12" y2="16" />
    </g>
  ),
  [ICONS.INFO]: buildIcon(
    <g>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="8" />
      <line x1="12" y1="12" x2="12" y2="16" />
    </g>
  ),
  [ICONS.GLOBE]: buildIcon(
    <g>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </g>
  ),
  [ICONS.UNLOCK]: buildIcon(
    <g>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </g>
  ),

  [ICONS.LOCK]: buildIcon(
    <g>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </g>
  ),

  [ICONS.TAG]: buildIcon(
    <g>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7" y2="7" />
    </g>
  ),
  [ICONS.SUPPORT]: buildIcon(
    <g>
      <polyline points="20 12 20 22 4 22 4 12" />
      <rect x="2" y="7" width="20" height="5" />
      <line x1="12" y1="22" x2="12" y2="7" />
      <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
      <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
    </g>
  ),
  [ICONS.EYE]: buildIcon(
    <g>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </g>
  ),
  [ICONS.EYE_OFF]: buildIcon(
    <g>
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </g>
  ),
  [ICONS.VIEW]: buildIcon(
    <g>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </g>
  ),
  [ICONS.SIGN_IN]: buildIcon(
    <g>
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
      <polyline points="10 17 15 12 10 7" />
      <line x1="15" y1="12" x2="3" y2="12" />
    </g>
  ),
  [ICONS.SIGN_UP]: buildIcon(
    <g>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </g>
  ),
  [ICONS.SIGN_OUT]: buildIcon(
    <g>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </g>
  ),
  [ICONS.BACK]: buildIcon(
    <g transform="scale(1.3)">
      <path d="M5 4.00014L2 7.00024L5 10.4287" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      <path
        d="M2.5 7H9.25H12.1429C14.2731 7 16 8.7269 16 10.8571V10.8571C16 12.9874 14.2731 14.7143 12.1429 14.7143H9.57143"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </g>
  ),
  [ICONS.PHONE]: buildIcon(
    <g>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </g>
  ),
  [ICONS.MENU]: buildIcon(
    <g>
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </g>
  ),
  [ICONS.DISCOVER]: buildIcon(
    <g>
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </g>
  ),
  [ICONS.TRENDING]: buildIcon(
    <g>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </g>
  ),
  [ICONS.TOP]: buildIcon(
    <g>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </g>
  ),
  [ICONS.INVITE]: buildIcon(
    <g>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </g>
  ),
  [ICONS.VIDEO]: buildIcon(
    <g>
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </g>
  ),
  [ICONS.AUDIO]: buildIcon(
    <g>
      <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
    </g>
  ),
  [ICONS.VOLUME_MUTED]: buildIcon(
    <g>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </g>
  ),
  [ICONS.IMAGE]: buildIcon(
    <g>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </g>
  ),
  [ICONS.TEXT]: buildIcon(
    <g>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </g>
  ),
  [ICONS.DOWNLOADABLE]: buildIcon(
    <g>
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" />
      <polyline points="7 3 7 8 15 8" />
    </g>
  ),
  [ICONS.REPOST]: buildIcon(
    <g>
      <polyline points="17 1 21 5 17 9" />
      <path d="M3 11V9a4 4 0 0 1 4-4h14" />
      <polyline points="7 23 3 19 7 15" />
      <path d="M21 13v2a4 4 0 0 1-4 4H3" />
    </g>
  ),
  [ICONS.MORE_VERTICAL]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g>
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="19" r="1" />
      </g>
    </svg>
  ),
  [ICONS.MORE]: buildIcon(
    <g transform="rotate(90 12 12)">
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </g>
  ),
  [ICONS.VALIDATED]: buildIcon(
    <g>
      <polyline points="20 6 9 17 4 12" />
    </g>
  ),
  [ICONS.SLIDERS]: buildIcon(
    <g>
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <line x1="1" y1="14" x2="7" y2="14" />
      <line x1="9" y1="8" x2="15" y2="8" />
      <line x1="17" y1="16" x2="23" y2="16" />
    </g>
  ),
  [ICONS.ANALYTICS]: buildIcon(
    <g>
      <path d="M 8.4312337,1.6285136 V 9.4232264 L 2.2367584,22.725564 H 22.030217 L 15.773797,9.2902071 V 1.6285136 Z" />
      <path d="M 4.2426407,18.166369 H 12.197591" />
      <path d="m 6.363961,14.188893 h 5.701048" />
    </g>
  ),

  //
  // Share modal social icons
  //
  [ICONS.WHATSAPP]: buildIcon(
    <g>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 30C0 13.4315 13.4315 0 30 0C46.5685 0 60 13.4315 60 30C60 46.5685 46.5685 60 30 60C13.4315 60 0 46.5685 0 30Z"
        fill="#25d366"
      />
      <g transform="scale(2.5),translate(5.000000, 3.500000)">
        <path
          fill="white"
          d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"
        />
      </g>
    </g>,
    {
      viewBox: '0 0 60 60',
    }
  ),
  [ICONS.TWITTER]: buildIcon(
    <g>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 30C0 13.4315 13.4315 0 30 0C46.5685 0 60 13.4315 60 30C60 46.5685 46.5685 60 30 60C13.4315 60 0 46.5685 0 30Z"
        fill="#000000"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 33.299522,27.34664 46.199646,12.66221 h -3.05584 l -11.2059,12.747677 -8.94347,-12.747678 H 12.676647 L 26.203876,31.940793 12.676647,47.33779 h 3.055839 L 27.558562,33.872923 37.005566,47.33779 H 47.323353 M 16.835406,14.918865 h 4.69463 l 21.611461,30.273137 h -4.695784"
        fill="#ffffff"
      />
    </g>,
    {
      viewBox: '0 0 60 60',
    }
  ),
  [ICONS.FACEBOOK]: buildIcon(
    <g>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 30C0 13.4315 13.4315 0 30 0C46.5685 0 60 13.4315 60 30C60 46.5685 46.5685 60 30 60C13.4315 60 0 46.5685 0 30Z"
        fill="#3B5998"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M33.1269 47.6393V31.3178H37.6324L38.2295 25.6933H33.1269L33.1346 22.8781C33.1346 21.4112 33.274 20.6251 35.381 20.6251H38.1976V15H33.6915C28.2789 15 26.3738 17.7285 26.3738 22.317V25.6939H23V31.3184H26.3738V47.6393H33.1269Z"
        fill="white"
      />
    </g>,
    {
      viewBox: '0 0 60 60',
    }
  ),
  [ICONS.REDDIT]: buildIcon(
    <g>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M30 60C46.5685 60 60 46.5685 60 30C60 13.4315 46.5685 0 30 0C13.4315 0 0 13.4315 0 30C0 46.5685 13.4315 60 30 60Z"
        fill="#FF5700"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M52 29.6094C52 26.8656 49.7581 24.6331 47.0017 24.6331C45.7411 24.6331 44.5908 25.1045 43.7108 25.8741C40.5791 23.8712 36.4389 22.5679 31.854 22.3398L34.2649 14.753L40.843 16.2952C40.9167 18.5053 42.7408 20.2824 44.9793 20.2824C47.2636 20.2824 49.1224 18.4323 49.1224 16.1575C49.1224 13.8827 47.2632 12.0326 44.9793 12.0326C43.3199 12.0326 41.8896 13.0109 41.228 14.4159L33.8364 12.6845C33.3468 12.5702 32.8494 12.8509 32.6994 13.3286L29.8452 22.3101C24.9638 22.4055 20.5352 23.718 17.2164 25.8084C16.3462 25.0768 15.2228 24.6331 13.9983 24.6331C11.2419 24.6336 9 26.8656 9 29.6094C9 31.3563 9.91082 32.8922 11.2819 33.7795C11.2121 34.2251 11.1744 34.6766 11.1744 35.1334C11.1744 42.2094 19.8037 47.9664 30.412 47.9664C41.0194 47.9664 49.6497 42.2094 49.6497 35.1334C49.6497 34.7097 49.6174 34.2908 49.5573 33.8763C51.0159 33.0084 52 31.4235 52 29.6094ZM44.9792 13.9503C46.2022 13.9503 47.1971 14.9413 47.1971 16.159C47.1971 17.3766 46.2022 18.3671 44.9792 18.3671C43.7556 18.3671 42.7607 17.3766 42.7607 16.159C42.7607 14.9413 43.7556 13.9503 44.9792 13.9503ZM10.9253 29.6094C10.9253 27.9228 12.3037 26.5499 13.9978 26.5499C14.57 26.5499 15.1046 26.71 15.5644 26.9829C13.8498 28.3699 12.5666 30.002 11.843 31.786C11.2766 31.2309 10.9253 30.4608 10.9253 29.6094ZM47.7244 35.1344C47.7244 41.1527 39.957 46.0502 30.412 46.0502C20.8655 46.0502 13.0996 41.1532 13.0996 35.1344C13.0996 34.9223 13.1113 34.7131 13.1299 34.5044C13.1881 33.8647 13.3366 33.2391 13.5628 32.6329C14.1497 31.0615 15.2755 29.6196 16.8132 28.3902C17.3053 27.9967 17.8384 27.625 18.4091 27.2781C21.5242 25.3852 25.7548 24.2177 30.412 24.2177C35.1366 24.2177 39.4244 25.4183 42.5497 27.3599C43.1219 27.7145 43.6536 28.0949 44.1432 28.4973C45.6198 29.7081 46.6992 31.1199 47.2685 32.6548C47.4928 33.2629 47.6413 33.889 47.697 34.5302C47.7141 34.7311 47.7244 34.9315 47.7244 35.1344ZM49.03 31.9003C48.3269 30.0979 47.0467 28.4492 45.333 27.0447C45.8138 26.7328 46.3865 26.5499 47.0022 26.5499C48.6968 26.5499 50.0752 27.9223 50.0752 29.6094C50.0742 30.5216 49.6687 31.3399 49.03 31.9003Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M27.0214 32.827C27.0214 31.2109 25.705 29.855 24.0813 29.855C22.458 29.855 21.0967 31.2109 21.0967 32.827C21.0967 34.4426 22.4585 35.7547 24.0813 35.7547C25.705 35.7527 27.0214 34.4426 27.0214 32.827Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M36.9632 29.8541C35.34 29.8541 33.9742 31.2094 33.9742 32.8255C33.9742 34.4421 35.34 35.7532 36.9632 35.7532C38.5869 35.7532 39.9043 34.4431 39.9043 32.8255C39.9033 31.2084 38.5869 29.8541 36.9632 29.8541Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M36.1325 39.9224C35.0434 41.0053 33.2095 41.5312 30.5225 41.5312C30.5142 41.5312 30.5068 41.5336 30.499 41.5336C30.4907 41.5336 30.4839 41.5312 30.4761 41.5312C27.7886 41.5312 25.9542 41.0053 24.8665 39.9224C24.4908 39.5478 23.8809 39.5478 23.5052 39.9224C23.1289 40.2974 23.1289 40.9041 23.5052 41.2772C24.9716 42.7377 27.252 43.4484 30.4761 43.4484C30.4844 43.4484 30.4912 43.4455 30.499 43.4455C30.5068 43.4455 30.5142 43.4484 30.5225 43.4484C33.746 43.4484 36.027 42.7377 37.4948 41.2782C37.8716 40.9031 37.8716 40.297 37.4958 39.9233C37.1191 39.5487 36.5093 39.5487 36.1325 39.9224Z"
        fill="white"
      />
    </g>,
    {
      viewBox: '0 0 60 60',
    }
  ),
  [ICONS.TELEGRAM]: buildIcon(
    <g>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M30 60C46.5685 60 60 46.5685 60 30C60 13.4315 46.5685 0 30 0C13.4315 0 0 13.4315 0 30C0 46.5685 13.4315 60 30 60Z"
        fill="url(#paint0_linear)"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24.5 43.75C23.5281 43.75 23.6933 43.383 23.3581 42.4576L20.5 33.0515L42.5 20"
        fill="#C8DAEA"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M24.5 43.75C25.25 43.75 25.5814 43.407 26 43L30 39.1105L25.0105 36.1017"
        fill="#A9C9DD"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M25.01 36.1025L37.1 45.0347C38.4796 45.796 39.4753 45.4018 39.819 43.7539L44.7402 20.5631C45.2441 18.5431 43.9702 17.6269 42.6504 18.2261L13.7529 29.3688C11.7804 30.16 11.7919 31.2605 13.3933 31.7508L20.8091 34.0654L37.9773 23.2341C38.7878 22.7427 39.5317 23.0069 38.9211 23.5487"
        fill="url(#paint1_linear)"
      />
      <defs>
        <linearGradient id="paint0_linear" x1="22.503" y1="2.502" x2="7.503" y2="37.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#37AEE2" />
          <stop offset="1" stopColor="#1E96C8" />
        </linearGradient>
        <linearGradient
          id="paint1_linear"
          x1="26.2445"
          y1="31.8428"
          x2="29.4499"
          y2="42.2115"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#EFF7FC" />
          <stop offset="1" stopColor="white" />
        </linearGradient>
      </defs>
    </g>,
    {
      viewBox: '0 0 60 60',
    }
  ),
  [ICONS.EMBED]: buildIcon(
    <g>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 30C0 13.4315 13.4315 0 30 0C46.5685 0 60 13.4315 60 30C60 46.5685 46.5685 60 30 60C13.4315 60 0 46.5685 0 30Z"
        fill="#eee"
      />
      <g transform="scale(1.2)">
        <polyline points="15 18 9 12 15 6" stroke="black" transform="translate(6,12)" strokeWidth="2" />
        <polyline points="9 18 15 12 9 6" stroke="black" transform="translate(20,12)" strokeWidth="2" />
      </g>
    </g>,
    {
      viewBox: '0 0 60 60',
    }
  ),
  [ICONS.SHARE_LINK]: buildIcon(
    <g>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M0 30C0 13.4315 13.4315 0 30 0C46.5685 0 60 13.4315 60 30C60 46.5685 46.5685 60 30 60C13.4315 60 0 46.5685 0 30Z"
        fill="#eee"
      />
      <path d="M28 30a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="black" />
      <path d="M32 27a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="black" />
    </g>,
    {
      viewBox: '0 0 60 60',
    }
  ),
  [ICONS.COPY_LINK]: buildIcon(
    <g>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </g>
  ),
  [ICONS.PURCHASED]: buildIcon(
    <g>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </g>
  ),
  [ICONS.COMPLETED]: buildIcon(
    <g>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </g>
  ),
  [ICONS.NOT_COMPLETED]: buildIcon(<circle cx="12" cy="12" r="10" />),
  [ICONS.REFRESH]: buildIcon(
    <g>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </g>
  ),
  [ICONS.BUY]: buildIcon(
    <g>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </g>
  ),
  [ICONS.SEND]: buildIcon(
    <g>
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </g>
  ),
  [ICONS.RECEIVE]: buildIcon(
    <g>
      <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
      <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    </g>
  ),
  [ICONS.CAMERA]: buildIcon(
    <g>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </g>
  ),
  [ICONS.NOTIFICATION]: buildIcon(
    <g>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </g>
  ),
  [ICONS.POST]: buildIcon(
    <g>
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </g>
  ),
  [ICONS.REPLY]: buildIcon(
    <g>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </g>
  ),
  [ICONS.YOUTUBE]: buildIcon(
    <g>
      <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
      <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
    </g>
  ),
  [ICONS.SCIENCE]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-3 0 24 24"
      width={props.size || '16'}
      height={props.size || '18'}
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M0.767018182,20.022 C0.300109091,20.6874545 0.243381818,21.558 0.618654545,22.2801818 C0.995018182,23.0012727 1.7412,23.454 2.55501818,23.454 L14.8997455,23.454 C15.7135636,23.454 16.4597455,23.0012727 16.8350182,22.2801818 C17.2113818,21.558 17.1535636,20.6874545 16.6877455,20.022 L11.4546545,11.454 L11.4546545,2.72672727 L6.00010909,2.72672727 L6.00010909,11.454 L0.767018182,20.022 L0.767018182,20.022 Z" />
      <path d="M13.6363636,1.63636364 C13.6363636,2.23963636 13.1487273,2.72727273 12.5454545,2.72727273 L4.90909091,2.72727273 C4.30581818,2.72727273 3.81818182,2.23963636 3.81818182,1.63636364 C3.81818182,1.03309091 4.30581818,0.545454545 4.90909091,0.545454545 L12.5454545,0.545454545 C13.1487273,0.545454545 13.6363636,1.03309091 13.6363636,1.63636364 L13.6363636,1.63636364 Z" />
      <line x1="11.4545455" y1="4.90909091" x2="9.27272727" y2="4.90909091" id="Stroke-8219" strokeLinecap="round" />
      <line x1="11.4545455" y1="9.27272727" x2="9.27272727" y2="9.27272727" id="Stroke-8220" strokeLinecap="round" />
      <line x1="11.4545455" y1="7.09090909" x2="8.18181818" y2="7.09090909" id="Stroke-8221" strokeLinecap="round" />
      <line x1="3.27272727" y1="15.8181818" x2="14.1818182" y2="15.8181818" id="Stroke-8222" />
      <path
        d="M13.0909091,21.2727273 C13.0909091,21.5738182 12.8465455,21.8181818 12.5454545,21.8181818 C12.2443636,21.8181818 12,21.5738182 12,21.2727273 C12,20.9716364 12.2443636,20.7272727 12.5454545,20.7272727 C12.8465455,20.7272727 13.0909091,20.9716364 13.0909091,21.2727273 L13.0909091,21.2727273 Z"
        id="Stroke-8223"
        strokeLinecap="round"
      />
      <path
        d="M10.3636364,18.2727273 C10.3636364,18.4232727 10.2414545,18.5454545 10.0909091,18.5454545 C9.94036364,18.5454545 9.81818182,18.4232727 9.81818182,18.2727273 C9.81818182,18.1221818 9.94036364,18 10.0909091,18 C10.2414545,18 10.3636364,18.1221818 10.3636364,18.2727273 L10.3636364,18.2727273 Z"
        id="Stroke-8224"
        strokeLinecap="round"
      />
      <path
        d="M7.63636364,19.6363636 C7.63636364,20.5396364 6.90327273,21.2727273 6,21.2727273 C5.09672727,21.2727273 4.36363636,20.5396364 4.36363636,19.6363636 C4.36363636,18.7330909 5.09672727,18 6,18 C6.90327273,18 7.63636364,18.7330909 7.63636364,19.6363636 L7.63636364,19.6363636 Z"
        id="Stroke-8225"
        strokeLinecap="round"
      />
    </svg>
  ),
  [ICONS.TECH]: (props: CustomProps) => (
    <svg {...props} width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 2V0M15 2V0M10.5 2V0M6 20V18M15 20V18M10.5 20V18M0.555542 5H2.55554M0.555542 14H2.55554M0.555542 9.5H2.55554M18.5555 5H20.5M18.5555 14H20.5M18.5555 9.5H20.5M7 15H14C15.1046 15 16 14.1046 16 13V7C16 5.89543 15.1046 5 14 5H7C5.89543 5 5 5.89543 5 7V13C5 14.1046 5.89543 15 7 15Z" />
    </svg>
  ),
  [ICONS.NEWS]: (props: CustomProps) => (
    <svg {...props} width="21" height="18" viewBox="0 0 21 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.7553 6.50001L19.7553 6.00001M17.7553 11L19.7553 11.5M16.2553 2.00001L17.3262 1M3.17018 8.10369L2.98445 8.23209C2.85036 8.32478 2.70264 8.3958 2.56048 8.47556C1.88883 8.85235 1.38281 9.7222 1.52367 10.5694C1.6624 11.4038 2.3113 12.0619 3.14392 12.2112L4.75526 12.5L4.75528 14.5L5.30241 16.292C5.43083 16.7126 5.81901 17 6.25882 17H8.69504M3.17018 8.10369L12.2582 2.84235M3.17018 8.10369L4.00718 12.1694L14.0948 12.5372M8.69504 17H9M8.69504 17L7.75527 14.5L7.75529 12.5M12.2553 2.00001L13.2553 7.50001L14.2553 13.5M14.1875 8.6648C14.8624 8.53243 15.3022 7.87802 15.1698 7.20313C15.0375 6.52824 14.383 6.08843 13.7082 6.22079" />
    </svg>
  ),
  [ICONS.FINANCE]: (props: CustomProps) => (
    <svg
      {...props}
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12.5 7.5C12 7 11.3 6.5 10.5 6.5M10.5 6.5C8.50001 6.5 7.62294 8.18441 8.5 9.5C9.5 11 12.5 10 12.5 12C12.5 14.0615 10 14.5 8 13M10.5 6.5L10.5 5M10.5 14V15.5M19.5 10C19.5 14.9706 15.4706 19 10.5 19C5.52944 19 1.5 14.9706 1.5 10C1.5 5.02944 5.52944 1 10.5 1C15.4706 1 19.5 5.02944 19.5 10Z" />
    </svg>
  ),
  [ICONS.EURO]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 40 40"
      width={props.size || '16'}
      height={props.size || '16'}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.5"
      stroke="currentColor"
    >
      <g transform="matrix(2,0,0,2,0,0), scale(.8)">
        <path d="M19.5,23.25a11.25,11.25,0,0,1,0-22.5" />
        <path d="M4.5 9.75L16.5 9.75" />
        <path d="M4.5 14.25L13.5 14.25" />
      </g>
    </svg>
  ),
  [ICONS.ENLIGHTENMENT]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-1 0 24 24"
      width={props.size || '16'}
      height={props.size || '18'}
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M8.9258,14.3311 C2.4228,14.3311 3.0138,8.4191 3.0138,8.4191 C10.1078,8.4191 8.9258,14.3311 8.9258,14.3311 L8.9258,14.3311 Z"
        id="Stroke-5653"
      />
      <path
        d="M13.0732,14.3311 C19.5762,14.3311 18.9852,8.4191 18.9852,8.4191 C11.8912,8.4191 13.0732,14.3311 13.0732,14.3311 L13.0732,14.3311 Z"
        id="Stroke-5654"
      />
      <path
        d="M21.4995,10 C21.4995,16.352 13.9995,23 10.9995,23 C7.9995,23 0.4995,16.352 0.4995,10 C0.4995,3.648 4.6475,0.5 10.9995,0.5 C17.3505,0.5 21.4995,3.648 21.4995,10 L21.4995,10 Z"
        id="Stroke-5655"
      />
    </svg>
  ),
  [ICONS.GHOST]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-2 -1 24 26"
      width={props.size || '18'}
      height={props.size || '16'}
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g>
        <path
          d="M17.5,9 C17.5,4.307 13.694,0.5 9,0.5 C4.306,0.5 0.5,4.307 0.5,9 L0.5,22.5 C0.5,23.051 0.95,23.5 1.5,23.5 L2,23.5 C2.551,23.5 3,23.051 3,22.5 C3,21.951 3.45,21.5 4,21.5 C4.551,21.5 5,21.951 5,22.5 C5,23.051 5.45,23.5 6,23.5 L7,23.5 C7.551,23.5 8,23.051 8,22.5 C8,21.951 8.45,21.5 9,21.5 C9.551,21.5 10,21.951 10,22.5 C10,23.051 10.45,23.5 11,23.5 L12,23.5 C12.551,23.5 13,23.051 13,22.5 C13,21.951 13.45,21.5 14,21.5 C14.551,21.5 15,21.951 15,22.5 C15,23.051 15.45,23.5 16,23.5 L16.5,23.5 C17.051,23.5 17.5,23.051 17.5,22.5 L17.5,9 L17.5,9 Z"
          id="Stroke-939"
        />
        <path
          d="M13.5,12 C13.5,12.826 12.825,13.5 12,13.5 C11.176,13.5 10.5,12.826 10.5,12 L10.5,9 C10.5,8.176 11.176,7.5 12,7.5 C12.825,7.5 13.5,8.176 13.5,9 L13.5,12 L13.5,12 Z"
          id="Stroke-940"
        />
        <path
          d="M11.5,11 C11.5,11.277 11.276,11.5 11,11.5 C10.724,11.5 10.5,11.277 10.5,11 C10.5,10.725 10.724,10.5 11,10.5 C11.276,10.5 11.5,10.725 11.5,11 L11.5,11 Z"
          id="Stroke-941"
        />
        <path
          d="M7.5,12 C7.5,12.826 6.825,13.5 6,13.5 C5.176,13.5 4.5,12.826 4.5,12 L4.5,9 C4.5,8.176 5.176,7.5 6,7.5 C6.825,7.5 7.5,8.176 7.5,9 L7.5,12 L7.5,12 Z"
          id="Stroke-942"
        />
        <path
          d="M5.5,11 C5.5,11.277 5.276,11.5 5,11.5 C4.724,11.5 4.5,11.277 4.5,11 C4.5,10.725 4.724,10.5 5,10.5 C5.276,10.5 5.5,10.725 5.5,11 L5.5,11 Z"
          id="Stroke-943"
        />
      </g>
    </svg>
  ),
  [ICONS.GAMING]: (props: CustomProps) => (
    <svg {...props} width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 5.49925L10.1096 10L18 14.5007C16.4248 17.1904 13.4811 19 10.1096 19C5.07849 19 1 14.9706 1 10C1 5.02944 5.07849 1 10.1096 1C13.4811 1 16.4248 2.80956 18 5.49925Z" />
    </svg>
  ),
  [ICONS.COMMUNITY]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-2 -1 24 26"
      width={props.size || '18'}
      height={props.size || '18'}
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g>
        <path
          d="M0.5,5 L0.5,8 C0.5,12.694 3.806,16.5 8.5,16.5 C13.194,16.5 16.5,12.694 16.5,8 L16.5,5"
          id="Stroke-8485"
        />
        <path
          d="M12,0.5 C14.485,0.5 16.5,2.515 16.5,5 C16.5,7.485 14.485,9.5 12,9.5 L5,9.5 C2.515,9.5 0.5,7.485 0.5,5 C0.5,2.515 2.515,0.5 5,0.5 L12,0.5 L12,0.5 Z"
          id="Stroke-8486"
        />
        <path d="M5.1758,15.7891 C6.0938,12.1251 8.6878,10.1561 11.9998,9.5001" id="Stroke-8487" />
        <path d="M7.25,9.5 C5.316,9.5 3.75,7.934 3.75,6 C3.75,4.066 5.316,2.5 7.25,2.5 L10.5,2.5" id="Stroke-8488" />
        <path d="M10,0.5 C11.934,0.5 13.5,2.066 13.5,4 C13.5,5.934 11.934,7.5 10,7.5 L7,7.5" id="Stroke-8489" />
        <line x1="8.5" y1="16.5" x2="8.5" y2="23.5" id="Stroke-8490" />
        <line x1="8.5" y1="19.5" x2="11" y2="19.5" id="Stroke-8491" />
        <line x1="8.5" y1="22.5" x2="6" y2="22.5" id="Stroke-8492" />
        <path d="M9.5,5 C8.119,5 7,6.119 7,7.5" id="Stroke-8493" />
      </g>
    </svg>
  ),
  [ICONS.UPVOTE]: buildIcon(
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  ),
  [ICONS.DOWNVOTE]: buildIcon(
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17" />
  ),
  [ICONS.SLIME_ACTIVE]: buildIcon(
    <path
      d="M13.065 4.18508C12.5638 4.47334 11.9699 4.5547 11.4096 4.41183C10.8494 4.26896 10.367 3.91315 10.065 3.42008C9.70126 2.96799 9.52899 2.39146 9.58506 1.81392C9.64113 1.23639 9.92109 0.703759 10.365 0.330081C10.8662 0.0418164 11.4601 -0.0395341 12.0204 0.103332C12.5806 0.246199 13.063 0.602008 13.365 1.09508C13.7287 1.54717 13.901 2.12371 13.8449 2.70124C13.7889 3.27877 13.5089 3.8114 13.065 4.18508ZM2.565 6.76508C1.98518 6.6732 1.39241 6.81157 0.913189 7.15066C0.433971 7.48976 0.106262 8.00272 0 8.58008C0.0118186 9.17159 0.256137 9.73464 0.680058 10.1473C1.10398 10.56 1.67339 10.7891 2.265 10.7851C2.84509 10.8863 3.44175 10.7561 3.92691 10.4224C4.41207 10.0886 4.74707 9.57801 4.86 9.00008C4.85804 8.7046 4.79789 8.41241 4.683 8.14018C4.56811 7.86794 4.40072 7.62101 4.1904 7.41347C3.98007 7.20593 3.73093 7.04185 3.45719 6.9306C3.18345 6.81935 2.89048 6.7631 2.595 6.76508H2.565ZM22.2 15.1951C21.9286 15.0703 21.635 15.0008 21.3364 14.9907C21.0379 14.9806 20.7403 15.0301 20.461 15.1362C20.1818 15.2423 19.9264 15.403 19.7099 15.6088C19.4934 15.8146 19.3201 16.0615 19.2 16.3351C19.1369 16.6299 19.1337 16.9345 19.1906 17.2306C19.2475 17.5267 19.3634 17.8084 19.5313 18.0588C19.6992 18.3093 19.9157 18.5235 20.168 18.6886C20.4203 18.8537 20.7033 18.9665 21 19.0201C21.2714 19.1449 21.565 19.2143 21.8636 19.2244C22.1621 19.2346 22.4597 19.1851 22.739 19.079C23.0182 18.9729 23.2736 18.8122 23.4901 18.6064C23.7066 18.4005 23.8799 18.1536 24 17.8801C24.0634 17.5873 24.0677 17.2849 24.0127 16.9904C23.9577 16.696 23.8444 16.4155 23.6795 16.1654C23.5147 15.9153 23.3015 15.7007 23.0526 15.5341C22.8037 15.3674 22.524 15.2522 22.23 15.1951H22.2ZM20.34 10.2451C20.0073 9.99542 19.6009 9.86349 19.185 9.87008C18.4572 9.93018 17.7485 10.1341 17.1 10.4701C16.7447 10.6341 16.3789 10.7744 16.005 10.8901H15.69C15.5961 10.9108 15.4989 10.9108 15.405 10.8901C15 9.97508 16.5 9.00008 18.285 7.93508C18.8914 7.60883 19.4599 7.21644 19.98 6.76508C20.3961 6.30667 20.646 5.72169 20.6895 5.10413C20.733 4.48658 20.5677 3.87232 20.22 3.36008C19.9329 2.89588 19.5307 2.51381 19.0523 2.25098C18.574 1.98815 18.0358 1.85349 17.49 1.86008C17.2067 1.85969 16.9245 1.89496 16.65 1.96508C16.1585 2.08101 15.7042 2.31914 15.3293 2.65739C14.9543 2.99565 14.6708 3.42308 14.505 3.90008C14.16 4.75508 13.14 7.30508 12.135 7.71008C12.0359 7.72949 11.9341 7.72949 11.835 7.71008C11.6138 7.70259 11.3956 7.65692 11.19 7.57508C9.96 7.12508 9.6 5.62508 9.225 4.03508C9.06457 3.15891 8.79234 2.30695 8.415 1.50008C8.17043 1.04181 7.80465 0.659541 7.3576 0.395014C6.91055 0.130487 6.39941 -0.00612938 5.88 8.05856e-05C5.30686 0.011692 4.74338 0.149999 4.23 0.405081C3.872 0.589131 3.5547 0.843345 3.297 1.15258C3.03931 1.46182 2.84648 1.81976 2.73 2.20508C2.58357 2.66415 2.532 3.1482 2.57841 3.62781C2.62483 4.10743 2.76826 4.57261 3 4.99508C3.63898 5.99088 4.39988 6.90294 5.265 7.71008C5.59239 8.0233 5.90283 8.35377 6.195 8.70008C6.41249 8.94283 6.57687 9.22833 6.67761 9.5383C6.77835 9.84826 6.81322 10.1759 6.78 10.5001C6.68279 10.762 6.52008 10.9947 6.30737 11.1759C6.09467 11.3571 5.83908 11.4808 5.565 11.5351H5.19C4.89755 11.5247 4.60651 11.4896 4.32 11.4301C3.94485 11.3508 3.56329 11.3056 3.18 11.2951H3C2.50224 11.3269 2.02675 11.513 1.63964 11.8275C1.25253 12.142 0.973032 12.5694 0.84 13.0501C0.685221 13.5092 0.678705 14.0053 0.821373 14.4683C0.964041 14.9313 1.24867 15.3377 1.635 15.6301C1.97288 15.8809 2.38429 16.0127 2.805 16.0051C3.4891 15.9504 4.15377 15.751 4.755 15.4201C5.18104 15.1991 5.64344 15.0568 6.12 15.0001H6.285C6.32317 15.0086 6.35846 15.0269 6.38739 15.0532C6.41632 15.0795 6.4379 15.1129 6.45 15.1501C6.52858 15.4213 6.49621 15.7127 6.36 15.9601C5.80418 16.8088 4.95508 17.4229 3.975 17.6851C3.38444 17.8608 2.85799 18.205 2.46025 18.6756C2.06252 19.1462 1.81078 19.7226 1.73592 20.3342C1.66107 20.9458 1.76635 21.5659 2.03886 22.1185C2.31136 22.6711 2.73924 23.1321 3.27 23.4451C3.81477 23.8292 4.46349 24.0384 5.13 24.0451C6.1389 23.9485 7.08103 23.4979 7.7894 22.773C8.49778 22.0482 8.92665 21.0959 9 20.0851V19.9501C9.135 19.0351 9.33 17.7751 10.05 17.3401C10.2442 17.2216 10.4675 17.1593 10.695 17.1601C11.0828 17.1781 11.4558 17.3142 11.7641 17.5501C12.0724 17.786 12.3012 18.1105 12.42 18.4801C13.155 21.2251 13.725 23.4001 16.14 23.4001C16.4527 23.3961 16.7643 23.361 17.07 23.2951C17.8256 23.2158 18.5231 22.8527 19.0214 22.2792C19.5198 21.7057 19.7819 20.9644 19.755 20.2051C19.6664 19.6213 19.4389 19.0673 19.0918 18.5896C18.7446 18.112 18.2879 17.7246 17.76 17.4601C17.4534 17.2574 17.1625 17.0317 16.89 16.7851C16.005 15.9301 15.855 15.4051 15.885 15.1051C15.9198 14.8698 16.0313 14.6526 16.2021 14.4871C16.373 14.3217 16.5937 14.2173 16.83 14.1901H17.055C17.31 14.1901 17.61 14.1901 17.895 14.1901C18.18 14.1901 18.57 14.1901 18.84 14.1901H19.14C19.6172 14.1642 20.0748 13.9919 20.4505 13.6967C20.8263 13.4014 21.102 12.9976 21.24 12.5401C21.3316 12.1166 21.2981 11.6757 21.1436 11.2709C20.9892 10.8661 20.7204 10.5149 20.37 10.2601L20.34 10.2451Z"
      fill="#81C554"
      strokeWidth="0"
    />
  ),
  [ICONS.FIRE]: buildIcon(
    <path
      d="M15.45 22.65C17.25 16.65 12.15 12.75 12.15 12.75C12.15 12.75 9.00001 18.15 9.60001 22.65C7.20001 21.45 5.55001 19.8 4.80001 17.7C3.60001 14.55 4.50001 11.1 5.25001 9C5.85001 10.2 7.80001 12.15 7.80001 12.15L7.95001 10.5C8.55001 2.25 12.6 0.9 14.4 0.75C14.4 1.8 14.7 4.8 17.1 7.95C18.75 10.05 20.55 12.45 20.4 16.5C20.1 20.1 17.4 21.9 15.45 22.65Z"
      strokeMiterlimit="10"
    />
  ),
  [ICONS.FIRE_ACTIVE]: buildIcon(
    <path
      d="M11.3969 23.04C11.3969 23.04 18.4903 21.8396 18.9753 16.2795C19.3997 9.89148 14.2161 7.86333 13.2915 4.56586C13.1861 4.2261 13.1051 3.88045 13.049 3.53109C12.9174 2.68094 12.8516 1.82342 12.852 0.964865C12.852 0.964865 5.607 0.426785 4.87947 10.6227C4.34858 10.1469 3.92655 9.57999 3.63777 8.9548C3.349 8.32962 3.19921 7.65853 3.19706 6.98033C3.19706 6.98033 -4.32074 18.7767 8.45649 23.04C7.94555 22.1623 7.67841 21.1842 7.67841 20.1909C7.67841 19.1976 7.94555 18.2195 8.45649 17.3418C9.54778 15.0653 9.97218 13.8788 9.97218 13.8788C9.97218 13.8788 15.5044 18.6525 11.3969 23.04Z"
      fill="#d62912"
      strokeWidth="0"
    />
  ),
  [ICONS.SLIME]: buildIcon(
    <path
      d="M5.09998 23.25C2.84998 23.25 1.64998 20.55 3.14998 18.9C4.19998 17.85 8.24998 17.1 7.04998 14.7C6.14998 12.9 3.59998 15.75 2.09998 15C1.34998 14.7 1.19998 13.5 1.79998 12.75C2.39998 11.85 3.29998 12 4.19998 12.15C5.84998 12.45 7.94998 11.7 7.49998 9.60003C6.89998 7.35003 4.34998 6.45003 3.44998 4.35003C2.69998 2.25003 4.64998 -0.299968 6.89998 1.05003C8.69998 2.10003 8.39997 5.25003 9.29997 6.90003C10.2 8.40003 12 9.00003 13.2 7.65003C14.55 6.30003 14.55 3.15003 16.65 2.70003C18.45 2.25003 20.4 4.05003 19.5 5.85003C18.45 7.80003 15.15 7.80003 14.55 10.05C14.1 11.7 15.45 11.85 16.65 11.4C17.4 11.1 18.6 10.35 19.5 10.65C20.55 11.1 20.7 12.45 19.95 13.2C18.6 14.25 16.65 12.6 15.45 14.25C13.95 16.35 17.1 17.7 18.15 18.9C19.8 20.7 18.3 22.8 16.05 22.8C14.1 22.8 13.65 20.7 13.2 19.05C12.6 16.95 9.89997 15.3 8.54997 18C7.79997 19.8 8.24998 23.25 5.09998 23.25Z"
      strokeMiterlimit="10"
    />
  ),
  [ICONS.BELL]: buildIcon(
    <g>
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </g>
  ),
  [ICONS.BELL_ON]: buildIcon(
    <g>
      <path
        d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
        fill="currentColor"
      />
      <path d="M4.9162 1C2.45164 3.45929 1.8302 5.30812 1.76171 9.24794" />
      <path d="M18.7617 1C21.2263 3.45929 21.8477 5.30812 21.9162 9.24794" />
      <path d="M13.73 21C13.5542 21.3031 13.3018 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" />
    </g>
  ),
  [ICONS.PIN]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-6 0 26 24"
      width={props.size || '18'}
      height={props.size || '18'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11.3333333,6 C11.3333333,8.94666667 8.94666667,11.3333333 6,11.3333333 C3.056,11.3333333 0.666666667,8.94666667 0.666666667,6 C0.666666667,3.05466667 3.056,0.666666667 6,0.666666667 C8.94666667,0.666666667 11.3333333,3.05466667 11.3333333,6 L11.3333333,6 Z" />
      <line x1="6" y1="11.3333333" x2="6" y2="23.3333333" />
      <path d="M6,3.33333333 C7.47333333,3.33333333 8.66666667,4.528 8.66666667,6" />
    </svg>
  ),
  [ICONS.CONTROVERSIAL]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-6 0 26 24"
      width={props.size || '18'}
      height={props.size || '18'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11.52,11.55s1-1.64,4.28-2.27A4.19,4.19,0,0,0,18,2.13l0,0a4.19,4.19,0,0,0-7.15,2.17C10.13,7.55,8.5,8.53,8.5,8.53" />
      <path d="M14.74,15.33,4.62,5.21a1.64,1.64,0,0,0-2.32,0h0a1.64,1.64,0,0,0,0,2.32L12.42,17.65a1.64,1.64,0,0,0,2.32,0h0A1.64,1.64,0,0,0,14.74,15.33Z" />
      <line x1="6.75" y1="11.98" x2="7.97" y2="13.2" />
      <line x1="10.24" y1="15.46" x2="7.97" y2="13.2" />
      <line x1="6.75" y1="11.98" x2="4.49" y2="9.71" />
      <path d="M10.24,15.46A4.81,4.81,0,1,1,4.49,9.71L6.75,12A2.71,2.71,0,1,0,8,13.2Z" />
      <path d="M17.1,4.58a1.4,1.4,0,0,1-.28,1.77" />
    </svg>
  ),
  [ICONS.NEW]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-6 0 24 24"
      width={props.size || '18'}
      height={props.size || '18'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="6.65" cy="14.71" r="0.34" transform="translate(-0.5 0.24) rotate(-1.96)" />
      <circle cx="4.28" cy="16.8" r="0.43" transform="translate(-0.57 0.16) rotate(-1.96)" />
      <circle cx="3.5" cy="13.91" r="0.43" transform="translate(-0.47 0.13) rotate(-1.96)" />
      <path d="M14.12,2.43c.39-.35,1-.75,1.37-1.1" />
      <path d="M.83,15.17c.07,2.12,1.83,4.27,3.95,4.08,3.39-.31,6.09-4.7,6.09-4.7s-2.35,1.75-2.41.25a3.59,3.59,0,0,1,1.31-3,14.73,14.73,0,0,0,2.47-3.76c.11-.24-4.49,3.11-5.23,3.52-1.17.66-1.73-.85-1-1.68.48-.51,6.38-6,6.38-6L3.2,11S.76,13,.83,15.17Z" />
      <path d="M7.51,4.57l-.18-.51a1.54,1.54,0,0,0-1.15-1L5.64,3l.51-.18a1.54,1.54,0,0,0,1-1.15l.1-.53.18.51a1.54,1.54,0,0,0,1.15,1l.53.1-.51.18A1.54,1.54,0,0,0,7.61,4Z" />
      <path d="M15.48,17.56l-.15-.4a1.21,1.21,0,0,0-.91-.78L14,16.3l.4-.15a1.21,1.21,0,0,0,.78-.91l.08-.42.15.4a1.21,1.21,0,0,0,.91.78l.42.08-.4.15a1.21,1.21,0,0,0-.78.91Z" />
      <path d="M3.08,8.07,3,7.77a.87.87,0,0,0-.66-.56L2,7.15,2.31,7a.87.87,0,0,0,.56-.66l.06-.3.1.29a.87.87,0,0,0,.66.56L4,7l-.29.1a.87.87,0,0,0-.56.66Z" />
      <line x1="17.73" y1="6.78" x2="12.48" y2="12.52" />
      <line x1="14.55" y1="6.03" x2="19.13" y2="1.86" />
    </svg>
  ),
  [ICONS.BEST]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="-6 0 24 24"
      width={props.size || '18'}
      height={props.size || '18'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="10.05 3 11.5 5.94 14.75 6.42 12.4 8.71 12.96 11.95 10.05 10.42 7.14 11.95 7.7 8.71 5.34 6.42 8.6 5.94 10.05 3" />
      <circle cx="10" cy="7.66" r="7" />
      <polyline points="8.6 15.08 6.43 19.33 5.18 17.17 2.63 17.39 4.87 13" />
      <polyline points="14.94 12.98 17.37 17.09 14.88 16.99 13.7 19.26 11.19 15.03" />
    </svg>
  ),
  [ICONS.CREATOR_LIKE]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={props.size || '18'}
      height={props.size || '18'}
      fill="none"
      stroke="currentColor"
      strokeWidth="0"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g clipPath="url(#clip0)">
        <path
          d="M12 4.65882C11.0118 2.4 8.61176 0.564705 6.63529 0.141176C3.24706 -0.564707 0 2.11765 0 6.63529C0 11.2941 12 21.7412 12 21.7412C12 21.7412 24 11.4353 24 6.63529C24 2.11765 20.4706 -0.564707 17.0824 0.282352C15.1059 0.564705 12.7059 2.25882 12 4.65882Z"
          fill="url(#paint0_linear)"
        />
      </g>
      <defs>
        <linearGradient
          id="paint0_linear"
          x1="0.984988"
          y1="-1.58654"
          x2="28.1615"
          y2="20.8252"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.2395" stopColor="#FA3661" />
          <stop offset="0.6871" stopColor="#FFB420" />
        </linearGradient>
        <clipPath id="clip0">
          <rect width="24" height="21.7412" fill="white" />
        </clipPath>
      </defs>
    </svg>
  ),
  [ICONS.CHEF]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 26 24"
      width={props.size || '18'}
      height={props.size || '18'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m 5.8585986,19.685492 v 3.415632 c 0,0.269439 0.2185945,0.487951 0.4879486,0.487951 H 18.086586 c 0.270325,0 0.487946,-0.218539 0.45867,-0.487951 v -3.415632 z" />
      <path d="m 18.089706,2.6673324 c -0.458672,0 -0.914415,0.081053 -1.342833,0.2381801 -0.726068,-1.5175206 -2.625165,-2.67785413 -4.515474,-2.67785413 -1.902023,0 -3.8128297,1.16033353 -4.5408481,2.67785413 C 7.2621303,2.7483855 6.8063878,2.6673324 6.348691,2.6673324 c -2.1528256,0 -3.9045598,1.7507491 -3.9045598,3.9035835 0,2.0230385 1.4648199,3.6410591 3.4146614,3.8752841 v 8.262918 h 2.9276892 v -3.415632 c 0.00968,-0.26944 0.2273915,-0.487951 0.4977084,-0.487951 0.2693563,0 0.4879486,0.218539 0.4879486,0.487951 v 3.415632 h 1.9420352 v -4.391535 c 0,-0.269439 0.217626,-0.487951 0.487948,-0.487951 0.269357,0 0.487946,0.218539 0.487946,0.487951 v 4.391535 h 1.951795 v -3.415632 c 0.01964,-0.26944 0.238125,-0.487951 0.507465,-0.487951 0.270325,0 0.487949,0.218539 0.468432,0.487951 v 3.415632 h 2.927689 V 10.4462 c 1.980095,-0.234307 3.445891,-1.8522456 3.445891,-3.8752841 0,-2.1528344 -1.750758,-3.9035835 -3.901634,-3.9035835" />
    </svg>
  ),
  [ICONS.ANONYMOUS]: buildIcon(
    <g>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </g>
  ),
  [ICONS.WILD_WEST]: buildIcon(
    <g transform="matrix(1,0,0,1,0,0)">
      <path
        d="M12.546,23.25H11.454A10.7,10.7,0,0,1,2.161,7.235L3.75,4.453V2.25A1.5,1.5,0,0,1,5.25.75h3a1.5,1.5,0,0,1,1.5,1.5v3a2.988,2.988,0,0,1-.4,1.488L7.37,10.211a4.7,4.7,0,0,0,4.084,7.039h1.092a4.7,4.7,0,0,0,4.084-7.039L14.646,6.738a2.988,2.988,0,0,1-.4-1.488v-3a1.5,1.5,0,0,1,1.5-1.5h3a1.5,1.5,0,0,1,1.5,1.5v2.2l1.589,2.782A10.7,10.7,0,0,1,12.546,23.25Z"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12,19.875a.375.375,0,0,1,.375.375" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.625,20.25A.375.375,0,0,1,12,19.875" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12,20.625a.375.375,0,0,1-.375-.375" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12.375,20.25a.375.375,0,0,1-.375.375" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.813,17.313a.375.375,0,0,1,.529-.024" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17.836,17.843a.376.376,0,0,1-.023-.53" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.366,17.819a.375.375,0,0,1-.53.024" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18.342,17.289a.375.375,0,0,1,.024.53" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M19.843,11.294a.376.376,0,0,1,.34-.407" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.25,11.634a.375.375,0,0,1-.407-.34" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.59,11.227a.374.374,0,0,1-.34.407" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.183,10.887a.375.375,0,0,1,.407.34" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.187,17.313a.375.375,0,0,0-.529-.024" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.164,17.843a.376.376,0,0,0,.023-.53" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.634,17.819a.375.375,0,0,0,.53.024" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.658,17.289a.375.375,0,0,0-.024.53" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M4.157,11.294a.376.376,0,0,0-.34-.407" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.75,11.634a.375.375,0,0,0,.407-.34" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.41,11.227a.374.374,0,0,0,.34.407" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3.817,10.887a.375.375,0,0,0-.407.34" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20.25 4.5L18 4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 4.5L3.75 4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  ),
  [ICONS.PEACE]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={props.size || '18'}
      height={props.size || '16'}
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="matrix(1,0,0,1,0,0)">
        <path
          d="M0.500 12.000 A11.500 11.500 0 1 0 23.500 12.000 A11.500 11.500 0 1 0 0.500 12.000 Z"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.5,3.642a8.5,8.5,0,0,1,6.24,11.877L13.5,9.354Z"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.5,13.6l4.471,4.455A8.529,8.529,0,0,1,13.5,20.365Z"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M4.33,15.549,10.5,9.354V3.635A8.517,8.517,0,0,0,3.5,12,7.583,7.583,0,0,0,4.33,15.549Z"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M10.5,20.364a8.543,8.543,0,0,1-4.463-2.306L10.5,13.6Z"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  ),
  [ICONS.UNIVERSE]: (props: CustomProps) => (
    <svg {...props} width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="9.5" cy="9" r="6" />
      <path d="M4.5 11.5C1.99463 14.4395 1.38564 15.8881 1.99998 16.5C2.80192 17.2988 7.02663 14.7033 11.0697 10.6443C15.1127 6.58533 17.7401 2.64733 16.9382 1.84853C16.3751 1.28769 15 1.5 12.5 3.5" />
    </svg>
  ),
  [ICONS.CHEESE]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 25 24"
      width={props.size || '18'}
      height={props.size || '16'}
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="matrix(1,0,0,1,0,0)">
        <path
          d="M18.500 12.639 A1.500 1.500 0 1 0 21.500 12.639 A1.500 1.500 0 1 0 18.500 12.639 Z"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M5.000 14.139 A1.000 1.000 0 1 0 7.000 14.139 A1.000 1.000 0 1 0 5.000 14.139 Z"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M9.000 18.139 A2.000 2.000 0 1 0 13.000 18.139 A2.000 2.000 0 1 0 9.000 18.139 Z"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M23.5,8.493V19.761a1,1,0,0,1-.871.991l-21,2.74A1,1,0,0,1,.5,22.5a1.045,1.045,0,0,1,.686-.982A2,2,0,0,0,.5,17.639V11.945a1,1,0,0,1,.339-.751L12.709.749a1,1,0,0,1,.7-.248C17.854.674,23.5,3.642,23.5,8.493"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M23.5 8.493L0.616 11.478" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path
          d="M18,17.389a.25.25,0,1,1-.25.25.25.25,0,0,1,.25-.25"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M13.5,12.889a.25.25,0,1,1-.25.25.25.25,0,0,1,.25-.25"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  ),
  [ICONS.PORK_BUN]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 25 24"
      width={props.size || '18'}
      height={props.size || '16'}
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="matrix(1,0,0,1,0,0)">
        <path
          d="M11.247,5.3a1,1,0,0,1,1.507,0C15.378,8.3,23.5,11.518,23.5,16.5c0,5.706-5.794,7-11.5,7S.5,22.206.5,16.5C.5,11.518,8.623,8.3,11.247,5.3Z"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M10,9.874a13.068,13.068,0,0,1-2.559,2.12" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14,9.874a13.068,13.068,0,0,0,2.559,2.12" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 10.5L12 12.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6,.5C4.5,2,7.5,3,6,4.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18,.5c1.5,1.5-1.5,2.5,0,4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  ),
  [ICONS.MIND_BLOWN]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 25 24"
      width={props.size || '18'}
      height={props.size || '16'}
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <g transform="matrix(1,0,0,1,0,0)">
        <path
          d="M21.2,5a3.034,3.034,0,0,0-3.067-3,3.077,3.077,0,0,0-1.847.62,5.392,5.392,0,0,0-8.572,0A3.077,3.077,0,0,0,5.867,2,3.034,3.034,0,0,0,2.8,5"
          fill="none"
        />
        <path d="M2.8,5a2.251,2.251,0,1,0,0,4.5H5.5" fill="none" />
        <path d="M21.2,5a2.251,2.251,0,1,1,0,4.5H18.5" fill="none" />
        <path d="M8.5,7.5V9.366A3.134,3.134,0,0,1,5.366,12.5" fill="none" />
        <path d="M15.5,7.5V9.366A3.134,3.134,0,0,0,18.634,12.5" fill="none" />
        <path d="M10.5 8.5L10.5 10.5" fill="none" />
        <path d="M13.5 8.5L13.5 10.5" fill="none" />
        <path d="M8.5,15.75a.25.25,0,1,1-.25.25.25.25,0,0,1,.25-.25" fill="none" />
        <path d="M15.5,15.75a.25.25,0,1,1-.25.25.25.25,0,0,1,.25-.25" fill="none" />
        <path d="M12,17.5A1.5,1.5,0,0,0,10.5,19v1a1.5,1.5,0,0,0,3,0V19A1.5,1.5,0,0,0,12,17.5Z" fill="none" />
        <path d="M18.634,12.5S18,13.5,12,13.5s-6.634-1-6.634-1a7.5,7.5,0,1,0,13.268,0Z" fill="none" />
      </g>
    </svg>
  ),
  [ICONS.MOVIES]: (props: IconProps) => (
    <svg {...props} width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 19.25C5.86193 19.25 5.75 19.1381 5.75 19V13C5.75 12.8619 5.86193 12.75 6 12.75H15C15.1381 12.75 15.25 12.8619 15.25 13V19C15.25 19.1381 15.1381 19.25 15 19.25H6ZM6 7.25C5.86193 7.25 5.75 7.13807 5.75 7V1C5.75 0.861928 5.86193 0.75 6 0.75H15C15.1381 0.75 15.25 0.861929 15.25 1V7C15.25 7.13807 15.1381 7.25 15 7.25H6ZM19.75 0.75H20.25V1.25H19.75V0.75ZM0.75 0.75H1.25V1.25H0.75V0.75ZM19.75 6.75H20.25V7.25H19.75V6.75ZM0.75 6.75H1.25V7.25H0.75V6.75ZM19.75 12.75H20.25V13.25H19.75V12.75ZM0.75 12.75H1.25V13.25H0.75V12.75ZM19.75 18.75H20.25V19.25H19.75V18.75ZM0.75 18.75H1.25V19.25H0.75V18.75Z" />
    </svg>
  ),
  [ICONS.GOLIVE]: (props: CustomProps) => (
    <svg
      {...props}
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      viewBox="0 0 27 27"
      stroke="currentColor"
      width={props.size || '18'}
      height={props.size || '16'}
      className={props.className}
    >
      <g transform="translate(0,1.6)">
        <path d="M2 25V18.4545H2.98757V24.1499H5.95348V25H2Z" />
        <path d="M9.41765 18.4545V25H8.43008V18.4545H9.41765Z" />
        <path d="M12.7779 18.4545L14.5997 23.7855H14.6732L16.4949 18.4545H17.5624L15.2069 25H14.0659L11.7105 18.4545H12.7779Z" />
        <path d="M19.8576 25V18.4545H23.9613V19.3047H20.8452V21.299H23.7472V22.146H20.8452V24.1499H23.9997V25H19.8576Z" />
      </g>
      <g clipPath="url(#clip0_1_28)" transform="translate(-5,-3) scale(1.4)">
        <path
          d="M19.4167 4.08333L15.3333 6.99999L19.4167 9.91666V4.08333Z"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="transparent"
        />
        <path
          d="M14.1667 2.91666H7.75C7.10567 2.91666 6.58334 3.439 6.58334 4.08333V9.91666C6.58334 10.561 7.10567 11.0833 7.75 11.0833H14.1667C14.811 11.0833 15.3333 10.561 15.3333 9.91666V4.08333C15.3333 3.439 14.811 2.91666 14.1667 2.91666Z"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="transparent"
        />
      </g>
      <defs>
        <clipPath id="clip0_1_28">
          <rect width="14" height="14" transform="translate(6)" />
        </clipPath>
      </defs>
    </svg>
  ),
  [ICONS.LIVESTREAM]: (props: CustomProps) => (
    <svg
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      viewBox="0 0 36 36"
      width={props.size || '18'}
      height={props.size || '16'}
      className={props.className}
    >
      <g id="XMLID_505_">
        <linearGradient
          id="XMLID_420_"
          gradientUnits="userSpaceOnUse"
          x1="-519.065"
          y1="1525.4059"
          x2="-508.6628"
          y2="1525.4059"
        >
          <stop offset="1.970443e-002" stopColor="#FFC200" />
          <stop offset="0.3866" stopColor="#FF31BD" />
          <stop offset="0.6245" stopColor="#8E31BD" />
          <stop offset="0.7758" stopColor="#6E8EDE" />
          <stop offset="1" stopColor="#57EABA" />
        </linearGradient>
        <circle
          id="XMLID_508_"
          fill="none"
          stroke="url(XMLID_420_)"
          strokeWidth="2.4678"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeMiterlimit="10"
          cx="-513.9"
          cy="1525.4"
          r="4"
        />
        <path
          id="XMLID_507_"
          fill="#FF7B5B"
          d="M-521,1518.3c-1.8,1.8-2.9,4.3-2.9,7.1c0,2.6,1,4.9,2.5,6.7L-521,1518.3z"
        />
        <path
          id="XMLID_506_"
          fill="#FF7B5B"
          d="M-506.9,1532.1c1.8-1.8,2.9-4.3,2.9-7.1c0-2.6-1-4.9-2.5-6.7L-506.9,1532.1z"
        />
      </g>
      <rect id="XMLID_125_" x="0" y="0" fill="none" width="36" height="36" stroke="none" />
      {/* }//fill="#FFFFFF" */}
      <linearGradient
        id="XMLID_421_"
        gradientUnits="userSpaceOnUse"
        x1="-1625.151"
        y1="-2518.4661"
        x2="-1596.6696"
        y2="-2518.4661"
        gradientTransform="matrix(-1 0 0 -1 -1589.489 -2500.4661)"
      >
        <stop offset="1.970443e-002" stopColor="#FFC200" />
        <stop offset="0.4731" stopColor="#FF31BD" />
        <stop offset="0.6947" stopColor="#8E31BD" />
        <stop offset="1" stopColor="#57EABA" />
      </linearGradient>
      <path
        id="XMLID_124_"
        fill="none"
        stroke="url(#XMLID_421_)"
        strokeWidth="2.94"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
        d="M21.4,5.2L21.4,5.2c7.1,0,12.8,5.7,12.8,12.8v0c0,7.1-5.7,12.8-12.8,12.8H8.7V18C8.7,10.9,14.4,5.2,21.4,5.2z"
      />
      <linearGradient id="XMLID_422_" gradientUnits="userSpaceOnUse" x1="18.041" y1="32.147" x2="38.7776" y2="-0.9289">
        <stop offset="1.970443e-002" stopColor="#FFC200" />
        <stop offset="0.4731" stopColor="#FF31BD" />
        <stop offset="0.6947" stopColor="#8E31BD" />
        <stop offset="1" stopColor="#57EABA" />
      </linearGradient>
      <rect id="XMLID_123_" x="26.9" y="13.8" fill="url(#XMLID_422_)" stroke="none" width="2.8" height="3.8" />
      <linearGradient
        id="XMLID_423_"
        gradientUnits="userSpaceOnUse"
        x1="13.0856"
        y1="29.0402"
        x2="33.8223"
        y2="-4.0356"
      >
        <stop offset="1.970443e-002" stopColor="#FFC200" />
        <stop offset="0.4731" stopColor="#FF31BD" />
        <stop offset="0.6947" stopColor="#8E31BD" />
        <stop offset="1" stopColor="#57EABA" />
      </linearGradient>
      <rect id="XMLID_122_" x="20" y="13.8" fill="url(#XMLID_422_)" stroke="none" width="2.8" height="3.8" />
      <linearGradient id="XMLID_424_" gradientUnits="userSpaceOnUse" x1="0.338" y1="17.7555" x2="17.2654" y2="17.7555">
        <stop offset="1.970443e-002" stopColor="#FFC200" />
        <stop offset="0.4731" stopColor="#FF31BD" />
        <stop offset="0.6947" stopColor="#8E31BD" />
        <stop offset="1" stopColor="#57EABA" />
      </linearGradient>
      <circle
        id="XMLID_121_"
        fill="none"
        stroke="#6E8EDE"
        strokeWidth="2.94"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
        cx="8.8"
        cy="17.8"
        r="6"
      />
    </svg>
  ),
  [ICONS.LIVESTREAM_SOLID]: (props: CustomProps) => (
    <svg
      id="prefix__Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      x={0}
      y={0}
      fill="none"
      width={props.size || '18'}
      height={props.size || '16'}
      viewBox="0 0 36 36"
      xmlSpace="preserve"
      {...props}
    >
      <style>{'.prefix__st1{fill:#ff7b5b}.prefix__st3{fill:#79d1b6}'}</style>
      <g id="prefix__XMLID_505_">
        <linearGradient
          id="prefix__XMLID_410_"
          gradientUnits="userSpaceOnUse"
          x1={-571.815}
          y1={1525.406}
          x2={-561.413}
          y2={1525.406}
        >
          <stop offset={0.02} stopColor="#ffc200" />
          <stop offset={0.387} stopColor="#ff31bd" />
          <stop offset={0.625} stopColor="#8e31bd" />
          <stop offset={0.776} stopColor="#6e8ede" />
          <stop offset={1} stopColor="#57eaba" />
        </linearGradient>
        <circle
          id="prefix__XMLID_508_"
          cx={-566.6}
          cy={1525.4}
          r={4}
          fill="none"
          stroke="url(#prefix__XMLID_410_)"
          strokeWidth={2.468}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeMiterlimit={10}
        />
        <path
          id="prefix__XMLID_507_"
          className="prefix__st1"
          d="M-573.7 1518.3c-1.8 1.8-2.9 4.3-2.9 7.1 0 2.6 1 4.9 2.5 6.7l.4-13.8z"
        />
        <path
          id="prefix__XMLID_506_"
          className="prefix__st1"
          d="M-559.6 1532.1c1.8-1.8 2.9-4.3 2.9-7.1 0-2.6-1-4.9-2.5-6.7l-.4 13.8z"
        />
      </g>
      <path
        id="prefix__XMLID_20_"
        d="M21.4 5.2h0c7.1 0 12.8 5.7 12.8 12.8v0c0 7.1-5.7 12.8-12.8 12.8H8.7V18c0-7.1 5.7-12.8 12.7-12.8z"
        fill="none"
        stroke="#e729e1"
        strokeWidth={2.94}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
      />
      <path id="prefix__XMLID_19_" className="prefix__st3" stroke="none" d="M26.9 13.8h2.8v3.8h-2.8z" />
      <path id="prefix__XMLID_18_" className="prefix__st3" stroke="none" d="M20 13.8h2.8v3.8H20z" />
      <circle
        id="prefix__XMLID_17_"
        cx={8.8}
        cy={17.8}
        r={6}
        fill="none"
        stroke="#ffa100"
        strokeWidth={2.94}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
      />
    </svg>
  ),
  [ICONS.LIVESTREAM_MONOCHROME]: (props: CustomProps) => (
    <svg
      id="prefix__Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      x={0}
      y={0}
      fill="currentColor"
      stroke="currentColor"
      width={props.size || '18'}
      height={props.size || '16'}
      viewBox="0 0 36 36"
      xmlSpace="preserve"
      {...props}
    >
      <g id="prefix__XMLID_505_">
        <linearGradient
          id="prefix__XMLID_410_"
          gradientUnits="userSpaceOnUse"
          x1={-571.815}
          y1={1525.406}
          x2={-561.413}
          y2={1525.406}
        >
          <stop offset={0.02} stopColor="#ffc200" />
          <stop offset={0.387} stopColor="#ff31bd" />
          <stop offset={0.625} stopColor="#8e31bd" />
          <stop offset={0.776} stopColor="#6e8ede" />
          <stop offset={1} stopColor="#57eaba" />
        </linearGradient>
      </g>
      <path
        id="prefix__XMLID_20_"
        d="M21.4 5.2h0c7.1 0 12.8 5.7 12.8 12.8v0c0 7.1-5.7 12.8-12.8 12.8H8.7V18c0-7.1 5.7-12.8 12.7-12.8z"
        fill="none"
        strokeWidth={2.94}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
      />
      <path id="prefix__XMLID_19_" d="M26.9 13.8h2.8v3.8h-2.8z" />
      <path id="prefix__XMLID_18_" d="M20 13.8h2.8v3.8H20z" />
      <circle
        id="prefix__XMLID_17_"
        cx={8.8}
        cy={17.8}
        r={6}
        fill="none"
        strokeWidth={2.94}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
      />
    </svg>
  ),

  [ICONS.LIVESTREAM]: (props: CustomProps) => (
    <svg
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      viewBox="0 0 36 36"
      width={props.size || '18'}
      height={props.size || '16'}
    >
      <g id="XMLID_505_">
        <linearGradient
          id="XMLID_420_"
          gradientUnits="userSpaceOnUse"
          x1="-519.065"
          y1="1525.4059"
          x2="-508.6628"
          y2="1525.4059"
        >
          <stop offset="1.970443e-002" stopColor="#FFC200" />
          <stop offset="0.3866" stopColor="#FF31BD" />
          <stop offset="0.6245" stopColor="#8E31BD" />
          <stop offset="0.7758" stopColor="#6E8EDE" />
          <stop offset="1" stopColor="#57EABA" />
        </linearGradient>
        <circle
          id="XMLID_508_"
          fill="none"
          stroke="url(XMLID_420_)"
          strokeWidth="2.4678"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeMiterlimit="10"
          cx="-513.9"
          cy="1525.4"
          r="4"
        />
        <path
          id="XMLID_507_"
          fill="#FF7B5B"
          d="M-521,1518.3c-1.8,1.8-2.9,4.3-2.9,7.1c0,2.6,1,4.9,2.5,6.7L-521,1518.3z"
        />
        <path
          id="XMLID_506_"
          fill="#FF7B5B"
          d="M-506.9,1532.1c1.8-1.8,2.9-4.3,2.9-7.1c0-2.6-1-4.9-2.5-6.7L-506.9,1532.1z"
        />
      </g>
      <rect id="XMLID_125_" x="0" y="0" fill="none" width="36" height="36" stroke="none" />
      {/* }//fill="#FFFFFF" */}
      <linearGradient
        id="XMLID_421_"
        gradientUnits="userSpaceOnUse"
        x1="-1625.151"
        y1="-2518.4661"
        x2="-1596.6696"
        y2="-2518.4661"
        gradientTransform="matrix(-1 0 0 -1 -1589.489 -2500.4661)"
      >
        <stop offset="1.970443e-002" stopColor="#FFC200" />
        <stop offset="0.4731" stopColor="#FF31BD" />
        <stop offset="0.6947" stopColor="#8E31BD" />
        <stop offset="1" stopColor="#57EABA" />
      </linearGradient>
      <path
        id="XMLID_124_"
        fill="none"
        stroke="url(#XMLID_421_)"
        strokeWidth="2.94"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
        d="M21.4,5.2L21.4,5.2c7.1,0,12.8,5.7,12.8,12.8v0c0,7.1-5.7,12.8-12.8,12.8H8.7V18C8.7,10.9,14.4,5.2,21.4,5.2z"
      />
      <linearGradient id="XMLID_422_" gradientUnits="userSpaceOnUse" x1="18.041" y1="32.147" x2="38.7776" y2="-0.9289">
        <stop offset="1.970443e-002" stopColor="#FFC200" />
        <stop offset="0.4731" stopColor="#FF31BD" />
        <stop offset="0.6947" stopColor="#8E31BD" />
        <stop offset="1" stopColor="#57EABA" />
      </linearGradient>
      <rect id="XMLID_123_" x="26.9" y="13.8" fill="url(#XMLID_422_)" stroke="none" width="2.8" height="3.8" />
      <linearGradient
        id="XMLID_423_"
        gradientUnits="userSpaceOnUse"
        x1="13.0856"
        y1="29.0402"
        x2="33.8223"
        y2="-4.0356"
      >
        <stop offset="1.970443e-002" stopColor="#FFC200" />
        <stop offset="0.4731" stopColor="#FF31BD" />
        <stop offset="0.6947" stopColor="#8E31BD" />
        <stop offset="1" stopColor="#57EABA" />
      </linearGradient>
      <rect id="XMLID_122_" x="20" y="13.8" fill="url(#XMLID_422_)" stroke="none" width="2.8" height="3.8" />
      <linearGradient id="XMLID_424_" gradientUnits="userSpaceOnUse" x1="0.338" y1="17.7555" x2="17.2654" y2="17.7555">
        <stop offset="1.970443e-002" stopColor="#FFC200" />
        <stop offset="0.4731" stopColor="#FF31BD" />
        <stop offset="0.6947" stopColor="#8E31BD" />
        <stop offset="1" stopColor="#57EABA" />
      </linearGradient>
      <circle
        id="XMLID_121_"
        fill="none"
        stroke="#6E8EDE"
        strokeWidth="2.94"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit="10"
        cx="8.8"
        cy="17.8"
        r="6"
      />
    </svg>
  ),
  [ICONS.LIVESTREAM_SOLID]: (props: CustomProps) => (
    <svg
      id="prefix__Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      x={0}
      y={0}
      fill="none"
      width={props.size || '18'}
      height={props.size || '16'}
      viewBox="0 0 36 36"
      xmlSpace="preserve"
      {...props}
    >
      <style>{'.prefix__st1{fill:#ff7b5b}.prefix__st3{fill:#79d1b6}'}</style>
      <g id="prefix__XMLID_505_">
        <linearGradient
          id="prefix__XMLID_410_"
          gradientUnits="userSpaceOnUse"
          x1={-571.815}
          y1={1525.406}
          x2={-561.413}
          y2={1525.406}
        >
          <stop offset={0.02} stopColor="#ffc200" />
          <stop offset={0.387} stopColor="#ff31bd" />
          <stop offset={0.625} stopColor="#8e31bd" />
          <stop offset={0.776} stopColor="#6e8ede" />
          <stop offset={1} stopColor="#57eaba" />
        </linearGradient>
        <circle
          id="prefix__XMLID_508_"
          cx={-566.6}
          cy={1525.4}
          r={4}
          fill="none"
          stroke="url(#prefix__XMLID_410_)"
          strokeWidth={2.468}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeMiterlimit={10}
        />
        <path
          id="prefix__XMLID_507_"
          className="prefix__st1"
          d="M-573.7 1518.3c-1.8 1.8-2.9 4.3-2.9 7.1 0 2.6 1 4.9 2.5 6.7l.4-13.8z"
        />
        <path
          id="prefix__XMLID_506_"
          className="prefix__st1"
          d="M-559.6 1532.1c1.8-1.8 2.9-4.3 2.9-7.1 0-2.6-1-4.9-2.5-6.7l-.4 13.8z"
        />
      </g>
      <path
        id="prefix__XMLID_20_"
        d="M21.4 5.2h0c7.1 0 12.8 5.7 12.8 12.8v0c0 7.1-5.7 12.8-12.8 12.8H8.7V18c0-7.1 5.7-12.8 12.7-12.8z"
        fill="none"
        stroke="#e729e1"
        strokeWidth={2.94}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
      />
      <path id="prefix__XMLID_19_" className="prefix__st3" stroke="none" d="M26.9 13.8h2.8v3.8h-2.8z" />
      <path id="prefix__XMLID_18_" className="prefix__st3" stroke="none" d="M20 13.8h2.8v3.8H20z" />
      <circle
        id="prefix__XMLID_17_"
        cx={8.8}
        cy={17.8}
        r={6}
        fill="none"
        stroke="#ffa100"
        strokeWidth={2.94}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeMiterlimit={10}
      />
    </svg>
  ),
  [ICONS.STACK]: (props: CustomProps) => (
    <svg
      {...props}
      viewBox="0 0 24 24"
      width={props.size || '18'}
      height={props.size || '18'}
      xmlns="http://www.w3.org/2000/svg"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
      fill="none"
    >
      <g transform="matrix(1,0,0,1,0,0)">
        <path d="M22.91,6.953,12.7,1.672a1.543,1.543,0,0,0-1.416,0L1.076,6.953a.615.615,0,0,0,0,1.094l10.209,5.281a1.543,1.543,0,0,0,1.416,0L22.91,8.047a.616.616,0,0,0,0-1.094Z" />
        <path d="M.758,12.75l10.527,5.078a1.543,1.543,0,0,0,1.416,0L23.258,12.75" />
        <path d="M.758,17.25l10.527,5.078a1.543,1.543,0,0,0,1.416,0L23.258,17.25" />
      </g>
    </svg>
  ),
  [ICONS.TIME]: (props: CustomProps) => (
    <svg
      {...props}
      viewBox="0 0 24 24"
      width={props.size || '18'}
      height={props.size || '18'}
      xmlns="http://www.w3.org/2000/svg"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
      fill="none"
      style={{ overflow: 'visible' }}
    >
      <g transform="matrix(1,0,0,1,0,0)">
        <path d="M1.500 12.000 A10.500 10.500 0 1 0 22.500 12.000 A10.500 10.500 0 1 0 1.500 12.000 Z" />
        <path d="M12 12L12 8.25" />
        <path d="M12 12L16.687 16.688" />
      </g>
    </svg>
  ),
  [ICONS.RSS]: buildIcon(
    <g>
      <path d="M.75 19.497a3.75 3.75 0 107.5 0 3.75 3.75 0 10-7.5 0zM.75 8.844a11.328 11.328 0 0114.4 14.4M.75 1.113a18.777 18.777 0 0122.139 22.123" />
    </g>
  ),
  [ICONS.APPEARANCE]: buildIcon(
    <g>
      <path d="M16.022,15.624c.3,3.856,6.014,1.2,5.562,2.54-2.525,7.481-12.648,5.685-16.966,1.165A10.9,10.9,0,0,1,4.64,4.04C8.868-.188,16.032-.495,19.928,4.018,27.56,12.858,15.758,12.183,16.022,15.624Z" />
      <path d="M5.670 13.309 A1.520 1.520 0 1 0 8.710 13.309 A1.520 1.520 0 1 0 5.670 13.309 Z" />
      <path d="M9.430 18.144 A1.520 1.520 0 1 0 12.470 18.144 A1.520 1.520 0 1 0 9.430 18.144 Z" />
      <path d="M13.066 5.912 A1.520 1.520 0 1 0 16.106 5.912 A1.520 1.520 0 1 0 13.066 5.912 Z" />
      <path d="M6.620 7.524 A1.520 1.520 0 1 0 9.660 7.524 A1.520 1.520 0 1 0 6.620 7.524 Z" />
    </g>
  ),
  [ICONS.CONTENT]: buildIcon(
    <g>
      <path d="M15.750 16.500 A1.500 1.500 0 1 0 18.750 16.500 A1.500 1.500 0 1 0 15.750 16.500 Z" />
      <path d="M18.524,10.7l.442,1.453a.994.994,0,0,0,1.174.681l1.472-.341a1.339,1.339,0,0,1,1.275,2.218l-1.031,1.111a1,1,0,0,0,0,1.362l1.031,1.111a1.339,1.339,0,0,1-1.275,2.218l-1.472-.341a.994.994,0,0,0-1.174.681L18.524,22.3a1.33,1.33,0,0,1-2.548,0l-.442-1.453a.994.994,0,0,0-1.174-.681l-1.472.341a1.339,1.339,0,0,1-1.275-2.218l1.031-1.111a1,1,0,0,0,0-1.362l-1.031-1.111a1.339,1.339,0,0,1,1.275-2.218l1.472.341a.994.994,0,0,0,1.174-.681l.442-1.453A1.33,1.33,0,0,1,18.524,10.7Z" />
      <path d="M8.25,20.25h-6a1.5,1.5,0,0,1-1.5-1.5V2.25A1.5,1.5,0,0,1,2.25.75H12.879a1.5,1.5,0,0,1,1.06.439l2.872,2.872a1.5,1.5,0,0,1,.439,1.06V6.75" />
      <path d="M6.241,12.678a.685.685,0,0,1-.991-.613V7.435a.685.685,0,0,1,.991-.613l4.631,2.316a.684.684,0,0,1,0,1.224Z" />
    </g>
  ),
  [ICONS.STAR]: buildIcon(
    <g>
      <path d="M12.729 1.2l3.346 6.629 6.44.638a.805.805 0 01.5 1.374l-5.3 5.253 1.965 7.138a.813.813 0 01-1.151.935L12 19.934l-6.52 3.229a.813.813 0 01-1.151-.935l1.965-7.138L.99 9.837a.805.805 0 01.5-1.374l6.44-.638L11.271 1.2a.819.819 0 011.458 0z" />
    </g>
  ),
  [ICONS.MUSIC]: (props: IconProps) => (
    <svg {...props} width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.5 14.5V5.26667L17.5 2V12.5M7 16C7 17.6569 5.65685 19 4 19C2.34315 19 1 17.6569 1 16C1 14.3431 2.34315 13 4 13C5.65685 13 7 14.3431 7 16ZM18 14C18 15.6569 16.6569 17 15 17C13.3431 17 12 15.6569 12 14C12 12.3431 13.3431 11 15 11C16.6569 11 18 12.3431 18 14Z" />
    </svg>
  ),
  [ICONS.BADGE_SPROUT]: (props: IconProps) => (
    <svg
      {...props}
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlSpace="preserve"
    >
      <g transform="scale(.6)">
        <path
          fill="#77B255"
          d="M22.911 14.398c-1.082.719-2.047 1.559-2.88 2.422-.127-4.245-1.147-9.735-6.772-12.423C12.146-1.658-.833 1.418.328 2.006c2.314 1.17 3.545 4.148 5.034 5.715 2.653 2.792 5.603 2.964 7.071.778 3.468 2.254 3.696 6.529 3.59 11.099-.012.505-.023.975-.023 1.402v14c0 1.104 4 1.104 4 0V23.51c.542-.954 2.122-3.505 4.43-5.294 1.586 1.393 4.142.948 6.463-1.495 1.489-1.567 2.293-4.544 4.607-5.715 1.221-.618-12.801-3.994-12.589 3.392z"
        />
      </g>
    </svg>
  ),
  [ICONS.BADGE_MOD]: (props: IconProps) => (
    <svg
      {...props}
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlSpace="preserve"
    >
      <style type="text/css">
        {'.st0--badge-mod{fill:#ff3850}.st1--badge-mod{fill:#181021}.st2--badge-mod{fill:#FFFFFF}'}
      </style>
      <g>
        <g>
          <path
            className="st0--badge-mod"
            d="M11.69,6.77c4.86,0,7.55,0.9,8.52,1.31c1.29-1.46,3.28-4.14,3.28-6.76c0,0-4.17,4.86-6.92,5.12 c-1.25-0.87-2.77-1.38-4.41-1.38c0,0-3.21-0.06-4.63,1.31C4.81,6.44,0.51,1.32,0.51,1.32c0,2.61,1.97,5.27,3.25,6.74 C4.71,7.59,7.03,6.77,11.69,6.77z M19.87,19.38c0.02-0.13,0.04-0.27,0.04-0.4V12.8c0-1.03-0.21-2.02-0.58-2.92 c-0.83-0.33-3.25-1.11-7.64-1.11c-4.29,0-6.33,0.75-7,1.06c-0.38,0.91-0.6,1.91-0.6,2.97v6.18c0,0.13,0.02,0.26,0.04,0.39 C1.6,19.73,0,22.54,0,22.54L12,24l12-1.46C24,22.54,22.36,19.79,19.87,19.38z"
          />
        </g>
      </g>
      <path
        className="st1--badge-mod"
        d="M13,18.57H11c-2.27,0-4.12-0.82-4.12-2.88v-2.46c0-2.77,2.17-3.94,5.11-3.94s5.11,1.17,5.11,3.94v2.46 C17.11,17.75,15.27,18.57,13,18.57z"
      />
      <path
        className="st2--badge-mod"
        d="M15.06,15.25c-0.28,0-0.5-0.22-0.5-0.5v-1.42c0-0.32,0-1.31-1.63-1.31c-0.28,0-0.5-0.22-0.5-0.5 s0.22-0.5,0.5-0.5c1.65,0,2.63,0.86,2.63,2.31v1.42C15.56,15.02,15.33,15.25,15.06,15.25z"
      />
    </svg>
  ),
  [ICONS.BADGE_ADMIN]: (props: IconProps) => (
    <svg
      {...props}
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      xmlSpace="preserve"
    >
      <style type="text/css">
        {'.st0--badge-admin{fill:#fe7500}.st1--badge-admin{fill:#181021}.st2--badge-admin{fill:#FFFFFF}'}
      </style>
      <g>
        <g>
          <path
            className="st0--badge-admin"
            d="M11.69,6.77c4.86,0,7.55,0.9,8.52,1.31c1.29-1.46,3.28-4.14,3.28-6.76c0,0-4.17,4.86-6.92,5.12 c-1.25-0.87-2.77-1.38-4.41-1.38c0,0-3.21-0.06-4.63,1.31C4.81,6.44,0.51,1.32,0.51,1.32c0,2.61,1.97,5.27,3.25,6.74 C4.71,7.59,7.03,6.77,11.69,6.77z M19.87,19.38c0.02-0.13,0.04-0.27,0.04-0.4V12.8c0-1.03-0.21-2.02-0.58-2.92 c-0.83-0.33-3.25-1.11-7.64-1.11c-4.29,0-6.33,0.75-7,1.06c-0.38,0.91-0.6,1.91-0.6,2.97v6.18c0,0.13,0.02,0.26,0.04,0.39 C1.6,19.73,0,22.54,0,22.54L12,24l12-1.46C24,22.54,22.36,19.79,19.87,19.38z"
          />
        </g>
      </g>
      <path
        className="st1--badge-admin"
        d="M13,18.57H11c-2.27,0-4.12-0.82-4.12-2.88v-2.46c0-2.77,2.17-3.94,5.11-3.94s5.11,1.17,5.11,3.94v2.46 C17.11,17.75,15.27,18.57,13,18.57z"
      />
      <path
        className="st2--badge-admin"
        d="M15.06,15.25c-0.28,0-0.5-0.22-0.5-0.5v-1.42c0-0.32,0-1.31-1.63-1.31c-0.28,0-0.5-0.22-0.5-0.5 s0.22-0.5,0.5-0.5c1.65,0,2.63,0.86,2.63,2.31v1.42C15.56,15.02,15.33,15.25,15.06,15.25z"
      />
    </svg>
  ),
  [ICONS.BADGE_STREAMER]: (props: IconProps) => (
    <svg
      {...props}
      version="1.1"
      id="Layer_1"
      xmlns="http://www.w3.org/2000/svg"
      xmlnsXlink="http://www.w3.org/1999/xlink"
      x="0px"
      y="0px"
      width="24"
      height="24"
      viewBox="-1182 401 24 24"
      xmlSpace="preserve"
    >
      <style type="text/css">
        {
          '.st0--badge-streamer{fill:#FF5490}.st1--badge-streamer{fill:#81BBB9}.st2--badge-streamer{fill:#2E2A2F}.st3--badge-streamer{fill:#FFFFFF}'
        }
      </style>
      <path
        className="st0--badge-streamer"
        d="M-1169.8,406.4c-4.3,0-7.8,3.5-7.8,7.8c0,0.4,0,0.8,0.1,1.1h1c-0.1-0.4-0.1-0.7-0.1-1.1c0-3.7,3-6.8,6.8-6.8 s6.8,3,6.8,6.8c0,0.4,0,0.8-0.1,1.1h1c0.1-0.4,0.1-0.7,0.1-1.1C-1162.1,409.9-1165.5,406.4-1169.8,406.4z"
      />
      <path
        className="st0--badge-streamer"
        d="M-1180,414.2c0-5.6,4.6-10.2,10.2-10.2c5.6,0,10.2,4.6,10.2,10.2c0,2.2-0.7,4.3-1.9,5.9l0.8,0.6 c1.3-1.8,2.1-4.1,2.1-6.5c0-6.2-5-11.2-11.2-11.2c-6.2,0-11.2,5-11.2,11.2c0,2.1,0.6,4.1,1.6,5.8l1-0.3 C-1179.4,418-1180,416.2-1180,414.2z"
      />
      <path className="st1--badge-streamer" d="M-1163.7,419.4" />
      <path
        className="st1--badge-streamer"
        d="M-1165.6,418.5c0-0.1,0-3.6,0-3.6c0-1.9-1-4.3-4.4-4.3s-4.4,2.4-4.4,4.3c0,0,0,3.6,0,3.6 c-1.4,0.2-1.8,0.7-1.8,0.7s2.2,2.7,6.2,2.7s6.2-2.7,6.2-2.7S-1164.2,418.7-1165.6,418.5z"
      />
      <path
        className="st2--badge-streamer"
        d="M-1169.2,418.5h-1.5c-1.7,0-3.1-0.6-3.1-2.2v-1.9c0-2.1,1.6-3,3.9-3s3.9,0.9,3.9,3v1.9 C-1166.1,417.8-1167.5,418.5-1169.2,418.5z"
      />
      <path
        className="st3--badge-streamer"
        d="M-1167.8,416.2c-0.2,0-0.4-0.2-0.4-0.4v-1.1c0-0.2,0-1-1.2-1c-0.2,0-0.4-0.2-0.4-0.4s0.2-0.4,0.4-0.4 c1.2,0,2,0.6,2,1.7v1.1C-1167.4,416.1-1167.6,416.2-1167.8,416.2z"
      />
    </svg>
  ),
  [ICONS.PLAY]: buildIcon(<polygon points="5 3 19 12 5 21 5 3" />),
  [ICONS.PLAY_PREVIOUS]: buildIcon(
    <g>
      <polygon points="19 20 9 12 19 4 19 20" />
      <line x1="5" y1="19" x2="5" y2="5" />
    </g>
  ),
  [ICONS.REPLAY]: buildIcon(
    <g>
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </g>
  ),
  [ICONS.REPEAT]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...otherProps } = props;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
        {...otherProps}
      >
        <polyline stroke={color} points="17 1 21 5 17 9" />
        <path stroke={color} d="M3 11V9a4 4 0 0 1 4-4h14" />
        <polyline stroke={color} points="7 23 3 19 7 15" />
        <path stroke={color} d="M21 13v2a4 4 0 0 1-4 4H3" />
      </svg>
    );
  },
  [ICONS.SHUFFLE]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...otherProps } = props;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
        {...otherProps}
      >
        <polyline stroke={color} points="16 3 21 3 21 8" />
        <line stroke={color} x1="4" y1="20" x2="21" y2="3" />
        <polyline stroke={color} points="21 16 21 21 16 21" />
        <line stroke={color} x1="15" y1="15" x2="21" y2="21" />
        <line stroke={color} x1="4" y1="4" x2="9" y2="9" />
      </svg>
    );
  },
  [ICONS.LIFE]: buildIcon(
    <g>
      <path d="M12 23.5L12 6.836" />
      <path d="M12,6.836s2-1.291,2-3.228a4.144,4.144,0,0,0-1.69-3,.49.49,0,0,0-.621,0,4.143,4.143,0,0,0-1.689,3C10,5.545,12,6.836,12,6.836Z" />
      <path d="M12,10.455s.9-4.038,6.093-4.038a.5.5,0,0,1,.419.8A7.942,7.942,0,0,1,12,10.455Z" />
      <path d="M12,10.455s-.9-4.038-6.093-4.038a.5.5,0,0,0-.419.8A7.942,7.942,0,0,0,12,10.455Z" />
      <path d="M12,15.455s1.809-4.31,7.6-3.2a.5.5,0,0,1,.262.858A8.855,8.855,0,0,1,12,15.455Z" />
      <path d="M12,15.455s-1.809-4.31-7.6-3.2a.5.5,0,0,0-.262.858A8.855,8.855,0,0,0,12,15.455Z" />
      <path d="M12,19.955s-2.767-3.766-8.139-1.331a.505.505,0,0,0-.054.9A8.853,8.853,0,0,0,12,19.955Z" />
      <path d="M12,19.955s2.767-3.766,8.139-1.331a.505.505,0,0,1,.054.9A8.853,8.853,0,0,1,12,19.955Z" />
    </g>
  ),
  [ICONS.ARTISTS]: (props: IconProps) => (
    <svg {...props} width="20" height="18" viewBox="0 0 20 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.8216 10.8774C11.4066 10.2924 12.0646 9.99995 12.7958 9.99995C13.6001 9.99995 14.4775 10.3655 15.355 11.0967C16.1593 11.901 16.4517 13.2172 16.598 14.387C16.6711 15.5569 17.841 16.5806 17.841 16.5806C17.841 16.5806 16.8173 16.7999 15.5743 16.7999C14.1119 16.7999 12.284 16.5806 11.1872 15.4838C9.57861 13.9483 9.65173 12.0473 10.8216 10.8774Z" />
      <path d="M9.51658 9.42572C8.74672 10.1914 7.49569 10.1914 6.82207 9.42572L1.43305 3.68294C0.855651 3.10866 0.855651 2.15153 1.43305 1.48154C2.01044 0.907264 2.97277 0.811551 3.55016 1.38583L9.32411 6.74576C10.1902 7.51146 10.1902 8.75573 9.51658 9.42572Z" />
    </svg>
  ),
  [ICONS.MYSTERIES]: buildIcon(
    <g>
      <path d="M9.926,14.581c-6.5,0-5.912-5.912-5.912-5.912C11.108,8.669,9.926,14.581,9.926,14.581Z" />
      <path d="M14.074,14.581c6.5,0,5.912-5.912,5.912-5.912C12.892,8.669,14.074,14.581,14.074,14.581Z" />
      <path d="M22.5,10.25c0,6.352-7.5,13-10.5,13S1.5,16.6,1.5,10.25,5.648.75,12,.75,22.5,3.9,22.5,10.25Z" />
    </g>
  ),
  [ICONS.TECHNOLOGY]: buildIcon(
    <g>
      <rect x="0.5" y="13.5" width="23" height="10" rx="2" ry="2" />
      <path d="M3.5,13.5v-1a3,3,0,0,1,3-3H20a3.5,3.5,0,0,0,0-7H13.5A1.5,1.5,0,0,1,12,1V.5" />
      <line x1="4" y1="20.5" x2="5" y2="20.5" />
      <line x1="4" y1="18.5" x2="5" y2="18.5" />
      <line x1="7" y1="18.5" x2="8" y2="18.5" />
      <line x1="10" y1="18.5" x2="11" y2="18.5" />
      <line x1="13" y1="18.5" x2="14" y2="18.5" />
      <line x1="16" y1="18.5" x2="17" y2="18.5" />
      <line x1="19" y1="18.5" x2="20" y2="18.5" />
      <line x1="4" y1="16.5" x2="5" y2="16.5" />
      <line x1="7" y1="16.5" x2="8" y2="16.5" />
      <line x1="10" y1="16.5" x2="11" y2="16.5" />
      <line x1="13" y1="16.5" x2="14" y2="16.5" />
      <line x1="16" y1="16.5" x2="17" y2="16.5" />
      <line x1="19" y1="16.5" x2="20" y2="16.5" />
      <line x1="7" y1="20.5" x2="17" y2="20.5" />
      <line x1="19" y1="20.5" x2="20" y2="20.5" />
    </g>
  ),
  [ICONS.EMOJI]: buildIcon(
    <g>
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="9" x2="15.01" y2="9" />
    </g>
  ),
  [ICONS.STICKER]: buildIcon(
    <g>
      <path d="M7.13,9a.38.38,0,1,1-.38.38A.38.38,0,0,1,7.13,9" />
      <path d="M5.51,15.42A7.34,7.34,0,0,0,12,19.34a7.83,7.83,0,0,0,.92-.06" />
      <path d="M23.24,11.52A11.25,11.25,0,1,0,12,23.25h.5" />
      <path d="M14.45,9.66a2.31,2.31,0,0,1,3.91,0" />
      <line x1="23.24" y1="11.52" x2="12.5" y2="23.24" />
      <path d="M12.5,23.24v-1A10.74,10.74,0,0,1,23.24,11.52" />
    </g>
  ),
  [ICONS.EDUCATION]: (props: CustomProps) => (
    <svg {...props} width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 5.99999L3 12M3 12L4 14H2L3 12ZM16 6.99999V10.85L10.5 14L5 10.85V6.99999M10.4583 1.00317L2.68056 5.77776L10.4583 9.9658L18.2361 5.77776L10.4583 1.00317Z" />
    </svg>
  ),
  [ICONS.POP_CULTURE]: (props: CustomProps) => (
    <svg {...props} width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.26667 8.61538C3.34211 5.52692 2 1 2 1L6.53333 1C6.53333 2.65 7.66667 4.3 9.36667 4.3L9.36667 2.65L9.93333 3.2L11.0667 3.2L11.6333 2.65L11.6333 4.3C13.9 4.3 15.0333 1.55 15.0333 1L19 1C18.5526 2.65 17.6579 7.21923 17.3 8.61538C15.6 8.61538 11.6333 8.7 10.5 12C9.36667 8.7 5.96667 8.61538 4.26667 8.61538Z" />
    </svg>
  ),
  [ICONS.EARLY_ACCESS]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 35 30"
      width={'40'}
      height={'40'}
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <style type="text/css">
        {
          '.early-access--st0{fill:none;stroke:#DCBDA2;stroke-width:1.4173;stroke-miterlimit:10;}.early-access--st1{fill:#DCBEA2;}'
        }
      </style>

      <circle className="early-access--st0" cx="304.9" cy="346.6" r="13.7" />
      <g>
        <ellipse className="early-access--st0" cx="301.2" cy="346.5" rx="3.5" ry="3.8" />
        <line className="early-access--st0" x1="304.7" y1="346.5" x2="312.5" y2="346.5" />
        <line className="early-access--st0" x1="310.3" y1="346.6" x2="310.3" y2="349.3" />
      </g>
      <circle className="early-access--st0" cx="304.9" cy="390.6" r="13.7" />
      <path
        className="early-access--st0"
        d="M316.2,296.7v6.4c0,0.9-0.5,1.8-1.3,2.3l-9,5.2c-0.8,0.5-1.8,0.5-2.6,0l-9-5.2c-0.8-0.5-1.3-1.3-1.3-2.3v-10.4c0-0.9,0.5-1.8,1.3-2.3l9-5.2c0.8-0.5,1.8-0.5,2.6,0l9,5.2"
      />
      <polyline
        className="early-access--st0"
        points="318.7,290.8 304.4,306.8 301.3,301.3 295.8,298.2 301.3,295 304.4,289.5 307.5,295 "
      />
      <polyline className="early-access--st0" points="299,310.2 299,316.4 304.8,313.1 309.9,316.4 309.9,310.2 " />
      <line className="early-access--st0" x1="314.7" y1="380.8" x2="295.1" y2="400.5" />
      <text
        transform="matrix(1 0 0 1 294.7307 394.0567)"
        style={{ fill: '#DCBDA2', fontFamily: 'Roboto-Bold', fontSize: '10.1968px' }}
      >
        ADS
      </text>
      <g id="XMLID_53_">
        <g id="XMLID_493_">
          <path
            id="XMLID_494_"
            className="early-access--st1"
            d="M16,1.6C8,1.6,1.6,8,1.6,16S8,30.4,16,30.4S30.4,24,30.4,16S24,1.6,16,1.6z M16,28.9C8.9,28.9,3.1,23.1,3.1,16S8.9,3.1,16,3.1S28.9,8.9,28.9,16S23.1,28.9,16,28.9z M12.3,11.4c-2.3,0-4.2,2-4.2,4.5s1.9,4.5,4.2,4.5c2.1,0,3.8-1.6,4.1-3.8h4.2v2h1.5v-2h1.4v-1.5h-7.2C16.1,13,14.4,11.4,12.3,11.4z M12.3,18.9c-1.5,0-2.7-1.3-2.7-3s1.2-3,2.7-3c1.5,0,2.7,1.3,2.7,3S13.8,18.9,12.3,18.9z"
          />
        </g>
      </g>
    </svg>
  ),
  [ICONS.MEMBER_BADGE]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 35 30"
      width={'40'}
      height={'40'}
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <style type="text/css">
        {
          '.member-bage--st0{fill:none;stroke:#DCBDA2;stroke-width:1.4173;stroke-miterlimit:10;}.member-bage--st1{fill:#DCBEA2;}'
        }
      </style>
      <circle className="member-bage--st0" cx="304.9" cy="399.4" r="13.7" />
      <g>
        <ellipse className="member-bage--st0" cx="301.2" cy="399.3" rx="3.5" ry="3.8" />
        <line className="member-bage--st0" x1="304.7" y1="399.3" x2="312.5" y2="399.3" />
        <line className="member-bage--st0" x1="310.3" y1="399.3" x2="310.3" y2="402" />
      </g>
      <circle className="member-bage--st0" cx="304.9" cy="443.4" r="13.7" />
      <path
        className="member-bage--st0"
        d="M316.2,349.5v6.4c0,0.9-0.5,1.8-1.3,2.3l-9,5.2c-0.8,0.5-1.8,0.5-2.6,0l-9-5.2c-0.8-0.5-1.3-1.3-1.3-2.3v-10.4
      c0-0.9,0.5-1.8,1.3-2.3l9-5.2c0.8-0.5,1.8-0.5,2.6,0l9,5.2"
      />
      <polyline
        className="member-bage--st0"
        points="318.7,343.5 304.4,359.6 301.3,354 295.8,350.9 301.3,347.8 304.4,342.2 307.5,347.8 "
      />
      <polyline className="member-bage--st0" points="299,363 299,369.1 304.8,365.9 309.9,369.1 309.9,363 " />
      <line className="member-bage--st0" x1="314.7" y1="433.6" x2="295.1" y2="453.2" />
      <text
        transform="matrix(1 0 0 1 294.7307 446.8067)"
        style={{ fill: '#DCBDA2', fontFamily: 'Roboto-Bold', fontSize: '10.1968px' }}
      >
        ADS
      </text>
      <g id="XMLID_187_">
        <g id="XMLID_250_">
          <path
            id="XMLID_251_"
            className="member-bage--st1"
            d="M26.7,19c0,0.7-0.4,1.3-0.9,1.6l-9,5.2c-0.6,0.3-1.3,0.3-1.9,0l-9-5.2C5.3,20.3,5,19.6,5,19
          V8.6c0-0.7,0.4-1.3,0.9-1.6l9-5.2c0.6-0.3,1.3-0.3,1.9,0l9,5.2l0.8-1.3l-9-5.2c-1-0.6-2.3-0.6-3.4,0l-9,5.2
          c-1,0.6-1.7,1.7-1.7,2.9V19c0,1.2,0.6,2.3,1.7,2.9l9,5.2c0.5,0.3,1.1,0.5,1.7,0.5s1.2-0.2,1.7-0.5l9-5.2c1-0.6,1.7-1.7,1.7-2.9
          v-6.4h-1.5V19z M13.1,16.5L8.5,14l4.6-2.6l2.6-4.6l2.5,4.4l1.3-0.7l-3.8-6.7L12,10.3L5.5,14l6.5,3.7l3.5,6.3l15-16.8l-1.1-1
          L15.8,21.3L13.1,16.5z M20.4,29.7L16,27.8l-4.7,2v-4.1H9.8v6.3l6.2-2.5l5.9,2.6v-6.3h-1.5V29.7z"
          />
        </g>
      </g>
    </svg>
  ),
  [ICONS.NO_ADS]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 35 30"
      width={'40'}
      height={'40'}
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <style type="text/css">
        {'.st0--no-ads{fill:none;stroke:#DCBDA2;stroke-width:1.4173;stroke-miterlimit:10;}.st1--no-ads{fill:#DCBEA2;}'}
      </style>
      <circle className="st0--no-ads" cx="304.9" cy="297.6" r="13.7" />
      <g>
        <ellipse className="st0--no-ads" cx="301.2" cy="297.5" rx="3.5" ry="3.8" />
        <line className="st0--no-ads" x1="304.7" y1="297.5" x2="312.5" y2="297.5" />
        <line className="st0--no-ads" x1="310.3" y1="297.6" x2="310.3" y2="300.3" />
      </g>
      <circle className="st0--no-ads" cx="304.9" cy="341.6" r="13.7" />
      <path
        className="st0--no-ads"
        d="M316.2,247.7v6.4c0,0.9-0.5,1.8-1.3,2.3l-9,5.2c-0.8,0.5-1.8,0.5-2.6,0l-9-5.2c-0.8-0.5-1.3-1.3-1.3-2.3v-10.4
      c0-0.9,0.5-1.8,1.3-2.3l9-5.2c0.8-0.5,1.8-0.5,2.6,0l9,5.2"
      />
      <polyline
        className="st0--no-ads"
        points="318.7,241.8 304.4,257.8 301.3,252.3 295.8,249.2 301.3,246 304.4,240.5 307.5,246 "
      />
      <polyline className="st0--no-ads" points="299,261.2 299,267.4 304.8,264.1 309.9,267.4 309.9,261.2 " />
      <line className="st0--no-ads" x1="314.7" y1="331.8" x2="295.1" y2="351.5" />
      <text
        transform="matrix(1 0 0 1 294.7307 345.0567)"
        style={{ fill: '#DCBDA2', fontFamily: 'Roboto-Bold', fontSize: '10.1968px' }}
      >
        ADS
      </text>
      <g id="XMLID_109_">
        <path
          id="XMLID_190_"
          className="st1--no-ads"
          d="M16,1.6C8,1.6,1.6,8,1.6,16S8,30.4,16,30.4S30.4,24,30.4,16S24,1.6,16,1.6z M16,3.1
        c3.3,0,6.3,1.3,8.6,3.3L18,13c-0.2-0.1-0.3-0.3-0.5-0.4c-0.5-0.3-1.1-0.4-1.7-0.4h-2.2v5.3l-1.2,1.2l-2.4-6.4H8.5l-2.7,7.2h1.6
        l0.5-1.5h2.6l0.5,1.5h0.5l-5.2,5.2c-2-2.3-3.3-5.3-3.3-8.6C3.1,8.9,8.9,3.1,16,3.1z M17.6,15.6V16c0,0.7-0.2,1.3-0.5,1.6
        s-0.8,0.6-1.3,0.6H15V18l2.5-2.5C17.6,15.5,17.6,15.6,17.6,15.6z M15,15.9v-2.5h0.7c0.6,0,1,0.2,1.3,0.5L15,15.9z M10.2,16.7H8.3
        L9.2,14L10.2,16.7z M16,28.9c-3.3,0-6.3-1.3-8.6-3.3l6.2-6.2h2.1c0.6,0,1.2-0.1,1.7-0.4c0.5-0.3,0.9-0.7,1.2-1.2
        c0.3-0.5,0.4-1.1,0.4-1.8v-0.3c0-0.5-0.1-0.9-0.3-1.4l6.8-6.8c2,2.3,3.3,5.3,3.3,8.6C28.9,23.1,23.1,28.9,16,28.9z"
        />
        <path
          id="XMLID_195_"
          className="st1--no-ads"
          d="M23.2,15.1c-0.5-0.1-0.8-0.3-1-0.4c-0.2-0.2-0.4-0.4-0.4-0.6c0-0.3,0.1-0.5,0.3-0.6
        c0.2-0.2,0.5-0.2,0.9-0.2c0.4,0,0.7,0.1,0.9,0.3c0.2,0.2,0.3,0.4,0.3,0.8h1.5c0-0.4-0.1-0.8-0.3-1.2s-0.5-0.6-0.9-0.8
        c-0.4-0.2-0.9-0.3-1.4-0.3c-0.5,0-1,0.1-1.4,0.3s-0.7,0.4-1,0.7c-0.2,0.3-0.3,0.7-0.3,1c0,0.8,0.4,1.4,1.2,1.8
        c0.3,0.2,0.7,0.3,1.2,0.5c0.5,0.2,0.9,0.3,1.1,0.5c0.2,0.2,0.3,0.4,0.3,0.6c0,0.3-0.1,0.5-0.3,0.6c-0.2,0.1-0.5,0.2-0.8,0.2
        c-1,0-1.4-0.4-1.4-1.2h-1.5c0,0.5,0.1,0.9,0.4,1.2c0.2,0.4,0.6,0.6,1,0.8s1,0.3,1.5,0.3c0.8,0,1.4-0.2,1.9-0.5s0.7-0.8,0.7-1.5
        c0-0.6-0.2-1-0.6-1.4C24.6,15.7,24,15.4,23.2,15.1z"
        />
      </g>
    </svg>
  ),
  [ICONS.LIVESTREAM_MEMBERSHIP]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 35 30"
      width={'40'}
      height={'40'}
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <style type="text/css">
        {
          '.live-membership--st0{fill:none;stroke:#DCBDA2;stroke-width:1.4173;stroke-miterlimit:10;}.live-membership--st1{fill:#DCBEA2;}.live-membership--st2{fill:#DCBDA2;}'
        }
      </style>
      <circle className="live-membership--st0" cx="121.8" cy="-11.9" r="13.7" />
      <g>
        <ellipse className="live-membership--st0" cx="118.1" cy="-12" rx="3.5" ry="3.8" />
        <line className="live-membership--st0" x1="121.6" y1="-12" x2="129.4" y2="-12" />
        <line className="live-membership--st0" x1="127.2" y1="-11.9" x2="127.2" y2="-9.2" />
      </g>
      <path
        className="live-membership--st0"
        d="M133.1-61.8v6.4c0,0.9-0.5,1.8-1.3,2.3l-9,5.2c-0.8,0.5-1.8,0.5-2.6,0l-9-5.2c-0.8-0.5-1.3-1.3-1.3-2.3v-10.4c0-0.9,0.5-1.8,1.3-2.3l9-5.2c0.8-0.5,1.8-0.5,2.6,0l9,5.2"
      />
      <polyline
        className="live-membership--st0"
        points="135.6,-67.7 121.3,-51.7 118.2,-57.2 112.7,-60.3 118.2,-63.5 121.3,-69 124.4,-63.5 "
      />
      <polyline
        className="live-membership--st0"
        points="115.9,-48.3 115.9,-42.1 121.7,-45.4 126.8,-42.1 126.8,-48.3 "
      />
      <line className="live-membership--st0" x1="131.6" y1="22.3" x2="112" y2="42" />
      <text
        transform="matrix(1 0 0 1 111.5846 35.5336)"
        className="live-membership--st2"
        style={{ fontFamily: 'Roboto-Bold', fontSize: '10.1968px' }}
      >
        ADS
      </text>
      <g id="XMLID_434_">
        <path
          id="XMLID_435_"
          className="live-membership--st1"
          d="M-52.4,22.5h-12.7c-0.8,0-1.4-0.6-1.4-1.4V8.5c0-7.7,6.3-14.1,14.1-14.1c7.7,0,14.1,6.3,14.1,14.1C-38.4,16.2-44.7,22.5-52.4,22.5z M-64.1,20.2h11.7c6.5,0,11.7-5.2,11.7-11.7C-40.7,2-46-3.2-52.4-3.2c-6.5,0-11.7,5.2-11.7,11.7V20.2z"
        />
        <rect id="XMLID_437_" x="-46.9" y="4.4" className="live-membership--st1" width="2.7" height="3.8" />
        <rect id="XMLID_436_" x="-53.8" y="4.4" className="live-membership--st1" width="2.7" height="3.8" />
        <path
          id="XMLID_439_"
          className="live-membership--st1"
          d="M-65,16.6c-4.6,0-8.3-3.7-8.3-8.3s3.7-8.3,8.3-8.3s8.3,3.7,8.3,8.3S-60.4,16.6-65,16.6zM-65,2.7c-3.1,0-5.6,2.5-5.6,5.6s2.5,5.6,5.6,5.6c3.1,0,5.6-2.5,5.6-5.6S-61.9,2.7-65,2.7z"
        />
      </g>
      <image
        style={{
          overflow: 'visible',
          width: '172',
          height: '154',
          xlinkHref: '#SVGID_00000170984886341847456420000000262070696033326467_',
          transform: 'matrix(0.2544 0 0 0.2544 10.7103 -58.8974)',
        }}
      />
      <path className="live-membership--st2" d="M13.9,20.9v-9.7l6.9,4.7L13.9,20.9z M15.1,13.4v5.1l3.7-2.7L15.1,13.4z" />
      <g>
        <path
          className="live-membership--st2"
          d="M29,16c0,5.3-3.2,9.8-7.7,11.9l0.3,1.4c5.2-2.2,8.8-7.3,8.8-13.3c0-6-3.7-11.1-8.9-13.3l-0.3,1.4C25.8,6.1,29,10.7,29,16z"
        />
        <path
          className="live-membership--st2"
          d="M26,16c0-3.9-2.2-7.2-5.4-8.9l-0.3,1.4c2.6,1.5,4.3,4.3,4.3,7.5c0,3.2-1.7,5.9-4.3,7.4l0.3,1.4C23.8,23.2,26,19.9,26,16z"
        />
        <path
          className="live-membership--st2"
          d="M3,16c0-5.3,3.2-9.9,7.8-11.9l-0.3-1.4C5.3,4.9,1.6,10,1.6,16c0,6,3.6,11.1,8.8,13.3l0.3-1.4C6.2,25.8,3,21.3,3,16z"
        />
        <path
          className="live-membership--st2"
          d="M6,16c0,3.9,2.2,7.2,5.4,8.9l0.3-1.4c-2.6-1.5-4.3-4.3-4.3-7.4c0-3.2,1.8-6,4.4-7.5l-0.3-1.4C8.2,8.8,6,12.1,6,16z"
        />
      </g>
    </svg>
  ),
  [ICONS.PLAYLIST_PLAYBACK]: (props: IconProps) => {
    const { size = 50, color = 'currentColor', ...otherProps } = props;

    return (
      <svg
        {...otherProps}
        xmlns="http://www.w3.org/2000/svg"
        viewBox="5 0 30 30"
        width={size}
        height={size === 30 ? 18 : 30}
        fill="none"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path style={{ fill: color }} d="M13.9,20.9v-9.7l6.9,4.7L13.9,20.9z M15.1,13.4v5.1l3.7-2.7L15.1,13.4z" />
        <path
          style={{ fill: color }}
          d="M29,16c0,5.3-3.2,9.8-7.7,11.9l0.3,1.4c5.2-2.2,8.8-7.3,8.8-13.3c0-6-3.7-11.1-8.9-13.3l-0.3,1.4C25.8,6.1,29,10.7,29,16z"
        />
        <path
          style={{ fill: color }}
          d="M26,16c0-3.9-2.2-7.2-5.4-8.9l-0.3,1.4c2.6,1.5,4.3,4.3,4.3,7.5c0,3.2-1.7,5.9-4.3,7.4l0.3,1.4C23.8,23.2,26,19.9,26,16z"
        />
        <path
          style={{ fill: color }}
          d="M3,16c0-5.3,3.2-9.9,7.8-11.9l-0.3-1.4C5.3,4.9,1.6,10,1.6,16c0,6,3.6,11.1,8.8,13.3l0.3-1.4C6.2,25.8,3,21.3,3,16z"
        />
        <path
          style={{ fill: color }}
          d="M6,16c0,3.9,2.2,7.2,5.4,8.9l0.3-1.4c-2.6-1.5-4.3-4.3-4.3-7.4c0-3.2,1.8-6,4.4-7.5l-0.3-1.4C8.2,8.8,6,12.1,6,16z"
        />
      </svg>
    );
  },
  [ICONS.PREMIUM]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 35 30"
      width={props.size || '40'}
      height={props.size || '40'}
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <style type="text/css">
        {'.premium--st0{fill:#898DB3;}'}
        {'.premium--st1{fill:#D8D2E8;}'}
        {'.premium--st2{fill:#CAC2DF;}'}
        {'.premium--st3{opacity:0.27;fill:#74749A;}'}
        {'.premium--st4{fill:none;stroke:#CAC2DF;stroke-width:0;stroke-linecap:round;stroke-linejoin:round;}'}
        {'.premium--st5{fill:#626092;}.premium--st6{opacity:0.2;fill:#FFFFFF;}'}
      </style>

      <path
        id="XMLID_122_"
        className="premium--st0"
        d="M0,12.7v0.8c0,2.3,2,4.2,4.4,4.2h23.2c2.4,0,4.4-1.9,4.4-4.2v-0.8H0z"
      />
      <path
        id="XMLID_20_"
        className="premium--st1"
        d="M1.8,14.4c0.1,0.3,0.3,0.6,0.5,0.8c0.5,0.6,1.2,0.9,2.1,0.9h23.2c0.8,0,1.6-0.4,2.1-0.9
      c0.2-0.2,0.4-0.5,0.5-0.8H1.8z"
      />
      <path
        id="XMLID_27_"
        className="premium--st2"
        d="M2.3,15.2c0.5,0.6,1.2,0.9,2.1,0.9h23.2c0.8,0,1.6-0.4,2.1-0.9H2.3z"
      />
      <rect id="XMLID_28_" x="5.2" y="12.7" className="premium--st3" width="21.7" height="5.1" />
      <path
        id="XMLID_125_"
        className="premium--st0"
        d="M1.4,16.1v0.8c0,2.3,2,4.2,4.4,4.2h20.4c2.4,0,4.4-1.9,4.4-4.2v-0.8H1.4z"
      />
      <path
        id="XMLID_237_"
        className="premium--st1"
        d="M3.2,17.8c0.1,0.3,0.3,0.6,0.5,0.8c0.5,0.6,1.2,0.9,2.1,0.9h20.4c0.8,0,1.6-0.4,2.1-0.9
      c0.2-0.2,0.4-0.5,0.5-0.8H3.2z"
      />
      <path
        id="XMLID_120_"
        className="premium--st2"
        d="M3.7,18.6c0.5,0.6,1.2,0.9,2.1,0.9h20.4c0.8,0,1.6-0.4,2.1-0.9H3.7z"
      />
      <rect id="XMLID_29_" x="5.2" y="16.1" className="premium--st3" width="21.7" height="5.1" />
      <path id="XMLID_75_" className="premium--st4" d="M6.4,14.3" />
      <path id="XMLID_25_" className="premium--st4" d="M2.7,14.3" />
      <path
        id="XMLID_124_"
        className="premium--st0"
        d="M25.1,10.4l-7.9-4.6c-0.7-0.4-1.6-0.4-2.3,0l-7.9,4.6c-0.7,0.4-1.2,1.2-1.2,2v9.1
      c0,0.8,0.4,1.6,1.2,2l7.9,4.6c0.4,0.2,0.8,0.3,1.2,0.3c0.4,0,0.8-0.1,1.2-0.3l7.9-4.6c0.7-0.4,1.2-1.2,1.2-2v-9.1
      C26.2,11.6,25.8,10.8,25.1,10.4z"
      />
      <path
        id="XMLID_123_"
        className="premium--st2"
        d="M16.3,7.3c-0.1-0.1-0.2-0.1-0.3-0.1c-0.1,0-0.2,0-0.3,0.1l-7.9,4.6c-0.2,0.1-0.3,0.3-0.3,0.5
      v9.1c0,0.2,0.1,0.4,0.3,0.5l7.9,4.6c0.2,0.1,0.4,0.1,0.6,0l7.9-4.6c0.2-0.1,0.3-0.3,0.3-0.5v-9.1c0-0.2-0.1-0.4-0.3-0.5L16.3,7.3z"
      />
      <polygon
        id="XMLID_19_"
        className="premium--st5"
        points="20.5,20.1 11.6,20.1 11.2,14.3 14.2,15.8 16,12.4 17.9,15.8 21,14.2 "
      />
      <polygon
        id="XMLID_18_"
        className="premium--st6"
        points="16.1,20.8 21.1,20.8 21.7,13.2 18.1,14.9 16.1,11.3 16.1,7.8 23.9,12.3 23.9,21.6 16.1,25.9 "
      />
      <polygon id="XMLID_17_" className="premium--st6" points="16.1,13.4 16.1,19.6 20.1,19.6 20.5,15.2 17.8,16.8 " />
    </svg>
  ),
  [ICONS.PREMIUM_PLUS]: (props: CustomProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 35 30"
      width={props.size || '40'}
      height={props.size || '40'}
      fill="none"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <style type="text/css">
        {'.premium-plus--st0{fill:#C36017;}'}
        {'.premium-plus--st1{fill:#FAC65D;}'}
        {'.premium-plus--st2{fill:#F9B915;}'}
        {'.premium-plus--st3{opacity:0.3;fill:#955000;}'}
        {'.premium-plus--st4{fill:none;stroke:#CAC2DF;stroke-width:0;stroke-linecap:round;stroke-linejoin:round;}'}
        {'.premium-plus--st5{fill:#C95B16;}'}
        {'.premium-plus--st6{opacity:0.2;fill:#FFFFFF;}'}
      </style>

      <path
        id="XMLID_141_"
        className="premium-plus--st0"
        d="M0,11.7v0.8c0,2.3,2,4.2,4.4,4.2h23.2c2.4,0,4.4-1.9,4.4-4.2v-0.8H0z"
      />
      <path
        id="XMLID_133_"
        className="premium-plus--st1"
        d="M1.8,13.4c0.1,0.3,0.3,0.6,0.5,0.8c0.5,0.6,1.2,0.9,2.1,0.9h23.2c0.8,0,1.6-0.4,2.1-0.9c0.2-0.2,0.4-0.5,0.5-0.8H1.8z"
      />
      <path
        id="XMLID_139_"
        className="premium-plus--st2"
        d="M2.3,14.2c0.5,0.6,1.2,0.9,2.1,0.9h23.2c0.8,0,1.6-0.4,2.1-0.9H2.3z"
      />
      <path
        id="XMLID_136_"
        className="premium-plus--st0"
        d="M1.4,15.1v0.8c0,2.3,2,4.2,4.4,4.2h20.4c2.4,0,4.4-1.9,4.4-4.2v-0.8H1.4z"
      />
      <path
        id="XMLID_131_"
        className="premium-plus--st1"
        d="M3.2,16.8c0.1,0.3,0.3,0.6,0.5,0.8c0.5,0.6,1.2,0.9,2.1,0.9h20.4c0.8,0,1.6-0.4,2.1-0.9c0.2-0.2,0.4-0.5,0.5-0.8H3.2z"
      />
      <path
        id="XMLID_134_"
        className="premium-plus--st2"
        d="M3.7,17.6c0.5,0.6,1.2,0.9,2.1,0.9h20.4c0.8,0,1.6-0.4,2.1-0.9H3.7z"
      />
      <path
        id="XMLID_260_"
        className="premium-plus--st0"
        d="M2.6,18.6v0.8c0,2.3,2,4.2,4.4,4.2h18.2c2.4,0,4.1-1.9,4.1-4.2v-0.8H2.6z"
      />
      <path
        id="XMLID_137_"
        className="premium-plus--st3"
        d="M7.4,23.6h17.4c0.7,0,1.9-1.6,1.9-2.3l0.1-9.6H5.3v9.7C5.3,22.1,6.7,23.6,7.4,23.6z"
      />
      <path
        id="XMLID_257_"
        className="premium-plus--st1"
        d="M4.5,20.3c0.1,0.3,0.3,0.6,0.5,0.8C5.5,21.6,6.2,22,7,22h18.2c0.8,0,1.2-0.4,1.7-0.9c0.2-0.2,0.4-0.5,0.5-0.8H4.5z"
      />
      <path
        id="XMLID_254_"
        className="premium-plus--st2"
        d="M5,21.1C5.5,21.6,6.2,22,7,22h18.2c0.8,0,1.2-0.4,1.7-0.9H5z"
      />
      <path id="XMLID_130_" className="premium-plus--st4" d="M6.4,14.3" />
      <path id="XMLID_129_" className="premium-plus--st4" d="M2.7,14.3" />
      <path
        id="XMLID_128_"
        className="premium-plus--st0"
        d="M25.1,10.4l-7.9-4.6c-0.7-0.4-1.6-0.4-2.3,0l-7.9,4.6c-0.7,0.4-1.2,1.2-1.2,2v9.1c0,0.8,0.4,1.6,1.2,2l7.9,4.6c0.4,0.2,0.8,0.3,1.2,0.3c0.4,0,0.8-0.1,1.2-0.3l7.9-4.6c0.7-0.4,1.2-1.2,1.2-2v-9.1C26.2,11.6,25.8,10.8,25.1,10.4z"
      />
      <path
        id="XMLID_127_"
        className="premium-plus--st2"
        d="M16.3,7.3c-0.1-0.1-0.2-0.1-0.3-0.1c-0.1,0-0.2,0-0.3,0.1l-7.9,4.6c-0.2,0.1-0.3,0.3-0.3,0.5v9.1c0,0.2,0.1,0.4,0.3,0.5l7.9,4.6c0.2,0.1,0.4,0.1,0.6,0l7.9-4.6c0.2-0.1,0.3-0.3,0.3-0.5v-9.1c0-0.2-0.1-0.4-0.3-0.5L16.3,7.3z"
      />
      <polygon
        id="XMLID_126_"
        className="premium-plus--st5"
        points="20.5,20.1 11.6,20.1 11.2,14.3 14.2,15.8 16,12.4 17.9,15.8 21,14.2 "
      />
      <polygon
        id="XMLID_23_"
        className="premium-plus--st6"
        points="16.1,13.4 16.1,19.6 20.1,19.6 20.5,15.2 17.8,16.8 "
      />
    </svg>
  ),
  [ICONS.UPGRADE]: buildIcon(
    <g>
      <path d="m2 6 10-5 10 5M2 6v12l10 5 10-5V6" />
      <circle cx={12} cy={10} r={5.25} />
      <path d="M8.5 14.5 6 17h3l1.5 2.5 1-4h1l1 4L15 17h3l-2-2.5" />
    </g>
  ),
  [ICONS.FEATURED]: (props: IconProps) => (
    <svg {...props} width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 3L13.2627 8.73726L19 11L13.2627 13.2627L11 19L8.73726 13.2627L3 11L8.73726 8.73726L11 3Z" />
    </svg>
  ),
  [ICONS.DISMISS_ALL]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...otherProps } = props;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={color}
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        {...otherProps}
      >
        <path d="M5 13h14v-2H5v2zm-2 4h14v-2H3v2zM7 7v2h14V7H7z" />
      </svg>
    );
  },
  [ICONS.SUBMIT]: buildIcon(<path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z" />),
  [ICONS.FILTERED_BY_LANG]: buildIcon(
    <svg viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg" strokeWidth="1.5">
      <g transform="matrix(5.833333333333333,0,0,5.833333333333333,0,0)">
        <path d="M15.750 16.500 A1.500 1.500 0 1 0 18.750 16.500 A1.500 1.500 0 1 0 15.750 16.500 Z" />
        <path d="M18.524,10.7l.443,1.452a.992.992,0,0,0,1.173.681l1.472-.341a1.339,1.339,0,0,1,1.275,2.218l-1.031,1.111a1,1,0,0,0,0,1.362l1.031,1.111a1.339,1.339,0,0,1-1.275,2.219l-1.472-.342a.993.993,0,0,0-1.173.681L18.524,22.3a1.33,1.33,0,0,1-2.548,0l-.442-1.453a.994.994,0,0,0-1.174-.681l-1.472.342a1.339,1.339,0,0,1-1.274-2.219l1.03-1.111a1,1,0,0,0,0-1.362l-1.03-1.111a1.338,1.338,0,0,1,1.274-2.218l1.472.341a.993.993,0,0,0,1.174-.681l.442-1.452A1.33,1.33,0,0,1,18.524,10.7Z" />
        <path d="M12,23.25A11.25,11.25,0,1,1,23.028,9.767" />
        <path d="M9.289,22.921C7.768,20.689,6.75,16.633,6.75,12S7.768,3.312,9.289,1.079" />
        <path d="M0.775 11.25L9 11.25" />
        <path d="M2.999 5.25L21 5.25" />
        <path d="M2.048 17.25L9 17.25" />
        <path d="M14.711,1.079a15.282,15.282,0,0,1,2.068,5.632" />
      </g>
    </svg>
  ),
  [ICONS.SPORTS]: (props: IconProps) => (
    <svg {...props} width="21" height="20" viewBox="0 0 21 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3.21009 5.08508C6.58582 7.0833 10.5321 12.6392 8.49668 18.4082M17.7408 14.398C13.2297 12.6201 10.8457 6.80095 13.2476 1.69871M19.5 10C19.5 14.9706 15.4706 19 10.5 19C5.52944 19 1.5 14.9706 1.5 10C1.5 5.02944 5.52944 1 10.5 1C15.4706 1 19.5 5.02944 19.5 10Z" />
    </svg>
  ),
  [ICONS.MEMBERSHIP]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...otherProps } = props;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 18 18"
        width={size}
        height={size}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ overflow: 'visible' }}
        {...otherProps}
      >
        <g>
          <path
            d="M6.39174 14.0155C6.39174 14.0155 5.13168 15.2555 3.13167 15.2555C2.63168 13.2555 4.13167 11.7555 4.13167 11.7555M15.2364 9.01455L15.0467 14.5679L12.9771 16.81L11.7008 13.9643M8.93931 2.71749L3.3256 2.84686L1.08356 4.91644L3.92923 6.19269M4.03319 9.81455C4.03319 9.81455 6.10277 4.1232 10.3282 1.96739C13.6912 0.328972 15.9935 1.99345 15.9935 1.99345C15.9935 1.99345 17.6579 4.29567 16.0195 7.65874C13.8637 11.8841 8.17236 13.9537 8.17236 13.9537C7.72425 11.1509 6.813 10.2801 4.03319 9.81455ZM12.8284 5.89949C12.6332 6.09476 12.3166 6.09476 12.1213 5.89949C11.9261 5.70423 11.9261 5.38765 12.1213 5.19239C12.3166 4.99713 12.6332 4.99713 12.8284 5.19239C13.0237 5.38765 13.0237 5.70423 12.8284 5.89949Z"
            stroke={color}
            fill="transparent"
            strokeWidth="1.3"
          />
        </g>
      </svg>
    );
  },
  [ICONS.WATCH_HISTORY]: buildIcon(
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
      <path d="M0.6,11.8c0-6,5-11,11-11 M9.6,7.2v9.5l6.9-4.7L9.6,7.2z M-2.1,9.5l2.9,2.9l3.2-2.7 M11.4,23.2 v-0.9 M5.6,21.5L6,20.6 M2.1,16.4l-0.8,0.4 M17,20.8l0.5,0.8 M20.9,16.7l0.8,0.5 M23.1,11l-0.9,0.1 M21,5.2l-0.7,0.5 M16.2,1.2 L15.8,2" />
    </svg>
  ),
  [ICONS.PLAYLIST]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...otherProps } = props;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 48 48"
        width={size}
        height={size}
        fill={color}
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
        style={{ overflow: 'visible' }}
        {...otherProps}
      >
        <g transform="matrix(3.4285714285714284,0,0,3.4285714285714284,0,0)">
          <rect x="0.5" y="0.5" width="10.5" height="10.5" rx="1" style={{ fill: 'none' }} strokeWidth="1" />
          <path d="M13.5,3.5v9a1,1,0,0,1-1,1h-9" style={{ fill: 'none' }} strokeWidth="1" />
          <path
            d="M3.75,7.64V3.86a.36.36,0,0,1,.55-.31L7.57,5.44a.36.36,0,0,1,0,.62L4.3,8A.36.36,0,0,1,3.75,7.64Z"
            strokeWidth="1"
            style={{ fill: 'none' }}
          />
        </g>
      </svg>
    );
  },
  [ICONS.PLAYLIST_ADD]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...otherProps } = props;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ overflow: 'visible' }}
        {...otherProps}
      >
        <g transform="translate(8, 8),matrix(3.4285714285714284,0,0,3.4285714285714284,0,0)">
          <rect x="0.5" y="0.5" width="10.5" height="10.5" rx="1" />
          <path d="M13.5,3.5v9a1,1,0,0,1-1,1h-9" />
          <line x1="5.75" y1="3" x2="5.75" y2="8.5" />
          <line x1="3" y1="5.75" x2="8.5" y2="5.75" />
        </g>
      </svg>
    );
  },
  [ICONS.PLAYLIST_FILLED]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...otherProps } = props;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width={size}
        height={size}
        fill={color}
        stroke={color}
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ overflow: 'visible' }}
        {...otherProps}
      >
        <g transform="translate(8, 8),matrix(3.4285714285714284,0,0,3.4285714285714284,0,0)">
          <rect x="0.5" y="0.5" width="10.5" height="10.5" rx="1" style={{ fill: color }} />
          <path d="M13.5,3.5v9a1,1,0,0,1-1,1h-9" style={{ fill: 'none' }} />
          <path
            d="M3.75,7.64V3.86a.36.36,0,0,1,.55-.31L7.57,5.44a.36.36,0,0,1,0,.62L4.3,8A.36.36,0,0,1,3.75,7.64Z"
            style={{ stroke: 'var(--color-header-background)', strokeWidth: 1.2 }}
          />
        </g>
      </svg>
    );
  },
  [ICONS.ARRANGE]: (props: IconProps) => {
    const { size = 24, color = 'currentColor', ...otherProps } = props;

    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 14 14"
        width={size}
        height={size}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
        {...otherProps}
      >
        <path
          strokeWidth="1.5"
          d="M0.5 1.42857C0.5 0.915736 0.915736 0.5 1.42857 0.5H12.5714C13.0843 0.5 13.5 0.915736 13.5 1.42857V12.5714C13.5 13.0843 13.0843 13.5 12.5714 13.5H1.42857C0.915736 13.5 0.5 13.0843 0.5 12.5714V1.42857Z"
        />
        <path d="M8.85715 5.14279L7.00001 3.28564L5.14287 5.14279" />
        <path d="M8.85715 8.85742L7.00001 10.7146L5.14287 8.85742" />
        <path d="M7.00002 3.28564V10.7142" />
      </svg>
    );
  },
  [ICONS.COMEDY]: (props: IconProps) => (
    <svg {...props} width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6.00003 12.5C7.54095 14.8536 10.6667 15.7483 13.5 12.5M8.50003 8C7.50003 7 6.00003 7 5.00003 7.99998M14.5 7.99999C13.25 6.99997 12 7.00001 11 8M1 2C5.92105 3.78947 13.0789 3.34211 18 2V4.80013C18 9.80277 16.5622 15.1759 12.4134 17.9713C10.3659 19.3508 8.5887 19.4007 6.26359 17.7683C2.35369 15.0233 1 9.95156 1 5.17427V2Z" />
    </svg>
  ),
  [ICONS.RABBIT_HOLE]: (props: IconProps) => (
    <svg {...props} width="21" height="18" viewBox="0 0 21 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M14.6272 10C17.5216 10.6161 19.5 11.86 19.5 13.2941C19.5 15.3408 15.4706 17 10.5 17C5.52944 17 1.5 15.3408 1.5 13.2941C1.5 11.86 3.47844 10.6161 6.3728 10M9 14H9.1V14.1H9V14ZM12.5 14H12.6V14.1H12.5V14ZM4.46357 15.223C4.21598 13.1765 5.31429 11.4121 6.8128 10.2899C6.61523 9.48345 6.32489 8.41356 5.76025 7.00194C5.3164 5.8923 3.89319 1.21847 4.8725 1.00978C5.85181 0.801087 9.08468 3.98678 9.63833 7.43666C9.73449 8.03585 9.80631 8.56295 9.85647 9.02703C10.0222 9.00872 10.1859 8.99938 10.3467 8.99938C10.674 8.99938 11.0102 9.0254 11.3493 9.07805C11.4045 8.77587 11.4679 8.44781 11.5368 8.09132C11.6445 7.53405 11.7657 6.90722 11.8898 6.2008C12.4419 3.0584 14.1732 1.45353 15.9693 1.4536C16.8571 1.45364 18.1886 1.8975 19.0763 4.11683C19.2982 5.67247 18.538 5.67247 17.654 5.67247C16.77 5.67247 15.7622 5.67247 15.4889 7.2281C15.3482 8.0289 15.2453 8.74461 15.1549 9.37402C15.0775 9.9128 15.0091 10.3884 14.9339 10.8001C15.9323 11.7383 16.6697 13.0557 16.8552 14.7815C16.9496 15.6591 13.0756 16.989 10.3467 16.989C7.61771 16.989 4.58207 16.2026 4.46357 15.223Z" />
    </svg>
  ),
  [ICONS.LIFESTYLE]: (props: IconProps) => (
    <svg {...props} width="19" height="17" viewBox="0 0 19 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 6L3.31818 4.63636M18 6L9.5507 1.02982C9.51941 1.01142 9.48059 1.01142 9.4493 1.02982L5.47368 3.36842M1.98421 16H6.26842C6.32365 16 6.36842 15.9552 6.36842 15.9V9.73636C6.36842 9.68114 6.41319 9.63636 6.46842 9.63636H12.5316C12.5868 9.63636 12.6316 9.68114 12.6316 9.73636V15.9C12.6316 15.9552 12.6764 16 12.7316 16H17.4632M6.36842 12.8182H1.98421M17.4632 12.8182H12.6316M17.4632 9.18182H1.98421M13.5263 6H5.02632M3.31818 4.63636V1.55455C3.31818 1.49932 3.36295 1.45455 3.41818 1.45455H5.37368C5.42891 1.45455 5.47368 1.49932 5.47368 1.55455V3.36842M3.31818 4.63636L5.47368 3.36842M9.94737 3.72727H9.05263" />
    </svg>
  ),
  [ICONS.SPIRITUALITY]: (props: IconProps) => (
    <svg {...props} width="18" height="17" viewBox="0 0 18 17" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9.534 1.01686C5.82724 3.21661 4.60556 8.00479 6.80531 11.7116C9.00506 15.4183 13.7932 16.64 17.5 14.4402" />
      <path d="M17.2232 15.0203C17.2232 10.7099 13.729 7.21571 9.41869 7.21571C5.10835 7.21571 1.61414 10.7099 1.61414 15.0203" />
      <path d="M1.49996 14.6408C5.26677 16.7361 10.0189 15.381 12.1142 11.6142C14.2095 7.84744 12.8544 3.09528 9.08765 1" />
    </svg>
  ),
  [ICONS.HORROR]: (props: IconProps) => (
    <svg {...props} width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15.3317 17.2515C17.5565 15.6129 19 12.975 19 10C19 5.02944 16.5 1 10 1C3.5 1 1 5.02944 1 10C1 12.975 2.44351 15.6129 4.66833 17.2515C4.2654 17.5204 4 17.9792 4 18.5C4 19.3284 4.67157 20 5.5 20H6.7C6.86569 20 7 19.8657 7 19.7V18.3C7 18.1343 7.13431 18 7.3 18H8.7C8.86569 18 9 18.1343 9 18.3V19.7C9 19.8657 9.13431 20 9.3 20H10.7C10.8657 20 11 19.8657 11 19.7V18.3C11 18.1343 11.1343 18 11.3 18H12.7C12.8657 18 13 18.1343 13 18.3V19.7C13 19.8657 13.1343 20 13.3 20H14.5C15.3284 20 16 19.3284 16 18.5C16 17.9792 15.7346 17.5204 15.3317 17.2515Z" />
      <path d="M8 8C8 9.10457 7.10457 10 6 10C4.89543 10 4 9.10457 4 8C4 6.89543 4.89543 6 6 6C7.10457 6 8 6.89543 8 8Z" />
      <path d="M16 8C16 9.10457 15.1046 10 14 10C12.8954 10 12 9.10457 12 8C12 6.89543 12.8954 6 14 6C15.1046 6 16 6.89543 16 8Z" />
      <path d="M9.06674 12.4247C9.3956 11.5703 10.6044 11.5703 10.9333 12.4247L11.2089 13.1408C11.461 13.7958 10.9775 14.5 10.2756 14.5H9.72437C9.02248 14.5 8.53899 13.7958 8.79111 13.1408L9.06674 12.4247Z" />
    </svg>
  ),
  [ICONS.VIEW_TILES]: (props: IconProps) => {
    const { color = 'currentColor' } = props;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="19"
        height="16"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
        fill={color}
      >
        <g>
          <rect x="1" y="1" width="17" height="14" rx="2" ry="2" fill="none" />
          <rect x="3" y="3" width="3" height="2" />
          <rect x="8" y="3" width="3" height="2" />
          <rect x="13" y="3" width="3" height="2" />

          <rect x="3" y="7" width="3" height="2" />
          <rect x="8" y="7" width="3" height="2" />
          <rect x="13" y="7" width="3" height="2" />

          <rect x="3" y="11" width="3" height="2" />
          <rect x="8" y="11" width="3" height="2" />
          <rect x="13" y="11" width="3" height="2" />
        </g>
      </svg>
    );
  },
  [ICONS.VIEW_LIST]: (props: IconProps) => {
    const { color = 'currentColor' } = props;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="19"
        height="16"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke={color}
        fill={color}
      >
        <g>
          <rect x="1" y="1" width="17" height="14" rx="2" ry="2" fill="none" />
          <rect x="3" y="3" width="13" height="2" />
          <rect x="3" y="7" width="13" height="2" />
          <rect x="3" y="11" width="13" height="2" />
        </g>
      </svg>
    );
  },

  // -- Temporary --

  [ICONS.HOLIDAY]: (props: IconProps) => (
    <svg {...props} width="21" height="21" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 7V12.9098C2.5 14.8037 3.57001 16.535 5.26393 17.382L6.901 18.2005C9.27653 19.3883 11.8648 20.091 14.5149 20.2677L15.6846 20.3456C17.1169 20.4411 18.4909 19.7636 19.2872 18.5692C20.6906 16.4641 19.8173 13.6012 17.4778 12.6379L15.3578 11.765C14.2336 11.3021 13.5 10.2066 13.5 8.99092V6.5M16.5 13L14 20M2.5 11.5C4.33333 11.3333 7.8 12.4 7 18M3 7H13C14.1046 7 15 6.10457 15 5V3C15 1.89543 14.1046 1 13 1H3C1.89543 1 1 1.89543 1 3V5C1 6.10457 1.89543 7 3 7Z" />
    </svg>
  ),
};
