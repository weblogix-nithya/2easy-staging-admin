import { type ThemeConfig,extendTheme, HTMLChakraProps, ThemingProps } from "@chakra-ui/react";

import { CardComponent } from "./additions/card/card";
import { accordionStyles } from "./components/accordion";
import { avatarStyles } from "./components/avatar";
import { badgeStyles } from "./components/badge";
import { buttonStyles } from "./components/button";
import { dividerStyles } from "./components/divider";
import { inputStyles } from "./components/input";
import { linkStyles } from "./components/link";
import { menuStyles } from "./components/menulist";
import { modalStyles } from "./components/modal";
import { progressStyles } from "./components/progress";
import { radioStyles } from "./components/radio";
import { selectStyles } from "./components/select";
import { sliderStyles } from "./components/slider";
import { switchStyles } from "./components/switch";
import { textareaStyles } from "./components/textarea";
import { tooltipStyles } from "./components/tooltip";
import { globalStyles } from "./styles";


const config: ThemeConfig = {
  initialColorMode: "light", // system, light, dark
  useSystemColorMode: false,
};

const theme = extendTheme(
  config,
  globalStyles,
  accordionStyles,
  avatarStyles, // avatar styles
  badgeStyles, // badge styles
  buttonStyles, // button styles
  CardComponent, // card component
  dividerStyles, // divider styles
  radioStyles, // radio styles
  inputStyles, // input styles
  linkStyles, // link styles
  modalStyles, // Modal styles
  progressStyles, // progress styles
  selectStyles, // select styles (Does not work with chakra-react-select)
  sliderStyles, // slider styles
  switchStyles, // switch styles
  textareaStyles, // textarea styles
  tooltipStyles,
  menuStyles,
);

export default theme;

export interface CustomCardProps extends HTMLChakraProps<"div">, ThemingProps {}
