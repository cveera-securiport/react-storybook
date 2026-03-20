import { Card } from './Card';

export default {
  title: 'Example/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export const Default = {
  args: {
    title: 'Card Title',
    description: 'This is a short description of the card content. It can span multiple lines as needed.',
  },
};

export const Outlined = {
  args: {
    title: 'Outlined Card',
    description: 'A card with a subtle border and no shadow.',
    variant: 'outlined',
  },
};

export const Elevated = {
  args: {
    title: 'Elevated Card',
    description: 'A card with a more prominent shadow to draw attention.',
    variant: 'elevated',
  },
};

export const WithImage = {
  args: {
    title: 'Card with Image',
    description: 'This card displays an image at the top.',
    imageSrc: 'https://placehold.co/360x180',
    imageAlt: 'Placeholder image',
  },
};

export const WithFooter = {
  args: {
    title: 'Card with Footer',
    description: 'This card has action buttons in the footer area.',
    footer: 'Action buttons go here',
  },
};
