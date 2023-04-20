/*
 * Copyright 2021 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {Avatar} from '../';
import {Meta, Story} from '@storybook/react';
import React from 'react';
import {SpectrumAvatarProps} from '@react-types/avatar';

const SRC_URL_1 = 'https://mir-s3-cdn-cf.behance.net/project_modules/disp/690bc6105945313.5f84bfc9de488.png';
const SRC_URL_2 = 'https://i.imgur.com/xIe7Wlb.png';

const meta: Meta<SpectrumAvatarProps> = {
  title: 'Avatar',
  component: Avatar
};

export default meta;

const AvatarTemplate: Story<SpectrumAvatarProps> = (args) => (
  <Avatar {...args} />
);

export const Default = AvatarTemplate.bind({});
Default.args = {src: SRC_URL_1};
Default.name = 'default';

export const Disabled = AvatarTemplate.bind({});
Disabled.args = {isDisabled: true, src: SRC_URL_1};
Disabled.name = 'isDisabled';

export const WithAltText = AvatarTemplate.bind({});
WithAltText.args = {alt: 'Pensive', src: SRC_URL_2};
WithAltText.name = 'with alt text';

export const CustomSize = AvatarTemplate.bind({});
CustomSize.args = {...WithAltText.args, size: 'avatar-size-700'};
CustomSize.name = 'with custom size';
