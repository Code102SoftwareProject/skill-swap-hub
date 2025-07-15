import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // User Guide Sidebar
  userGuideSidebar: [
    'user-guide/introduction',
    'user-guide/getting-started',
    {
      type: 'category',
      label: 'Account Management',
      items: [
        'user-guide/account/registration',
      ],
    },
  ],

  // Admin Guide Sidebar
  adminGuideSidebar: [
    'admin-guide/introduction',
    'admin-guide/quick-start',
    {
      type: 'category',
      label: 'System Administration',
      items: [
        'admin-guide/system/hierarchy-system',
        'admin-guide/system/reports-system',
      ],
    },
  ],

  // API Documentation Sidebar
  apiSidebar: [
    'api/introduction',
  ],

  // Developer Guide Sidebar
  developerSidebar: [
    'developer/introduction',
  ],
};

export default sidebars;
