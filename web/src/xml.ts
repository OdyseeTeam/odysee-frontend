import { URL as SITE_URL, SITE_TITLE, FAVICON } from '../../config.js';

const favicon = FAVICON || `${SITE_URL}/public/favicon.png`;

export function getOpenSearchXml() {
  return (
    `<ShortName>${SITE_TITLE}</ShortName>` +
    `<Description>Search ${SITE_TITLE}</Description>` +
    '<InputEncoding>UTF-8</InputEncoding>' +
    `<Image width="32" height="32" type="image/png">${favicon}</Image>` +
    `<Url type="text/html" method="get" template="${SITE_URL}/$/search?q={searchTerms}"/>` +
    `<moz:SearchForm>${SITE_URL}</moz:SearchForm>`
  );
}

export function insertVariableXml(fullXml: string, xmlToInsert: string) {
  return fullXml.replace(/<!-- VARIABLE_XML_BEGIN -->.*<!-- VARIABLE_XML_END -->/s, xmlToInsert);
}
