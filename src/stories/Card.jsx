import React from 'react';
import PropTypes from 'prop-types';
import './card.css';

/** A flexible card component for displaying content in a contained surface */
export const Card = ({
  title,
  description,
  variant = 'default',
  imageSrc = null,
  imageAlt = '',
  footer = null,
}) => {
  const variantClass =
    variant === 'outlined'
      ? 'storybook-card--outlined'
      : variant === 'elevated'
        ? 'storybook-card--elevated'
        : '';

  return (
    <div className={['storybook-card', variantClass].filter(Boolean).join(' ')}>
      {imageSrc && (
        <img src={imageSrc} alt={imageAlt} className="storybook-card__image" />
      )}
      {title && <h2 className="storybook-card__title">{title}</h2>}
      {description && <p className="storybook-card__description">{description}</p>}
      {footer && <div className="storybook-card__footer">{footer}</div>}
    </div>
  );
};

Card.propTypes = {
  /** Card title */
  title: PropTypes.string,
  /** Card description text */
  description: PropTypes.string,
  /** Visual style variant */
  variant: PropTypes.oneOf(['default', 'outlined', 'elevated']),
  /** Optional image URL */
  imageSrc: PropTypes.string,
  /** Alt text for the image */
  imageAlt: PropTypes.string,
  /** Optional footer content (e.g., action buttons) */
  footer: PropTypes.node,
};
