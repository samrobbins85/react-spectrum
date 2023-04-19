
module.exports = {
  core: {
    builder: "storybook-builder-parcel",
  },
  stories: ['../packages/@react-spectrum/{label,picker}/stories/*.stories.{js,jsx,ts,tsx}'],
  // TODO try the below after pulling in stuff from CSF3 conversion
  // stories: ['../packages/**/stories/*.stories.{js,jsx,ts,tsx}'],
  addons: [
    '@storybook/addon-actions',
    '@storybook/addon-a11y',
    '@storybook/addon-controls',
    'storybook-dark-mode',
    './custom-addons/provider/register',
    './custom-addons/descriptions/register',
    './custom-addons/theme/register',
    './custom-addons/strictmode/register',
    './custom-addons/scrolling/register',
    '@storybook/addon-interactions',
  ],
  features: {
    interactionsDebugger: true
  },
  typescript: {
    check: false,
    reactDocgen: false
  }
};
