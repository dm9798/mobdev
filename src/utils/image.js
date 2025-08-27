export const pickBackgroundUri = ({ useGrayscale, colorUri, grayUri }) =>
  useGrayscale && grayUri ? grayUri : colorUri;
