import { StyleFunctionProps } from "@chakra-ui/theme-tools";
export const avatarStyles = {
  components: {
    Avatar: {
      baseStyle: {

      },
      variants: {
        jobAllocation: (props: StyleFunctionProps) => ({
            container: {
                height: '24px',
                width: '24px',
            }
          
        }),
      },
    },
  },
};
