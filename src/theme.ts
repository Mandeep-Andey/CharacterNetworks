import { createTheme, MantineColorsTuple } from '@mantine/core';

const primary: MantineColorsTuple = [
    '#f0f3f5',
    '#dbe4e9',
    '#b0c3d4',
    '#82a1bf',
    '#5c85ad',
    '#4473a2',
    '#366a9c',
    '#285887',
    '#204e78',
    '#154369',
];

const accent: MantineColorsTuple = [
    '#fff0f0',
    '#ffe0e0',
    '#ffc0c0',
    '#ff9f9f',
    '#ff7d7d',
    '#ff6666',
    '#fc4f4f',
    '#e03838',
    '#c82e2e',
    '#b02222',
];

export const theme = createTheme({
    colors: {
        primary,
        accent,
    },
    primaryColor: 'primary',
    primaryShade: 7,
    fontFamily: '"Open Sans", "Helvetica Neue", sans-serif',
    headings: {
        fontFamily: '"Merriweather", "Georgia", serif',
        fontWeight: '700',
    },
    components: {
        Button: {
            defaultProps: {
                color: 'primary',
            },
        },
    },
});
