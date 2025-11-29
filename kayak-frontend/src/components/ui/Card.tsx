import { forwardRef } from 'react';
import type { HTMLAttributes, MouseEvent } from 'react';
import { motion } from 'framer-motion';
import styles from './Card.module.css';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'bordered' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hover = false,
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    if (hover) {
      return (
        <motion.div
          ref={ref}
          className={`${styles.card} ${styles[variant]} ${styles[`padding-${padding}`]} ${styles.hoverable} ${className}`}
          whileHover={{ y: -4, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)' }}
          transition={{ duration: 0.2 }}
          onClick={onClick as (e: MouseEvent<HTMLDivElement>) => void}
          style={props.style}
        >
          {children}
        </motion.div>
      );
    }

    return (
      <div
        ref={ref}
        className={`${styles.card} ${styles[variant]} ${styles[`padding-${padding}`]} ${className}`}
        onClick={onClick}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

